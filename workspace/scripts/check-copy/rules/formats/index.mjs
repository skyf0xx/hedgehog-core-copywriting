// The format registry. `--format <name>` selects one of these; the
// universal tells/prose contracts run regardless, and a format module
// only ever adds rules on top of them.
//
// `prose` is the default and deliberately empty: a plain article, essay,
// or piece of documentation has no medium constraint beyond the universal
// contract, which is exactly the behaviour this core shipped with before
// formats existed.

import { checkAd } from './ad.mjs';
import { checkLandingPage } from './landing-page.mjs';
import { checkDirectResponse } from './direct-response.mjs';
import { checkTweet } from './tweet.mjs';

export const FORMATS = {
  prose: { label: 'general prose', check: () => [] },
  ad: { label: 'Meta ad copy', check: checkAd },
  'landing-page': { label: 'short-form landing page', check: checkLandingPage },
  'direct-response': { label: 'long-form direct response', check: checkDirectResponse },
  tweet: { label: 'single post on X', check: checkTweet },
};

export const FORMAT_NAMES = Object.keys(FORMATS);

export function checkFormat(text, format, options = {}) {
  const entry = FORMATS[format];
  if (!entry) {
    throw new Error(`unknown format "${format}" — expected one of: ${FORMAT_NAMES.join(', ')}`);
  }
  return entry.check(text, options);
}
