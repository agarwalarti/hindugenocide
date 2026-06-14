# Hindu Genocide — static site skeleton

A plugin-free static site to replace the WordPress build. Plain HTML, CSS
and JS — no build step, no database, nothing to install. This is a
**structural skeleton** built from the real WordPress export
(`hindugenocide_WordPress_2026-06-12.xml`): real URLs, real categories/tags,
and five real articles fully wired up as proof of concept. The remaining
~50 posts follow the same pattern.

## Deploying — just upload it

Every page resolves its CSS/JS/data/images/links using a `<base>` tag set
once per page, instead of paths starting with `/`. This means the same
files work correctly whether the site ends up:

- at the root of a custom domain (`hindugenocide.com/...`), **or**
- in a GitHub Pages project subfolder (`username.github.io/reponame/...`)

So: create a repo, upload everything inside `site/` to it, turn on GitHub
Pages (Settings → Pages → Deploy from branch → `/` root), and it'll just
work at `username.github.io/reponame/`. If/when you point the custom
domain `hindugenocide.com` at it later, it'll also just work there — no
changes needed either way.

## URL structure (preserves the real WordPress URLs)

```
/                                          → index.html (homepage)
/timeline.html                             → full interactive timeline
/posts.html                                → archive, filter by ?tag=
/islamic-jihad/                            → category page
/islamic-jihad/<slug>/                     → individual article
/christian-conversion/, /political-crimes/,
/analysis/, /news/, /talks/                → same pattern
```

Each article lives at `<category>/<slug>/index.html`, which static hosts
serve at `<category>/<slug>/` — identical to the old WordPress URLs.

## Editing the menu and footer — no need to ask me

`partials/header.html` and `partials/footer.html` are loaded into every
page automatically. To change the menu:

1. Open `partials/header.html`.
2. Each menu item is one `<a>...</a>` line inside `<nav class="site-nav">`.
   Change the text, change the `href`, delete a line to remove an item, or
   reorder the lines.
3. Just keep paths **without** a leading `/` (e.g. `analysis/`, not
   `/analysis/`) — that's what makes the `<base>` system work everywhere.
4. Do the same in `partials/footer.html` for the "Sections" list.

That's it — both files are plain HTML with comments at the top as a
reminder. No other file needs to change.

**Current menu:** Timeline, Islamic Jihad, Christian Conversion, Political
Crimes, Analysis, Posts, Donate. Everything else (News, Talks, Cultural
Genocide, Congress, and any other tag) is reachable via
`posts.html?tag=<TagName>` — those category pages (`/news/`, `/talks/`)
still exist and work, they're just not in the main menu anymore.

## Colour palette

- `--paper: #F4F4F4` — light beige, main background
- `--paper-deep: #F6D1C1` — cards, fact boxes, ledger figure panel
- `--ink: #000000` — pure black, body text and headings
- `--oxblood: #770000` / `--oxblood-soft: #620404` — dark reds for
  highlights: links, figures, category labels, active states
- `--salmon: #FCA99C` — Donate button fill (now larger/bolder)
- `--footer-bg: #520D1B` — dark maroon footer

Optional background image: set `style="--bg-image:url('images/your-image.jpg')"`
on any `<body>` tag.

## How entry data fits together

Before editing anything, it helps to know there are exactly **two** places
data for an incident can live — and most entries only need one of them.

1. **`data/timeline-data.json`** — a single file containing a list of
   entry objects. This one file powers *both* `/timeline.html` (people
   affected) and `/temples.html` (temples affected). A single entry object
   can carry people-fields (`type`, `number`, `figure`, `figureLabel`),
   temple-fields (`templeType`, `templesAffected`, `templeFigure`,
   `templeFigureLabel`), or both at once — whichever fields are present
   determine which page(s) it shows up on. There is no second file for
   temples — same file, same object, just more fields.

2. **The article page itself** (only if this incident has one) — its
   fact-grid (Year / Number affected / Type / Location, and optionally
   Temples affected / Temple impact) is hand-written HTML, separate from
   the JSON. Nothing connects the two automatically.

So in practice:

- **Entry with no article** → update one thing: its object in
  `data/timeline-data.json`, with whichever field set(s) apply.
- **Entry with an article** → update two things: that same JSON object,
  *and* the matching figures in the article's fact-grid — both need the
  same numbers entered separately.
- **Never two JSON files** — `/timeline.html` and `/temples.html` both
  read `data/timeline-data.json`.

## Adding/updating an article page

1. Copy `article-template.html` into `<category>/<new-post-slug>/index.html`
   (matching the real WordPress slug if you're migrating an existing post,
   for SEO). Keep the `<base href="../../">` line as-is — it's already
   correct for this folder depth.
2. Fill in:
   - `<title>` and the meta description
   - the `<body data-page="...">` value (the category slug, e.g.
     `islamic-jihad`)
   - the meta line (`[Category]` / `[Month Year]`)
   - `<h1>` and the lede paragraph
   - the **fact-grid** (Year / Number affected / Type / Location) — these
     are the structured fields that also feed the timeline charts if this
     entry is added to `data/timeline-data.json`. The template also
     includes an *optional* two-fact block (Temples affected / Temple
     impact) for incidents that also involved temples — delete it for
     posts about people only, or fill it in and keep it; the grid reflows
     automatically either way.
   - the body paragraphs and any images (replace
     `images/placeholder-*.jpg`)
   - the "Type" and "Tagged under" pill lists — each pill is
     `<a href="posts.html?tag=TagName" class="tag-pill">TagName</a>`
   - the References list
