/* =========================================================
   Shared helpers used by home.js and timeline.js
   ========================================================= */
const TIMELINE_DATA_URL = "data/timeline-data.json";

function formatNumber(n) {
  return new Intl.NumberFormat("en-IN").format(Math.round(n));
}

function animateCounter(el, target, opts = {}) {
  const duration = opts.duration || 1400;
  const suffix = opts.suffix || "";
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = target * eased;
    el.textContent = formatNumber(value) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function fetchTimelineData() {
  const res = await fetch(TIMELINE_DATA_URL);
  return res.json();
}

// Renders a single ledger row. Shared by the homepage preview and
// the full timeline page so the markup stays identical.
function ledgerRowHTML(entry, index) {
  const linkOpen = entry.link ? `<a href="${entry.link}">` : "";
  const linkClose = entry.link ? `</a>` : "";

  // Geography: "Country" or "State, Country" if state is set.
  const geo = entry.geography || {};
  const geoLabel = [geo.state, geo.country].filter(Boolean).join(", ");

  // Type pills (persecution types) and general tags share the same
  // pill style and both link to the posts archive.
  const typePills = (entry.type || [])
    .map((t) => `<a href="posts.html?tag=${encodeURIComponent(t)}" class="tag-pill">${t}</a>`)
    .join("");
  const tagPills = (entry.tags || [])
    .filter((t) => !(entry.type || []).includes(t)) // avoid duplicates with type
    .map((t) => `<a href="posts.html?tag=${encodeURIComponent(t)}" class="tag-pill">${t}</a>`)
    .join("");

  return `
    <div class="ledger-entry__no">No. ${String(index + 1).padStart(4, "0")}</div>
    <div class="ledger-entry__year">
      ${entry.year}
      ${geoLabel ? `<span class="ledger-entry__geo">${geoLabel}</span>` : ""}
    </div>
    <div class="ledger-entry__body">
      <span class="ledger-entry__tag">${entry.category}</span>
      <h3>${linkOpen}${entry.title}${linkClose}</h3>
      <p>${entry.summary}</p>
      ${typePills || tagPills ? `<div class="tag-list">${typePills}${tagPills}</div>` : ""}
    </div>
    <div class="ledger-entry__figure">
      ${entry.figure}
      <small>${entry.figureLabel}</small>
    </div>
  `;
}
