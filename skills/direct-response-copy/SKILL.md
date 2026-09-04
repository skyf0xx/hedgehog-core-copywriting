---
name: direct-response-copy
description: Reference for what scripts/check-copy's long-form direct-response format contract actually flags and why: missing CTA, missing specificity, vague benefit claims, missing proof, unqualified claims. Plus the headline, opening, curiosity, flow and framework craft that writing toward that contract depends on. Read this to understand a `format/*` violation before revising against it. It is not a way to hand-grade a sales page in place of running the script.
---

# Direct response copy

> Adapted from the `direct-response-copy` skill by Rob Palmer
> (https://github.com/robpalmer99/claude-code-copywriting-skills),
> used under CC BY 4.0.

`scripts/check-copy/rules/formats/direct-response.mjs` is the actual
gate for this format. This skill explains what it checks, why each
check exists, and what craft produces copy that clears it on the first
pass instead of the fourth. Reading this list is never a substitute for
running the script. A sales page ships because the process exited 0.
An agent reading it back to itself and liking it is a different thing.

Invoke the gate on this format with:

```
node scripts/check-copy/index.mjs <file> --format direct-response
```

## Scope

This format covers LONG-FORM persuasive copy whose job is a measurable
action from the reader: sales pages, VSL and TSL scripts, email copy,
headlines, and the CTAs that close them. Two neighbours are deliberately
out of scope. A short bridge page, where the constraint is compression
rather than sustained persuasion, belongs to `landing-page-copy` and its
`--format landing-page` contract. Meta ad copy, where character caps and
platform policy do most of the enforcing, belongs to `ad-copy` and
`--format ad`. A single post on X belongs to `tweet-copy`. Pick the
format that matches where the copy ships, because each module checks a
different thing.

## What the gate checks

Five rules fire from the direct-response module. Four are errors and one
is a warning, which tells you what the format is strict about: making a
specific claim, and asking for the action.

- **`format/missing-cta`** (error). No call-to-action verb appears
  anywhere in the body. The pattern looks for the verbs that actually
  ask: click, tap, call, order, buy, get, grab, start, try, book, claim,
  download, join, subscribe, reply, register, reserve. Direct response
  is *defined* by asking for a specific action; copy that describes an
  offer and then trails off is brand copy wearing a sales page's
  clothes. Name the action.
- **`format/missing-specificity`** (error). Copy running over 100 words
  with no number anywhere in it: no price, no timeframe, no result, no
  count. This is an error rather than a warning because specificity *is*
  the discipline. Every other rule in this module can be argued against
  from some register or another, but unquantified copy has no mechanism
  by which it could persuade. "Cleans almost all bacteria" and "cleans
  99.6% of bacteria" are the same claim; only one of them is believed.
  A page with zero numbers is asserting things it never grounds, and no
  amount of rhythm fixes that. Warning severity would let it ship.
- **`format/vague-benefit`** (error). Nine phrases that occupy the slot
  where a concrete outcome belongs. Four are self-flattery with no
  referent: `best-in-class`, `world-class`, `state-of-the-art`,
  `industry-leading`. Two duck the question of who the product is for:
  `businesses of all sizes`, `achieve your goals`. Three are stock
  aspiration filler: the "next level" escalator, the "potential" one
  about to be released, and the "new heights" one about to be reached.
  The module's `VAGUE_BENEFITS` array carries the exact patterns; read
  it there rather than trusting this paraphrase. Each fires per
  occurrence with a sentence-grain excerpt. These are not weak words to
  be strengthened. They are placeholders that were never filled in, and
  the fix is always the same shape: put the concrete outcome and the
  number behind it into the slot.
- **`format/missing-proof`** (warning). Copy over 150 words with no
  testimonial, named source, quoted result, or cited study. The check
  looks for attribution verbs (said, says, told, according to), the
  words study, survey, customers, clients, users, or any quoted run of
  20 or more characters. Proof carries the middle of long-form copy.
  A specific claim with nothing behind it is still just a claim, and
  past a certain length the reader has had time to notice. This is a
  warning because a genuinely short offer email can be honest without a
  testimonial block; weigh it against the brief rather than padding a
  quote in to silence it.
- **`format/unqualified-claim`** (error). The shared claims list, run
  on this format because the legal exposure here is real. It fires on
  guaranteed outcomes ("guaranteed you'll", "guarantee to"), absolute
  risk-free promises ("100% risk-free", "completely guaranteed"),
  "zero risk", results presented as typical, make-money-fast,
  get-rich-quick, no-effort-required framings, cure claims ("cures
  your", "cures any"), and specific weight-loss claims ("lose 30 lbs").
  Ad networks suspend accounts over these and regulators fine over
  them. Qualify the claim or cut it. Note that this same list runs on
  `--format ad`, so a claim that fails here fails there too.

## What this module deliberately does not do

The universal contracts always run. `tells-detector` and
`prose-quality` fire on direct-response copy exactly as they fire on
everything else, and this module never relaxes them. No copy type is
licensed to sound more like an LLM because of where it ships.

That matters here more than in the other formats, because direct
response legitimately uses devices that look like defects from a
distance. Short punchy fragments are a rhythm tool in this tradition.
So are repeated openers across consecutive lines. Sentence-length
variance runs wide on purpose. The module's answer is not to loosen
`prose/*` for this format, but to add the two checks those rules cannot
make: whether the copy is concrete, and whether it closes.

So when a genuine rhythm device trips a universal rule, that is raised
to the user, per the closing section below. It is never silently worked
around, and it is never used as a reason to reword until one regex
stops matching while the underlying prose stays the same.

## The core principle

Good direct response sounds like a person who figured something out and
wants to tell you about it. A marketing team sounds like something else,
and so does a guru.

Write as though you are explaining something to a smart friend who is
skeptical but curious. Back every claim with a specific. Make the
transformation something the reader can picture. Everything below is
mechanics in service of that.

## Headlines

The headline does most of the work. Caples measured one headline
outpulling another by 19.5x on the same product and the same offer.
Ogilvy's number: on average five times as many people read the headline
as read the body.

**The master formula:** action verb, plus specific outcome, plus a
timeframe or a contrast.

- "Ship your startup in days, not weeks"
- "Save 4 hours per person every single week"
- "Build a $10K/month business in 90 days"

The contrast form ("days, not weeks") builds a before and after inside
six words.

**The story headline.** Caples again, with the most famous ad headline
ever written: "They Laughed When I Sat Down at the Piano... But When I
Started to Play!" That is a complete story in fifteen words.
Embarrassment, then triumph. The pattern: "They [doubted] when I
[action]... But when I [result]..."

**The specificity headline.** Ogilvy's Rolls-Royce line: "At 60 miles an
hour, the loudest noise in this new Rolls-Royce comes from the electric
clock." It never says "quiet car". The reader reaches that conclusion
alone, which is why it holds. The pattern: a specific number or metric,
plus an unexpected comparison or detail.

**The question headline.** "Do You Make These Mistakes in English?" ran
for forty years. The reader thinks "what mistakes?" and self-selects.
The pattern: "Do you [common struggle]?" or "What if you could
[desirable outcome]?"

**The transformation headline.** "From Broke Musician to $100K/Year
Music Teacher." Before and after in one line, with the reader placing
themselves in the before. The pattern: "From [bad state] to [good
state]".

**Why headlines fail:** reaching for clever instead of clear; forgetting
the reader's self-interest; vague claims where a specific belongs (this
is what `format/vague-benefit` catches); and telling the whole story so
that nothing is left to discover.

