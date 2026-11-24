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
/**
 * Files and folders a computer adds by itself, which are never part of the kit: macOS's .DS_Store and
 * ._ files, Windows's Thumbs.db and desktop.ini, and the __MACOSX folder of an extracted zip.
 * .gitignore lists the same names.
 */
function isStray(name) {
  return /^(\.DS_Store|\._.*|\.Spotlight-V100|\.Trashes|\.fseventsd|\.TemporaryItems|Thumbs\.db|ehthumbs\.db|[Dd]esktop\.ini|__MACOSX)$/.test(name);
}
function listFiles(relDir, filter) {
  const dir = abs(relDir);
  if (!fs.existsSync(dir)) { return []; }
  return fs.readdirSync(dir).filter((f) => !isStray(f) && (!filter || filter(f))).sort().map((f) => relDir + '/' + f);
}
/** Every file of the repository that git would track, walked from the root (without .git and stray files). */
function walk(relDir = '', out = []) {
  const dir = relDir ? abs(relDir) : ROOT;
  for (const name of fs.readdirSync(dir).sort()) {
    if (name === '.git' || name === 'node_modules' || isStray(name)) { continue; }
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

/**
 * Applies the declared edits of an edited answer to the recorded answer it came from.
 * Each step is { replace, with } (the text must occur exactly once) or { cut_from } (drop the rest).
 */
function applyEdits(text, steps) {
  let out = text;
  for (const s of steps) {
    if ('cut_from' in s) {
      const i = out.indexOf(s.cut_from);
      if (i === -1 || out.indexOf(s.cut_from, i + 1) !== -1) { throw new Error('cut_from must occur exactly once: ' + JSON.stringify(s.cut_from)); }
      out = out.slice(0, i);
    } else {
      const i = out.indexOf(s.replace);
      if (i === -1 || out.indexOf(s.replace, i + 1) !== -1) { throw new Error('replace must occur exactly once: ' + JSON.stringify(s.replace)); }
      out = out.slice(0, i) + s.with + out.slice(i + s.replace.length);
    }
  }
  return out;
}

module.exports = { ROOT, WORKBOOK, abs, readText, exists, writeText, isStray, listFiles, walk, freshRequire, loadWorkbook, applyEdits };
