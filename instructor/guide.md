# Instructor guide

This guide is for the person running the session. It says what to prepare, what to say, what to show, what mistakes to expect and how to turn each one into the lesson. Use it with three other pages:

- [`run-sheet.md`](run-sheet.md): the 90 planned minutes, minute by minute.
- [`answer-key.md`](answer-key.md): every answer, with its reason. Keep it open on your own screen, not the shared one.
- [`when-things-go-wrong.md`](when-things-go-wrong.md): what to do when the room does not go to plan.

**This kit has not yet been taught to a class.** The timings are planned, not measured. Treat your first run as a pilot: note where the minutes slip and where people get stuck, and adjust.

Words in *italics* under **Say** are a script you can read as written or put in your own words.

---

## What you need

- **6 to 16 people**, each with a laptop and a web browser. Nothing to install.
- **The single-file workbook**, `participant/workbook-single-file.html`, on each laptop. Send it the day before. It is one file, so it opens with a double click wherever it is saved. Send the whole participant folder only if you also want people to have the case as plain files; a folder sent as a compressed file must be extracted whole before its workbook works.
- **A way to keep the case in view.** People compare answers with the e-mails and the policy all session. Print the case (`participant/case/customer-thread.txt` and `returns-policy.txt`), or ask people to open the workbook in a second window and keep that one on *The case*.
- **An assistant, or none.** The assistant the participants' employer allows for work. If there is none, or it is blocked, every exercise has an answer ready in the workbook.
- **Know what the ready answers are.** According to the author's record, they are one model's answers, obtained by giving a Claude Code subagent each request in `recorded/requests/` as its whole prompt, and saved as they came back, notes and all. Such a subagent also runs under its tool's own system prompt, so this was not a plain chat with no instructions, and it is not what your participants' assistants will write. Two answers in exercise 3, B and C, are answer A **edited by hand** to plant errors; the workbook says so above each, and the answer key lists every change. If someone asks, say so plainly.
- **Know that the key is in the page.** The workbook carries its own key so that it can check answers with no server; a participant who opens the page's source can read it. The kit is a practice tool, not an exam, and must not be used to grade people. If someone finds the answers, see *when-things-go-wrong.md*, entry 19.
- **A screen** for your laptop.
- **The handout** (`participant/handout.html`), printed, one per person.

## Before the session

Allow about an hour, once: a planned time, not a measured one.

1. **Do every exercise yourself** in the workbook, with the recorded answers. Then do exercises 1 and 2 again with the assistant the room will use, so you have seen what it does with this case. Assistants differ and change: a live answer may go wrong in other ways than the recorded one, and what you see is what the room will see.
2. **Read the answer key** once, in full. You do not need to remember it; you need to know where things are.
3. **Ask the host three questions.** Which assistant, if any, may people use for work? Is there a written policy on AI tools? Can the room's laptops open a local web page?
4. **Try the single-file workbook on one of the room's laptops**, with the network off. Open it, type in one box, press one *Check* button.
5. **Decide: live assistant or recorded answers.** If you are unsure the assistant will work in the room, plan for the recorded answers and treat a working assistant as a bonus. The session teaches the same thing either way, and the recorded answers are the ones this guide describes.
6. **Print the handout and the case.**
7. **Set up your screen**: the workbook open at *Start here*; the answer key in a separate window that you do not share.

## The one idea, and how to use it

**The assistant drafts; you check; you decide.** Say it in the opening, come back to it after every exercise, and end on it. Each exercise is that sentence in a different situation:

| Exercise | The one idea, in this exercise |
|---|---|
| 1. From a wish to a brief | The draft is only as good as the request. |
| 2. Summarise, and prove it | Ask for a draft you can check, then check it. |
| 3. Find what is wrong | A draft that reads well can still be wrong. |
| 4. What must not go in | You decide what the assistant may see at all. |
| 5. Make it reusable (homework) | Keep the request that worked, so the next draft starts well. |

## How to run a debrief