Caples' working advice was to write at least five headlines. One of
them will beat the others by somewhere between 2x and 10x, and it will
not be the one you expected.

## Opening lines

The first sentence has exactly one job: earn the second sentence.

- **Direct challenge.** "You've been using Claude wrong." Stops the
  scroll, creates tension, self-selects readers who suspect it might be
  true.
- **Story.** "Last Tuesday, I opened my laptop and saw a number I
  couldn't believe: $47,329 in one day." The reader is inside the scene
  before noticing this is sales copy.
- **Confession.** "I'll be honest with you. I almost gave up on this
  business three times." Vulnerability disarms skepticism.
- **Specific result.** "In 9 months, we did $400k+ on a vibe-coded
  website using these exact methods." Numbers buy credibility, and the
  reader wants the how.
- **Question.** "Have you ever stared at a blank page, knowing you need
  to write something that sells... and just froze?" If the question
  matches their reality, they are already reading.
- **The short sentence.** Sugarman's approach: "It's simple." "Here's
  the truth." "This works." Near-zero friction to begin. They are in
  paragraph two before deciding to be.

**Openings to avoid:** the pace-of-the-modern-world scene-setter, the
"are you ready to" question with a stock aspiration attached, the
greeting that welcomes the reader and thanks them for arriving, the
table of contents that announces what this article will teach, and the
invitation to dive in. These are generic enough to head any document
about anything, which is the problem. Several of them also trip
`tells/banned-phrase` or `format/vague-benefit` outright, so they fail
the gate as well as the reader.

## Curiosity gaps and open loops

