'use strict';
// Exercise 4: the snippet piles, the stand-in helper, the check of what is about to be pasted, the map-back.
const test = require('node:test');
const assert = require('node:assert/strict');
const { CASE, C, F, status, rule } = require('./helpers');

const keyPiles = () => Object.fromEntries(CASE.snippets.map((s) => [s.n, s.pile]));

test('part 1: piles that agree with the key pass', () => {
  const r = C.checkPiles(keyPiles());
  assert.ok(r.rules.every((x) => x.status === 'ok'));
});

test('part 1: a wrong pile fails, with the key and the reason', () => {
  const p = keyPiles();
  const health = CASE.snippets.find((s) => /doctor/.test(s.title));
  p[health.n] = 'remove';
  const r = C.checkPiles(p);
  assert.equal(status(r, 'snippet-' + health.n), 'look');
  assert.match(rule(r, 'snippet-' + health.n).message, /The key says: Do not paste\. It is health information/);
});

test('part 1: where two piles are defensible, both pass, and the reason says what tips it', () => {
  const two = CASE.snippets.filter((s) => s.accept.length > 1);
  // The complaint, the orders table and the rota: each can be pasted after removing details, or not at all.
  assert.deepEqual(two.map((s) => s.n), [3, 4, 5]);
  for (const s of two) {
    assert.match(s.reason, /^Two piles are defensible\./);
    assert.match(s.reason, /What would tip it/);
    for (const p of s.accept) {
      const piles = keyPiles();
      piles[s.n] = p;
      assert.equal(status(C.checkPiles(piles), 'snippet-' + s.n), 'ok', s.n + ' ' + p);
    }
    const wrong = CASE.piles.map((p) => p.id).find((p) => !s.accept.includes(p));
    const piles = keyPiles();
    piles[s.n] = wrong;
    assert.equal(status(C.checkPiles(piles), 'snippet-' + s.n), 'look');
  }
});

test('part 1: the result says that an employer\'s own policy comes first', () => {
  assert.ok(C.checkPiles(keyPiles()).notes.some((n) => /employer's own policy/.test(n) && /comes first/.test(n)));
});

test('part 1: piles are read from text in several spellings', () => {
  assert.deepEqual(C.parsePiles('1: fine\n2 - fine to paste\n3: remove details\n6: do not paste\n7 never'),
    { 1: 'fine', 2: 'fine', 3: 'remove', 6: 'never', 7: 'never' });
});

test('part 2: the recommended extract holds nothing personal, and passes', () => {
  const ex = C.makeExtract(CASE.orders.recommendedChoices);
  assert.equal(status(C.checkExtract(ex.text), 'personal'), 'ok');
  assert.equal(ex.text.trim().split('\n').length, 2 + CASE.orders.rows.length);
});

test('part 2: the whole table fails, and names what it found', () => {
  const all = C.makeExtract({});
  const r = C.checkExtract(all.text);
  assert.equal(status(r, 'personal'), 'look');
  assert.match(rule(r, 'personal').message, /^Do not paste this yet/);
});

test('part 2: each kind of personal value is caught on its own', () => {
  const c = CASE.customers[3];
  const [first, last] = [c.contact.split(' ')[0], c.contact.split(' ').slice(-1)[0]];
  for (const leak of [c.business, c.contact, first, last, c.email, c.phone, c.phone.replace(/-/g, ' '), c.phone.replace(/-/g, '')]) {
    assert.equal(status(C.checkExtract('Which customer ordered most? ' + leak), 'personal'), 'look', leak);
  }
  assert.equal(status(C.checkExtract('Which customer ordered most? Customer 04'), 'personal'), 'ok');
});

test('part 2: an empty box is a note, not a pass', () => {
  assert.equal(status(C.checkExtract('   '), 'personal'), 'note');
});

test('part 2: anything shaped like an e-mail address or a phone number is caught, from any source', () => {
  // Addresses outside example.com are built here at run time, so that no file of the kit holds one.
  const at = '@';
  const outside = 'john.smith' + at + 'realcompany.co.uk';
  const r = C.checkExtract('John Smith, ' + outside + ', 07700 900123');
  assert.equal(status(r, 'personal'), 'look');
  const items = rule(r, 'personal').items;
  assert.ok(items.includes('something shaped like an e-mail address: ' + outside), items.join('; '));
  assert.ok(items.includes('something shaped like a phone number: 07700 900123'), items.join('; '));
  for (const leak of ['+44 20 7946 0958', '(555) 010-0199', 'call 5550100199', 'a.b' + at + 'example.org']) {
    assert.equal(status(C.checkExtract('Which customer ordered most? ' + leak), 'personal'), 'look', leak);
  }
  // Order numbers, amounts and short dates are not phone numbers.
  assert.equal(status(C.checkExtract('SO-20417 on 3 Feb: $1,184.00, and 12 oz cups'), 'personal'), 'ok');
});

test('part 2: the rule is named for what it knows, and its pass says what it cannot see', () => {
  const r = C.checkExtract('Which customer ordered most? Customer 04');
  assert.equal(rule(r, 'personal').name, 'This table\'s values, and contact details');
  assert.match(rule(r, 'personal').message, /^I found none of this table's /);
  assert.match(rule(r, 'personal').message, /I cannot recognise other names or personal details/);
});

test('part 1 and part 2 agree about the order number', () => {
  // The recommended extract keeps the order number, so the complaint's reason must not say to replace it.
  assert.equal(CASE.orders.recommendedChoices.order, 'keep');
  const complaint = CASE.snippets.find((s) => s.n === 3);
  const replaceSentences = complaint.reason.split(/(?<=\.)\s+/).filter((x) => /replace/i.test(x));
  assert.ok(replaceSentences.length > 0);
  for (const s of replaceSentences) { assert.doesNotMatch(s, /order number/i, s); }
});

test('stand-ins are consistent: one customer, one stand-in', () => {
  const ex = C.makeExtract(CASE.orders.recommendedChoices);
  const rows = ex.text.split('\n').filter((l) => l.includes(F.orderNo));
  assert.equal(rows.length, 1);
  const label = rows[0].split('|').map((s) => s.trim()).find((s) => /^Customer \d\d$/.test(s));
  assert.equal(ex.key.Customer[Number(label.slice(-2))], F.customer);
  const times = ex.text.split(label).length - 1;
  assert.equal(times, CASE.orders.rows.filter((r) => r.business === F.customer).length);
});

test('map-back puts the real names back, with or without the leading zero', () => {
  const ex = C.makeExtract(CASE.orders.recommendedChoices);
  const back = C.mapBack('Customer 02 ordered most. Customer 1 ordered three times. Customer 99 is unknown.', ex.key);
  assert.equal(back, ex.key.Customer[2] + ' ordered most. ' + ex.key.Customer[1] + ' ordered three times. Customer 99 is unknown.');
  assert.equal(C.mapBack('Customer 1 and Customer 10', ex.key), ex.key.Customer[1] + ' and ' + ex.key.Customer[10]);
});

test('leaving a column out removes it from the extract', () => {
  const ex = C.makeExtract({ phone: 'leave', email: 'leave', contact: 'leave', business: 'leave' });
  assert.ok(!/Phone|E-mail|Contact|Customer/.test(ex.text));
  assert.deepEqual(ex.key, {});
});
