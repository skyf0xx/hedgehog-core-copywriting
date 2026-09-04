// Format contract for a single post on X. What the universal rules can't
// see: the 280-character limit the platform actually enforces, and the
// engagement patterns that suppress reach rather than earn it.
//
// Length is an error because the platform rejects or truncates past it,
// which is a defect no amount of good writing survives. The rest are the
// shapes that mark a post as manufactured: hashtag piles, "RT if you
// agree", a bare link in the body that costs the post reach.

import {
  stripMarkdown, excerptAround, violation, tweetLength,
} from './shared.mjs';

const STANDARD_LIMIT = 280;
const PREMIUM_LIMIT = 25000;

const ENGAGEMENT_BAIT = [
  [/\bRT\s+if\s+you\b/gi, '"RT if you…"'],
  [/\bretweet\s+if\s+you\b/gi, '"retweet if you…"'],
  [/\breply\s+(?:with\s+)?["']?(?:yes|yep|interested|me)["']?\b/gi, '"reply YES"'],
  [/\blike\s+(?:this\s+)?if\s+you\b/gi, '"like if you…"'],
  [/\bfollow\s+(?:me\s+)?for\s+more\b/gi, '"follow me for more"'],
  [/\bcomment\s+["']?\w+["']?\s+(?:below\s+)?(?:and|to get|for)\b/gi, '"comment X and I\'ll send…"'],
  [/\btag\s+(?:someone|a friend)\b/gi, '"tag a friend"'],
  [/\bdrop\s+a\s+["']?\w+["']?\s+(?:below|if)\b/gi, '"drop a X below"'],
];

export function checkTweet(text, { premium = false } = {}) {
  const violations = [];
  const body = stripMarkdown(text);
  const limit = premium ? PREMIUM_LIMIT : STANDARD_LIMIT;
  const length = tweetLength(body);

  if (length > limit) {
    violations.push(violation({
      rule: 'format/tweet-length',
      severity: 'error',
      message: `Post is ${length} characters against a ${limit} limit${premium ? ' (Premium)' : ''} — tighten it or split it into a thread, never ship a thought the platform will truncate`,
    }));
  }

  const hashtags = body.match(/(?:^|\s)#[a-z0-9_]+/gi) || [];
  if (hashtags.length > 1) {
    violations.push(violation({
      rule: 'format/hashtag-count',
      severity: 'error',
      message: `${hashtags.length} hashtags (${hashtags.map((h) => h.trim()).join(' ')}) — one at most; a stack reads as reach-chasing and X ranks it down`,
    }));
  }

  for (const [re, label] of ENGAGEMENT_BAIT) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(body)) !== null) {
      violations.push(violation({
        rule: 'format/engagement-bait',
        grain: 'sentence',
        severity: 'error',
        message: `Engagement bait (${label}) — X demotes it, and it asks for a reaction instead of earning one`,
        excerpt: excerptAround(body, match.index, match[0].length),
      }));
    }
  }

  // A link in the body costs reach on X. The convention is to put it in a
  // reply, so this is a warning rather than an error: some posts genuinely
  // are the link, and that's the author's call to make.
  const links = body.match(/https?:\/\/\S+/g) || [];
  if (links.length > 0) {
    violations.push(violation({
      rule: 'format/body-link',
      severity: 'warning',
      message: `External link in the post body (${links[0]}) — X suppresses reach on posts that send people off-platform; put it in a reply instead`,
    }));
  }

  // The first line does the whole job on X, which has no "see more" fold
  // on a single post. An opener that only makes sense once you've read
  // line two has already lost the scroll.
  const firstLine = body.split('\n').map((l) => l.trim()).filter(Boolean)[0] || '';
  if (firstLine && tweetLength(firstLine) > 120 && body.includes('\n')) {
    violations.push(violation({
      rule: 'format/weak-hook',
      severity: 'warning',
      message: `First line runs ${tweetLength(firstLine)} characters before the first break — the opener carries the whole post on X, so front-load the claim`,
      excerpt: firstLine.slice(0, 80),
    }));
  }

  if (/^[A-Z][A-Z\s!?.,'"-]{14,}$/m.test(firstLine)) {
    violations.push(violation({
      rule: 'format/all-caps-hook',
      severity: 'error',
      message: 'All-caps opening line — carry intensity with word choice, not shouting',
      excerpt: firstLine.slice(0, 80),
    }));
  }

  // "Unpopular opinion:" on a take nobody disputes is the tell that the
  // contrarian frame is decoration rather than a real position.
  if (/\bunpopular opinion\b/i.test(body) && !/\b(?:but|however|most people|everyone)\b/i.test(body)) {
    violations.push(violation({
      rule: 'format/false-contrarian',
      severity: 'warning',
      message: '"Unpopular opinion:" without a stated opposing view — either name what the popular position actually is, or drop the frame',
    }));
  }

  return violations;
}
