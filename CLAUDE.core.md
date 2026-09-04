## This project's core: copywriting

A gate, not a style guide: `scripts/check-copy/` runs deterministic
AI-tell and prose-quality checks against a piece of copy and returns a
structured pass/fail report, so a draft is judged by a script's exit
code, not by an agent's own read of its work. Every piece of copy this
project produces goes through the `draft` layer's loop — write, run the
gate, revise on what it actually flags, repeat until it passes or the
iteration cap surfaces a real conflict between the brief and the
contract.

### The skills — invoke these, don't improvise

- **`hedgehog-copywriting-loop`** — the operating loop for this core,
  start to finish: brief intake, then the draft/checkCopy()/revise
  cycle. Invoke it at the start of any copy-writing session and for
  "what's next"; it owns the iteration cap and what counts as a real
  pass.
- **`tells-detector`** — reference for what `scripts/check-copy`'s
  AI-tell rules (`tells/*`) actually check and why: banned vocabulary,
  negation formulas, hedge stacks, copula avoidance, em-dash and
  rule-of-three density.
- **`prose-quality`** — reference for what `scripts/check-copy`'s
  prose-quality rules (`prose/*`) actually check and why: passive
  voice, weasel words, readability score, sentence-length variance,
  nominalization density.

### The agent

`copy-writer` runs the `draft` layer: reads the locked brief, drafts
into `.hedgehog/copy/final.md`, and iterates against the gate until it
passes or a real conflict surfaces. It never presents a draft that
hasn't actually been run through `scripts/check-copy`.

## The constants (do not deviate)

### The gate (locked)

**`scripts/check-copy/index.mjs`** — the one command that decides
whether a draft is done:

```
node scripts/check-copy/index.mjs <file>
```

Exits 0 and reports `pass: true` when no error-severity violation
fired; exits 1 with `pass: false` otherwise. Built on `retext` (passive
voice, weasel words, repeated words, readability), `write-good` (wordy
phrases, clichés), `flesch`/`flesch-kincaid` (document-level readability
scores), and a custom AI-tell rule set (`scripts/check-copy/rules/tells.mjs`)
— not hand-rolled grammar or syllable-counting logic. `zod`
(`scripts/check-copy/report.mjs`) validates the report's shape.

This core ships one fixed rule set — general-audience defaults (Flesch
Reading Ease floor of 50, Flesch-Kincaid grade ceiling of 10) — not a
per-project voice profile. A genuine mismatch (a technical register
that needs jargon the gate flags, a document that must stay dense) is a
signal to extend the contract deliberately, not to work around a
warning or error silently on a per-draft basis.

### Layout

Everything below lives inside `$TMPDIR`, a temporary directory created
fresh per invocation and deleted once the loop finishes — see
`hedgehog-copywriting-loop`'s "Phase -1: ephemeral scratch setup." None
of it is visible in, or written to, the directory the user actually
started in.

```text
scripts/check-copy/       the gate: index.mjs (CLI entry), rules/tells.mjs,
                           rules/prose.mjs, report.mjs (zod-validated output shape)
.hedgehog/
  copy/
    00-brief.md            what's being written, for whom, in what register
    final.md                the draft under iteration, gated by check-copy
  hedgehog.db               the build graph — the copy intent, its two
                             compiled layers, verifications, committed to git
```

The one exception is `$ORIGDIR/<slugged-title>.md` — the courtesy
export, dropped outside `$TMPDIR` entirely, at the directory the user
was actually in when the loop started. It's a plain-file copy of
`final.md`, written once draft verify passes, for a non-technical writer
to find without knowing anything above exists. The gated artifact stays
`.hedgehog/copy/final.md` inside `$TMPDIR`; this copy is never read back
by anything in the loop.

### Core rule

**A pass is a script exit code, not a sentence.** No copy ships on the
strength of "this reads clean" — it ships because
`node scripts/check-copy/index.mjs` said so, checked at both the
informal drafting loop and again at `hedgehog verify`.
