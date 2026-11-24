#!/usr/bin/env node
'use strict';
/*
 * Runs every recorded or edited answer, and every model solution, through
 * the command-line checker (tools/check.js), and compares each result with the
 * result its meta file (or solutions/expected.json) says it should have.
 *
 *   node tools/run-answers.js
 *
 * Exit code 0 when every answer gives its expected result, 1 otherwise.
 */
const { spawnSync } = require('child_process');
const lib = require('./lib');

function cases() {
  const list = [];
  for (const metaRel of lib.listFiles('recorded/answers', (f) => f.endsWith('.meta.json'))) {
    const meta = JSON.parse(lib.readText(metaRel));
    list.push({ file: metaRel.replace(/\.meta\.json$/, '.txt'), kind: meta.kind, exercise: meta.check.exercise, expect: meta.check.expect });
  }
  const expected = JSON.parse(lib.readText('solutions/expected.json'));
  for (const [name, e] of Object.entries(expected.files)) {
    list.push({ file: 'solutions/' + name, kind: 'model solution', exercise: e.exercise, expect: e.expect });
  }
  return list;
}

function runOne(c) {
  const out = spawnSync(process.execPath, [lib.abs('tools/check.js'), c.exercise, lib.abs(c.file), '--json'], { encoding: 'utf8' });
  if (out.status === 2 || !out.stdout) { return { ok: false, problems: ['the checker could not run: ' + (out.stderr || '').trim()] }; }
  const result = JSON.parse(out.stdout);
  const got = {};
  result.rules.forEach((r) => { got[r.id] = r.status; });
  const problems = [];
  if (c.expect === 'all-ok') {
    result.rules.filter((r) => r.status !== 'ok').forEach((r) => problems.push(r.id + ': expected ok, got ' + r.status));
  } else {
    for (const [id, want] of Object.entries(c.expect)) {
      if (got[id] !== want) { problems.push(id + ': expected ' + want + ', got ' + (got[id] || 'no such rule')); }
    }
    for (const id of Object.keys(got)) {
      if (!(id in c.expect)) { problems.push(id + ': the checker has this rule, but the meta file gives no expected result'); }
    }
  }
  const exitWanted = result.rules.some((r) => r.status === 'look') ? 1 : 0;
  if (out.status !== exitWanted) { problems.push('exit code ' + out.status + ', expected ' + exitWanted); }
  return { ok: problems.length === 0, problems, result };
}

function main() {
  let failed = 0;
  const all = cases();
  for (const c of all) {
    const r = runOne(c);
    const label = c.file + ' (exercise ' + c.exercise + ', ' + c.kind + ')';
    if (r.ok) {
      const n = r.result.rules.length;
      const look = r.result.rules.filter((x) => x.status === 'look').map((x) => x.id);
      console.log('as expected  ' + label + ': ' + n + (n === 1 ? ' rule, ' : ' rules, ') + (look.length ? 'to look at again: ' + look.join(', ') : 'nothing to look at again'));
    } else {
      failed++;
      console.log('NOT as expected  ' + label);
      r.problems.forEach((p) => console.log('    ' + p));
    }
  }
  console.log((all.length - failed) + ' of ' + all.length + ' answers gave their expected result.');
  return failed ? 1 : 0;
}

module.exports = { cases, runOne };
if (require.main === module) { process.exitCode = main(); }
