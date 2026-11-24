'use strict';
/*
 * Small helpers shared by the tools and the tests. Paths are always worked out
 * from this file's own folder, so the kit runs from wherever it is copied.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WORKBOOK = path.join(ROOT, 'participant', 'workbook');

function abs(rel) { return path.join(ROOT, ...rel.split('/')); }
function readText(rel) { return fs.readFileSync(abs(rel), 'utf8').replace(/\r\n?/g, '\n'); }
function exists(rel) { return fs.existsSync(abs(rel)); }
function writeText(rel, text) {
  fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
  fs.writeFileSync(abs(rel), text.replace(/\r\n?/g, '\n'), 'utf8');
}
function listFiles(relDir, filter) {
  const dir = abs(relDir);
  if (!fs.existsSync(dir)) { return []; }
  return fs.readdirSync(dir).filter((f) => !filter || filter(f)).sort().map((f) => relDir + '/' + f);
}
/** Every file of the repository that git would track, walked from the root (without .git). */
function walk(relDir = '', out = []) {
  const dir = relDir ? abs(relDir) : ROOT;
  for (const name of fs.readdirSync(dir).sort()) {
    if (name === '.git' || name === 'node_modules') { continue; }
    const rel = relDir ? relDir + '/' + name : name;
    if (fs.statSync(abs(rel)).isDirectory()) { walk(rel, out); } else { out.push(rel); }
  }
  return out;
}
/** Loads a workbook script fresh, so a rebuilt file is read again. */
function freshRequire(rel) {
  const p = abs(rel);
  delete require.cache[require.resolve(p)];
  return require(p);
}
function loadWorkbook() {
  ['participant/workbook/case-data.js', 'participant/workbook/recorded-answers.js', 'participant/workbook/checker.js']
    .forEach((rel) => { const p = abs(rel); if (require.cache[p]) { delete require.cache[p]; } });
  return {
    CASE: require(abs('participant/workbook/case-data.js')),
    REC: require(abs('participant/workbook/recorded-answers.js')),
    checker: require(abs('participant/workbook/checker.js'))
  };
}

module.exports = { ROOT, WORKBOOK, abs, readText, exists, writeText, listFiles, walk, freshRequire, loadWorkbook };
