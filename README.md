# Copywriting for Hedgehog

AI writing tools grade their own homework. This one doesn't.

Ask for an article, email, or landing page. It drafts the copy, runs it through a quality gate, and hands you a clean file.

## Get started

```
npx @skyf0xx/hedgehog init --copywriting
```

Answer a short set of questions, and the finished piece lands in your current folder with nothing else left behind.

## How it works

```
ask -> draft -> gate check -> clean file
```

The gate checks:

- **AI-sounding language.** Tell-tale phrases, hedge stacks, patterns that read as machine-written.
- **Clean prose.** Readability, sentence variety, passive voice.

A draft that fails gets revised and checked again, every time.

## Why it's different

The checks are code. A script runs on every draft and decides pass or fail, so the model that wrote the piece never grades its own work.

That's why a piece that passes here reads clean by an outside measure instead of the writer's own opinion.

---

Technical details: [ARCHITECTURE.md](ARCHITECTURE.md)
