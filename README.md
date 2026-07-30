# Hindu Genocide — Site Reference

Quick reference for maintaining and expanding the site. Not a technical manual — assumes you know the basics and just need a reminder.

---

## Site structure at a glance

```
site root/
├── index.html                          homepage
├── timeline.html                       main timeline
├── temples.html                        temple incidents timeline
├── map.html                            interactive choropleth map
├── search.html                         search page
├── glossary.html                       glossary
├── historiography.html                 historiography & methodology
├── hindus-of-the-genocide.html         personal stories page
├── resources.html                      reports and downloads
├── download/index.html                 lead magnet download page
├── privacy-policy/index.html
├── terms-and-conditions-copyrights/index.html
│
├── islamic-jihad/index.html            category pages
├── christian-proselytization/index.html
├── political-crimes/index.html
├── khalistani-terror/index.html
├── analysis/index.html
├── news/index.html
├── talks/index.html
│
├── islamic-jihad/[slug]/index.html     article pages (old URL pattern)
├── islamic-jihad/[slug].html           article pages (new flat pattern)
├── hindus-of-the-genocide/[name].html  people story pages
│
├── css/style.css
├── js/main.js                          nav toggle, citation box, submenu
├── js/partials.js                      loads header/footer into every page
├── js/common.js                        shared helpers (ledgerRowHTML etc.)
├── js/home.js                          homepage counters + TDIH widget
├── js/timeline.js                      main timeline page
├── js/temples.js                       temples timeline page
├── js/category.js                      all category pages (auto-renders cards)
├── js/people.js                        hindus-of-the-genocide page
├── js/posts.js                         posts archive + tag filtering
├── js/map.js                           choropleth map
│
├── data/timeline-data.json             THE main data file (drives everything)
├── data/people-data.json               people stories data
├── data/world-countries.geojson        map boundaries (download separately)
├── data/india-states.geojson           map boundaries (download separately)
│
├── partials/header.html                shared nav (edit to change menu)
├── partials/footer.html                shared footer
│
└── images/                             all images
    └── people/                         portrait photos for people stories
```

---

## The main data file — `data/timeline-data.json`

Every entry powers: the timeline ledger, charts, category page cards, map, search, homepage stat counters, and the This Day in History widget. One file, everything updates automatically.

### Fields

| Field | Required | What it does |
|---|---|---|
| `id` | Yes | Unique number. Increment. |
| `year` | Yes | Display string ("1398–99", "Ongoing"). |
| `sortYear` | Yes | Numeric year for sorting and the slider. Entries without this are excluded from the timeline — use deliberately for analysis posts. |
| `historicalDate` | No | DD-MM format. Powers the This Day in History widget. |
| `category` | Yes | Islamic Jihad / Christian Proselytization / Political Crimes / Khalistani Terror / Analysis / News / Talks |
| `title` | Yes | Full title. |
| `summary` | Yes | One or two sentences. Cards, ledger, map hover. |
| `figure` | Yes | Human-readable display number ("2 Million", "30,000"). |
| `figureLabel` | Yes | Label under the figure ("killed", "converted"). |
| `number` | No | Machine-readable integer. Charts, stat counters, map colour. |
| `type` | Yes | Array of persecution types from your controlled list. |
| `geography.country` | Yes | Country name from your dropdown. |
| `geography.state` | No | Indian state, or array for multi-state: `["AP", "TN"]`. |
| `tags` | No | Thematic tags NOT already in type/geography/year — "Congress", "History", "Ongoing", etc. |
| `link` | No | Relative URL to the article page. Empty until built. |
| `image` | No | Image path for category page card thumbnail. |
| `peopleConverted` | No | Separate numeric count for conversions specifically. |
| `templeType` | No | Array of temple impact types. Entry only appears on /temples.html if this exists. |
| `templesAffected` | No | Numeric temple count. |
| `templeFigure` | No | Display override when a number doesn't make sense ("Somnath, and others"). |
| `templeFigureLabel` | No | Label for templeFigure. |
| `financialLossFigure` | No | Display string for financial loss. |
| `financialLossLabel` | No | Label for the financial figure. |

### What shows where

| Page | Shows entries where... |
|---|---|
| Timeline ledger | `sortYear` is set |
| Timeline charts | `number` is set |
| Temples page | `templeType` or `templesAffected` is set |
| Map | `geography.country` is set |
| Category pages | `category` matches |
| Search | All entries, all fields |
| Homepage stats | Sums `number`, `templesAffected`, `peopleConverted`; counts "Ongoing" tags; distinct countries |
| This Day in History | `historicalDate` matches today's DD-MM |

