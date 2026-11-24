'use strict';
// The checker's honesty: what it says about its own limits, how it words a pass, and what it says about an empty box.
const test = require('node:test');
const assert = require('node:assert/strict');
const { lib, C } = require('./helpers');

const html = lib.readText('participant/workbook/index.html');
const solution = (f) => lib.readText('solutions/' + f);

// The checks whose rules are signs found or not found in a text (not a key to compare with).
const TEXT_CHECKS = {
  reply: () => C.checkReply(solution('ex1-strong-reply.txt')),
  summary: () => C.checkSummary(solution('ex2-strong-summary.txt')),
  request: () => C.checkRequest(solution('ex2-strong-request.txt')),
  brief: () => C.checkBrief(C.parseBrief(solution('ex1-strong-brief.txt'))),
  extract: () => C.checkExtract(solution('ex4-extract.txt')),
  template: () => C.checkTemplate(solution('ex5-strong-template.txt'))
};

test('the checker\'s sentences about its own limits are on every result that needs them', () => {
  const signs = 'The checks for promises look for words that usually mean a promise. They can miss one, or flag a sentence that is fine. Read each flagged sentence yourself and decide.';
  const words = 'Figures written in words, such as "six", are not checked.';
  for (const r of [TEXT_CHECKS.reply(), TEXT_CHECKS.summary(), C.checkReply(''), C.checkSummary('')]) {
    assert.ok(r.notes.includes(signs), r.exercise + ': the note on word signs');
    assert.ok(r.notes.some((n) => n.startsWith(words)), r.exercise + ': the note on figures in words');
  }
  assert.ok(TEXT_CHECKS.brief().notes[0].startsWith('This check looks for the presence of each part by simple signs. It does not judge whether your brief is good'));
  assert.match(TEXT_CHECKS.extract().notes[0], /It does not know names in general: with your own data, you are the check\.$/);
  assert.match(TEXT_CHECKS.extract().rules[0].message, /I cannot recognise other names or personal details: read the text yourself before you paste it\.$/);
  assert.match(TEXT_CHECKS.reply().rules.find((r) => r.id === 'numbers').message, /Being there does not make it right/);
  // And on the page itself.
  assert.match(html, /<strong>The checks are helpers\.<\/strong> Each <em>Check<\/em> button looks for simple signs and says what it found\. It can miss things, and it can flag things that are fine\. It points; you decide\./);
  assert.match(html, /<strong>A figure written in words, such as "six", is not checked\.<\/strong>/);
});

test('a pass is worded as what was found or not found, never as a verdict on the text', () => {
  for (const [name, run] of Object.entries(TEXT_CHECKS)) {
    const r = run();
    for (const x of r.rules) {
      assert.equal(x.status, 'ok', name + ' ' + x.id + ' (the model solution passes)');
      assert.match(x.message, /\bI (found|did not find|counted|checked)\b/, name + ' ' + x.id + ': ' + x.message);
      assert.doesNotMatch(x.message, /Nothing here|is correct|is right\b|is fine\b|is safe/, name + ' ' + x.id);
    }
  }
  const source = lib.readText('participant/workbook/checker.js');
  assert.doesNotMatch(source, /'Nothing here/);
});

test('an empty box says "This box is empty" on every rule, and passes none', () => {
  const empties = [C.checkReply(''), C.checkSummary(' '), C.checkRequest(''), C.checkTemplate('\n'), C.checkExtract(''), C.checkBrief({})];
  for (const r of empties) {
    assert.ok(r.rules.length > 0);
    for (const x of r.rules) {
      assert.notEqual(x.status, 'ok', r.exercise + ' ' + x.id);
      assert.match(x.message, /^This box is empty\./, r.exercise + ' ' + x.id);
    }
  }
});
