import { describe, expect, it } from "vitest";
import { deflateSync, Zip, ZipDeflate, ZipPassThrough } from "fflate";
import { unzipCiArchive } from "../scripts/safe-ci-zip.mjs";
import { crc32 } from "../scripts/safe-skill-zip.mjs";

// Ordinary ZIP format fixtures, not downloaded Actions artifacts or evidence of actual CI execution.
function fixtureZip(entries, { streamed = true, signed = true, extra = Buffer.alloc(0) } = {}) {
  const locals = [], centrals = []; let position = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name), content = entry.bytes ?? Buffer.from("fixture bytes"), method = entry.method ?? 8;
    const payload = method === 8 ? Buffer.from(deflateSync(content)) : content;
    const size = entry.declaredSize ?? content.length, checksum = crc32(content), flags = streamed ? 8 : 0;
    const local = Buffer.alloc(30), central = Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(flags, 6); local.writeUInt16LE(method, 8);
    if (!streamed) { local.writeUInt32LE(checksum, 14); local.writeUInt32LE(payload.length, 18); local.writeUInt32LE(size, 22); }
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(extra.length, 28);
    central.writeUInt32LE(0x02014b50); central.writeUInt16LE((3 << 8) | 20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(flags, 8); central.writeUInt16LE(method, 10); central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(payload.length, 20); central.writeUInt32LE(size, 24); central.writeUInt16LE(name.length, 28); central.writeUInt16LE(extra.length, 30);
    central.writeUInt32LE(((entry.mode ?? (entry.name.endsWith("/") ? 0o40755 : 0o100644)) << 16) >>> 0, 38); central.writeUInt32LE(position, 42);
    const descriptor = streamed ? Buffer.alloc(signed ? 16 : 12) : Buffer.alloc(0);
    let start = 0;
    if (streamed && signed) { descriptor.writeUInt32LE(0x08074b50); start = 4; }
    if (streamed) { descriptor.writeUInt32LE(checksum, start); descriptor.writeUInt32LE(payload.length, start + 4); descriptor.writeUInt32LE(size, start + 8); }
    const complete = Buffer.concat([local, name, extra, payload, descriptor]);
    locals.push(complete); centrals.push(Buffer.concat([central, name, extra])); position += complete.length;
  }
  const central = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(central.length, 12); end.writeUInt32LE(position, 16);
  return Buffer.concat([...locals, central, end]);
}
function first(zip) {
  const central = zip.readUInt32LE(zip.length - 6), local = zip.readUInt32LE(central + 42);
  const payload = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
  return { central, local, payload, descriptor: payload + zip.readUInt32LE(central + 20) };
}

