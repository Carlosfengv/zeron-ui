import { describe, expect, it } from "vitest";
import { zipSync } from "fflate";
import { crc32, unzipSkillArchive } from "../scripts/safe-skill-zip.mjs";
import { sha256 } from "../scripts/agent-utils.mjs";

const contents = { "swap-to-zeronui/SKILL.md": Buffer.from("swap instructions"), "zeron-page-builder/SKILL.md": Buffer.from("page instructions") };
const files = Object.entries(contents).map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: sha256(bytes) }));
const archive = () => Buffer.from(zipSync(contents));

describe("bounded Skill ZIP verification", () => {
  it("accepts generated regular entries and verifies the standard CRC32 vector", () => {
    const result = unzipSkillArchive(archive(), files);
    for (const [name, bytes] of Object.entries(contents)) expect(Buffer.from(result[name])).toEqual(bytes);
    expect(crc32(Buffer.from("123456789"))).toBe(0xcbf43926);
  });

  it("rejects a symlink entry whose content and listed file hashes otherwise match", () => {
    const entries = { ...contents, "swap-to-zeronui/SKILL.md": [contents["swap-to-zeronui/SKILL.md"], { os: 3, attrs: 0xa1ff0000 }] };
    expect(() => unzipSkillArchive(zipSync(entries), files)).toThrow(/symlinks/);
  });

  it("rejects duplicate central entries instead of accepting unzip's collapsed dictionary", () => {
    const zip = archive();
    const end = zip.length - 22;
    const central = zip.readUInt32LE(end + 16);
    const firstLength = 46 + zip.readUInt16LE(central + 28) + zip.readUInt16LE(central + 30) + zip.readUInt16LE(central + 32);
    const record = zip.subarray(central, central + firstLength);
    const footer = Buffer.from(zip.subarray(end));
    footer.writeUInt32LE(firstLength * 2, 12);
    const duplicate = Buffer.concat([zip.subarray(0, central), record, record, footer]);
    expect(() => unzipSkillArchive(duplicate, files)).toThrow(/Duplicate/);
  });

  it("detects bad CRC values even when local and central headers agree", () => {
    const zip = archive();
    const central = zip.readUInt32LE(zip.length - 6);
    const local = zip.readUInt32LE(central + 42);
    const wrong = (zip.readUInt32LE(central + 16) ^ 1) >>> 0;
    zip.writeUInt32LE(wrong, central + 16);
    zip.writeUInt32LE(wrong, local + 14);
    expect(() => unzipSkillArchive(zip, files)).toThrow(/CRC mismatch/);
  });

  it("rejects local/central name disagreement and encrypted entries before inflate", () => {
    const zip = archive();
    const central = zip.readUInt32LE(zip.length - 6);
    const local = zip.readUInt32LE(central + 42);
    zip[local + 30] ^= 1;
    expect(() => unzipSkillArchive(zip, files)).toThrow(/local header differs/);
    const encrypted = archive();
    encrypted.writeUInt16LE(encrypted.readUInt16LE(central + 8) | 1, central + 8);
    encrypted.writeUInt16LE(encrypted.readUInt16LE(local + 6) | 1, local + 6);
    expect(() => unzipSkillArchive(encrypted, files)).toThrow(/encryption/);
  });

  it("rejects escaping or extra names, truncated archives and excessive extraction budgets", () => {
    expect(() => unzipSkillArchive(zipSync({ ...contents, "../escape.md": Buffer.from("escape") }), files)).toThrow(/file list/);
    expect(() => unzipSkillArchive(archive().subarray(0, -10), files)).toThrow(/Malformed/);
    expect(() => unzipSkillArchive(archive(), [{ ...files[0], bytes: 33 * 1024 * 1024 }, files[1]])).toThrow(/bounded/);
  });
});
