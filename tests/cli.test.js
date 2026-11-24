'use strict';
// node tools/check.js <exercise> <answer file>: prints what the page would show, with a useful exit code.
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('child_process');
const { lib, REC, C } = require('./helpers');

function run(...args) {
  return spawnSync(process.execPath, [lib.abs('tools/check.js'), ...args], { encoding: 'utf8', cwd: lib.ROOT });
}

test('it prints exactly what the page shows', () => {
  const r = run('2', 'recorded/answers/ex2-answer.txt');
  assert.equal(r.stdout, C.formatResult(C.checkSummary(REC.ex2.text)));
});

test('exit code 1 when something needs another look, 0 when nothing does', () => {
  assert.equal(run('2', 'recorded/answers/ex2-answer.txt').status, 1);
  assert.equal(run('2', 'solutions/ex2-strong-summary.txt').status, 0);
});

test('exit code 2, with the usage, when the command is wrong', () => {
  const none = run();
  assert.equal(none.status, 2);
  assert.match(none.stdout, /Usage: node tools\/check\.js <exercise> <answer file>/);
  const bad = run('9', 'solutions/ex2-strong-summary.txt');
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /There is no exercise "9"/);
  const missing = run('2', 'no-such-file.txt');
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /Cannot read the answer file/);
});

test('--json gives the same result as data', () => {
  const r = run('5', 'solutions/ex5-strong-template.txt', '--json');
  assert.equal(r.status, 0);
  assert.deepEqual(JSON.parse(r.stdout), C.checkTemplate(lib.readText('solutions/ex5-strong-template.txt')));
});

test('every exercise can be run from the command line', () => {
  const files = { '1': 'solutions/ex1-strong-brief.txt', reply: 'solutions/ex1-strong-reply.txt', '2-request': 'solutions/ex2-strong-request.txt', '2': 'solutions/ex2-strong-summary.txt',
    '3': 'solutions/ex3-marks.txt', '4a': 'solutions/ex4-piles.txt', '4b': 'solutions/ex4-extract.txt', '5': 'solutions/ex5-strong-template.txt', quiz: 'solutions/quiz-answers.txt' };
  assert.deepEqual(Object.keys(files).sort(), Object.keys(C.EXERCISES).sort());
  for (const [ex, f] of Object.entries(files)) { assert.equal(run(ex, f).status, 0, ex); }
});

test('the usage says what each exercise\'s file must hold, in the order of the session', () => {
  const out = run().stdout;
  assert.match(out, /  1 +the five-part brief: a text file with the headings "## Situation", "## Material", "## Task", "## Form" and "## Limits"/);
  const ids = [...out.matchAll(/^  (\S+) +/gm)].map((m) => m[1]);
  assert.deepEqual(ids, ['1', 'reply', '2-request', '2', '3', '4a', '4b', '5', 'quiz']);
});