### Google Sheet workflow

Fill in the sheet → File → Download → CSV → upload here for conversion. Use the controlled dropdown lists for type, category, templeType, and geography fields.

---

## Creating a new article page

Use `article-template.html`.

**Where it lives:**
- New articles (going forward): `[category]/[slug].html` — flat file inside the category folder. `<base href="../">`
- Old migrated articles (keeping WordPress URLs): `[category]/[slug]/index.html` — folder + index. `<base href="../../">`

**Fill in order:**
1. `<title>`, `meta description`, `canonical` URL
2. Open Graph and Twitter meta tags — title, description, absolute image URL, page URL
3. `<body data-page="[category-slug]">`
4. Article meta line, `<h1>`, lede
5. Fact-grid — Year, Number, Type, Location. Add/remove optional People converted, Temples, Financial losses blocks.
6. Featured image `src` — same filename as in `og:image` (no domain prefix)
7. Body text, quotes with attribution, inline and wide images
8. Type pills and Tagged-under pills
9. References list
10. Citation box "Originally published [Month Year]"

## Images in articles

| Class / pattern | Width | Text behaviour | When to use |
|---|---|---|---|
| `<figure>` (no extra class) | Text column width | Text flows below | Standard inline image within the article body |
| `<figure class="figure--wide">` | Up to 1100px, breaks out of text column | Text flows below | Panoramic photos, maps, wide press clippings |
| `<figure class="article__featured-image figure--wide">` | Full width | Text flows below | Hero image at the top, right after the hero section |
| `<figure class="figure--right">` | 280px, floated right | Text wraps on the left | Portrait photos, small objects — text alongside image |
| `<figure class="figure--left">` | 280px, floated left | Text wraps on the right | Same as above, image on the other side |

For floated images, add `<div class="clear"></div>` after the last paragraph that should wrap around the image.

On mobile, all classes render as full-width stacked blocks.

All images should have a descriptive `alt` attribute (plain text only, no links). Captions (`<figcaption>`) can contain links using a standard `<a href="...">` tag.

**After building:**
- Add entry to `data/timeline-data.json` with `"link"` and optionally `"image"`
- Category page updates automatically

---

## Creating a new standalone page

Use `page-template.html`. Lives at site root, no `<base>` tag.

---

## Creating a People story page

Use `people-template.html`. Lives at `hindus-of-the-genocide/[name].html`. `<base href="../">` already set.

After building, add to `data/people-data.json`:
```json
{
  "id": [next number],
  "name": "Full Name",
  "description": "One or two sentences for the main page card.",
  "image": "images/people/their-photo.jpg",
  "year": "1946",
  "location": "Noakhali, Bangladesh",
  "link": "hindus-of-the-genocide/their-name.html"
}
```

The main page updates automatically.

---

## Editing the menu and footer

Edit `partials/header.html` and `partials/footer.html`. Changes apply to all pages immediately. No leading `/` on internal links.

**Current menu:** Timeline · Temples · Posts ▾ (Islamic Jihad, Christian Proselytization, Political Crimes, Khalistani Terror, Analysis, News, Talks) · Map · Search · Donate

---

## Adding a new category

1. Create `[category-slug]/index.html` — copy any existing category page, update title, h1, description, `data-page`, and `data-category` on the `#category-cards` div
2. Add submenu link in `partials/header.html`
3. Add to Sections in `partials/footer.html`
4. Use exact same string in `timeline-data.json` entries

No JS changes needed.

---

## Color palette (locked — do not change)

```
--paper:       #FCF8F2    warm cream, main background
--paper-deep:  #F6D1C1    cards, fact boxes
--paper-line:  #F7E7CE    hairlines
--oxblood:     #770000    links, figures, accents
--oxblood-soft:#620404
--salmon:      #FCA99C    Donate button fill
--salmon-text: #520D1B    text on salmon
--footer-bg:   #520D1B    footer background
--ink:         #000000    body text
```

---

## Page depth and `<base>` tags

| Location | Example | Base tag |
|---|---|---|
| Site root | `index.html` | None |
| One level deep | `islamic-jihad/index.html` | `<base href="../">` |
| Two levels deep | `islamic-jihad/slug/index.html` | `<base href="../../">` |

---

## GeoJSON files for the map

Download and place in `data/`:
- `data/world-countries.geojson` — datahub.io/core/geo-countries
- `data/india-states.geojson` — github.com/geohacker/india

Name mismatches between your data and the GeoJSON are handled in `STATE_NAME_MAP` and `COUNTRY_NAME_MAP` in `js/map.js`. Add entries there if a new region doesn't colour correctly.
