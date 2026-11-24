# Images

`workbook.png` shows exercise 2 of the workbook after *Use the recorded answer* and *Check my answer* were pressed: the recorded answer, and the result under it (nine *OK*, one *Look again*). It is cut from a capture of `participant/workbook-single-file.html`, 800 pixels wide, made in a headless browser with no network on 24 November 2026 at commit 5e38dfa.

CI does not make the picture again. When the page changes, capture it again the same way; a test checks that every image a Markdown file embeds exists in the repository, and that the README's caption says how the picture was made.
