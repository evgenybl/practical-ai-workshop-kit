'use strict';
// The workbook page: its logic, run in a small fake page (tests/fake-dom.js), and its markup.
const test = require('node:test');
const assert = require('node:assert/strict');
const { lib, CASE, REC, C, F } = require('./helpers');
const { openPage, closePage, fakeStorage, type, choose } = require('./fake-dom');

const html = lib.readText('participant/workbook/index.html');
const css = lib.readText('participant/workbook/style.css');

test.afterEach(() => closePage());

test('the page shows the case from the data file', () => {
  const { $ } = openPage(html);
  assert.equal($('thread-text').textContent, CASE.threadText);
  assert.equal($('policy-text').textContent, CASE.policyText);
  const tbody = $('orders-table').children.find((c) => c.tagName === 'TBODY');
  assert.equal(tbody.children.length, CASE.orders.rows.length);
  assert.equal($('ex1-answer').textContent, REC.ex1.text);
  // Exercise 2 starts without the line that asks for sources: the participant writes it.
  assert.equal($('ex2-request').value, C.requestText('summary', { withoutCiteLine: true }));
  assert.ok(!$('ex2-request').value.includes(CASE.briefs.summary.citeLine));
});

test('every [data-fact] is filled from the data file', () => {
  const { doc } = openPage(html);
  const facts = doc.querySelectorAll('[data-fact]');
  assert.ok(facts.length >= 5);
  for (const e of facts) { assert.ok(e.textContent.length > 0, e.getAttribute('data-fact')); }
});

test('exercise 1: an empty brief gets five "Look again"; the model brief gets five "OK"', () => {
  const { $ } = openPage(html);
  $('ex1-check').click();
  assert.match($('ex1-result').textContent, /0 OK, 5 to look at again/);
  const model = C.parseBrief(C.requestText('reply'));
  for (const k of C.PARTS) { type($('ex1-' + k), model[k]); }
  $('ex1-check').click();
  assert.match($('ex1-result').textContent, /5 OK, 0 to look at again/);
});

test('exercise 1: "Put the thread in this box" fills the material box', () => {
  const { $ } = openPage(html);
  $('ex1-put-thread').click();
  assert.equal($('ex1-material').value, CASE.threadText);
});

test('exercise 1: the recorded reply can be checked, and the instructor\'s list shown', () => {
  const { $ } = openPage(html);
  $('ex1-reply-check').click();
  assert.ok($('ex1-reply-result').textContent.startsWith(C.summaryLine(C.checkReply(REC.ex1.text))));
  assert.equal($('ex1-issues').hidden, true);
  $('ex1-issues-show').click();
  assert.equal($('ex1-issues').hidden, false);
  assert.equal($('ex1-issues-show').getAttribute('aria-expanded'), 'true');
});

test('exercise 2: the recorded answer is labelled with its model and date, and checked like any other', () => {
  const { $ } = openPage(html);
  $('ex2-use-recorded').click();
  assert.equal($('ex2-answer').value, REC.ex2.text);
  assert.ok($('ex2-record').textContent.startsWith('Recorded: one model\'s answer (' + REC.ex2.model + ', ' + REC.ex2.recorded_on + '), unchanged.'));
  assert.match($('ex2-record').textContent, /your assistant will answer differently/);
  $('ex2-check').click();
  assert.ok($('ex2-result').textContent.startsWith(C.summaryLine(C.checkSummary(REC.ex2.text))));
});

test('exercise 3: one radio group per numbered sentence, marked against the key', () => {
  const { doc, $ } = openPage(html);
  const groups = REC.ex3.reduce((n, a) => n + a.key.length, 0);
  assert.equal(doc.querySelectorAll('input[data-choice]').filter((e) => e.name.startsWith('mark-')).length, groups * C.LABELS.length);
  REC.ex3.forEach((a) => a.key.forEach((k, i) => choose(doc, 'mark-' + a.id + (i + 1), k.accept[0])));
  $('ex3-check').click();
  assert.match($('ex3-result').textContent, new RegExp('You agree with the key on ' + groups + ' of the ' + groups + ' sentences you marked'));
});

