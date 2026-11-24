'use strict';
// Exercise 1: every sign of the five-part brief, both ways.
const test = require('node:test');
const assert = require('node:assert/strict');
const { CASE, C, status, rule } = require('./helpers');

const strong = C.parseBrief(C.requestText('reply'));
const withPart = (k, v) => Object.assign({}, strong, { [k]: v });

test('the strong brief passes every part', () => {
  const r = C.checkBrief(strong);
  for (const k of C.PARTS) { assert.equal(status(r, k), 'ok', k); }
});

test('situation: passes with who and what; fails when empty or too thin', () => {
  assert.equal(status(C.checkBrief(withPart('situation', 'I answer customers for a supplier, and our customer is upset about a late and damaged order.')), 'situation'), 'ok');
  assert.equal(status(C.checkBrief(withPart('situation', '')), 'situation'), 'look');
  assert.equal(status(C.checkBrief(withPart('situation', 'Angry customer, late order.')), 'situation'), 'look');
});

test('material: passes with the whole thread; fails with part of it, and says which messages it found', () => {
  assert.equal(status(C.checkBrief(withPart('material', CASE.threadText)), 'material'), 'ok');
  const lastOnly = CASE.messageText(CASE.thread[4]);
  const r = C.checkBrief(withPart('material', lastOnly));
  assert.equal(status(r, 'material'), 'look');
  assert.match(rule(r, 'material').message, /found 1 \(message 5\)/);
  assert.equal(status(C.checkBrief(withPart('material', '')), 'material'), 'look');
});

test('material: the thread still counts when pasted with other line breaks and spacing', () => {
  const reflowed = CASE.threadText.replace(/\n\n/g, '\n').replace(/ /g, '  ');
  assert.equal(status(C.checkBrief(withPart('material', reflowed)), 'material'), 'ok');
});

test('material: a note, not a failure, when the policy is missing', () => {
  const r = C.checkBrief(withPart('material', CASE.threadText));
  assert.ok(r.notes.some((n) => /policy is not in your material/.test(n)));
  const r2 = C.checkBrief(strong);
  assert.ok(!r2.notes.some((n) => /policy is not in your material/.test(n)));
});

test('task: passes with a verb of production; fails without one', () => {
  assert.equal(status(C.checkBrief(withPart('task', 'Draft my reply to her last message.')), 'task'), 'ok');
  assert.equal(status(C.checkBrief(withPart('task', 'Her last message, please.')), 'task'), 'look');
  assert.equal(status(C.checkBrief(withPart('task', '')), 'task'), 'look');
});

test('form: passes with a length or a structure; fails with "short" alone', () => {
  assert.equal(status(C.checkBrief(withPart('form', 'At most 150 words.')), 'form'), 'ok');
  assert.equal(status(C.checkBrief(withPart('form', 'Three short paragraphs.')), 'form'), 'ok');
  assert.equal(status(C.checkBrief(withPart('form', 'Use bullet points.')), 'form'), 'ok');
  const r = C.checkBrief(withPart('form', 'Short and friendly.'));
  assert.equal(status(r, 'form'), 'look');
  assert.match(rule(r, 'form').message, /mean different things to different people/);
});

test('limits: passes with an explicit prohibition; fails without one', () => {
  assert.equal(status(C.checkBrief(withPart('limits', 'Do not promise a credit.')), 'limits'), 'ok');
  assert.equal(status(C.checkBrief(withPart('limits', 'Never give a delivery day.')), 'limits'), 'ok');
  assert.equal(status(C.checkBrief(withPart('limits', 'No promises about money.')), 'limits'), 'ok');
  assert.equal(status(C.checkBrief(withPart('limits', 'Be careful with money.')), 'limits'), 'look');
  assert.equal(status(C.checkBrief(withPart('limits', '')), 'limits'), 'look');
});

test('the check says plainly that it checks presence, not quality', () => {
  assert.ok(C.checkBrief(strong).notes.some((n) => /presence of each part/.test(n) && /does not judge/.test(n)));
});

test('a brief survives the trip to text and back', () => {
  const text = C.assembleBrief(strong);
  assert.deepEqual(C.parseBrief(text), strong);
  assert.deepEqual(C.parseBrief('Situation: one line\nTask: write it'), { situation: 'one line', material: '', task: 'write it', form: '', limits: '' });
});