The brain wants closure. Open a loop and the reader keeps going to close
it.

**Creating the gap.** "10 Tips for Better Writing" tells you exactly
what you get, so there is no reason to read on. "I tested 47 headlines.
One pattern beat everything else by 3x." raises a question the reader
now has to answer.

**Seeds of curiosity.** End paragraphs with a pull into the next one:
"But that's not even the best part." "Here's where it gets
interesting." "Let me explain why." "Which brings me to the real
secret." "Now here's the thing..." Two to four per page. Every
paragraph ending on a tease reads as a tic.

**The partial reveal.** "The formula has three parts. The first one is
obvious. The third one is counterintuitive. But the second one? That's
where the magic happens." The reader now needs the second part
specifically.

**Closing loops.** Every loop you open must close. Tease "the one thing
that changed everything" and never deliver it, and you have spent trust
you will not get back. Close small loops within one to three
paragraphs; close big ones by the end of the piece.

## Flow: the slippery slide

Sugarman's image: the reader should be so compelled that they cannot
stop until they have read all of it, as if sliding down a slippery
slide. Every element exists to deliver the next element.

**Bucket brigades.** Short connectives that smooth the seam between
paragraphs: And. So. Now. But. Look. Here's why. Truth is. Turns out.
The result? Think about it.

Without one: "Most landing pages focus on features. Benefits are what
customers care about." With one: "Most landing pages focus on features.
Here's the thing: benefits are what customers care about."

**The stutter technique.** Repeat a word from the previous sentence in
the first sentence of the next paragraph.

> "Now we're going to look at a more sophisticated technique.
>
> A technique used by professional writers, but often overlooked by
> copywriters."

"Technique" bridges the gap, which is smoother than starting cold.

**Short first sentences.** The opening sentence of any section should be
almost effortless to read. "It's simple." "Here's the problem." "This
works." Momentum builds from a standing start, so make the start easy.

**Vary paragraph length.** Uniform paragraphs read as monotone. Short.
Then a medium one that expands, adds the detail, gives the eye somewhere
to rest. Then short again. This is also what keeps
`prose/low-burstiness` quiet, since that rule measures the same thing
from the other side.

**Momentum killers:** jargon the reader must stop to decode; long
paragraphs with no break; tangents off the main thread; weak
transitions that jar; and the same sentence structure used too many
times running.

## Pain quantification

Vague problems feel overwhelming. Quantified problems feel solvable, and
a quantified problem is something the reader can weigh against a price.

Do the arithmetic in front of them:

> 4 hrs to set up emails + 6 hrs designing a landing page + 4 hrs to
> handle Stripe webhooks + 2 hrs for SEO tags + ∞ hrs overthinking...
>
> = 22+ hours of headaches.
>
> There's an easier way.

Seeing "22+ hours" is what lets a reader decide whether eliminating it
is worth $99.

The other approach is the scenario that makes them feel it: "Imagine
the scene: you and your team get an urgent email, so you rapidly reply.
But just after you hit send, your team replies as well. In the best
case, you look disorganized. In the worst case, you contradict each
other." They have been there. Now the problem is felt rather than
acknowledged.

## The "So what?" chain

The default failure of machine-written copy is stopping at the first
layer of benefit. "Saves time." "Increases productivity." "Helps you
grow." All true, all inert.

For every feature, ask "so what?" until you hit something emotional or
financial:

> **Feature:** Fast database.
> *So what?*
> **Functional:** Queries load in milliseconds.
> *So what?*
> **Financial:** Users don't bounce, revenue doesn't leak.
> *So what?*
> **Emotional:** You stop waking up stressed about churn.

The bottom of the chain is where the copy lives. Not "saves 4 hours"
but "close your laptop at 5pm instead of 9pm". Not "automates outreach"
but "wake up to replies instead of a blank inbox". Three levels down,
then write.

## Rhythm and alternation

This is where generated copy most often gives itself away. It comes out
either all choppy fragments or all flowing paragraphs. Real writing
alternates.

Short sentence. Impact. Then a longer one that breathes, adds the
context, and sounds like an actual person talking.

Two working examples of the poles. The punchy register: "Customers do
NOT buy code. Customers buy a life transformation." Declarative,
repeated structure, no ornament. The conversational register: "Once
upon a time, you had a job. You traded hours for dollars, clocked in
and out, and waited for the weekend. Your skills were confined to a
cubicle and your ambitions to an annual review and a 4% raise." Longer,
built on parallel structure.

Both work. The craft is knowing when to punch and when to breathe. The
shape to repeat: hook (short, sharp), expand (breathe, add context),
land it (a kicker that punctuates).

