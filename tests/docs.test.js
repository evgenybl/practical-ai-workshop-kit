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

test('every relative link in the documents leads to a file that exists', () => {
  for (const f of files.filter((x) => x.endsWith('.md'))) {
    for (const m of raw(f).matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1].split('#')[0];
      if (!target || /^(https?:|mailto:)/.test(target)) { continue; }
      const rel = path.posix.normalize(path.posix.join(path.posix.dirname(f), target)).replace(/\/$/, '');
      assert.ok(lib.exists(rel), f + ' links to ' + m[1]);
    }
  }
});

test('every image a page embeds exists in the repository', () => {
  let embedded = 0;
  for (const f of docs) {
    const t = raw(f);
    const sources = [...t.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g), ...t.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]);
    for (const src of sources) {
      // The one remote image is the CI badge, which GitHub draws from the workflow's last run.
      if (src === 'https://github.com/evgenybl/practical-ai-workshop-kit/actions/workflows/ci.yml/badge.svg' && f === 'README.md') { continue; }
      embedded++;
      assert.ok(!/^(https?:|\/\/)/.test(src), f + ' embeds a remote image: ' + src);
      if (/^data:/.test(src)) { continue; }
      const rel = path.posix.normalize(path.posix.join(path.posix.dirname(f), src));
      assert.ok(lib.exists(rel), f + ' embeds ' + src + ', which is not in the repository');
    }
  }
  // One picture is embedded: the README's capture of exercise 2, whose caption says how it was made.
  assert.equal(embedded, 1);
  assert.match(raw('README.md'), /Cut from a capture of `participant\/workbook-single-file.html` in a headless browser with no network/);
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
const evidenceRows = () => evidenceTable('docs/HOW-THIS-WAS-TESTED.md').split('\n');
const evidenceState = (kind) => evidenceRows().find((r) => r.startsWith('| ' + kind + ' |')).split('|').slice(-2, -1)[0].trim();

test('the README repeats the evidence table of How this kit was tested, word for word', () => {
  const a = evidenceTable('README.md');
  assert.equal(a.split('\n').length, 8, 'six kinds of evidence');
  assert.equal(a, evidenceTable('docs/HOW-THIS-WAS-TESTED.md'));
});

