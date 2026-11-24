'use strict';
// Files a computer adds by itself, such as .DS_Store, Thumbs.db and desktop.ini, are not part of the kit:
// the tests skip them, git ignores them, and a copy of the kit with them in it still passes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { lib } = require('./helpers');

const STRAY = ['.DS_Store', 'participant/.DS_Store', 'participant/workbook/._index.html', 'recorded/answers/._ex1-answer.txt',
  'instructor/Thumbs.db', 'docs/desktop.ini', '__MACOSX/participant/._handout.html'];

test('.gitignore lists the names a computer adds by itself, and the walk of the files skips each of them', () => {
  const ignored = lib.readText('.gitignore').split('\n').filter((l) => l && !l.startsWith('#'));
  for (const name of ['.DS_Store', '._*', 'Thumbs.db', 'desktop.ini', '__MACOSX/']) { assert.ok(ignored.includes(name), name); }
  for (const rel of STRAY) {
    const name = rel.split('/').pop();
    assert.ok(lib.isStray(name) || rel.split('/').some(lib.isStray), rel);
  }
  for (const name of ['.gitignore', '.gitattributes', '.github', 'index.html', 'ex1-answer.txt']) { assert.ok(!lib.isStray(name), name); }
});

test('a copy of the kit with such files in it still passes every other test', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'workshop-kit-'));
  try {
    fs.cpSync(lib.ROOT, dir, { recursive: true, filter: (src) => !/[\\/](\.git|node_modules)$/.test(src) });
    // Bytes such a file can hold: control characters, and a letter outside English.
    const junk = Buffer.from([0, 0, 0, 1, 66, 117, 100, 49, 0x7f, 0xe9, 13, 10]);
    for (const rel of STRAY) {
      fs.mkdirSync(path.join(dir, ...rel.split('/').slice(0, -1)), { recursive: true });
      fs.writeFileSync(path.join(dir, ...rel.split('/')), junk);
    }
    const others = fs.readdirSync(path.join(dir, 'tests')).filter((f) => f.endsWith('.test.js') && f !== path.basename(__filename)).sort();
    // A test run marks its own child processes; the copy's run is a run of its own, so the mark is taken off.
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'NODE_TEST_CONTEXT'));
    const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...others.map((f) => path.join('tests', f))], { cwd: dir, encoding: 'utf8', env });
    const summary = r.stdout.split('\n').filter((l) => /^not ok|^# (tests|pass|fail) /.test(l)).join('\n');
    assert.equal(r.status, 0, summary);
    assert.match(r.stdout, /^# fail 0$/m, summary);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
