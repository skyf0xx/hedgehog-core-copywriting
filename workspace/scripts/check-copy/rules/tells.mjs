// AI-tell detection: vocabulary, phrasing, and structural patterns that
// mark text as LLM-generated rather than human-written. Sourced from
// Wikipedia's "Signs of AI writing" essay (WikiProject AI Cleanup),
// conorbronsdon/avoid-ai-writing, and cross-checked against this
// project's own prior art in landing-copy's Writing standard. Custom
// regex — no library covers GPT-specific tells, unlike prose-quality's
// grammar/readability checks, which lean on retext and write-good.
//
// Frequency, not presence, is what makes most of these read as
// AI-generated: one hedge stack or rule-of-three in a long document is
// normal prose, so those structural checks count against a per-1000-word
// threshold rather than flag on first occurrence. Vocabulary/phrase
// checks and the em dash are the exception — flagged on every occurrence,
// since a banned word (and, per this project's own house style, the em
// dash itself) has no legitimate frequency floor to allow for.

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

const RULE_OF_THREE = /\b(\w+),\s+(\w+),\s+(?:and|or)\s+(\w+)\b/gi;
const TITLE_CASE_HEADER = /^#{1,6}\s+([A-Z][a-z]*(\s+[A-Z][a-z]*){2,})$/gm;
const EM_DASH = /—/g;
const NEGATION_FORMULA = /\b(?:is|are|it'?s)\s+not\s+(?:just|only)\s+[^.;]{2,60}[,—-]\s*(?:it'?s|they'?re)\s+/gi;
const NEGATION_CONTRAST = /\b(\w+)\s+[^.;,]{2,60},\s+(?:and\s+)?not\s+\1\s+[^.;]{2,60}/gi;
// Bare "[clause], not [phrase]." / "[clause] — not [phrase]." — the same
// negation-as-emphasis move as NEGATION_FORMULA/NEGATION_CONTRAST, but
// without a repeated word or a second copula holding it together. Requires
// the negated phrase to run to the sentence-final period, since that's
// what marks it as the emphatic last word rather than a clause that keeps
// qualifying itself further ("..., not shorts, unless it rains" reads as
// ordinary contrast, not the AI tell). This still risks flagging genuine
// human contrastive sentences that happen to end there — precision over
// recall, revisit if it over-fires in practice.
const NEGATION_TRAILING = /[,—.]\s*[Nn]ot\s+(?:the|a|an|just|only)\s+[^.;]{2,60}\./g;
// A short (<=6 word) sentence, standalone after a `. `/`\n`, that restates
// or emphasizes the prior claim rather than adding new information —
// "Nothing else is left behind.", "Every time, not once." The AI tell is
// the terse fragment-as-emphasis shape, not short sentences generally, so
// this only matches sentences built from absolute/emphasis vocabulary.
const EMPHATIC_FRAGMENT = /(?:^|[.!?]\s+)((?:Nothing|Every time|Not once|Always|Never|Only|Just|Every single time)\b[^.!?]{0,40}[.!?])/g;
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

export function checkTells(text, { wordCount }) {
  const violations = [];

  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, 'gi');
    let match;
    while ((match = re.exec(text)) !== null) {
      violations.push({
        rule: 'tells/banned-word',
        grain: 'sentence',
        severity: 'error',
        message: `Banned AI-tell word: "${match[0]}"`,
        excerpt: excerptAround(text, match.index, match[0].length),
        location: {},
      });
    }
  }

  for (const phrase of BANNED_PHRASES) {
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
    [NEGATION_TRAILING, 'tells/negation-formula', 'Trailing negation ("X — not Y.") used for emphasis — state the positive claim directly'],
    [EMPHATIC_FRAGMENT, 'tells/emphatic-fragment', 'Short standalone fragment restating the prior claim for emphasis — cut it or fold it into the sentence before it'],
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

  // Zero-tolerance: humans reaching for a dash in running prose almost
  // always reach for a hyphen or comma, not an em dash — the character
  // itself is a tell regardless of frequency, so every occurrence flags.
  let emDashMatch;
  EM_DASH.lastIndex = 0;
  while ((emDashMatch = EM_DASH.exec(text)) !== null) {
    violations.push({
      rule: 'tells/em-dash',
      grain: 'sentence',
      severity: 'error',
      message: 'Em dash — a known AI tic; use a comma, period, or parentheses instead',
      excerpt: excerptAround(text, emDashMatch.index, emDashMatch[0].length),
      location: {},
    });
  }

  const ruleOfThreeCount = (text.match(RULE_OF_THREE) || []).length;
  if (ruleOfThreeCount > 1) {
    violations.push({
      rule: 'tells/rule-of-three-density',
      grain: 'document',
      severity: 'warning',
      message: `Rule-of-three cascade ("X, Y, and Z") used ${ruleOfThreeCount} times — a rhythm tool used sparingly, not a default shape`,
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
