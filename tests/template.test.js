'use strict';
// Exercise 5: the template check, both ways.
const test = require('node:test');
const assert = require('node:assert/strict');
const { lib, C, F, status, rule } = require('./helpers');

const strong = lib.readText('solutions/ex5-strong-template.txt');

test('the strong template passes both rules', () => {
  const r = C.checkTemplate(strong);
  assert.equal(status(r, 'placeholders'), 'ok');
  assert.equal(status(r, 'leftovers'), 'ok');
});

test('placeholders: three named ones with one for the material pass; too few fail', () => {
  assert.equal(status(C.checkTemplate('[CUSTOMER NAME] [ORDER NUMBER] [PASTE THE THREAD HERE]'), 'placeholders'), 'ok');
  assert.equal(status(C.checkTemplate('{{customer name}} {order} <paste the e-mails here>'), 'placeholders'), 'ok');
  assert.equal(status(C.checkTemplate('[CUSTOMER NAME] and [PASTE THE THREAD HERE]'), 'placeholders'), 'look');
});

test('placeholders: none standing for the material fails', () => {
  const r = C.checkTemplate('[CUSTOMER NAME] [ORDER NUMBER] [MANAGER]');
  assert.equal(status(r, 'placeholders'), 'look');
  assert.match(rule(r, 'placeholders').message, /stands for the material/);
});

test('placeholders: an unnamed blank fails', () => {
  const r = C.checkTemplate('[CUSTOMER NAME] [ORDER NUMBER] [PASTE THE THREAD HERE] for ___');
  assert.equal(status(r, 'placeholders'), 'look');
  assert.match(rule(r, 'placeholders').message, /A blank does not say what goes there/);
});

test('placeholders: e-mail addresses in angle brackets and message citations are not placeholders', () => {
  assert.deepEqual(C.findPlaceholders('<' + F.contactEmail + '> (msg 2) [msg 3] [ORDER NUMBER]'), ['ORDER NUMBER']);
});

test('leftovers: the unchanged request of exercise 2 fails, listing the case\'s values', () => {
  const r = C.checkTemplate(C.requestText('summary'));
  assert.equal(status(r, 'leftovers'), 'look');
  const items = rule(r, 'leftovers').items.join('\n');
  assert.match(items, new RegExp(F.contact));
  assert.match(items, /the order number/);
  assert.match(items, /an amount of money from the thread: \$/);
});

test('leftovers: each kind of case value is caught on its own', () => {
  const base = strong;
  const leaks = [F.manager, F.contactFirst, F.customer, F.orderNo, F.invoiceNo, '$' + F.creditAsked.toFixed(2),
    F.cupsDelivered + ' cartons', F.dates.promised.day + ' ' + F.dates.promised.month, F.dates.promised.month.slice(0, 3) + ' ' + F.dates.promised.day];
  for (const leak of leaks) {
    assert.equal(status(C.checkTemplate(base + '\nFor example: ' + leak + '.\n'), 'leftovers'), 'look', leak);
  }
});

test('leftovers: the company\'s own name may stay', () => {
  assert.ok(strong.includes(F.supplier));
  assert.equal(status(C.checkTemplate(strong), 'leftovers'), 'ok');
});

test('placeholders: a word about placeholders, such as [BRACKETED], is not counted as one', () => {
  const t = 'Fill in every [BRACKETED] part, and the [placeholders], then send.\n[MANAGER] [ORDER NUMBER]';
  assert.deepEqual(C.findPlaceholders(t), ['MANAGER', 'ORDER NUMBER']);
  // Two named placeholders, neither for the material: still too few, whatever the first line says.
  assert.equal(status(C.checkTemplate(t), 'placeholders'), 'look');
});

test('placeholders: an ordinary "..." in a sentence is not a blank; [...] and (...) are', () => {
  const named = '[CUSTOMER NAME] [ORDER NUMBER] [PASTE THE THREAD HERE]';
  assert.equal(status(C.checkTemplate(named + ' Include the facts, the amounts, and so on...'), 'placeholders'), 'ok');
  assert.equal(status(C.checkTemplate(named + ' for [...]'), 'placeholders'), 'look');
  assert.equal(status(C.checkTemplate(named + ' for (...)'), 'placeholders'), 'look');
});

test('an empty box says so on both rules, and passes neither', () => {
  const r = C.checkTemplate('');
  for (const x of r.rules) { assert.equal(x.status, 'note', x.id); assert.match(x.message, /^This box is empty\./); }
});
