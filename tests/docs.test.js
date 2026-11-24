'use strict';
// The documents: hygiene across every file, the pasted outputs, the evidence tables, links, and the run sheet's minutes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { lib } = require('./helpers');

const files = lib.walk().filter((f) => !/\.png$/i.test(f));
const docs = files.filter((f) => /\.(md|html)$/.test(f));
const raw = (f) => fs.readFileSync(lib.abs(f), 'utf8');

// Written in pieces so that this file does not match itself.
const ABSOLUTE = [
  new RegExp('\\b[A-Za-z]:' + '[\\\\/][A-Za-z]'),
  new RegExp('/' + 'Users/'),
  new RegExp('/' + 'home/'),
  new RegExp('fi' + 'le:/'),
  new RegExp('/' + 'c/' + 'portfolio')
];

test('no file holds an absolute path', () => {
  for (const f of files) {
    const t = raw(f);
    for (const re of ABSOLUTE) { assert.ok(!re.test(t), f + ' matches ' + re); }
  }
});

// Recordings are kept byte for byte, as the model returned them; they may hold a symbol such as a multiplication sign.
const recordings = lib.listFiles('recorded/answers', (f) => f.endsWith('.meta.json'))
  .filter((m) => JSON.parse(raw(m)).kind === 'recorded').map((m) => m.replace(/\.meta\.json$/, '.txt'));

function isDirectionMark(code) {
  return code === 0x200e || code === 0x200f || (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069);
}

test('no file holds a letter outside English, a hidden direction mark or a control character', () => {
  assert.ok(recordings.length >= 3);
  for (const f of files) {
    const chars = [...raw(f)];
    const bad = chars.findIndex((ch) => {
      const code = ch.codePointAt(0);
      return (code > 126 && /\p{L}/u.test(ch)) || isDirectionMark(code) || (code < 32 && ch !== '\n' && ch !== '\t');
    });
    assert.equal(bad, -1, f + ' has a forbidden character at position ' + bad);
  }
});

test('every file except an unchanged recording is plain ASCII', () => {
  for (const f of files.filter((x) => !recordings.includes(x))) {
    const bad = [...raw(f)].findIndex((ch) => ch.codePointAt(0) > 126);
    assert.equal(bad, -1, f + ' has a character outside plain ASCII at position ' + bad);
  }
});

test('every file uses LF line ends', () => {
  for (const f of files) { assert.ok(!raw(f).includes('\r'), f); }
});

test('no package files: nothing to install', () => {
  for (const f of ['package.json', 'package-lock.json', 'node_modules', 'yarn.lock']) { assert.ok(!lib.exists(f), f); }
});

test('every e-mail address is at example.com, and every phone number is an obvious placeholder', () => {
  for (const f of files) {
    const t = raw(f);
    for (const m of t.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g)) { assert.match(m[0], /@example\.com$/, f); }
    for (const m of t.matchAll(/\b\d{3}-\d{3}-\d{4}\b/g)) { assert.match(m[0], /^000-000-/, f); }
  }
});

test('nothing claims the workshop was taught, or reports a class, a participant count or a score', () => {
  const claims = [
    /\b(we|I) (ran|delivered|taught|ran|piloted) (this|the) (workshop|session|course|kit)\b/i,
    /\bparticipants (said|reported|rated|loved|told us)\b/i,
    /\b\d+ (participants|attendees|learners) (attended|took part)/i,
    /\bsatisfaction\b/i,
    /\bour clients\b/i
  ];
  for (const f of docs) {
    const t = raw(f);
    for (const re of claims) { assert.ok(!re.test(t), f + ' matches ' + re); }
  }
  assert.match(raw('README.md'), /This kit has not been taught to a class of people\./);
  assert.match(raw('docs/HOW-THIS-WAS-TESTED.md'), /\nThis kit has not been taught to a class of people\.\n/);
});

test('every relative link in the documents leads to a file that exists (the owed screenshot apart)', () => {
  const owed = ['docs/img/workbook.png'];
  for (const f of files.filter((x) => x.endsWith('.md'))) {
    for (const m of raw(f).matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1].split('#')[0];
      if (!target || /^(https?:|mailto:)/.test(target)) { continue; }
      const rel = path.posix.normalize(path.posix.join(path.posix.dirname(f), target)).replace(/\/$/, '');
      if (owed.includes(rel)) { continue; }
      assert.ok(lib.exists(rel), f + ' links to ' + m[1]);
    }
  }
});

