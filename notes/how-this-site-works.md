---
title: How this site works
date: 2026-11-15
description: Markdown notes, one small TypeScript build script, and GitHub Pages. No framework.
---

This site is a folder of Markdown files and one small TypeScript script. No framework, no CMS, no database.

## The files

```
index.html     page shell with {{placeholders}}
index.ts       the build script
index.css      the design
notes/*.md     the notes
```

## Writing a note

Each note is a Markdown file in `notes/` with a short header:

```markdown
---
title: How this site works
date: 2026-11-15
description: One line for search engines.
---

The content, in Markdown...
```

The filename becomes the URL, so `notes/how-this-site-works.md` ends up at `/notes/how-this-site-works/`. The home page lists every note, newest first. There's no list to maintain.

## The build

`index.ts` runs in Node, not in the browser. For each note it:

1. reads the file and splits off the header with [gray-matter](https://github.com/jonschlinkert/gray-matter),
2. turns the Markdown into HTML with [marked](https://marked.js.org),
3. drops the result into `index.html` and saves it as `dist/notes/<slug>/index.html`.

Then it builds the home page, a 404 page, `sitemap.xml` and `robots.txt`.

Every note gets its own folder with an `index.html`, so the URLs are clean and the server does the routing. No client-side router, no `#` in the address.

## Why static

Visitors and search engines get finished HTML. Nothing renders in the browser, so pages load fast and Google can index them as they are. The only JavaScript on the page is a few lines for the day/night switch.

## Running it locally

`npm run dev` builds the site, serves it at `localhost:5173`, and rebuilds whenever I save a note.

## Publishing

I push to `main`. A GitHub Action installs the dependencies, runs the build, and publishes `dist/` to GitHub Pages. The built site and `node_modules` never go into git, only the source does.
