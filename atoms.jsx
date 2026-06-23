/* ============================================================
   atoms.jsx — presentational primitives for the portfolio kit.
   These mirror the design-system components (Button, Tag, Badge,
   MetricStat, SectionIndex, TechLabel, Motif) so the kit previews
   standalone. In production, import them from the DS bundle instead.
   Exported on window.RonUI for the other babel scripts.
   ============================================================ */
const { useState } = React;

function Button({ children, variant = 'solid', size = 'md', href, arrow = false, disabled = false, style, ...rest }) {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 'var(--fs-body-sm)' },
    md: { padding: '12px 20px', fontSize: 'var(--fs-body)' },
    lg: { padding: '16px 28px', fontSize: 'var(--fs-body-lg)' },
  };
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '0.6em',
    fontFamily: 'var(--font-text)', fontWeight: 'var(--w-semibold)',
    fontSize: sizes[size].fontSize, lineHeight: 1, letterSpacing: '0.01em',
    padding: variant === 'ghost' ? '4px 0' : sizes[size].padding,
    border: 'var(--bw) solid transparent', borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer', textDecoration: 'none',
    transition: 'background var(--dur) var(--ease-out), color var(--dur) var(--ease-out), border-color var(--dur) var(--ease-out), transform var(--dur-fast) var(--ease-out)',
    opacity: disabled ? 0.4 : 1, userSelect: 'none',
  };
  const variants = {
    solid:   { background: 'var(--text)', color: 'var(--bg)', borderColor: 'var(--text)' },
    accent:  { background: 'var(--orange)', color: 'var(--on-accent)', borderColor: 'var(--orange)' },
    outline: { background: 'transparent', color: 'var(--text)', borderColor: 'var(--border-strong)' },
    ghost:   { background: 'transparent', color: 'var(--text)', borderColor: 'transparent' },
  };
  const [h, setH] = useState(false);
  const hov = !disabled && h ? {
    solid:   { transform: 'translateY(-1px)', background: 'var(--orange)', borderColor: 'var(--orange)', color: 'var(--on-accent)' },
    accent:  { transform: 'translateY(-1px)', background: 'var(--orange-press)', borderColor: 'var(--orange-press)' },
    outline: { borderColor: 'var(--orange)', color: 'var(--orange)' },
    ghost:   { color: 'var(--orange)' },
  }[variant] : {};
  const Tag = href ? 'a' : 'button';
  return (
    <Tag href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ ...base, ...variants[variant], ...hov, ...style }} {...rest}>
      {children}
      {arrow && <span aria-hidden="true" style={{ display: 'inline-block', transform: h ? 'translateX(3px)' : 'none', transition: 'transform var(--dur) var(--ease-out)' }}>→</span>}
    </Tag>
  );
}

function Tag({ children, tone = 'default', style, ...rest }) {
  const tones = {
    default: { color: 'var(--text-muted)', borderColor: 'var(--border-strong)', background: 'transparent' },
    solid:   { color: 'var(--bg)', borderColor: 'var(--text)', background: 'var(--text)' },
    accent:  { color: 'var(--orange)', borderColor: 'var(--orange)', background: 'transparent' },
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-text)',
      fontWeight: 'var(--w-medium)', fontSize: 'var(--fs-body-sm)', lineHeight: 1, letterSpacing: '0.01em',
      padding: '6px 11px', border: 'var(--bw-hair) solid', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap',
      ...tones[tone], ...style }} {...rest}>{children}</span>
  );
}

function Badge({ children, status = 'available', style, ...rest }) {
  const map = {
    available:   { dot: 'var(--orange)', color: 'var(--text)', border: 'var(--border-strong)', pulse: true },
    shipped:     { dot: 'var(--text)', color: 'var(--text)', border: 'var(--border-strong)' },
    development: { dot: 'var(--grey-400)', color: 'var(--text-muted)', border: 'var(--border)' },
  };
  const s = map[status] || map.available;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6em', fontFamily: 'var(--font-text)',
      fontWeight: 'var(--w-semibold)', fontSize: 'var(--fs-label)', lineHeight: 1, textTransform: 'uppercase',
      letterSpacing: 'var(--track-label)', color: s.color, border: `var(--bw-hair) solid ${s.border}`,
      borderRadius: 'var(--radius-pill)', padding: '7px 12px 7px 11px', whiteSpace: 'nowrap', ...style }} {...rest}>
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
        {s.pulse && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: s.dot, animation: 'ron-badge-pulse 1.9s var(--ease-out) infinite' }} />}
      </span>
      {children}
    </span>
  );
}

function MetricStat({ value, unit, caption, size = 'lg', accentUnit = true, style }) {
  const fs = size === 'lg' ? 'var(--fs-metric)' : 'clamp(2.25rem, 4.5vw, 3.25rem)';
  return (
    <div style={style}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--w-bold)', fontSize: fs,
        lineHeight: 'var(--lh-solid)', letterSpacing: 'var(--track-hero)', color: 'var(--text)',
        fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'baseline' }}>
        <span>{value}</span>{unit != null && <span style={{ color: accentUnit ? 'var(--accent)' : 'inherit' }}>{unit}</span>}
      </div>
      {caption && <div style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--fs-caption)', lineHeight: 'var(--lh-snug)',
        color: 'var(--text-muted)', letterSpacing: '0.02em', marginTop: '0.7em', maxWidth: '22ch' }}>{caption}</div>}
    </div>
  );
}

function SectionIndex({ index, label, total, rule = true, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)', ...style }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--w-bold)', fontSize: 'var(--fs-h3)',
        letterSpacing: 'var(--track-tight)', color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
        {index}{total != null && <span style={{ color: 'var(--text-faint)' }}> / {total}</span>}
      </span>
      {label && <span style={{ fontFamily: 'var(--font-text)', fontWeight: 'var(--w-semibold)', fontSize: 'var(--fs-label)',
        textTransform: 'uppercase', letterSpacing: 'var(--track-label)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>}
      {rule && <span style={{ flex: 1, height: 1, background: 'var(--border)', alignSelf: 'center' }} />}
    </div>
  );
}

function TechLabel({ children, mark = 'none', tone = 'muted', style }) {
  const colors = { muted: 'var(--text-muted)', faint: 'var(--text-faint)', ink: 'var(--text)', accent: 'var(--accent)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5em', fontFamily: 'var(--font-text)',
      fontWeight: 'var(--w-medium)', fontSize: 'var(--fs-tech)', letterSpacing: 'var(--track-tech)',
      lineHeight: 'var(--lh-label)', color: colors[tone], ...style }}>
      {mark === 'slash' && <span style={{ color: 'var(--text-faint)' }}>//</span>}
      {mark === 'plus' && <span style={{ color: 'var(--accent)', letterSpacing: '0.3em', fontWeight: 'var(--w-semibold)' }}>+ + +</span>}
      {children}
    </span>
  );
}

function Motif({ name, src, size = 80, opacity = 1, style, ...rest }) {
  const url = src || `../../assets/motifs/${name}.svg`;
  const dim = typeof size === 'number' ? `${size}px` : size;
  return <img src={url} alt="" aria-hidden="true" style={{ width: dim, height: dim, opacity, display: 'block', pointerEvents: 'none', ...style }} {...rest} />;
}

window.RonUI = { Button, Tag, Badge, MetricStat, SectionIndex, TechLabel, Motif };
