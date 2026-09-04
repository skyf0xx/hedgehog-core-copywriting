// Format contract for long-form direct response: sales pages, VSL and
// email copy, anything whose job is a measurable action from the reader.
//
// This format is the loosest of the four, because the tradition it comes
// from is deliberately varied in shape. What it is not loose about is the
// two things every piece of direct response has to do: make a specific
// claim, and ask for the action. Everything else here is a warning.
//
// Two rules run against the universal contract rather than beside it.
// Direct response legitimately uses short punchy fragments and repeated
// openers as rhythm, so this module never relaxes tells/prose, but it
// does add the checks those rules cannot make: whether the copy is
// concrete, and whether it closes.

import {
  stripMarkdown, excerptAround, violation, checkUnqualifiedClaims,
} from './shared.mjs';

const CTA_PATTERN = /\b(?:click|tap|call|order|buy|get|grab|start|try|book|claim|download|join|subscribe|reply|register|reserve)\b/i;

const VAGUE_BENEFITS = [
  [/\btake\s+(?:your|it)\s+\w+\s+to\s+the\s+next\s+level\b/gi, '"take it to the next level"'],
  [/\bunlock\s+your\s+(?:full\s+)?potential\b/gi, '"unlock your potential"'],
  [/\bbest[- ]in[- ]class\b/gi, '"best-in-class"'],
  [/\bworld[- ]class\b/gi, '"world-class"'],
  [/\bstate[- ]of[- ]the[- ]art\b/gi, '"state-of-the-art"'],
  [/\bindustry[- ]leading\b/gi, '"industry-leading"'],
  [/\bof\s+all\s+sizes\b/gi, '"businesses of all sizes"'],
  [/\bachieve\s+(?:your|their)\s+goals\b/gi, '"achieve your goals"'],
  [/\breach\s+new\s+heights\b/gi, '"reach new heights"'],
];

export function checkDirectResponse(text) {
  const violations = [];
  const body = stripMarkdown(text);
  const words = body.split(/\s+/).filter(Boolean);

  if (!CTA_PATTERN.test(body)) {
    violations.push(violation({
      rule: 'format/missing-cta',
      severity: 'error',
      message: 'No call to action — direct response is defined by asking for a specific action; name it',
    }));
  }

  // Specificity is the whole discipline. Copy with no numbers anywhere is
  // making claims it never grounds.
  const numbers = body.match(/\b\d[\d,.]*\b/g) || [];
  if (words.length > 100 && numbers.length === 0) {
    violations.push(violation({
      rule: 'format/missing-specificity',
      severity: 'error',
      message: 'No specific number anywhere in the copy — a price, a timeframe, a result, a count; unquantified claims are the difference between copy that converts and copy that exists',
    }));
  }

  for (const [re, label] of VAGUE_BENEFITS) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(body)) !== null) {
      violations.push(violation({
        rule: 'format/vague-benefit',
        grain: 'sentence',
        severity: 'error',
        message: `Vague benefit claim (${label}) — replace it with the concrete outcome and the number behind it`,
        excerpt: excerptAround(body, match.index, match[0].length),
      }));
    }
  }

  // Proof carries the sale. A named source or a quoted result is what
  // makes the specific claim believable rather than merely stated.
  const hasProof = /\b(?:said|says|told|according to|study|survey|customers?|clients?|users?)\b/i.test(body)
    || /["“][^"”]{20,}["”]/.test(body);
  if (words.length > 150 && !hasProof) {
    violations.push(violation({
      rule: 'format/missing-proof',
      severity: 'warning',
      message: 'No testimonial, named source, or cited result — long-form copy needs proof carrying the middle, not just assertion',
    }));
  }

  violations.push(...checkUnqualifiedClaims(text, 'format/unqualified-claim'));

  return violations;
}
