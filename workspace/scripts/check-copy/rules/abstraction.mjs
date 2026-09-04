// Abstraction density: what fraction of a document's nouns name something
// in the world, versus something conceptual.
//
// This is the check that catches the failure mode the vocabulary rules in
// tells.mjs structurally cannot. A draft that avoids every banned word can
// still say nothing at all:
//
//   "Our platform brings these workflows together in one place. Teams that
//    adopt this approach report faster cycle times and clearer visibility."
//
// No banned word, readable Flesch, respectable grade level — and no claim a
// reader could check, disagree with, or act on. Vocabulary lists cannot see
// this, because every individual word is fine.
//
// Why this is a ratio and not a word list
// ---------------------------------------
// A per-word verdict ("`teams` is a bad word") is wrong, always: `teams` is
// exactly right in "the teams that shipped it disagreed." What separates
// prose that says something from prose that doesn't is the *proportion* of
// abstract-to-concrete nouns across a whole document. So this never accuses
// a sentence — it reports one document-grain number. Individual
// misclassifications wash out in the ratio rather than becoming a false
// accusation the writer has to argue with, which is the failure mode of
// lexical sentence-grain rules.
//
// Two independent signals, both needed
// ------------------------------------
// Measured separately on a validation set of eight samples (published prose,
// deliberately-bad human prose, and LLM output), neither signal alone
// separates good from bad — they fail on different samples:
//
//   - Morphology catches nominalized abstraction (`consideration`,
//     `alignment`, `reassessment`) but scores the empty-SaaS sample 0.857,
//     up among the good prose, because `teams`/`tools`/`data` are
//     morphologically concrete.
//   - The empty-noun list catches those, but scores Orwell's deliberately
//     abstract parody 0.895 for the mirror reason: its nouns are unusual,
//     not generic.
//
// Combined, the same set separates cleanly — good prose 0.774-1.000, bad
// prose 0.188-0.421 — with Orwell's parody landing beside the LLM output
// rather than beside Orwell's own prose in the same essay. That control is
// the reason to trust this measures abstraction rather than authorship.

import nlp from 'compromise';

// Morphology of nominalization: verbs and adjectives turned into nouns.
// Deliberately suffix-based rather than a word list — it generalizes to
// vocabulary no list anticipated ("enshittification" scores abstract
// without anyone adding it).
const ABSTRACT_SUFFIX = /(?:tion|sion|ment|ance|ence|ity|ness|ism|ship|hood|acy|ure|age)s?$/i;

// Nouns that are morphologically concrete but carry no information about
// what is actually being discussed — the vocabulary a draft reaches for
// when it has nothing specific to say. Not banned: a document scoring well
// overall can use any of these freely, because this only ever moves a
// ratio. `technical` in the validation set uses `system` and `function`
// and still scores 0.811.
const EMPTY_NOUNS = new Set([
  'thing', 'things', 'way', 'ways', 'aspect', 'aspects', 'area', 'areas',
  'factor', 'factors', 'element', 'elements', 'approach', 'approaches',
  'solution', 'solutions', 'result', 'results', 'outcome', 'outcomes',
  'opportunity', 'opportunities', 'experience', 'experiences',
  'need', 'needs', 'goal', 'goals', 'value', 'values',
  'benefit', 'benefits', 'challenge', 'challenges', 'issue', 'issues',
  'process', 'processes', 'system', 'systems', 'platform', 'platforms',
  'tool', 'tools', 'team', 'teams', 'business', 'businesses',
  'company', 'companies', 'user', 'users', 'customer', 'customers',
  'work', 'time', 'people', 'world', 'today', 'level', 'levels',
  'data', 'report', 'reports', 'stage', 'stages', 'status',
  'update', 'updates', 'picture', 'support', 'service', 'services',
  'workflow', 'workflows', 'practice', 'practices', 'range', 'ranges',
  'function', 'functions', 'behavior', 'behaviors', 'behaviour',
  'perspective', 'perspectives', 'channel', 'channels',
  'expectation', 'expectations', 'objective', 'objectives',
  'insight', 'insights', 'capability', 'capabilities', 'resource',
  'resources', 'initiative', 'initiatives', 'strategy', 'strategies',
]);

// Below this many nouns the ratio is noise: with a handful of nouns, a
// single misclassification swings the score by more than the whole good/bad
// gap. A 22-word sample inverted outright — bad prose scoring above good —
// on one misparsed term.
//
// Set by sweeping the validation set at truncated noun counts and reading
// where separation survives: the gap between the worst good sample and the
// best bad one is +0.500 at 20 nouns and +0.333 at 15, degrading below 10.
//
// Fifteen rather than twenty because the margin at this floor is not
// close. Short concrete paragraphs — a debugging note, an anecdote, a
// recipe — measured 0.923, 0.929 and 1.000 at 8-14 nouns, far above the
// 0.6 floor, while a 19-noun paragraph of deliberate abstraction sat at
// 0.421. A higher floor buys no safety and silently waves through exactly
// the short abstract paragraph worth catching.
const MIN_NOUNS = 15;

// Splits the measured gap (bad ≤ 0.421, good ≥ 0.774) nearer the bad side,
// so the check fires on prose that is clearly abstract rather than on
// prose that is merely somewhat conceptual.
const CONCRETE_FLOOR = 0.6;

// Markdown furniture would otherwise be parsed as prose. Code blocks
// especially: identifiers are not English nouns and shouldn't be counted.
function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_>]/g, '');
}

// The head of a noun phrase is what determines whether it names something
// concrete: "a comprehensive reassessment" is abstract because of
// `reassessment`, not `comprehensive`. compromise's own term list is used
// rather than string-splitting, which mangles multi-word phrases.
function nounHeads(text) {
  const heads = [];
  for (const phrase of nlp(stripMarkdown(text)).nouns().json()) {
    const terms = phrase.terms || [];
    const last = terms[terms.length - 1];
    if (!last) continue;

    // Proper nouns name something specific by definition — a person, a
    // product, a place. They are the most concrete nouns available and are
    // never counted as abstract, whatever their suffix ("Reunion",
    // "Microsoft Azure Machine Learning").
    const tags = last.tags || [];
    if (tags.includes('ProperNoun')) {
      heads.push({ word: (last.normal || last.text || '').toLowerCase(), proper: true });
      continue;
    }

    const word = (last.normal || last.text || '').replace(/[^a-z-]/gi, '').toLowerCase();
    if (word) heads.push({ word, proper: false });
  }
  return heads;
}

export function checkAbstraction(text) {
  const heads = nounHeads(text);
  const nounCount = heads.length;

  if (nounCount < MIN_NOUNS) {
    return {
      violations: [],
      metrics: { nounCount, concreteNounShare: null },
    };
  }

  let abstract = 0;
  for (const { word, proper } of heads) {
    if (proper) continue;
    if (ABSTRACT_SUFFIX.test(word) || EMPTY_NOUNS.has(word)) abstract++;
  }

  const concreteNounShare = 1 - abstract / nounCount;
  const violations = [];

  if (concreteNounShare < CONCRETE_FLOOR) {
    violations.push({
      rule: 'prose/abstraction-density',
      grain: 'document',
      severity: 'error',
      message:
        `Only ${(concreteNounShare * 100).toFixed(0)}% of nouns name something concrete ` +
        `(floor ${CONCRETE_FLOOR * 100}%) — the draft is written in abstractions. ` +
        `Name the actual thing: who does what, to what, with what result`,
      excerpt: '',
      location: {},
    });
  }

  return {
    violations,
    metrics: { nounCount, concreteNounShare },
  };
}
