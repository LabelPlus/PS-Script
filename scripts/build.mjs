// Build build/LabelPlus_Ps_Script.jsx and build/ps_script_res/.
// Usage: node scripts/build.mjs [--version 1.8.2]
// Only needs Node.js and the packages from `npm ci`.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BUILD = path.join(ROOT, 'build');
export const JSX_OUTPUT = path.join(BUILD, 'LabelPlus_Ps_Script.jsx');
export const TEMPLATES_OUTPUT = path.join(BUILD, 'ps_script_res');
const TSC_OUTPUT = path.join(BUILD, 'app.js');
const VERSION_DECL = /(LabelPlus\.VERSION = )"[^"]*"/g;

function compile() {
  const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
  const result = spawnSync(process.execPath,
    [tsc, '--preserveConstEnums', '-p', ROOT, '--outFile', TSC_OUTPUT],
    { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`tsc failed with exit code ${result.status}`);
  }
}

// Inline `//@include "x"` and `require("x")` lines, each file once, and drop
// `exports.` lines and whole-line `//` comments. ExtendScript cannot load the
// sources from inside the installed script, so the output must be one file.
function flatten(entry, includeDirs) {
  const included = new Set();
  const visit = (file) => {
    console.log(`including: ${path.relative(ROOT, file)}`);
    const lines = fs.readFileSync(file, 'utf8').split(/\r\n|\r|\n/);
    if (lines.at(-1) === '') lines.pop();
    let out = '';
    lines.forEach((line, i) => {
      const stripped = line.trim();
      if (stripped.startsWith('exports.')) return;
      if (stripped.startsWith('//@include ') || stripped.startsWith('require(')) {
        let name = line.split('"')[1];
        if (name.endsWith('.ts')) name = name.replace('.ts', '.js');
        const found = includeDirs.map((dir) => path.join(dir, name)).find((p) => fs.statSync(p, { throwIfNoEntry: false })?.isFile());
        if (!found) throw new Error(`${name} not found (${path.relative(ROOT, file)}, line ${i + 1})`);
        if (included.has(name)) return;
        included.add(name);
        out += visit(found) + '\n';
        return;
      }
      if (stripped.startsWith('//')) return;
      out += line + '\n';
    });
    return out;
  };
  return visit(entry);
}

export function build({ version } = {}) {
  fs.rmSync(BUILD, { recursive: true, force: true });
  fs.mkdirSync(BUILD, { recursive: true });
  compile();

  let app = fs.readFileSync(TSC_OUTPUT, 'utf8');
  if (version !== undefined) {
    const count = app.match(VERSION_DECL)?.length ?? 0;
    if (count !== 1) throw new Error(`expected one VERSION declaration in compiled output, found ${count}`);
    app = app.replace(VERSION_DECL, `$1"${version}"`);
  }
  const header = fs.readFileSync(path.join(ROOT, 'src/copyleft_header.js'), 'utf8');
  fs.writeFileSync(JSX_OUTPUT, header + app, 'utf8');
  const jsx = flatten(JSX_OUTPUT, [BUILD, path.join(ROOT, 'src')]);
  // Photoshop reads .jsx as UTF-8 only when it starts with a BOM.
  fs.writeFileSync(JSX_OUTPUT, '﻿' + jsx, 'utf8');

  fs.cpSync(path.join(ROOT, 'doc_template'), TEMPLATES_OUTPUT, { recursive: true });
  console.log(`Output file: ${path.relative(ROOT, JSX_OUTPUT)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--version');
  try {
    build({ version: i >= 0 ? args[i + 1] : undefined });
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(1);
  }
}
