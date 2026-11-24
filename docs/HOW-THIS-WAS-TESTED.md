# How this kit was tested

This page uses five kinds of evidence, and keeps them apart. A kind of evidence is listed as done only when it was done; what is owed is listed as owed.

| Kind of evidence | What it is here | State |
|---|---|---|
| Automated tests | Every checker rule, both ways; the keys agree; no network address in the workbook; the single-file copy is current | Done locally: 194 tests, 194 pass, 0 fail (Windows, Node 24). CI has not run yet. |
| Recorded answers through the checker | Each real model answer is run through the checker in CI, and the result is the one the instructor guide describes | Done locally: three answers recorded from claude-haiku-5-5 on 2026-11-24, unchanged (a test checks each one's sha256); answers B and C of exercise 3 are declared edits of the recorded answer A. Each gives the checker result the instructor guide describes. CI has not run yet. |
| A new-user test by an AI agent | A fresh agent, given the participant folder and nothing else, does every exercise as a first-time participant; its answers go through the checker; every point where it was unsure is listed with what was changed | Not yet done. Owed. |
| An independent review | A reviewer with no part in the build | Not yet done. Owed. |
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
| `tests/numbers.test.js` | How figures are read: 1,250.00 and 1250 are the same figure; a date counts as its parts; a figure in words is not read; citations such as (msg 3) are not figures; a decimal point does not end a sentence. |
| `tests/brief.test.js` | Exercise 1: each of the five signs, with an answer that passes and one that fails; the check says it checks presence, not quality. |
| `tests/reply.test.js` | The reply check: each of its five rules, both ways, including typographic apostrophes. |
| `tests/summary.test.js` | Exercise 2: each of its ten rules, both ways, including the two traps and the unkept promise to confirm a delivery day; the recorded answer passes every rule but the length. |
| `tests/marks.test.js` | Exercise 3: marks that agree and disagree with the key, including entries that accept two marks; a key entry and a reason for every numbered sentence; the assistant's own notes not numbered; about ten marks in the session, with answer C optional; the recorded answer A unchanged, and B and C planting the kinds of error A lacks. |
| `tests/privacy.test.js` | Exercise 4: the piles both ways, and both piles where two are defensible; every kind of personal value caught on its own; the recommended extract passes; stand-ins are consistent; the map-back. |
| `tests/template.test.js` | Exercise 5: named placeholders both ways; each kind of value left from the case caught on its own. |
| `tests/quiz.test.js` | Ten questions, two per objective, one best answer each, an explanation for every option; marking both ways. |
| `tests/workbook.test.js` | The page's own logic, run in a small fake page (`tests/fake-dom.js`): every exercise's buttons, saving and restoring answers in the browser's storage, clearing them, saving them as a text file. And the markup: a label for every box, unique ids, plain buttons, a visible focus style, and a contrast ratio of at least 4.5 to 1 for every pair of text and background colours. |
| `tests/offline.test.js` | No file of the participant folder contains a request call, a remote script, style, font or image, or any web address; the single-file copy loads nothing. |
| `tests/generated.test.js` | Every generated file is current: the single-file workbook, the request files, the answer key (which therefore equals the workbook's own key), the printable case and the generated solutions. |
| `tests/answers.test.js` | Every answer in `recorded/` and every model answer in `solutions/`, run through the command-line checker, gives its expected result; every recorded answer has the sha256 its meta file states, and so does its request file; every edited answer is exactly the recorded answer plus its declared edits. |
| `tests/cli.test.js` | The command-line checker prints exactly what the page shows, with exit codes 0, 1 and 2. |
| `tests/docs.test.js` | No absolute path; no letter outside English anywhere, and plain ASCII everywhere except in the unchanged recordings; LF line ends; no package files; every e-mail address at example.com; links resolve; the pasted checker output on these pages is current; the README's evidence table equals this one; the run sheet adds up to the planned 90 minutes. |

**The last lines of the last run**, as printed. The run used the plain-text (TAP) reporter, whose output is plain ASCII like the rest of the kit; the tests are the same.

<!-- pasted from: node --test --test-reporter=tap "tests/*.test.js" (the last lines) -->
```text
1..194
# tests 194
# suites 0
# pass 194
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 3125.1764
```

**What the automated tests do not cover.** The page has not been opened in a real browser by anyone working on this kit: its logic runs in a fake page, which checks what the buttons do but not how the page looks, how it behaves with a keyboard alone, or how a screen reader reads it. The labels, the focus style and the colour contrast are checked in the markup only. The new-user test and the independent review, both owed, are where a real browser comes in.

**CI.** The workflow in `.github/workflows/ci.yml` runs the tests, rebuilds and compares every generated file, and runs every answer through the command-line checker, on Linux and Windows with Node 22 and Node 24. It has not run yet: the repository has not been published. The runs above were made locally on Windows with Node 24 only.

---

## Recorded answers through the checker

**State: done locally.** CI has not run yet.

| Answer | What it is | Its checker result, and where the guide describes it |
|---|---|---|
| `recorded/answers/ex1-answer.txt` | Recorded from claude-haiku-5-5 on 2026-11-24, unchanged | One *Look again*: the figure 14, a date worked out in the assistant's own notes, right by the calendar. Everything wrong with the reply passes the checker, because it is a decision or a claim, not a figure. Guide, exercise 1. |
| `recorded/answers/ex2-answer.txt` | Recorded, unchanged | Nine *OK* and one *Look again*, for the length. One sentence says the opposite of message 4 and passes every check. Guide, exercise 2. |
| `recorded/answers/ex3-answer-a.txt` | Recorded, unchanged | Five *OK* out of five. It still says two things that are not in the material. Guide, exercise 3. |
| `recorded/answers/ex3-answer-b.txt` | Answer A, edited: a wrong figure and a breach of the policy planted | The two planted errors are flagged; the figure check alone would pass the wrong figure. Guide, exercise 3. |
| `recorded/answers/ex3-answer-c.txt` | Answer A, edited: a promised delivery day and a wrong figure planted | The promised day is flagged; the wrong figure passes every check. Guide, exercise 3. |

All three recordings came through the same route: "a Claude Code subagent given the request text as its whole prompt; the answer saved as returned". They are kept byte for byte, and a test checks each one's sha256 against its meta file, so an edited recording is caught; another test checks that each request file still has the sha256 recorded with its answer. The edits to B and C are described in plain words in their meta files and in the answer key, and a test applies the declared edit steps to answer A and gets B and C exactly.

The last run of every answer, and every model answer, through the command-line checker, as printed:

<!-- pasted from: node tools/run-answers.js -->
```text
as expected  recorded/answers/ex1-answer.txt (exercise reply, recorded): 5 rules, to look at again: numbers
as expected  recorded/answers/ex2-answer.txt (exercise 2, recorded): 10 rules, to look at again: length
as expected  recorded/answers/ex3-answer-a.txt (exercise reply, recorded): 5 rules, nothing to look at again
as expected  recorded/answers/ex3-answer-b.txt (exercise reply, edited): 5 rules, to look at again: counts, credit
as expected  recorded/answers/ex3-answer-c.txt (exercise reply, edited): 5 rules, to look at again: numbers, date
as expected  solutions/ex1-strong-brief.txt (exercise 1, model solution): 5 rules, nothing to look at again
as expected  solutions/ex1-strong-reply.txt (exercise reply, model solution): 5 rules, nothing to look at again
as expected  solutions/ex2-strong-summary.txt (exercise 2, model solution): 10 rules, nothing to look at again
as expected  solutions/ex3-marks.txt (exercise 3, model solution): 18 rules, nothing to look at again
as expected  solutions/ex4-piles.txt (exercise 4a, model solution): 8 rules, nothing to look at again
as expected  solutions/ex4-extract.txt (exercise 4b, model solution): 1 rule, nothing to look at again
as expected  solutions/ex5-strong-template.txt (exercise 5, model solution): 2 rules, nothing to look at again
as expected  solutions/quiz-answers.txt (exercise quiz, model solution): 10 rules, nothing to look at again
13 of 13 answers gave their expected result.
```

---

## A new-user test by an AI agent

**State: not yet done.**

### What the agent was given

### What it did, exercise by exercise

### Its answers, through the checker

### Every point where it was unsure, and what was changed

---

## An independent review

**State: not yet done.**

### Who reviewed it

### What they reviewed

### What they found

### What was changed

---

## Taught to a class of people

This kit has not been taught to a class of people.
