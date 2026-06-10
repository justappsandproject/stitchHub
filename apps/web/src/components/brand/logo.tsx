import { cn } from '@/lib/utils';

/**
 * StitchHub logo mark: a thread forming an "S" in running-stitch dashes,
 * a needle passing through it, and digital nodes at the thread ends.
 *
 * The needle inherits `currentColor` so the mark adapts to light/dark
 * surfaces; thread (gold) and nodes (emerald) are fixed brand colors.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-8 w-8', className)}
      aria-label="StitchHub"
    >
      {/* Thread: stitched S-curve */}
      <path
        d="M33 11 C27 5.5 15.5 7 15.5 14.5 C15.5 21 22 22 24 22.5 C26 23 32.5 24.5 32.5 31 C32.5 38.5 21 40 15 34.5"
        stroke="#D4A017"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeDasharray="5.5 4"
      />
      {/* Needle shaft */}
      <path
        d="M27.5 3 L43 18.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Needle eye */}
      <circle
        cx="30"
        cy="5.5"
        r="1.7"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {/* Digital nodes at thread ends */}
      <circle cx="33" cy="11" r="2.4" fill="#10B981" />
      <circle cx="15" cy="34.5" r="2.4" fill="#10B981" />
    </svg>
  );
}

/**
 * Full logo: mark + sans-serif wordmark with stitch-accented "Hub".
 */
export function Logo({
  className,
  markClassName,
  wordmarkClassName,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      <span
        className={cn(
          'font-sans text-xl font-bold tracking-tight',
          wordmarkClassName,
        )}
      >
        Stitch
        <span className="text-gold">Hub</span>
      </span>
    </span>
  );
}
