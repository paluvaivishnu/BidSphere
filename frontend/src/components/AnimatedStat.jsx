import { useState, useEffect, useRef } from 'react';

/**
 * AnimatedStat — counts from 0 to `value` on mount.
 * - ease-out-quad easing for natural feel
 * - Duration: 1500ms (configurable)
 * - Bounces in with stat-enter CSS class
 *
 * Props:
 *   value    {number|string} — if string (e.g. "₹1,20,000") renders as-is; if number, animates
 *   label    {string}
 *   icon     {string}
 *   accent   {string}        — hex color for value text
 *   sub      {string}        — small subtitle
 *   prefix   {string}        — prepend to number (e.g. "₹")
 *   duration {number}        — ms, default 1500
 */
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

const AnimatedStat = ({
  value,
  label,
  icon,
  accent = '#0071e3',
  sub,
  prefix = '',
  duration = 1500,
}) => {
  const isNumber = typeof value === 'number';
  const [displayed, setDisplayed] = useState(0);
  const [entered,   setEntered]   = useState(false);
  const rafRef   = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    // Stagger entry bounce
    const t = setTimeout(() => setEntered(true), 80);
    if (!isNumber) return () => clearTimeout(t);

    startRef.current = null;
    cancelAnimationFrame(rafRef.current);

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed  = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutQuad(progress);
      setDisplayed(Math.round(value * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(value);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  const displayValue = isNumber
    ? `${prefix}${displayed.toLocaleString('en-IN')}`
    : value;

  // Scale font size down for long values so they stay inside the card
  const len = String(displayValue).length;
  const fontSize = len > 16 ? 14 : len > 13 ? 16 : len > 10 ? 19 : len > 7 ? 22 : 26;

  return (
    <div
      className={`admin-stat-card card ${entered ? 'stat-enter' : ''}`}
      style={{
        borderLeft: `3px solid ${accent}`,
        opacity: entered ? 1 : 0,
        willChange: 'transform, opacity',
      }}
    >
      <div className="asc-icon" style={{ fontSize: 32 }}>{icon}</div>
      <div className="asc-right">
        <div
          className="asc-value"
          style={{ color: accent, fontVariantNumeric: 'tabular-nums', fontSize }}
        >
          {displayValue}
        </div>
        <div className="asc-label">{label}</div>
        {sub && <div className="asc-sub">{sub}</div>}
      </div>
    </div>
  );
};

export default AnimatedStat;