test('the evidence table says what is done, what was done once, and what is owed', () => {
  assert.match(evidenceState('Recorded answers through the checker'), /^Done/);
  assert.match(evidenceState('A new-user test by an AI agent'), /^Done twice, by separate AI agents: at commit 5059ae2, .* and at commit 2926752, .*Both are listed on the testing page\. In the second pass the marks of exercise 3, exercise 4 part 1 and the ten questions were made blind by a further agent, because the second agent had read the keys in the page's files first\.$/);
  assert.match(evidenceState('An independent review'), /^Done once, at commit 5059ae2, by a separate AI agent: .*listed on the testing page\. The review has not been repeated on the current version\.$/);
  assert.match(evidenceState('Opened in a real browser: keyboard only, network off, both copies'), /^Not yet done by a person\. Rendered once in a headless browser .* says nothing about keyboard use or a screen reader\.$/);
  assert.equal(evidenceState('Taught to a class of people'), 'Not done.');
  assert.match(evidenceState('Automated tests'), /CI: run 45315987278 passed on Linux and Windows with Node 22 and 24, at commit 1038d84; the badge at the top of the README shows the latest run\./);
  const how = raw('docs/HOW-THIS-WAS-TESTED.md');
  const newUser = how.slice(how.indexOf('## A new-user test by an AI agent'), how.indexOf('\n---', how.indexOf('## A new-user test by an AI agent')));
  assert.match(newUser, /\*\*State: done twice, by separate AI agents: at commit 5059ae2, and at commit 2926752\.\*\*/);
  for (const h of ['### The first pass, at commit 5059ae2', '### The second pass, at commit 2926752', '**Its own limit.**', '**Words to read, beside the planned minutes.**', 'These are counts, not measured times']) {
    assert.ok(newUser.includes(h), h);
  }
  assert.match(newUser, /\| Start here, and the case \| 8 \| About 1,230 \|/);
  for (const h of ['## A new-user test by an AI agent', '## An independent review']) {
    const section = how.slice(how.indexOf(h), how.indexOf('\n---', how.indexOf(h)));
    if (h === '## An independent review') { assert.match(section, /\*\*State: done once, at commit 5059ae2, by a separate AI agent\. Not repeated on the current version\.\*\*/, h); }
    assert.match(section, /What was changed/i, h);
    assert.doesNotMatch(section, /is owed/, h);
  }
  const browser = how.slice(how.indexOf('## Opened in a real browser'), how.indexOf('\n---', how.indexOf('## Opened in a real browser')));
  assert.match(browser, /\*\*State: not yet done by a person; rendered once in a headless browser\.\*\*/);
  assert.match(browser, /A headless run is a rendering, not a person using the page\./);
});

test('the test count in the evidence table is the one the pasted test run printed', () => {
  // Only the number of tests is compared: the pasted run is the one before this run, so its pass and
  // fail lines are checked by reading them, not by this test.
  const m = evidenceState('Automated tests').match(/^Done locally: (\d+) tests, (\d+) pass, 0 fail/);
  assert.ok(m, 'the count is in the table');
  assert.equal(m[1], m[2]);
  const run = pastedBlocks('docs/HOW-THIS-WAS-TESTED.md').find((b) => /^node --test/.test(b.command)).text;
  const pasted = run.match(/^# tests (\d+)$/m);
  assert.ok(pasted, 'the pasted run has its count');
  assert.equal(m[1], pasted[1]);
});

test('the docs say that the browser enforces "sends nothing", and that this awaits the real-browser pass', () => {
  const how = raw('docs/HOW-THIS-WAS-TESTED.md');
  assert.ok(how.includes("connect-src 'none'; img-src data:; media-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'"));
  assert.match(how, /so "sends nothing" is enforced by the browser/);
  assert.match(how, /awaits the real-browser pass/);
});

// ---- what is claimed ------------------------------------------------------------------

test('the README says what is tested, and what a test cannot prove', () => {
  const readme = raw('README.md');
  assert.doesNotMatch(readme, /Every claim on this page is backed/);
  assert.match(readme, /\*\*What is tested:\*\*/);
  assert.match(readme, /\*\*What no test can prove:\*\* whether the teaching works, since the kit has not been taught; how the page behaves in a real browser, which is owed; and where the recorded answers came from, which rests on the author's record/);
});

test('the README claims no client, no session run and no use by anyone', () => {
  const readme = raw('README.md');
  for (const re of [/\bclients?\b/i, /\btrusted by\b/i, /\bused (by|in|at) \d/i, /\b\d+ (sessions|workshops|companies|teams|organi[sz]ations)\b/i,
    /\b(has|have) been (run|delivered|taught|used|piloted)\b/i, /\b(sessions?|workshops?) (run|held|delivered) (for|at|with)\b/i]) {
    assert.doesNotMatch(readme, re);
  }
});

test('the README and every instructor page say the kit has not been taught, and that the timings are planned', () => {
  for (const f of ['README.md', ...lib.listFiles('instructor', (x) => x.endsWith('.md'))]) {
    const t = raw(f);
    assert.match(t, /has not (yet )?been taught/, f);
    assert.match(t, /\bplanned\b/, f);
  }
});

test('the recordings\' origin is stated as the author\'s record, with what it is not', () => {
  for (const f of ['recorded/README.md', 'docs/HOW-THIS-WAS-TESTED.md', 'instructor/guide.md']) {
    const t = raw(f);
    assert.match(t, /according to the author's record/i, f);
    assert.match(t, /own system prompt/, f);
    assert.match(t, /not a plain chat/, f);
  }
  for (const f of ['recorded/README.md', 'docs/HOW-THIS-WAS-TESTED.md']) {
    assert.match(raw(f), /holds no transcript/, f);
    assert.match(raw(f), /not changed since it was saved/, f);
  }
  assert.match(raw('README.md'), /no chat product was tried/);
  for (const f of docs) { assert.doesNotMatch(raw(f), /works with any (chat )?assistant/i, f); }
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

const FLOW = [8, 18, 20, 15, 20, 9];

test('the planned minutes agree: guide, run sheet, README and workbook, adding up to 90, with exercise 5 as homework', () => {
  const blocks = (f) => [...raw(f).matchAll(/^\|[^|\n]+\|(?:[^|\n]+\|)? (\d+) \|$/gm)].map((m) => Number(m[1]));
  assert.equal(FLOW.reduce((a, b) => a + b, 0), 90);
  assert.deepEqual(blocks('instructor/run-sheet.md'), FLOW);
  assert.deepEqual(blocks('README.md'), FLOW);
  const guide = raw('instructor/guide.md');
  const inGuide = [...guide.matchAll(/^## .*\((\d+) minutes\)$|^\*\*Planned: (\d+) minutes/gm)].map((m) => Number(m[1] || m[2]));
  assert.deepEqual(inGuide, FLOW);
  // The page itself adds up to 90: the start section carries the opening's minutes.
  const page = [...raw('participant/workbook/index.html').matchAll(/Planned: (\d+) minutes/g)].map((m) => Number(m[1]));
  assert.deepEqual(page, FLOW);
  assert.match(raw('participant/workbook/index.html'), /<h2 id="start-h">Start here<\/h2>\n  <p class="meta">Planned: 8 minutes: read the case and the policy now\.<\/p>/);
  // Exercise 5 is homework everywhere, with no minutes in the session.
  assert.match(guide, /^## Exercise 5: Make it reusable \(homework\)$/m);
  assert.match(raw('instructor/run-sheet.md'), /Exercise 5, \*Make it reusable\*, is homework/);
  assert.match(raw('README.md'), /^\| 5\. Make it reusable \| Homework: .* \| Homework \|$/m);
  assert.match(raw('participant/workbook/index.html'), /<p class="meta">Homework, about eight minutes\./);
});

test('each variant adds up to its length', () => {
  const v = raw('instructor/variants.md');
  const section = (h) => v.slice(v.indexOf(h), v.indexOf('\n---', v.indexOf(h)) === -1 ? undefined : v.indexOf('\n---', v.indexOf(h)));
  for (const [h, total] of [['## 60 minutes', 60], ['## Half a day', 210], ['## Online', 90]]) {
    const rows = [...section(h).matchAll(/^\| [^|\n]+ \| (\d+) \|/gm)].map((m) => Number(m[1]));
    assert.equal(rows.reduce((a, b) => a + b, 0), total, h);
    assert.ok(section(h).includes('| **' + total + '** |'), h);
  }
});

test('each exercise has one debrief question, the same in the guide and the run sheet', () => {
  const guide = raw('instructor/guide.md');
  const sheet = raw('instructor/run-sheet.md');
  const questions = [...guide.matchAll(/^- \*\*Debrief question:\*\* \*"([^"]+)"\*/gm)].map((m) => m[1]);
  assert.equal(questions.length, 5, 'one for each of the five exercises');
  assert.equal((guide.match(/Debrief question/g) || []).length, 5);
  for (const q of questions) { assert.ok(sheet.includes('"' + q + '"'), q); }
  assert.doesNotMatch(guide, /Opening question|Short debrief/);
});

test('the instructor is told how people keep the case in view, and the page says it too', () => {
  for (const f of ['instructor/guide.md', 'instructor/run-sheet.md', 'participant/workbook/index.html']) {
    const t = raw(f);
    assert.match(t, /second window/, f);
    assert.match(t, /printed/, f);
  }
});

test('the single-file workbook is what is sent by default', () => {
  assert.match(raw('instructor/guide.md'), /\*\*The single-file workbook\*\*, `participant\/workbook-single-file\.html`, on each laptop\. Send it the day before\./);
  assert.match(raw('instructor/variants.md'), /In every variant, send the single-file workbook/);
  assert.match(raw('participant/README.md'), /\*\*To start, open `workbook-single-file\.html` by double-clicking it\.\*\*/);
  assert.match(raw('instructor/when-things-go-wrong.md'), /### 12\. The page shows only a yellow line: "The workbook did not load"/);
});

test('the key in the page is said plainly: in the guide, when things go wrong, the testing page, the README and the page itself', () => {
  const sentence = 'The workbook carries its own key so that it can check answers with no server; a participant who opens the page\'s source can read it.';
  for (const f of ['instructor/guide.md', 'instructor/when-things-go-wrong.md', 'docs/HOW-THIS-WAS-TESTED.md', 'README.md']) {
    const t = raw(f);
    assert.ok(t.includes(sentence), f);
    assert.match(t, /practice tool, not an exam/, f);
    assert.match(t, /must not be used to grade people/, f);
  }
  assert.match(raw('participant/workbook/index.html'), /<strong>A practice tool, not an exam\.<\/strong> The workbook carries its own answer key/);
});