test('exercise 3: each answer says where it came from, and the optional answer sits under its own heading', () => {
  const { doc, $ } = openPage(html);
  const text = $('ex3-answers').textContent;
  // The page says which answers are edited: every edited answer, and only those, carries the word.
  const blocks = text.split(/(?=Answer [A-Z]Recorded|Answer [A-Z]Edited)/).filter((b) => /^Answer [A-Z]/.test(b));
  assert.equal(blocks.length, REC.ex3.length);
  REC.ex3.forEach((a, i) => {
    assert.ok(blocks[i].startsWith('Answer ' + a.id + (a.kind === 'edited' ? 'Edited: no assistant wrote this.' : 'Recorded: one model')), a.id);
  });
  assert.ok(REC.ex3.some((a) => a.kind === 'edited') && REC.ex3.some((a) => a.kind === 'recorded'));
  assert.match(text, /For those who finish early, or as homework/);
  assert.ok(text.indexOf('For those who finish early') > text.indexOf('Answer B'));
  assert.equal(doc.querySelectorAll('[data-fact]').length > 0, true);
});

test('exercise 4: the stand-in helper, the check, the example answer and the map-back', () => {
  const { doc, $ } = openPage(html);
  for (const [col, v] of Object.entries(CASE.orders.recommendedChoices)) { choose(doc, 'col-' + col, v); }
  $('ex4-prepare').click();
  assert.equal(C.findPersonal($('ex4-extract').value).length, 0);
  $('ex4b-check').click();
  assert.match($('ex4b-result').textContent, /1 OK, 0 to look at again/);
  $('ex4-example').click();
  assert.match($('ex4-answer').value, /Customer \d\d has ordered/);
  $('ex4-mapback').click();
  assert.match($('ex4-mapback-result').textContent, new RegExp(F.customer));
});

test('exercise 4: every column starts on "Choose", and nothing is prepared until each is chosen', () => {
  const { doc, $ } = openPage(html);
  for (const c of CASE.orders.columns) { assert.equal($('col-' + c.id).value, '', c.id); }
  $('ex4-prepare').click();
  assert.equal($('ex4-extract').value, '');
  assert.match($('ex4b-result').textContent, /^Choose what to do with every column first\. Still to choose: /);
  for (const c of CASE.orders.columns.slice(1)) { choose(doc, 'col-' + c.id, 'keep'); }
  $('ex4-prepare').click();
  assert.equal($('ex4-extract').value, '');
  assert.ok($('ex4b-result').textContent.endsWith('Still to choose: ' + CASE.orders.columns[0].label + '.'));
  $('ex4-mapback').click();
  assert.match($('ex4-mapback-result').textContent, /^Press Prepare the extract first/);
});

test('exercise 4: keeping every column is caught before pasting', () => {
  const { doc, $ } = openPage(html);
  for (const c of CASE.orders.columns) { choose(doc, 'col-' + c.id, 'keep'); }
  $('ex4-prepare').click();
  $('ex4b-check').click();
  assert.match($('ex4b-result').textContent, /Do not paste this yet/);
});

test('exercise 5: the exercise 2 request goes in the box, and is caught as not yet a template', () => {
  const { $ } = openPage(html);
  type($('ex2-request'), C.requestText('summary'));
  $('ex5-put').click();
  assert.equal($('ex5-template').value, $('ex2-request').value, 'the participant\'s own request goes in');
  $('ex5-check').click();
  assert.match($('ex5-result').textContent, /0 OK, 2 to look at again/);
});

test('the ten questions are shown and marked', () => {
  const { doc, $ } = openPage(html);
  CASE.quiz.forEach((q) => choose(doc, 'q-' + q.n, q.options.find((o) => o.correct).key));
  $('quiz-check').click();
  assert.match($('quiz-result').textContent, /You chose the best answer to 10 of 10/);
});

