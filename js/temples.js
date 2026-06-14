/* =========================================================
   Temples timeline page (temples.html):
   - loads data/timeline-data.json (same file as the main timeline)
   - keeps only entries that carry temple-related fields
     (templeType and/or templesAffected)
   - renders the ledger rows using templeLedgerRowHTML (temple
     figures, not people)
   - wires up category AND temple-type filter chips (combined, AND
     logic — same pattern as the main timeline)
   - animates the stat counters
   - draws "temples affected by category" and "by temple-type" charts
   Relies on helpers from js/common.js — load that first.
   ========================================================= */

// An entry appears on this page if it has any templeType values
// and/or a non-zero templesAffected count. Entries with neither are
// left out entirely — they simply don't apply to temples.
function hasTempleData(entry) {
  return (entry.templeType && entry.templeType.length > 0) || (entry.templesAffected || 0) > 0;
}

function renderTempleLedger(entries) {
  const ledger = document.querySelector(".ledger");
  if (!ledger) return;

  ledger.innerHTML = "";

  if (!entries.length) {
    ledger.innerHTML =
      "<p>No entries with temple data yet. Add <code>templeType</code> (e.g. [\"Destroyed\", \"Desecrated\"]) and/or <code>templesAffected</code> to an entry in <code>data/timeline-data.json</code> to see it here — these can sit alongside the existing <code>type</code>/<code>number</code> fields on the same entry.</p>";
    return;
  }

  entries
    .slice()
    .sort((a, b) => a.sortYear - b.sortYear)
    .forEach((entry, i) => {
      const row = document.createElement("article");
      row.className = "ledger-entry";
      row.dataset.category = entry.category;
      row.dataset.types = (entry.templeType || []).join("|");
      row.innerHTML = templeLedgerRowHTML(entry, i);
      ledger.appendChild(row);
    });
}

function applyFilters() {
  const activeCategory = document.querySelector(".filters--category .filter-chip.is-active")?.dataset.filter || "All";
  const activeType = document.querySelector(".filters--type .filter-chip.is-active")?.dataset.filter || "All";

  document.querySelectorAll(".ledger-entry").forEach((row) => {
    const categoryOk = activeCategory === "All" || row.dataset.category === activeCategory;
    const types = (row.dataset.types || "").split("|");
    const typeOk = activeType === "All" || types.includes(activeType);
    row.classList.toggle("is-hidden", !(categoryOk && typeOk));
  });
}

function wireFilterGroup(selector, options) {
  const filterBar = document.querySelector(selector);
  if (!filterBar) return;

  filterBar.innerHTML = options
    .map(
      (opt, i) =>
        `<button class="filter-chip ${i === 0 ? "is-active" : ""}" data-filter="${opt}">${opt}</button>`
    )
    .join("");

  filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;

    filterBar.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("is-active"));
    btn.classList.add("is-active");
    applyFilters();
  });
}

function wireFilters(entries) {
  const categories = ["All", ...new Set(entries.map((e) => e.category))];
  const types = ["All", ...new Set(entries.flatMap((e) => e.templeType || []))];

  wireFilterGroup(".filters--category", categories);
  wireFilterGroup(".filters--type", types);
}

function wireCounters(entries) {
  const totalIncidents = document.querySelector("[data-counter='incidents']");
  const totalEras = document.querySelector("[data-counter='eras']");
  const earliest = document.querySelector("[data-counter='earliest']");
  const totalTemples = document.querySelector("[data-counter='temples']");

  if (totalIncidents) animateCounter(totalIncidents, entries.length);
  if (totalEras) animateCounter(totalEras, new Set(entries.map((e) => e.category)).size);
  if (earliest) {
    earliest.textContent = entries.length ? Math.min(...entries.map((e) => e.sortYear)) : "—";
  }
  if (totalTemples) {
    const sum = entries.reduce((acc, e) => acc + (e.templesAffected || 0), 0);
    animateCounter(totalTemples, sum);
  }
}

function barChart(canvasId, labels, values, valueLabel) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: valueLabel,
          data: values,
          backgroundColor: "#770000",
          borderRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${formatNumber(ctx.parsed.x)} temples`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { font: { family: "IBM Plex Mono", size: 11 } },
          grid: { color: "#D8D0C2" },
        },
        y: {
          ticks: { font: { family: "Cabin", size: 12 } },
          grid: { display: false },
        },
      },
      indexAxis: "y",
    },
  });
}

function renderCharts(entries) {
  if (!entries.length) return;

  // By category — sum of "templesAffected" per category.
  const byCategory = {};
  entries.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + (e.templesAffected || 0);
  });
  barChart("category-chart", Object.keys(byCategory), Object.values(byCategory), "Temples affected");

  // By temple-type — an entry can have multiple types (e.g. both
  // "Destroyed" and "Converted to Mosque"), so its count is counted
  // once per type. Totals across types can exceed the category chart.
  const byType = {};
  entries.forEach((e) => {
    (e.templeType || []).forEach((t) => {
      byType[t] = (byType[t] || 0) + (e.templesAffected || 0);
    });
  });
  barChart("type-chart", Object.keys(byType), Object.values(byType), "Temples affected");
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const allEntries = await fetchTimelineData();
    const entries = allEntries.filter(hasTempleData);

    renderTempleLedger(entries);
    wireFilters(entries);
    wireCounters(entries);
    renderCharts(entries);
  } catch (err) {
    console.error("Could not load timeline data:", err);
    const ledger = document.querySelector(".ledger");
    if (ledger) {
      ledger.innerHTML =
        "<p>Temple data could not be loaded. If you're viewing this file directly from disk, run it through a local server (e.g. <code>python -m http.server</code>) — browsers block JSON loading from <code>file://</code> URLs.</p>";
    }
  }
});
