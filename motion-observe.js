/* ============================================================
   motion-observe.js — no-React reveal driver for the static pages
   (case studies + cv.html). Mirrors the useReveal hook from motion.jsx:
   toggles .is-revealed on .reveal elements once, via IntersectionObserver.

   - Respects prefers-reduced-motion (reveals immediately, no movement).
   - Reveals each element once, then stops observing it.
   - Optional [data-reveal-group] container: auto-staggers its direct
     .reveal children via --reveal-delay (using the --motion-stagger token),
     mirroring <RevealGroup>. Author-set --reveal-delay is left untouched.

   Dormant by design: it only acts on elements that already carry .reveal —
   none are added to the static pages yet. Pairs with tokens/motion.css.
   ============================================================ */
(function () {
  "use strict";

  function init() {
    var nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;

    var prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Auto-stagger direct .reveal children of any [data-reveal-group].
    var stagger =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--motion-stagger"
        ),
        10
      ) || 60;
    document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
      group.querySelectorAll(":scope > .reveal").forEach(function (el, i) {
        if (!el.style.getPropertyValue("--reveal-delay")) {
          el.style.setProperty("--reveal-delay", i * stagger + "ms");
        }
      });
    });

    if (prefersReduced || !("IntersectionObserver" in window)) {
      nodes.forEach(function (el) {
        el.classList.add("is-revealed");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    nodes.forEach(function (el) {
      io.observe(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
