/* =========================================================
   Injects the shared header and footer into every page.
   Each page needs:
     <div id="site-header"></div>  ...  <div id="site-footer"></div>
   and <body data-page="..."> matching the nav's data-page values,
   so the current section gets highlighted automatically.

   NOTE: fetch() of local files is blocked under file:// in most
   browsers. Run the site through a local server while editing,
   e.g.  python3 -m http.server  — then open http://localhost:8000
   ========================================================= */
async function loadPartial(selector, url) {
  const target = document.querySelector(selector);
  if (!target) return;
  try {
    const res = await fetch(url);
    target.innerHTML = await res.text();
  } catch (err) {
    console.error(`Could not load ${url}:`, err);
    target.innerHTML = `<p style="padding:1rem;font-family:monospace;">
      Could not load ${url}. If you opened this file directly,
      run a local server (e.g. <code>python3 -m http.server</code>)
      and reload via http://localhost.
    </p>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    loadPartial("#site-header", "partials/header.html"),
    loadPartial("#site-footer", "partials/footer.html"),
  ]);
  initNav();
  // Let other scripts (e.g. timeline.js) know the chrome is ready.
  document.dispatchEvent(new CustomEvent("partials:loaded"));
});
