import { cn } from "cn";

import { APP_CONFIG } from "@/config/app-config";

type BrandMarkProps = React.ComponentProps<"svg"> & {
  /** Renders the mark in a single inherited color, for use on tinted panels. */
  mono?: boolean;
};

/**
 * Trygc CRM Hub mark. Vector traced from the source brand artwork so it stays
 * crisp at every size and keeps a transparent background on any surface.
 */
export function BrandMark({ mono = false, className, ...props }: BrandMarkProps) {
  const orange = mono ? "currentColor" : "#EA620A";
  const purple = mono ? "currentColor" : "#52348C";

  return (
    <svg
      viewBox="0 0 572 1112"
      fill="none"
      role="img"
      aria-label={`${APP_CONFIG.name} logo`}
      className={cn("h-6 w-auto", className)}
      {...props}
    >
      <circle cx="270.5" cy="312.5" r="171.25" stroke={orange} strokeWidth="115.5" />
      <path d="M484.25 840A213.75 213.75 0 1 1 270.5 626.25" stroke={purple} strokeWidth="114.5" />
      <g fill={purple}>
        <circle cx="500.5" cy="70" r="70" />
        <path d="M466 116 L471 167 L527 116 Z" />
      </g>
    </svg>
  );
}
