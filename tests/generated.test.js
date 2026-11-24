'use strict';
// Every generated file is current: the single-file workbook, the answer key, the request files, the case copies.
const test = require('node:test');
const assert = require('node:assert/strict');
const { lib, REC, C } = require('./helpers');
const build = require('../tools/build');

const recorded = build.buildRecorded();
const files = build.buildDocuments(recorded);

for (const [rel, text] of Object.entries(files)) {
  test('generated and current: ' + rel, () => {
    assert.ok(lib.exists(rel), rel + ' exists');
    assert.equal(lib.readText(rel), text, rel + ' is out of date: run node tools/build.js');
  });
}

test('the answer key equals the workbook\'s own key, sentence by sentence and question by question', () => {
  const key = lib.readText('instructor/answer-key.md');
  const cell = (s) => String(s).replace(/\|/g, '\\|');
  for (const a of REC.ex3) {
    const sentences = C.numberedSentences(a.text);
    a.key.forEach((k, i) => {
      const label = k.accept.map((l) => C.LABELS.find((x) => x.id === l).label).join(' or ');
      const row = '| ' + a.id + (i + 1) + ' | ' + cell(sentences[i]) + ' | ' + label + ' | ' + cell(k.reason) + ' |';
      assert.ok(key.includes(row), a.id + (i + 1));
    });
  }
  const { CASE } = require('./helpers');
  for (const s of CASE.snippets) {
    const piles = s.accept.map((id) => CASE.piles.find((p) => p.id === id).label).join(' or ');
    assert.ok(key.includes('| ' + s.n + ' | ' + cell(s.title) + ' | ' + piles + ' | ' + cell(s.reason) + ' |'), 'snippet ' + s.n);
  }
  for (const q of CASE.quiz) {
    const best = q.options.find((o) => o.correct);
    assert.ok(key.includes('| ' + q.n + ' | ' + q.objective + ' | ' + best.key + ': '), 'question ' + q.n);
  }
});

test('the single-file workbook carries the current page, style and scripts', () => {
  const single = lib.readText('participant/workbook-single-file.html');
  for (const f of ['style.css', 'case-data.js', 'recorded-answers.js', 'checker.js', 'workbook.js']) {
    const body = lib.readText('participant/workbook/' + f).replace(/<\/script/gi, '<\\/script');
    assert.ok(single.includes(body), f);
  }
});

test('the request files are exactly what the workbook shows', () => {
  assert.equal(lib.readText('recorded/requests/ex2-request.txt'), C.requestText('summary'));
  assert.equal(lib.readText('recorded/requests/ex3-request.txt'), C.requestText('reply'));
});

// The key, written out by hand a second time. A change to the key in the data must be made here too,
// so that no single edit can flip an answer unnoticed.
const LITERAL_KEY = {
  marks: {
    A: ['fine', 'fine', 'fine', 'fine|material', 'fine', 'material', 'material|fine'],
    B: ['fine', 'fine', 'figure', 'policy'],
    C: ['fine', 'fine', 'fine', 'policy|material', 'fine', 'figure', 'material|fine']
  },
  piles: { 1: 'fine', 2: 'fine', 3: 'remove|never', 4: 'remove|never', 5: 'remove|never', 6: 'never', 7: 'never', 8: 'never' },
  quiz: { 1: 'D', 2: 'B', 3: 'A', 4: 'C', 5: 'A', 6: 'D', 7: 'C', 8: 'B', 9: 'C', 10: 'D' }
};

test('the key in the data equals the key written out by hand in this test', () => {
  const { CASE } = require('./helpers');
  const marks = {};
  for (const a of REC.ex3) { marks[a.id] = a.key.map((k) => k.accept.join('|')); }
  assert.deepEqual(marks, LITERAL_KEY.marks);
  const piles = {};
  for (const s of CASE.snippets) { piles[s.n] = s.accept.join('|'); assert.equal(s.pile, s.accept[0], 'snippet ' + s.n); }
  assert.deepEqual(piles, LITERAL_KEY.piles);
  const quiz = {};
  for (const q of CASE.quiz) { quiz[q.n] = q.options.find((o) => o.correct).key; }
  assert.deepEqual(quiz, LITERAL_KEY.quiz);
});
