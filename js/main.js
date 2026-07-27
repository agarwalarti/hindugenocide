/* =========================================================
   Shared site behaviour — loaded on every page.
   Depends on nothing; safe to defer.
   ========================================================= */

/* ---------------------------------------------------------
   initNav — mobile toggle + desktop submenu hover delay
   Called from partials.js after the header partial loads,
   so the nav elements are guaranteed to exist.
   --------------------------------------------------------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav    = document.querySelector(".site-nav");

  /* --- Mobile hamburger toggle --- */
  if (toggle && nav && !toggle.dataset.wired) {
    toggle.dataset.wired = "true";
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* --- Desktop submenu hover with delay ---
     CSS :hover loses state the moment the cursor leaves the
     parent <span> — even mid-travel to the dropdown. Instead,
     we add/remove an .is-open class via JS, with a 200ms grace
     period on hide so the cursor has time to reach the submenu.
     The CSS rule:
       .site-nav .has-children.is-open .submenu { display: block; }
     must also exist (add it to css/style.css near the .submenu rules).
  --- */
  document.querySelectorAll(".site-nav .has-children").forEach((parent) => {
    if (parent.dataset.submenuWired) return;
    parent.dataset.submenuWired = "true";

    const submenu = parent.querySelector(".submenu");
    if (!submenu) return;

    let hideTimer = null;

    const show = () => {
      clearTimeout(hideTimer);
      parent.classList.add("is-open");
    };

    const scheduleHide = () => {
      hideTimer = setTimeout(() => parent.classList.remove("is-open"), 200);
    };

    /* Hovering the parent or submenu keeps it open;
       leaving either schedules a hide. */
    parent.addEventListener("mouseenter", show);
    parent.addEventListener("mouseleave", scheduleHide);
    submenu.addEventListener("mouseenter", show);
    submenu.addEventListener("mouseleave", scheduleHide);
  });

  /* --- Touch devices ---
     First tap on a parent-with-submenu opens the dropdown;
     second tap (or tap elsewhere) closes it / navigates.
  --- */
  document.querySelectorAll(".site-nav .has-children > a").forEach((link) => {
    if (link.dataset.touchWired) return;
    link.dataset.touchWired = "true";

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

  /* --- Current page highlight ---
     Matches <body data-page="..."> against [data-page] in the nav.
  --- */
  const current = document.body.dataset.page;
  if (current) {
    const link = document.querySelector(`.site-nav a[data-page="${current}"]`);
    if (link) link.setAttribute("aria-current", "page");
  }
}

/* ---------------------------------------------------------
   initCitation — auto-fills title, URL, and access date
   in the .citation-box on article pages.
   --------------------------------------------------------- */
function initCitation() {
  const box = document.querySelector(".citation-box");
  if (!box) return;

  const titleEl    = box.querySelector(".citation-box__title");
  const urlEl      = box.querySelector(".citation-box__url");
  const accessedEl = box.querySelector(".citation-box__accessed");

  if (titleEl) {
    titleEl.textContent = document.title.replace(/\s*[—\-]\s*Hindu Genocide\s*$/, "");
  }
  if (urlEl) {
    urlEl.textContent = window.location.href;
    urlEl.setAttribute("href", window.location.href);
  }
  if (accessedEl) {
    accessedEl.textContent = new Date().toLocaleDateString("en-US", {
      year:  "numeric",
      month: "long",
      day:   "numeric",
    });
  }
}
