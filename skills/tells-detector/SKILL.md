---
name: tells-detector
description: Reference for what scripts/check-copy's AI-tell rules actually flag and why — banned vocabulary, negation formulas, hedge stacks, copula avoidance, em-dash and rule-of-three density. Read this to understand a `tells/*` violation before revising against it, not to hand-grade a draft in place of running the script.
---

# Tells Detector

`scripts/check-copy/rules/tells.mjs` is the actual gate — this skill
explains what it checks and why, so a `tells/*` violation gets fixed at
the root cause rather than reworded just enough to dodge one regex.
Never substitute a manual read of this list for actually running
`node scripts/check-copy/index.mjs`; the whole point of this core is
that the check is mechanical, not agent-graded.

Sourced from Wikipedia's "Signs of AI writing" essay (WikiProject AI
Cleanup) and the AI-tell detection literature it's drawn from, plus
prior art already proven out in the `landing-page` core's `landing-copy`
skill. Frequency, not presence, is the real signal — one hedge or one
long sentence in a document is normal prose. That's why vocabulary and
phrase rules fire on every occurrence (a banned word has no legitimate
frequency floor) while structural rules (em dash, rule-of-three) fire
only past a per-document density threshold.

## What each rule catches

- **`tells/banned-word`** — vocabulary that AI-detection research and
  frequency analysis (GPTZero's word-frequency data, Wikipedia's
  era-segmented list) show as wildly overrepresented in LLM output
  versus human baselines: delve, tapestry, robust, seamless, leverage,
  crucial, pivotal, elevate, unlock, and similar. These words aren't
  wrong in isolation — they're wrong because they're the *default*
  choice an LLM reaches for, so their presence at all is the tell.
- **`tells/banned-phrase`** — signposting fillers ("it's important to
  note that," "at its core"), vague attribution ("studies show,"
  "experts agree" with no named source), and closing rituals ("in
  conclusion," "the future looks bright"). These are hedges and
  non-commitments, often traceable to RLHF training pressure toward
  inoffensive, non-committal text.
- **`tells/negation-formula`** — "it's not just X, it's Y" and its
  variants. State the positive claim directly instead of setting up a
  contrast that adds no information.
- **`tells/emphatic-fragment`** — a short standalone sentence built
  from absolute vocabulary ("Nothing else is left behind.", "Every
  time, not once.") that restates the previous claim instead of adding
  to it. The tell is the terse fragment used as emphasis, not short
  sentences in general. Cut it, or fold it into the sentence before it.
- **`tells/hedge-stack`** — pairing two hedges ("could potentially,"
  "may eventually"). Pick one claim and state it; stacking hedges
  doesn't make an uncertain claim more honest, just softer.
- **`tells/copula-avoidance`** — "serves as," "stands as," "functions
  as," "represents a" substituted for plain "is/are." Named in
  Wikipedia's essay as a specific LLM tic; the dressed-up form adds
  syllables without adding meaning.
- **`tells/em-dash`** — every em dash, at error severity, not a rate
  check. A human reaching for a dash in running prose almost always
  reaches for a hyphen or a comma, so the character itself is the tell
  regardless of how often it appears. Use a comma, a period, or
  parentheses.
- **`tells/rule-of-three-density`** — a document-level check on "X, Y,
  and Z" triplet cascades. A rhythm device used once is fine; used
  as a reflex on every list, it reads templated.
- **`tells/title-case-header`** — headers capitalizing every word
  instead of sentence case. A formatting-convention tell, not a
  content one, but a strong signal on its own when combined with
  others.

## When a violation looks wrong

If a genuinely load-bearing use of a "banned" word is being flagged
(e.g. a technical document about a `robust` statistical estimator,
where the word is a term of art, not filler), that's a signal the
brief's register doesn't match this core's default general-audience
contract — raise it to the user per `hedgehog-copywriting-loop`'s rule
on extending the contract, rather than working around the flag
silently.
