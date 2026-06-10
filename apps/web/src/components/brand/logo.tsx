import { cn } from '@/lib/utils';

/**
 * StitchHub logo mark: a thread forming an "S" in running-stitch dashes,
 * a needle passing through it, and digital nodes at the thread ends.
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
      <defs>
        <linearGradient id="thread-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="node-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#FB7185" />
        </linearGradient>
      </defs>
      <path
        d="M33 11 C27 5.5 15.5 7 15.5 14.5 C15.5 21 22 22 24 22.5 C26 23 32.5 24.5 32.5 31 C32.5 38.5 21 40 15 34.5"
        stroke="url(#thread-gradient)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeDasharray="5.5 4"
      />
      <path
        d="M27.5 3 L43 18.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle
        cx="30"
        cy="5.5"
        r="1.7"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="33" cy="11" r="2.4" fill="url(#node-gradient)" />
      <circle cx="15" cy="34.5" r="2.4" fill="url(#node-gradient)" />
    </svg>
  );
}

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
          'font-heading text-xl font-bold tracking-tight',
          wordmarkClassName,
        )}
      >
        Stitch
        <span className="text-gradient">Hub</span>
      </span>
    </span>
  );
}
