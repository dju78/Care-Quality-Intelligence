import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import CountUp from "react-countup";

/**
 * Native IntersectionObserver hook — fires once when the element scrolls into
 * view. Used to trigger the KPI counters. Falls back to "in view" where the API
 * is unavailable (e.g. print/export contexts).
 */
export function useInView<T extends Element = HTMLDivElement>(options: IntersectionObserverInit = { threshold: 0.35 }) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // Observe once on mount; options are read at that point by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ref, inView };
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

/** Fade-and-rise a block into view on scroll (Framer Motion `whileInView` uses IntersectionObserver under the hood). */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/** Container whose direct <StaggerItem> children animate in sequence when scrolled into view. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}

/**
 * Animated KPI number. Parses an optional prefix/suffix (e.g. "92%", "4.05").
 * Counts up 0 → value once when it first mounts (i.e. after data loads), then —
 * thanks to `preserveValue` — animates smoothly from the previous value to the
 * new one when a filter changes, rather than restarting from zero. It does not
 * re-run on scroll or on unrelated re-renders. Renders verbatim for
 * reduced-motion users and for non-numeric values (e.g. "—").
 */
export function CountingNumber({ value, duration = 1.6, className }: { value: string | number; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  const raw = String(value);
  const match = raw.match(/^(\D*?)(-?\d+(?:\.\d+)?)(\D*)$/);
  if (!match || reduce) return <span className={className}>{raw}</span>;
  const [, prefix, digits, suffix] = match;
  const num = parseFloat(digits);
  const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
  return (
    <span className={className}>
      <CountUp end={num} duration={duration} decimals={decimals} separator="," prefix={prefix} suffix={suffix} preserveValue />
    </span>
  );
}
