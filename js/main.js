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
