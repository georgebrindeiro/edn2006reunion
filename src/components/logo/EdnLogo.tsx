// src/components/logo/EdnLogo.tsx
// Hand-traced from the original Escola das Nações uniform logo
// Three stick figures holding hands — left is dark, center is mid, right is outlined

import { cn } from "@/lib/utils";

interface EdnLogoProps {
  className?: string;
  /** Size in pixels (applied to both width and height proportionally) */
  size?: number;
  /** Color variant */
  variant?: "navy" | "white" | "steel";
  /** Show text below figures */
  showText?: boolean;
}

const COLORS = {
  navy:  { dark: "#1a2744", mid: "#4a6080", light: "#c8d6e8", stroke: "#1a2744" },
  white: { dark: "#ffffff", mid: "#c8d6e8", light: "#ffffff",  stroke: "#ffffff" },
  steel: { dark: "#4a6080", mid: "#7a96b8", light: "#c8d6e8", stroke: "#4a6080" },
};

export function EdnLogo({
  className,
  size = 120,
  variant = "navy",
  showText = true,
}: EdnLogoProps) {
  const c = COLORS[variant];
  const aspect = 1.4; // width-to-height ratio
  const w = size * aspect;
  const h = size;

  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)}>
      <svg
        viewBox="0 0 140 100"
        width={w}
        height={h}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Escola das Nações — três figuras de mãos dadas"
        role="img"
      >
        {/* ── Left figure (darkest) ─────────────────────────────────── */}
        <g transform="translate(18, 0)">
          {/* Head */}
          <circle cx="18" cy="16" r="9" fill={c.dark} />
          {/* Body */}
          <line x1="18" y1="25" x2="18" y2="60" stroke={c.dark} strokeWidth="5" strokeLinecap="round" />
          {/* Left arm */}
          <line x1="18" y1="38" x2="2"  y2="52" stroke={c.dark} strokeWidth="4" strokeLinecap="round" />
          {/* Right arm — reaches to center figure */}
          <line x1="18" y1="38" x2="36" y2="48" stroke={c.dark} strokeWidth="4" strokeLinecap="round" />
          {/* Left leg */}
          <line x1="18" y1="60" x2="8"  y2="82" stroke={c.dark} strokeWidth="4" strokeLinecap="round" />
          {/* Right leg */}
          <line x1="18" y1="60" x2="28" y2="82" stroke={c.dark} strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* ── Center figure (mid-tone, slightly cross-hatched feel) ─── */}
        <g transform="translate(36, 0)">
          {/* Head */}
          <circle cx="18" cy="16" r="9" fill={c.mid} />
          {/* Body */}
          <line x1="18" y1="25" x2="18" y2="60" stroke={c.mid} strokeWidth="5" strokeLinecap="round" />
          {/* Left arm — holds left figure */}
          <line x1="18" y1="38" x2="0"  y2="48" stroke={c.mid} strokeWidth="4" strokeLinecap="round" />
          {/* Right arm — holds right figure */}
          <line x1="18" y1="38" x2="36" y2="48" stroke={c.mid} strokeWidth="4" strokeLinecap="round" />
          {/* Left leg */}
          <line x1="18" y1="60" x2="8"  y2="82" stroke={c.mid} strokeWidth="4" strokeLinecap="round" />
          {/* Right leg */}
          <line x1="18" y1="60" x2="28" y2="82" stroke={c.mid} strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* ── Right figure (lightest / outlined) ───────────────────── */}
        <g transform="translate(54, 0)">
          {/* Head */}
          <circle cx="18" cy="16" r="9" fill={c.light} stroke={c.stroke} strokeWidth="1.5" />
          {/* Body */}
          <line x1="18" y1="25" x2="18" y2="60" stroke={c.stroke} strokeWidth="5" strokeLinecap="round" />
          {/* Left arm — holds center */}
          <line x1="18" y1="38" x2="0"  y2="48" stroke={c.stroke} strokeWidth="4" strokeLinecap="round" />
          {/* Right arm — raised outward */}
          <line x1="18" y1="38" x2="36" y2="28" stroke={c.stroke} strokeWidth="4" strokeLinecap="round" />
          {/* Left leg */}
          <line x1="18" y1="60" x2="8"  y2="82" stroke={c.stroke} strokeWidth="4" strokeLinecap="round" />
          {/* Right leg */}
          <line x1="18" y1="60" x2="28" y2="82" stroke={c.stroke} strokeWidth="4" strokeLinecap="round" />
        </g>
      </svg>

      {showText && (
        <div className="text-center leading-tight">
          <p
            className="font-body tracking-[0.25em] uppercase text-[0.55em]"
            style={{ fontSize: size * 0.085, color: c.dark === "#ffffff" ? "#ffffff" : c.mid }}
          >
            World Citizens
          </p>
          <p
            className="font-display font-bold tracking-wide"
            style={{ fontSize: size * 0.13, color: c.dark }}
          >
            Escola das Nações
          </p>
        </div>
      )}
    </div>
  );
}
