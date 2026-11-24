# How this kit was tested

This page uses six kinds of evidence, and keeps them apart. A kind of evidence is listed as done only when it was done; what is owed is listed as owed.

| Kind of evidence | What it is here | State |
|---|---|---|
| Automated tests | Every checker rule, both ways; the keys agree; no network address in the workbook; the single-file copy is current | Done locally: 240 tests, 240 pass, 0 fail (Windows, Node 24). CI: run 45300468336 passed on Linux and Windows with Node 22 and 24, at commit 5059ae2; the commits since have not been through CI. |
| Recorded answers through the checker | Each recorded answer, and each edited one, is run through the checker, and the result is the one the instructor guide describes | Done locally: three answers recorded from claude-haiku-5-5 on 2026-11-24, according to the author's record, and unchanged since they were saved (a test checks each one's sha256); answers B and C of exercise 3 are declared edits of the recorded answer A. Each gives the checker result the instructor guide describes. Also in CI run 45300468336, at commit 5059ae2. |
| A new-user test by an AI agent | A fresh agent does every exercise as a first-time participant, and lists every point where it was unsure | Done once, at commit 5059ae2, by a separate AI agent. Its findings were worked through in later commits. The write-up on the testing page is owed, and the test has not been repeated on the current version. |
| An independent review | A reviewer with no part in the build | Done once, at commit 5059ae2, by a separate AI agent. Its findings were worked through in later commits. The write-up on the testing page is owed, and the review has not been repeated on the current version. |
| Opened in a real browser: keyboard only, network off, both copies | A person opens the single-file copy and the folder copy, with the network off, and works every exercise with the keyboard alone | Not yet done. |
| Taught to a class of people | | Not done. |

This kit has not been taught to a class of people.

---

## Automated tests

**How to run them** (Node 22 or later; nothing to install, no package, no network):

```
node --test "tests/*.test.js"
```

**What they cover**

