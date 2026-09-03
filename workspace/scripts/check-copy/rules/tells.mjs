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
// occurrence; vocabulary/phrase checks flag every occurrence since a
// banned word has no legitimate frequency floor to allow for.

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

  const emDashCount = (text.match(EM_DASH) || []).length;
  const emDashRate = countPer1000Words(emDashCount, wordCount);
  if (emDashRate > 2) {
    violations.push({
      rule: 'tells/em-dash-density',
      grain: 'document',
      severity: 'warning',
      message: `Em dash used ${emDashCount} time(s) (${emDashRate.toFixed(1)}/1000 words) — a known AI tic above light, occasional use`,
      excerpt: '',
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
