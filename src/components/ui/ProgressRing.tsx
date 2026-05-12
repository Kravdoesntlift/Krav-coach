"use client";

import { useEffect, useState } from "react";

interface Props {
  value: number;      // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export default function ProgressRing({
  value,
  size = 120,
  strokeWidth = 7,
  label,
  sublabel,
}: Props) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 60);
    return () => clearTimeout(t);
  }, [value]);

  const isPerfect = value >= 100;
  const color = isPerfect ? "#4ade80" : "#C9A84C";

  // Glow filter id — unique per instance to avoid conflicts
  const glowId = `ring-glow-${size}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            filter={animated > 0 ? `url(#${glowId})` : undefined}
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1), stroke 0.4s",
            }}
          />
        </svg>

        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-black tabular-nums leading-none"
            style={{ fontSize: size * 0.22, color }}
          >
            {Math.round(animated)}%
          </span>
          {label && (
            <span className="text-zinc-500 leading-none mt-1" style={{ fontSize: size * 0.1 }}>
              {label}
            </span>
          )}
        </div>
      </div>
      {sublabel && <p className="text-zinc-500 text-xs">{sublabel}</p>}
    </div>
  );
}
