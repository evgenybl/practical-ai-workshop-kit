'use strict';
// How the checker reads figures and sentences.
const test = require('node:test');
const assert = require('node:assert/strict');
const { C } = require('./helpers');

const values = (t) => C.extractNumbers(t).map((n) => n.value);

test('1,250.00 and 1250 are the same figure', () => {
  assert.deepEqual(values('1,250.00'), [1250]);
  assert.deepEqual(values('1250'), [1250]);
  assert.ok(C.sameNumber(values('$1,250.00')[0], values('1250')[0]));
});

test('decimals compare as numbers: 36.50 is 36.5', () => {
  assert.deepEqual(values('$36.50 a carton'), [36.5]);
  assert.ok(C.sameNumber(values('36.50')[0], values('36.5')[0]));
});

test('a date written with figures only is read as a date, not as figures', () => {
  assert.deepEqual(values('5 March'), [5]);
  for (const text of ['05/03', '2025-03-05', '05.03.2025', '5/3/25']) {
    assert.deepEqual(values(text), [], text);
    const d = C.extractDates(text);
    assert.equal(d.length, 1, text);
    assert.deepEqual([d[0].day, d[0].month], [5, 3], text);
  }
  assert.deepEqual(values('at 10:30'), [10, 30]);
});

test('message labels, rule numbers and list numbers are pointers, not figures', () => {
  assert.deepEqual(values('As message 4 says, under rules 5 and 6, see point 2.'), []);
  assert.deepEqual(values('1. First point\n2) Second point'), []);
  assert.ok(!C.threadNumbers.includes(1) && !C.threadNumbers.includes(2), 'the "Message N" labels of the thread are not allowed figures');
  assert.ok(!C.policyNumbers.includes(7), 'the policy\'s rule numbers are not allowed figures');
});

test('identifiers give their digits; a hyphen is not a minus sign', () => {
  assert.deepEqual(values('order SO-20417 and INV-7731'), [20417, 7731]);
});

test('a figure written in words is not read', () => {
  assert.deepEqual(values('six cartons, twelve in all'), []);
});

test('a comma between figures separates them; only groups of three digits are thousands', () => {
  assert.deepEqual(values('6, 34 and 40'), [6, 34, 40]);
  assert.deepEqual(values('6,34'), [6, 34]);
  assert.deepEqual(values('12,000'), [12000]);
});

test('message citations are not figures', () => {
  assert.deepEqual(values('$531.00 (msg 5)'), [531]);
  assert.deepEqual(values('kept it (msg 2, 3)'), []);
  assert.deepEqual(values('see (messages 4 and 5)'), []);
  const cites = C.findCitations('a (msg 4, 5) b [msg 3]');
  assert.deepEqual(cites.map((c) => c.messages), [[4, 5], [3]]);
});

test('a decimal point does not end a sentence; a full stop does', () => {
  assert.deepEqual(C.splitSentences('It costs $1,820.00. It is late.'), ['It costs $1,820.00.', 'It is late.']);
  assert.deepEqual(C.splitSentences('She said "no." Then she left.'), ['She said "no."', 'Then she left.']);
});

test('greetings and sign-offs are not numbered sentences', () => {
  const text = 'Dear Mira,\n\nFirst sentence. Second one?\n\nKind regards,\nTom';
  assert.deepEqual(C.numberedSentences(text), ['First sentence.', 'Second one?']);
});

test('typographic quotes and dashes are read as plain ones', () => {
  const curly = 'We don' + String.fromCharCode(0x2019) + 't promise ' + String.fromCharCode(0x2014) + ' ever.';
  assert.equal(C.plain(curly), 'We don\'t promise - ever.');
});

test('words are counted without message citations', () => {
  assert.equal(C.countWords('One two three (msg 2).'), 3);
  assert.equal(C.countWords('- A bullet: $531.00 asked.'), 4);
});

test('a long, unclosed citation is read in a few milliseconds, not in seconds', () => {
  // Before the fix, each item added to "(msg 1 and 2 and 2 ..." doubled the time: 24 items took over five seconds.
  const unclosed = '(msg 1' + ' and 2'.repeat(22);
  const start = process.hrtime.bigint();
  C.findCitations(unclosed);
  C.extractNumbers(unclosed);
  C.checkSummary(unclosed);
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  assert.ok(ms < 250, 'took ' + ms.toFixed(1) + ' ms');
  assert.deepEqual(C.findCitations('(msg 1 and 2 and 3)')[0].messages, [1, 2, 3]);
  assert.deepEqual(C.findCitations('(messages 4, msg 5)')[0].messages, [4, 5]);
});
