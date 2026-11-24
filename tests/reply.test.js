'use strict';
// A reply to the customer: every rule of the reply check, both ways.
const test = require('node:test');
const assert = require('node:assert/strict');
const { lib, C, F, status } = require('./helpers');

const strong = lib.readText('solutions/ex1-strong-reply.txt');
const plus = (s) => strong.replace('Tom Becker\n', s + '\n\nTom Becker\n');

test('the strong reply passes every rule', () => {
  const r = C.checkReply(strong);
  for (const x of r.rules) { assert.equal(x.status, 'ok', x.id); }
});

test('figures: a figure from the thread or the policy passes; an invented one fails', () => {
  assert.equal(status(C.checkReply(plus('Credits are given within ' + F.creditNoteDays + ' working days of approval.')), 'numbers'), 'ok');
  assert.equal(status(C.checkReply(plus('As a thank-you, take 15% off your next order.')), 'numbers'), 'look');
});

test('the two groups: separate counts pass; a merged count fails', () => {
  assert.equal(status(C.checkReply(plus(F.cupsMissing + ' cartons never arrived, and ' + F.cupsCrushed + ' were crushed.')), 'counts'), 'ok');
  assert.equal(status(C.checkReply(plus(F.cupsCrushed + ' cartons were missing or damaged.')), 'counts'), 'look');
  assert.equal(status(C.checkReply(plus('You received ' + F.cupsDelivered + ' cartons, and ' + (F.cupsMissing + F.cupsCrushed) + ' of them were crushed.')), 'counts'), 'look');
});

test('the two groups: "12 oz cups" is not a count of cartons', () => {
  assert.equal(status(C.checkReply(plus('Your order was for ' + F.cupsOrdered + ' cartons of ' + F.cupSize + ' oz cups.')), 'counts'), 'ok');
});

test('credit: passing the request on passes; promising the credit fails', () => {
  assert.equal(status(C.checkReply(plus('Your request for a credit needs the approval of our operations manager.')), 'credit'), 'ok');
  assert.equal(status(C.checkReply(plus('I will let you know her decision on the credit.')), 'credit'), 'ok');
  assert.equal(status(C.checkReply(plus('We will credit your account with the full amount.')), 'credit'), 'look');
  assert.equal(status(C.checkReply(plus('I have approved a credit for the damaged cartons.')), 'credit'), 'look');
  assert.equal(status(C.checkReply(plus('You will receive a credit note next week.')), 'credit'), 'look');
});

test('other costs: passing the request on passes; offering to pay fails', () => {
  assert.equal(status(C.checkReply(plus('I will pass your request for the cash-and-carry receipt to our operations manager.')), 'costs'), 'ok');
  assert.equal(status(C.checkReply(plus('Under our policy we cannot cover goods bought elsewhere.')), 'costs'), 'ok');
  assert.equal(status(C.checkReply(plus('I can confirm that we will cover what you spent at the cash-and-carry.')), 'costs'), 'look');
  assert.equal(status(C.checkReply(plus('We will refund the cups you bought elsewhere.')), 'costs'), 'look');
});

test('delivery day: promising a call passes; promising a day fails', () => {
  assert.equal(status(C.checkReply(plus('I will call you today to confirm the delivery day.')), 'date'), 'ok');
  assert.equal(status(C.checkReply(plus('Our van does not come to your area until next week.')), 'date'), 'ok');
  assert.equal(status(C.checkReply(plus('The missing cartons will be delivered on Monday.')), 'date'), 'look');
  assert.equal(status(C.checkReply(plus('I have arranged for the cartons to arrive tomorrow.')), 'date'), 'look');
  assert.equal(status(C.checkReply(plus('I cannot get them to you this week, but they will arrive on Monday.')), 'date'), 'look');
});

test('curly apostrophes do not hide a promise or a refusal', () => {
  const q = String.fromCharCode(0x2019);
  assert.equal(status(C.checkReply(plus('We' + q + 'll credit your account today.')), 'credit'), 'look');
  assert.equal(status(C.checkReply(plus('We can' + q + 't credit your account yet.')), 'credit'), 'ok');
});

test('the messages say what was found and where to look, never only "wrong"', () => {
  const r = C.checkReply(plus('We will credit your account with the full amount. Take 15% off.'));
  for (const x of r.rules.filter((y) => y.status === 'look')) {
    assert.ok(x.message.length > 60, x.id);
    assert.match(x.message + ' ' + x.items.join(' '), /message|rule|policy|check|sentence/i, x.id);
  }
});

// ---- cases found by the first review: each one failed before the fix ------------------

test('credit: money off the invoice is a promise of a credit, whatever the word', () => {
  assert.equal(status(C.checkReply(plus('We will take $219.00 off your invoice.')), 'credit'), 'look');
  assert.equal(status(C.checkReply(plus('We will issue a corrected invoice that removes those cartons.')), 'credit'), 'look');
  assert.equal(status(C.checkReply(plus('You will get $219.00 back on your next invoice.')), 'credit'), 'look');
});

test('credit: a promise word that is negated, or an instruction, is not a promise', () => {
  assert.equal(status(C.checkReply(plus('The draft promises no credit and no amount.')), 'credit'), 'ok');
  assert.equal(status(C.checkReply(plus('[Billing: confirm the corrected invoice amount before sending.]')), 'credit'), 'ok');
  assert.equal(status(C.checkReply(plus('I cannot confirm an amount or a decision on the credit today.')), 'credit'), 'ok');
});

test('delivery day: "will be with you on Thursday" is a promised day; a receipt sent today is not a delivery', () => {
  assert.equal(status(C.checkReply(plus('The cartons will be with you on Thursday.')), 'date'), 'look');
  assert.equal(status(C.checkReply(plus('I will send your receipt to Dana today.')), 'date'), 'ok');
  assert.equal(status(C.checkReply(plus('I will write to you by Thursday with where the delivery stands.')), 'date'), 'ok');
  assert.equal(status(C.checkReply(plus('We will send the missing cartons on Thursday.')), 'date'), 'look');
});

test('figures: a message label or a rule number is not a figure from the material', () => {
  // "Message 1" to "Message 5" label the thread, and the policy's rules are numbered 1 to 7: neither makes 4 a figure of the case.
  assert.equal(status(C.checkReply(plus('Of the cartons that came, 4 arrived crushed.')), 'numbers'), 'look');
  assert.equal(status(C.checkReply(plus('As message 4 says, and as rules 3 and 6 require, the manager decides.')), 'numbers'), 'ok');
});

test('an empty box says so on every rule, and passes none', () => {
  for (const text of ['', '   \n  ']) {
    const r = C.checkReply(text);
    assert.equal(r.rules.length, 5);
    for (const x of r.rules) {
      assert.equal(x.status, 'note', x.id);
      assert.equal(x.message, 'This box is empty. Paste or write the text first, then check it.', x.id);
    }
  }
});

test('credit: a promise in the future tense is found, and a refusal, a doubt or a report of what the customer says is not', () => {
  // The promise itself, so that the three sentences below are known to differ from it only in what they say.
  assert.equal(status(C.checkReply(plus('We will reduce the invoice.')), 'credit'), 'look');
  assert.equal(status(C.checkReply(plus('We will not take anything off your invoice.')), 'credit'), 'ok');
  assert.equal(status(C.checkReply(plus('I do not know whether we will reduce the invoice.')), 'credit'), 'ok');
  assert.equal(status(C.checkReply(plus('Mira says we will reduce the invoice.')), 'credit'), 'ok');
});
