/*
 * Practical AI at Work: the workbook page.
 *
 * This file connects the page to the case (case-data.js), the answers
 * (recorded-answers.js) and the checker (checker.js). All checking happens in
 * checker.js; this file only shows the case, reads the boxes, and shows results.
 * Answers are kept in the browser's own storage on this computer, nowhere else.
 *
 * The functions that do not need a page (answersToText, exampleMapBackAnswer)
 * are also exported for the Node tests.
 */
(function (root, factory) {
  'use strict';
  var isNode = typeof module === 'object' && module && module.exports;
  var CASE = isNode ? require('./case-data.js') : root.WorkshopCase;
  var REC = isNode ? require('./recorded-answers.js') : root.WorkshopRecorded;
  var C = isNode ? require('./checker.js') : root.WorkshopChecker;
  var api = factory(CASE, REC, C);
  root.WorkshopPage = api;
  if (isNode) { module.exports = api; }
  if (typeof document !== 'undefined' && document.getElementById) {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', api.init); } else { api.init(); }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CASE, REC, C) {
  'use strict';

  var F = CASE.facts;
  var STORAGE_KEY = 'practical-ai-workbook:v1';

  // The boxes whose content is saved, in the order they are written to the text file.
  var FIELDS = [
    ['ex1-notes', 'Exercise 1, step 1: what is wrong with the reply'],
    ['ex1-situation', 'Exercise 1, step 2: Situation'],
    ['ex1-material', 'Exercise 1, step 2: Material'],
    ['ex1-task', 'Exercise 1, step 2: Task'],
    ['ex1-form', 'Exercise 1, step 2: Form'],
    ['ex1-limits', 'Exercise 1, step 2: Limits'],
    ['ex1-newreply', 'Exercise 1, step 3: the reply my brief produced'],
    ['ex2-answer', 'Exercise 2: the answer'],
    ['ex2-final', 'Exercise 2: my corrected summary'],
    ['ex4-extract', 'Exercise 4, part 2: the text I was about to paste'],
    ['ex4-answer', 'Exercise 4, part 2: the assistant\'s answer'],
    ['ex5-template', 'Exercise 5: my template']
  ];

  // ---------------------------------------------------------------------------
  // Functions that need no page (tested under Node)
  // ---------------------------------------------------------------------------
  /** The saved answers as a plain text file. state: { fields: {id: text}, choices: {name: value} } */
  function answersToText(state, savedAt) {
    var s = state || {};
    var fields = s.fields || {};
    var choices = s.choices || {};
    var lines = ['Practical AI at Work: my workbook answers', 'Saved: ' + savedAt, 'Everything in the case is invented.', ''];
    FIELDS.forEach(function (f) {
      var v = (fields[f[0]] || '').trim();
      lines.push('== ' + f[1] + ' ==');
      lines.push(v || '(empty)');
      lines.push('');
    });
    function group(title, prefix, keys) {
      lines.push('== ' + title + ' ==');
      var any = false;
      keys.forEach(function (k) {
        if (choices[prefix + k]) { any = true; lines.push(k + ': ' + choices[prefix + k]); }
      });
      if (!any) { lines.push('(none chosen)'); }
      lines.push('');
    }
    var marks = [];
    ((REC && REC.ex3) || []).forEach(function (a) { a.key.forEach(function (k, i) { marks.push(a.id + (i + 1)); }); });
    group('Exercise 3: my marks', 'mark-', marks);
    group('Exercise 4, part 1: my piles', 'pile-', CASE.snippets.map(function (sn) { return String(sn.n); }));
    group('Exercise 4, part 2: what I did with each column', 'col-', CASE.orders.columns.map(function (c) { return c.id; }));
    group('The ten questions: my answers', 'q-', CASE.quiz.map(function (q) { return String(q.n); }));
    return lines.join('\n');
  }

  /** An example answer that uses the stand-ins, so the map-back can be tried with no assistant. */
  function exampleMapBackAnswer(key) {
    var customers = key && key.Customer;
    if (!customers) { return null; }
    var byName = {};
    Object.keys(customers).forEach(function (n) { byName[customers[n]] = Number(n); });
    var totals = {};
    var counts = {};
    var open = 0;
    CASE.orders.rows.forEach(function (r) {
      totals[r.business] = (totals[r.business] || 0) + Number(r.amount.replace(/[$,]/g, ''));
      counts[r.business] = (counts[r.business] || 0) + 1;
      if (r.status !== 'Paid') { open++; }
    });
    var repeat = Object.keys(counts).filter(function (b) { return counts[b] > 1; })
      .sort(function (a, b) { return totals[b] - totals[a]; });
    function label(b) { var n = byName[b]; return 'Customer ' + (n < 10 ? '0' + n : n); }
    var times = ['', 'once', 'twice', 'three times', 'four times'];
    return repeat.map(function (b) {
      return label(b) + ' has ordered ' + (times[counts[b]] || counts[b] + ' times') + ', ' + CASE.format.money(totals[b]) + ' in total.';
    }).join(' ') + ' ' + open + ' of the ' + CASE.orders.rows.length + ' orders are not yet paid.\n\n(An example written by this page, not by an assistant.)';
  }

  // ---------------------------------------------------------------------------
  // The page
  // ---------------------------------------------------------------------------
  var doc = typeof document !== 'undefined' ? document : null;
  function $(id) { return doc.getElementById(id); }
  function el(tag, attrs, text) {
    var e = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') { e.className = attrs[k]; } else { e.setAttribute(k, attrs[k]); }
    });
    if (text !== undefined) { e.textContent = text; }
    return e;
  }

  // --- storage: this browser only ---------------------------------------------
  var state = { fields: {}, choices: {} };
  function loadState() {
    try {
      var raw = root().localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        state = { fields: s.fields || {}, choices: s.choices || {} };
      }
    } catch (e) { state = { fields: {}, choices: {} }; }
  }
  function saveState() {
    try { root().localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: answers live until the page closes */ }
  }
  function root() { return typeof window !== 'undefined' ? window : {}; }

  // --- showing a result --------------------------------------------------------
  function showResult(container, result) {
    container.textContent = '';
    container.appendChild(el('p', { class: 'summary' }, C.summaryLine(result)));
    var list = el('ul', { class: 'rules' });
    result.rules.forEach(function (r) {
      var li = el('li', { class: 'rule ' + r.status });
      li.appendChild(el('span', { class: 'badge' }, C.STATUS_WORDS[r.status]));
      li.appendChild(doc.createTextNode(' '));
      li.appendChild(el('strong', {}, r.name + ':'));
      li.appendChild(doc.createTextNode(' ' + r.message));
      if (r.items.length) {
        var ul = el('ul', { class: 'items' });
        r.items.forEach(function (i) { ul.appendChild(el('li', {}, i)); });
        li.appendChild(ul);
      }
      list.appendChild(li);
    });
    container.appendChild(list);
    (result.notes || []).forEach(function (n) { container.appendChild(el('p', { class: 'note' }, n)); });
    container.focus();
  }
  function showText(container, heading, text) {
    container.textContent = '';
    container.appendChild(el('p', { class: 'summary' }, heading));
    if (text) { container.appendChild(el('pre', { class: 'doc', tabindex: '0' }, text)); }
    container.focus();
  }

  // --- copying -----------------------------------------------------------------
  function copyText(text, statusEl) {
    function done(ok) {
      statusEl.textContent = ok ? 'Copied.' : 'Your browser did not allow copying. Select the text and press Ctrl+C (Cmd+C on a Mac).';
    }
    function fallback() {
      var ta = el('textarea', { 'aria-hidden': 'true', class: 'offscreen' });
      ta.value = text;
      doc.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
      doc.body.removeChild(ta);
      done(ok);
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
        return;
      }
    } catch (e) { /* fall through */ }
    fallback();
  }

  // --- the case ----------------------------------------------------------------
  function fillFacts() {
    var values = {
      supplier: F.supplier, customer: F.customer, contact: F.contact, contactFirst: F.contactFirst,
      wishLine: CASE.briefs.wish.line, ordersQuestion: CASE.orders.question
    };
    Array.prototype.forEach.call(doc.querySelectorAll('[data-fact]'), function (e) {
      e.textContent = values[e.getAttribute('data-fact')] || '';
    });
  }
  function renderCase() {
    $('thread-text').textContent = CASE.threadText;
    $('policy-text').textContent = CASE.policyText;
    $('orders-note').textContent = CASE.orders.title + '. ' + CASE.orders.note;
    var table = $('orders-table');
    var thead = el('thead');
    var tr = el('tr');
    CASE.orders.columns.forEach(function (c) { tr.appendChild(el('th', { scope: 'col' }, c.label)); });
    thead.appendChild(tr);
    table.appendChild(thead);
    var tbody = el('tbody');
    CASE.orders.rows.forEach(function (r) {
      var row = el('tr');
      CASE.orders.columns.forEach(function (c) { row.appendChild(el('td', {}, r[c.id])); });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    var list = $('snippets-list');
    CASE.snippets.forEach(function (s) {
      var box = el('div', { class: 'snippet' });
      box.appendChild(el('h4', {}, 'Snippet ' + s.n + ': ' + s.title));
      box.appendChild(el('p', { class: 'small' }, 'Why someone might paste it: ' + s.purpose));
      box.appendChild(el('pre', { class: 'doc' }, s.text));
      list.appendChild(box);
    });
    $('copy-thread').addEventListener('click', function () { copyText(CASE.threadText, $('copy-thread-status')); });
    $('copy-policy').addEventListener('click', function () { copyText(CASE.policyText, $('copy-policy-status')); });
  }

  function standInText(entry) {
    if (!entry) { return ''; }
    return entry.kind === 'constructed'
      ? 'Stand-in answer: written for this kit to show typical mistakes, not produced by an assistant. A recorded answer will replace it.'
      : 'Recorded answer: ' + entry.model + ', ' + entry.date + '.' + (entry.edits ? ' Edited for the exercise: ' + entry.edits : '');
  }

  // --- a radio group -------------------------------------------------------------
  function radioGroup(name, legend, options, legendClass) {
    var fs = el('fieldset', { class: 'choice' });
    var lg = el('legend', legendClass ? { class: legendClass } : {});
    lg.textContent = legend;
    fs.appendChild(lg);
    options.forEach(function (o) {
      var id = name + '-' + o.id;
      var wrap = el('div', { class: 'option' });
      var input = el('input', { type: 'radio', name: name, id: id, value: o.id });
      input.setAttribute('data-choice', '');
      wrap.appendChild(input);
      wrap.appendChild(el('label', { for: id }, o.label));
      fs.appendChild(wrap);
    });
    return fs;
  }
  function chosen(name) {
    var c = doc.querySelector('input[name="' + name + '"]:checked');
    return c ? c.value : '';
  }

  // --- exercises -----------------------------------------------------------------
  function setupEx1() {
    $('ex1-standin').textContent = standInText(REC.ex1);
    $('ex1-answer').textContent = REC.ex1.text;
    $('ex1-model').textContent = C.requestText('reply');
    var issues = $('ex1-issues');
    issues.appendChild(el('p', {}, 'What the instructor\'s key lists. Did you find these, or others?'));
    var ol = el('ol');
    REC.ex1.issues.forEach(function (t) { ol.appendChild(el('li', {}, t)); });
    issues.appendChild(ol);
    $('ex1-issues-show').addEventListener('click', function () {
      var open = issues.hidden;
      issues.hidden = !open;
      this.setAttribute('aria-expanded', String(open));
      this.textContent = open ? 'Hide the instructor\'s list' : 'Show the instructor\'s list';
    });
    $('ex1-reply-check').addEventListener('click', function () { showResult($('ex1-reply-result'), C.checkReply(REC.ex1.text)); });
    $('ex1-put-thread').addEventListener('click', function () { insertInto('ex1-material', CASE.threadText); });
    $('ex1-put-policy').addEventListener('click', function () { insertInto('ex1-material', CASE.policyText); });
    function parts() {
      var p = {};
      C.PARTS.forEach(function (k) { p[k] = $('ex1-' + k).value; });
      return p;
    }
    $('ex1-check').addEventListener('click', function () { showResult($('ex1-result'), C.checkBrief(parts())); });
    $('ex1-copy').addEventListener('click', function () { copyText(C.assembleBrief(parts()), $('ex1-copy-status')); });
    $('ex1-newreply-check').addEventListener('click', function () { showResult($('ex1-newreply-result'), C.checkReply($('ex1-newreply').value)); });
  }
  function insertInto(id, text) {
    var box = $(id);
    box.value = box.value.trim() ? box.value.replace(/\s+$/, '') + '\n\n' + text : text;
    remember(box);
    box.focus();
  }

  function setupEx2() {
    $('ex2-request').value = C.requestText('summary');
    $('ex2-copy').addEventListener('click', function () { copyText($('ex2-request').value, $('ex2-copy-status')); });
    $('ex2-use-standin').addEventListener('click', function () {
      $('ex2-standin').textContent = standInText(REC.ex2);
      $('ex2-standin').hidden = false;
      $('ex2-answer').value = REC.ex2.text;
      remember($('ex2-answer'));
      $('ex2-answer').focus();
    });
    $('ex2-check').addEventListener('click', function () { showResult($('ex2-result'), C.checkSummary($('ex2-answer').value)); });
    $('ex2-final-check').addEventListener('click', function () { showResult($('ex2-final-result'), C.checkSummary($('ex2-final').value)); });
  }

  function setupEx3() {
    $('ex3-request').textContent = C.requestText('reply');
    var box = $('ex3-answers');
    REC.ex3.forEach(function (a) {
      var art = el('article', { class: 'answer-block' });
      art.appendChild(el('h3', {}, 'Answer ' + a.id));
      art.appendChild(el('div', { class: 'standin' }, standInText(a)));
      art.appendChild(el('pre', { class: 'answer', tabindex: '0', 'aria-label': 'Answer ' + a.id + ', in full' }, a.text));
      C.numberedSentences(a.text).forEach(function (s, i) {
        art.appendChild(radioGroup('mark-' + a.id + (i + 1), a.id + (i + 1) + '. ' + s, C.LABELS, 'sentence'));
      });
      box.appendChild(art);
    });
    $('ex3-check').addEventListener('click', function () {
      var marks = {};
      REC.ex3.forEach(function (a) { a.key.forEach(function (k, i) { var v = chosen('mark-' + a.id + (i + 1)); if (v) { marks[a.id + (i + 1)] = v; } }); });
      showResult($('ex3-result'), C.checkMarks(marks));
    });
    var buttons = $('ex3-auto-buttons');
    REC.ex3.forEach(function (a) {
      var b = el('button', { type: 'button' }, 'Check answer ' + a.id + ' automatically');
      b.addEventListener('click', function () {
        var r = C.checkReply(a.text);
        r.title = 'Answer ' + a.id + ': the automatic reply check';
        showResult($('ex3-auto-result'), r);
      });
      buttons.appendChild(b);
    });
  }

  var currentKey = null;
  function setupEx4() {
    var list = $('ex4-snippets');
    CASE.snippets.forEach(function (s) {
      var art = el('div', { class: 'snippet' });
      art.appendChild(el('h4', {}, 'Snippet ' + s.n + ': ' + s.title));
      art.appendChild(el('p', { class: 'small' }, 'Why someone might paste it: ' + s.purpose));
      art.appendChild(el('pre', { class: 'doc' }, s.text));
      art.appendChild(radioGroup('pile-' + s.n, 'Snippet ' + s.n + ': which pile?', CASE.piles));
      list.appendChild(art);
    });
    $('ex4a-check').addEventListener('click', function () {
      var piles = {};
      CASE.snippets.forEach(function (s) { var v = chosen('pile-' + s.n); if (v) { piles[s.n] = v; } });
      showResult($('ex4a-result'), C.checkPiles(piles));
    });

    var cols = $('ex4-columns');
    var opts = [['keep', 'Keep'], ['standin', 'Replace with a stand-in'], ['leave', 'Leave out']];
    CASE.orders.columns.forEach(function (c) {
      var wrap = el('div', { class: 'column-choice' });
      var id = 'col-' + c.id;
      wrap.appendChild(el('label', { for: id }, c.label));
      var sel = el('select', { id: id, name: id });
      sel.setAttribute('data-choice', '');
      opts.forEach(function (o) { var op = el('option', { value: o[0] }, o[1]); sel.appendChild(op); });
      wrap.appendChild(sel);
      cols.appendChild(wrap);
    });
    function choices() {
      var ch = {};
      CASE.orders.columns.forEach(function (c) { ch[c.id] = $('col-' + c.id).value; });
      return ch;
    }
    $('ex4-prepare').addEventListener('click', function () {
      var ex = C.makeExtract(choices());
      currentKey = ex.key;
      $('ex4-extract').value = ex.text + '\n' + CASE.orders.question + '\n';
      remember($('ex4-extract'));
      showKey(ex.key);
      $('ex4-extract').focus();
    });
    $('ex4b-check').addEventListener('click', function () { showResult($('ex4b-result'), C.checkExtract($('ex4-extract').value)); });
    $('ex4-example').addEventListener('click', function () {
      var key = currentKey || C.makeExtract(choices()).key;
      var text = exampleMapBackAnswer(key);
      if (!text) {
        showText($('ex4-mapback-result'), 'The example needs the customer business column replaced with stand-ins. Choose that, prepare the extract, and try again.', null);
        return;
      }
      $('ex4-answer').value = text;
      remember($('ex4-answer'));
      $('ex4-answer').focus();
    });
    $('ex4-mapback').addEventListener('click', function () {
      var key = currentKey || C.makeExtract(choices()).key;
      showText($('ex4-mapback-result'), 'The answer with the real values put back. This happened on this computer only.', C.mapBack($('ex4-answer').value, key));
    });
  }
  function showKey(key) {
    var box = $('ex4-key');
    box.textContent = '';
    var prefixes = Object.keys(key);
    if (!prefixes.length) {
      box.appendChild(el('p', {}, 'No stand-ins: you kept or left out every column.'));
      return;
    }
    prefixes.forEach(function (p) {
      var dl = el('dl', { class: 'key' });
      Object.keys(key[p]).forEach(function (n) {
        dl.appendChild(el('dt', {}, p + ' ' + (Number(n) < 10 ? '0' + n : n)));
        dl.appendChild(el('dd', {}, key[p][n]));
      });
      box.appendChild(dl);
    });
  }

  function setupEx5() {
    $('ex5-put').addEventListener('click', function () {
      var box = $('ex5-template');
      if (box.value.trim() && !root().confirm('Replace what is in the box with the exercise 2 request?')) { return; }
      box.value = C.requestText('summary');
      remember(box);
      box.focus();
    });
    $('ex5-check').addEventListener('click', function () { showResult($('ex5-result'), C.checkTemplate($('ex5-template').value)); });
  }

  function setupQuiz() {
    var box = $('quiz-questions');
    CASE.quiz.forEach(function (q) {
      var art = el('div', { class: 'question' });
      art.appendChild(radioGroup('q-' + q.n, q.n + '. ' + q.text,
        q.options.map(function (o) { return { id: o.key, label: o.key + '. ' + o.text }; }), 'question-text'));
      box.appendChild(art);
    });
    $('quiz-check').addEventListener('click', function () {
      var answers = {};
      CASE.quiz.forEach(function (q) { var v = chosen('q-' + q.n); if (v) { answers[q.n] = v; } });
      showResult($('quiz-result'), C.checkQuiz(answers));
    });
  }

  // --- saving and restoring every box ------------------------------------------------
  function remember(e) {
    if (e.hasAttribute('data-save')) { state.fields[e.id] = e.value; }
    if (e.hasAttribute('data-choice')) {
      if (e.type === 'radio') { if (e.checked) { state.choices[e.name] = e.value; } } else { state.choices[e.name || e.id] = e.value; }
    }
    saveState();
  }
  function restore() {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-save]'), function (e) {
      if (state.fields[e.id] !== undefined) { e.value = state.fields[e.id]; }
    });
    Array.prototype.forEach.call(doc.querySelectorAll('[data-choice]'), function (e) {
      var v = state.choices[e.name || e.id];
      if (v === undefined) { return; }
      if (e.type === 'radio') { e.checked = (e.value === v); } else { e.value = v; }
    });
  }
  function setupAnswers() {
    doc.addEventListener('input', function (ev) { if (ev.target && ev.target.hasAttribute) { remember(ev.target); } });
    doc.addEventListener('change', function (ev) { if (ev.target && ev.target.hasAttribute) { remember(ev.target); } });
    $('save-text').addEventListener('click', function () {
      var text = answersToText(state, new Date().toISOString().slice(0, 16).replace('T', ' '));
      try {
        var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = el('a', { href: url, download: 'my-workshop-answers.txt' });
        doc.body.appendChild(a);
        a.click();
        doc.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        $('answers-status').textContent = 'Saved as my-workshop-answers.txt, in your downloads folder.';
      } catch (e) {
        $('answers-status').textContent = 'Your browser did not allow saving a file. Copy your answers from the boxes instead.';
      }
    });
    $('clear-all').addEventListener('click', function () {
      if (!root().confirm('Clear every answer in this workbook on this computer? This cannot be undone.')) { return; }
      state = { fields: {}, choices: {} };
      try { root().localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nothing stored */ }
      Array.prototype.forEach.call(doc.querySelectorAll('[data-save]'), function (e) { e.value = ''; });
      Array.prototype.forEach.call(doc.querySelectorAll('input[data-choice]'), function (e) { e.checked = false; });
      Array.prototype.forEach.call(doc.querySelectorAll('select[data-choice]'), function (e) { e.value = 'keep'; });
      Array.prototype.forEach.call(doc.querySelectorAll('.result'), function (e) { e.textContent = ''; });
      $('ex4-key').textContent = '';
      currentKey = null;
      $('answers-status').textContent = 'All your answers in this workbook have been cleared.';
    });
  }

  function init() {
    fillFacts();
    renderCase();
    setupEx1();
    setupEx2();
    setupEx3();
    setupEx4();
    setupEx5();
    setupQuiz();
    loadState();
    restore();
    setupAnswers();
  }

  return {
    STORAGE_KEY: STORAGE_KEY, FIELDS: FIELDS,
    answersToText: answersToText, exampleMapBackAnswer: exampleMapBackAnswer,
    init: init
  };
});