Each exercise ends with a short debrief. It is where most of the learning happens, so protect its minutes.

1. Ask the **debrief question** given for the exercise, to the whole room. Each exercise has one, and the run sheet gives the same one.
2. **Wait.** Count to five in your head before you say anything else. Someone will answer.
3. Take **two or three answers**. Ask "what did you see?" before "what should it be?".
4. **Add only what is missing.** Do not read the solution aloud; point to it.
5. **Name what you saw people do well**, specifically: "I saw several of you open message 4 before deciding." Specific praise teaches the room what good looks like.

Use the rubric ([`rubric.md`](rubric.md)) to know what to look for as you walk around. It is for your eyes; participants are not scored.

---

## Welcome and the case (8 minutes)

**Show:** the workbook, *Start here*.

**Say:**

*"In the next ninety minutes you will practise four things you can use at work tomorrow, with the assistant you are allowed to use, or with none; a fifth is homework. We will use one small, invented case the whole time, so you will not have to learn something new for each exercise."*

*"There is one sentence I would like you to keep from today: the assistant drafts; you check; you decide. These tools are very good at producing a first draft quickly. They are not responsible for what you send. You are. Today is about doing that well, and quickly."*

*"Please open the workbook on your laptop. Everything you type stays on your laptop: nothing is sent anywhere. If you have an assistant you are allowed to use for work, open it in another tab. If you do not, that is fine: every exercise has an answer ready."*

*"Keep the case where you can see it all session: on the printed pages, or in a second window of the workbook."*

*"Here is the case. You are Tom Becker, in customer service at a small wholesale supplier of cups and packaging. A customer, Mira, who owns a bakery, has had a late delivery that arrived short and partly damaged, and she has written to you three times. Read the e-mail thread, then the policy: it is short, and the policy is what you may and may not promise. Five minutes. Do not try to remember the figures: they stay open all session."*

