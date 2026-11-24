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
  // With "late" gone, and no due date before the delivery date, nothing says it came late.
  const r = C.checkSummary(swap('due 28 February (msg 1), delivered late on 5 March (msg 3)', 'delivered on 5 March (msg 3)'));
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

const unkeptSentence = 'He promised to confirm a day for the missing cartons by Friday 7 March, and did not (msg 4, 5).';

test('required: the unkept promise to confirm a delivery day; a summary that never mentions it is flagged', () => {
  const without = swap(' ' + unkeptSentence, '');
  const r = C.checkSummary(without);
  assert.equal(status(r, 'fact-promised'), 'look');
  assert.match(rule(r, 'fact-promised').message, /promise to confirm a delivery day by Friday 7 March, and that it was not kept/);
});

test('required: mentioning the promise without saying it was not kept is flagged too', () => {
  const kept = swap(unkeptSentence, 'He promised to confirm a day for the missing cartons by Friday 7 March (msg 4).');
  assert.equal(status(C.checkSummary(kept), 'fact-promised'), 'look');
});

test('required: the unkept promise also counts when said in other words', () => {
  const other = swap(unkeptSentence, 'Tom said he would confirm a delivery date by Fri 7 Mar (msg 4); Mira has heard nothing since (msg 5).');
  assert.equal(status(C.checkSummary(other), 'fact-promised'), 'ok');
});