3. If this entry should also appear on `/timeline.html` and/or
   `/temples.html`, add a matching object to `data/timeline-data.json`
   (see "How entry data fits together" above for the people/temple field
   sets, and the 4 existing entries for the shape) — `link` should be
   `<category>/<new-post-slug>/`.
4. Add a card for it on the relevant `<category>/index.html` page (copy
   one of the existing real cards and edit the text/link/tags).

## Adding a brand-new standalone page

Use `page-template.html` — a minimal page with header, footer, a hero, and
a content section using the same components (headings, pull-stats,
images, buttons) as article pages. Comments inside explain the one-line
change needed if you put the page inside a folder instead of at the root.

## Temples timeline (`/temples.html`)

A second timeline, alongside `/timeline.html`, that tracks **temples**
rather than people — temples destroyed, vandalized, desecrated, or
converted to other uses. It reads the same `data/timeline-data.json` file
(see "How entry data fits together" above) and uses the same
ledger/filter/chart layout, plus a hero image slot for a temple photo
(`images/placeholder-temples-hero.jpg` — replace with a real image).

The temple-specific fields, added to the same entry object as the
people-fields:

```json
{
  "...": "...existing fields (year, category, title, summary, etc.)...",

  "templeType": ["Destroyed", "Desecrated"],
  "templesAffected": 12,
  "templeFigure": "12",
  "templeFigureLabel": "temples destroyed or desecrated"
}
```

- `templeType` — array of temple-attack types (Destroyed, Vandalized,
  Desecrated, Converted to Mosque, etc.) — your own vocabulary, not tied to
  the people-side `type` values. Renders as pills, drives the type filter
  and the "by type" chart on `/temples.html`.
- `templesAffected` — the count of temples/structures, used for the stat
  counter and both charts.
- `templeFigure` / `templeFigureLabel` — optional display overrides for the
  ledger row (e.g. `"templeFigure": "1"`, `"templeFigureLabel": "temple
  converted to a mosque"`). If omitted, the figure falls back to
  `templesAffected` with the label "temples affected".

**An entry with no temple fields simply doesn't appear on
`/temples.html`** — `js/temples.js` filters `timeline-data.json` down to
only entries that have `templeType` and/or `templesAffected` set.

For an incident that affected both people and temples — e.g. Noakhali,
1946 — you'd add both sets of fields to the same entry:

```json
{
  "type": ["Murder", "Rape", "Arson"],
  "number": 250,
  "figure": "250+",
  "figureLabel": "killed (no accurate count made)",

  "templeType": ["Destroyed", "Desecrated", "Converted to Mosque"],
  "templesAffected": 6,
  "templeFigure": "6+",
  "templeFigureLabel": "temples destroyed, desecrated, or converted"
}
```

It would then show up on `/timeline.html` with the people figures, and on
`/temples.html` with the temple figures — same entry, same `category`,
same `geography`, two views.

## Homepage stats (8 counters)

The homepage stat row reads `data/timeline-data.json` directly (via
`js/home.js`) and computes all 8 numbers live — nothing is hardcoded, and
nothing needs to be kept in sync manually. The first four were there from
the start; the second four use fields already introduced for
`/temples.html`, plus two new ones:

- **documented entries** — `entries.length`
- **people affected** — sum of `number`
- **categories tracked** — distinct `category` values
- **earliest year** — minimum `sortYear`
- **temples affected** — sum of `templesAffected` (same total as on
  `/temples.html`, across all `templeType` values)
- **people converted** — sum of `peopleConverted` (new field, see below)
- **ongoing situations** — count of entries whose `tags` array includes
  `"Ongoing"` (new tag convention, see below)
- **countries documented** — distinct `geography.country` values

### `peopleConverted` — a separate figure from `number`

For incidents where forced or deceitful religious conversion is itself a
countable figure — distinct from deaths, displacement, etc. captured in
`number` — add an optional `peopleConverted` field to the entry:

```json
{
  "...": "...existing fields...",
  "type": ["Conversion"],
  "number": 50000,
  "figure": "50,000",
  "figureLabel": "displaced",

  "peopleConverted": 12000
}
```

`number` and `peopleConverted` are independent — an entry can have either,
both, or neither, depending on what's actually documented for it. The
article page's fact-grid has a matching optional "People converted" box
(see `article-template.html`) — if an entry has `peopleConverted` in the
JSON and also has its own article, enter the same figure in both places
(per "How entry data fits together" above).

### The `"Ongoing"` tag — no new field needed

To mark an entry as an ongoing situation rather than a discrete past
incident (for the "ongoing situations documented" homepage stat), just add
`"Ongoing"` to that entry's `tags` array:

```json
{
  "...": "...existing fields...",
  "tags": ["Ongoing", "Christian Missionaries"]
}
```

That's the whole convention — no new field, no change to how `type` or
`category` work. An "Ongoing" entry can still have `number`,
`templesAffected`, `peopleConverted`, etc. as normal; the tag just also
makes it count toward this one extra stat.

## Previewing locally

```
python3 -m http.server 8000
```

then open `http://localhost:8000/`.
