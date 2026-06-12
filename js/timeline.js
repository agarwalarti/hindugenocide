/* =========================================================
   Full timeline page (timeline.html):
   - loads /data/timeline-data.json
   - renders the ledger rows
   - wires up category AND type filter chips (combined, AND logic)
   - animates the stat counters
   - draws "documented impact by category" and "by type" charts
   Relies on helpers from js/common.js — load that first.
   ========================================================= */

function renderLedger(entries) {
  const ledger = document.querySelector(".ledger");
  if (!ledger) return;

  ledger.innerHTML = "";

  entries
    .slice()
    .sort((a, b) => a.sortYear - b.sortYear)
    .forEach((entry, i) => {
      const row = document.createElement("article");
      row.className = "ledger-entry";
      row.dataset.category = entry.category;
      row.dataset.types = (entry.type || []).join("|");
      row.innerHTML = ledgerRowHTML(entry, i);
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

function wireFilterGroup(selector, options, label) {
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
  const types = ["All", ...new Set(entries.flatMap((e) => e.type || []))];

  wireFilterGroup(".filters--category", categories, "Category");
  wireFilterGroup(".filters--type", types, "Type");
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
            label: (ctx) => `${formatNumber(ctx.parsed.x)} people`,
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
  // By category — sum of "number" per category (no double-counting,
  // every entry has exactly one category).
  const byCategory = {};
  entries.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + (e.number || 0);
  });
  barChart("category-chart", Object.keys(byCategory), Object.values(byCategory), "People affected");

  // By type — an entry can have multiple types, so its number is
  // counted once per type. Totals across types can exceed the
  // overall total for this reason (noted in the caption).
  const byType = {};
  entries.forEach((e) => {
    (e.type || []).forEach((t) => {
      byType[t] = (byType[t] || 0) + (e.number || 0);
    });
  });
  barChart("type-chart", Object.keys(byType), Object.values(byType), "People affected");
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const entries = await fetchTimelineData();

    renderLedger(entries);
    wireFilters(entries);
    wireCounters(entries);
    renderCharts(entries);
  } catch (err) {
    console.error("Could not load timeline data:", err);
    const ledger = document.querySelector(".ledger");
    if (ledger) {
      ledger.innerHTML =
        "<p>Timeline data could not be loaded. If you're viewing this file directly from disk, run it through a local server (e.g. <code>python -m http.server</code>) — browsers block JSON loading from <code>file://</code> URLs.</p>";
    }
  }
});
