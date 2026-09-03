# Security Policy

## Reporting a vulnerability

Report privately through GitHub's advisory form:

**https://github.com/skyf0xx/hedgehog-core-copywriting/security/advisories/new**

That channel is private between you and the maintainers, and it lets a
fix land before the details are public.

If the form is unavailable, open a normal issue with only the affected
component and the words "security — details on request", and a private
channel will be arranged from there. Don't put the reproduction in a
public issue in that case.

Expect an acknowledgement within a few days. You'll get the assessment,
the fix if there is one, and credit in the release notes unless you'd
rather not be named.

## Supported versions

Fixes land on the latest released version. There are no long-term
support branches.

## What's in scope

This package is Hedgehog's copywriting core: an agent, a set of
skills, and a mechanical `checkCopy()` gate (`workspace/scripts/check-copy/`)
that a consuming project installs and runs against its own drafts. The
interesting boundaries:

- **The `check-copy` script** (`workspace/scripts/check-copy/`) — path
  traversal, anything that lets a crafted input file escape its
  intended scope, or anything that lets the gate report a pass when
  the underlying prose contract actually failed.
- **The installed payload** (`agents/`, `skills/`, `CLAUDE.core.md`) —
  these files are copied verbatim into every consuming project, so a
  change that makes the copy-writer agent take instructions from
  untrusted content, or that weakens the gate a project relies on, is
  a supply-chain issue.
- **Prompt injection reaching the copy-writer agent** through content
  it reads — a brief, a source document, fetched reference copy.
  Reports here are welcome and are treated as real, not theoretical.

## What's out of scope

- Vulnerabilities in dependencies with no Hedgehog-specific exploit
  path — report those upstream.
- Anything that requires the attacker to already control the machine
  running `check-copy`, or to have write access to the repository.
- False positives or false negatives in the prose-quality heuristics
  themselves (readability scores, AI-tell phrasing) — those are
  quality bugs, not security issues. Open a normal issue instead.

## A note on local-only impact

Most of this core's attack surface is local: the inputs are a
project's own brief and draft files. That lowers severity but doesn't
put a report out of scope. In this tool's model those files are
frequently written by AI agents rather than by a person, so "the input
comes from the project itself" is not the same assurance it would be
in a hand-written codebase — an agent that has been misled is a
plausible source of hostile input.
