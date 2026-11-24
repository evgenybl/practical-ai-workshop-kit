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
  test('meta file is complete, and the answer and its request have the sha256 it states: ' + m, () => {
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

test('no answer is a constructed stand-in any more', () => {
  for (const m of metas) { assert.ok(!/constructed/.test(lib.readText(m)), m); }
});
