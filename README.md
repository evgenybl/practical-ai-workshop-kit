# Practical AI at Work: a workshop kit

[![tests](https://github.com/evgenybl/practical-ai-workshop-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/evgenybl/practical-ai-workshop-kit/actions/workflows/ci.yml)

Practical AI at Work is designed so that, after 90 planned minutes, a participant can brief an AI assistant properly, check what it gives back against the source material, and decide what must never be pasted into it.

**The assistant drafts; you check; you decide.**

A hands-on session for professionals and managers who are not technical. It is written to depend on no one assistant, and it runs with none: its workbook is a single page that opens offline, with nothing to install. Everything in its case is invented.

## What is in the kit

| Folder | What it holds |
|---|---|
| [`participant/`](participant/) | The **workbook** (send `workbook-single-file.html`, which opens with a double click; the same page as a folder is in `workbook/`), the **handout** (three cards on one printable page), and the **case** as plain files. |
| [`instructor/`](instructor/) | The **guide** (what to say, show and expect, exercise by exercise), the minute-by-minute **run sheet**, **when things go wrong**, **variants** for 60 minutes, half a day and online, the **rubric**, and the **answer key**. |
| [`solutions/`](solutions/) | A model answer for every exercise, and why it is strong. |
| [`recorded/`](recorded/) | The exact requests, and one model's answers to them, kept unchanged, which the session uses when there is no assistant. Two answers of exercise 3 are that model's answer A, edited by hand to plant errors; each says so. How they were obtained, according to the author's record, is in `recorded/README.md`. |
| [`tools/`](tools/) | The command-line checker, the build script and the answer runner. |
| [`tests/`](tests/) | The Node tests. |
| [`docs/`](docs/) | [How this kit was tested](docs/HOW-THIS-WAS-TESTED.md). |

## Try it in two minutes

**In a browser:** open `participant/workbook-single-file.html` by double-clicking it. Go to exercise 2, press *Use the recorded answer*, then *Check my answer*.

**On the command line** (Node 22 or later, nothing to install): run the recorded answer of exercise 2 through the checker. It is one model's summary, unchanged, and a good one. Then read its bullet that begins "Tom's cause" against message 4 of the thread (`participant/case/customer-thread.txt`): every check passes it, and it says the opposite. That is what this kit teaches.

```
node tools/check.js 2 recorded/answers/ex2-answer.txt
```

<!-- pasted from: node tools/check.js 2 recorded/answers/ex2-answer.txt -->
```text
Exercise 2: Summarise, and prove it
9 OK, 1 to look at again.

[OK] The figures: Every figure I found in this answer (22 figures) is in the thread. Being there does not make it right: check that each one means what the answer says it means.
[OK] Message numbers: I checked 11 citations, and each figure I found is in the message its citation names.
[OK] The order number: I found it, as required.
[OK] The invoice number: I found it, as required.
[OK] What went wrong: I found, as required, words that say the order was late, that cartons were missing, and that cartons were damaged.
[OK] The amount in question: I found it, as required.
[OK] What was promised: I found, as required: a word such as promised; a mention of the promise to confirm a delivery day by Friday, with a sign that it was not kept; and the credit described as asked for or awaiting a decision.
[Look again] Length: I counted 179 words; the limit is 120. A manager with two minutes needs the short version. Message numbers in brackets are not counted.
[OK] The promise that was never given: I found no sentence that says a credit was promised or agreed. In the thread, Tom passed the request to the operations manager and promised no credit (message 4).
[OK] The two groups of 6: The thread uses 6 twice: 6 cartons that never arrived, and 6 that arrived crushed. I found no figure here that merges the two.

Figures written in words, such as "six", are not checked. Dates written with figures, such as 28/02, are compared by day and month.
The checks for promises look for words that usually mean a promise. They can miss one, or flag a sentence that is fine. Read each flagged sentence yourself and decide.
```

## Who it is for, and what they can do afterwards

**Audience:** professionals and managers who already use, or are about to use, an AI chat assistant at work. Not technical. **Prerequisite:** using a web browser, copying and pasting text. **Group:** 6 to 16 people, each with a laptop. **Length:** 90 minutes, planned.

After the session a participant can:

| # | Objective | Shown by |
|---|---|---|
| O1 | Write a request as a five-part brief: the situation, the material, the task, the form of the answer, the limits | Exercise 1 |
| O2 | Ask for an answer that can be checked, and check its figures and facts against the material | Exercise 2 |
| O3 | Name what is wrong in an answer that looks right: a wrong figure, a fact that is not in the material, a breach of a stated rule | Exercise 3 |
| O4 | Decide what must not be pasted into a public assistant, and prepare a table so that it can be | Exercise 4 |
| O5 | Turn a request that worked into a template a colleague can reuse | Exercise 5, homework |

**The case.** One invented small business, used in every exercise: a wholesale supplier of cups and packaging, and a bakery owner whose delivery came late, short and partly damaged. Five e-mails over nine days, a one-page returns policy, a thirty-row orders table and eight snippets. The thread holds two traps that careless summaries fall into: a promise the customer asked for and was never given, and one figure that appears twice with two different meanings.

**The lesson flow** (planned minutes):

| Block | What the participant does | Planned minutes |
|---|---|---|
| Welcome and the case | Opens the workbook; reads the e-mail thread and the policy | 8 |
| 1. From a wish to a brief | Reads what a one-line request produces; rewrites it as a five-part brief | 18 |
| 2. Summarise, and prove it | Adds the line that asks for a source for every fact; checks every figure against the thread | 20 |
| 3. Find what is wrong | Marks every sentence of two fluent replies: fine, a wrong figure, not in the material, or against the policy | 15 |
| 4. What must not go in | Sorts eight snippets; prepares the orders table with stand-ins and maps the answer back | 20 |
| The ten questions, and the close | Ten questions, two per objective, each wrong answer explained | 9 |
| **Total** | | **90** |
| 5. Make it reusable | Homework: turns the summary request into a template with named placeholders | Homework |

## How this kit was tested

| Kind of evidence | What it is here | State |
|---|---|---|
| Automated tests | Every checker rule, both ways; the keys agree; no network address in the workbook; the single-file copy is current | Done locally: 240 tests, 240 pass, 0 fail (Windows, Node 24). CI: run 45300468336 passed on Linux and Windows with Node 22 and 24, at commit 5059ae2; the commits since have not been through CI. |
| Recorded answers through the checker | Each recorded answer, and each edited one, is run through the checker, and the result is the one the instructor guide describes | Done locally: three answers recorded from claude-haiku-5-5 on 2026-11-24, according to the author's record, and unchanged since they were saved (a test checks each one's sha256); answers B and C of exercise 3 are declared edits of the recorded answer A. Each gives the checker result the instructor guide describes. Also in CI run 45300468336, at commit 5059ae2. |
| A new-user test by an AI agent | A fresh agent does every exercise as a first-time participant, and lists every point where it was unsure | Done once, at commit 5059ae2, by a separate AI agent. Its findings were worked through in later commits. The write-up on the testing page is owed, and the test has not been repeated on the current version. |
| An independent review | A reviewer with no part in the build | Done once, at commit 5059ae2, by a separate AI agent. Its findings were worked through in later commits. The write-up on the testing page is owed, and the review has not been repeated on the current version. |
| Opened in a real browser: keyboard only, network off, both copies | A person opens the single-file copy and the folder copy, with the network off, and works every exercise with the keyboard alone | Not yet done. |
| Taught to a class of people | | Not done. |

**This kit has not been taught to a class of people.** The details, and the output of the last runs, are in [How this kit was tested](docs/HOW-THIS-WAS-TESTED.md).

To run the tests yourself (Node 22 or later, nothing to install):

```
node --test "tests/*.test.js"
node tools/build.js --check
node tools/run-answers.js
```

## What it does not do

- **It is not a course on any one product.** It is written to depend on no one assistant. Its recorded answers come from one model through one developer tool; no chat product was tried.
- **The checker checks figures and stated facts, not style or judgment.** It looks for simple signs, says what they are, and says so on the page. It can miss an error, and it can flag a sentence that is fine: it points, and the participant decides.
- **A figure written in words is not checked.** "Six" is not read; "6" is.
- **The privacy sorting is a teaching key, not legal advice.** An employer's own policy on AI tools comes first.

## How this was built

Written with Claude Code under the author's direction. **What is tested:** every rule of the checker, both ways; that the answer key, the generated files and the pasted outputs on this page are current; that each recorded answer is unchanged since it was saved and gives the result the guide describes; the page's logic in a fake page; and the hygiene of every file. The commands above run all of it. **What no test can prove:** whether the teaching works, since the kit has not been taught; how the page behaves in a real browser, which is owed; and where the recorded answers came from, which rests on the author's record (`recorded/README.md`). The case's facts are written once, in `participant/workbook/case-data.js`; the request files, the answer key, the printable case and the single-file workbook are generated from it by `node tools/build.js`, and CI fails if any of them is out of date.

## Licence

| Files | Licence |
|---|---|
| Every `.js` file (in `participant/workbook/`, `tools/` and `tests/`) and the CI workflow, `.github/workflows/ci.yml` | MIT, in [`LICENSE`](LICENSE) |
| Everything else: the pages and documents (`.md`, `.html`, `.css`), the case files, the recorded requests and answers, and the teaching text inside `participant/workbook/case-data.js` (the case, the exercises and the questions) | Creative Commons Attribution-NonCommercial 4.0, in [`LICENSE-TEXT.md`](LICENSE-TEXT.md) |
| `participant/workbook-single-file.html` | Both: it holds the MIT code and the CC BY-NC teaching text in one file, each under its own licence |

Author: Evgeny Blekhman, https://www.linkedin.com/in/evgeny-blekhman/
