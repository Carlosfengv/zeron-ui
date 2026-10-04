import { unzipSync } from "fflate";

// Validate the ordinary ZIP format produced by skill-archive.mjs before inflate.
// Header layout: PKWARE APPNOTE 4.3.7, 4.3.12 and 4.3.16.
// https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function unzipSkillArchive(input, files) {
  const bytes = Buffer.from(input);
  if (bytes.length > 16 * 1024 * 1024 || files.length > 256 || files.reduce((total, file) => total + file.bytes, 0) > 32 * 1024 * 1024) {
    throw new Error("Skill ZIP exceeds its bounded distribution budget");
  }
  const ensure = (offset, length) => {
    if (!Number.isSafeInteger(offset) || offset < 0 || offset + length > bytes.length) throw new Error("Malformed Skill ZIP bounds");
  };
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
    if (bytes.readUInt32LE(offset) === 0x06054b50 && offset + 22 + bytes.readUInt16LE(offset + 20) === bytes.length) { end = offset; break; }
  }
  if (end === -1) throw new Error("Malformed Skill ZIP end record");
  const count = bytes.readUInt16LE(end + 10);
  const centralBytes = bytes.readUInt32LE(end + 12);
  const centralStart = bytes.readUInt32LE(end + 16);
  if (bytes.readUInt16LE(end + 4) || bytes.readUInt16LE(end + 6) || bytes.readUInt16LE(end + 8) !== count
    || count !== files.length || centralStart + centralBytes !== end) throw new Error("Skill ZIP file list or central directory differs from manifest");
  const expected = new Map(files.map((file) => [file.path, file.bytes]));
  const seen = new Set();
  const records = [];
  let offset = centralStart;
  for (let index = 0; index < count; index++) {
    ensure(offset, 46);
    if (bytes.readUInt32LE(offset) !== 0x02014b50) throw new Error("Malformed Skill ZIP central header");
    const flags = bytes.readUInt16LE(offset + 8);
    const compression = bytes.readUInt16LE(offset + 10);
    const checksum = bytes.readUInt32LE(offset + 16);
    const compressed = bytes.readUInt32LE(offset + 20);
    const size = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const attributes = bytes.readUInt32LE(offset + 38);
    const local = bytes.readUInt32LE(offset + 42);
    const length = 46 + nameLength + extraLength + commentLength;
    ensure(offset, length);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    if (seen.has(name)) throw new Error(`Duplicate Skill ZIP entry: ${name}`);
    seen.add(name);
    const type = (attributes >>> 16) & 0xf000;
    if ((type !== 0 && type !== 0x8000) || (attributes & 0x10)) throw new Error(`Skill ZIP symlinks/directories/special entries are forbidden: ${name}`);
    if (!expected.has(name) || expected.get(name) !== size) throw new Error(`Skill ZIP file list/size differs from manifest: ${name}`);
    if (flags & ~0x0806 || ![0, 8].includes(compression) || compressed === 0xffffffff || bytes.readUInt16LE(offset + 34)) {
      throw new Error("Unsupported Skill ZIP encryption, descriptor, compression or split archive");
    }
    ensure(local, 30);
    const localNameLength = bytes.readUInt16LE(local + 26);
    const localExtraLength = bytes.readUInt16LE(local + 28);
    const start = local + 30 + localNameLength + localExtraLength;
    ensure(local, 30 + localNameLength + localExtraLength);
    if (bytes.readUInt32LE(local) !== 0x04034b50 || bytes.readUInt16LE(local + 6) !== flags || bytes.readUInt16LE(local + 8) !== compression
      || bytes.readUInt32LE(local + 14) !== checksum || bytes.readUInt32LE(local + 18) !== compressed || bytes.readUInt32LE(local + 22) !== size
      || bytes.subarray(local + 30, local + 30 + localNameLength).toString("utf8") !== name || start + compressed > centralStart) {
      throw new Error(`Skill ZIP local header differs from central entry: ${name}`);
    }
    records.push({ name, local, end: start + compressed, checksum });
    offset += length;
  }
  if (offset !== end) throw new Error("Malformed Skill ZIP central directory length");
  const ordered = [...records].sort((a, b) => a.local - b.local);
  let previousEnd = 0;
  for (const record of ordered) {
    if (record.local !== previousEnd) throw new Error("Skill ZIP contains overlapping, hidden or prefixed entries");
    previousEnd = record.end;
  }
  if (previousEnd !== centralStart) throw new Error("Skill ZIP contains undeclared trailing local data");
  const result = unzipSync(bytes, { filter: (file) => {
    if (expected.get(file.name) !== file.originalSize) throw new Error(`Skill ZIP inflate size differs from manifest: ${file.name}`);
    return true;
  } });
  for (const record of records) if (crc32(result[record.name]) !== record.checksum) throw new Error(`Skill ZIP CRC mismatch: ${record.name}`);
  return result;
}
