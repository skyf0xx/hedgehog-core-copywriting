---
name: hedgehog-copywriting-loop
description: The operating loop for the copywriting core, start to finish — planning intake (the vendored BMAD-METHOD shelf, mined into a brief), then the draft/checkCopy()/revise cycle that gates every piece of copy on a mechanical pass, not an agent's own self-report. Invoke at the start of any copy-writing session and for "what's next." Also covers this core's own planning intake.
---

# Copywriting Loop

This core produces copy — marketing copy, product UI strings, docs
prose, whatever the brief names — gated by `scripts/check-copy/`, a
real Node script that runs deterministic AI-tell and prose-quality
checks (`tells-detector` and `prose-quality`'s rule sets, as code) and
returns a structured violation report. The loop exists because an
agent's own read of its draft ("this looks clean") is not a gate; a
process exiting 0 or 1 is.

## Planning intake (Phase 0, before any build layer)

Run once. This core has no bootstrap step: `hedgehog init --copywriting`
lands `scripts/check-copy/` and `core.yaml` together, as this package's
`workspace/`, at install time — before planning intake ever starts. This
is the one core `planner`'s generic Workflow step 9 does not hand off to
`bootstrap` for; step 5 below runs `hedgehog plan` directly instead,
since the core.yaml it needs is already on disk. Opens with
`hedgehog-planning-intake`'s Phase 0 (step 1 below). After that Phase 0
completes, this section does its own thin mining pass — what's being
written, for whom, and in what register — the copywriting counterpart to
`hedgehog-planning-intake`'s own Phase 1 (domain modules and an
Add-ons decision on full-stack-app).

1. **Run `hedgehog-planning-intake`'s Phase 0**, full shelf or
   compressed intake depending on which `planner` routed to for this
   request (see that skill's "Compressed intake" section): state the
   BMAD attribution it states, then either run `bmad-forge-idea`,
   `bmad-brainstorming`, `bmad-product-brief`, `bmad-prfaq`, `bmad-prd`,
   `bmad-ux`, `bmad-deep-recon` in full, or — on an explicit "just build
   it" choice, for a short, low-stakes piece — the batched round
   compressed intake defines instead. Either way, archived to
   `.hedgehog/BMAD/` with the fixed layout and `00-manifest.md`
   attribution header that skill's Phase 0 defines. `.hedgehog/BMAD/` is
   archival and immutable once written, same as every other core —
   nothing in this core's day-to-day loop reads it live after this step
   mines it once. On a full run, `bmad-ux`'s design-handoff output isn't
   this core's primary input — `bmad-prd` and `bmad-prfaq` are — so
   skipping `DESIGN.md` entirely and reducing `EXPERIENCE.md` to
   whatever sections the brief actually gives it something to say about
   (rarely more than a Key Flow, if any) is sanctioned behavior on this
   core, not an improvisation to justify each time `bmad-ux` runs: this
   core has no UI surface for that skill's Foundation/Component
   Patterns/State Patterns spine to describe. `bmad-brainstorming`'s
   Ideate-for-me mode defaults to auto-generating an HTML keepsake —
   unwanted work on a core whose deliverables are plain prose. A project
   that wants brainstorming sessions to stay markdown-only can set
   `keepsake_format = "markdown-only"` in
   `_bmad/custom/bmad-brainstorming.toml`; this core doesn't set it by
   default, since some copywriting projects do want the visual keepsake.
2. **Mine a draft brief** from `.hedgehog/BMAD/`: what's being written
   (the concrete piece — a landing page section, a product announcement,
   a UI microcopy string, docs prose), the audience, and the register to
   write in, sourced from the product brief and PR-FAQ (the closest BMAD
   artifacts to a copy brief). `00-brief.md` itself stays this thin by
   design — the root the `draft` layer works from, not a copy of BMAD's
   full archive. Where the brief/PR-FAQ leaves what/audience/register
   genuinely unresolved, ask directly — don't proceed on vagueness, and
   don't invent an audience or register that wasn't stated, mined, or
   confirmed.
3. **Write `.hedgehog/copy/00-brief.md`** — the mined what/audience/
   register, in plain terms. This is the root the `draft` layer's
   `copy-writer` agent works from; it draws from BMAD's archive but is
   its own file, not a pointer into `.hedgehog/BMAD/`.
4. **Confirm & Lock** — show the mined brief back in plain terms,
   alongside which BMAD skills ran and where their output lives
   (`.hedgehog/BMAD/`), before writing anything to the build graph.
   State plainly what happens on confirmation: *"This locks in the
   brief, adds the `copy` intent to the build graph (`hedgehog intent
   add`), compiles it into the two-layer chain (`hedgehog plan`), and
   commits (`chore(planning): copy brief`). The draft layer starts right
   after — this core's workspace is already installed, so there's no
   bootstrap step to wait on. Anything wrong or missing — say so now."*
   Wait for explicit go-ahead — a revision here is just another mining
   pass against the same BMAD archive, not a Correction Protocol entry,
   since nothing downstream exists yet.
5. **Add the intent and compile the graph**: `hedgehog intent add --id
   copy --goal "<what's being written>" --outcome "<audience + register>"`
   — one call, no `--rule`/`--depends-on` needed; copywriting has no
   module axis, so this single intent is what `hedgehog plan` compiles
   against this core's `core.yaml` into the two layer tasks. Run
   `hedgehog plan` next, then `hedgehog status` to show the compiled
   chain.
6. **Commit planning intake's output as one commit**,
   `chore(planning): copy brief` — the committed intent
   (`.hedgehog/intents/copy.json`), `.hedgehog/BMAD/`, and
   `.hedgehog/copy/00-brief.md` together.

## The layers

1. **`brief`** — written by the planning intake section above, at
   `.hedgehog/copy/00-brief.md`. `hedgehog verify` on this layer only
   checks the file is non-empty; there's no copy quality gate yet
   because there's no copy yet.
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
   1. **After verify passes and the layer's commit is written, drop a
      courtesy export at the project root**: copy the just-verified
      `.hedgehog/copy/final.md` to a plain file named from a kebab-case
      slug of `00-brief.md`'s "what's being written" (fallback to
      `article.md` if the brief text doesn't yield a clean slug), e.g.
      `product-launch-announcement.md`. If that filename already exists
      at the root, append `-2`, `-3`, … until it doesn't — never
      overwrite an earlier piece's export. This is a courtesy copy only:
      `.hedgehog/copy/final.md` remains the canonical, gated artifact
      that verify and any later steps reference; nothing about the
      layer chain or the gate itself changes because of this.

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
