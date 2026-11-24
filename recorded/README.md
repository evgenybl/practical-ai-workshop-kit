# Recorded answers

The exercises need real answers from an assistant, so that a session can run with no assistant at all. This folder holds the exact requests, and the answers to them.

## The state today: constructed stand-ins, recordings owed

**Every answer in `answers/` is constructed, not recorded.** Each was written for the build to stand in for a real assistant's answer, and each meta file says so (`"kind": "constructed"`, with `model`, `date` and `route` left empty). The workbook labels them as stand-ins wherever it shows them.

The recordings that are owed:

| Answer file | Exercise | Request file to send, unchanged |
|---|---|---|
| `answers/ex1-answer.txt` | 1, step 1: the reply to the one-line wish | `requests/ex1-request.txt` |
| `answers/ex2-answer.txt` | 2: the summary for the manager | `requests/ex2-request.txt` |
| `answers/ex3-answer-a.txt` | 3: reply A | `requests/ex3-request.txt` |
| `answers/ex3-answer-b.txt` | 3: reply B | `requests/ex3-request.txt` |
| `answers/ex3-answer-c.txt` | 3: reply C | `requests/ex3-request.txt` |

## What is here

| Path | What it is |
|---|---|
| `requests/` | The exact text of each request, as it is sent to an assistant. Generated from the workbook's data by `node tools/build.js`, so it always matches what the workbook shows. |
| `answers/*.txt` | Each answer, exactly as received (or, for now, as constructed). Each paragraph is on one line. |
| `answers/*.meta.json` | What each answer is: its kind, the model, the date, the route, the request file and its sha256, any edits, the result the checker must give, and, for exercise 3, the key for each sentence. |

## How to record an answer

1. Open a new conversation with the assistant, with no earlier messages, no custom instructions and no files attached.
2. Paste the request file **unchanged**, in one message. Send it.
3. Copy the answer as plain text into the answer file, replacing the stand-in. Keep each paragraph on one line.
4. In the meta file, set `"kind": "recorded"`, and fill in `model` (its name and version, as the assistant states it), `date` (the day of the recording), and `route` (how it was reached, for example "the vendor's web chat, free plan"). Remove `constructed_note`. Leave `request_sha256` as it is: a test checks that it still matches the request file, so that an answer is never paired with a request that has changed since.
5. Run `node tools/build.js`, then `node tools/run-answers.js`, and read what the checker now says about the answer.
6. Update the `check.expect` result in the meta file to what the checker says, **and update the instructor guide and the answer key's notes** if the real answer behaves differently from the stand-in. The guide's debriefs rely on what these answers contain. For exercise 1, also update the meta file's `issues`: the list of what is wrong with the reply, which the workbook shows as the instructor's list.

For exercise 3, record each of the three answers in its own new conversation.

**For exercise 3** the three answers must, between them, contain errors of the three kinds: a wrong figure, a fact not in the material, and a breach of the policy. A real answer may contain none. Where an error has to be planted by editing a real answer, say so in the meta file's `edits` field, in plain words: which sentence was changed, from what, to what. Then rewrite the `key` for every numbered sentence of that answer. A test checks that the key has one entry for each numbered sentence.

**Facts in a meta file** are written as `{name}` (for example `{cupsDelivered}`) or `{money:name}`, and are filled in from the case's data when the workbook is built, so that no figure of the case is typed twice.
