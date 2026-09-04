// Format contract for a short-form landing page: a bridge or pre-sell
// page that sits between an ad and the offer it warms traffic for. Its
// whole job is the click through, so what this module checks is whether
// the page is built to produce one.
//
// The structural spine is the three-paragraph framework the direct
// response tradition converged on: discovery (authority and root cause),
// proof (results), and a call to action. A page missing the CTA is not a
// weak landing page, it is not a landing page at all, so that one is an
// error. Mobile carries most traffic, which makes wall-of-text paragraphs
// a real defect rather than a taste preference.

import {
  stripMarkdown, excerptAround, violation, checkUnqualifiedClaims,
} from './shared.mjs';

const MAX_PARAGRAPH_WORDS = 60;
const MAX_WORDS = 500;

const CTA_PATTERN = /\b(?:click|tap|watch|get|grab|start|try|book|claim|download|join|order|continue|see how|find out)\b/i;

export function checkLandingPage(text) {
  const violations = [];
  const body = stripMarkdown(text);
  const words = body.split(/\s+/).filter(Boolean);

  // A bridge page that runs long has stopped being a bridge page. The
  // reader came from an ad and is deciding in seconds.
  if (words.length > MAX_WORDS) {
    violations.push(violation({
      rule: 'format/page-length',
      severity: 'warning',
      message: `${words.length} words — a bridge page earns the click in roughly ${MAX_WORDS} or fewer; past that it is a sales page and should be briefed as one`,
    }));
  }

  const headlineMatch = text.match(/^#\s+(.+)$/m);
  if (!headlineMatch) {
    violations.push(violation({
      rule: 'format/missing-headline',
      severity: 'error',
      message: 'No headline — a landing page opens with one "# " headline carrying the promise',
    }));
  } else if (headlineMatch[1].trim().length > 90) {
    violations.push(violation({
      rule: 'format/headline-length',
      severity: 'warning',
      message: `Headline runs ${headlineMatch[1].trim().length} characters — a headline that wraps to three lines on mobile loses the scroll`,
      excerpt: headlineMatch[1].trim(),
    }));
  }

  // The CTA is the entire point of the page.
  if (!CTA_PATTERN.test(body)) {
    violations.push(violation({
      rule: 'format/missing-cta',
      severity: 'error',
      message: 'No call to action — a bridge page exists to produce a click; name the action and where it leads',
    }));
  }

  // Proof carries the middle of the page. Without a number, a named
  // person, or a timeframe, the page is asking for trust it has not earned.
  const hasProof = /\d/.test(body) || /\b(?:said|says|told|according to)\b/i.test(body);
  if (!hasProof) {
    violations.push(violation({
      rule: 'format/missing-proof',
      severity: 'warning',
      message: 'No number, named source, or timeframe on the page — the proof paragraph is what makes the promise credible',
    }));
  }

  // Mobile is the primary context. A 60+ word paragraph is a grey slab on
  // a phone and gets skipped whatever it says.
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  for (const paragraph of paragraphs) {
    if (paragraph.startsWith('#') || paragraph.startsWith('|')) continue;
    const count = paragraph.split(/\s+/).filter(Boolean).length;
    if (count > MAX_PARAGRAPH_WORDS) {
      const index = body.indexOf(paragraph);
      violations.push(violation({
        rule: 'format/wall-of-text',
        grain: 'paragraph',
        severity: 'warning',
        message: `Paragraph runs ${count} words; over ${MAX_PARAGRAPH_WORDS} reads as a grey slab on mobile, where most of this traffic lands — break it up`,
        excerpt: excerptAround(body, index, Math.min(paragraph.length, 60)),
      }));
    }
  }

  violations.push(...checkUnqualifiedClaims(text, 'format/unqualified-claim'));

  return violations;
}
