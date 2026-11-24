'use strict';
// The case meets its specification: the thread, its two traps, the policy, the table, the snippets.
const test = require('node:test');
const assert = require('node:assert/strict');
const { CASE, C, F } = require('./helpers');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// A non-leap reference year: the thread names no year, so the weekdays only need to agree with each other.
function dayNumber(d) { return Date.UTC(2025, MONTHS.indexOf(d.month), d.day) / 86400000; }

test('the thread has five messages over nine days', () => {
  assert.equal(CASE.thread.length, 5);
  const first = dayNumber(CASE.thread[0].date);
  const last = dayNumber(CASE.thread[4].date);
  assert.equal(last - first + 1, 9);
});

test('every weekday named in the case agrees with its date', () => {
  for (const d of Object.values(F.dates)) {
    const wd = WEEKDAYS[new Date(dayNumber(d) * 86400000).getUTCDay()];
    assert.equal(wd, d.weekday, d.day + ' ' + d.month);
  }
});

test('the thread holds at least twelve distinct figures', () => {
  const distinct = new Set(C.extractNumbers(CASE.threadText).map((n) => n.value));
  assert.ok(distinct.size >= 12, 'found ' + distinct.size);
  for (const v of [F.orderBase + F.orderRow, Number(F.invoiceNo.replace(/\D/g, '')), F.cupsOrdered, F.cupsDelivered, F.lidsOrdered,
    F.invoiceTotal, F.cupPrice, F.creditDamaged, F.localPurchase, F.creditAsked]) {
    assert.ok(C.threadNumbers.includes(v), v + ' is in the thread');
  }
});

test('the figures add up: each is compared with the number written here, so that a change to the data fails', () => {
  // The figures the thread, the keys and the solutions rely on, written out by hand.
  assert.equal(F.cupsOrdered, 40);
  assert.equal(F.cupsDelivered, 34);
  assert.equal(F.cupsCrushed, 6);
  assert.equal(F.lidsOrdered, 20);
  assert.equal(F.cupPrice, 36.5);
  assert.equal(F.lidPrice, 18);
  assert.equal(F.localPurchase, 312);
  assert.equal(F.staffCreditLimit, 100);
  // And the figures worked out from them: 40 - 34, 40 x 36.50 + 20 x 18.00, 6 x 36.50, 219.00 + 312.00.
  assert.equal(F.cupsMissing, 6);
  assert.equal(F.invoiceTotal, 1820);
  assert.equal(F.creditDamaged, 219);
  assert.equal(F.creditAsked, 531);
  assert.equal(F.orderNo, 'SO-20417');
  assert.equal(F.invoiceNo, 'INV-7731');
  assert.ok(F.creditDamaged > F.staffCreditLimit, 'the credit needs the manager, so the staff member cannot promise it');
});

test('trap 1: a figure appears twice with two meanings (missing, and crushed)', () => {
  assert.equal(F.cupsMissing, F.cupsCrushed);
  const m3 = CASE.messageText(CASE.thread[2]);
  assert.match(m3, new RegExp('so ' + F.cupsMissing + ' are missing'));
  assert.match(m3, new RegExp(F.cupsCrushed + ' were crushed'));
});

test('trap 2: a promise the customer asked for was never given', () => {
  const [m3, m4, m5] = [2, 3, 4].map((i) => CASE.messageText(CASE.thread[i]));
  assert.match(m3, /confirm that you will credit us/);
  assert.match(m4, /has to be approved by our operations manager/);
  assert.match(m5, /the credit you promised/);
  assert.ok(!C.splitSentences(m4).some(C.promisesCredit), 'the staff member\'s message promises no credit');
});

test('two delivery dates are promised and one is kept', () => {
  const m1 = CASE.messageText(CASE.thread[0]);
  const m2 = CASE.messageText(CASE.thread[1]);
  const m3 = CASE.messageText(CASE.thread[2]);
  assert.match(m1, new RegExp('due to be delivered on ' + CASE.format.wdm(F.dates.due)));
  assert.match(m1, /It has not arrived/);
  assert.match(m2, new RegExp('delivered on ' + CASE.format.wdm(F.dates.promised)));
  assert.equal(CASE.thread[2].date, F.dates.promised);
  assert.match(m3, /The delivery came this morning/);
});

test('the policy has the four rules the exercises rely on', () => {
  const p = CASE.policyText;
  assert.match(p, new RegExp('within ' + F.damageDays + ' working days'));
  assert.match(p, /photos/);
  assert.match(p, new RegExp('above \\' + CASE.format.money(F.staffCreditLimit) + ' must be approved by the operations manager'));
  assert.match(p, /Never promise by e-mail/);
});

test('the orders table has thirty rows; two customers appear more than once', () => {
  assert.equal(CASE.orders.rows.length, 30);
  const counts = {};
  CASE.orders.rows.forEach((r) => { counts[r.business] = (counts[r.business] || 0) + 1; });
  assert.equal(Object.values(counts).filter((n) => n > 1).length, 2);
  const caseRow = CASE.orders.rows.find((r) => r.order === F.orderNo);
  assert.equal(caseRow.business, F.customer);
  assert.equal(caseRow.amount, CASE.format.money(F.invoiceTotal));
});

test('the people are invented and reachable only at example.com, with placeholder phones', () => {
  for (const c of CASE.customers) {
    assert.match(c.email, /^[a-z.]+@example\.com$/);
    assert.match(c.phone, /^000-000-0\d{3}$/);
  }
  for (const m of CASE.thread) {
    for (const addr of (m.from + ' ' + m.to).match(/[^\s<>]+@[^\s<>]+/g)) { assert.match(addr, /@example\.com$/); }
  }
  assert.match(CASE.threadTitle, /invented/);
  assert.match(CASE.policy.title, /invented/);
  assert.match(CASE.orders.note, /invented/);
});

test('there are eight snippets, from harmless to never, each with a reason', () => {
  assert.equal(CASE.snippets.length, 8);
  for (const p of ['fine', 'remove', 'never']) { assert.ok(CASE.snippets.some((s) => s.pile === p), p); }
  for (const s of CASE.snippets) { assert.ok(s.reason.length > 40, 'snippet ' + s.n); }
});
