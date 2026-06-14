/* =========================================================
   Shared site behaviour: mobile nav toggle + submenu taps.
   Called once the header partial has been injected
   (see js/partials.js).
   ========================================================= */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (toggle && nav && !toggle.dataset.wired) {
    toggle.dataset.wired = "true";
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // On touch devices, tapping a parent item with a submenu should
  // expand the submenu rather than navigate, on the first tap.
  document.querySelectorAll(".site-nav .has-children > a").forEach((link) => {
    if (link.dataset.wired) return;
    link.dataset.wired = "true";
    link.addEventListener("click", (e) => {
      const parent = link.parentElement;
      const isMobile = window.matchMedia("(max-width: 860px)").matches;
      if (isMobile && !parent.classList.contains("is-open")) {
        e.preventDefault();
        document.querySelectorAll(".site-nav .has-children.is-open")
          .forEach((el) => el.classList.remove("is-open"));
        parent.classList.add("is-open");
      }
    });
  });

  // Highlight the current page in the nav, based on
  // <body data-page="...">
  const current = document.body.dataset.page;
  if (current) {
    const link = document.querySelector(`.site-nav a[data-page="${current}"]`);
    if (link) link.setAttribute("aria-current", "page");
  }
}

/* =========================================================
   On article pages with a .citation-box, auto-fill the parts
   that don't need to be hand-maintained: the page title (from
   <title>, with the " — Hindu Genocide" suffix stripped), the
   page's own URL, and today's date as the "accessed" date.
   The "Originally published" date is the only part left for
   hand-editing, since a static page has no other source for it.
   ========================================================= */
function initCitation() {
  const box = document.querySelector(".citation-box");
  if (!box) return;

  const titleEl = box.querySelector(".citation-box__title");
  const urlEl = box.querySelector(".citation-box__url");
  const accessedEl = box.querySelector(".citation-box__accessed");

  if (titleEl) {
    titleEl.textContent = document.title.replace(/\s*[—-]\s*Hindu Genocide\s*$/, "");
  }
  if (urlEl) {
    urlEl.textContent = window.location.href;
    urlEl.setAttribute("href", window.location.href);
  }
  if (accessedEl) {
    accessedEl.textContent = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}
