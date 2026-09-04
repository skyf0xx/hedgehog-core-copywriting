---
name: tweet-copy
description: Reference for what scripts/check-copy's tweet format rules actually flag and why: the 280-character platform count, hashtag piles, engagement bait, body links, weak and all-caps hooks, false contrarian frames, plus the single-post hook formulas to draft toward. Read this before revising a `format/*` violation on a post for X, not to hand-grade a draft in place of running the script.
---

# Tweet Copy

> Adapted from the `x-post-writer` skill by Sergey Bulaev
> (https://github.com/sergebulaev/x-skills), used under the MIT licence.

`scripts/check-copy/rules/formats/tweet.mjs` is the actual gate. This
skill explains what it checks and why, so a `format/*` violation on a
post for X gets fixed at the root cause rather than trimmed just enough
to clear a threshold. Never substitute a manual read of this list for
running the script; the premise of this core is that the check is
mechanical, not agent-graded.

Invoke it on a file holding one draft post:

```
node scripts/check-copy/index.mjs <file> --format tweet
node scripts/check-copy/index.mjs <file> --format tweet --premium
```

`--premium` raises the character ceiling from 280 to 25000 and changes
nothing else. Pass it only when the author's account actually has
Premium and the extra length earns itself.

The universal contracts run underneath this one on every invocation:
`tells-detector` for AI vocabulary and phrasing, `prose-quality` for
readability and sentence rhythm. The tweet module only adds what those
two cannot see, which is the platform itself. For longer pieces, the
sibling format contracts are `ad-copy`, `landing-page-copy`, and
`direct-response-copy`.

## Scope

This skill covers a single post. Threads are out of scope: no numbering
scheme, no per-post hook chain, no continuation logic. If an idea needs
a second post to land, that is a signal to cut it down to one claim, and
the gate will say so through `format/tweet-length` when the draft runs
long.

The skill also ends at the draft. This core writes copy and gates it. It
does not publish, schedule, or post anywhere, and it has no notion of a
posting window or an approval card. What comes out is a file that
exited 0.

## What the gate checks

- **`format/tweet-length`** (error). Over 280 characters, or over 25000
  with `--premium`. The platform truncates or rejects past its limit,
  which is a defect no amount of good writing survives. See the counting
  rule below, because this is the one rule where the obvious mental
  model is wrong.
- **`format/hashtag-count`** (error). More than one hashtag. A stack
  reads as reach-chasing to a human and X ranks it down. One is the
  ceiling, and zero is usually right.
- **`format/engagement-bait`** (error). "RT if you", "retweet if you",
  "reply YES" (and its variants: reply with yep, interested, me), "like
  if you", "follow me for more", "comment X and", "tag a friend",
  "drop a X below". X demotes these patterns directly. They also ask for
  a reaction instead of earning one, so the post that uses them is
  weaker even where the ranking penalty does not apply.
- **`format/body-link`** (warning). An external link in the post body.
  X suppresses reach on posts that send people off-platform, so the
  convention is to put the link in a reply and keep the post itself
  self-contained. This is a warning rather than an error because some
  posts genuinely are the link: an announcement whose whole payload is a
  URL loses nothing by carrying it. That call belongs to the author, so
  the gate reports it and passes.
- **`format/weak-hook`** (warning). A first line running over 120
  characters before the first line break, in a post that has a line
  break. A multi-line post is making a promise that line one is the
  hook; a 120-plus-character opener has stopped being a hook and become
  the first paragraph. A single-line post never fires this rule, because
  there is no fold to fail.
- **`format/all-caps-hook`** (error). An opening line in all caps
  running 15 characters or more. Intensity comes from word choice. Caps
  are volume, and volume reads as a stranger shouting.
- **`format/false-contrarian`** (warning). "Unpopular opinion:" in a
  post that never names the opposing view. The rule looks for "but",
  "however", "most people", or "everyone" somewhere in the body as
  evidence that a popular position is actually stated. Without one of
  those, the contrarian frame is decoration on a take nobody disputes.
  Name what the popular position is, or drop the frame.

## How X counts characters

`format/tweet-length` does not measure the length of the string. It
calls the `tweetLength` helper in `rules/formats/shared.mjs`, which
reproduces two quirks of X's own counter:

1. **Every URL costs a flat 23 characters**, however long it is. X runs
   links through its `t.co` shortener, so a 200-character tracking URL
   and a 12-character domain both bill 23. The helper substitutes 23
   spaces for each `https?://…` run before counting.
2. **Most emoji cost 2 characters.** So do CJK characters and other
   wide-glyph ranges. The helper walks the string by code point and
   charges 2 for anything in those ranges, 1 for everything else.

Both directions matter. A draft with three emoji is 3 characters longer
than `.length` reports, so a raw string count of 279 can be a real count
of 282, and a draft that looked fine in an editor gets rejected at post
time. A draft carrying a long URL runs the other way: `.length` says 340
and the real count is 186, so a naive check would send the author off to
cut a post that was already inside the limit. Neither error is one an
author catches by eye, which is the reason the helper exists.

## Why the first line carries the whole post

A single post on X has no "see more" fold. The reader sees the opening
line while scrolling and decides, in that line alone, whether the rest
exists for them. Nothing arrives later to rescue an opener that only
makes sense once line two lands.

The practical test: read the first line by itself and ask whether it is
a complete provocation. If the answer is "well, it sets up the next
bit", rewrite it. The setup was the problem.

`format/weak-hook` catches the length version of this failure. It cannot
catch the semantic version, where a short first line is still a windup.
That one is on the writer.

## Hook formulas

Seven shapes for a single post. Each skeleton is a starting frame for
drafting rather than a template to fill mechanically. The point is to
know which shape the idea wants before drafting, so the first line is
chosen rather than whatever came out first.

**X1, one-liner contrarian.** Best for a sharp take you can defend when
someone argues. Aims at reposts.

```
[Widely held practice] is [the wrong thing it actually causes].
[The one-sentence reason.]
```

The frame collapses if the take is not genuinely contested. If you would
struggle to name someone who disagrees, the shape is wrong, and
`format/false-contrarian` fires the moment you dress it up with
"Unpopular opinion:".

**X2, data-point hook.** Best for one odd, precise number that reframes
something the reader thought they understood. Aims at bookmarks.

```
[Precise number with its unit and scope.]
[What that number means, in one line.]
[The implication for the reader.]
```

Odd precision beats round numbers. "37% of our signups never open the
app" is a fact; "about a third" is a shrug.

**X3, build-in-public confession.** Best for a real metric from your
own work, the ugly ones included. Aims at replies, because a specific
admission gives people something to answer.

```
[The number, stated flat, no cushioning.]
[What I did that produced it.]
[What I am changing.]
```

The confession has to cost something. A humble-brag in this shape reads
as a brag with extra steps.

**X4, quote post with value.** Best for adding a layer to someone
else's take rather than restating it. Aims at reposts.

```
[The thing their post gets right, in one clause.]
[The piece it leaves out.]
[The concrete case where that missing piece decides the outcome.]
```

If your addition is agreement, do not post it. The value is the layer.

**X5, mini-list.** Best for a scannable set of items that genuinely
fits in one post. Aims at bookmarks.

```
[Framing line naming what the list is for.]

[Item, specific]
[Item, specific]
[Item, specific]
```

Every item needs a specific. A list of abstractions is the shape without
the substance, and `prose-quality` tends to catch the vagueness even
when the format rules pass.

**X6, relatable cold-open.** Best for a shared moment that needs no
setup. Aims at likes.

```
[The moment, told in present tense, with one concrete detail.]
[The turn or the punchline.]
```

The detail does the work. "The deploy is green and my stomach isn't"
lands; "we've all been there" does not.

**X11, third-person case study.** Best when the striking result belongs
to someone else and the reader could plausibly copy it. Aims at reposts.

```
[Person or company] did [specific thing] and got [specific result].
[The mechanism, in one line.]
[Why it transfers, or where it doesn't.]
```

Use it in place of a first-person "How I" whenever the result is not
yours. Do not invent the case, and do not round the result up.

### Picking by goal

| Goal | Reach for |
|---|---|
| Replies | X3, X1 |
| Reposts | X1, X4, X11 |
| Likes | X6 |
| Bookmarks | X2, X5, X11 |

Pick one goal. A post aimed at all four is aimed at none, and the shapes
pull against each other: the confession that earns replies is a
different opening line from the number that earns bookmarks.

## Craft rules

**One idea per post.** Two ideas means the second one is stealing
attention from the first. Cut it, or keep it for another day. This is
also the cheapest fix for `format/tweet-length`, and a better one than
compressing two ideas into 280 characters of shorthand.

**Line breaks are beats.** A break tells the reader to pause, so put one
where a pause helps the meaning land, and nowhere else. Decorative
breaks turn a post into a poem nobody asked for.

**One specific number wherever the claim allows it.** "2.4x" beats "way
better" because it is checkable and because it implies you measured.
When the claim genuinely has no number, use a named entity instead: a
tool, a company, a version. Specificity is the thing, and a number is
the cheapest form of it.

**Close on a landing.** End on the sharpest line, or on a question
specific enough that answering it requires knowing something. "What do
you think?" is not that question.

## Anti-patterns

- Padding a one-line idea with filler so it looks substantial. If the
  idea is one line, ship one line.
- A hashtag stack, or any hashtag doing work that a word in the sentence
  should do.
- More than one emoji, and any emoji at all on a serious or contrarian
  take.
- An all-caps opener standing in for a strong verb.
- A rule-of-three list where the three items are abstractions. This one
  fires in `tells-detector` as well.
- Hard-selling the author's own product. One natural mention is the
  ceiling.
- Engagement bait in any of the forms the gate names, and its softer
  cousins that the regexes do not catch. The rule is a floor.

## When a violation looks wrong

`format/body-link` on a post whose entire purpose is the link, or
`format/weak-hook` on a single dense opening line that genuinely needs
its length, are the two warnings most likely to be correct-but-wrong for
a given brief. Both are warnings for exactly that reason, and a report
carrying only warnings still passes the gate.

The error-severity rules are different. If `format/tweet-length`,
`format/hashtag-count`, `format/engagement-bait`, or
`format/all-caps-hook` fires on something the brief actually calls for,
that is a signal the brief's medium does not match this format contract:
a post going to another platform, or copy destined for a paid placement
where the rules differ. Raise it to the user per
`hedgehog-copywriting-loop`'s rule on extending the contract, rather
than working around the flag silently.
