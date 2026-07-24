type MealVariant = "tajine" | "rice" | "seffa" | "brochette" | "couscous";

const palettes: Record<MealVariant, { bg: string; plate: string; accent: string; accent2: string }> = {
  tajine: { bg: "#f0e4d3", plate: "#fbf5e8", accent: "#c9873f", accent2: "#4c8f56" },
  rice: { bg: "#e9ecda", plate: "#fbf5e8", accent: "#e9c86b", accent2: "#4c8f56" },
  seffa: { bg: "#efe0c8", plate: "#fbf5e8", accent: "#d9b26a", accent2: "#8a5a2b" },
  brochette: { bg: "#e7d9c3", plate: "#fbf5e8", accent: "#c9873f", accent2: "#57a061" },
  couscous: { bg: "#ece3cd", plate: "#fbf5e8", accent: "#e2a765", accent2: "#c0472f" },
};

export function MealThumb({ variant, className }: { variant: MealVariant; className?: string }) {
  const p = palettes[variant];
  return (
    <svg viewBox="0 0 160 160" className={className} role="img" aria-label={variant}>
      <rect width="160" height="160" fill={p.bg} />
      <circle cx="80" cy="82" r="58" fill={p.plate} stroke="#e7ded0" strokeWidth="2" />
      {variant === "tajine" && (
        <>
          <circle cx="80" cy="82" r="42" fill="#f4ecd8" />
          <circle cx="65" cy="70" r="14" fill={p.accent} />
          <circle cx="95" cy="75" r="12" fill={p.accent} opacity="0.9" />
          <circle cx="78" cy="98" r="11" fill={p.accent} opacity="0.85" />
          <circle cx="55" cy="95" r="7" fill={p.accent2} />
          <circle cx="102" cy="98" r="6" fill={p.accent2} />
        </>
      )}
      {variant === "rice" && (
        <>
          <circle cx="80" cy="82" r="42" fill="#f7f1e2" />
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const x = 80 + Math.cos(a) * 24;
            const y = 82 + Math.sin(a) * 18;
            return <ellipse key={i} cx={x} cy={y} rx="3" ry="1.8" fill="#e9dfc4" />;
          })}
          <circle cx="68" cy="70" r="8" fill={p.accent2} />
          <circle cx="92" cy="76" r="7" fill={p.accent2} />
          <circle cx="80" cy="98" r="6" fill="#c0472f" />
        </>
      )}
      {variant === "seffa" && (
        <>
          <path d="M80 45a37 37 0 0 1 0 74a37 37 0 0 1 0-74Z" fill="#f2e3c4" />
          <circle cx="80" cy="60" r="26" fill={p.accent} opacity="0.5" />
          <circle cx="70" cy="72" r="3.5" fill={p.accent2} />
          <circle cx="88" cy="68" r="3.5" fill={p.accent2} />
          <circle cx="80" cy="85" r="3.5" fill={p.accent2} />
          <circle cx="94" cy="88" r="3" fill="#c9873f" />
        </>
      )}
      {variant === "brochette" && (
        <>
          <circle cx="80" cy="82" r="42" fill="#f4ecd8" />
          <line x1="45" y1="70" x2="118" y2="90" stroke="#c9873f" strokeWidth="4" strokeLinecap="round" />
          <circle cx="58" cy="73" r="10" fill={p.accent} />
          <circle cx="78" cy="78" r="10" fill="#b5652f" />
          <circle cx="98" cy="83" r="10" fill={p.accent} />
          <circle cx="55" cy="98" r="3" fill={p.accent2} />
          <circle cx="65" cy="102" r="3" fill={p.accent2} />
        </>
      )}
      {variant === "couscous" && (
        <>
          <circle cx="80" cy="82" r="42" fill="#f7f1e2" />
          <circle cx="80" cy="80" r="24" fill="#f0dfa8" />
          <circle cx="70" cy="68" r="8" fill={p.accent} />
          <circle cx="92" cy="72" r="7" fill={p.accent2} />
          <circle cx="80" cy="94" r="6" fill="#57a061" />
          <circle cx="60" cy="90" r="5" fill="#e2a765" />
        </>
      )}
    </svg>
  );
}

export type { MealVariant };
