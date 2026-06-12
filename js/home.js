/* =========================================================
   Homepage (index.html):
   - loads /data/timeline-data.json
   - renders a short preview of the timeline (most recent entries)
   - animates the stat counters
   Relies on helpers from js/common.js — load that first.
   ========================================================= */

const PREVIEW_COUNT = 4;

function renderPreview(entries) {
  const preview = document.querySelector(".ledger--preview");
  if (!preview) return;

  preview.innerHTML = "";

  entries
    .slice()
    .sort((a, b) => b.sortYear - a.sortYear) // most recent first
    .slice(0, PREVIEW_COUNT)
    .forEach((entry) => {
      const row = document.createElement("article");
      row.className = "ledger-entry";
      row.innerHTML = ledgerRowHTML(entry, entry.id - 1);
      preview.appendChild(row);
    });
}

function wireCounters(entries) {
  const totalIncidents = document.querySelector("[data-counter='incidents']");
  const totalEras = document.querySelector("[data-counter='eras']");
  const earliest = document.querySelector("[data-counter='earliest']");
  const totalPeople = document.querySelector("[data-counter='people']");

  if (totalIncidents) animateCounter(totalIncidents, entries.length);
  if (totalEras) animateCounter(totalEras, new Set(entries.map((e) => e.category)).size);
  if (earliest) {
    const minYear = Math.min(...entries.map((e) => e.sortYear));
    earliest.textContent = minYear;
  }
  if (totalPeople) {
    const sum = entries.reduce((acc, e) => acc + (e.number || 0), 0);
    animateCounter(totalPeople, sum);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const entries = await fetchTimelineData();
    renderPreview(entries);
    wireCounters(entries);
  } catch (err) {
    console.error("Could not load timeline data:", err);
    const preview = document.querySelector(".ledger--preview");
    if (preview) {
      preview.innerHTML =
        "<p>Timeline data could not be loaded. If you're viewing this file directly from disk, run it through a local server (e.g. <code>python -m http.server</code>) — browsers block JSON loading from <code>file://</code> URLs.</p>";
    }
  }
});
