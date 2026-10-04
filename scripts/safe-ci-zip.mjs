import { Inflate } from "fflate";
import { crc32 } from "./safe-skill-zip.mjs";
import { executionPathSchema } from "./agent-execution-index.mjs";

// Actions uploads stream files and can use ordinary ZIP data descriptors.
// Unlike Skill ZIPs, this reader accepts directories/descriptors but never extracts to disk.
// Format: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
export class CiArchiveError extends Error {
  constructor(code) { super(`CI archive rejected: ${code}`); this.code = code; }
}
const fail = code => { throw new CiArchiveError(code); };
export function unzipCiArchive(input, options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)) fail("ZIP_BUDGET_CONFIG");
  const { maxInputBytes = 128 * 1024 * 1024, maxEntries = 1024, maxFileBytes = 32 * 1024 * 1024,
    maxDecodedBytes = 256 * 1024 * 1024, allowedEntry } = options;
  if (Object.keys(options).some(key => !["maxInputBytes", "maxEntries", "maxFileBytes", "maxDecodedBytes", "allowedEntry"].includes(key))
    || [[maxInputBytes, 128 * 1024 * 1024], [maxEntries, 1024], [maxFileBytes, 32 * 1024 * 1024], [maxDecodedBytes, 256 * 1024 * 1024]]
      .some(([value, ceiling]) => !Number.isSafeInteger(value) || value < 1 || value > ceiling)
    || (allowedEntry !== undefined && typeof allowedEntry !== "function")) fail("ZIP_BUDGET_CONFIG");
  if (!Buffer.isBuffer(input) || input.length > maxInputBytes) fail("ZIP_INPUT_BUDGET");
  const bytes = input;
  const ensure = (offset, length, end = bytes.length) => {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > end) fail("ZIP_BOUNDS");
  };
  const extraFields = (start, length) => {
    ensure(start, length);
    const end = start + length;
    while (start < end) {
      ensure(start, 4, end);
      const kind = bytes.readUInt16LE(start), size = bytes.readUInt16LE(start + 2);
      ensure(start + 4, size, end);
      if (kind === 1) fail("ZIP64_UNSUPPORTED");
      start += size + 4;
    }
  };
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
    if (bytes.readUInt32LE(offset) === 0x06054b50 && offset + 22 + bytes.readUInt16LE(offset + 20) === bytes.length) { end = offset; break; }
  }
  if (end < 0) fail("ZIP_END");
  const count = bytes.readUInt16LE(end + 10), centralSize = bytes.readUInt32LE(end + 12), centralStart = bytes.readUInt32LE(end + 16);
  if (!count || count > maxEntries || count === 65535 || bytes.readUInt16LE(end + 4) || bytes.readUInt16LE(end + 6)
    || bytes.readUInt16LE(end + 8) !== count || centralStart + centralSize !== end) fail("ZIP_DIRECTORY");
  const records = [], names = new Set(); let offset = centralStart, total = 0;
  for (let i = 0; i < count; i++) {
    ensure(offset, 46, end);
    if (bytes.readUInt32LE(offset) !== 0x02014b50) fail("ZIP_CENTRAL_HEADER");
    const needed = bytes.readUInt16LE(offset + 6), flags = bytes.readUInt16LE(offset + 8), method = bytes.readUInt16LE(offset + 10);
    const checksum = bytes.readUInt32LE(offset + 16), compressed = bytes.readUInt32LE(offset + 20), size = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28), extraLength = bytes.readUInt16LE(offset + 30), commentLength = bytes.readUInt16LE(offset + 32);
    const attributes = bytes.readUInt32LE(offset + 38), local = bytes.readUInt32LE(offset + 42), length = 46 + nameLength + extraLength + commentLength;
    ensure(offset, length, end);
    const rawName = bytes.subarray(offset + 46, offset + 46 + nameLength), name = rawName.toString("ascii"), directory = name.endsWith("/");
    if (!rawName.equals(Buffer.from(name, "ascii")) || rawName.some(byte => byte > 127)
      || !executionPathSchema.safeParse(directory ? name.slice(0, -1) : name).success || nameLength > 256) fail("ZIP_PATH");
    if (names.has(name) || names.has(directory ? name.slice(0, -1) : `${name}/`)) fail("ZIP_DUPLICATE_PATH");
    if (allowedEntry && allowedEntry(name, directory) !== true) fail("ZIP_ENTRY_PATH");
    names.add(name);
    const type = (attributes >>> 16) & 0xf000;
    if (directory ? ![0, 0x4000].includes(type) : ![0, 0x8000].includes(type) || (attributes & 0x10)) fail("ZIP_ENTRY_TYPE");
    if (needed > 20 || flags & ~0x080e || ![0, 8].includes(method) || (method === 0 && flags & 6)
      || bytes.readUInt16LE(offset + 34) || compressed === 0xffffffff || size === 0xffffffff || local === 0xffffffff) fail("ZIP_FORMAT_UNSUPPORTED");
    if (size > maxFileBytes || (directory && size !== 0) || (method === 0 && compressed !== size)) fail("ZIP_ENTRY_BUDGET");
    total += size;
    if (total > maxDecodedBytes) fail("ZIP_DECODED_BUDGET");
    extraFields(offset + 46 + nameLength, extraLength);
    ensure(local, 30, centralStart);
    const localNameLength = bytes.readUInt16LE(local + 26), localExtraLength = bytes.readUInt16LE(local + 28);
    const start = local + 30 + localNameLength + localExtraLength;
    ensure(local, 30 + localNameLength + localExtraLength, centralStart); ensure(start, compressed, centralStart);
    if (bytes.readUInt32LE(local) !== 0x04034b50 || bytes.readUInt16LE(local + 4) !== needed
      || bytes.readUInt16LE(local + 6) !== flags || bytes.readUInt16LE(local + 8) !== method
      || !rawName.equals(bytes.subarray(local + 30, local + 30 + localNameLength))) fail("ZIP_LOCAL_HEADER");
    extraFields(local + 30 + localNameLength, localExtraLength);
    const values = [checksum, compressed, size], locals = [14, 18, 22].map(position => bytes.readUInt32LE(local + position));
    if (locals.some((value, j) => flags & 8 ? value !== 0 && value !== values[j] : value !== values[j])) fail("ZIP_LOCAL_SIZES");
    let finish = start + compressed;
    if (flags & 8) {
      ensure(finish, 12, centralStart);
      if (finish + 16 <= centralStart && bytes.readUInt32LE(finish) === 0x08074b50
        && values.every((value, j) => bytes.readUInt32LE(finish + 4 + j * 4) === value)) finish += 16;
      else if (values.every((value, j) => bytes.readUInt32LE(finish + j * 4) === value)) finish += 12;
      else fail("ZIP_DESCRIPTOR");
    }
    records.push({ name, directory, local, start, finish, compressed, size, method, checksum }); offset += length;
  }
  if (offset !== end) fail("ZIP_CENTRAL_LENGTH");
  let previous = 0;
  for (const record of [...records].sort((a, b) => a.local - b.local)) {
    if (record.local !== previous) fail("ZIP_HIDDEN_OR_OVERLAPPING_DATA");
    previous = record.finish;
  }
  if (previous !== centralStart) fail("ZIP_HIDDEN_OR_OVERLAPPING_DATA");
  const result = new Map();
  for (const record of records) {
    const compressed = bytes.subarray(record.start, record.start + record.compressed);
    let decoded;
    if (record.method === 0) decoded = Buffer.from(compressed);
    else {
      const chunks = []; let size = 0, finished = false;
      try {
        const inflate = new Inflate((chunk, final) => {
          size += chunk.length;
          if (size > record.size) fail("ZIP_INFLATE_BUDGET");
          chunks.push(Buffer.from(chunk)); finished = final;
        });
        for (let i = 0; i < compressed.length; i += 4096) inflate.push(compressed.subarray(i, i + 4096), i + 4096 >= compressed.length);
        if (!finished || size !== record.size) fail("ZIP_INFLATE_SIZE");
        decoded = Buffer.concat(chunks);
      } catch (error) { if (error instanceof CiArchiveError) throw error; fail("ZIP_INFLATE_FORMAT"); }
    }
    if (decoded.length !== record.size || crc32(decoded) !== record.checksum) fail("ZIP_CRC_OR_SIZE");
    if (!record.directory) result.set(record.name, decoded);
  }
  // Directory aliases such as a regular file "logs" beside "logs/run.json" cannot form a real archive tree.
  for (const name of result.keys()) {
    const parts = name.split("/");
    for (let i = 1; i < parts.length; i++) if (result.has(parts.slice(0, i).join("/"))) fail("ZIP_PATH_COLLISION");
  }
  return result;
}