| Test file | What it proves |
|---|---|
| `tests/case.test.js` | The case meets its specification: five messages over nine days; at least twelve distinct figures; the figures add up; the weekdays agree with the dates; the two traps are there; two delivery dates promised and one kept; thirty orders with two repeat customers; invented people at example.com with placeholder phones; eight snippets from harmless to never. |
| `tests/numbers.test.js` | How figures are read: 1,250.00 and 1250 are the same figure; a date written with figures only, such as 28/02, is read as a date; message labels, rule numbers and list numbers are pointers, not figures; a figure in words is not read; citations such as (msg 3) are not figures, and a long unclosed citation is read in a few milliseconds; a decimal point does not end a sentence. |
| `tests/brief.test.js` | Exercise 1: each of the five signs, with an answer that passes and one that fails; the check says it checks presence, not quality. |
| `tests/reply.test.js` | The reply check: each of its five rules, both ways, including typographic apostrophes, money off an invoice, a negated promise word, a day for something other than a delivery, and an empty box. |
| `tests/summary.test.js` | Exercise 2: the request check both ways; each of the summary's ten rules, both ways, including the two traps, the unkept promise to confirm a delivery day, "not late" read as not late, a promise word after "waiting" or "asked", and a date cited to the right message; the recorded answer passes every rule but the length. |
| `tests/marks.test.js` | Exercise 3: marks that agree and disagree with the key, including entries that accept two marks; a key entry and a reason for every numbered sentence; the assistant's own notes not numbered; about ten marks in the session, with answer C optional; the recorded answer A unchanged, and B and C planting the kinds of error A lacks. |
| `tests/privacy.test.js` | Exercise 4: the piles both ways, and both piles where two are defensible; every kind of personal value caught on its own; anything shaped like an e-mail address or a phone number caught; the rule named for what it knows; the recommended extract passes, and agrees with the key of part 1; stand-ins are consistent; the map-back. |
| `tests/template.test.js` | Exercise 5: named placeholders both ways; a word such as [BRACKETED] and an ordinary "..." are not counted; each kind of value left from the case caught on its own. |
| `tests/quiz.test.js` | Ten questions, two per objective, one best answer each, an explanation for every option, and the best answer not given away by its length; marking both ways. |
| `tests/checker.test.js` | The checker's honesty: its sentences about its own limits are on every result that needs them; every pass is worded as what was not found; an empty box says so on every rule. |
| `tests/workbook.test.js` | The page's own logic, run in a small fake page (`tests/fake-dom.js`): every exercise's buttons, the request check, columns that start on "Choose", saving and restoring answers in the browser's storage, clearing them, saving them as a text file. And the markup: a label for every box, unique ids, plain buttons, a visible focus style with an outline, a contrast ratio of at least 4.5 to 1 for every pair of text and background colours, the warning for a page opened without its folder, and the page's content security policy. |
| `tests/offline.test.js` | No file of the participant folder contains a request call, a remote script, style, font or image, or any web address; the single-file copy loads nothing. |
| `tests/generated.test.js` | Every generated file is current: the single-file workbook, the request files, the answer key (which therefore equals the workbook's own key, and a second, literal copy of the key in the test), the printable case and the generated solutions. |
| `tests/answers.test.js` | Every answer in `recorded/` and every model answer in `solutions/`, run through the command-line checker, gives its expected result; every recorded answer and its request still have the sha256 the meta file states; every edited answer is exactly the recorded answer plus its declared edits. |
| `tests/cli.test.js` | The command-line checker prints exactly what the page shows, with exit codes 0, 1 and 2, and its usage says what each exercise's file must hold. |
| `tests/docs.test.js` | No absolute path; no letter outside English anywhere, and plain ASCII everywhere except in the unchanged recordings; LF line ends; no package files; every e-mail address at example.com; no claim of a class, a client or a session taught, and the "not taught" and "planned" lines in the README and every instructor page; links resolve, and every embedded image exists; the pasted output on these pages is current, and the test count in the table is the one pasted below; the README's evidence table equals this one; the minutes of the guide, the run sheet, the README and the workbook agree and add up to 90; each exercise's debrief question is the same in the guide and the run sheet. |

**The last lines of the last run**, as printed. The run used the plain-text (TAP) reporter, whose output is plain ASCII like the rest of the kit; the tests are the same.

<!-- pasted from: node --test --test-reporter=tap "tests/*.test.js" (the last lines) -->
```text
1..240
# tests 240
# suites 0
# pass 240
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 3865.775
```

**What the automated tests do not cover.** The page has not been opened in a real browser by anyone working on this kit: its logic runs in a fake page, which checks what the buttons do but not how the page looks, how it behaves with a keyboard alone, or how a screen reader reads it. The labels, the focus style and the colour contrast are checked in the markup only. The real-browser pass in the table above, not yet done, is where that is owed.

**"Sends nothing."** Both copies of the workbook carry a content security policy in a `meta` tag: `connect-src 'none'; img-src data:; media-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'`. In a browser that enforces it, the page cannot open a connection, load an image other than an inline one, load media, a frame or a plug-in, or submit a form, so "sends nothing" is enforced by the browser, not only promised by the code. It leaves the page's own scripts and style alone. The tests check that the tag is in both copies; that a real browser enforces it on this page, and still runs the page, awaits the real-browser pass.

**CI.** The workflow in `.github/workflows/ci.yml` runs the tests, rebuilds and compares every generated file, and runs every answer through the command-line checker, on Linux and Windows with Node 22 and Node 24. It has run once, as run 45300468336, at commit 5059ae2: it passed on all four. The commits since have not been through CI; the runs on this page were made locally on Windows with Node 24.

---

## Recorded answers through the checker

**State: done locally**, and in CI run 45300468336 at commit 5059ae2.

| Answer | What it is | Its checker result, and where the guide describes it |
|---|---|---|
| `recorded/answers/ex1-answer.txt` | Recorded from claude-haiku-5-5 on 2026-11-24, unchanged | Two *Look again*: the figure 14, a date worked out in the assistant's own notes, right by the calendar; and "We will issue a corrected invoice that removes those cartons", read as money off. The receipt it says was sent, the same-day answer and the decision date promised on the manager's behalf pass the checker. Guide, exercise 1. |
| `recorded/answers/ex2-answer.txt` | Recorded, unchanged | Nine *OK* and one *Look again*, for the length. One bullet says the opposite of message 4 and passes every check. Guide, exercise 2. |
| `recorded/answers/ex3-answer-a.txt` | Recorded, unchanged | Five *OK* out of five. One sentence (A6) still says something happened that nothing in the thread shows, and two more (A4 and A7) can be marked either way. Guide, exercise 3. |
| `recorded/answers/ex3-answer-b.txt` | Answer A, edited: a wrong figure and a breach of the policy planted | The two planted errors are flagged; the figure check alone would pass the wrong figure. Guide, exercise 3. |
| `recorded/answers/ex3-answer-c.txt` | Answer A, edited: a promised delivery day and a wrong figure planted | The promised day is flagged; the wrong figure passes every check. Guide, exercise 3. |

**Where the recordings came from.** According to the author's record, all three were made the same way: a Claude Code subagent was given the request text as its whole prompt, and its answer was saved as returned. Such a subagent also runs under its tool's own system prompt, so this was not a plain chat with no instructions, and it is not what a participant's assistant will be. No chat product was tried. The repository holds no transcript of those runs, so this is the author's record, not something a test can prove. What the tests do prove: each answer file still has the sha256 its meta file states, so it has not changed since it was saved; each request file still has the sha256 recorded with its answer, so each answer names the exact request it answers; and applying the declared edit steps to answer A gives B and C exactly. The edits to B and C are described in plain words in their meta files and in the answer key.

The last run of every answer, and every model answer, through the command-line checker, as printed:

<!-- pasted from: node tools/run-answers.js -->
```text
as expected  recorded/answers/ex1-answer.txt (exercise reply, recorded): 5 rules, to look at again: numbers, credit
as expected  recorded/answers/ex2-answer.txt (exercise 2, recorded): 10 rules, to look at again: length
as expected  recorded/answers/ex3-answer-a.txt (exercise reply, recorded): 5 rules, nothing to look at again
as expected  recorded/answers/ex3-answer-b.txt (exercise reply, edited): 5 rules, to look at again: counts, credit
as expected  recorded/answers/ex3-answer-c.txt (exercise reply, edited): 5 rules, to look at again: numbers, date
as expected  solutions/ex1-strong-brief.txt (exercise 1, model solution): 5 rules, nothing to look at again
as expected  solutions/ex1-strong-reply.txt (exercise reply, model solution): 5 rules, nothing to look at again
as expected  solutions/ex2-strong-request.txt (exercise 2-request, model solution): 2 rules, nothing to look at again
as expected  solutions/ex2-strong-summary.txt (exercise 2, model solution): 10 rules, nothing to look at again
as expected  solutions/ex3-marks.txt (exercise 3, model solution): 18 rules, nothing to look at again
as expected  solutions/ex4-piles.txt (exercise 4a, model solution): 8 rules, nothing to look at again
as expected  solutions/ex4-extract.txt (exercise 4b, model solution): 1 rule, nothing to look at again
as expected  solutions/ex5-strong-template.txt (exercise 5, model solution): 2 rules, nothing to look at again
as expected  solutions/quiz-answers.txt (exercise quiz, model solution): 10 rules, nothing to look at again
14 of 14 answers gave their expected result.
```

---

## A new-user test by an AI agent

**State: done once, at commit 5059ae2, by a separate AI agent; the write-up is owed.** Its findings were worked through in the commits after 5059ae2. What the agent was given, what it did exercise by exercise, its answers through the checker, and every point where it was unsure with what was changed, are owed on this page. The test has not been repeated on the current version.

---

## An independent review

**State: done once, at commit 5059ae2, by a separate AI agent; the write-up is owed.** Its findings were worked through in the commits after 5059ae2. Who reviewed it, what they reviewed, what they found and what was changed are owed on this page. The review has not been repeated on the current version.

---

## Opened in a real browser: keyboard only, network off, both copies

**State: not yet done.** A person opens `participant/workbook-single-file.html` and `participant/workbook/index.html` with the network off, works every exercise with the keyboard alone, and checks that the content security policy is enforced and the page still runs.

---

## Taught to a class of people

This kit has not been taught to a class of people.
