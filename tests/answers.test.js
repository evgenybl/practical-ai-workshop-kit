'use strict';
// Every recorded or constructed answer, and every model solution, through the command-line checker.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const { lib } = require('./helpers');
const runner = require('../tools/run-answers');

for (const c of runner.cases()) {
  test('gives its expected result: ' + c.file, () => {
    const r = runner.runOne(c);
    assert.ok(r.ok, r.problems.join('; '));
  });
}

const metas = lib.listFiles('recorded/answers', (f) => f.endsWith('.meta.json'));

test('every answer has a meta file, and every meta file an answer', () => {
  const answers = lib.listFiles('recorded/answers', (f) => f.endsWith('.txt'));
  assert.deepEqual(answers.map((f) => f.replace(/\.txt$/, '')), metas.map((f) => f.replace(/\.meta\.json$/, '')));
  assert.ok(metas.length >= 5);
});

for (const m of metas) {
  test('meta file is complete and honest: ' + m, () => {
    const meta = JSON.parse(lib.readText(m));
    for (const k of ['exercise', 'kind', 'model', 'date', 'route', 'request_file', 'request_sha256', 'edits', 'check']) {
      assert.ok(k in meta, k);
    }
    assert.ok(['constructed', 'recorded'].includes(meta.kind));
    if (meta.kind === 'constructed') {
      assert.equal(meta.model, null);
      assert.equal(meta.date, null);
      assert.equal(meta.route, null);
      assert.match(meta.constructed_note, /No assistant produced this text/);
    } else {
      for (const k of ['model', 'date', 'route']) { assert.ok(meta[k], k + ' is named for a recording'); }
    }
    const hash = crypto.createHash('sha256').update(fs.readFileSync(lib.abs(meta.request_file))).digest('hex');
    assert.equal(meta.request_sha256, hash, 'the request has changed since this answer was made: record it again');
  });
}
