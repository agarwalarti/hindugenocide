/* =========================================================
   Homepage interactivity:
   - loads /data/timeline-data.json
   - renders the ledger rows
   - wires up category filter chips
   - animates the hero stat counters
   - draws the "documented impact by category" chart (Chart.js)
   ========================================================= */

const DATA_URL = "data/timeline-data.json";

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

      const linkOpen = entry.link ? `<a href="${entry.link}">` : "";
      const linkClose = entry.link ? `</a>` : "";

      row.innerHTML = `
        <div class="ledger-entry__no">No. ${String(i + 1).padStart(4, "0")}</div>
        <div class="ledger-entry__year">${entry.year}</div>
        <div class="ledger-entry__body">
          <span class="ledger-entry__tag">${entry.category}</span>
          <h3>${linkOpen}${entry.title}${linkClose}</h3>
          <p>${entry.summary}</p>
        </div>
        <div class="ledger-entry__figure">
          ${entry.figure}
          <small>${entry.figureLabel}</small>
        </div>
      `;
      ledger.appendChild(row);
    });
}

function wireFilters(entries) {
  const filterBar = document.querySelector(".filters");
  if (!filterBar) return;

  const categories = ["All", ...new Set(entries.map((e) => e.category))];

  filterBar.innerHTML = categories
    .map(
      (cat, i) =>
        `<button class="filter-chip ${i === 0 ? "is-active" : ""}" data-filter="${cat}">${cat}</button>`
    )
    .join("");

  filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;

    filterBar.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("is-active"));
    btn.classList.add("is-active");

    const filter = btn.dataset.filter;
    document.querySelectorAll(".ledger-entry").forEach((row) => {
      const show = filter === "All" || row.dataset.category === filter;
      row.classList.toggle("is-hidden", !show);
    });
  });
}

function wireCounters(entries) {
  const totalIncidents = document.querySelector("[data-counter='incidents']");
  const totalEras = document.querySelector("[data-counter='eras']");
  const earliest = document.querySelector("[data-counter='earliest']");

  if (totalIncidents) animateCounter(totalIncidents, entries.length);
  if (totalEras) animateCounter(totalEras, new Set(entries.map((e) => e.category)).size);
  if (earliest) {
    const minYear = Math.min(...entries.map((e) => e.sortYear));
    earliest.textContent = minYear;
  }
}

function renderChart(entries) {
  const canvas = document.getElementById("category-chart");
  if (!canvas || typeof Chart === "undefined") return;

  const totals = {};
  entries.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + (e.chartValue || 0);
  });

  const labels = Object.keys(totals);
  const values = Object.values(totals);

  new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Documented impact (thousands of people, placeholder figures)",
          data: values,
          backgroundColor: "#8A2A28",
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
            label: (ctx) => `${formatNumber(ctx.parsed.x)}k (placeholder)`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { font: { family: "IBM Plex Mono", size: 11 } },
          grid: { color: "#E4D9C7" },
        },
        y: {
          ticks: { font: { family: "IBM Plex Mono", size: 11 } },
          grid: { display: false },
        },
      },
      indexAxis: "y",
    },
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(DATA_URL);
    const entries = await res.json();

    renderLedger(entries);
    wireFilters(entries);
    wireCounters(entries);
    renderChart(entries);
  } catch (err) {
    console.error("Could not load timeline data:", err);
    const ledger = document.querySelector(".ledger");
    if (ledger) {
      ledger.innerHTML =
        "<p>Timeline data could not be loaded. If you're viewing this file directly from disk, run it through a local server (e.g. <code>python -m http.server</code>) — browsers block JSON loading from <code>file://</code> URLs.</p>";
    }
  }
});
