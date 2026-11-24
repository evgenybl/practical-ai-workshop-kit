'use strict';
// Exercise 2: every rule of the summary check, both ways.
const test = require('node:test');
const assert = require('node:assert/strict');
const { lib, C, F, status, rule } = require('./helpers');

const strong = lib.readText('solutions/ex2-strong-summary.txt');
const money = (n) => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const swap = (a, b) => {
  assert.ok(strong.includes(a), 'the strong summary contains: ' + a);
  return strong.replace(a, b);
};

test('the strong summary passes every rule', () => {
  const r = C.checkSummary(strong);
  for (const x of r.rules) { assert.equal(x.status, 'ok', x.id + ': ' + x.message); }
});

test('figures: all in the thread passes; one that is not fails, and is shown with "check it"', () => {
  assert.equal(status(C.checkSummary(strong), 'numbers'), 'ok');
  const r = C.checkSummary(strong + '- The cups alone came to $1,460.00.\n');
  assert.equal(status(r, 'numbers'), 'look');
  assert.match(rule(r, 'numbers').items[0], /^\$1,460\.00 is not in the material: check it/);
});

test('message numbers: right citations pass; a figure cited to the wrong message fails, naming the right one', () => {
  assert.equal(status(C.checkSummary(strong), 'citations'), 'ok');
  const r = C.checkSummary(swap('plus ' + money(F.localPurchase) + ' spent at a cash-and-carry (msg 5)', 'plus ' + money(F.localPurchase) + ' spent at a cash-and-carry (msg 4)'));
  assert.equal(status(r, 'citations'), 'look');
  assert.ok(rule(r, 'citations').items.some((i) => /is cited to message 4, but it is in message 5/.test(i)));
});

test('message numbers: none at all is a note, not a failure', () => {
  const r = C.checkSummary(strong.replace(/\s*\((?:msg|messages?)[^)]*\)/g, ''));
  assert.equal(status(r, 'citations'), 'note');
});

test('required: the order number, both ways', () => {
  assert.equal(status(C.checkSummary(strong), 'fact-order'), 'ok');
  assert.equal(status(C.checkSummary(swap('order ' + F.orderNo + ' (msg 1), ', '')), 'fact-order'), 'look');
});

test('required: the invoice number, both ways', () => {
  assert.equal(status(C.checkSummary(strong), 'fact-invoice'), 'ok');
  assert.equal(status(C.checkSummary(swap(', invoice ' + F.invoiceNo + ' (msg 3)', '')), 'fact-invoice'), 'look');
});

test('required: what went wrong, both ways (late, short and damaged)', () => {
  assert.equal(status(C.checkSummary(strong), 'fact-wrong'), 'ok');
  const r = C.checkSummary(swap('delivered late on', 'delivered on'));
  assert.equal(status(r, 'fact-wrong'), 'look');
  assert.match(rule(r, 'fact-wrong').message, /late/);
});

test('required: the amount in question, both ways', () => {
  assert.equal(status(C.checkSummary(strong), 'fact-amount'), 'ok');
  const noAmount = strong.replace(/- Amount in question:.*\n/, '- Amount in question: a credit (msg 5).\n').replace(/- Your decision:.*\n/, '');
  assert.equal(status(C.checkSummary(noAmount), 'fact-amount'), 'look');
});

test('required: the amount in question also counts when given as its two parts', () => {
  const parts = strong.replace(money(F.creditAsked) + ': ', '');
  assert.equal(status(C.checkSummary(parts), 'fact-amount'), 'ok');
});

test('required: what was promised, both ways', () => {
  assert.equal(status(C.checkSummary(strong), 'fact-promised'), 'ok');
  const none = 'Order ' + F.orderNo + ', invoice ' + F.invoiceNo + '. The order was late and some cartons were damaged.';
  assert.equal(status(C.checkSummary(none), 'fact-promised'), 'look');
});

test('length: at most 120 words passes; more fails', () => {
  assert.equal(status(C.checkSummary(strong), 'length'), 'ok');
  const long = strong + '- More: ' + 'word '.repeat(60) + '\n';
  const r = C.checkSummary(long);
  assert.equal(status(r, 'length'), 'look');
  assert.match(rule(r, 'length').message, /the limit is 120/);
});

test('trap, the promise never given: "Mira says" passes; reporting her claim as fact fails', () => {
  assert.equal(status(C.checkSummary(strong), 'credit'), 'ok');
  assert.equal(status(C.checkSummary(strong + '- ' + F.contactFirst + ' says the credit was promised (msg 5).\n'), 'credit'), 'ok');
  assert.equal(status(C.checkSummary(strong + '- ' + F.staffFirst + ' agreed to credit the damaged cartons (msg 4).\n'), 'credit'), 'look');
  assert.equal(status(C.checkSummary(strong + '- A credit has been approved.\n'), 'credit'), 'look');
});

test('trap, the two sixes: separate groups pass; merging them fails', () => {
  assert.equal(status(C.checkSummary(strong), 'counts'), 'ok');
  assert.equal(status(C.checkSummary(strong + '- ' + F.cupsCrushed + ' cartons were missing or damaged (msg 3).\n'), 'counts'), 'look');
});

test('the summary check says that figures in words are not checked', () => {
  assert.ok(C.checkSummary(strong).notes.some((n) => /written in words/.test(n) && /not checked/.test(n)));
});
