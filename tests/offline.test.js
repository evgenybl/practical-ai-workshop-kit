'use strict';
// The participant's files reach no network address: no request, no remote script, style, font or image.
const test = require('node:test');
const assert = require('node:assert/strict');
const { lib } = require('./helpers');

const files = lib.walk('participant').filter((f) => /\.(html|js|css)$/.test(f));

// Written in pieces so that this file does not match itself.
const FORBIDDEN = [
  ['a fetch call', new RegExp('fet' + 'ch\\s*\\(')],
  ['XMLHttpRequest', new RegExp('XMLHttp' + 'Request')],
  ['WebSocket', new RegExp('Web' + 'Socket')],
  ['sendBeacon', new RegExp('send' + 'Beacon')],
  ['EventSource', new RegExp('Event' + 'Source')],
  ['a remote src or href', /\b(src|href)\s*=\s*["']?\s*(https?:)?\/\//i],
  ['a remote url() in CSS', /url\(\s*["']?\s*(https?:)?\/\//i],
  ['an @import', /@import/i],
  ['any web address', new RegExp('https?' + ':\\/\\/', 'i')]
];

test('the participant folder holds the workbook, its single-file copy and the handout', () => {
  for (const f of ['participant/workbook/index.html', 'participant/workbook-single-file.html', 'participant/handout.html']) {
    assert.ok(files.includes(f), f);
  }
});

for (const f of files) {
  test('no network address in ' + f, () => {
    const text = lib.readText(f);
    for (const [what, re] of FORBIDDEN) { assert.ok(!re.test(text), f + ' contains ' + what); }
  });
}

test('every local file the workbook loads is in its own folder', () => {
  const html = lib.readText('participant/workbook/index.html');
  const refs = [...html.matchAll(/\b(?:src|href)="([^"#][^"]*)"/g)].map((m) => m[1]);
  assert.ok(refs.length >= 5);
  for (const r of refs) {
    assert.ok(!r.includes('/') && !r.includes('\\'), r + ' must sit next to index.html');
    assert.ok(lib.exists('participant/workbook/' + r), r);
  }
});

test('the single-file copy loads nothing at all', () => {
  const html = lib.readText('participant/workbook-single-file.html');
  assert.ok(!/<script\b[^>]*\bsrc=/i.test(html));
  assert.ok(!/<link\b[^>]*\bhref=/i.test(html));
});
