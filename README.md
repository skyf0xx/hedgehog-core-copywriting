# @skyf0xx/hedgehog-core-copywriting

Hedgehog's copywriting core: a mechanical `checkCopy()` gate against
AI-tell and prose-quality contracts, the skills that document what it
checks, and the loop that drafts copy against it until it passes.

The gate is real code — `retext`, `write-good`, and `flesch`/
`flesch-kincaid` under the hood — not an agent's own read of its draft.
A piece of copy ships because a script exited 0, the same trust model
`hedgehog verify` applies to every other core's build layers.

## Contents

- `workspace/scripts/check-copy/` — the gate, copied to
  `scripts/check-copy/` at the root of every project this core installs
  into. `index.mjs` is the CLI entry
  (`node scripts/check-copy/index.mjs <file>`), `rules/tells.mjs` is
  the AI-tell rule set (banned vocabulary, negation formulas, hedge
  stacks, structural density checks), `rules/prose.mjs` is the
  prose-quality rule set (passive voice, weasel words, readability,
  sentence-length variance, nominalization density), and `report.mjs`
  is the zod-validated output shape every rule reports through.
- `workspace/core.yaml` — the two-layer chain (`brief` → `draft`) a
  Hedgehog install compiles into its build graph, copied to the root of
  every project this core installs into alongside `scripts/check-copy/`.
- `agents/copy-writer.md` — drafts copy and iterates it against the
  gate until it passes or a real conflict with the brief surfaces.
- `skills/hedgehog-copywriting-loop/` — the operating loop: brief
  intake, then the draft/checkCopy()/revise cycle.
- `skills/tells-detector/` and `skills/prose-quality/` — reference for
  what each rule actually checks and why, read before revising against
  a violation rather than in place of running the script.
- `CLAUDE.core.md` — fills a Hedgehog project's root `CLAUDE.md`
  `{{CORE_SECTION}}` placeholder for this core.
- `hedgehog-core.yaml` — this package's manifest.

## Running the gate directly

In this repo (against `workspace/scripts/check-copy/`) or in a project
this core installed into (against `scripts/check-copy/`):

```
cd scripts/check-copy && npm install   # or workspace/scripts/check-copy in this repo
node index.mjs path/to/draft.md
```

Exits 0 with `pass: true` in the JSON report when no error-severity
violation fired; exits 1 with `pass: false` otherwise.

## Tests

```
npm test
```

Runs `workspace/scripts/check-copy`'s test suite (Node's built-in test
runner) against both intentionally AI-sounding and genuinely clean
sample text, confirming the gate actually discriminates rather than
rubber-stamping.

