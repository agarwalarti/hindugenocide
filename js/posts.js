/* =========================================================
   Posts archive (posts.html):
   Reads ?tag=... or ?category=... from the URL and filters
   data/timeline-data.json accordingly. With no params, shows
   everything. Relies on helpers from js/common.js.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const tag = params.get("tag");
  const category = params.get("category");

  const heading = document.querySelector("[data-archive-heading]");
  const sub = document.querySelector("[data-archive-sub]");
  const ledger = document.querySelector(".ledger");

  if (!ledger) return;

  try {
    const entries = await fetchTimelineData();

    let filtered = entries;
    if (tag) {
      filtered = entries.filter(
        (e) => (e.tags || []).includes(tag) || (e.type || []).includes(tag)
      );
      if (heading) heading.textContent = `Posts tagged \u201C${tag}\u201D`;
      if (sub) sub.textContent = `${filtered.length} entr${filtered.length === 1 ? "y" : "ies"}`;
    } else if (category) {
      filtered = entries.filter((e) => e.category === category);
      if (heading) heading.textContent = category;
      if (sub) sub.textContent = `${filtered.length} entr${filtered.length === 1 ? "y" : "ies"}`;
    } else {
      if (heading) heading.textContent = "All posts";
      if (sub) sub.textContent = `${filtered.length} entries`;
    }

    ledger.innerHTML = "";

    if (filtered.length === 0) {
      ledger.innerHTML = "<p>Nothing matches this filter yet.</p>";
      return;
    }

    filtered
      .slice()
      .sort((a, b) => b.sortYear - a.sortYear)
      .forEach((entry, i) => {
        const row = document.createElement("article");
        row.className = "ledger-entry";
        row.innerHTML = ledgerRowHTML(entry, i);
        ledger.appendChild(row);
      });
  } catch (err) {
    console.error("Could not load timeline data:", err);
    ledger.innerHTML =
      "<p>Could not load post data. If you're viewing this file directly from disk, run it through a local server (e.g. <code>python -m http.server</code>) — browsers block JSON loading from <code>file://</code> URLs.</p>";
  }
});
