"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  distance?: number; // px to travel, default 28
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 28,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Start visible on SSR; JS will hide then animate in once mounted
  const [ready, setReady] = useState(false);

  const getTransform = () => {
    if (direction === "up")    return `translateY(${distance}px)`;
    if (direction === "left")  return `translateX(-${distance}px)`;
    if (direction === "right") return `translateX(${distance}px)`;
    return "none";
  };

  useEffect(() => {
    setReady(true);
    const el = ref.current;
    if (!el) return;

    // Apply hidden state now that JS is running
    el.style.opacity = "0";
    el.style.transform = getTransform();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transition = `opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)`;
          el.style.transitionDelay = `${delay}ms`;
          el.style.opacity = "1";
          el.style.transform = "none";
          // Animate in only once: stop observing after reveal
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={ready ? { willChange: "opacity, transform" } : undefined}
    >
      {children}
    </div>
  );
}
