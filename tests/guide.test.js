'use strict';
// What the instructor guide, the testing page, the README and the other instructor pages say each recorded
// or edited answer gives through the checker is what the checker gives: each count and each flag is read
// from the page and compared with a run.
const test = require('node:test');
const assert = require('node:assert/strict');
const { lib, REC, C } = require('./helpers');

const guide = lib.readText('instructor/guide.md');
const how = lib.readText('docs/HOW-THIS-WAS-TESTED.md');
const NUMBER = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const num = (word) => { const n = NUMBER[word.toLowerCase()]; assert.ok(n, 'a number word: ' + word); return n; };
const find = (text, re, what) => { const m = text.match(re); assert.ok(m, what + ': ' + re); return m; };

const answer = (id) => REC.ex3.find((a) => a.id === id);
const results = {
  ex1: C.checkReply(REC.ex1.text),
  ex2: C.checkSummary(REC.ex2.text),
  A: C.checkReply(answer('A').text),
  B: C.checkReply(answer('B').text),
  C: C.checkReply(answer('C').text)
};
const looks = (r) => r.rules.filter((x) => x.status === 'look');
const oks = (r) => r.rules.filter((x) => x.status === 'ok');
const statusOf = (r, id) => r.rules.find((x) => x.id === id).status;
const itemsOf = (r) => r.rules.map((x) => x.items.join(' ')).join(' ');

test('exercise 1: the guide says how many things the checker flags in the reply to the one-line wish, and which', () => {
  const r = results.ex1;
  const m = find(guide, /The checker flags (\w+) things\. One is the figure (\d+), in the assistant's own notes under the line of dashes/, 'guide, exercise 1');
  assert.equal(looks(r).length, num(m[1]));
  assert.ok(r.rules.find((x) => x.id === 'numbers').items.some((i) => i.startsWith(m[2] + ' is not in the material')));
  const other = find(guide, /The other is the sentence "([^"]+)", read as money off the invoice\./, 'guide, exercise 1')[1];
  const credit = r.rules.find((x) => x.id === 'credit').items;
  assert.equal(credit.length, 1);
  assert.ok(credit[0].startsWith('Read this sentence: "' + other), credit[0]);
  // "The rest passes it": none of those is in what the checker flags.
  find(guide, /The rest passes it: the receipt it says was sent, the same-day answer, the decision date promised on the manager's behalf, and the three gaps in brackets\./, 'guide, exercise 1');
  for (const words of ['receipt', 'same day', 'decision by', '[']) { assert.ok(!itemsOf(r).includes(words), words); }
  // The testing page, twice, says the same.
  find(how, /\| `recorded\/answers\/ex1-answer\.txt` \| Recorded from claude-haiku-5-5 on 2026-11-24, unchanged \| Two \*Look again\*: the figure 14, /, 'testing page');
  assert.equal(looks(r).length, 2);
  const line = find(how, /\| 1, the recorded reply, through the reply check \| (\d+) OK, (\d+) to look at again, as the guide describes \|/, 'testing page')[0];
  assert.ok(line.includes(C.summaryLine(r).replace(/\.$/, '')), line);
});

test('exercise 1: what the guide says the reply decides and reports is in the reply', () => {
  find(guide, /decides things you did not decide, such as a corrected invoice and an answer the same day, and reports things that did not happen, such as a receipt it says was sent\./, 'guide, exercise 1');
  for (const s of ['We will issue a corrected invoice', 'I will answer the same day', 'I have also sent her your receipt']) { assert.ok(REC.ex1.text.includes(s), s); }
});

test('exercise 2: the guide, the testing page and the README give the recorded answer\'s counts, and its one flag, the length', () => {
  const r = results.ex2;
  const m = find(guide, /with the recorded answer, the check shows (\w+) OK and (\w+) \*Look again\*, for the (\w+)\./, 'guide, exercise 2');
  assert.equal(oks(r).length, num(m[1]));
  assert.equal(looks(r).length, num(m[2]));
  assert.deepEqual(looks(r).map((x) => x.id), [m[3]]);
  const t = find(how, /\| `recorded\/answers\/ex2-answer\.txt` \| Recorded, unchanged \| (\w+) \*OK\* and (\w+) \*Look again\*, for the (\w+)\./, 'testing page');
  assert.deepEqual([num(t[1]), num(t[2]), t[3]], [oks(r).length, looks(r).length, 'length']);
  const readme = find(lib.readText('README.md'), /(\w+) checks pass, and the sentence about the van is still wrong/, 'README');
  assert.equal(num(readme[1]), oks(r).length);
  // The sentence about the loading passes every check: no rule but the length flags anything, and none quotes it.
  const loading = REC.ex2.text.split('\n').find((l) => l.includes('Tom\'s cause'));
  assert.ok(loading);
  for (const x of r.rules) {
    if (x.id !== 'length') { assert.equal(x.status, 'ok', x.id); }
    assert.ok(!x.items.join(' ').includes('left on the van'), x.id);
  }
});

test('exercise 3: answer A passes every automatic check, as the guide, the testing page, the variants and "when things go wrong" say', () => {
  const r = results.A;
  const m = find(guide, /run the automatic check on A: (\w+) OK\./, 'guide, exercise 3');
  assert.equal(oks(r).length, num(m[1]));
  assert.equal(looks(r).length, 0);
  const t = find(how, /\| `recorded\/answers\/ex3-answer-a\.txt` \| Recorded, unchanged \| (\w+) \*OK\* out of (\w+)\./, 'testing page');
  assert.deepEqual([num(t[1]), num(t[2])], [oks(r).length, r.rules.length]);
  find(lib.readText('instructor/variants.md'), /Run the automatic check on A, which passes it on every rule/, 'variants');
  find(lib.readText('instructor/when-things-go-wrong.md'), /why answer A of exercise 3 passes every automatic check and is still wrong/, 'when things go wrong');
});

test('exercise 3: answer B\'s wrong figure is caught by the check of the two groups, not the figure check, and its promised credit is flagged', () => {
  const r = results.B;
  find(guide, /The figure check passes the 12 only because 12 is in the thread as the cup size, 12 oz; being in the material is not the same as coming from it, and the check of the two groups of six is what catches it\./, 'guide, exercise 3');
  find(how, /\| `recorded\/answers\/ex3-answer-b\.txt` \| Answer A, edited: a wrong figure and a breach of the policy planted \| The two planted errors are flagged; the figure check alone would pass the wrong figure\./, 'testing page');
  assert.equal(statusOf(r, 'numbers'), 'ok');
  assert.equal(statusOf(r, 'counts'), 'look');
  assert.equal(statusOf(r, 'credit'), 'look');
  assert.deepEqual(looks(r).map((x) => x.id), ['counts', 'credit']);
});

test('exercise 3: answer C\'s promised day is flagged, and its wrong figure passes every check', () => {
  const r = results.C;
  find(guide, /answer C is answer A edited to promise a delivery day and to use a wrong figure that every automatic check passes: an amount from the thread, used for the wrong thing\./, 'guide, exercise 3');
  find(how, /\| `recorded\/answers\/ex3-answer-c\.txt` \| Answer A, edited: a promised delivery day and a wrong figure planted \| The promised day is flagged; the wrong figure passes every check\./, 'testing page');
  assert.equal(statusOf(r, 'date'), 'look');
  const wrong = C.numberedSentences(answer('C').text)[5];
  assert.match(wrong, /\$312\.00 for the damaged cartons/);
  for (const x of C.checkReply(wrong).rules) { assert.equal(x.status, 'ok', x.id); }
  assert.ok(!itemsOf(r).includes('$312.00'));
});
