---
name: prose-quality
description: Reference for what scripts/check-copy's prose-quality rules actually flag and why — abstraction density, passive voice, weasel words, repeated words, readability score, sentence-length variance, nominalization density, and the style profiles that set register-dependent thresholds. Read this to understand a `prose/*` violation before revising against it, not to hand-grade a draft in place of running the script.
---

# Prose Quality

`scripts/check-copy/rules/prose.mjs` is the actual gate — this skill
explains what it checks and why. Where `tells-detector` catches
vocabulary and phrasing that specifically mark text as LLM-generated,
this rule set catches prose weaknesses that make writing hard to read
regardless of whether an AI wrote it — the classic style-guidance
lineage (Orwell's six rules, Strunk & White's "omit needless words" and
active-voice preference, Gary Provost's sentence-rhythm principle,
Helen Sword's "zombie nouns") made mechanical.

Backed by real libraries rather than hand-rolled heuristics: the
`retext` ecosystem (`retext-passive`, `retext-intensify`,
`retext-repeated-words`) for grammatical pattern detection,
`compromise` for part-of-speech tagging behind the abstraction check,
and `flesch` / `flesch-kincaid` for genuine readability formula scores
— the same class of tool `proselint` and Vale use, not a from-scratch
reimplementation of syllable counting or sentence tokenization.

## The check that matters most

`prose/abstraction-density` is the one to understand first, because it
catches what every other rule here structurally cannot: a draft that
says nothing while breaking no rule.

Vocabulary and grammar checks ask questions about words. A draft can
satisfy all of them and still be empty:

> Our platform brings these workflows together in one place. Teams that
> adopt this approach report faster cycle times and clearer visibility.

No banned word, no passive voice, readable grade level, and not one
claim a reader could check, disagree with, or act on. That sample
passed this gate cleanly before the check existed.

What separates it from writing that says something is the proportion of
nouns naming something in the world rather than a concept. Measured
across published landing copy, a literary essay, Orwell, and technical
documentation, good prose ran 77-100% concrete; LLM output and Orwell's
own deliberately-abstract parody ran 16-42%. The floor is 60%.

Two properties make this different from a word list. It is a whole-
document ratio, so it never accuses a particular sentence and individual
misclassifications wash out. And it holds across registers — technical
writing scores well because its nouns are concrete (`bucket`, `request`,
`branch`) even when its subject is abstract.

Revising against it means naming the actual thing: who does what, to
what, with what result. Swapping synonyms will not move it.

## What each rule catches

- **`prose/passive-voice`** — flagged by `retext-passive`'s grammatical
  pattern match. Orwell's rule 4 and Strunk & White's Rule 14: active
  voice names an actor, passive voice often hides one ("mistakes were
  made" vs. "we made mistakes").
- **`prose/weasel-word`** — vague qualifiers ("very," "arguably,"
  "reportedly," "supposedly") from `retext-intensify`. These mark a
  claim the writer is declining to stand behind; cutting them rarely
  changes the sentence's truth value.

  The underlying library merges three lists, and only one is a quality
  signal. Ordinary grammar (`that`, `only`, `rather`, `better`, modals)
  and perception verbs (`saw`, `knew`, `felt`, `noticed`) are
  suppressed — the latter especially, since concrete narrative writing
  is built from them and flagging them would penalize exactly the
  specificity `prose/abstraction-density` rewards.
- **`prose/repeated-word`** — accidental lexical duplication ("the the
  mat") from `retext-repeated-words`. Always an error, never a style
  choice.
- **`prose/hard-to-read-sentence`** — individual sentences flagged by
  `retext-readability` as dense relative to a general-audience target.
- **`prose/abstraction-density`** — the share of nouns naming something
  concrete, below the 60% floor. Error severity. Only scored on
  passages with 15+ nouns, since the ratio is noise below that. See the
  section above.
- **`prose/reading-ease`** / **`prose/grade-level`** — document-level
  Flesch Reading Ease and Flesch-Kincaid Grade scores, computed from
  real sentence/word/syllable counts (not a per-sentence proxy).
  Thresholds come from the active style profile, not a single fixed
  number: a grade of 11.7 is drift in marketing copy and correct in an
  essay.
- **`prose/low-burstiness`** — sentence-length standard deviation below
  the profile's floor, across a document with 8+ sentences. Error
  severity. Gary Provost's principle: uniform sentence length reads as
  mechanical regardless of word choice; human writing mixes short and
  long on purpose.

  The 8-sentence floor matters. Standard deviation over three or four
  sentences describes the sample, not the writing — measured
  three-sentence passages ranged from 1.4 to 6.1 with no relation to
  quality. Note also that this fires only below the floor: abstract
  prose can score high, so burstiness catches mechanical uniformity
  specifically and is not evidence of quality in the other direction.
- **`prose/nominalization-density`** — words ending in -tion/-ment
  /-ance/-ence at more than 3% of total words. Helen Sword's "zombie
  nouns": turning a verb into an abstract noun ("implementation" for
  "implement") removes the actor and adds length without adding
  meaning.

## Style profiles

`scripts/check-copy/rules/profiles.mjs` holds the thresholds that
legitimately differ by register. Select one with `--style`:

```
node scripts/check-copy/index.mjs draft.md --style long-form
```

- **`marketing`** — landing pages, product and UI copy. Short sentences,
  low grade ceiling, heavy anchoring in specifics.
- **`general`** — the default. Docs, announcements, internal writing.
- **`long-form`** — essays, articles, technical writing. Longer
  sentences and subordinate clauses are the register working correctly,
  not drift.

What the profile does *not* change is as important as what it does.
Abstraction density, AI-tell phrasing, and repeated words are identical
in every profile, because no register makes them acceptable. A profile
only moves reading grade, reading ease, em-dash rate, and the
sentence-length floor.

Three profiles, not eight. A fourth gets added when a real draft fails
for a reason a threshold should have allowed — not in advance.

## Errors vs. warnings

Errors are `prose/repeated-word`, `prose/abstraction-density`, and
`prose/low-burstiness` — a defect and two structural signals a rewrite
cannot dodge by substitution. Everything else is a warning: real signal,
but a judgment call against the brief's register, per
`hedgehog-copywriting-loop`'s step 3. A warning-only report still passes
the gate; don't chase every warning to zero at the cost of a sentence
that reads worse for it.

## When a violation looks wrong

First check whether the right profile is selected — a long-form draft
graded against `marketing` thresholds will report readability drift that
is really a register mismatch.

If the profile is right and the violation still looks wrong, say so
rather than working around it. A domain that genuinely requires heavier
passive voice (a process description with no clear actor) is worth
raising explicitly instead of silently accepting a warning-heavy report
as "good enough for this case."

`prose/abstraction-density` is the one to argue with last. It fires on
prose that names nothing checkable, which feels register-dependent and
mostly isn't — technical writing and literary essays both clear it
comfortably. A draft that cannot clear it usually has a brief problem:
nothing concrete was known to say.
