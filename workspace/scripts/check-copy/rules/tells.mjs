// AI-tell detection: vocabulary, phrasing, and structural patterns that
// mark text as LLM-generated rather than human-written. Sourced from
// Wikipedia's "Signs of AI writing" essay (WikiProject AI Cleanup),
// conorbronsdon/avoid-ai-writing, and cross-checked against this
// project's own prior art in landing-copy's Writing standard. Custom
// regex — no library covers GPT-specific tells, unlike prose-quality's
// grammar/readability checks, which lean on retext and write-good.
//
// Frequency, not presence, is what makes text read as AI-generated: one
// em dash or one hedge in a long document is normal prose. Structural
// checks (rule-of-three, em dash, sentence-length band) are counted
// against a per-1000-word threshold rather than flagged on first
// occurrence.
//
// Severity follows from that, and it is the opposite of what it looks
// like it should be. Structural and frequency signals are errors;
// individual banned words are warnings.
//
// The reason is evasion cost. A vocabulary list is the cheapest check to
// defeat — a model told "avoid these sixty words" defeats it in one
// rewrite, without the prose getting any better. A validation sample
// written to dodge the list entirely ("Our platform brings these
// workflows together in one place") passed the gate with zero errors
// while being exactly the output this exists to catch. Meanwhile a single
// "robust" in an otherwise concrete draft failed it outright.
//
// So banned vocabulary is now advisory — real signal, worth reporting,
// but not the thing that decides. What fails a draft is shape: uniform
// sentence length, cascading triads, dashes as a structural default, and
// (in prose.mjs) abstraction density. Those are the properties a rewrite
// cannot dodge without actually changing the writing.

const BANNED_WORDS = [
  'delve', 'tapestry', 'boundaries', 'elevate', 'unleash', 'robust',
  'seamless', 'leverage', 'moreover', 'furthermore', 'crucial', 'pivotal',
  'garner', 'bolster', 'underscore', 'showcase', 'showcasing', 'foster',
  'fostering', 'enhance', 'align', 'landscape', 'intricate', 'intricacies',
  'meticulous', 'meticulously', 'testament', 'vibrant', 'interplay',
  'navigate', 'myriad', 'synergy', 'holistic', 'multifaceted', 'nuanced',
  'comprehensive', 'cutting-edge', 'transformative', 'groundbreaking',
  'innovative', 'game-changer', 'harness', 'revolutionize', 'utilize',
  'facilitate', 'empower', 'streamline', 'unlock', 'realm', 'resonate',
  'compelling', 'paramount', 'surpass', 'mosaic', 'ecosystem', 'symphony',
  'labyrinth', 'beacon', 'cornerstone', 'bedrock', 'cacophony',
  'kaleidoscope', 'odyssey', 'dynamic',
];

const BANNED_PHRASES = [
  "it's important to note that", 'it is important to note that',
  'it is worth noting that', "it's worth noting that",
  'at its core', 'when it comes to', 'in the realm of',
  'play a vital role in', 'plays a vital role in',
  'delve into the intricacies', 'in today\'s fast-paced world',
  'unlock the potential of', 'in conclusion', 'in summary',
  'to summarize', 'i hope this helps',
  'studies show', 'experts agree', 'research suggests',
  'industry reports', 'observers have cited',
  'the future looks bright', 'only time will tell',
];

// Clichés, previously covered by write-good's `no-cliches` check. That
// check caught one of seven stacked clichés in a loaded test, so the
// dependency was dropped and the phrases moved here, where the existing
// phrase list already works. Kept short and additive: a phrase earns a
// place by actually turning up in a draft, not by appearing in a list of
// clichés someone published.
const CLICHES = [
  'at the end of the day', 'think outside the box', 'hit the ground running',
  'move the needle', 'low-hanging fruit', 'circle back', 'win-win',
  'best of both worlds', 'when push comes to shove', 'the fact of the matter',
  'needle in a haystack', 'tip of the iceberg', 'level playing field',
  'take it to the next level', 'push the envelope', 'raise the bar',
];

