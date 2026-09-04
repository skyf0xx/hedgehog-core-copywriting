// Format contract for a Meta (Facebook + Instagram) ad. Three fields
// with hard platform limits, a compliance surface that can cost an ad
// account, and one structural fact that decides whether the ad works at
// all: the first 125 characters of primary text are the whole ad for
// most impressions, because everything after them sits behind "See more".
//
// Limits come from Meta's published field specs. The visible thresholds
// (125 primary, 27 headline) are warnings because they are display
// truncation the writer may accept; the hard maximums (2200, 40, 30) are
// errors because the platform rejects past them.
//
// A draft is expected to name its fields as markdown sections
// ("## Headline", "## Primary text", "## Description"). A draft with no
// sections at all is read as primary text alone, so a one-field
// brainstorm still gets checked rather than silently passing.

import {
  parseSections, findSection, stripMarkdown, excerptAround, violation,
  checkUnqualifiedClaims,
} from './shared.mjs';

const PRIMARY_VISIBLE = 125;
const PRIMARY_MAX = 2200;
const HEADLINE_VISIBLE = 27;
const HEADLINE_MAX = 40;
const DESCRIPTION_MAX = 30;

const WEAK_HEADLINES = [
  'learn more', 'click here', 'check this out', 'find out more',
  'read more', 'see more', 'shop now', 'sign up', 'get started',
  'discover more', 'act now',
];

export function checkAd(text) {
  const violations = [];
  const sections = parseSections(text);

  const primary = findSection(sections, ['primary text', 'primary', 'body', 'ad copy']);
  const headline = findSection(sections, ['headline', 'title']);
  const description = findSection(sections, ['description', 'link description']);

  // No named fields: treat the whole draft as primary text rather than
  // skipping the format check entirely.
  const primaryBody = primary ? stripMarkdown(primary.body) : (sections.size === 0 ? stripMarkdown(text) : '');

  if (!primary && sections.size > 0) {
    violations.push(violation({
      rule: 'format/missing-field',
      severity: 'error',
      message: 'No primary text field — a Meta ad needs "## Primary text"; it is the field that carries the sell',
    }));
  }

  if (primaryBody) {
    if (primaryBody.length > PRIMARY_MAX) {
      violations.push(violation({
        rule: 'format/primary-text-length',
        severity: 'error',
        message: `Primary text is ${primaryBody.length} characters against Meta's ${PRIMARY_MAX} maximum — the platform will reject it`,
      }));
    }

    const hook = primaryBody.slice(0, PRIMARY_VISIBLE);
    if (primaryBody.length > PRIMARY_VISIBLE) {
      // The fold only matters if the visible part fails to earn the click.
      // A hook that ends mid-sentence with no open loop is the failure:
      // the reader sees a truncated fragment and scrolls past.
      const endsCleanly = /[.!?:]\s*$/.test(hook.trim()) || /\n/.test(hook);
      if (!endsCleanly) {
        violations.push(violation({
          rule: 'format/weak-hook',
          severity: 'warning',
          message: `Primary text runs past the ${PRIMARY_VISIBLE}-character "See more" fold mid-thought — the first ${PRIMARY_VISIBLE} characters are the whole ad for most impressions, so land a complete hook or an open loop before the cut`,
          excerpt: `${hook}…`,
        }));
      }
    }

    // The reader has to be told what to do. An ad with no imperative and
    // no offer is a post, not an ad.
    const hasCta = /\b(?:click|tap|get|grab|start|try|book|claim|download|watch|see|join|order|shop|learn)\b/i.test(primaryBody)
      || (description && /\b(?:free|no credit card|instant)\b/i.test(description.body));
    if (!hasCta) {
      violations.push(violation({
        rule: 'format/missing-cta',
        severity: 'error',
        message: 'No call to action in the primary text — name the next step the reader takes',
      }));
    }
  }

  if (headline) {
    const body = stripMarkdown(headline.body) || headline.body.trim();
    if (body.length > HEADLINE_MAX) {
      violations.push(violation({
        rule: 'format/headline-length',
        severity: 'error',
        message: `Headline is ${body.length} characters against Meta's ${HEADLINE_MAX} maximum — the platform will reject it`,
        excerpt: body,
      }));
    } else if (body.length > HEADLINE_VISIBLE) {
      violations.push(violation({
        rule: 'format/headline-length',
        severity: 'warning',
        message: `Headline is ${body.length} characters; mobile truncates around ${HEADLINE_VISIBLE} — the tail will not be read`,
        excerpt: body,
      }));
    }

    const normalized = body.toLowerCase().replace(/[^a-z ]/g, '').trim();
    if (WEAK_HEADLINES.includes(normalized)) {
      violations.push(violation({
        rule: 'format/weak-headline',
        severity: 'error',
        message: `Headline "${body}" is a button label, not a headline — it should be a second hook carrying a specific benefit`,
        excerpt: body,
      }));
    }
  }

  if (description) {
    const body = stripMarkdown(description.body) || description.body.trim();
    if (body.length > DESCRIPTION_MAX) {
      violations.push(violation({
        rule: 'format/description-length',
        severity: 'error',
        message: `Description is ${body.length} characters against Meta's ${DESCRIPTION_MAX} maximum — the platform will reject it`,
        excerpt: body,
      }));
    }
  }

  violations.push(...checkUnqualifiedClaims(text, 'format/unqualified-claim'));

  // Proof is what separates an ad that converts from a list of adjectives.
  // A number, a named person, or a timeframe all count.
  const hasProof = /\d/.test(primaryBody) || /\b(?:said|says|told|according to)\b/i.test(primaryBody);
  if (primaryBody.length > 200 && !hasProof) {
    violations.push(violation({
      rule: 'format/missing-proof',
      severity: 'warning',
      message: 'No number, named source, or timeframe anywhere in the primary text — a claim with no proof reads as an assertion',
    }));
  }

  return violations;
}
