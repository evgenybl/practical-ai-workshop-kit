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

test('a date counts as its parts', () => {
  assert.deepEqual(values('5 March'), [5]);
  assert.deepEqual(values('05/03'), [5, 3]);
  assert.deepEqual(values('2025-03-05'), [2025, 3, 5]);
  assert.deepEqual(values('05.03.2025'), [5, 3, 2025]);
  assert.deepEqual(values('at 10:30'), [10, 30]);
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