test('the recorded answer passes every rule but the length, which the request set and the assistant ignored', () => {
  const r = C.checkSummary(lib.readText('recorded/answers/ex2-answer.txt'));
  for (const x of r.rules) { assert.equal(x.status, x.id === 'length' ? 'look' : 'ok', x.id); }
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

// ---- cases found by the first review: each one failed before the fix ------------------

test('trap, the promise never given: "waiting" or "asked" does not cancel "promised" or "agreed"', () => {
  const s1 = strong + '- ' + F.contactFirst + ' is still waiting for the credit ' + F.staffFirst + ' promised for the ' + F.cupsCrushed + ' damaged cartons (msg 5).\n';
  assert.equal(status(C.checkSummary(s1), 'credit'), 'look');
  const s2 = strong + '- ' + F.staffFirst + ' agreed to the credit ' + F.contactFirst + ' asked for.\n';
  assert.equal(status(C.checkSummary(s2), 'credit'), 'look');
  // Her claim, reported as hers, still passes.
  const s3 = strong + '- ' + F.contactFirst + ' says she is still waiting for the credit she was promised (msg 5).\n';
  assert.equal(status(C.checkSummary(s3), 'credit'), 'ok');
});

test('figures: a figure that is in the thread only as a "Message N" label is not a figure of the thread', () => {
  const r = C.checkSummary(strong + '- ' + F.contactFirst + ' says 4 cartons arrived crushed (msg 3).\n');
  assert.equal(status(r, 'numbers'), 'look');
  assert.match(rule(r, 'numbers').items.join(' '), /^4 is not in the material/);
});

test('what went wrong: "not late", "nothing missing" and "nothing damaged" are not read as the facts', () => {
  const r = C.checkSummary('Order ' + F.orderNo + ', invoice ' + F.invoiceNo + '. The order was not late. Nothing was missing and nothing was damaged.');
  assert.equal(status(r, 'fact-wrong'), 'look');
  assert.match(rule(r, 'fact-wrong').message, /late/);
  assert.match(rule(r, 'fact-wrong').message, /missing/);
  assert.match(rule(r, 'fact-wrong').message, /damaged/);
});

test('what went wrong: a due date followed by a later delivery date says it came late', () => {
  const base = 'Order ' + F.orderNo + ', invoice ' + F.invoiceNo + '. ' + F.cupsMissing + ' cartons are missing and ' + F.cupsCrushed + ' arrived crushed. ';
  assert.equal(status(C.checkSummary(base + 'Due 28 Feb; delivered 5 Mar (msg 1, 3).'), 'fact-wrong'), 'ok');
  assert.equal(status(C.checkSummary(base + 'Due 5 Mar; delivered 28 Feb.'), 'fact-wrong'), 'look');
});

test('what was promised: "a day by 7 Mar; not kept", in the words a participant used, counts', () => {
  const other = swap(unkeptSentence, 'We promised a day for the missing cartons by 7 Mar; not kept (msg 4, msg 5).');
  assert.equal(status(C.checkSummary(other), 'fact-promised'), 'ok');
});

test('citations: a date written with figures is checked as a date, against the message it is cited to', () => {
  const right = C.checkSummary(strong + '- Due 28/02, delivered 05/03 (msg 1, 3).\n');
  assert.equal(status(right, 'citations'), 'ok');
  assert.equal(status(right, 'numbers'), 'ok');
  const wrong = C.checkSummary(strong + '- Due 28/02 (msg 4).\n');
  assert.equal(status(wrong, 'citations'), 'look');
  assert.ok(rule(wrong, 'citations').items.includes('The date 28/02 is cited to message 4, but it is in message 1.'), rule(wrong, 'citations').items.join('; '));
  const invented = C.checkSummary(strong + '- Due 27/02 (msg 1).\n');
  assert.equal(status(invented, 'numbers'), 'look');
});

test('an empty box says so on every rule, and passes none', () => {
  const r = C.checkSummary('  ');
  assert.equal(r.rules.length, 10);
  for (const x of r.rules) { assert.equal(x.status, 'note', x.id); assert.match(x.message, /^This box is empty\./, x.id); }
});

test('the request of exercise 2: without the line that asks for sources it is flagged; with it, it passes', () => {
  const without = C.requestText('summary', { withoutCiteLine: true });
  const r = C.checkRequest(without);
  assert.equal(status(r, 'cite'), 'look');
  assert.equal(status(r, 'material'), 'ok');
  assert.equal(status(C.checkRequest(C.requestText('summary')), 'cite'), 'ok');
  assert.equal(status(C.checkRequest(without.replace('## Form\n', '## Form\nFor every bullet, name the message it comes from. ')), 'cite'), 'ok');
  assert.equal(status(C.checkRequest(without + '\nBe accurate.\n'), 'cite'), 'look');
  assert.equal(status(C.checkRequest('Summarise the thread. After each fact, give the message number.'), 'material'), 'look');
});

// ---- cases found by the second review: each one failed before the fix ------------------

test('trap, the promise never given: a list under "Promised:", and four other wordings, are flagged', () => {
  for (const s of [
    'Promised: a delivery day by Fri 7 Mar, not confirmed (msg 4), and a credit for the damaged cartons (msg 5).',
    F.staffFirst + ' said he would credit the damaged cartons.',
    F.staffFirst + ' committed to a credit.',
    F.staffFirst + ' offered a credit of ' + money(F.creditDamaged) + '.',
    'A credit is due to ' + F.contactFirst + ', as promised.'
  ]) {
    assert.equal(status(C.checkSummary(strong + '- ' + s + '\n'), 'credit'), 'look', s);
  }
});

test('trap, the promise never given: a list of what was promised, or not, with no credit in it, still passes', () => {
  for (const s of [
    // The two lines of the recorded answer, word for word.
    'Promised: delivery on 5 Mar (msg 2), and a confirmed day for the missing cartons by Fri 7 Mar (msg 4).',
    'Credit not promised: ' + F.staffFirst + ' sent the request to you for approval (msg 4). ' + F.contactFirst + ' says a credit was promised (msg 5).',
    'Not promised: a credit for the damaged cartons.',
    'Promised: a delivery day by Friday 7 March (not kept); a credit was asked for, and awaits your decision (msg 4).',
    F.contactFirst + ' said he would credit the damaged cartons (msg 5).',
    'Your order was delivered on 5 March, as promised (msg 2, 3).'
  ]) {
    assert.equal(status(C.checkSummary(strong + '- ' + s + '\n'), 'credit'), 'ok', s);
  }
});

test('trap: a promise to tell, to pass on or to confirm a day, and a credit that still needs approval, are not a promised credit', () => {
  for (const s of [
    F.staffFirst + ' promised to tell ' + F.contactFirst + ' your decision on the credit (msg 4).',
    F.staffFirst + ' confirmed that a credit of this size needs your approval (msg 4).',
    F.staffFirst + ' agreed to pass the credit request to ' + F.manager.split(' ')[0] + ' (msg 4).',
    F.staffFirst + ' promised only to confirm a delivery day; the credit is for ' + F.manager.split(' ')[0] + ' to approve.'
  ]) {
    assert.equal(status(C.checkSummary(strong + '- ' + s + '\n'), 'credit'), 'ok', s);
  }
  // The same verbs, with a credit as what was promised, are still flagged.
  for (const s of [
    F.staffFirst + ' promised to credit the damaged cartons (msg 4).',
    F.staffFirst + ' confirmed that the credit will be issued.',
    F.staffFirst + ' agreed to approve the credit.',
    'We are happy to approve the credit.'
  ]) {
    assert.equal(status(C.checkSummary(strong + '- ' + s + '\n'), 'credit'), 'look', s);
  }
});

test('the wordings the instructor guide gives for the two traps are each flagged, as the guide says', () => {
  const guide = lib.readText('instructor/guide.md');
  const item = guide.split('\n').find((l) => l.startsWith('4. **With a live assistant, the traps the recorded answer avoided:**'));
  assert.ok(item, 'the guide has the item');
  assert.match(item, /The check flags each of these wordings; other wordings can slip past it/);
  const quoted = [...item.slice(0, item.indexOf('The check flags')).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(quoted.length, 3);
  for (const q of quoted) {
    const r = C.checkSummary(strong + '- ' + q + '.\n');
    assert.ok(status(r, 'credit') === 'look' || status(r, 'counts') === 'look', q);
  }
});

// ---- conditions of the checker that no test held: each test fails if its condition is removed ----

test('trap: a negation written with n\'t, such as "didn\'t", holds back a promise word', () => {
  assert.equal(status(C.checkSummary(strong + '- ' + F.staffFirst + ' didn\'t promise a credit (msg 4).\n'), 'credit'), 'ok');
  assert.equal(status(C.checkSummary(strong + '- ' + F.staffFirst + ' did promise a credit (msg 4).\n'), 'credit'), 'look');
});

test('required, what was promised: a summary that says nothing of the credit\'s state is flagged, and says what is missing', () => {
  const noCredit = 'Order ' + F.orderNo + ', invoice ' + F.invoiceNo + ' (msg 1, 3). Due 28 Feb, delivered late on 5 Mar; ' + F.cupsMissing +
    ' cartons missing; ' + F.cupsCrushed + ' crushed (msg 1, 3). ' + unkeptSentence + ' Amount: ' + money(F.creditAsked) + ' (msg 5).';
  const r = C.checkSummary(noCredit);
  assert.equal(status(r, 'fact-promised'), 'look');
  assert.match(rule(r, 'fact-promised').message, /the credit described as asked for, or as waiting for a decision/);
  assert.doesNotMatch(rule(r, 'fact-promised').message, /a word such as promised|and that it was not kept/);
  assert.equal(status(C.checkSummary(noCredit + ' The credit awaits your decision.'), 'fact-promised'), 'ok');
});