**Check:** when the five minutes are up, ask three quick questions: *"Who are you? Who is Mira? Who decides on a credit above a hundred dollars?"* (Tom; the bakery's owner; the operations manager, rule 3.) Ask for a hand from anyone who cannot see the case, and solve that before exercise 1 (see *when-things-go-wrong.md*, "The workbook will not open").

---

## Exercise 1: From a wish to a brief

**Planned: 18 minutes. Objective O1: write a request as a five-part brief.**

**Purpose.** Participants see what a one-line wish really produces: not a wild answer, but a polished, plausible reply that quietly decides things for them. They find what it decided, what it says happened that the thread does not show, and what it left open, then rewrite the request in five parts. They should leave knowing that the two parts people skip, the material and the limits, are the ones that matter most: where you set no limit, the assistant fills the gap itself.

**Show:** exercise 1, step 1: the reply.

**Say before (step 1):**

*"Most people start with a wish: write a reply to this customer. Let us see what a wish gets you. This is the reply one assistant wrote to exactly that one line, with the whole thread pasted under it. It is polished and polite. You are Tom: read it as if you were about to press Send."*

*"Write a short list, one line for each problem. Three kinds: anything it decides or promises that nobody asked it to; anything it says happened that the thread does not show; anything that stops you sending it as it is. Four minutes. Then press the first button to see the instructor's list, and the second to see what the checker finds."*

**Then:** ask "Who would send it as it is?" Then "What did you find?" Take three or four answers. Expect the three gaps in square brackets to be found first: they are the easiest to see. Then press *1. Show the instructor's list of problems*, and *2. Run the checker on this reply*. The checker flags two things. One is the figure 14, in the assistant's own notes under the line of dashes: a date it worked out from "by Friday" in message 5, right by the calendar. The other is the sentence "We will issue a corrected invoice that removes those cartons", read as money off the invoice. The rest passes it: the receipt it says was sent, the same-day answer, the decision date promised on the manager's behalf, and the three gaps in brackets. *"Those are claims, promises and gaps without a figure or a credit word in them. The checker is a helper. You are the judge."*

Then point at the notes under the reply: *"The assistant added its own notes. Did you read them? They list the three gaps, and they say that the thread does not show anyone agreeing to any part of the amount Mira asks for. But they treat the corrected invoice as settled, asking only for its amount, and they say nothing about the receipt the reply says was sent. Read an assistant's notes, and do not stop at them."*

**Say before (step 2):**

*"Now write the request again, in five parts. Write it to a capable new colleague who has never heard of this customer, and who will fill any gap you leave with a guess, as this reply did. The hint under each box says what goes there. For the material, press the button: it puts the whole thread in the box; then add the policy, because your limits will rely on it. When you are done, press Check. The strong brief under the boxes is for reading afterwards. It tells you whether each part is there; it does not tell you whether it is good. Seven minutes."*

If the room has an assistant, add: *"If you finish, copy your brief, send it, and paste the new reply in step 3. Compare it with the first one."* Step 3 is marked on the page as one to skip when short of time.

**While they work:** read the Limits boxes over people's shoulders. That is where the most useful help is.

**Mistakes to expect, and how to turn each into the lesson**

1. **Stopping at the obvious problems** (the bracketed gaps, the asterisks) and missing the quiet decisions. *Turn it:* "The gaps are honest: the assistant tells you what it does not know. The risky lines are the ones that sound settled. Read every sentence that starts with 'We will' or 'I have', and ask: did anyone decide that? Did that happen?"
2. **Trusting the reply because it got the hard part right:** its figures are correct and it does not promise the credit. *Turn it:* "It got the credit right because the thread says plainly that the manager decides. The thread says nothing about a corrected invoice, or about passing the receipt on, and there it filled the gap with a guess and wrote the guess as a fact. Your limits are how you stop that."
3. **Limits written as wishes:** "be careful with money", "be professional". The check finds no prohibition. *Turn it:* put "Be careful with money" next to "Do not promise anything the thread and the policy do not already commit us to: no credit, no change to the invoice, no delivery day", and ask which would have stopped the corrected invoice. Then ask them to rewrite one limit as a *Do not* sentence.
4. **A note typed in the material box,** such as "the e-mails above", or **the form says "short and polite".** The check flags both. *Turn it:* "About this case, the assistant knows only what you paste. Some assistants can also search the web or remember earlier chats, but none of that holds this thread." And: "Name a number, and say plain text if it goes into an e-mail: this reply came back with asterisks around its lead-ins."

**Debrief**

- **Debrief question:** *"What did the one-line wish leave the assistant to decide, and which part of your brief now decides it instead?"*
- If there is time: "Where did you get your limits from?" (the policy: the assistant cannot follow a rule it has not been given).

**Say after:**

*"A wish does not get you a bad reply. It gets you a plausible one that decides things you did not decide, such as a corrected invoice and an answer the same day, and reports things that did not happen, such as a receipt it says was sent. A brief takes two minutes longer, and its limits are where you make those decisions yourself. The first card of your handout is the five parts: keep it by your keyboard for a week."*

**Solution:** `solutions/ex1-strong-brief.txt`, and a reply that follows it, `solutions/ex1-strong-reply.txt`. What the step 1 reply gets right and wrong, and what the checker finds in it: the answer key, exercise 1.

---

## Exercise 2: Summarise, and prove it

**Planned: 20 minutes. Objective O2: ask for an answer that can be checked, and check its figures and facts against the material.**

**Purpose.** Participants add one line to a request, asking for the source of each fact, then check the answer against the thread. The recorded answer is a good one: it avoids the promise that was never given, keeps the two groups of cartons apart, and ends each bullet that states a fact with the messages it comes from. It still ignores the word limit, and one of its sentences says the opposite of the thread while passing every automatic check. That sentence is the most important moment of the session: **the checker points; a person reads.**

**Show:** exercise 2, step 1, the request. Point at its Form part.

**Say before (step 1):**

*"Your manager has to decide today whether to give this customer a credit. She has two minutes. This request for a summary is almost ready. Add one line to its Form part that asks the assistant to put, after each fact, the number of the message it comes from. That one line turns checking from a search into a glance. Then press Check my request. Three minutes."*

**Say before (steps 2 and 3):**

*"Send your request, or use the recorded answer. Paste the answer and press Check. Then do the real work: for every Look again, open the thread and decide for yourself. Then pick the three bullets you trust least and read each one against the message it cites, word by word, even if the check passed it. Last, write the version you would really send your manager, and check it again. The page lists what it must say. Eleven minutes."*

**While they work:** with the recorded answer, the check shows nine OK and one *Look again*, for the length. Walk the room and ask: "Once it is shorter, is it ready to send?" Let people say yes. Then ask: *"Where are the six missing cartons now?"* and have them read the bullet that begins "Tom's cause" against message 4.

**Mistakes to expect, and how to turn each into the lesson**

1. **Treating the checker's verdict as the answer:** shortening the summary and sending it. *Turn it:* message 4 says the cartons "were left behind when the van was loaded": they are still at the warehouse. The summary says they "were left on the van at loading": the opposite. Every check passes it, because the figure is in the thread, the citation is right and nothing is merged. "The checker cannot read meaning. It points; you read."
2. **Shortening it by cutting the wrong lines,** for example the line that no credit was promised, or the promise to confirm a delivery day. *Turn it:* "What does your manager have to decide? Keep what she needs for that: the amount, what we did and did not promise, what is still open. Cut the cause and the lids."
3. **Not asking why it ignored the limit.** *Turn it:* "The request said at most 120 words. It wrote far more. If an assistant ignores one limit you set, what else might it have missed? That is why you check good answers too."
4. **With a live assistant, the traps the recorded answer avoided:** the customer's claim reported as a fact ("Tom promised a credit", or a list such as "Promised: a day by Friday, and a credit for the damaged cartons"), or the two groups of cartons merged under one number ("6 cartons were missing or damaged"). The check flags each of these wordings; other wordings can slip past it, so read the sentences it passes too. *Turn it:* "Who decides on the credit? If your summary says we already promised one, what is she likely to do?"

**Debrief**

- **Debrief question:** *"What would you change before you sent this to your manager, and how did you find it?"*
- If there is time: "What did the message numbers save you?"

**Say after:**

*"Two habits from this exercise. Ask for sources: one line in the request, and you wrote it. Then read every sentence against its source, even the ones that pass every check. The checker found the length. Only reading found that one sentence says the opposite of the thread. The checker points; you read; you decide."*

**Solution:** `solutions/ex2-strong-request.txt` and `solutions/ex2-strong-summary.txt`. What a summary must hold, where each fact is, and what the recorded answer gets right and wrong: the answer key, exercise 2.

---

## Exercise 3: Find what is wrong

**Planned: 15 minutes, for answers A and B. Objective O3: name what is wrong in an answer that looks right.**

**Purpose.** Participants mark every numbered sentence of two replies, A and B (eleven sentences in all): fine, a wrong figure, not in the material, or against the policy. **Answer A** is one model's recorded reply to the strong brief, unchanged: it follows the brief and the policy and passes every automatic check, yet one of its sentences (A6) says something happened that nothing in the thread shows, and two more (A4 and A7) can be marked either way. **Answer B** is answer A edited by hand to plant the two kinds of error A lacks: a wrong figure and a breach of the policy. **Answer C** is for those who finish early, or homework. Participants should leave knowing three kinds of wrong, that a reply which obeys every rule can still invent, and that a machine finds some errors and not others.

**Show:** exercise 3, the list of four marks.

**Say before:**

*"Answers A and B are for now; answer C, further down, is for later. Answer A is one assistant's reply to the strong brief, the kind you wrote in exercise 1. Answer B is the same reply, with errors planted that A does not have. Mark every numbered sentence of A and B with one of the four marks: there are eleven. The assistant's notes under A are not numbered, but read them. Keep the case in view. Seven minutes. Then press Check, run the automatic check on A and on B, and write in the last box which errors the checker misses, and why."*

**Mistakes to expect, and how to turn each into the lesson**

1. **Marking all of A fine,** because it follows the brief and sounds careful. Expect A6, which says the receipt was sent to the manager, and A7, a date the assistant chose itself, to be marked fine. *Turn it:* run the automatic check on A: five OK. "A obeys every rule you gave it, and still says that something happened which nothing in the thread shows. Its own notes under the reply say the receipt is new in message 5, and ask you to check that she has it. Did you read them? Would a colleague who copies only the reply ever see them?"
2. **Arguing over A4 and A7.** The key accepts two marks for each. *Turn it:* "Both marks are defensible, and the reason says what tips it. The skill is to notice the question: the week message 4 called 'next week' is this week by the time Mira writes message 5, and the date in A7 came from the assistant, not the thread."
3. **Passing B3, because its figure is in the thread.** *Turn it,* in one sentence: "The figure check passes the 12 only because 12 is in the thread as the cup size, 12 oz; being in the material is not the same as coming from it, and the check of the two groups of six is what catches it."
4. **Marking B4 a wrong figure.** The amount is right; the promise is not allowed. *Turn it:* "Correct figures do not make a promise allowed. Which rule does it break?" (Rules 3 and 6.)

**Debrief**

- **Debrief question:** *"Which sentence would have cost the company most if the reply had been sent, and why?"* (Expect B4, a credit promised without approval. Some may say A6: the customer will believe the manager has her receipt when nothing says she does.)
- If there is time: "Which errors did the automatic check miss, and why can it not find them?"

**Say after:**

*"Three kinds of wrong: a wrong figure, a fact from nowhere, and a promise you are not allowed to make. You catch the first by checking against the material. You catch the second only by reading, and a reply that follows every rule can still have it. You catch the third only if you know your own rules, and the assistant knows none of them unless you give them to it."*

**For those who finish early:** answer C is answer A edited to promise a delivery day and to use a wrong figure that every automatic check passes: an amount from the thread, used for the wrong thing.

**Solution:** the answer key, exercise 3, which also lists every change made to B and C; and `solutions/ex3-annotated-answers.md`.

---

## Exercise 4: What must not go in

**Planned: 20 minutes. Objective O4: decide what must not be pasted into a public assistant, and prepare a table so that it can be.**

**Purpose.** Participants sort eight snippets into three piles, then prepare the orders table for an assistant by leaving out what the question does not need and replacing customers with stand-ins. They should leave able to sort before they paste, and knowing that leaving out is the strongest protection.

**Show:** exercise 4, the yellow line about the employer's policy.

**Say before (part 1):**

*"Before how to use an assistant, there is what you should never give it. Sort these eight snippets into three piles: fine to paste, paste after removing details, do not paste. For each one, ask two questions. Does the question need this detail? And who could be harmed if this text were read by someone else? Six minutes, then press Check."*

*"One rule above all the others: your employer's policy comes first. If your company says no customer data in any assistant, that is the answer, whatever this key says."*

**After part 1:** point at the three snippets where the key accepts two piles, the complaint, the orders table and the rota, and at what the reason says would tip each one. No discussion yet: the debrief comes at the end.

**Say before (part 2):**

*"Now the useful part. Your manager asks: 'Which customers have ordered more than once, and what is the total of each one's orders? Which orders are not yet paid?' That question needs the amounts, the status of each order and a way to tell customers apart. It does not need names, phone numbers or e-mail addresses. Three words on the page: a stand-in is a made-up label, such as Customer 01; the key says which stand-in is which customer, and it never leaves your computer; mapping back puts the real names into the assistant's answer. For each column, choose keep, replace with a stand-in, or leave out. Prepare the extract and check it. If you have an assistant, paste the extract into it, then paste its answer back and put the real names in. Eight minutes."*

**Mistakes to expect, and how to turn each into the lesson**

1. **Keeping every column, or turning every column into a stand-in** (Phone 01, E-mail 01). *Turn it:* "What does the question need? Leaving a column out is stronger than any stand-in: what you do not paste cannot leak. Use stand-ins only where you need to tell rows apart."
2. **Putting the doctor's note in "remove details"**, by taking out the name. *Turn it:* "In a team of a dozen people, is it the name that tells you who this is?" Then show the alternative from the key: ask the question in general words.
3. **Over-correcting: putting everything in "do not paste"**, even the published price list. *Turn it:* "Refusing everything is not safe either. People then use the tools quietly, with no rules at all. The skill is to sort."
4. **Pasting the key along with the extract.** The check catches the names. *Turn it:* "Where is your key now? It stays on your computer. That is the whole point of a stand-in."

**Debrief**

- **Debrief question:** *"What did you leave out of the table, and how did you decide?"*
- Then say one sentence about the first three exercises: *"In exercises 1 to 3 you pasted Mira's e-mails, her name and all. That was fine here, because she is invented. With a real customer, take her name and details out first, as in part 2, or follow your employer's rule."*

**Say after:**

*"Sort before you paste: fine, remove details first, or never. The strongest move is leaving out what the question does not need. And this key is a teaching key, not legal advice: your employer's policy comes first. That is the third card of your handout."*

**Solution:** the answer key, exercise 4; `solutions/ex4-sorted-snippets.md`; and `solutions/ex4-extract.txt`, the extract the recommended choices produce.

---

## Exercise 5: Make it reusable (homework)

**Homework by default, about 8 minutes. Objective O5: turn a request that worked into a template a colleague can reuse.** The 60-minute variant leaves it as homework; the half-day variant runs it in the session (see [`variants.md`](variants.md)).

**Purpose.** Participants turn the summary request into a template with named placeholders and nothing left from this case. They should leave with one reusable request, and the habit of keeping requests that work.

**Set it in the close. Say:**

*"Your homework takes eight minutes and checks itself. The summary request worked: do not let it disappear into your chat history. Exercise 5 puts it in a box. Replace everything that belongs to this case with a named placeholder in square brackets: the manager, the customer, the order number, and the whole thread becomes one placeholder. Keep what is true every time: the form and the limits. Add one line at the top that tells your colleague what to fill in and what to check afterwards. Then press Check."*

**When it runs in the session** (the half-day variant), expect these mistakes:

1. **A value of this case is left in**, for example the manager's name or the order number inside the Task or the Form. The check lists each one. *Turn it:* "A value left in a template goes out with every use. Question 10 of the check is about exactly this."
2. **Blanks instead of names:** `___` or `[...]`. *Turn it:* "A name tells the next person what goes there. A blank makes them guess."
3. **Turning the limits into placeholders too.** *Turn it:* "The limits are the part you most want to keep. They hold your company's rules."

- **Debrief question:** *"Who in your team would use this template, and what would they need to know that is not in it yet?"*

**Solution:** `solutions/ex5-strong-template.txt`.

---

## The ten questions, and the close (9 minutes)

**Say:**

*"Ten questions, two for each of the five skills. The last two are about templates, which you will practise in exercise 5, your homework: answer them now as a preview, or after the homework. Five minutes. Every option has an explanation, so read it even when you chose well."*

When most are done, ask: *"Which question made you stop and think?"* Take one answer. Do not ask for scores, and do not collect them.

**Close. Say:**

*"Three things to take away. First, a brief: situation, material, task, form, limits. Second, ask for answers you can check, and check them: every figure, every claim, every promise. Third, sort before you paste. The assistant drafts; you check; you decide."*

Then set exercise 5 as homework (the words are under *Exercise 5*, above), and say: *"Your answers are on your laptop only. If you want to keep them, press Save my answers at the bottom of the workbook. And before you go: think of one task at work this week that you will try with a five-part brief."*

---

## After the session

- Participants keep the workbook and the handout. Their answers are on their own laptops; the workbook sent nothing anywhere.
- If you want feedback, collect it separately. The workbook does not.
- Write down where the planned timings slipped and which exercises took longest. This plan has not yet been run with a class, and your notes are how it improves.
