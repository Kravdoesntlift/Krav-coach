"use client";

import { useEffect, useRef } from "react";

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

  const getTransform = () => {
    if (direction === "up")    return `translateY(${distance}px)`;
    if (direction === "left")  return `translateX(-${distance}px)`;
    if (direction === "right") return `translateX(${distance}px)`;
    return "none";
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const initialTransform = getTransform();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Animate in
          el.style.transition = `opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)`;
          el.style.transitionDelay = `${delay}ms`;
          el.style.opacity = "1";
          el.style.transform = "translate(0,0)";
        } else {
          // Reset instantly (no transition) so it replays on next scroll
          el.style.transition = "none";
          el.style.transitionDelay = "0ms";
          el.style.opacity = "0";
          el.style.transform = initialTransform;
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: getTransform(),
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
