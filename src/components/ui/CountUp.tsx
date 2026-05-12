"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;       // ms, default 900
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export default function CountUp({
  value,
  duration = 900,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
}: Props) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;

    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(fromRef.current + (value - fromRef.current) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString("pt-PT");

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
