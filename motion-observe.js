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

  function initReveal() {
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

  /* ----------------------------------------------------------
     Rise — calm character-rise for each [data-rise] H1. The full
     title lays out in final position from frame one (real characters,
     fixed wrapping, no scramble) so there is ZERO reflow and no jump;
     each letter just fades + rises in place with a left-to-right stagger.
     Spaces, punctuation and <br> are placed but don't animate. No caret.
     Accent comes from existing .o spans, else the final word (accentLast),
     and stays orange — case-study H1s are on dark backgrounds.
     prefers-reduced-motion: reveal the full title immediately, no motion.
     ---------------------------------------------------------- */
  function initRise() {
    var heads = document.querySelectorAll("[data-rise]");
    if (!heads.length) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heads.forEach(function (h1) {
      riseHeading(h1, reduce);
    });
  }

  function riseHeading(h1, reduce) {
    // reduced motion: just show the original title, no rebuild, no motion
    if (reduce) {
      h1.classList.remove("tw-pending");
      return;
    }

    // collect chars + accent flags from the existing markup (.o = accent, <br> = break)
    var items = [];
    (function walk(node, accent) {
      Array.prototype.forEach.call(node.childNodes, function (n) {
        if (n.nodeType === 3) {
          for (var k = 0; k < n.nodeValue.length; k++) items.push({ ch: n.nodeValue[k], hot: accent });
        } else if (n.nodeType === 1) {
          if (n.tagName === "BR") items.push({ ch: "\n", br: true, hot: false });
          else walk(n, accent || n.classList.contains("o"));
        }
      });
    })(h1, false);

    // accentLast fallback: no .o accent -> light up the final word
    if (!items.some(function (it) { return it.hot; })) {
      var i = items.length - 1;
      while (i >= 0 && /\s/.test(items[i].ch)) i--;
      while (i >= 0 && !items[i].br && !/\s/.test(items[i].ch)) { items[i].hot = true; i--; }
    }

    // rebuild with the real title in final position. Each WORD is an atomic
    // inline-block (so it never breaks mid-word); inside, letters are
    // inline-block spans that rise, punctuation just sits, spaces/<br> are
    // plain break points. Wrapping is fixed from frame one -> zero reflow.
    h1.setAttribute("aria-label", (h1.textContent || "").replace(/\s+/g, " ").trim());
    h1.textContent = "";

    var STAGGER = 22, DUR = 450;
    var spans = [];
    var word = null;
    function flushWord() { if (word) { h1.appendChild(word); word = null; } }

    items.forEach(function (it, i) {
      if (it.br) { flushWord(); h1.appendChild(document.createElement("br")); return; }
      if (/\s/.test(it.ch)) { flushWord(); h1.appendChild(document.createTextNode(it.ch)); return; }
      if (!word) { word = document.createElement("span"); word.style.display = "inline-block"; word.style.whiteSpace = "nowrap"; }
      var ch = document.createElement("span");
      ch.textContent = it.ch;
      ch.setAttribute("aria-hidden", "true");
      if (it.hot) ch.style.color = "var(--orange)";
      if (/[a-z0-9]/i.test(it.ch)) {           // letters rise; punctuation in a word just sits
        ch.style.display = "inline-block";
        ch.style.opacity = "0";
        ch.style.transform = "translateY(0.4em)";
        ch.style.transition = "opacity " + DUR + "ms var(--ease-out), transform " + DUR + "ms var(--ease-out)";
        ch.style.transitionDelay = (i * STAGGER) + "ms";
        spans.push(ch);
      }
      word.appendChild(ch);
    });
    flushWord();

    // title is in final position now (no reflow on animate) — reveal it
    h1.classList.remove("tw-pending");

    // play the staggered rise after the initial (offset/hidden) state has painted
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        spans.forEach(function (sp) { sp.style.opacity = "1"; sp.style.transform = "translateY(0)"; });
      });
    });
  }

  function start() {
    initReveal();
    initRise();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
