# devzone

Michal Toman's personal site and notes, at [devzone.cz](https://devzone.cz).

A folder of Markdown notes and one TypeScript build script. `index.ts` reads
every note, parses its header, and writes a static HTML page for it. No
framework, no client-side JavaScript, clean URLs.

## Files

```
index.html     page shell (head, SEO meta), index.ts fills its {{placeholders}}
index.ts       the build: notes/*.md → dist/
index.css      the design
notes/*.md     the notes (header + Markdown)
CNAME          the custom domain
```

Not in git: `dist/` (the built site) and `node_modules/`.

## Add a note

Create `notes/<slug>.md`:

```markdown
---
title: My note title
date: 2026-11-15
description: One line, used for SEO.
---

The content, in Markdown...
```

It's published at `/notes/<slug>/` and listed on the home page, newest first.

## Run it locally

```bash
npm install
```

```bash
npm run dev
```

Builds the site, rebuilds on save, and serves it at http://localhost:5173.
`npm run build` builds once into `dist/`.

## Deploy

Push to `main`. The GitHub Action runs `npm run build` and publishes `dist/`.

One-time setup: GitHub → Settings → Pages → Build and deployment → Source →
**GitHub Actions**.