describe("bounded Actions-compatible archive parsing", () => {
  it("accepts a caller's stricter budgets and fixed entry set without changing CI defaults", () => {
    const archive = fixtureZip([{ name: "review.json", bytes: Buffer.from("{}\n") }]);
    expect(unzipCiArchive(archive, { maxInputBytes: archive.length, maxEntries: 1, maxFileBytes: 3, maxDecodedBytes: 3,
      allowedEntry: name => name === "review.json" }).get("review.json").toString()).toBe("{}\n");
    expect(unzipCiArchive(archive).size).toBe(1);
  });
  it.each([null, [], { maxEntries: 1025 }, { maxFileBytes: 32 * 1024 * 1024 + 1 }, { maxDecodedBytes: 256 * 1024 * 1024 + 1 },
    { maxInputBytes: 128 * 1024 * 1024 + 1 }, { maxEntries: 0 }, { maxEntries: 1.5 }, { allowedEntry: true }, { skip: true }])("rejects widening or invalid archive options %j", options => {
    expect(() => unzipCiArchive(fixtureZip([{ name: "entry" }]), options)).toThrow("ZIP_BUDGET_CONFIG");
  });
  it("applies stricter compressed, entry, single-file and decoded limits before decompression", () => {
    const archive = fixtureZip([{ name: "a", bytes: Buffer.from("aaa") }, { name: "b", bytes: Buffer.from("bbb") }]);
    expect(() => unzipCiArchive(archive, { maxInputBytes: archive.length - 1 })).toThrow("ZIP_INPUT_BUDGET");
    expect(() => unzipCiArchive(archive, { maxEntries: 1 })).toThrow("ZIP_DIRECTORY");
    expect(() => unzipCiArchive(archive, { maxFileBytes: 2 })).toThrow("ZIP_ENTRY_BUDGET");
    expect(() => unzipCiArchive(archive, { maxDecodedBytes: 5 })).toThrow("ZIP_DECODED_BUDGET");
  });
  it("checks directories as well as files against the fixed entry predicate", () => {
    for (const entry of [{ name: "extra.json" }, { name: "extra/", bytes: Buffer.alloc(0) }]) {
      expect(() => unzipCiArchive(fixtureZip([entry]), { allowedEntry: name => name === "review.json" })).toThrow("ZIP_ENTRY_PATH");
    }
  });
  it.each([{ streamed: true, signed: true }, { streamed: true, signed: false }, { streamed: false }])("accepts regular files, empty directories and bounded descriptors: %j", options => {
    const archive = fixtureZip([{ name: "private-logs/", bytes: Buffer.alloc(0), method: 0 },
      { name: "execution-index.json", bytes: Buffer.from("index fixture") }, { name: "private-logs/run.json", bytes: Buffer.from("log fixture"), method: 0 }], options);
    expect([...unzipCiArchive(archive)]).toEqual([["execution-index.json", Buffer.from("index fixture")], ["private-logs/run.json", Buffer.from("log fixture")]]);
  });
  it("reads an independently generated fflate streaming ZIP", () => {
    const chunks = [], zip = new Zip((error, chunk) => { if (error) throw error; chunks.push(Buffer.from(chunk)); });
    const directory = new ZipPassThrough("private-logs/"); zip.add(directory); directory.push(new Uint8Array(), true);
    const log = new ZipDeflate("private-logs/run.json"); zip.add(log);
    log.push(Buffer.from("first "), false); log.push(Buffer.from("second"), true); zip.end();
    const archive = Buffer.concat(chunks);
    expect(archive.readUInt16LE(first(archive).central + 8) & 8).toBe(8);
    expect(unzipCiArchive(archive).get("private-logs/run.json").toString()).toBe("first second");
  });
  it.each(["../escape", "/absolute", "a//b", "a/./b", "a/../b", "a\\b", "a\0b", "a/é"])("rejects unsafe archive path %s", name => {
    expect(() => unzipCiArchive(fixtureZip([{ name }]))).toThrow(/ZIP_PATH/);
  });
  it("rejects duplicate paths, directory/file aliases and impossible file trees", () => {
    for (const names of [["same", "same"], ["logs/", "logs"], ["logs", "logs/run.json"]]) {
      expect(() => unzipCiArchive(fixtureZip(names.map(name => ({ name, ...(name.endsWith("/") ? { bytes: Buffer.alloc(0) } : {}) }))))).toThrow(/ZIP_DUPLICATE_PATH|ZIP_PATH_COLLISION/);
    }
  });
  it.each([0o120777, 0o20644, 0o10644])("rejects symlinks and special entry mode %s", mode => {
    expect(() => unzipCiArchive(fixtureZip([{ name: "entry", mode }]))).toThrow(/ZIP_ENTRY_TYPE/);
  });
  it("rejects encryption, unsupported compression, split archives and ZIP64", () => {
    const original = fixtureZip([{ name: "entry" }]), { central } = first(original);
    for (const change of [zip => zip.writeUInt16LE(9, central + 8), zip => zip.writeUInt16LE(99, central + 10),
      zip => zip.writeUInt16LE(1, central + 34), zip => zip.writeUInt16LE(45, central + 6)]) {
      const zip = Buffer.from(original); change(zip); expect(() => unzipCiArchive(zip)).toThrow(/ZIP_FORMAT_UNSUPPORTED/);
    }
    expect(() => unzipCiArchive(fixtureZip([{ name: "entry" }], { extra: Buffer.from([1, 0, 0, 0]) }))).toThrow(/ZIP64_UNSUPPORTED/);
  });
  it("checks central/local names and sizes, descriptors and final CRC", () => {
    const original = fixtureZip([{ name: "entry" }]), { central, payload, descriptor } = first(original);
    const name = Buffer.from(original); name[30] ^= 1;
    expect(() => unzipCiArchive(name)).toThrow(/ZIP_LOCAL_HEADER/);
    const size = Buffer.from(original); size.writeUInt32LE(1, 22);
    expect(() => unzipCiArchive(size)).toThrow(/ZIP_LOCAL_SIZES/);
    const mismatchedDescriptor = Buffer.from(original); mismatchedDescriptor[descriptor + 8] ^= 1;
    expect(() => unzipCiArchive(mismatchedDescriptor)).toThrow(/ZIP_DESCRIPTOR/);
    const checksum = Buffer.from(original); checksum.writeUInt32LE(1, central + 16); checksum.writeUInt32LE(1, descriptor + 4);
    expect(() => unzipCiArchive(checksum)).toThrow(/ZIP_CRC_OR_SIZE/);
    const damagedPayload = Buffer.from(original); damagedPayload[payload] ^= 0xff;
    expect(() => unzipCiArchive(damagedPayload)).toThrow();
  });
  it("rejects prefixed hidden data, overlapping local records and truncated ZIPs", () => {
    const original = fixtureZip([{ name: "entry" }]);
    const prefixed = Buffer.concat([Buffer.from("hidden"), original]), { central } = first(original);
    prefixed.writeUInt32LE(central + 6, prefixed.length - 6); prefixed.writeUInt32LE(6, central + 6 + 42);
    expect(() => unzipCiArchive(prefixed)).toThrow(/ZIP_HIDDEN_OR_OVERLAPPING_DATA/);
    const overlap = fixtureZip([{ name: "a" }, { name: "b" }]); const firstCentral = first(overlap).central;
    const secondCentral = firstCentral + 46 + overlap.readUInt16LE(firstCentral + 28);
    overlap.writeUInt32LE(0, secondCentral + 42);
    expect(() => unzipCiArchive(overlap)).toThrow(/ZIP_LOCAL_HEADER|ZIP_HIDDEN_OR_OVERLAPPING_DATA/);
    expect(() => unzipCiArchive(original.subarray(0, -1))).toThrow(/ZIP_END/);
    expect(() => unzipCiArchive(Buffer.alloc(0))).toThrow(/ZIP_END/);
  });
  it("enforces declared aggregate/file budgets before inflate and actual decoded size during inflate", () => {
    expect(() => unzipCiArchive(fixtureZip([{ name: "large", declaredSize: 32 * 1024 * 1024 + 1 }]))).toThrow(/ZIP_ENTRY_BUDGET/);
    expect(() => unzipCiArchive(fixtureZip(Array.from({ length: 9 }, (_, i) => ({ name: `entry-${i}`, declaredSize: 32 * 1024 * 1024 }))))).toThrow(/ZIP_DECODED_BUDGET/);
    expect(() => unzipCiArchive(fixtureZip([{ name: "bomb", bytes: Buffer.alloc(1024 * 1024), declaredSize: 1 }]))).toThrow(/ZIP_INFLATE_BUDGET/);
    expect(() => unzipCiArchive(fixtureZip([{ name: "short", bytes: Buffer.from("short"), declaredSize: 10 }]))).toThrow(/ZIP_INFLATE_SIZE/);
    expect(() => unzipCiArchive(new Uint8Array(22))).toThrow(/ZIP_INPUT_BUDGET/);
  });
});