## The founder story

Almost every high-converting creator page carries a first-person story.
The shape is humble origins, struggle, discovery, success, offer, and
the arc underneath it is vulnerability, then credibility, then shared
journey.

When writing for a founder, get their actual story. This is not
optional decoration. On most pages it is the single highest-trust
element, and it cannot be invented on their behalf.

## Testimonials

"Great product!" carries no persuasive weight at all. Structure a
testimonial as a miniature case study: before state, action taken,
specific outcome, timeframe, emotional reaction.

- "I shipped in 6 days as a noob coder. It would have taken me months.
  I wanna cry 🥲"
- "I managed to exit and sell for 5 figures in a few weeks. Best
  investment I've made in so long."
- "We were able to buy our first business within 4 months of joining."

The specifics do all of it. "4 months" is believable. "Helped me
succeed" is not. This is also the material that answers
`format/missing-proof`, and it only counts if the quote is real.

## Disqualification

Telling some readers they are not a fit feels backwards and converts
anyway:

> You're a good fit for this if:
> ✅ You know this is a tool, and you'll need to use it
> ✅ You're willing to reassess your existing ideas
>
> You're NOT a good fit if:
> ❌ You equate success with just buying a course
> ❌ You're not willing to do the unsexy work required

It flips the frame from "please buy" to "prove you're a fit", which is
the velvet-rope effect. It also pre-filters the customers most likely
to ask for a refund.

## CTAs

Weak CTAs command an action. Strong CTAs describe what the reader gets
by taking it.

| Weak | Strong |
| --- | --- |
| "Sign Up" | "Get ShipFast" |
| "Learn More" | "See the exact template I used" |
| "Subscribe" | "Send me the first lesson free" |
| "Buy Now" | "Start building" |

Underneath the button, add friction reducers on the pattern of risk
reversal, then social proof, then speed: "$199 once. Join 2,600+
marketers. 2 minutes to install."

Note that both columns satisfy `format/missing-cta`, since the rule only
asks whether an action verb is present at all. Clearing the rule is the
floor. The right column is the job.

## Internet-native voice markers

Signals that a person wrote this rather than a marketing department:

- Revenue transparency, meaning specific numbers a corporate reviewer
  would soften
- Honest limitations, naming what the product does badly
- Strategic emoji, used sparingly and on purpose
- In-group language, the words the audience already uses with each
  other

## The full sequence

Building a complete long-form page, in order: hook (outcome headline
with a specific number or timeframe), problem (quantify the pain),
agitate (a scenario or story that makes it vivid), credibility (founder
story, authority, proof numbers), solution (what it does, framed as
transformation), proof (testimonials with specific outcomes),
objections (an FAQ or a fit/not-fit block), offer (pricing with value
justification), urgency (only where it is real), and a final CTA with
friction reducers beneath it.

## Video scripts

When the deliverable is a VSL, TSL, or video ad that hands off to an
editor, the format matters as much as the words. The editor is a
creative collaborator with judgment of their own.

**Deliver the voiceover as the primary artifact, with minimal
direction.** Editors read bracketed notes as mandatory rather than
suggestive. A script carrying [CUT TO X], [B-ROLL Y], [TRANSITION Z] on
every line reads as a contract, so instead of cutting, the editor books
a call to settle the directions first. The script that looks more
thorough is the one that delays the edit. Most editors will pick better
B-roll, transitions, music and pacing than you would have described in
brackets anyway.

**The default is voiceover only.** Plain paragraphs of what the
narrator says, broken where they should breathe. No "Hook / Problem /
Promise" headers inside the script itself; if those labels are needed
at all, they go in a one-line note at the top.

**Add a bracketed visual direction only when one of these is true:**

- A number, claim, or quote must appear on-screen for the viewer to
  register it (price, statistic, guarantee terms, URL)
- A product shot, screen recording, or specific supplied asset has to
  land at a precise moment, and the audio alone does not make that
  obvious
- A comedic or dramatic beat depends on visual timing: a punchline
  reveal, a hard cut, a freeze frame
- A piece of B-roll is non-obvious enough that the script reads
  differently with it than without it

Over-directed, which triggers a clarification meeting:

> [CUT TO: extreme close-up of clock ticking] [B-ROLL: stressed man at
> desk, papers flying] "Most people waste 4 hours every morning..."
> [TRANSITION: hard cut to bright kitchen] [B-ROLL: woman smiling,
> sipping coffee] "...but there's a faster way to start the day."

Right amount, where the editor moves immediately:

> Most people waste 4 hours every morning... but there's a faster way
> to start the day.
>
> [ON-SCREEN: "4 hours = 1,460 hours/year"]

