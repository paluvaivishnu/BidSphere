import { useState, useEffect, useRef } from 'react';

/**
 * AnimatedPrice — smoothly counts up to a new price value.
 * - Eases out cubically for a natural deceleration feel
 * - Shows a floating "+₹X" badge when price increases
 * - Duration: ~800ms
 *
 * Props:
 *   value       {number}  — target price value
 *   prefix      {string}  — default "₹"
 *   className   {string}  — CSS class(es) for the price span
 *   style       {object}  — inline style for the price span
 *   duration    {number}  — animation ms (default 800)
 *   showBadge   {boolean} — show "+₹X" float on increase (default true)
 */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const AnimatedPrice = ({
  value,
  prefix = '₹',
  className = '',
  style = {},
  duration = 800,
  showBadge = true,
}) => {
  const [displayed, setDisplayed]   = useState(value);
  const [animKey,   setAnimKey]     = useState(0);
  const [badge,     setBadge]       = useState(null);  // { text, key }
  const prevRef   = useRef(value);
  const rafRef    = useRef(null);
  const startRef  = useRef(null);
  const fromRef   = useRef(value);

  useEffect(() => {
    if (value === prevRef.current) return;

    const from = prevRef.current;
    const to   = value;
    const diff = to - from;

    // Show increment badge for increases
    if (showBadge && diff > 0) {
      setBadge({ text: `+${prefix}${diff.toLocaleString('en-IN')}`, key: Date.now() });
      setTimeout(() => setBadge(null), 1500);
    }

    // Trigger pop flash
    setAnimKey(k => k + 1);

    // Animate the number
    fromRef.current  = from;
    startRef.current = null;
    cancelAnimationFrame(rafRef.current);

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed  = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutCubic(progress);
      setDisplayed(Math.round(from + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(to);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    prevRef.current = value;

    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        key={animKey}
        className={`${className} ${animKey > 0 ? 'price-bid-pop' : ''}`}
        style={style}
      >
        {prefix}{displayed.toLocaleString('en-IN')}
      </span>
      {badge && (
        <span
          key={badge.key}
          className="price-increment-float"
          aria-hidden="true"
        >
          {badge.text}
        </span>
      )}
    </span>
  );
};

export default AnimatedPrice;
