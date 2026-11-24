# Recorded answers

The exercises need real answers from an assistant, so that a session can run with no assistant at all. This folder holds the exact requests, and the answers to them.

## What is here

| Answer file | Exercise | What it is | Request file |
|---|---|---|---|
| `answers/ex1-answer.txt` | 1, step 1: the reply to the one-line wish | **Recorded**, unchanged | `requests/ex1-request.txt` |
| `answers/ex2-answer.txt` | 2: the summary for the manager | **Recorded**, unchanged | `requests/ex2-request.txt` |
| `answers/ex3-answer-a.txt` | 3: answer A, a reply to the strong brief | **Recorded**, unchanged | `requests/ex3-request.txt` |
| `answers/ex3-answer-b.txt` | 3: answer B | **Edited** from answer A, to plant a wrong figure and a breach of the policy | `requests/ex3-request.txt` |
| `answers/ex3-answer-c.txt` | 3: answer C, for those who finish early, or homework | **Edited** from answer A, to plant a promised delivery day and a wrong figure that every automatic check passes | `requests/ex3-request.txt` |

The three recordings come from one model, `claude-haiku-5-5`, recorded on 2026-11-24 through "a Claude Code subagent given the request text as its whole prompt; the answer saved as returned". Each is kept byte for byte as it came back, notes and formatting included: the answer to exercise 1 even keeps one character outside plain ASCII, a multiplication sign. **An answer is called recorded only if it is unchanged.**

| Path | What it holds |
|---|---|
| `requests/` | The exact text of each request, as it was sent. Generated from the workbook's data by `node tools/build.js`, so it always matches what the workbook shows. |
| `answers/*.txt` | Each answer. |
| `answers/*.meta.json` | What each answer is: its kind (`recorded` or `edited`), the model, the date (`recorded_on`), the route, the request file and its sha256, the answer's own sha256, the edits (`"none"` for a recording), the result the checker must give, and the key or the notes the instructor material uses. |

## What the tests prove about these files

- **A recording is unchanged.** The sha256 of each answer file must equal the one its meta file states, so an edited recording is caught.
- **An answer belongs to its request.** The sha256 of each request file must equal the one recorded with the answer. If the case changes, the requests change, the test fails, and the answers must be recorded again.
- **An edited answer is exactly what its meta file says.** Each edited answer's meta file lists its changes twice: once in plain words (`edits`), and once as steps (`edit_steps`) that a test applies to the recorded answer A. The result must be the edited file, byte for byte.
- **Each answer gives the checker result its meta file expects** (`node tools/run-answers.js`, and CI).

## How to record an answer again

1. Open a new conversation with the assistant, with no earlier messages, no custom instructions and no files attached. For exercise 3, use a new conversation for each answer.
2. Paste the request file **unchanged**, in one message. Send it.
3. Save the answer exactly as it came back, byte for byte, into the answer file.
4. In the meta file, write the model, `recorded_on`, the route, the request's sha256 and the answer's sha256, and `"edits": "none"`.
5. Run `node tools/build.js`, then `node tools/run-answers.js`, and read what the checker now says.
6. Update the meta file's `check.expect` to what the checker says, and its `strengths`, `issues` or `key`; then update the instructor guide, whose debriefs describe what these answers contain.

**To plant an error by editing a real answer,** never change the recording itself: write a new answer file whose meta file has `"kind": "edited"`, names the answer it came from in `edited_from`, says in plain words exactly what was changed, and lists the same changes as `edit_steps`. The workbook labels such an answer "a real answer, edited to plant the errors this exercise teaches".

**Facts in a meta file** are written as `{name}`, `{money:name}` or `{date:name}` (for example `{cupsDelivered}`), and are filled in from the case's data when the workbook is built, so that no figure of the case is typed twice.
