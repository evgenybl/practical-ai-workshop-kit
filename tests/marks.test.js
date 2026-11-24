'use strict';
// Exercise 3: marks against the key.
const test = require('node:test');
const assert = require('node:assert/strict');
const { REC, C, status, rule } = require('./helpers');

function keyMarks() {
  const m = {};
  REC.ex3.forEach((a) => a.key.forEach((k, i) => { m[a.id + (i + 1)] = k.accept[0]; }));
  return m;
}

test('there are three answers, and the three kinds of error all appear', () => {
  assert.equal(REC.ex3.length, 3);
  const kinds = new Set();
  REC.ex3.forEach((a) => a.key.forEach((k) => k.accept.forEach((l) => kinds.add(l))));
  for (const k of ['fine', 'figure', 'material', 'policy']) { assert.ok(kinds.has(k), k); }
});

test('the key has one entry for each numbered sentence, and a reason for each', () => {
  for (const a of REC.ex3) {
    assert.equal(C.numberedSentences(a.text).length, a.key.length, 'answer ' + a.id);
    for (const k of a.key) { assert.ok(k.reason.length > 30); assert.ok(!/\{[A-Za-z:]+\}/.test(k.reason), 'no unfilled fact'); }
  }
});

test('marks that agree with the key pass', () => {
  const r = C.checkMarks(keyMarks());
  assert.ok(r.rules.every((x) => x.status === 'ok'));
  assert.ok(r.notes[0].startsWith('You agree with the key on 15 of 15'));
});

test('a mark that disagrees fails, with the key and the reason', () => {
  const m = keyMarks();
  m.A2 = 'fine';
  const r = C.checkMarks(m);
  assert.equal(status(r, 'mark-A2'), 'look');
  assert.match(rule(r, 'mark-A2').message, /^You marked: Fine\. The key says: A wrong figure\. /);
});

test('where the key accepts two marks, either passes', () => {
  const both = [];
  REC.ex3.forEach((a) => a.key.forEach((k, i) => { if (k.accept.length > 1) { both.push([a.id + (i + 1), k.accept]); } }));
  assert.ok(both.length >= 1);
  for (const [id, accept] of both) {
    for (const l of accept) {
      const m = keyMarks();
      m[id] = l;
      assert.equal(status(C.checkMarks(m), 'mark-' + id), 'ok');
    }
  }
});

test('an unmarked sentence is a note that still gives the key', () => {
  const r = C.checkMarks({});
  assert.equal(status(r, 'mark-B2'), 'note');
  assert.match(rule(r, 'mark-B2').message, /^Not marked yet\. The key: /);
});

test('marks are read from text in several spellings', () => {
  assert.deepEqual(C.parseMarks('A1: fine\nA2 - wrong figure\nb4 not in the material\nC3: Against the policy\nC5 = nonsense'),
    { A1: 'fine', A2: 'figure', B4: 'material', C3: 'policy' });
});
