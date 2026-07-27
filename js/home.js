/* =========================================================
   Homepage (index.html):
   - loads data/timeline-data.json
   - renders the stat counters
   - renders the preview ledger (first 3 entries)
   - wires the "This Day in History" widget
   Relies on helpers from js/common.js — load that first.
   ========================================================= */

function wireCounters(entries) {
  const totalIncidents = document.querySelector("[data-counter='incidents']");
  const totalEras      = document.querySelector("[data-counter='eras']");
  const earliest       = document.querySelector("[data-counter='earliest']");
  const totalPeople    = document.querySelector("[data-counter='people']");
  const totalTemples   = document.querySelector("[data-counter='temples']");
  const totalConverted = document.querySelector("[data-counter='converted']");
  const totalOngoing   = document.querySelector("[data-counter='ongoing']");
  const totalCountries = document.querySelector("[data-counter='countries']");

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
  if (totalTemples) {
    const sum = entries.reduce((acc, e) => acc + (e.templesAffected || 0), 0);
    animateCounter(totalTemples, sum);
  }
  if (totalConverted) {
    const sum = entries.reduce((acc, e) => acc + (e.peopleConverted || 0), 0);
    animateCounter(totalConverted, sum);
  }
  if (totalOngoing) {
    const count = entries.filter((e) => (e.tags || []).includes("Ongoing")).length;
    animateCounter(totalOngoing, count);
  }
  if (totalCountries) {
    const countries = new Set(
      entries.map((e) => e.geography && e.geography.country).filter(Boolean)
    );
    animateCounter(totalCountries, countries.size);
  }
}

function renderPreview(entries) {
  const ledger = document.querySelector(".ledger--preview");
  if (!ledger) return;
  ledger.innerHTML = "";
  entries
    .slice()
    .sort((a, b) => a.sortYear - b.sortYear)
    .slice(0, 3)
    .forEach((entry, i) => {
      const row = document.createElement("article");
      row.className = "ledger-entry";
      row.innerHTML = ledgerRowHTML(entry, i);
      ledger.appendChild(row);
    });
}

/* ---------------------------------------------------------
   This Day in History
   Looks for entries where historicalDate (format "DD-MM",
   matching the Indian date convention used in the sheet)
   matches today's date. Shows a plate between the hero and
   the Explore section. Hidden entirely if no entry matches.
   --------------------------------------------------------- */
function wireThisDayInHistory(entries) {
  const section = document.getElementById("tdih-section");
  const box     = document.getElementById("tdih-box");
  if (!section || !box) return;

  const today   = new Date();
  const dd      = String(today.getDate()).padStart(2, "0");
  const mm      = String(today.getMonth() + 1).padStart(2, "0");
  const todayDM = `${dd}-${mm}`;

  const matches = entries.filter((e) => e.historicalDate === todayDM);
  if (!matches.length) return; // nothing to show — section stays hidden

  const dateLabel = today.toLocaleDateString("en-US", {
    month: "long",
    day:   "numeric",
  });

  const cards = matches
    .map((entry) => {
      const link = entry.link;
      const titleHTML = link
        ? `<a href="${link}">${entry.title}</a>`
        : entry.title;
      const figureHTML =
        entry.figure
          ? `<span>${entry.figure} ${entry.figureLabel || ""}</span>`
          : "";
      return `
        <div class="tdih__entry">
          <span class="tdih__tag">${entry.category}</span>
          <h3 class="tdih__title">${titleHTML}</h3>
          <p class="tdih__summary">${entry.summary}</p>
          <div class="tdih__meta">
            <span>${entry.year}</span>
            ${figureHTML}
          </div>
        </div>`;
    })
    .join("");

  box.innerHTML = `
    <div class="tdih__header">
      <span class="tdih__eyebrow">This day in history</span>
      <span class="tdih__date">${dateLabel}</span>
    </div>
    ${cards}
  `;

  section.style.display = "block";
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const entries = await fetchTimelineData();
    wireCounters(entries);
    renderPreview(entries);
    wireThisDayInHistory(entries);
  } catch (err) {
    console.error("Could not load timeline data:", err);
  }
});