test('answers are kept in this browser\'s storage and come back when the page is opened again', () => {
  const storage = fakeStorage();
  let p = openPage(html, storage);
  type(p.$('ex1-task'), 'Draft my reply.');
  choose(p.doc, 'q-1', 'D');
  const saved = JSON.parse(storage.getItem(p.page.STORAGE_KEY));
  assert.equal(saved.fields['ex1-task'], 'Draft my reply.');
  assert.equal(saved.choices['q-1'], 'D');
  closePage();
  p = openPage(html, storage);
  assert.equal(p.$('ex1-task').value, 'Draft my reply.');
  assert.equal(p.doc.querySelector('input[name="q-1"]:checked').value, 'D');
});

test('"Clear all my answers" empties the boxes and the storage', () => {
  const storage = fakeStorage();
  const p = openPage(html, storage);
  type(p.$('ex5-template'), 'something');
  p.$('clear-all').click();
  assert.equal(p.$('ex5-template').value, '');
  assert.equal(storage.getItem(p.page.STORAGE_KEY), null);
});

test('"Save my answers as a text file" works, and the text holds every box', () => {
  const p = openPage(html);
  type(p.$('ex1-notes'), 'It promises the credit.');
  p.$('save-text').click();
  // A page cannot know whether the browser saved the file, so the status does not say it did.
  assert.match(p.$('answers-status').textContent, /^Your browser was asked to save my-workshop-answers\.txt/);
  assert.match(p.$('answers-status').textContent, /If no file appears, it was blocked/);
  assert.doesNotMatch(p.$('answers-status').textContent, /^Saved/);
  const text = p.page.answersToText({ fields: { 'ex1-notes': 'It promises the credit.' }, choices: { 'q-2': 'B' } }, '2026-01-01 10:00');
  assert.match(text, /Saved: 2026-01-01 10:00/);
  assert.match(text, /== Exercise 1, step 1: my list of problems ==\nIt promises the credit\./);
  for (const [, label] of p.page.FIELDS) { assert.ok(text.includes('== ' + label + ' =='), label); }
  assert.match(text, /== The ten questions: my answers ==\n2: B/);
});

test('the example answer for the map-back names the customers who ordered more than once', () => {
  const page = require('../participant/workbook/workbook.js');
  const ex = C.makeExtract(CASE.orders.recommendedChoices);
  const back = C.mapBack(page.exampleMapBackAnswer(ex.key), ex.key);
  const repeat = [...new Set(CASE.orders.rows.map((r) => r.business))].filter((b) => CASE.orders.rows.filter((r) => r.business === b).length > 1);
  for (const b of repeat) { assert.ok(back.includes(b), b); }
  assert.equal(page.exampleMapBackAnswer({}), null);
});

// ---- the markup ------------------------------------------------------------------

test('every box in the page has a label', () => {
  const ids = [...html.matchAll(/<(textarea|select|input)\b[^>]*\bid="([^"]+)"/g)].map((m) => m[2]);
  assert.ok(ids.length >= 10);
  for (const id of ids) { assert.match(html, new RegExp('<label for="' + id + '"'), id); }
});

test('every id in the page is unique, and every id the script looks up exists', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  const js = lib.readText('participant/workbook/workbook.js');
  for (const m of js.matchAll(/\$\('([\w-]+)'\)/g)) { assert.ok(ids.includes(m[1]), m[1]); }
});

test('every button is a plain button, and the page declares its language and scale', () => {
  for (const b of html.matchAll(/<button\b[^>]*>/g)) { assert.match(b[0], /type="button"/); }
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="viewport"/);
});

test('focus is visible: the stylesheet gives :focus-visible a 3px outline, and nothing removes an outline', () => {
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px solid[^}]*\}/);
  assert.doesNotMatch(css, /outline(-style|-width)?:\s*(none|0)\b/);
  const widths = [...css.matchAll(/outline:\s*(\d+)px/g)].map((m) => Number(m[1]));
  assert.ok(widths.length >= 2 && widths.every((w) => w >= 2), 'every outline is at least 2px: ' + widths.join(', '));
});

