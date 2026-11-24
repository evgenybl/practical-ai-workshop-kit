/*
 * Practical AI at Work: the checker.
 *
 * Plain functions, no library, no network. It reads the case (case-data.js) and
 * the answers used in the exercises (recorded-answers.js), and nothing else.
 * The workbook page loads this file with <script src>; the tests, the build
 * script and the command-line checker (tools/check.js) load it with require().
 *
 * Every check returns the same kind of result, so the page and the command line
 * show the same words:
 *   { exercise, title, rules: [{ id, name, status, message, items }], notes }
 * status is 'ok' (shown as "OK"), 'look' ("Look again") or 'note' ("Note").
 *
 * The checks match words and figures. They cannot know what a sentence means,
 * so a pass is always worded as what was not found ("I found no ..."), never as
 * a verdict on the text.
 */
(function (root, factory) {
  'use strict';
  var isNode = typeof module === 'object' && module && module.exports;
  var CASE = isNode ? require('./case-data.js') : root.WorkshopCase;
  var REC = isNode ? require('./recorded-answers.js') : root.WorkshopRecorded;
  var api = factory(CASE, REC);
  root.WorkshopChecker = api;
  if (isNode) { module.exports = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CASE, REC) {
  'use strict';

  var F = CASE.facts;
  var money = CASE.format.money;
  var STATUS_WORDS = { ok: 'OK', look: 'Look again', note: 'Note' };

  // ---------------------------------------------------------------------------
  // Text helpers
  // ---------------------------------------------------------------------------
  var CURLY_SINGLE = new RegExp('[' + String.fromCharCode(0x2018, 0x2019, 0x02bc) + ']', 'g');
  var CURLY_DOUBLE = new RegExp('[' + String.fromCharCode(0x201c, 0x201d) + ']', 'g');
  var DASHES = new RegExp('[' + String.fromCharCode(0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2212) + ']', 'g');
  var NBSP = new RegExp('[' + String.fromCharCode(0x00a0, 0x202f, 0x2009) + ']', 'g');

  /** Line ends to \n, typographic quotes and dashes to plain ones. */
  function plain(text) {
    return String(text == null ? '' : text)
      .replace(/\r\n?/g, '\n')
      .replace(CURLY_SINGLE, '\'')
      .replace(CURLY_DOUBLE, '"')
      .replace(DASHES, '-')
      .replace(NBSP, ' ');
  }
  /** Lower case, one space between words: for comparing pasted text. */
  function squash(text) {
    return plain(text).toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function quote(s) { return '"' + s + '"'; }

  // ---------------------------------------------------------------------------
  // Message numbers that a summary cites, such as (msg 3) or (messages 4 and 5).
  // Written so that each part of the input can be matched in only one way: a
  // long, unclosed list takes as long as its length, not twice as long per item.
  // ---------------------------------------------------------------------------
  var CITATION = /[(\[]\s*(?:msgs?|messages?)\.?\s*\d+(?:\s*(?:,|and|&|-|to)\s*(?:(?:msgs?|messages?)\.?\s*)?\d+)*\s*[)\]]/gi;
  // A reference in running text, such as "message 4", "rule 3" or "rules 5 and 6": a pointer, not a figure.
  var REFERENCE = /\b(?:msgs?|messages?|rules?|points?)\.?\s+\d+(?:\s*(?:,|and|&|or|to|-)\s*\d+)*/gi;

  function findCitations(text) {
    var out = [];
    var re = new RegExp(CITATION.source, 'gi');
    var m;
    while ((m = re.exec(text))) {
      out.push({ index: m.index, end: m.index + m[0].length, raw: m[0], messages: (m[0].match(/\d+/g) || []).map(Number) });
    }
    return out;
  }
  function stripCitations(text) { return plain(text).replace(new RegExp(CITATION.source, 'gi'), ' '); }

  // ---------------------------------------------------------------------------
  // Figures and dates. 1,250.00 and 1250 are the same figure. A date written as
  // 28/02, 28.02.2025 or 2025-02-28 is compared as a date: its day and month.
  // Message labels, rule numbers and list numbers are pointers, not figures.
  // A figure written in words, such as "six", is not read.
  // ---------------------------------------------------------------------------
  var NUMBER = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g;
  var DATE_FORMS = [
    { re: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, day: 3, month: 2 },
    { re: /\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/g, day: 1, month: 2 },
    { re: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g, day: 1, month: 2 }
  ];
  var MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  /** Blanks out what is not a figure, keeping every other character where it was. */
  function blank(s) { return s.replace(/[^\n]/g, ' '); }
  function figureText(text) {
    return stripCitations(text)
      .replace(new RegExp(REFERENCE.source, 'gi'), blank)
      .replace(/^([ \t]*)\d{1,2}[.)](?=[ \t])/gm, function (all, lead) { return lead + blank(all.slice(lead.length)); });
  }
  function around(t, index, length) {
    var start = Math.max(0, index - 35);
    var end = Math.min(t.length, index + length + 35);
    var s = t.slice(start, end).replace(/\s+/g, ' ').trim();
    return (start > 0 ? '...' : '') + s + (end < t.length ? '...' : '');
  }
  /** The dates written with figures only, such as 28/02. */
  function extractDates(text) {
    var t = figureText(text);
    var out = [];
    DATE_FORMS.forEach(function (form) {
      var re = new RegExp(form.re.source, 'g');
      var m;
      while ((m = re.exec(t))) {
        var day = Number(m[form.day]);
        var month = Number(m[form.month]);
        var taken = out.some(function (d) { return m.index < d.end && d.index < m.index + m[0].length; });
        if (!taken) {
          out.push({ raw: m[0], display: m[0], day: day, month: month, index: m.index, end: m.index + m[0].length, context: around(t, m.index, m[0].length) });
        }
      }
    });
    return out.sort(function (a, b) { return a.index - b.index; });
  }
  function extractNumbers(text) {
    var t = figureText(text);
    extractDates(text).forEach(function (d) { t = t.slice(0, d.index) + blank(d.raw) + t.slice(d.end); });
    var out = [];
    var re = new RegExp(NUMBER.source, 'g');
    var m;
    while ((m = re.exec(t))) {
      var sign = t.charAt(m.index - 1) === '$' ? '$' : '';
      out.push({ raw: m[0], display: sign + m[0], value: Number(m[0].replace(/,/g, '')), index: m.index, end: m.index + m[0].length, context: around(t, m.index, m[0].length) });
    }
    return out;
  }
  function sameNumber(a, b) { return Math.abs(a - b) < 1e-9; }
  function containsNumber(list, value) {
    for (var i = 0; i < list.length; i++) { if (sameNumber(list[i], value)) { return true; } }
    return false;
  }
  function numberValues(text) { return extractNumbers(text).map(function (n) { return n.value; }); }
  /** How a figure is shown back to the reader: as it was written, with its dollar sign if it had one. */
  function showNumber(n) { return n.display; }
  function messagesList(list) {
    return (list.length === 1 ? 'message ' : 'messages ') + (list.length === 1 ? String(list[0]) : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]);
  }
  /** The dates a text names in words, such as "5 March", as day-month pairs. */
  function namedDates(text) {
    var out = [];
    var re = new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(' + MONTH_NAMES.join('|') + ')\\b', 'gi');
    var m;
    while ((m = re.exec(plain(text)))) { out.push({ day: Number(m[1]), month: MONTH_NAMES.indexOf(m[2].toLowerCase()) + 1 }); }
    return out;
  }
  function dateIn(list, d) {
    return list.some(function (x) { return (x.day === d.day && x.month === d.month) || (x.day === d.month && x.month === d.day); });
  }

  // The policy's rule numbers ("3. Who approves a credit.") are labels, not figures.
  var POLICY_FIGURE_TEXT = CASE.policyText.replace(/^\d+\.\s/gm, '');
  var THREAD_NUMBERS = numberValues(CASE.threadText);
  var POLICY_NUMBERS = numberValues(POLICY_FIGURE_TEXT);
  var THREAD_DATES = namedDates(CASE.threadText);
  var MESSAGE_NUMBERS = CASE.thread.map(function (m) { return numberValues(CASE.messageText(m)); });
  var MESSAGE_DATES = CASE.thread.map(function (m) { return namedDates(CASE.messageText(m)); });

  function whereInThread(value) {
    var found = [];
    MESSAGE_NUMBERS.forEach(function (list, i) { if (containsNumber(list, value)) { found.push(i + 1); } });
    return found;
  }
  function whereDateInThread(d) {
    var found = [];
    MESSAGE_DATES.forEach(function (list, i) { if (dateIn(list, d)) { found.push(i + 1); } });
    return found;
  }

  // ---------------------------------------------------------------------------
  // Sentences and clauses
  // ---------------------------------------------------------------------------
  /** Each line is split at . ! or ? followed by a space. Decimal points do not split. List markers are dropped. */
  function splitSentences(text) {
    var out = [];
    plain(text).split('\n').forEach(function (line) {
      var s = line.trim().replace(/^(?:[-*+]|\d{1,2}[.)])\s+/, '');
      var start = 0;
      for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i);
        if (c === '.' || c === '!' || c === '?') {
          var j = i + 1;
          while (j < s.length && /["')\]]/.test(s.charAt(j))) { j++; }
          if (j === s.length || /\s/.test(s.charAt(j))) {
            var piece = s.slice(start, j).trim();
            if (piece) { out.push(piece); }
            start = j;
            i = j - 1;
          }
        }
      }
      var rest = s.slice(start).trim();
      if (rest) { out.push(rest); }
    });
    return out;
  }
  /** The reply itself: everything above a line of three dashes, under which an assistant may add its own notes. */
  function replyPart(text) {
    return plain(text).split(/\n[ \t]*-{3,}[ \t]*(?:\n|$)/)[0];
  }
  /**
   * Only sentences of the reply that end with . ! or ? are numbered: greetings, sign-offs and the
   * assistant's own notes under a line of three dashes are not.
   */
  function numberedSentences(text) {
    return splitSentences(replyPart(text)).filter(function (s) { return /[.!?]["')\]]*$/.test(s); });
  }
  var CLAUSE_SPLIT = /;\s+|,\s+|:\s+|\s-\s|\s(?:and|but|which|while|whereas|although|though|so)\s/i;
  function splitClauses(sentence) {
    return stripCitations(sentence).toLowerCase().split(CLAUSE_SPLIT).map(function (c) { return c.trim(); }).filter(Boolean);
  }

  // ---------------------------------------------------------------------------
  // Word signs. They are simple on purpose, and the page says so.
  // ---------------------------------------------------------------------------
  var MONTHS = 'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec';
  var RX = {
    late: /\b(late|lateness|delay\w*|overdue|was due|were due|missed|behind schedule|not on time|after the (promised|agreed) date)\b/g,
    short: /\b(missing|short|shortage|fewer|not delivered|undelivered|not (yet )?arrived|did not arrive|didn't arrive|never arrived|never came|left behind|left off|not sent|still to come|still owed)\b/g,
    damage: /\b(damag\w*|crush\w*|wet|broken|unusable|cannot use|can't use|cannot be used|ruined|spoil\w*|unsellable)\b/g,
    promise: /\b(promis\w*|agreed|agree|confirm\w*|commit\w*|undert\w*|said (he|she|they|we) would|guarantee\w*)\b/,
    notKept: /\b(did not|didn't|not kept|no reply|not heard|heard nothing|has not|hasn't|missed|broke|broken|failed|not confirmed|never confirmed|not stated|still waiting)\b/,

    credit: /\b(credit|credits|credited|crediting|refund\w*|reimburs\w*|compensat\w*|money back)\b/,
    hedge: /\b(not|no|never|cannot|can't|nothing|pending|await\w*|waiting|wait|until|once|if|unless|ask|asks|asked|asking|request\w*|want\w*|claim\w*|says|said she|writes|wrote|believes|thinks|according|review\w*|decid\w*|decision|approval|consider\w*|whether|must|need|needs|has to|have to|requir\w*)\b|n't\b/,

    // What a credit promise talks about, and the words that make a statement a promise.
    creditTopic: /\b(credit|credits|credited|crediting|refund\w*|reimburs\w*|compensat\w*|money back|discount)\b|\b(corrected|reduced|amended|new) invoice\b|\boff (the |your |this )?(invoice|bill)\b/,
    moneyTopic: /\b(credit|credits|credited|crediting|refund\w*|reimburs\w*|compensat\w*|money back|discount|invoice|bill|amount)\b|\$\s?\d/,
    asserted: /\b(promis\w*|agreed|agrees|agree|approved|approves|approve|confirmed|confirms|confirm|guarantee\w*|issued|credited|refunded|reimbursed|granted|accepted|committed|commits|commit|offered|offers|offer)\b|\bon (its|the|their) way\b/g,
    future: /\b(will|shall|we'll|i'll|you'll|they'll|she'll|can|am going to|are going to|is going to)\s+((?:[a-z$.,']+\s+){0,2}?)(credit|refund|issue|take|deduct|reduce|remove|correct|reimburse|waive|receive|get|give|send you|cover|pay)\b/g,
    // The same, in the present tense: "we are crediting", "we are taking $219.00 off".
    present: /\b(am|are|is|i'm|we're)\s+((?:[a-z$.,']+\s+){0,2}?)(crediting|refunding|reimbursing|issuing|deducting|reducing|removing|correcting|waiving|giving you|sending you|taking(?=(?:\s+\S+){0,3}\s+off\b))\b/g,
    // An amount stated as approved: "Dana has approved the full $531.00".
    approvedAmount: /\b(approved|granted|authori[sz]ed)\b/g,
    // "Tom said he would credit the cartons": a promise reported in the words of the one who made it.
    saidWould: /\b(said|told \w+|wrote) (?:that )?(?:he|we|they|i) (?:would|will)\s+((?:[a-z$.,']+\s+){0,2}?)(credit|refund|issue|take|deduct|reduce|remove|correct|reimburse|waive|give|cover|pay)\b/g,
    // "Promised: a delivery day, and a credit": a label that names promises, and one that says they were not made.
    promiseLabel: /\b(promis\w*|agreed|committed|confirmed|guaranteed|undertook)\b/,
    labelNot: /\b(not|no|never|nothing|none|unkept|broken)\b|n't\b/,
    // After a promise word, what was promised: to tell, to pass on, to confirm a day. None of these is a credit.
    promisedOther: /^\s+(?:only |just )?to (tell|let|pass|send|forward|refer|ask|check|write|call|ring|phone|update|inform|reply|answer|find out|look into|get back|confirm (?:a|the) (?:\w+ )?(?:day|date))\b/,
    // "confirmed that a credit of this size needs your approval", "confirm that I have passed your request": a report, not a promise.
    reportedThat: /^\s+that\b.*(\b(pass\w*|sent|send\w*|forward\w*|refer\w*|gave|given)\b.*\brequest\b|\b(needs?|requires?|required|must|has to|have to)\b.*\b(approv\w*|decision|decide\w*)\b)/,
    // Words just before a promise word that hold it back: a negation, a condition, a request.
    negation: /^(not|no|never|nothing|none|nobody|neither|nor|cannot|without|won't|can't|cant)$|n't$/,
    localHedge: /\b(whether|if|once|until|unless|before|must|need|needs|needed|require|requires|required|could|may|might|should|would|awaiting|pending|ask|asks|asked|request|requests|requested|want|wants|wanted|please|has to|have to|had to|how to)\b/,
    claim: /\b(says?|said|claims?|claimed|writes|wrote|believes|thinks|according|insists|feels)\b/,

    costTopic: /\b(cash-and-carry|cash and carry|bought|buy|buying|spent|spend|other costs?|elsewhere|replacement|receipt)\b/,
    costVerb: /\b(cover|covers|covered|covering|refund\w*|reimburs\w*|repay\w*|pay for|pay back|pay you|compensat\w*|credit|credited|crediting|include|includes|including)\b/g,
    costCommit: /\b(will|shall|we'll|i'll|can|confirm\w*|agree\w*|happy to|of course|glad to|going to)\b/g,

    deliver: /\b(deliver\w*|arriv\w*|van|be with you|reach you|come to you|get (them|it|the cartons|the missing cartons|your order) to you|have (them|it|the (missing |damaged )?cartons|your (order|cartons|cups)))\b/,
    deliverGoods: /\b(send|sent|ship\w*|dispatch\w*|bring)\b/,
    goods: /\b(cartons?|cups|lids|order|goods|them|missing)\b/,
    scheduled: /\b(scheduled|booked|planned|due|set for)\b/,
    // A delivery stated in the present tense, as a fact: "your cartons arrive on Thursday".
    presentDelivery: /\b(arrive|arrives|is arriving|are arriving|reach|reaches|come|comes|is coming|are coming|go out|goes out|leave|leaves|ships|is due|are due|is scheduled|are scheduled|is booked|are booked)\b/g,
    notPresent: /^(would|could|might|should|did|does|do|to|may|must|can|cannot|not|never|if|when|once|until|unless|will|shall)$/,
    // A delivery that was made: a report of the past, not a promise.
    pastDelivery: /\b(was|were|has been|have been|had been) (delivered|sent|shipped|dispatched)\b|\b(arrived|came)\b/,
    when: new RegExp('\\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|tonight|this (morning|afternoon|evening|week)|next week|within \\d+ (hours|days|working days)|\\d{1,2}(st|nd|rd|th)? (' + MONTHS + ')|(' + MONTHS + ') \\d{1,2})\\b'),
    dateCommit: /\b(will|shall|we'll|i'll|you'll|they'll|guarantee\w*|promis\w*|confirm\w*|arranged|booked|scheduled|definitely|certainly|going to|can (deliver|send|bring|get))\b/,
    dateHedge: /\b(not|no|never|cannot|can't|until|once|as soon as|if|unless|let you know|find out|check\w*|call you|ring you|phone you|write to you|tell you|update you|get back to you|be in touch|e-?mail you|will confirm|hope|try|aim|expect|ask\w*|whether)\b|n't\b|confirm (the|a) (\w+ )?day/,

    person: /\b(i|we|our|my|me|us|customer|client|manager|she|he|they|her|his|their)\b/,
    action: /\b(write|draft|reply|respond|answer|summari[sz]e|list|prepare|rewrite|compose|suggest|create|produce|explain|translate|check|compare|turn|make|give)\b/,
    length: /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty)\s+(\w+\s+)?(words?|sentences?|paragraphs?|lines?|bullets?|bullet points?|points?|items?|pages?|characters?)\b/,
    structure: /\b(paragraphs?|bullets?|bullet points?|list|table|headings?|numbered|subject line|sections?|columns?|steps)\b/,
    prohibit: /\b(do not|don't|dont|never|must not|mustn't|should not|shouldn't|may not|cannot|can't|avoid|not allowed|forbidden)\b|(^|[.!?\n]\s*)no\s+\w+/
  };

  /** The last few words before a position, after the last punctuation mark. */
  function wordsBefore(text, index, n) {
    var parts = text.slice(0, index).split(/[.!?;:,()]/);
    return parts[parts.length - 1].split(/\s+/).filter(Boolean).slice(-n);
  }
  function negated(words) { return words.some(function (w) { return RX.negation.test(w.replace(/[^a-z']/g, '')); }); }
  /**
   * True if a match of the regular expression stands in the text as stated: not negated or
   * held back by a condition in the four words before it, and not after "says" or "claims".
   * skip(match, text), if given, can set aside a match for a reason of its own.
   */
  function liveMatch(text, re, skip) {
    var r = new RegExp(re.source, 'g');
    var m;
    while ((m = r.exec(text))) {
      var before = wordsBefore(text, m.index, 4);
      var next = text.slice(m.index + m[0].length).split(/\s+/).filter(Boolean)[0] || '';
      if (negated(before) || RX.localHedge.test(before.join(' ')) || RX.claim.test(text.slice(0, m.index))) { continue; }
      // "promises no credit": the negation comes just after the word.
      if (negated([next])) { continue; }
      // An instruction, "confirm the amount", is not a promise: a base verb with no subject before it.
      if (before.length === 0 && /^(confirm|approve|agree|promise|guarantee|accept|offer|commit)$/.test(m[0])) { continue; }
      if (skip && skip(m, text)) { continue; }
      return true;
    }
    return false;
  }
  /**
   * For a credit: a promise word that is about something else. "promised to tell her the decision",
   * "agreed to pass the request on", "confirmed that a credit of this size needs approval", and
   * "the credit is for Dana to approve" promise no credit.
   */
  function notACreditPromise(m, text) {
    var after = text.slice(m.index + m[0].length);
    if (/^(promis|agree|commit|offer|undert)/.test(m[0]) && RX.promisedOther.test(after)) { return true; }
    if (/^(confirm|agree)/.test(m[0]) && RX.reportedThat.test(after)) { return true; }
    return /^(approve|agree|confirm|accept|promise|guarantee)$/.test(m[0]) && /(^|\s)(for|up to) \S+ to$/.test(wordsBefore(text, m.index, 4).join(' '));
  }
  /** True if a sign is in the text and not negated just before it: "not late" is not a sign of lateness. */
  function signPresent(text, re) {
    var r = new RegExp(re.source, 'g');
    var m;
    while ((m = r.exec(text))) {
      if (!negated(wordsBefore(text, m.index, 3))) { return true; }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Detectors for the three things a reply to this customer must never promise,
  // and for the trap of the two sixes. Each looks at one sentence.
  // ---------------------------------------------------------------------------
  /** A credit, or money off, stated as promised, agreed or given; or promised for the future, or as happening now. */
  function promisesCredit(sentence) {
    var clauses = splitClauses(sentence);
    return clauses.some(function (c, i) {
      if (RX.creditTopic.test(c) && liveMatch(c, RX.asserted, notACreditPromise)) { return true; }
      if (/\$\s?\d/.test(c) && liveMatch(c, RX.approvedAmount)) { return true; }
      if (asPromisedBeside(clauses, i)) { return true; }
      if (!RX.moneyTopic.test(c)) { return false; }
      return [RX.future, RX.present].some(function (re) {
        var r = new RegExp(re.source, 'g');
        var m;
        while ((m = r.exec(c))) {
          var before = wordsBefore(c, m.index, 4);
          var between = m[2].split(/\s+/).filter(Boolean);
          if (negated(before) || negated(between) || RX.localHedge.test(before.join(' ')) || RX.claim.test(c.slice(0, m.index))) { continue; }
          return true;
        }
        return false;
      }) || saidWould(c);
    }) || promisedInList(sentence);
  }
  /** "Tom said he would credit the cartons", but not "Mira said he would": that is her claim. */
  function saidWould(c) {
    var r = new RegExp(RX.saidWould.source, 'g');
    var customer = new RegExp('^(she|her|customer|' + F.contactFirst.toLowerCase() + '|' + F.contact.split(' ').slice(-1)[0].toLowerCase() + ')$');
    var m;
    while ((m = r.exec(c))) {
      var who = wordsBefore(c, m.index, 1)[0] || '';
      if (customer.test(who) || negated(m[2].split(/\s+/).filter(Boolean)) || RX.claim.test(c.slice(0, m.index))) { continue; }
      return true;
    }
    return false;
  }
  /** "A credit is due to her, as promised": the tag "as promised" makes the clause beside it a promise. */
  function asPromisedBeside(clauses, i) {
    var tag = /\bas (promised|agreed|confirmed)$/;
    var c = clauses[i].replace(/[.!?"')\]]+$/, '');
    if (!tag.test(c)) { return false; }
    function statedCredit(text) { return !!text && RX.creditTopic.test(text) && !RX.hedge.test(text) && !RX.claim.test(text); }
    return statedCredit(c.replace(tag, '')) || statedCredit(clauses[i - 1]) || statedCredit(clauses[i + 1]);
  }
  /**
   * "Promised: a delivery day by Friday, and a credit for the damaged cartons." Under a label that
   * names promises, each item of the list is stated as promised.
   */
  function promisedInList(sentence) {
    var t = stripCitations(sentence).toLowerCase();
    var colon = t.indexOf(': ');
    if (colon === -1) { return false; }
    var label = t.slice(0, colon);
    if (!RX.promiseLabel.test(label) || RX.labelNot.test(label) || RX.claim.test(label)) { return false; }
    return t.slice(colon + 2).split(CLAUSE_SPLIT).some(function (item) {
      return RX.creditTopic.test(item) && !RX.hedge.test(item) && !RX.claim.test(item);
    });
  }
  /** An offer to pay the customer's other costs (the cash-and-carry purchase). */
  function promisesCosts(sentence) {
    var cl = splitClauses(sentence);
    function topic(c) { return RX.costTopic.test(c) || containsNumber(numberValues(c), F.localPurchase); }
    for (var i = 0; i < cl.length; i++) {
      if (!liveMatch(cl[i], RX.costVerb)) { continue; }
      var near = cl.slice(Math.max(0, i - 1), i + 2);
      var before = cl.slice(Math.max(0, i - 1), i + 1);
      if (near.some(topic) && before.some(function (c) { return liveMatch(c, RX.costCommit); })) { return true; }
    }
    return false;
  }
  /** A day or date given for a delivery of the cartons, as a commitment, or as a fact in the present tense. */
  function promisesDate(sentence) {
    return splitClauses(sentence).some(function (c) {
      var delivery = RX.deliver.test(c) || (RX.goods.test(c) && (RX.deliverGoods.test(c) || RX.scheduled.test(c)));
      if (!delivery || !RX.when.test(c) || RX.dateHedge.test(c)) { return false; }
      var commits = c.match(new RegExp(RX.dateCommit.source, 'g')) || [];
      var now = deliveryNow(c);
      // "I can confirm that your order was delivered on Wednesday": a report of what happened.
      if (!now && RX.pastDelivery.test(c) && commits.every(function (w) { return /^confirm/.test(w); })) { return false; }
      return commits.length > 0 || now;
    });
  }
  /** "Your cartons arrive on Thursday": a delivery verb in the present tense, not after "would", "to" or "if". */
  function deliveryNow(c) {
    var r = new RegExp(RX.presentDelivery.source, 'g');
    var m;
    while ((m = r.exec(c))) {
      if (!RX.notPresent.test(wordsBefore(c, m.index, 1)[0] || '')) { return true; }
    }
    return false;
  }
  /**
   * The thread uses one figure twice: cartons that never arrived, and cartons
   * that arrived crushed. Each use of that figure should say which group it
   * counts; the two together should not be counted as one group.
   */
  function countIssues(sentence) {
    var text = stripCitations(sentence).toLowerCase();
    var nums = extractNumbers(text);
    var issues = [];
    var both = F.cupsMissing + F.cupsCrushed;
    nums.forEach(function (n, k) {
      var isGroup = sameNumber(n.value, F.cupsMissing) || sameNumber(n.value, F.cupsCrushed);
      var isBoth = sameNumber(n.value, both);
      if (!isGroup && !isBoth) { return; }
      // The words that go with this figure: up to the next figure, the next punctuation, or six words.
      var forward = text.slice(n.end, k + 1 < nums.length ? nums[k + 1].index : text.length).split(/[,;:.!?()]/)[0]
        .split(/\s+/).filter(Boolean).slice(0, 6).join(' ');
      var backParts = text.slice(k > 0 ? nums[k - 1].end : 0, n.index).split(/[,;:.!?()]/);
      var backward = backParts[backParts.length - 1].split(/\s+/).filter(Boolean).slice(-6).join(' ');
      var shortRe = new RegExp(RX.short.source);
      var damageRe = new RegExp(RX.damage.source);
      var seg = (shortRe.test(forward) || damageRe.test(forward)) ? forward : backward;
      var s = shortRe.test(seg);
      var d = damageRe.test(seg);
      if (isGroup && s && d) {
        issues.push({ kind: 'merged', figure: n.raw, sentence: sentence });
      } else if (isBoth && !isGroup && s !== d && !/^\s*oz\b/.test(forward)) {
        issues.push({ kind: d ? 'both-as-damaged' : 'both-as-missing', figure: n.raw, sentence: sentence });
      }
    });
    return issues;
  }

  // ---------------------------------------------------------------------------
  // Shared rules
  // ---------------------------------------------------------------------------
  function rule(id, name, status, message, items) {
    return { id: id, name: name, status: status, message: message, items: items || [] };
  }
  var EMPTY_MESSAGE = 'This box is empty. Paste or write the text first, then check it.';
  /** The same rules, each saying only that the box is empty. */
  function emptied(result) {
    result.rules = result.rules.map(function (r) { return rule(r.id, r.name, 'note', EMPTY_MESSAGE); });
    return result;
  }

  function numbersRule(text, allowed, materialName) {
    var nums = extractNumbers(text);
    var dates = extractDates(text);
    var total = nums.length + dates.length;
    if (total === 0) {
      return rule('numbers', 'The figures', 'note', 'I found no figures written in digits. Figures written in words, such as "six", are not checked.');
    }
    var seen = {};
    var items = [];
    nums.filter(function (n) { return !containsNumber(allowed, n.value); }).forEach(function (n) {
      if (seen[n.value]) { return; }
      seen[n.value] = true;
      items.push(showNumber(n) + ' is not in the material: check it. It appears here: ' + quote(n.context));
    });
    dates.filter(function (d) { return !dateIn(THREAD_DATES, d); }).forEach(function (d) {
      items.push(d.display + ' is not a date in the material: check it. It appears here: ' + quote(d.context));
    });
    if (items.length === 0) {
      return rule('numbers', 'The figures', 'ok',
        'Every figure I found in this answer (' + plural(total, 'figure') + ') is in ' + materialName + '. Being there does not make it right: check that each one means what the answer says it means.');
    }
    return rule('numbers', 'The figures', 'look',
      plural(items.length, 'figure') + ' in this answer ' + (items.length === 1 ? 'is' : 'are') + ' not in ' + materialName +
      '. If a figure was worked out from others, check the sum yourself. If you cannot tell where it came from, take it out until you can.', items);
  }

  function countsRule(text) {
    var issues = [];
    splitSentences(text).forEach(function (s) { issues = issues.concat(countIssues(s)); });
    var name = 'The two groups of ' + F.cupsCrushed;
    if (issues.length === 0) {
      return rule('counts', name, 'ok',
        'The thread uses ' + F.cupsCrushed + ' twice: ' + F.cupsMissing + ' cartons that never arrived, and ' + F.cupsCrushed +
        ' that arrived crushed. I found no figure here that merges the two.');
    }
    return rule('counts', name, 'look',
      'The thread uses ' + F.cupsCrushed + ' twice, for two different groups: ' + F.cupsMissing + ' cartons that never arrived (message 3), and ' + F.cupsCrushed +
      ' of the ' + F.cupsDelivered + ' delivered that arrived crushed (message 3). Check that each figure here says which group it counts.',
      issues.map(function (i) {
        if (i.kind === 'merged') { return 'This sentence uses ' + i.figure + ' for both groups at once: ' + quote(i.sentence); }
        return 'This sentence counts ' + i.figure + ' cartons as ' + (i.kind === 'both-as-damaged' ? 'damaged' : 'missing') +
          '. ' + F.cupsCrushed + ' were crushed and ' + F.cupsMissing + ' never arrived: ' + quote(i.sentence);
      }));
  }

  function creditRule(text, forSummary) {
    var hits = splitSentences(text).filter(promisesCredit);
    var name = forSummary ? 'The promise that was never given' : 'Promises of a credit';
    if (hits.length === 0) {
      return rule('credit', name, 'ok', forSummary
        ? 'I found no sentence that says a credit was promised or agreed. In the thread, ' + F.staffFirst + ' passed the request to the ' + F.managerRole + ' and promised no credit (message 4).'
        : 'I found no sentence that promises a credit, an amount or money off. Under the policy, a credit above ' + money(F.staffCreditLimit) + ' needs the ' + F.managerRole + '\'s approval first (rules 3 and 6).');
    }
    return rule('credit', name, 'look', forSummary
      ? 'This answer seems to say that a credit was promised or agreed. ' + F.staffFirst + ' never promised one: he wrote that it must be approved by the ' + F.managerRole + ' (message 4). ' +
        F.contactFirst + ' writes "the credit you promised" (message 5), but that is her claim, not a promise. Write "' + F.contactFirst + ' says", or say plainly that no credit was promised.'
      : 'This reply seems to promise a credit, an amount or money off. Under the policy, a credit above ' + money(F.staffCreditLimit) + ' must be approved by the ' + F.managerRole + ', and no credit may be promised by e-mail before it is approved (rules 3 and 6).',
      hits.map(function (s) { return 'Read this sentence: ' + quote(s); }));
  }

  function costsRule(text) {
    var hits = splitSentences(text).filter(promisesCosts);
    if (hits.length === 0) {
      return rule('costs', 'Offers to pay other costs', 'ok',
        'I found no sentence that offers to pay for the cups bought elsewhere. Under the policy, that needs the ' + F.managerRole + '\'s agreement in writing (rules 5 and 6).');
    }
    return rule('costs', 'Offers to pay other costs', 'look',
      'This reply seems to offer to pay the customer\'s other costs. The policy says we do not pay for goods bought elsewhere unless the ' + F.managerRole +
      ' agrees in writing, and that this is never promised by e-mail (rules 5 and 6).',
      hits.map(function (s) { return 'Read this sentence: ' + quote(s); }));
  }

  function dateRule(text) {
    var hits = splitSentences(text).filter(promisesDate);
    if (hits.length === 0) {
      return rule('date', 'Promises of a delivery day', 'ok',
        'I found no sentence that promises a day for the missing cartons. The warehouse has not confirmed one, and ' + F.staffFirst + ' wrote that the van does not come until next week (message 4).');
    }
    return rule('date', 'Promises of a delivery day', 'look',
      'This reply seems to promise a delivery day. No day has been confirmed by the warehouse (message 4), and the policy says never to promise one that is not confirmed (rule 6).',
      hits.map(function (s) { return 'Read this sentence: ' + quote(s); }));
  }

  var WORD_SIGNS_NOTE = 'The checks for promises look for words that usually mean a promise. They can miss one, or flag a sentence that is fine. Read each flagged sentence yourself and decide.';
  var WORDS_NOTE = 'Figures written in words, such as "six", are not checked. Dates written with figures, such as 28/02, are compared by day and month.';

  // ---------------------------------------------------------------------------
  // Exercise 1: the five-part brief. It checks that each part is there and does
  // its job by simple signs. It does not judge whether the brief is good.
  // ---------------------------------------------------------------------------
  var PARTS = ['situation', 'material', 'task', 'form', 'limits'];
  var PART_NAMES = { situation: 'Situation', material: 'Material', task: 'Task', form: 'Form', limits: 'Limits' };

  function firstWords(text, n) {
    return squash(text).split(' ').slice(0, n).join(' ');
  }
  var MESSAGE_MARKERS = CASE.thread.map(function (m) {
    var para = m.body.filter(function (p) { return p.split(/\s+/).length >= 8; })[0];
    return firstWords(para, 8);
  });
  var POLICY_MARKER = firstWords(CASE.policy.rules[2].text, 8);

  function countWords(text) {
    return stripCitations(text).split(/\s+/).filter(function (w) { return /[A-Za-z0-9]/.test(w); }).length;
  }

  function checkBrief(parts) {
    var p = {};
    PARTS.forEach(function (k) { p[k] = plain((parts && parts[k]) || '').trim(); });
    var rules = [];

    // Situation
    var sw = countWords(p.situation);
    if (!p.situation) {
      rules.push(rule('situation', 'Situation', 'look', 'This box is empty. Say who you are, who the reader is and what has happened, so the assistant does not have to guess.'));
    } else if (sw < 12 || !RX.person.test(p.situation.toLowerCase())) {
      rules.push(rule('situation', 'Situation', 'look',
        'I found ' + plural(sw, 'word') + ' here. A situation usually needs at least 12 words and says who is involved (I, we, the customer, the manager). Say who you are, who the reader is and what has happened.'));
    } else {
      rules.push(rule('situation', 'Situation', 'ok', 'I found ' + plural(sw, 'word') + ', and a word that says who is involved.'));
    }

    // Material
    var mat = squash(p.material);
    var found = [];
    MESSAGE_MARKERS.forEach(function (mk, i) { if (mat.indexOf(mk) !== -1) { found.push(i + 1); } });
    if (!p.material) {
      rules.push(rule('material', 'Material', 'look', 'This box is empty. Press the button above the box to put the whole thread in it; do not type a note. About your case, an assistant knows only what you give it.'));
    } else if (found.length < CASE.thread.length) {
      rules.push(rule('material', 'Material', 'look',
        'I looked for the opening words of each of the ' + CASE.thread.length + ' messages and found ' + found.length +
        (found.length ? ' (message ' + found.join(', ') + ')' : '') + '. About your case, an assistant knows only what you give it: press the button above the box to put the whole thread in it.'));
    } else {
      rules.push(rule('material', 'Material', 'ok', 'I found the opening words of all ' + CASE.thread.length + ' messages of the thread.'));
    }

    // Task
    if (!p.task) {
      rules.push(rule('task', 'Task', 'look', 'This box is empty. Say the one job you want done, starting with a verb: "Draft my reply to her last message."'));
    } else if (!RX.action.test(p.task.toLowerCase())) {
      rules.push(rule('task', 'Task', 'look',
        'I found no word that says what to produce, such as write, draft, reply or summarise. Start the task with the job: "Draft my reply to her last message."'));
    } else {
      rules.push(rule('task', 'Task', 'ok', 'I found a word that says what to produce: ' + quote(p.task.toLowerCase().match(RX.action)[0]) + '.'));
    }

    // Form
    var fl = p.form.toLowerCase();
    if (!p.form) {
      rules.push(rule('form', 'Form', 'look', 'This box is empty. Name a length, such as "at most 150 words", or a structure, such as "three short paragraphs".'));
    } else if (RX.length.test(fl) || RX.structure.test(fl)) {
      var what = [];
      if (RX.length.test(fl)) { what.push('a length (' + quote(fl.match(RX.length)[0]) + ')'); }
      if (RX.structure.test(fl)) { what.push('a structure (' + quote(fl.match(RX.structure)[0]) + ')'); }
      rules.push(rule('form', 'Form', 'ok', 'I found ' + what.join(' and ') + '.'));
    } else {
      rules.push(rule('form', 'Form', 'look',
        'I found no length and no structure. Words such as "short" or "brief" mean different things to different people. Name a length, such as "at most 150 words", or a structure, such as "three short paragraphs".'));
    }

    // Limits
    var ll = p.limits.toLowerCase();
    if (!p.limits) {
      rules.push(rule('limits', 'Limits', 'look', 'This box is empty. Say what the answer must not do, as a plain sentence: "Do not promise a credit."'));
    } else if (RX.prohibit.test(ll)) {
      rules.push(rule('limits', 'Limits', 'ok', 'I found at least one explicit prohibition (' + quote(ll.match(RX.prohibit)[0].trim()) + ').'));
    } else {
      rules.push(rule('limits', 'Limits', 'look',
        'I found no explicit prohibition. Limits work best as plain "Do not ..." sentences: "Do not promise a credit or any amount."'));
    }

    // The policy: a note, not a rule
    var notes = ['This check looks for the presence of each part by simple signs. It does not judge whether your brief is good: send it to an assistant, or compare it with the model brief.'];
    if (p.material && mat.indexOf(POLICY_MARKER) === -1) {
      notes.push('The policy is not in your material. If your limits rely on it (for example, who may approve a credit), paste it too.');
    }
    return { exercise: '1', title: 'From a wish to a brief', rules: rules, notes: notes };
  }

  /** The text form of a brief: one heading per part. The page copies it; the command line reads it. */
  function assembleBrief(parts) {
    return PARTS.map(function (k) { return '## ' + PART_NAMES[k] + '\n' + plain(parts[k] || '').trim(); }).join('\n\n') + '\n';
  }
  function materialText(names) {
    return names.map(function (n) { return n === 'policy' ? CASE.policyText : CASE.threadText; }).join('\n');
  }
  /**
   * The exact text of a prepared request: 'wish', 'summary' or 'reply'.
   * With { withoutCiteLine: true }, the summary request without the line that asks for message
   * numbers: in exercise 2 the participant writes that line.
   */
  function requestText(name, options) {
    var b = CASE.briefs[name];
    if (!b) { throw new Error('Unknown request: ' + name); }
    if (b.line) { return b.line + '\n\n' + materialText(b.material); }
    var parts = {};
    PARTS.forEach(function (k) { parts[k] = k === 'material' ? materialText(b.material) : b[k]; });
    if (options && options.withoutCiteLine && b.citeLine) { parts.form = parts.form.replace(' ' + b.citeLine, ''); }
    return assembleBrief(parts);
  }

  // ---------------------------------------------------------------------------
  // Exercise 2, step 1: the request the participant makes checkable
  // ---------------------------------------------------------------------------
  var CITE_SOURCE = /\b(message|messages|msg|source|sources|where (it|each|they|the fact) (comes?|came) from)\b/;
  var CITE_EACH = /\b(each|every|after|all)\b/;
  var CITE_WHAT = /\b(facts?|figures?|points?|bullets?|claims?|lines?|statements?|sentences?|numbers?)\b/;
  function checkRequest(text) {
    var t = plain(text);
    var mat = squash(t);
    var found = MESSAGE_MARKERS.filter(function (mk) { return mat.indexOf(mk) !== -1; }).length;
    var asks = splitSentences(t).filter(function (s) {
      var l = s.toLowerCase();
      return CITE_SOURCE.test(l) && CITE_EACH.test(l) && CITE_WHAT.test(l);
    });
    var rules = [
      asks.length
        ? rule('cite', 'A source for every fact', 'ok', 'I found a line that asks for the source of each fact: ' + quote(asks[0]) + '. Now every figure in the answer will point to the message to check it against.')
        : rule('cite', 'A source for every fact', 'look', 'I found no line that asks the assistant to say, after each fact, which message it comes from. Add one to the Form part, for example: "After each fact, put the number of the message it comes from in brackets."'),
      found === CASE.thread.length
        ? rule('material', 'The thread', 'ok', 'I found the opening words of all ' + CASE.thread.length + ' messages: the thread is still in the request.')
        : rule('material', 'The thread', 'look', 'I found the opening words of ' + found + ' of the ' + CASE.thread.length + ' messages. Keep the whole thread in the request: the assistant can cite only what it has.')
    ];
    var result = { exercise: '2-request', heading: 'Exercise 2, step 1: the request', title: 'The request', rules: rules, notes: ['This check looks for the presence of a line by simple signs, not for its quality.'] };
    return t.trim() ? result : emptied(result);
  }
  function parseBrief(text) {
    var parts = { situation: '', material: '', task: '', form: '', limits: '' };
    var current = null;
    var buf = {};
    plain(text).split('\n').forEach(function (line) {
      var h = line.match(/^\s*#{1,6}\s*(situation|material|task|form|limits)\s*:?\s*$/i) ||
              line.match(/^\s*(situation|material|task|form|limits)\s*:\s*(.*)$/i);
      if (h) {
        current = h[1].toLowerCase();
        buf[current] = buf[current] || [];
        if (h[2]) { buf[current].push(h[2]); }
        return;
      }
      if (current) { buf[current].push(line); }
    });
    PARTS.forEach(function (k) { parts[k] = (buf[k] || []).join('\n').trim(); });
    return parts;
  }

  // ---------------------------------------------------------------------------
  // A reply to the customer (exercise 1, the recorded answer and step 4; the
  // answers of exercise 3).
  // ---------------------------------------------------------------------------
  function checkReply(text) {
    var t = plain(text);
    var rules = [
      numbersRule(t, THREAD_NUMBERS.concat(POLICY_NUMBERS), 'the thread or the policy'),
      countsRule(t),
      creditRule(t, false),
      costsRule(t),
      dateRule(t)
    ];
    var result = { exercise: 'reply', title: 'A reply to the customer', rules: rules, notes: [WORD_SIGNS_NOTE, WORDS_NOTE] };
    return t.trim() ? result : emptied(result);
  }

  // ---------------------------------------------------------------------------
  // Exercise 2: the summary for the manager
  // ---------------------------------------------------------------------------
  var SUMMARY_LIMIT = 120;

  function citationsRule(text) {
    var sentences = splitSentences(text);
    var total = 0;
    var items = [];
    sentences.forEach(function (s) {
      var cites = findCitations(s);
      total += cites.length;
      var from = 0;
      cites.forEach(function (c) {
        var segment = s.slice(from, c.index);
        from = c.end;
        extractNumbers(segment).forEach(function (n) {
          var inThread = whereInThread(n.value);
          if (inThread.length === 0) { return; }
          var ok = c.messages.some(function (m) { return m >= 1 && m <= MESSAGE_NUMBERS.length && containsNumber(MESSAGE_NUMBERS[m - 1], n.value); });
          if (!ok) {
            items.push(showNumber(n) + ' is cited to ' + messagesList(c.messages) + ', but it is in ' + messagesList(inThread) + '.');
          }
        });
        extractDates(segment).forEach(function (d) {
          var inThread = whereDateInThread(d);
          if (inThread.length === 0) { return; }
          var ok = c.messages.some(function (m) { return m >= 1 && m <= MESSAGE_DATES.length && dateIn(MESSAGE_DATES[m - 1], d); });
          if (!ok) {
            items.push('The date ' + d.display + ' is cited to ' + messagesList(c.messages) + ', but it is in ' + messagesList(inThread) + '.');
          }
        });
      });
    });
    if (total === 0) {
      return rule('citations', 'Message numbers', 'note',
        'I found no message numbers, such as (msg 3). Asking for them makes an answer much quicker to check: each figure then points to the place to look.');
    }
    if (items.length === 0) {
      return rule('citations', 'Message numbers', 'ok', 'I checked ' + plural(total, 'citation') + ', and each figure I found is in the message its citation names.');
    }
    return rule('citations', 'Message numbers', 'look',
      plural(items.length, 'figure') + ' cannot be found in the message cited for ' + (items.length === 1 ? 'it' : 'them') +
      '. Open that message and the one named below, and correct the citation or the figure.', items);
  }

  /** "Due 28 Feb ... delivered 5 Mar": a due date, and a later date of delivery, say that it came late. */
  function lateByDates(lower) {
    // The first date that follows the word in the same clause, as month * 100 + day.
    function dateAfter(re) {
      var r = new RegExp(re.source, 'g');
      var m;
      while ((m = r.exec(lower))) {
        var clause = lower.slice(m.index, m.index + m[0].length + 30).split(/[.;:!?(]/)[0];
        var d = namedDates(clause.replace(SHORT_MONTH, function (all, day, mon) { return day + ' ' + FULL_MONTH[mon]; }))[0];
        if (d) { return d.month * 100 + d.day; }
      }
      return null;
    }
    var due = dateAfter(/\b(due|was due|were due)\b/);
    var came = dateAfter(/\b(delivered|arrived|came)\b/);
    return due !== null && came !== null && came > due;
  }
  var FULL_MONTH = { jan: 'january', feb: 'february', mar: 'march', apr: 'april', jun: 'june', jul: 'july', aug: 'august', sep: 'september', sept: 'september', oct: 'october', nov: 'november', dec: 'december' };
  var SHORT_MONTH = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\b\.?/g;
  function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function factRule(fact, nums) {
    var ok = fact.numbers.some(function (set) { return set.every(function (v) { return containsNumber(nums, v); }); });
    if (ok) {
      return rule('fact-' + fact.id, capital(fact.name), 'ok', 'I found it, as required.');
    }
    return rule('fact-' + fact.id, capital(fact.name), 'look',
      'Required, and I did not find it written in digits. Look in ' + fact.where + '.');
  }

  function checkSummary(text) {
    var t = plain(text);
    var lower = stripCitations(t).toLowerCase();
    var nums = numberValues(t);
    var rules = [];
    rules.push(numbersRule(t, THREAD_NUMBERS, 'the thread'));
    rules.push(citationsRule(t));

    var facts = CASE.summaryFacts;
    rules.push(factRule(facts[0], nums));
    rules.push(factRule(facts[1], nums));

    // What went wrong: late, short, damaged
    var missingSigns = [];
    if (!signPresent(lower, RX.late) && !lateByDates(lower)) { missingSigns.push('that the delivery was late (message 1)'); }
    if (!signPresent(lower, RX.short) && !containsNumber(nums, F.cupsDelivered)) { missingSigns.push('that cartons were missing (message 3)'); }
    if (!signPresent(lower, RX.damage)) { missingSigns.push('that cartons arrived damaged (message 3)'); }
    rules.push(missingSigns.length === 0
      ? rule('fact-wrong', 'What went wrong', 'ok', 'I found, as required, words that say the order was late, that cartons were missing, and that cartons were damaged.')
      : rule('fact-wrong', 'What went wrong', 'look', 'Required. Three things went wrong, and I did not find words that say ' + missingSigns.join(', or ') + '. The check looks for words such as late, missing and damaged, and does not count them after "not" or "nothing".'));

    rules.push(factRule(facts[2], nums));

    // What was promised: the promise word, the credit's status, and the promise that was not kept
    var saysPromise = RX.promise.test(lower);
    var creditStatus = splitSentences(t).some(function (s) {
      return splitClauses(s).some(function (c) { return RX.credit.test(c) && RX.hedge.test(c); });
    });
    var confirmDay = F.dates.confirmBy;
    var sentencesLower = splitSentences(t).map(function (s) { return { text: s, lower: stripCitations(s).toLowerCase() }; });
    var mentionsPromise = sentencesLower.some(function (s) {
      var byWhen = new RegExp('\\b(' + confirmDay.weekday.toLowerCase() + '|' + confirmDay.weekday.slice(0, 3).toLowerCase() + ')\\b').test(s.lower) ||
        containsNumber(numberValues(s.text), confirmDay.day);
      return /\b(confirm\w*|promis\w*|said he would|would (tell|let))/.test(s.lower) && /\b(day|date|delivery)\b/.test(s.lower) && byWhen;
    });
    var saysNotKept = sentencesLower.some(function (s) {
      return RX.notKept.test(s.lower) && /\b(confirm\w*|reply|replied|heard|day|date)\b/.test(s.lower);
    });
    var unkept = mentionsPromise && saysNotKept;
    if (saysPromise && creditStatus && unkept) {
      rules.push(rule('fact-promised', 'What was promised', 'ok',
        'I found, as required: a word such as promised; a mention of the promise to confirm a delivery day by ' + confirmDay.weekday +
        ', with a sign that it was not kept; and the credit described as asked for or awaiting a decision.'));
    } else {
      var lacks = [];
      if (!saysPromise) { lacks.push('a word such as promised, agreed or confirmed'); }
      if (!unkept) { lacks.push(F.staffFirst + '\'s promise to confirm a delivery day by ' + CASE.format.wdm(confirmDay) + ', and that it was not kept (messages 4 and 5)'); }
      if (!creditStatus) { lacks.push('the credit described as asked for, or as waiting for a decision (message 4)'); }
      rules.push(rule('fact-promised', 'What was promised', 'look',
        'Required, and I did not find ' + lacks.join('; or ') + '. A manager deciding on a credit needs to know what the company has already promised, and which promise it broke.'));
    }

    var words = countWords(t);
    rules.push(words <= SUMMARY_LIMIT
      ? rule('length', 'Length', 'ok', 'I counted ' + plural(words, 'word') + '; the limit is ' + SUMMARY_LIMIT + '. Message numbers in brackets are not counted.')
      : rule('length', 'Length', 'look', 'I counted ' + plural(words, 'word') + '; the limit is ' + SUMMARY_LIMIT + '. A manager with two minutes needs the short version. Message numbers in brackets are not counted.'));

    rules.push(creditRule(t, true));
    rules.push(countsRule(t));

    var result = { exercise: '2', title: 'Summarise, and prove it', rules: rules, notes: [WORDS_NOTE, WORD_SIGNS_NOTE] };
    return t.trim() ? result : emptied(result);
  }

  // ---------------------------------------------------------------------------
  // Exercise 3: marks against the key
  // ---------------------------------------------------------------------------
  var LABELS = [
    { id: 'fine', label: 'Fine' },
    { id: 'figure', label: 'A wrong figure' },
    { id: 'material', label: 'Not in the material' },
    { id: 'policy', label: 'Against the policy' }
  ];
  var LABEL_NAMES = {};
  LABELS.forEach(function (l) { LABEL_NAMES[l.id] = l.label; });
  var LABEL_ALIASES = [
    [/^(fine|ok|okay|correct|right)$/, 'fine'],
    [/^(figure|wrong figure|a wrong figure|wrong number|number)$/, 'figure'],
    [/^(material|not in the material|not in material|invented|made up)$/, 'material'],
    [/^(policy|against the policy|against policy|breach|breaks the policy)$/, 'policy']
  ];
  function normaliseLabel(s, aliases) {
    var t = squash(s).replace(/[.:;]+$/, '');
    for (var i = 0; i < aliases.length; i++) { if (aliases[i][0].test(t)) { return aliases[i][1]; } }
    return null;
  }

  function ex3Answers() { return (REC && REC.ex3) || []; }

  /** Lines such as "A2: figure" or "B4 not in the material". */
  function parseMarks(text) {
    var marks = {};
    plain(text).split('\n').forEach(function (line) {
      var m = line.match(/^\s*([A-Za-z])\s*(\d+)\s*[:.=\-]?\s*(.+?)\s*$/);
      if (!m) { return; }
      var label = normaliseLabel(m[3], LABEL_ALIASES);
      if (label) { marks[m[1].toUpperCase() + m[2]] = label; }
    });
    return marks;
  }

  /** The answers marked in the session (A and B); the others are for those who finish early, or homework. */
  function sessionAnswers() { return ex3Answers().filter(function (a) { return a.in_session !== false; }); }

  function checkMarks(marks) {
    var rules = [];
    var agreed = 0;
    var marked = 0;
    ex3Answers().forEach(function (a) {
      var any = a.key.some(function (k, i) { return marks && marks[a.id + (i + 1)]; });
      if (a.in_session === false && !any) {
        rules.push(rule('answer-' + a.id, 'Answer ' + a.id, 'note',
          'For those who finish early, or as homework. Not marked: mark it the same way, then check again.'));
        return;
      }
      a.key.forEach(function (k, i) {
        var id = a.id + (i + 1);
        var mine = marks && marks[id];
        if (mine) { marked++; }
        var keyText = k.accept.map(function (l) { return LABEL_NAMES[l]; }).join(' or ');
        var name = 'Answer ' + a.id + ', sentence ' + (i + 1);
        if (!mine) {
          rules.push(rule('mark-' + id, name, 'note', 'Not marked yet. The key: ' + keyText + '. ' + k.reason));
        } else if (k.accept.indexOf(mine) !== -1) {
          agreed++;
          rules.push(rule('mark-' + id, name, 'ok', 'You marked: ' + LABEL_NAMES[mine] + '. The key agrees. ' + k.reason));
        } else {
          rules.push(rule('mark-' + id, name, 'look', 'You marked: ' + LABEL_NAMES[mine] + '. The key says: ' + keyText + '. ' + k.reason));
        }
      });
    });
    return {
      exercise: '3', title: 'Find what is wrong', rules: rules,
      notes: ['You agree with the key on ' + agreed + ' of the ' + plural(marked, 'sentence') + ' you marked. Where you disagree, read the reason, then find the place in the thread or the policy it names.',
        'Where the key accepts two marks, both are defensible, and the reason says what would tip it.']
    };
  }

  // ---------------------------------------------------------------------------
  // Exercise 4, part 1: the eight snippets
  // ---------------------------------------------------------------------------
  var PILE_NAMES = {};
  CASE.piles.forEach(function (p) { PILE_NAMES[p.id] = p.label; });
  var PILE_ALIASES = [
    [/^(fine|fine to paste|paste|ok|okay|safe)$/, 'fine'],
    [/^(remove|remove details|after removing details|paste after removing details|remove details first|clean|clean first|anonymise|anonymize)$/, 'remove'],
    [/^(never|do not paste|don't paste|dont paste|no|not)$/, 'never']
  ];
  function parsePiles(text) {
    var piles = {};
    plain(text).split('\n').forEach(function (line) {
      var m = line.match(/^\s*(\d+)\s*[:.=\-]?\s*(.+?)\s*$/);
      if (!m) { return; }
      var p = normaliseLabel(m[2], PILE_ALIASES);
      if (p) { piles[m[1]] = p; }
    });
    return piles;
  }
  function checkPiles(piles) {
    var rules = [];
    var agreed = 0;
    CASE.snippets.forEach(function (s) {
      var mine = piles && piles[s.n];
      var name = 'Snippet ' + s.n + ': ' + s.title;
      var keyText = s.accept.map(function (p) { return PILE_NAMES[p]; }).join(' or ');
      if (!mine) {
        rules.push(rule('snippet-' + s.n, name, 'note', 'Not sorted yet. The key: ' + keyText + '. ' + s.reason));
      } else if (s.accept.indexOf(mine) !== -1) {
        agreed++;
        rules.push(rule('snippet-' + s.n, name, 'ok', 'You chose: ' + PILE_NAMES[mine] + '. The key agrees' + (s.accept.length > 1 ? ' (it accepts ' + keyText + ')' : '') + '. ' + s.reason));
      } else {
        rules.push(rule('snippet-' + s.n, name, 'look', 'You chose: ' + PILE_NAMES[mine] + '. The key says: ' + keyText + '. ' + s.reason));
      }
    });
    return {
      exercise: '4a', title: 'What must not go in: the eight snippets', rules: rules,
      notes: ['You agree with the key on ' + agreed + ' of ' + CASE.snippets.length + ' snippets.',
        'This key is for teaching, not legal advice. Your employer\'s own policy on AI tools comes first: where it is stricter than this key, follow it.']
    };
  }

  // ---------------------------------------------------------------------------
  // Exercise 4, part 2: the stand-in helper, and the check of what is about to
  // be pasted. All of it runs on this computer; nothing is sent anywhere.
  // ---------------------------------------------------------------------------
  function personalValues() {
    var vals = [];
    CASE.customers.forEach(function (c) {
      var names = c.contact.split(' ');
      vals.push({ kind: 'a business name', value: c.business });
      vals.push({ kind: 'a contact name', value: c.contact });
      vals.push({ kind: 'a first name', value: names[0] });
      vals.push({ kind: 'a surname', value: names[names.length - 1] });
      vals.push({ kind: 'an e-mail address', value: c.email });
      vals.push({ kind: 'a phone number', value: c.phone, phone: true });
    });
    return vals;
  }
  var PERSONAL = personalValues();

  function findPersonal(text) {
    var t = plain(text);
    var found = [];
    var seen = {};
    PERSONAL.forEach(function (v) {
      var re;
      if (v.phone) {
        re = new RegExp(v.value.split('-').map(escapeRegExp).join('[\\s.\\-]?'));
      } else {
        re = new RegExp('(^|[^A-Za-z0-9])' + escapeRegExp(v.value) + '(?![A-Za-z0-9])', 'i');
      }
      if (re.test(t) && !seen[v.value.toLowerCase()]) {
        seen[v.value.toLowerCase()] = true;
        found.push(v);
      }
    });
    // A full name also contains its first name and surname: report the longest match only.
    return found.filter(function (v) {
      return !found.some(function (o) { return o !== v && o.value.length > v.value.length && o.value.toLowerCase().indexOf(v.value.toLowerCase()) !== -1; });
    });
  }

  /** Anything shaped like an e-mail address or a phone number, from any source. */
  function findContactShapes(text) {
    var t = plain(text);
    var out = [];
    var m;
    var email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
    while ((m = email.exec(t))) { out.push({ kind: 'something shaped like an e-mail address', value: m[0] }); }
    var phone = /(?:\+\d{1,3}[ .-]?)?(?:\(\d{1,5}\)[ .-]?)?\d{2,6}(?:[ .-]\d{2,6}){1,4}|\b\d{9,13}\b/g;
    while ((m = phone.exec(t))) {
      if (m[0].replace(/\D/g, '').length >= 7) { out.push({ kind: 'something shaped like a phone number', value: m[0].trim() }); }
    }
    return out;
  }

  var EXTRACT_RULE = 'This table\'s values, and contact details';
  function checkExtract(text) {
    var t = plain(text).trim();
    var rules = [];
    if (!t) {
      rules.push(rule('personal', EXTRACT_RULE, 'note', 'This box is empty. Prepare the extract first, then check it here before you paste it anywhere.'));
    } else {
      var found = findPersonal(t);
      var known = found.map(function (v) { return v.value.toLowerCase(); });
      var knownDigits = found.filter(function (v) { return v.phone; }).map(function (v) { return v.value.replace(/\D/g, ''); });
      findContactShapes(t).forEach(function (s) {
        var digits = s.value.replace(/\D/g, '');
        if (known.indexOf(s.value.toLowerCase()) === -1 && knownDigits.indexOf(digits) === -1) { found.push(s); }
      });
      if (found.length === 0) {
        rules.push(rule('personal', EXTRACT_RULE, 'ok',
          'I found none of this table\'s ' + CASE.customers.length + ' business names, contact names, phone numbers or e-mail addresses, and nothing shaped like an e-mail address or a phone number. ' +
          'I cannot recognise other names or personal details: read the text yourself before you paste it.'));
      } else {
        rules.push(rule('personal', EXTRACT_RULE, 'look',
          'Do not paste this yet. I found ' + plural(found.length, 'value') + ' that can identify a customer or a person. Leave those columns out, or replace them with stand-ins.',
          found.slice(0, 12).map(function (v) { return v.kind + ': ' + v.value; }).concat(found.length > 12 ? ['and ' + (found.length - 12) + ' more'] : [])));
      }
    }
    return {
      exercise: '4b', title: 'What must not go in: the text about to be pasted', rules: rules,
      notes: ['This check knows the orders table in this workbook, and the shape of e-mail addresses and phone numbers. It does not know names in general: with your own data, you are the check.']
    };
  }

  /**
   * Builds the text to paste from the orders table.
   * choices: { columnId: 'keep' | 'standin' | 'leave' }
   * Returns the text and the key that maps each stand-in back to its real value.
   */
  function makeExtract(choices) {
    var cols = CASE.orders.columns.filter(function (c) { return (choices[c.id] || 'keep') !== 'leave'; });
    var key = {};
    var counters = {};
    var lookup = {};
    function standIn(col, value) {
      key[col.standIn] = key[col.standIn] || {};
      lookup[col.id] = lookup[col.id] || {};
      if (!lookup[col.id][value]) {
        counters[col.id] = (counters[col.id] || 0) + 1;
        var n = counters[col.id];
        lookup[col.id][value] = col.standIn + ' ' + (n < 10 ? '0' + n : String(n));
        key[col.standIn][n] = value;
      }
      return lookup[col.id][value];
    }
    var header = '| ' + cols.map(function (c) { return choices[c.id] === 'standin' ? c.standIn : c.label; }).join(' | ') + ' |';
    var rule_ = '| ' + cols.map(function () { return '---'; }).join(' | ') + ' |';
    var lines = CASE.orders.rows.map(function (r) {
      return '| ' + cols.map(function (c) { return choices[c.id] === 'standin' ? standIn(c, r[c.id]) : r[c.id]; }).join(' | ') + ' |';
    });
    return { text: [header, rule_].concat(lines).join('\n') + '\n', key: key };
  }

  /** Puts the real values back where an answer uses the stand-ins (Customer 01 or Customer 1). */
  function mapBack(text, key) {
    var out = plain(text);
    Object.keys(key || {}).forEach(function (prefix) {
      var re = new RegExp('\\b' + escapeRegExp(prefix) + '\\s*0*(\\d+)\\b', 'g');
      out = out.replace(re, function (all, n) {
        var v = key[prefix][Number(n)];
        return v === undefined ? all : v;
      });
    });
    return out;
  }

  // ---------------------------------------------------------------------------
  // Exercise 5: the template
  // ---------------------------------------------------------------------------
  var PLACEHOLDER = /\[([^\[\]\n]{2,200})\]|\{\{\s*([^{}\n]{2,200}?)\s*\}\}|\{([^{}\n]{2,200})\}|<([^<>\n]{2,200})>/g;
  var MATERIAL_PLACEHOLDER = /(paste|thread|e-?mails?|material|messages?|text|correspondence|conversation)/i;
  // A blank that names nothing: ___, XXX, [ ], [...] or (...). An ordinary "..." in a sentence is not a blank.
  var BLANK = /_{3,}|\bx{3,}\b|\[\s*\]|\(\s*\)|\[\s*\.{2,}\s*\]|\(\s*\.{2,}\s*\)/i;
  // Words about placeholders, not names of one: "fill in the [BRACKETED] items" names nothing.
  var GENERIC_NAME = /^(the |all |every )?(square )?(brackets?|bracketed( (items?|parts?|words?))?|placeholders?|items?|parts?|blanks?|fields?|gaps?|things?)$/i;

  function findPlaceholders(text) {
    var t = stripCitations(text);
    var names = [];
    var seen = {};
    var re = new RegExp(PLACEHOLDER.source, 'g');
    var m;
    while ((m = re.exec(t))) {
      var name = (m[1] || m[2] || m[3] || m[4] || '').trim();
      if ((name.match(/[A-Za-z]/g) || []).length < 2) { continue; }
      if (/[@\/]/.test(name)) { continue; } // an e-mail address or a web address in brackets is not a placeholder
      if (GENERIC_NAME.test(name)) { continue; }
      var k = name.toUpperCase();
      if (!seen[k]) { seen[k] = true; names.push(name); }
    }
    return names;
  }

  function caseValues() {
    var vals = [];
    [F.contact, F.contactFirst, F.contact.split(' ')[1], F.staff, F.staffFirst, F.staff.split(' ')[1], F.manager, F.manager.split(' ')[0], F.manager.split(' ')[1]]
      .forEach(function (v) { vals.push({ kind: 'a person\'s name', text: v }); });
    vals.push({ kind: 'the customer\'s business', text: F.customer });
    vals.push({ kind: 'the customer\'s business', text: F.customer.split(' ')[0] });
    [F.contactEmail, F.staffEmail, F.supplierEmail].forEach(function (v) { vals.push({ kind: 'an e-mail address', text: v }); });
    return vals;
  }
  var CASE_VALUES = caseValues();
  var CASE_IDS = [
    { kind: 'the order number', value: F.orderBase + F.orderRow },
    { kind: 'the invoice number', value: Number(F.invoiceNo.replace(/\D/g, '')) }
  ];
  var CASE_MONEY = (function () {
    var out = [];
    var re = /\$\s?(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)/g;
    var m;
    while ((m = re.exec(CASE.threadText))) {
      var v = Number(m[1].replace(/,/g, ''));
      if (!containsNumber(out, v)) { out.push(v); }
    }
    return out;
  })();
  var CASE_DATES = Object.keys(F.dates).map(function (k) { return F.dates[k]; });

  function findLeftovers(text) {
    var t = stripCitations(text);
    var lower = t.toLowerCase();
    var found = [];
    function add(kind, value) {
      if (!found.some(function (f) { return f.value.toLowerCase() === String(value).toLowerCase(); })) { found.push({ kind: kind, value: String(value) }); }
    }
    CASE_VALUES.forEach(function (v) {
      var re = new RegExp('(^|[^A-Za-z0-9])' + escapeRegExp(v.text) + '(?![A-Za-z0-9])', 'i');
      if (re.test(t)) { add(v.kind, v.text); }
    });
    var nums = extractNumbers(t);
    nums.forEach(function (n) {
      CASE_IDS.forEach(function (id) { if (sameNumber(n.value, id.value)) { add(id.kind, n.display); } });
      if (containsNumber(CASE_MONEY, n.value)) { add('an amount of money from the thread', n.display); }
    });
    var cartons = t.match(/\b\d+\s+cartons?\b/gi) || [];
    cartons.forEach(function (c) { add('a carton count from the thread', c); });
    CASE_DATES.forEach(function (d) {
      var mon = d.month.toLowerCase();
      var short = mon.slice(0, 3);
      var re = new RegExp('\\b' + d.day + '(st|nd|rd|th)?\\s+(of\\s+)?(' + mon + '|' + short + ')\\b|\\b(' + mon + '|' + short + ')\\s+' + d.day + '(st|nd|rd|th)?\\b', 'i');
      var m = t.match(re);
      if (m) { add('a date from the thread', m[0]); }
    });
    return found.filter(function (v) {
      return !found.some(function (o) { return o !== v && o.value.length > v.value.length && o.value.toLowerCase().indexOf(v.value.toLowerCase()) !== -1; });
    });
  }

  function checkTemplate(text) {
    var t = plain(text);
    var rules = [];
    var names = findPlaceholders(t);
    var material = names.filter(function (n) { return MATERIAL_PLACEHOLDER.test(n); });
    // Named placeholders are taken out first; an unnamed one, such as [...], stays and counts as a blank.
    var blanks = BLANK.test(stripCitations(t).replace(new RegExp(PLACEHOLDER.source, 'g'), function (all) {
      return (all.match(/[A-Za-z]/g) || []).length >= 2 ? '' : all;
    }));
    if (names.length >= 3 && material.length > 0 && !blanks) {
      rules.push(rule('placeholders', 'Named placeholders', 'ok',
        'I found ' + plural(names.length, 'named placeholder') + ', including one for the material (' + quote(material[0]) + ').', names.map(function (n) { return n; })));
    } else {
      var why = [];
      if (names.length < 3) { why.push('I found ' + plural(names.length, 'named placeholder') + '. A reusable brief usually needs at least 3, such as [CUSTOMER NAME], [ORDER NUMBER] and [PASTE THE THREAD HERE].'); }
      if (material.length === 0) {
        why.push(names.length ? 'None of them stands for the material to paste: add one, such as [PASTE THE E-MAIL THREAD HERE].'
          : 'Make one of them stand for the material to paste, such as [PASTE THE E-MAIL THREAD HERE].');
      }
      if (blanks) { why.push('There is a blank such as ___ or [...]. A blank does not say what goes there: give it a name in square brackets.'); }
      rules.push(rule('placeholders', 'Named placeholders', 'look', why.join(' '), names));
    }
    var left = findLeftovers(t);
    if (left.length === 0) {
      rules.push(rule('leftovers', 'Values left from this case', 'ok',
        'I found no name of a person or of the customer from this case, no order or invoice number, no amount of money, no carton count and no date from the thread. (The company\'s own name may stay.)'));
    } else {
      rules.push(rule('leftovers', 'Values left from this case', 'look',
        plural(left.length, 'value') + ' here belong' + (left.length === 1 ? 's' : '') + ' to this case, and would go out with every use of the template. Replace each with a named placeholder.',
        left.slice(0, 15).map(function (v) { return v.kind + ': ' + v.value; }).concat(left.length > 15 ? ['and ' + (left.length - 15) + ' more'] : [])));
    }
    var result = { exercise: '5', title: 'Make it reusable', rules: rules, notes: [] };
    return t.trim() ? result : emptied(result);
  }

  // ---------------------------------------------------------------------------
  // The ten-question check
  // ---------------------------------------------------------------------------
  function parseQuiz(text) {
    var answers = {};
    plain(text).split('\n').forEach(function (line) {
      var m = line.match(/^\s*(\d+)\s*[:.=\-)]?\s*([A-Da-d])\b/);
      if (m) { answers[m[1]] = m[2].toUpperCase(); }
    });
    return answers;
  }
  function checkQuiz(answers) {
    var rules = [];
    var right = 0;
    CASE.quiz.forEach(function (q) {
      var mine = answers && answers[q.n];
      var best = q.options.filter(function (o) { return o.correct; })[0];
      var name = 'Question ' + q.n;
      if (!mine) {
        rules.push(rule('q' + q.n, name, 'note', 'Not answered yet.'));
        return;
      }
      var chosen = q.options.filter(function (o) { return o.key === mine; })[0];
      if (!chosen) {
        rules.push(rule('q' + q.n, name, 'note', 'There is no option ' + mine + '. Choose A, B, C or D.'));
      } else if (chosen.correct) {
        right++;
        rules.push(rule('q' + q.n, name, 'ok', 'You chose ' + mine + ', the best answer. ' + chosen.why));
      } else {
        rules.push(rule('q' + q.n, name, 'look', 'You chose ' + mine + '. ' + chosen.why + ' The best answer is ' + best.key + ': ' + best.why));
      }
    });
    return { exercise: 'quiz', title: 'The ten-question check', rules: rules, notes: ['You chose the best answer to ' + right + ' of ' + CASE.quiz.length + ' questions.'] };
  }

  // ---------------------------------------------------------------------------
  // Showing a result
  // ---------------------------------------------------------------------------
  function counts(result) {
    var c = { ok: 0, look: 0, note: 0 };
    result.rules.forEach(function (r) { c[r.status]++; });
    return c;
  }
  function summaryLine(result) {
    var c = counts(result);
    var parts = [c.ok + ' OK', c.look + ' to look at again'];
    if (c.note) { parts.push(plural(c.note, 'note')); }
    return parts.join(', ') + '.';
  }
  function formatResult(result) {
    var heading = result.heading || (result.exercise === 'reply' ? result.title : 'Exercise ' + result.exercise + ': ' + result.title);
    var lines = [heading, summaryLine(result), ''];
    result.rules.forEach(function (r) {
      lines.push('[' + STATUS_WORDS[r.status] + '] ' + r.name + ': ' + r.message);
      r.items.forEach(function (i) { lines.push('    - ' + i); });
    });
    if (result.notes && result.notes.length) {
      lines.push('');
      result.notes.forEach(function (n) { lines.push(n); });
    }
    return lines.join('\n') + '\n';
  }

  var EXERCISES = {
    '1': { name: 'the five-part brief: a text file with the headings "## Situation", "## Material", "## Task", "## Form" and "## Limits" (or "Situation:" and so on), each followed by its part', run: function (t) { return checkBrief(parseBrief(t)); } },
    'reply': { name: 'a reply to the customer, as plain text', run: checkReply },
    '2-request': { name: 'the request of exercise 2, with your line that asks for sources, as plain text', run: checkRequest },
    '2': { name: 'the summary for the manager, as plain text', run: checkSummary },
    '3': { name: 'your marks for the three answers: one line per sentence, such as "A2: figure"; the marks are fine, figure, material and policy', run: function (t) { return checkMarks(parseMarks(t)); } },
    '4a': { name: 'your piles for the eight snippets (lines such as "3: remove")', run: function (t) { return checkPiles(parsePiles(t)); } },
    '4b': { name: 'the text you are about to paste, as plain text', run: checkExtract },
    '5': { name: 'the template, as plain text', run: checkTemplate },
    'quiz': { name: 'your answers to the ten questions (lines such as "4: B")', run: function (t) { return checkQuiz(parseQuiz(t)); } }
  };
  function runExercise(id, text) {
    var ex = EXERCISES[String(id).toLowerCase()];
    if (!ex) { throw new Error('Unknown exercise: ' + id); }
    return ex.run(text);
  }

  return {
    // text and numbers
    plain: plain, squash: squash, extractNumbers: extractNumbers, sameNumber: sameNumber, numberValues: numberValues,
    findCitations: findCitations, stripCitations: stripCitations, splitSentences: splitSentences,
    numberedSentences: numberedSentences, splitClauses: splitClauses, countWords: countWords,
    // detectors
    promisesCredit: promisesCredit, promisesCosts: promisesCosts, promisesDate: promisesDate, countIssues: countIssues,
    // exercises
    PARTS: PARTS, PART_NAMES: PART_NAMES, assembleBrief: assembleBrief, parseBrief: parseBrief, checkBrief: checkBrief,
    materialText: materialText, requestText: requestText, checkRequest: checkRequest,
    extractDates: extractDates, findContactShapes: findContactShapes, WORD_SIGNS_NOTE: WORD_SIGNS_NOTE, WORDS_NOTE: WORDS_NOTE, EMPTY_MESSAGE: EMPTY_MESSAGE,
    checkReply: checkReply, checkSummary: checkSummary, SUMMARY_LIMIT: SUMMARY_LIMIT,
    LABELS: LABELS, parseMarks: parseMarks, checkMarks: checkMarks,
    parsePiles: parsePiles, checkPiles: checkPiles,
    findPersonal: findPersonal, checkExtract: checkExtract, makeExtract: makeExtract, mapBack: mapBack,
    findPlaceholders: findPlaceholders, findLeftovers: findLeftovers, checkTemplate: checkTemplate,
    parseQuiz: parseQuiz, checkQuiz: checkQuiz,
    // results
    STATUS_WORDS: STATUS_WORDS, counts: counts, summaryLine: summaryLine, formatResult: formatResult,
    EXERCISES: EXERCISES, runExercise: runExercise,
    threadNumbers: THREAD_NUMBERS, policyNumbers: POLICY_NUMBERS
  };
});
