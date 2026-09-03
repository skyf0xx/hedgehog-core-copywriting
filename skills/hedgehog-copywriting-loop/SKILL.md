---
name: hedgehog-copywriting-loop
description: The operating loop for the copywriting core, start to finish — brief intake, then the draft/checkCopy()/revise cycle that gates every piece of copy on a mechanical pass, not an agent's own self-report. Invoke at the start of any copy-writing session and for "what's next."
---

# Copywriting Loop

This core produces copy — marketing copy, product UI strings, docs
prose, whatever the brief names — gated by `scripts/check-copy/`, a
real Node script that runs deterministic AI-tell and prose-quality
checks (`tells-detector` and `prose-quality`'s rule sets, as code) and
returns a structured violation report. The loop exists because an
agent's own read of its draft ("this looks clean") is not a gate; a
process exiting 0 or 1 is.

## The layers

1. **`brief`** — capture what's being written, for whom, and in what
   register, at `.hedgehog/copy/00-brief.md`. `hedgehog verify` on this
   layer only checks the file is non-empty; there's no copy quality
   gate yet because there's no copy yet.
2. **`draft`** — the loop below, ending with `.hedgehog/copy/final.md`
   passing `node scripts/check-copy/index.mjs .hedgehog/copy/final.md`
   with exit code 0.

## The loop

1. **`hedgehog claim --owner copy-writer --count 1`** emits the task
   packet for the ready layer.
2. **Delegate to `copy-writer`.** It reads the brief, drafts copy into
   `.hedgehog/copy/final.md`, then runs the gate itself before
   presenting anything:
   ```
   node scripts/check-copy/index.mjs .hedgehog/copy/final.md
   ```
3. **Read the JSON report.** `pass: false` means at least one
   error-severity violation fired — revise and re-run, not argue with
   the report. `pass: true` with `warningCount > 0` is a judgment call:
   warnings (weasel words, passive voice, low burstiness, readability
   drift) are real signal but not automatically disqualifying — weigh
   each against the brief's register before deciding whether to revise
   further or ship as-is. Never silence a warning by rewording it to
   dodge the specific regex without addressing what it flagged.
4. **Cap at 6 iterations.** A draft that can't clear errors in 6 passes
   usually means the brief and the gate are in tension (e.g. a register
   that genuinely needs a "banned" word in context, or a target
   reading level the subject matter can't honestly hit) — stop and
   surface that conflict to the user rather than iterating blindly.
   Each iteration is informal (no commit); only the final passing draft
   gets committed.
5. **`hedgehog verify draft --owner copy-writer`** — re-runs the same
   `checkCopy()` command as the actual gate (not trusting step 3's
   informal run), and on pass writes the layer's commit
   (`feat(copy): draft`). On failure the task moves to `blocked`; go
   back to step 2, don't hand-commit around a block.

## Rules

- **Never edit `.hedgehog/copy/final.md` to make a specific check pass
  without addressing what it's actually flagging.** Deleting the word
  "delve" from a sentence that's still structurally a hedge stack is
  gaming the gate, not fixing the copy — the loop should always leave
  the draft better, not just quieter.
- **`checkCopy()`'s default thresholds are the general-audience
  contract** (see `prose-quality`'s reading-ease floor and grade
  ceiling) — this core ships one fixed rule set, not a per-project
  voice profile, so don't invent exceptions ad hoc. If a real project
  needs a different register, that's a signal to extend the contract
  itself (a future voice-profile config), not to bypass it per-draft.
- **The brief is read-only once the draft layer starts.** A brief that
  turns out wrong mid-draft is a Correction Protocol case — fix the
  brief at its source, re-run the draft layer, not patch around it in
  `final.md`.

If a dispatch by name reports the agent as not found — expected right
after `init`/`update` installed it this same session — see root
CLAUDE.md's "Delegating on this host" note rather than treating it as
fatal.
