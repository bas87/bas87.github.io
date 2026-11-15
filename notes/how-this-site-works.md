---
title: How this site works
date: 2026-11-10
description: One build script turns Markdown notes into static HTML pages.
---

This site is a folder of Markdown notes and one small TypeScript build script. The script reads every note, parses its header, and writes each one out as its own static HTML page.

## Why static

Every page is real, pre-rendered HTML at a clean URL (like `/notes/how-this-site-works/`). It loads fast, ships no JavaScript, and search engines can index it directly.

## Adding a note

Drop a Markdown file in `notes/` with a header:

```markdown
---
title: My note
date: 2026-11-15
description: One line about it.
---

The content, in Markdown...
```

The filename becomes the URL. Push it, and a GitHub Action rebuilds the site. There's no list to maintain.

## Hosting

GitHub Pages serves the built site. The build output and dependencies never live in git, only the source does.
