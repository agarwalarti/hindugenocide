# The Record — static site starter

A small, plugin-free static site to replace the WordPress build. Everything
is plain HTML, CSS and JS — no build step, no database, no admin panel to
keep patched.

## What's in here

```
index.html              Homepage: hero, stat counters, interactive
                         filterable timeline, and a chart visualisation
category-template.html  Template for category/index pages (Islamic Jihad,
                         Christian Conversion, Cultural Genocide, etc.)
article-template.html   Template for a single long-form incident page
partials/header.html    Shared navigation — edit ONCE, every page updates
partials/footer.html    Shared footer — same idea
css/style.css           The whole design system (colours, type, components)
js/main.js              Nav toggle, active-page highlighting
js/partials.js          Loads header/footer into every page
js/timeline.js          Loads data/timeline-data.json, renders the
                         homepage timeline, filters, counters and chart
data/timeline-data.json Sample timeline entries — replace with the real ones
images/                  Put your images here
```

## Previewing locally

Browsers block `fetch()` of local files when you just double-click an HTML
file (the `file://...` restriction), and this site uses `fetch()` to load
the shared header/footer and the timeline data. So preview it through a
tiny local server instead — from inside the `site/` folder:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/` in your browser. (Any static server
works — `npx serve`, VS Code's "Live Server" extension, etc.)

## Adding or editing pages

1. Copy `category-template.html` or `article-template.html` and rename it
   (e.g. `noakhali-riots-1946.html`).
2. Replace the bracketed placeholder text and images.
3. Set `<body data-page="...">` to whichever nav item this page belongs
   under, so it gets highlighted — use the `data-page` values already in
   `partials/header.html` (e.g. `islamic-jihad`, `political-crimes`).
4. Link to it from the relevant category page's card grid, and/or add it
   to `data/timeline-data.json` with a `"link"` field if it should also
   appear in the homepage timeline.

## Editing the navigation

Edit `partials/header.html` once — it's injected into every page
automatically. Same for `partials/footer.html`. No more hunting through
dozens of files to add a menu item.

## Editing the homepage timeline

`data/timeline-data.json` is an array of entries:

```json
{
  "id": 12,
  "year": "1946",
  "sortYear": 1946,
  "category": "Islamic Jihad",
  "title": "Entry title",
  "summary": "One or two sentence summary shown in the ledger row.",
  "figure": "5,000+",
  "figureLabel": "killed",
  "chartValue": 5,
  "link": "article-template.html"
}
```

- `sortYear` controls chronological ordering (use the start year for
  ranges like "1561–1774").
- `category` must match one of the categories used elsewhere — it drives
  both the filter chips and the chart.
- `chartValue` is a number (in thousands) used purely for the bar chart
  on the homepage — adjust the units/label in `js/timeline.js` if you'd
  rather chart something else (number of incidents, etc.) instead of
  casualty figures.
- `link` is optional — if present, the entry title becomes a link to that
  page.

The filter chips, stat counters and chart all regenerate automatically
from this file — you only maintain one dataset.

## Adding more visualisations

The chart on the homepage uses [Chart.js](https://www.chartjs.org/) via
CDN (already linked in `index.html`). To add another chart on an article
or category page:

1. Add the same Chart.js `<script>` tag to that page's `<head>`.
2. Add a `<canvas id="your-chart-id">` inside a `.viz-card` div (this
   class gives it the same card styling as the homepage chart).
3. Write a small inline `<script>` (or new file in `js/`) that creates
   `new Chart(...)` the same way `js/timeline.js` does.

## Design system / customising the look

Everything — colours, fonts, spacing — is controlled by CSS variables at
the top of `css/style.css`:

- `--ink`, `--paper`, `--paper-deep`, `--oxblood`, `--brass` — the palette
- `--f-display` (Source Serif 4), `--f-body` (IBM Plex Sans), `--f-mono`
  (IBM Plex Mono) — change these to swap typefaces site-wide
- Components (header, hero, ledger rows, cards, footer, buttons) are all
  named with `.bem-style` classes so you can find and tweak each piece
  independently.

Because every page links the same `css/style.css`, a single edit there
applies everywhere — that's the "uniform styling" piece.

## Deploying

This is a plain static site, so it works on any static host: GitHub
Pages, Cloudflare Pages, Netlify, Vercel, or even a regular shared-hosting
account (just upload the contents of `site/` to the web root). No PHP,
no MySQL, no plugin updates.

## What still needs real content

Everything in `[brackets]` is a placeholder. The structure, styling and
interactivity are all in place — swapping in your existing text, images
and references is the remaining work, and can be done incrementally
(start with the homepage timeline data and one or two category pages).
