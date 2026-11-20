// Builds the site: notes/*.md → dist/, one static HTML page per note plus the home page.
//
//   npm run build   build once into dist/
//   npm run dev     build, rebuild on every save, serve at http://localhost:5173

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, watch, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const SITE = 'https://devzone.cz';
const DESCRIPTION = "Michal Toman's notes from building for the web in the AI era.";
const OUT = 'dist';

type Note = { slug: string; title: string; date: Date; description: string; credits: string; html: string };

// ── Pages ──────────────────────────────────────────────────────────────────

function homePage(notes: Note[]) {
  const list = notes.length
    ? `<ul class="notes">
${notes.map((n) => `  <li><time datetime="${isoDay(n.date)}">${humanDay(n.date, 'short')}</time> <a href="/notes/${n.slug}/">${esc(n.title)}</a></li>`).join('\n')}
</ul>`
    : '<p class="empty">No notes yet.</p>';

  return `<h1>devzone<small>Michal Toman</small></h1>

<div class="intro">
  <p>Hi, I'm Michal. I've been a web developer for almost twenty years.</p>
  <p>These are my notes from building stuff in the AI era. The tools keep changing, but the job's the same: solving problems.</p>
</div>

<ul class="contact">
  <li><a href="mailto:michal@devzone.cz">Email</a></li>
  <li><a href="https://www.linkedin.com/in/mtoman/">LinkedIn</a></li>
  <li><a href="https://github.com/bas87">GitHub</a></li>
</ul>

<section aria-labelledby="notes-title">
  <h2 id="notes-title">Notes</h2>
  ${list}
</section>

<footer>© ${new Date().getFullYear()} Michal Toman · Brno, Czechia</footer>`;
}

function notePage(n: Note) {
  return `<p class="crumb"><a href="/">devzone</a> · notes</p>

<article>
  <h1 class="article-title">${esc(n.title)}</h1>
  <time class="article-date" datetime="${isoDay(n.date)}">${humanDay(n.date, 'long')}</time>
  <div class="article-body">
${n.html}
  </div>
${n.credits ? `  <p class="credits">${esc(n.credits)}</p>
` : ''}</article>

<p class="back"><a href="/">← Back to notes</a></p>`;
}

// ── Build ──────────────────────────────────────────────────────────────────

function build() {
  const shell = readFileSync('index.html', 'utf8');
  const notes = readNotes();

  // Fills the {{placeholders}} in index.html in one pass, so a "{{" inside a
  // note's own content is left alone.
  const page = (path: string, title: string, description: string, content: string) => {
    const vars: Record<string, string> = { title: esc(title), description: esc(description), url: SITE + path, content };
    return shell.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match);
  };

  rmSync(OUT, { recursive: true, force: true });

  write('index.html', page('/', 'Michal Toman · devzone', DESCRIPTION, homePage(notes)));
  for (const n of notes) {
    write(`notes/${n.slug}/index.html`, page(`/notes/${n.slug}/`, `${n.title} · devzone`, n.description || DESCRIPTION, notePage(n)));
  }
  write('404.html', page('/404.html', 'Not found · devzone', DESCRIPTION, '<h1>404</h1><p>This page doesn\'t exist. <a href="/">Go home</a>.</p>'));

  // For search engines: every page, plus where to find the list.
  const urls = ['/', ...notes.map((n) => `/notes/${n.slug}/`)];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}
</urlset>
`);
  write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

  cpSync('index.css', join(OUT, 'index.css'));
  cpSync('CNAME', join(OUT, 'CNAME'));

  console.log(`built ${notes.length} notes → ${OUT}/`);
}

// Every notes/*.md becomes a note. The filename is the URL slug, the header
// (title, date, description) is parsed by gray-matter, the body by marked.
function readNotes(): Note[] {
  const notes: Note[] = [];
  for (const file of readdirSync('notes').filter((f) => f.endsWith('.md'))) {
    const { data, content } = matter(readFileSync(join('notes', file), 'utf8'));
    if (!data.title || !data.date) {
      console.warn(`skipped notes/${file}: the header needs a title and a date`);
      continue;
    }
    notes.push({
      slug: file.slice(0, -'.md'.length),
      title: String(data.title),
      date: new Date(data.date),
      description: String(data.description ?? ''),
      credits: String(data.credits ?? ''),
      html: marked.parse(content) as string,
    });
  }
  return notes.sort((a, b) => b.date.getTime() - a.date.getTime()); // newest first
}

// ── Helpers ────────────────────────────────────────────────────────────────

function write(path: string, content: string) {
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

// Dates in the header are calendar days, so format them in UTC (no timezone shift).
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const humanDay = (d: Date, month: 'short' | 'long') =>
  d.toLocaleDateString('en-US', { year: 'numeric', month, day: 'numeric', timeZone: 'UTC' });

// ── Run ────────────────────────────────────────────────────────────────────

build();

if (process.argv.includes('--dev')) {
  const rebuild = () => {
    try {
      build();
    } catch (err) {
      console.error(err);
    }
  };
  for (const path of ['notes', 'index.html', 'index.css']) watch(path, rebuild);

  // Tiny static server for dist/ that resolves /notes/x/ to /notes/x/index.html,
  // the same way GitHub Pages does.
  const types: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
  };
  createServer(async (req, res) => {
    let file = join(OUT, decodeURIComponent((req.url ?? '/').split('?')[0]));
    if (!extname(file)) file = join(file, 'index.html');
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    }
  }).listen(5173, () => console.log('dev server: http://localhost:5173'));
}
