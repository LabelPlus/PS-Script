// Build the release archive and notes. Creates no commits or tags.
// Usage:
//   node scripts/release.mjs [tag]         build; tag (1.8.2 or v1.8.2) must match CHANGELOG.md
//   node scripts/release.mjs --print-version
// The version comes only from CHANGELOG.md: the first section below [Unreleased].
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { BUILD, JSX_OUTPUT, ROOT, TEMPLATES_OUTPUT, build } from './build.mjs';

const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const SECTION = /^## \[([^\]]+)\][^\n]*$/gm;

class ReleaseError extends Error {}

export function changelogRelease(changelog) {
  const sections = [...changelog.matchAll(SECTION)].map((m, i, all) => ({
    name: m[1],
    start: m.index,
    bodyStart: m.index + m[0].length,
    end: all[i + 1]?.index ?? changelog.length,
  }));
  const names = sections.map((s) => s.name);
  const duplicates = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))].sort();
  if (duplicates.length) throw new ReleaseError(`CHANGELOG.md has duplicate sections: ${duplicates.join(', ')}`);

  const hasEntries = (s) => changelog.slice(s.bodyStart, s.end).split('\n')
    .some((line) => line.trim() && !line.startsWith('#'));
  if (sections.some((s) => s.name === 'Unreleased' && hasEntries(s))) {
    throw new ReleaseError('[Unreleased] has entries; move them into a version section first');
  }
  const release = sections.find((s) => s.name !== 'Unreleased');
  if (!release) throw new ReleaseError('CHANGELOG.md has no released section');
  if (!SEMVER.test(release.name)) {
    throw new ReleaseError(`newest CHANGELOG section [${release.name}] is not a version like 1.8.2`);
  }
  if (!hasEntries(release)) throw new ReleaseError(`CHANGELOG section [${release.name}] is empty`);
  return { version: release.name, notes: changelog.slice(release.start, release.end).trim() };
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Minimal ZIP writer (deflate, UTF-8 names). entries: [{ name, data }].
function writeZip(file, entries, date = new Date()) {
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    // Fields shared by the local header and the central directory entry.
    const common = Buffer.alloc(24);
    common.writeUInt16LE(20, 0);      // version needed: 2.0
    common.writeUInt16LE(0x0800, 2);  // flag: names are UTF-8
    common.writeUInt16LE(8, 4);       // method: deflate
    common.writeUInt16LE(dosTime, 6);
    common.writeUInt16LE(dosDate, 8);
    common.writeUInt32LE(crc32(data), 10);
    common.writeUInt32LE(compressed.length, 14);
    common.writeUInt32LE(data.length, 18);
    common.writeUInt16LE(nameBuf.length, 22);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    common.copy(local, 4);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);         // version made by
    common.copy(dir, 6);
    dir.writeUInt32LE(offset, 42);
    parts.push(local, nameBuf, compressed);
    central.push(dir, nameBuf);
    offset += local.length + nameBuf.length + compressed.length;
  }
  const centralSize = central.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  fs.writeFileSync(file, Buffer.concat([...parts, ...central, end]));
}

function listFiles(dir, prefix) {
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((e) => e.isDirectory()
      ? listFiles(path.join(dir, e.name), `${prefix}${e.name}/`)
      : [{ name: prefix + e.name, file: path.join(dir, e.name) }]);
}

function release(version, notes, changelog) {
  build({ version });
  fs.writeFileSync(path.join(BUILD, 'release-notes.md'), notes + '\n', 'utf8');

  const templates = listFiles(TEMPLATES_OUTPUT, 'ps_script_res/');
  if (!templates.length) throw new Error('no document templates were built');
  const entries = [
    { name: 'LabelPlus_Ps_Script.jsx', file: JSX_OUTPUT },
    { name: 'psd-to-labelplus-text.jsx', file: path.join(ROOT, 'psd-to-labelplus-text.jsx') },
    { name: 'LICENSE.txt', file: path.join(ROOT, 'LICENSE.txt') },
    { name: 'README.md', file: path.join(ROOT, 'README.md') },
    { name: 'CHANGELOG.md', data: Buffer.from(changelog, 'utf8') },
    ...templates,
  ].map((e) => ({ name: e.name, data: e.data ?? fs.readFileSync(e.file) }));
  const archive = path.join(BUILD, `LabelPlus_PS-Script_${version}.zip`);
  writeZip(archive, entries);
  console.log(`Release archive: ${path.relative(ROOT, archive)}`);
}

function main() {
  const args = process.argv.slice(2);
  const printVersion = args.includes('--print-version');
  const tag = args.find((a) => !a.startsWith('--'));
  const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
  const { version, notes } = changelogRelease(changelog);
  if (tag !== undefined && tag.replace(/^v/, '') !== version) {
    throw new ReleaseError(`tag ${tag} does not match newest CHANGELOG section [${version}]`);
  }
  if (printVersion) {
    console.log(version);
    return;
  }
  release(version, notes, changelog);
}

try {
  main();
} catch (e) {
  console.error(`error: ${e.message}`);
  process.exit(1);
}
