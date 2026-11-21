"use client";

import { useEffect, useRef, useState } from "react";
import { DURATION, EASE } from "@/lib/motion";

/**
 * A section that arrives when it is scrolled to.
 *
 * It used to set its own 600ms and its own curve inline, which put every
 * marketing page outside the motion system, and inline styles do not read a
 * media query, so Reduce Motion was ignored on the landing page, the book
 * page and the community page: somebody who had asked the operating system to
 * stop things moving watched everything slide anyway.
 *
 * The transform is now dropped entirely for those people, keeping the fade so
 * the section still announces itself, and willChange is released once the
 * reveal is over rather than leaving every section promoted to its own layer
 * for the life of the page.
 */

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  /** px to travel. */
  distance?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 28,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Visible during server render; hidden only once JS is here to bring it back.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const el = ref.current;
    if (!el) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Arcs: the horizontal arrives before the vertical, so a section rising
    // into place curves rather than slides. Skipped when motion is reduced.
    const from =
      calm || direction === "none"
        ? "none"
        : direction === "up"
        ? `translate3d(-6px, ${distance}px, 0)`
        : direction === "left"
        ? `translate3d(-${distance}px, 4px, 0)`
        : `translate3d(${distance}px, 4px, 0)`;

    el.style.opacity = "0";
    el.style.transform = from;

    const duration = calm ? DURATION.base : DURATION.deliberate;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.style.transition =
          `opacity ${duration}ms ${EASE.entrance}, transform ${duration}ms ${EASE.entrance}`;
        el.style.transitionDelay = `${delay}ms`;
        el.style.opacity = "1";
        el.style.transform = "none";

        // Let the compositor go once the section has landed. Leaving
        // will-change on is a layer per section for the rest of the visit.
        const release = () => {
          el.style.willChange = "auto";
          el.removeEventListener("transitionend", release);
        };
        el.addEventListener("transitionend", release);
        window.setTimeout(release, duration + delay + 120);

        observer.disconnect();
      },
      { threshold: 0.08 },
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
