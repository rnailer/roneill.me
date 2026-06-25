/* ============================================================
   motion.jsx — motion-token reveal system for roneill.me
   Adapted from motion.ts + Reveal.tsx for this repo's no-build,
   in-browser Babel setup:
     • hooks source from the global React (no ESM imports),
     • TypeScript types stripped, logic identical,
     • components attach to window.RonMotion (consumed like RonUI/RonBrutal).
   Pairs with tokens/motion.css (.reveal / .is-revealed).
   ============================================================ */
const { useState, useEffect, useRef, useMemo, Children, cloneElement, isValidElement } = React;

/* ------------------------------------------------------------
   useReveal — one-shot entrance via IntersectionObserver. 0 dependencies.
   Returns a ref + boolean. Pair with the .reveal / .is-revealed CSS.
   - Respects prefers-reduced-motion (reveals immediately, no transition).
   - once: true (default) disconnects after first entry.
   ------------------------------------------------------------ */
function useReveal(options) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setRevealed(true);
      return;
    }

    const once = options?.once ?? true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          if (once) io.disconnect();
        } else if (!once) {
          setRevealed(false);
        }
      },
      {
        threshold: options?.threshold ?? 0.15,
        // start a touch before the element is fully in view
        rootMargin: options?.rootMargin ?? "0px 0px -10% 0px",
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [options?.threshold, options?.rootMargin, options?.once]);

  return { ref, revealed };
}

/* ------------------------------------------------------------
   useScrollProgress — rAF-throttled scroll progress (0..1). 0 dependencies.
   No ref  -> whole-document progress.  With ref -> that element's pass.
   For a pure reading bar prefer the native `.scroll-progress` CSS utility;
   use this only when you need the value in React state.
   ------------------------------------------------------------ */
function useScrollProgress() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let raf = 0;

    const measure = () => {
      raf = 0;
      const el = ref.current;

      if (!el) {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setProgress(max > 0 ? doc.scrollTop / max : 0);
        return;
      }

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + vh;
      const seen = vh - rect.top;
      setProgress(Math.min(1, Math.max(0, seen / total)));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    if (prefersReduced) {
      setProgress((p) => p || 0);
      return;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return { ref, progress };
}

/* ------------------------------------------------------------
   <Reveal> — single one-shot entrance.
   <Reveal as="h2" delay={60}>Heading</Reveal>
   ------------------------------------------------------------ */
function Reveal({ as: Tag = "div", delay = 0, className = "", children, style }) {
  const { ref, revealed } = useReveal();

  return (
    <Tag
      ref={ref}
      className={`reveal${revealed ? " is-revealed" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={{ ...style, "--reveal-delay": `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------
   <RevealGroup> — staggers its direct <Reveal> children automatically.
   Wrap a headline / body / meta stack; each gets an incremental delay.
   ------------------------------------------------------------ */
function RevealGroup({ as: Tag = "div", stagger = 60, className, children, style }) {
  return (
    <Tag className={className} style={style}>
      {Children.map(children, (child, i) =>
        isValidElement(child)
          ? cloneElement(child, { delay: (child.props.delay ?? 0) + i * stagger })
          : child
      )}
    </Tag>
  );
}

/* ------------------------------------------------------------
   <Typewriter> — types `text` character by character on mount (once,
   never on scroll). The line grows as each char flips display:none ->
   inline, so the block caret trails the last typed character. The final
   word accents in orange (accentLast). \n becomes a line break.
   prefers-reduced-motion: full text immediately, no typing, no caret.
   ------------------------------------------------------------ */
function Typewriter({ text, as: Tag = 'span', accent = true, speed = 45, className, style }){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chars = useMemo(() => {
    const trimmed = text.replace(/\s+$/, '');
    const lastStart = accent ? trimmed.search(/\S+$/) : -1;   // index where the final word begins
    return Array.from(text).map((ch, i) => ({
      ch,
      br: ch === '\n',
      hot: accent && lastStart >= 0 && i >= lastStart && /\S/.test(ch),
    }));
  }, [text, accent]);

  const [n, setN] = useState(reduce ? chars.length : 0);
  const [caret, setCaret] = useState(reduce ? 'off' : 'on');   // on -> fading -> (gone)

  useEffect(() => {
    if (reduce) return;
    if (n < chars.length) {
      const t = setTimeout(() => setN(n + 1), speed);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCaret('fading'), 2500);       // blink ~2-3x, then fade
    return () => clearTimeout(t);
  }, [n, chars.length, speed, reduce]);

  return (
    <Tag className={className} style={style} aria-label={text.replace(/\n/g, ' ')}>
      {chars.map((c, i) => c.br
        ? (i < n ? <br key={i} /> : null)
        : <span key={i} aria-hidden="true" style={{ display: i < n ? 'inline' : 'none', color: c.hot ? 'var(--orange)' : undefined }}>{c.ch}</span>
      )}
      {caret !== 'off' && <span className={'tw-caret' + (caret === 'fading' ? ' tw-done' : '')} aria-hidden="true">▍</span>}
    </Tag>
  );
}

/* ------------------------------------------------------------
   <Decode> — the full text lays out from frame one (the <br> is always
   present, so the name never appears incomplete); only the letters
   scramble through random glyphs and settle left-to-right. No caret.
   The final word settles in orange (accentLast). Spaces, the apostrophe
   and punctuation stay fixed. Once on mount, never on scroll.
   prefers-reduced-motion: full text immediately, no scramble.
   ------------------------------------------------------------ */
function Decode({ text, as: Tag = 'span', accent = true, className, style }){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chars = useMemo(() => {
    const lastStart = accent ? text.replace(/\s+$/, '').search(/\S+$/) : -1;
    return Array.from(text).map((ch, i) => ({
      ch,
      br: ch === '\n',
      hot: accent && lastStart >= 0 && i >= lastStart && /\S/.test(ch),
      scramble: /[a-z0-9]/i.test(ch),
    }));
  }, [text, accent]);

  const [disp, setDisp] = useState(() => chars.map(c => c.ch));

  useEffect(() => {
    if (reduce) return;
    const G = 'abcdefghijkmnpqrstuvwxyz#%&/()=+<>';
    const ivs = [], ts = [];
    chars.forEach((c, i) => {
      if (!c.scramble) return;
      const lock = 200 + i * 45;
      const iv = setInterval(() => setDisp(d => { const n = d.slice(); n[i] = G[Math.floor(Math.random() * G.length)]; return n; }), 40);
      ivs.push(iv);
      ts.push(setTimeout(() => { clearInterval(iv); setDisp(d => { const n = d.slice(); n[i] = c.ch; return n; }); }, lock));
    });
    return () => { ivs.forEach(clearInterval); ts.forEach(clearTimeout); };
  }, [chars, reduce]);

  return (
    <Tag className={className} style={style} aria-label={text.replace(/\n/g, ' ')}>
      {chars.map((c, i) => c.br
        ? <br key={i} />
        : <span key={i} aria-hidden="true" style={{ color: c.hot ? 'var(--orange)' : undefined }}>{disp[i]}</span>
      )}
    </Tag>
  );
}

window.RonMotion = { useReveal, useScrollProgress, Reveal, RevealGroup, Typewriter, Decode };
