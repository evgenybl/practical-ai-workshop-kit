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
    for (const k of a.key) { assert.ok(k.reason.length > 30); assert.ok(!/\{[A-Za-z:]+[A-Za-z0-9]*\}/.test(k.reason), 'no unfilled fact'); }
  }
});

test('marks that agree with the key pass', () => {
  const r = C.checkMarks(keyMarks());
  assert.ok(r.rules.every((x) => x.status === 'ok'));
  const n = REC.ex3.reduce((s, a) => s + a.key.length, 0);
  assert.ok(r.notes[0].startsWith('You agree with the key on ' + n + ' of the ' + n + ' sentences you marked'));
});

test('a mark that disagrees fails, with the key and the reason', () => {
  let id = null;
  let entry = null;
  REC.ex3.forEach((a) => a.key.forEach((k, i) => { if (!id && !k.accept.includes('fine')) { id = a.id + (i + 1); entry = k; } }));
  const m = keyMarks();
  m[id] = 'fine';
  const r = C.checkMarks(m);
  assert.equal(status(r, 'mark-' + id), 'look');
  assert.ok(rule(r, 'mark-' + id).message.startsWith('You marked: Fine. The key says: '));
  assert.ok(rule(r, 'mark-' + id).message.endsWith(entry.reason));
});

test('the session marks answers A and B, about ten sentences; C is for those who finish early', () => {
  const session = REC.ex3.filter((a) => a.in_session);
  assert.deepEqual(session.map((a) => a.id), ['A', 'B']);
  const marks = session.reduce((s, a) => s + a.key.length, 0);
  assert.ok(marks >= 8 && marks <= 12, marks + ' marks in the session');
  assert.ok(REC.ex3.some((a) => !a.in_session));
});

test('an optional answer left unmarked is one note, not a note per sentence', () => {
  const m = {};
  REC.ex3.filter((a) => a.in_session).forEach((a) => a.key.forEach((k, i) => { m[a.id + (i + 1)] = k.accept[0]; }));
  const r = C.checkMarks(m);
  const later = REC.ex3.find((a) => !a.in_session);
  assert.equal(status(r, 'answer-' + later.id), 'note');
  assert.ok(!r.rules.some((x) => x.id.startsWith('mark-' + later.id)));
  assert.ok(r.rules.filter((x) => x.id.startsWith('mark-')).every((x) => x.status === 'ok'));
});

test('the real answer A is unchanged, and B and C plant the kinds of error A lacks', () => {
  const [a, b, c] = REC.ex3;
  assert.equal(a.kind, 'recorded');
  assert.equal(b.kind, 'edited');
  assert.equal(c.kind, 'edited');
  const kinds = (x) => new Set(x.key.flatMap((k) => k.accept));
  assert.ok(!kinds(a).has('figure') && !kinds(a).has('policy'));
  assert.ok(kinds(b).has('figure') && kinds(b).has('policy'));
  assert.ok(kinds(c).has('figure') && kinds(c).has('policy'));
});

test('the assistant\'s own notes under a line of three dashes are shown, but not numbered', () => {
  const a = REC.ex3[0];
  assert.match(a.text, /\n---\n/);
  const numbered = C.numberedSentences(a.text);
  assert.ok(!numbered.some((s) => /Notes for you|proposal/.test(s)));
  assert.deepEqual(C.numberedSentences('One sentence.\n\n---\n\nA note.'), ['One sentence.']);
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

test('an unmarked sentence of the session is a note that still gives the key', () => {
  const r = C.checkMarks({});
  assert.equal(status(r, 'mark-B2'), 'note');
  assert.match(rule(r, 'mark-B2').message, /^Not marked yet\. The key: /);
});

test('marks are read from text in several spellings', () => {
  assert.deepEqual(C.parseMarks('A1: fine\nA2 - wrong figure\nb4 not in the material\nC3: Against the policy\nC5 = nonsense'),
    { A1: 'fine', A2: 'figure', B4: 'material', C3: 'policy' });
});