test('text and background colours have a contrast ratio of at least 4.5 to 1', () => {
  const vars = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const pairs = [['text', 'bg'], ['muted', 'bg'], ['muted', 'panel'], ['accent', 'bg'], ['ok-text', 'ok-bg'], ['look-text', 'look-bg'],
    ['note-text', 'note-bg'], ['warn-text', 'warn-bg']];
  for (const [fg, bg] of pairs) { assert.ok(ratio(vars[fg], vars[bg]) >= 4.5, fg + ' on ' + bg + ': ' + ratio(vars[fg], vars[bg]).toFixed(2)); }
  assert.ok(ratio('#ffffff', vars.accent) >= 4.5, 'button text');
});

test('the scripts load in order, as classic scripts', () => {
  const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  assert.deepEqual(srcs, ['case-data.js', 'recorded-answers.js', 'checker.js', 'workbook.js']);
  assert.ok(!/type="module"/.test(html));
  for (const f of srcs) { assert.ok(!/^\s*(import|export)\s/m.test(lib.readText('participant/workbook/' + f)), f); }
});

// ---- added with the first review -----------------------------------------------------

test('exercise 2: the participant adds the line that asks for sources, and the request check says so', () => {
  const { $ } = openPage(html);
  $('ex2-request-check').click();
  assert.match($('ex2-request-result').textContent, /A source for every fact: I found no line that asks/);
  type($('ex2-request'), C.requestText('summary'));
  $('ex2-request-check').click();
  assert.match($('ex2-request-result').textContent, /2 OK, 0 to look at again/);
});

test('exercise 1: the two buttons are numbered in the order they are meant to be pressed, and the case says who you are', () => {
  const show = html.indexOf('id="ex1-issues-show"');
  const run = html.indexOf('id="ex1-reply-check"');
  assert.ok(show > 0 && run > show);
  assert.match(html, /id="ex1-issues-show"[^>]*>1\. Show the instructor's list of problems</);
  assert.match(html, /id="ex1-reply-check">2\. Run the checker on this reply</);
  assert.match(html, /You are <span data-fact="staff"><\/span> \(invented\), in customer service/);
  assert.match(html, /Write a short list, one line for each problem you find/);
  assert.match(html, /Press the button to put the whole thread in this box; do not type a note in its place\./);
});

test('exercise 3 has a box for what the checker misses, and exercise 2 and 3 boxes are saved', () => {
  const { $, page } = openPage(html);
  assert.match(html, /<label for="ex3-misses">Which errors does the checker miss, and why\?<\/label>/);
  const ids = page.FIELDS.map((f) => f[0]);
  for (const id of ['ex2-request', 'ex3-misses']) { assert.ok(ids.includes(id), id); assert.ok($(id).hasAttribute('data-save'), id); }
});

test('a page opened without its folder says so; the warning is hidden once the scripts run', () => {
  assert.match(html, /<p class="warn load-warning" id="load-warning">The workbook did not load: extract the whole folder first, or open the single-file copy/);
  assert.doesNotMatch(html, /id="load-warning"[^>]*hidden/, 'the warning shows until a script hides it');
  const { $ } = openPage(html);
  assert.equal($('load-warning').hidden, true);
  const single = lib.readText('participant/workbook-single-file.html');
  assert.match(single, /id="load-warning">The workbook did not start\. It needs JavaScript/);
});

const CSP = '<meta http-equiv="Content-Security-Policy" content="connect-src \'none\'; img-src data:; media-src \'none\'; frame-src \'none\'; object-src \'none\'; form-action \'none\'">';

test('both copies carry the content security policy, which blocks sending and leaves the page\'s own scripts and style alone', () => {
  for (const f of ['participant/workbook/index.html', 'participant/workbook-single-file.html']) {
    const page = lib.readText(f);
    assert.ok(page.includes(CSP), f);
    assert.equal(page.split('Content-Security-Policy').length, 2, f + ': one policy only');
    // No directive that would block the scripts and style the page loads from its folder or holds inline.
    assert.doesNotMatch(page.match(/content="connect-src[^"]*"/)[0], /default-src|script-src|style-src/, f);
    assert.ok(page.indexOf(CSP) < page.indexOf('<script'), f + ': the policy comes before any script');
  }
});
