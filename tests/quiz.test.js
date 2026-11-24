'use strict';
// The ten-question check: its shape, and marking both ways.
const test = require('node:test');
const assert = require('node:assert/strict');
const { CASE, C, status, rule } = require('./helpers');

const best = () => Object.fromEntries(CASE.quiz.map((q) => [q.n, q.options.find((o) => o.correct).key]));

test('ten questions, two for each of the five objectives', () => {
  assert.equal(CASE.quiz.length, 10);
  for (const o of ['O1', 'O2', 'O3', 'O4', 'O5']) {
    assert.equal(CASE.quiz.filter((q) => q.objective === o).length, 2, o);
  }
});

test('each question has four options, exactly one best, and every option explains itself', () => {
  for (const q of CASE.quiz) {
    assert.deepEqual(q.options.map((o) => o.key), ['A', 'B', 'C', 'D']);
    assert.equal(q.options.filter((o) => o.correct).length, 1, 'question ' + q.n);
    for (const o of q.options) { assert.ok(o.why && o.why.length > 30, 'question ' + q.n + ' option ' + o.key); }
  }
});

test('the best answers are not all in one position', () => {
  const positions = new Set(CASE.quiz.map((q) => q.options.findIndex((o) => o.correct)));
  assert.ok(positions.size >= 3);
});

test('the best answer passes, with its explanation', () => {
  const r = C.checkQuiz(best());
  assert.ok(r.rules.every((x) => x.status === 'ok'));
  assert.ok(r.notes[0].startsWith('You chose the best answer to 10 of 10'));
});

test('a wrong answer fails, and explains both the choice and the best answer', () => {
  const q3 = CASE.quiz[2];
  const wrong = q3.options.find((o) => !o.correct);
  const right = q3.options.find((o) => o.correct);
  const a = best();
  a[3] = wrong.key;
  const r = C.checkQuiz(a);
  assert.equal(status(r, 'q3'), 'look');
  assert.ok(rule(r, 'q3').message.includes(wrong.why));
  assert.ok(rule(r, 'q3').message.includes('The best answer is ' + right.key + ': ' + right.why));
});

test('an unanswered question is a note', () => {
  assert.equal(status(C.checkQuiz({}), 'q1'), 'note');
});

test('answers are read from text', () => {
  assert.deepEqual(C.parseQuiz('1: B\n2) c\n3 - D\n10. a'), { 1: 'B', 2: 'C', 3: 'D', 10: 'A' });
});

test('the best answer is not given away by its length', () => {
  // A first-time participant scored ten out of ten by choosing the longest option every time.
  const longest = CASE.quiz.filter((q) => {
    const best = q.options.find((o) => o.correct).text.length;
    return q.options.filter((o) => !o.correct).every((o) => o.text.length < best);
  }).map((q) => q.n);
  assert.ok(longest.length <= 2, 'the best answer is the longest option in questions ' + longest.join(', '));
});