const RULE_OF_THREE = /\b(\w+),\s+(\w+),\s+(?:and|or)\s+(\w+)\b/gi;
const TITLE_CASE_HEADER = /^#{1,6}\s+([A-Z][a-z]*(\s+[A-Z][a-z]*){2,})$/gm;
const EM_DASH = /—/g;
const NEGATION_FORMULA = /\b(?:is\s+not|isn'?t|are\s+not|aren'?t|it'?s\s+not)\s+(?:just|only)?\s*[^.;]{2,60}[.,—-]\s*(?:it'?s|they'?re)\s+/gi;
const NEGATION_CONTRAST = /\b(\w+)\s+[^.;,]{2,60},\s+(?:and\s+)?not\s+\1\s+[^.;]{2,60}/gi;
const HEDGE_STACK = /\b(could|may|might)\s+(potentially|possibly|eventually|ultimately)\b/gi;
const COPULA_AVOIDANCE = /\b(serves as|stands as|marks a|functions as|represents a)\b/gi;

function countPer1000Words(count, wordCount) {
  return wordCount === 0 ? 0 : (count / wordCount) * 1000;
}

function excerptAround(text, index, length, radius = 40) {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + length + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

export function checkTells(text, { wordCount, profile }) {
  const violations = [];

  // Vocabulary: advisory. See the severity note at the top of this file —
  // a word list is the one check a model can satisfy without writing
  // better, so it reports rather than decides.
  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, 'gi');
    let match;
    while ((match = re.exec(text)) !== null) {
      violations.push({
        rule: 'tells/banned-word',
        grain: 'sentence',
        severity: 'warning',
        message: `AI-tell word: "${match[0]}"`,
        excerpt: excerptAround(text, match.index, match[0].length),
        location: {},
      });
    }
  }

  // Phrases stay errors. Unlike single words, these are whole formulations
  // with no legitimate use in a draft — "it's important to note that" is
  // padding in every register, and removing one means rewriting the
  // sentence rather than swapping a synonym.
  for (const phrase of [...BANNED_PHRASES, ...CLICHES]) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match;
    while ((match = re.exec(text)) !== null) {
      violations.push({
        rule: 'tells/banned-phrase',
        grain: 'sentence',
        severity: 'error',
        message: `Banned AI-tell phrase: "${match[0]}"`,
        excerpt: excerptAround(text, match.index, match[0].length),
        location: {},
      });
    }
  }

  for (const [re, rule, message] of [
    [NEGATION_FORMULA, 'tells/negation-formula', 'Negation formula ("it\'s not X, it\'s Y") — state the positive claim directly'],
    [NEGATION_CONTRAST, 'tells/negation-formula', 'Negation contrast ("X because Y, not because Z") — state the positive claim directly'],
    [HEDGE_STACK, 'tells/hedge-stack', 'Stacked hedge ("could potentially", "may eventually") — pick one claim and state it'],
    [COPULA_AVOIDANCE, 'tells/copula-avoidance', 'Copula avoidance — plain "is/are" reads clearer than dressed-up substitutes'],
  ]) {
    let match;
    re.lastIndex = 0;
    while ((match = re.exec(text)) !== null) {
      violations.push({
        rule,
        grain: 'sentence',
        severity: 'error',
        message: `${message}: "${match[0]}"`,
        excerpt: excerptAround(text, match.index, match[0].length),
        location: {},
      });
    }
  }

  // Em dashes: rate is per-register. Two dashes in 173 words of essay
  // tripped the old flat threshold on prose using them for one ordinary
  // aside. The tic is dashes as a structural default, which shows at rates
  // considered use never reaches — so long-form is allowed more of them
  // than marketing copy, and the check still catches the tic in both.
  // The absolute floor exists because a per-1000-word rate is unstable on
  // short text: two dashes in a 173-word essay reads as 11.6/1000 and trips
  // any useful ceiling, while being one ordinary aside. A tic shows as
  // repeated use, so require both — enough dashes to be a habit, and a rate
  // high enough to be a default.
  const emDashCount = (text.match(EM_DASH) || []).length;
  const emDashRate = countPer1000Words(emDashCount, wordCount);
  if (emDashCount > 3 && emDashRate > profile.emDashPer1000Max) {
    violations.push({
      rule: 'tells/em-dash-density',
      grain: 'document',
      severity: 'warning',
      message: `Em dash used ${emDashCount} time(s) (${emDashRate.toFixed(1)}/1000 words, ${profile.label} ceiling ${profile.emDashPer1000Max}) — a known AI tic above light, occasional use`,
      excerpt: '',
      location: {},
    });
  }

  // Triads are the most recognizable AI sentence shape after uniform
  // length, and unlike vocabulary they cannot be dodged by substitution —
  // fixing one means restructuring the sentence. Hence an error, and hence
  // a rate rather than a count: one triad is rhetoric, four in a page is a
  // template. The floor sits above the old `> 1` so a short document with
  // two deliberate triads isn't failed for using a normal device twice.
  const ruleOfThreeCount = (text.match(RULE_OF_THREE) || []).length;
  const ruleOfThreeRate = countPer1000Words(ruleOfThreeCount, wordCount);
  if (ruleOfThreeCount > 2 && ruleOfThreeRate > 6) {
    violations.push({
      rule: 'tells/rule-of-three-density',
      grain: 'document',
      severity: 'error',
      message: `Rule-of-three cascade ("X, Y, and Z") used ${ruleOfThreeCount} times (${ruleOfThreeRate.toFixed(1)}/1000 words) — a rhythm tool used sparingly, not a default shape`,
      excerpt: '',
      location: {},
    });
  }

  const titleCaseHeaders = (text.match(TITLE_CASE_HEADER) || []).length;
  if (titleCaseHeaders > 0) {
    violations.push({
      rule: 'tells/title-case-header',
      grain: 'document',
      severity: 'warning',
      message: `${titleCaseHeaders} header(s) in Title Case — use sentence case`,
      excerpt: '',
      location: {},
    });
  }

  return violations;
}
