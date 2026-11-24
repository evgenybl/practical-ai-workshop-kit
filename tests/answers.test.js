'use strict';
// Every recorded or edited answer, and every model solution, through the command-line checker;
// and every answer is exactly what its meta file says it is.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const { lib } = require('./helpers');
const runner = require('../tools/run-answers');

const sha256 = (rel) => crypto.createHash('sha256').update(fs.readFileSync(lib.abs(rel))).digest('hex');

for (const c of runner.cases()) {
  test('gives its expected result: ' + c.file, () => {
    const r = runner.runOne(c);
    assert.ok(r.ok, r.problems.join('; '));
  });
}

const metas = lib.listFiles('recorded/answers', (f) => f.endsWith('.meta.json'));
const answerOf = (m) => m.replace(/\.meta\.json$/, '.txt');

test('every answer has a meta file, and every meta file an answer', () => {
  const answers = lib.listFiles('recorded/answers', (f) => f.endsWith('.txt'));
  assert.deepEqual(answers, metas.map(answerOf));
  assert.ok(metas.length >= 5);
});

for (const m of metas) {
  test('meta file is complete; the answer and its request still have the sha256 it states, so neither has changed since it was saved (this does not show where the answer came from): ' + m, () => {
    const meta = JSON.parse(lib.readText(m));
    for (const k of ['exercise', 'kind', 'model', 'recorded_on', 'route', 'request_file', 'request_sha256', 'answer_sha256', 'edits', 'check']) {
      assert.ok(k in meta, k);
    }
    assert.ok(['recorded', 'edited'].includes(meta.kind), 'an answer is either recorded (unchanged) or edited (and says how)');
    for (const k of ['model', 'recorded_on', 'route']) { assert.ok(meta[k], k + ' is named'); }
    assert.equal(sha256(meta.request_file), meta.request_sha256, 'the request has changed since this answer was recorded: record it again');
    assert.equal(sha256(answerOf(m)), meta.answer_sha256, 'the answer file is not the one its meta file describes');
  });
}

for (const m of metas.filter((x) => JSON.parse(lib.readText(x)).kind === 'recorded')) {
  test('a recorded answer is unchanged: no edits, and its length is the one recorded: ' + m, () => {
    const meta = JSON.parse(lib.readText(m));
    assert.equal(meta.edits, 'none');
    assert.ok(!('edit_steps' in meta));
    assert.equal([...fs.readFileSync(lib.abs(answerOf(m)), 'utf8')].length, meta.answer_characters);
  });
}

for (const m of metas.filter((x) => JSON.parse(lib.readText(x)).kind === 'edited')) {
  test('an edited answer is exactly the recorded answer plus the edits its meta file declares: ' + m, () => {
    const meta = JSON.parse(lib.readText(m));
    const source = JSON.parse(lib.readText(meta.edited_from.replace(/\.txt$/, '.meta.json')));
    assert.equal(source.kind, 'recorded', 'an edited answer starts from a recorded one');
    assert.equal(meta.model, source.model);
    assert.equal(meta.recorded_on, source.recorded_on);
    assert.ok(meta.edits.length > 40 && meta.edits !== 'none', 'the edits are described in words');
    const rebuilt = lib.applyEdits(fs.readFileSync(lib.abs(meta.edited_from), 'utf8'), meta.edit_steps);
    assert.equal(fs.readFileSync(lib.abs(answerOf(m)), 'utf8'), rebuilt);
  });
}

test('every answer is recorded or edited from a recording: none is described as constructed', () => {
  for (const m of metas) { assert.ok(!/constructed/.test(lib.readText(m)), m); }
});

// ---- what the kit says about the answers, held against the answers themselves -------------

test('the model answers page says of the strong brief\'s limits only what is so of the reply to the one-line wish', () => {
  const { CASE, REC, C } = require('./helpers');
  const page = lib.readText('solutions/README.md');
  const brief = page.slice(page.indexOf('**The brief (exercise 1).**'), page.indexOf('\n', page.indexOf('**The brief (exercise 1).**')));
  assert.doesNotMatch(brief, /Each limit would have prevented/);
  // Four "Do not" sentences, then "Use only facts from the e-mails and the policy", as the page quotes it.
  const limits = C.splitSentences(CASE.briefs.reply.limits);
  assert.equal(limits.filter((s) => /^Do not /.test(s)).length, 4);
  assert.match(limits[limits.length - 1], /^Use only facts from the e-mails and the policy;/);
  assert.match(brief, /plus "Use only facts from the e-mails and the policy"\./);
  // The two problems the page says the limits rule out are in the reply; the two mistakes it says the reply did not make, it did not.
  const reply = REC.ex1.text;
  assert.ok(reply.includes('We will issue a corrected invoice that removes those cartons.'));
  assert.ok(reply.includes('I have also sent her your receipt'));
  const r = C.checkReply(reply);
  assert.equal(r.rules.find((x) => x.id === 'date').status, 'ok');
  assert.equal(r.rules.find((x) => x.id === 'costs').status, 'ok');
  assert.match(brief, /the corrected invoice, money off that the policy does not allow \(the fourth limit; rule 2 sends missing goods on the next run\), and the receipt it says was sent, a fact from nowhere \(the last sentence\)\. The second and third limits, no delivery day and no payment for the cups bought elsewhere, guard against mistakes that reply did not make\./);
  assert.ok(reply.includes('I will answer the same day') && reply.includes('Dana will give you her decision by'));
});

test('the model summary carries a message number for every line that states a fact, as the model answers page says', () => {
  const { C } = require('./helpers');
  const summary = lib.readText('solutions/ex2-strong-summary.txt').trim().split('\n').filter((l) => l.startsWith('- '));
  const facts = summary.filter((l) => !/^- Your decision:/.test(l));
  for (const l of facts) { assert.match(l, /\(msg [\d, ]+\)\.?$/, l); }
  assert.match(summary[summary.length - 1], /^- Your decision:/);
  assert.match(lib.readText('solutions/README.md'), /Every line that states a fact ends with the messages it comes from, and every citation is right; the last line names the decision, not a fact\./);
  assert.equal(C.checkSummary(lib.readText('solutions/ex2-strong-summary.txt')).rules.find((x) => x.id === 'citations').status, 'ok');
});