The on-screen text earns its bracket because the number needs visual
anchoring. Imagery, mood and cuts stay the editor's call.

**Conventions:** voiceover as plain text with no surrounding quotes, and
paragraph breaks where the narrator breathes. Direction cues bracketed,
all-caps tag, one line: `[ON-SCREEN: "$47/month"]`, `[B-ROLL: founder at
whiteboard]`, `[PRODUCT SHOT]`. A cue that needs a paragraph of
explanation belongs in a conversation with the editor before they start,
somewhere other than the script.

If the user asks for a full shot list or a shooting script, that is a
different deliverable from a VSL handoff. Confirm before producing one,
because the lean voiceover-first script is usually what was wanted.

## Classic frameworks

**Eugene Schwartz: the five levels of awareness.** The headline and the
approach have to match where the reader already is.

1. *Unaware.* No knowledge that they have a problem. Lead with identity
   or emotion rather than the problem itself.
2. *Problem-aware.* They feel the problem, but do not know solutions
   exist. Name the problem vividly, then reveal that it is solvable.
3. *Solution-aware.* They know solutions exist but not yours. Show what
   makes your specific mechanism different.
4. *Product-aware.* They know your product and have not bought. Handle
   objections, add proof, create urgency.
5. *Most aware.* They want it and need a push. Lead with the deal.

The rule that falls out: the less aware they are, the longer the copy
has to be.

**Claude Hopkins, Scientific Advertising.** Advertising is salesmanship
in print, and the only purpose is to make sales. Reason-why copy does
not merely claim, it explains why the product works. Specificity creates
belief, which is why "cleans 99.6% of bacteria" beats "cleans almost all
bacteria". Test everything with coupons, codes, and splits. Headlines
do the heavy lifting.

**David Ogilvy.** On average five times as many people read the headline
as read the body copy. Write the way you talk, naturally. Tell the
truth, but make the truth fascinating. Give facts, because readers
remember facts rather than adjectives.

**Gary Halbert, The Boron Letters.** Find a starving crowd first,
because the offer matters more than the copy. Write to one person, using
"you" and "I". Tell stories instead of pitches, since stories disarm
skepticism. Read the copy aloud, and fix whatever comes out lumpy.
AIDA still holds: attention, interest, desire, action.

**John Caples, Tested Advertising Methods.** One headline can outpull
another by 19.5x on an identical product and offer. Self-interest beats
cleverness. Specifics beat generalities. Test at least five headlines,
because one will land somewhere between 2x and 10x better than the rest.

**Joseph Sugarman, the slippery slide.** Every element has one job,
which is to get the reader into the next element. Seeds of curiosity end
paragraphs by pulling forward. His list of psychological triggers runs
to 31; the heaviest are honesty, proof, specificity, familiarity, and
story. The buying environment (layout, price anchoring, logical flow, a
clear action) is part of the copy.

**Robert Collier, the six essentials of every letter.** An opening that
grabs attention. Description or explanation. An argument for buying.
Persuasion to buy now. A risk-free offer. A clear call to action. And
underneath all six, the line everything else in this skill is a
technique for: enter the conversation already taking place in the
customer's mind.

## Before you run the gate

Read it aloud, then ask:

1. Does this sound like a person talking, or like someone "writing
   copy"?
2. Would I say this to a friend?
3. Is every claim backed by a specific number or a named proof?
4. Does the rhythm alternate between punch and breath?
5. Is it about the reader's transformation, or about my product?
6. Are there open loops pulling forward, and does each one close?
7. Does the ending carry momentum into the action?

Then run the script, because that list is judgment and the script is the
gate.

## When a violation looks wrong

Direct response owns devices that resemble defects. A deliberate
fragment run trips sentence-level prose checks. A repeated opener used
as anaphora across four lines looks like the structural monotony
`prose/low-burstiness` exists to catch. A page-level rhythm built on
triplets meets `tells/rule-of-three-density`.

When a device is genuinely load-bearing and a universal rule fires on
it, that is a mismatch between the brief's register and this core's
default general-audience contract. Raise it to the user per
`hedgehog-copywriting-loop`'s rule on extending the contract. Do not
reword until the regex stops matching while the prose underneath is
unchanged, and do not treat a format module as license to relax
`tells/*` or `prose/*`, because it never does.

The error-severity format rules are a different case, and none of them
have this escape hatch. Copy with no action verb is not direct response.
Copy with no number is not making a claim anyone can check. A vague
benefit phrase is an empty slot. An unqualified claim is legal exposure.
Fix those at the root.
