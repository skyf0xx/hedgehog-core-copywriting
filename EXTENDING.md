# Extending the gate

Checklists for the four changes this core actually gets: adjusting a
style profile, adding one, removing one, and adding a rule.

`ARCHITECTURE.md` describes what the pieces are. This describes what to
touch when you change them, because the touchpoints are spread across
code, tests, and five documents that name profiles by hand.

## The one rule that governs all of it

**A threshold belongs in a profile only if the register genuinely
changes what "good" means. Everything else is universal.**

Get this wrong and the gate stops working, in a way no test catches. A
profile is a way to say "this register is allowed to be different." Move
a check there that shouldn't be, and any draft can pass by picking the
lenient profile.

Universal, and not up for negotiation per register:

- `prose/abstraction-density` — no register makes vague prose good.
  Technical writing and literary essays both clear it comfortably.
- `tells/*` phrasing — negation formulas, hedge stacks, banned phrases.
- `prose/repeated-word` — a defect anywhere.

Per-register, and currently the whole list:

- `readingGradeMax`, `readingEaseMin` — an essay is legitimately denser
  than a landing page.
- `emDashPer1000Max` — considered use versus a structural default.
- `minSentenceLengthStdDev` — long-form sustains more variance.

If a proposed new field isn't obviously in the second group, it belongs
in the first.

## Adjusting an existing profile

For changing a threshold, not adding one.

1. **Reproduce the miss.** Save the draft that was scored wrongly. A
   threshold change with no failing sample behind it is a guess.
2. **Edit the value** in `workspace/scripts/check-copy/rules/profiles.mjs`.
3. **Check the sample now scores correctly**, and — the step that
   matters — **check the samples that were already right still are**.
   Loosening a threshold to admit one draft is how a gate quietly stops
   gating.
4. **Update the measured claim in the comment** if the number it cites
   no longer matches. These comments carry the evidence for the value;
   a stale one is worse than none.
5. `npm test`.

Nothing in the docs names threshold *values*, so a value-only change
stops here.

## Adding a profile

Only when a real draft failed for a reason a threshold should have
allowed. Not in advance, and not to complete a set — the shipped three
exist because samples failed under `general` for register reasons, and a
fourth earns its place the same way.

Before anything else, check the failure is actually about register.
Fixing it in the wrong direction is the failure mode this core exists to
prevent — reach for a new profile only when a *good* draft was scored
badly, never when a bad draft was scored correctly and you would like it
to pass.

1. **`workspace/scripts/check-copy/rules/profiles.mjs`** — add the entry.
   All four fields are required; there is no inheritance, deliberately,
   so every profile's thresholds are readable in one place. Comment it
   with the measured numbers that justified it.
2. **`workspace/scripts/check-copy/test/check-copy.test.mjs`** — add a
   case proving the profile admits a draft the default rejects, in the
   shape of the existing "passes concrete prose in a register that
   scores high on the reading grade" test. A profile with no test is a
   set of numbers nobody checked.
3. **Five documents name the profiles by hand.** All five, or the set
   silently disagrees with itself:
   - `CLAUDE.core.md` — the profile list under the gate command.
   - `ARCHITECTURE.md` — the `--style` line in the contents list.
   - `skills/prose-quality/SKILL.md` — the "Style profiles" section.
   - `skills/hedgehog-copywriting-loop/SKILL.md` — the `<profile>` note
     at the gate command, and the Rules entry on picking one.
   - `agents/copy-writer.md` — workflow step 3's selection guidance.

   `ARCHITECTURE.md` points here for the list, so this file is the one
   to correct if the set of five ever changes.
4. `npm test`, then run the CLI once with `--style <new>` and once with
   `--style nonsense` to confirm the error message lists it.

## Removing a profile

Same five documents, in reverse. The step people miss: **check nothing
in the loop still selects it.** A profile named in `copy-writer.md` but
absent from `profiles.mjs` fails at the CLI's validation with exit code
2, which surfaces mid-draft as a confusing error rather than at the
point the profile was deleted.

Removing the default (`general`) additionally requires changing
`DEFAULT_PROFILE`, and it is the only removal that changes behavior for
callers passing no `--style` at all.

## Adding a rule

1. **Decide the grain honestly.** Sentence-grain rules accuse a specific
   sentence, so they need to be right about that sentence. Document-grain
   rules report a ratio, and individual misclassifications wash out.
   This is the difference between the removed `write-good` checks and
   `prose/abstraction-density` — the same underlying vagueness signal,
   one unusable and one reliable, entirely because of grain.
2. **Decide severity by evasion cost, not by how bad the writing looks.**
   Error severity is for signals a rewrite cannot dodge by substitution:
   structure, density, whole formulations. Warning severity is for
   anything a synonym swap satisfies. Vocabulary lists are warnings for
   this reason — see the note at the top of `rules/tells.mjs`.
3. **Guard small samples.** Every document-grain rule needs a floor
   below which it does not fire: 8 sentences for burstiness, 15 nouns
   for abstraction. Ratios over a handful of items describe the sample
   rather than the writing, and a short-text false positive on an error
   rule blocks a draft that is fine.
4. **Validate against prose you did not write.** Published text, and
   ideally text that is deliberately bad but human — the clearest signal
   that the abstraction check measures abstraction rather than
   authorship was Orwell's own parody scoring beside LLM output while
   his real prose in the same essay scored with the good samples.
5. **Wire it up**: export from the rule module, call it in `index.mjs`,
   add any new metric to the schema in `report.mjs` (nullable if the
   rule can decline to score), and document it in
   `skills/prose-quality/SKILL.md` or `skills/tells-detector/SKILL.md`.
6. **Test both directions** — that it fires on the failure it targets,
   and that it stays quiet on good prose in the register most likely to
   trip it.

## Adding a dependency

The bar is a check that is impossible without it and useful with it.
`compromise` cleared it for part-of-speech tagging behind the
abstraction check; nothing else in the gate needs it, and that narrowness
is the point.

Run `npm pack --dry-run` after adding one and confirm no `node_modules`
appears in the output. The `files` list in the root `package.json`
excludes both `workspace/node_modules/**` and
`workspace/scripts/check-copy/node_modules/**` — npm hoists workspace
dependencies to the former, so an exclusion covering only the latter
silently ships megabytes.

## Removing a dependency

Worth the same scrutiny as adding one, and easier to justify than it
looks. `write-good` was removed after measurement: eight false positives
against two true ones on a single good essay, a passive check duplicating
`retext-passive`, a weasel check duplicating `retext-intensify`, and a
cliché check that caught one of seven stacked clichés in a loaded test.

Check what the removal silently drops. The clichés moved into
`BANNED_PHRASES` in `rules/tells.mjs`; had they not, the removal would
have quietly reduced coverage.
