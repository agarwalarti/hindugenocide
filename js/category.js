/* =========================================================
   Category pages (islamic-jihad/, political-crimes/, etc.)

   Reads data/timeline-data.json, filters to the current
   category, and renders cards automatically. No hand-written
   cards needed — adding an entry to the JSON is enough.

   Required on each category page:
     <div class="card-grid" id="category-cards"
          data-category="Islamic Jihad">

   Optional — shows a live count of entries:
     <span id="category-count"></span>

   To show a featured image on a card, add an "image" field
   to the entry in timeline-data.json:
     "image": "images/your-photo.jpg"
   Omit the field (or leave it empty) for a placeholder.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("category-cards");
  if (!container) return;

  const categoryName = container.dataset.category;
  if (!categoryName) return;

  /* --- Load data --- */
  let entries = [];
  try {
    const res = await fetch("data/timeline-data.json");
    entries = await res.json();
  } catch (err) {
    console.error("category.js: could not load timeline-data.json:", err);
    container.innerHTML =
      "<p>Could not load entries. If previewing locally, " +
      "run <code>python3 -m http.server</code> rather than opening the file directly.</p>";
    return;
  }

  /* --- Filter and sort (newest first for category pages) --- */
  const filtered = entries
    .filter((e) => e.category === categoryName)
    .sort((a, b) => b.sortYear - a.sortYear);

  /* --- Update count label --- */
  const countEl = document.getElementById("category-count");
  if (countEl) {
    countEl.textContent =
      `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`;
  }

  /* --- Render --- */
  if (!filtered.length) {
    container.innerHTML =
      "<p style='font-family:var(--f-heading);color:var(--oxblood-soft);'>" +
      "No entries documented for this category yet.</p>";
    return;
  }

  container.innerHTML = filtered
    .map((entry, i) => {
      const imgSrc = entry.image
        ? entry.image
        : `images/placeholder-${((i % 6) + 1)}.jpg`;

      const typePills = (entry.type || [])
        .map(
          (t) =>
            `<a href="posts.html?tag=${encodeURIComponent(t)}" class="tag-pill">${t}</a>`
        )
        .join("");

      const tagPills = (entry.tags || [])
        .filter((t) => !(entry.type || []).includes(t))
        .map(
          (t) =>
            `<a href="posts.html?tag=${encodeURIComponent(t)}" class="tag-pill">${t}</a>`
        )
        .join("");

      return `
        <article class="card">
          <div class="card__media">
            <img
              src="${imgSrc}"
              alt="${entry.title}"
              loading="lazy"
            />
          </div>
          <div class="card__body">
            <span class="card__tag">${entry.year}</span>
            <h3>${entry.title}</h3>
            ${entry.summary ? `<p>${entry.summary}</p>` : ""}
            ${
              typePills || tagPills
                ? `<div class="tag-list">${typePills}${tagPills}</div>`
                : ""
            }
          </div>
          ${
            entry.link
              ? `<a href="${entry.link}" class="card__link"
                   aria-label="Read more about ${entry.title.replace(/"/g, "&quot;")}"></a>`
              : ""
          }
        </article>`;
    })
    .join("");
});