// ---- pasted output ----------------------------------------------------------------

function pastedBlocks(f) {
  return [...raw(f).matchAll(/<!-- pasted from: (.+?) -->\n```text\n([\s\S]*?)```/g)].map((m) => ({ command: m[1], text: m[2] }));
}

test('every pasted block has been filled from a run', () => {
  for (const f of ['README.md', 'docs/HOW-THIS-WAS-TESTED.md']) {
    const blocks = pastedBlocks(f);
    assert.ok(blocks.length >= 1, f);
    for (const b of blocks) { assert.ok(b.text.trim().length > 0, f + ': ' + b.command); }
  }
});

test('the pasted output of the checker and the answer runner is what they print today', () => {
  for (const f of ['README.md', 'docs/HOW-THIS-WAS-TESTED.md']) {
    for (const b of pastedBlocks(f)) {
      const m = b.command.match(/^node (tools\/(?:check|run-answers)\.js)(.*)$/);
      if (!m) { continue; } // the test run itself cannot be re-run from inside a test
      const out = spawnSync(process.execPath, [lib.abs(m[1]), ...m[2].trim().split(/\s+/).filter(Boolean)], { encoding: 'utf8', cwd: lib.ROOT });
      assert.equal(b.text, out.stdout, f + ': ' + b.command + ' prints something else now: paste it again');
    }
  }
});

// ---- the evidence tables ------------------------------------------------------------

function evidenceTable(f) {
  const t = raw(f);
  const start = t.indexOf('| Kind of evidence |');
  return t.slice(start, t.indexOf('\n\n', start));
}

test('the README repeats the evidence table of How this kit was tested, word for word', () => {
  const a = evidenceTable('README.md');
  assert.ok(a.split('\n').length === 7, 'five kinds of evidence');
  assert.equal(a, evidenceTable('docs/HOW-THIS-WAS-TESTED.md'));
});

test('the evidence table says what is owed: the new-user test and the review are not yet done; teaching is not done', () => {
  const rows = evidenceTable('docs/HOW-THIS-WAS-TESTED.md').split('\n');
  const state = (kind) => rows.find((r) => r.startsWith('| ' + kind)).split('|').slice(-2, -1)[0].trim();
  assert.match(state('A new-user test by an AI agent'), /^Not yet done/);
  assert.match(state('An independent review'), /^Not yet done/);
  assert.match(state('Taught to a class of people'), /^Not done/);
  assert.match(state('Recorded answers through the checker'), /^Done/);
  const how = raw('docs/HOW-THIS-WAS-TESTED.md');
  for (const h of ['## A new-user test by an AI agent', '## An independent review']) {
    const section = how.slice(how.indexOf(h), how.indexOf('\n---', how.indexOf(h)));
    assert.match(section, /not yet done/i, h);
  }
});

// ---- the planned minutes -------------------------------------------------------------

const toMinutes = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

test('the run sheet runs from 0:00 to 1:30 with no gap and no overlap', () => {
  const rows = [...raw('instructor/run-sheet.md').matchAll(/^\| ([0-9]:[0-9][0-9]) \| ([0-9]:[0-9][0-9]) \|/gm)].map((m) => [toMinutes(m[1]), toMinutes(m[2])]);
  assert.ok(rows.length > 20);
  assert.equal(rows[0][0], 0);
  for (let i = 1; i < rows.length; i++) { assert.equal(rows[i][0], rows[i - 1][1], 'row ' + (i + 1)); }
  assert.equal(rows[rows.length - 1][1], 90);
});

test('the planned minutes agree: workbook, run sheet and README, adding up to 90', () => {
  const blocks = (f) => [...raw(f).matchAll(/^\|[^|\n]+\|(?:[^|\n]+\|)? (\d+) \|$/gm)].map((m) => Number(m[1]));
  const sheet = blocks('instructor/run-sheet.md');
  assert.deepEqual(sheet, [5, 15, 20, 12, 20, 8, 10]);
  assert.equal(sheet.reduce((a, b) => a + b, 0), 90);
  assert.deepEqual(blocks('README.md'), sheet);
  const page = [...raw('participant/workbook/index.html').matchAll(/Planned: (\d+) minutes/g)].map((m) => Number(m[1]));
  assert.deepEqual(page, sheet.slice(1));
});
