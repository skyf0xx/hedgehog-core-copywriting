# Copywriting for Hedgehog

AI writing tools grade their own homework. This one doesn't.

Ask for an article, a Meta ad, a landing page, a sales page, or a post for X. It drafts the copy, runs it through a quality gate, and hands you a clean file.

## Get started

```
npx @skyf0xx/hedgehog init --copywriting
```

Answer a short set of questions, and the finished piece lands in your current folder with nothing else left behind.

## How it works

```
ask -> draft -> gate check -> clean file
```

The gate checks every draft for:

- **AI-sounding language.** Tell-tale phrases, hedge stacks, patterns that read as machine-written.
- **Clean prose.** Readability, sentence variety, passive voice.

And it checks the rules of the place the copy is going:

| Writing a... | It also checks |
| --- | --- |
| Meta ad | Character limits per field, a real call to action, and claims that get an ad account suspended |
| Landing page | A headline and a call to action, proof, and paragraphs short enough to read on a phone |
| Sales page or email | A call to action, at least one specific number, and no filler benefit claims |
| Post for X | The 280-character limit counted the way X counts it, hashtags, and engagement bait |

A draft that fails gets revised and checked again, every time.

## Why it's different

The checks are code. A script runs on every draft and decides pass or fail, so the model that wrote the piece never grades its own work.

That's why a piece that passes here reads clean by an outside measure instead of the writer's own opinion.

It also catches what reading alone misses. A post can be well written and still be 60% over the character limit. An ad can be well written and still promise something that gets the account banned. Those are the failures a script sees and a careful reader does not.

---

Technical details: [ARCHITECTURE.md](ARCHITECTURE.md)
