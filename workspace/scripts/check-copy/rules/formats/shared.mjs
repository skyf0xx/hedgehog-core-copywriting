// Helpers shared by every format module. Format rules differ from
// tells/prose in what they judge: not whether the writing is good, but
// whether it obeys the medium it ships into. A character limit a platform
// enforces, a structural slot the format is defined by, a claim an ad
// network bans. A tweet 60% over the limit and an ad headline double
// Meta's cap are both defects no prose rule can see, because nothing
// about the sentences themselves is wrong.
//
// The universal contracts (tells, prose) always run. A format module only
// ever adds to them, and never relaxes one: no copy type is licensed to
// sound more like an LLM because of where it ships.

// Markdown section headers split a draft into the format's named fields
// ("## Headline", "## Primary text"). Formats that are a single block of
// text (a tweet) ignore this; formats assembled from separate platform
// fields (an ad) are checked field by field.
export function parseSections(text) {
  const sections = new Map();
  const re = /^#{1,6}\s+(.+?)\s*$/gm;
  const marks = [];
  let match;
  while ((match = re.exec(text)) !== null) {
    marks.push({ title: match[1].trim(), start: match.index, bodyStart: re.lastIndex });
  }
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].start : text.length;
    const key = normalizeKey(marks[i].title);
    const body = text.slice(marks[i].bodyStart, end).trim();
    if (!sections.has(key)) sections.set(key, { title: marks[i].title, body });
  }
  return sections;
}

export function normalizeKey(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Looks up a section by any of several accepted aliases, so a draft that
// says "## CTA" and one that says "## Call to action" both resolve.
export function findSection(sections, aliases) {
  for (const alias of aliases) {
    const hit = sections.get(normalizeKey(alias));
    if (hit) return hit;
  }
  return null;
}

// Body text with markdown syntax removed: what a reader actually sees,
// which is what a platform character limit applies to.
export function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim();
}

export function excerptAround(text, index, length, radius = 40) {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + length + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

export function violation({ rule, severity, message, excerpt = '', grain = 'document' }) {
  return { rule, grain, severity, message, excerpt, location: {} };
}

// X counts a URL as a fixed 23 characters however long it really is, and
// most emoji as 2. Counting raw string length would let a draft with
// three long links pass at 279 here and get rejected by the platform at
// post time, which is the failure this rule exists to prevent.
export function tweetLength(text) {
  const withUrls = text.replace(/https?:\/\/\S+/g, ' '.repeat(23));
  let total = 0;
  for (const ch of withUrls) total += isWideChar(ch) ? 2 : 1;
  return total;
}

function isWideChar(ch) {
  const cp = ch.codePointAt(0);
  if (cp < 0x1100) return false;
  return cp <= 0x115f
    || (cp >= 0x2e80 && cp <= 0xa4cf)
    || (cp >= 0xac00 && cp <= 0xd7a3)
    || (cp >= 0xf900 && cp <= 0xfaff)
    || (cp >= 0xfe30 && cp <= 0xfe6f)
    || (cp >= 0xff00 && cp <= 0xff60)
    || (cp >= 0x1f000 && cp <= 0x1faff)
    || (cp >= 0x2600 && cp <= 0x27bf);
}

// Claims an ad network can suspend an account over: guaranteed outcomes,
// risk-free promises, and income or health results presented as typical.
// Checked on ad and direct-response copy, where the legal exposure is
// real, rather than globally: the same sentence in an essay about
// advertising is reporting a claim, not making one.
export const UNQUALIFIED_CLAIMS = [
  [/\bguarantee(?:d|s)?\s+(?:you'?ll|you\s+will|to)\b/gi, 'guaranteed outcome'],
  [/\b(?:100%|completely|totally)\s+(?:risk[- ]free|guaranteed)\b/gi, 'absolute risk-free promise'],
  [/\bzero\s+risk\b/gi, 'zero-risk promise'],
  [/\bresults?\s+(?:are|is)\s+typical\b/gi, 'results presented as typical'],
  [/\bmake\s+money\s+fast\b/gi, 'fast-money claim'],
  [/\bget\s+rich\s+quick\b/gi, 'get-rich-quick claim'],
  [/\bno\s+(?:effort|work)\s+(?:required|needed)\b/gi, 'effortless-outcome claim'],
  [/\bcures?\s+(?:your|his|her|their|any|all)\b/gi, 'cure claim'],
  [/\blose\s+\d+\s*(?:lbs?|pounds|kg|kilos)\b/gi, 'specific weight-loss claim'],
];

export function checkUnqualifiedClaims(text, ruleName) {
  const violations = [];
  for (const [re, label] of UNQUALIFIED_CLAIMS) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
      violations.push(violation({
        rule: ruleName,
        grain: 'sentence',
        severity: 'error',
        message: `Unqualified ${label} ("${match[0].trim()}") — ad networks suspend accounts over this; qualify it or cut it`,
        excerpt: excerptAround(text, match.index, match[0].length),
      }));
    }
  }
  return violations;
}
