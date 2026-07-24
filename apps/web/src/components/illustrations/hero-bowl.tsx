export function HeroBowlIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 480"
      className={className}
      role="img"
      aria-label="Bol de repas équilibré avec poulet, riz et légumes"
    >
      <defs>
        <linearGradient id="hb-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#efe6d8" />
          <stop offset="100%" stopColor="#e3d5bd" />
        </linearGradient>
        <linearGradient id="hb-bowl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1efe9" />
        </linearGradient>
        <linearGradient id="hb-chicken" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2a765" />
          <stop offset="100%" stopColor="#c9873f" />
        </linearGradient>
        <radialGradient id="hb-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="640" height="480" rx="32" fill="url(#hb-bg)" />

      {/* small side bowl */}
      <ellipse cx="120" cy="365" rx="95" ry="34" fill="url(#hb-shadow)" />
      <circle cx="120" cy="330" r="78" fill="url(#hb-bowl)" stroke="#e7ded0" strokeWidth="2" />
      <circle cx="120" cy="330" r="60" fill="#d98c3f" opacity="0.85" />
      <circle cx="100" cy="316" r="9" fill="#4f7a3c" />
      <circle cx="140" cy="322" r="7" fill="#4f7a3c" />
      <circle cx="118" cy="345" r="8" fill="#4f7a3c" />
      <circle cx="145" cy="345" r="6" fill="#c0472f" />

      {/* main bowl */}
      <ellipse cx="400" cy="410" rx="220" ry="46" fill="url(#hb-shadow)" />
      <circle cx="390" cy="255" r="205" fill="url(#hb-bowl)" stroke="#e7ded0" strokeWidth="3" />
      <circle cx="390" cy="255" r="182" fill="#f4ecd8" />

      {/* rice base */}
      <path
        d="M215 255a175 175 0 0 1 350 0a175 175 0 0 1-350 0Z"
        fill="#f7f1e2"
      />
      {Array.from({ length: 40 }).map((_, i) => {
        const angle = (i / 40) * Math.PI * 2;
        const r = 60 + ((i * 37) % 110);
        const x = 390 + Math.cos(angle) * r;
        const y = 255 + Math.sin(angle) * r * 0.62;
        return <ellipse key={i} cx={x} cy={y} rx="3.2" ry="2" fill="#e9dfc4" opacity="0.8" />;
      })}

      {/* broccoli cluster */}
      <g>
        <circle cx="300" cy="185" r="26" fill="#3f7d4a" />
        <circle cx="322" cy="172" r="22" fill="#4c8f56" />
        <circle cx="278" cy="172" r="20" fill="#4c8f56" />
        <circle cx="300" cy="160" r="18" fill="#57a061" />
        <rect x="292" y="195" width="16" height="26" rx="6" fill="#cdd9a8" />
      </g>

      {/* carrots */}
      <g>
        <path d="M470 195 L500 150" stroke="#e08a2e" strokeWidth="14" strokeLinecap="round" />
        <path d="M488 210 L522 172" stroke="#e79643" strokeWidth="13" strokeLinecap="round" />
        <path d="M456 170 L462 150" stroke="#57a061" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* grilled chicken pieces */}
      <g>
        <rect x="330" y="255" width="105" height="60" rx="18" fill="url(#hb-chicken)" />
        <rect x="360" y="300" width="90" height="55" rx="18" fill="url(#hb-chicken)" opacity="0.95" />
        <rect x="300" y="300" width="70" height="48" rx="16" fill="url(#hb-chicken)" opacity="0.9" />
        <path d="M345 270 l70 20 M350 285 l68 18" stroke="#7a4d20" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
      </g>

      {/* herb garnish */}
      <circle cx="255" cy="290" r="4" fill="#3f7d4a" />
      <circle cx="270" cy="305" r="3.5" fill="#3f7d4a" />
      <circle cx="245" cy="270" r="3" fill="#3f7d4a" />
      <circle cx="480" cy="270" r="4" fill="#3f7d4a" />

      {/* cherry tomatoes */}
      <circle cx="240" cy="230" r="14" fill="#c0472f" />
      <circle cx="235" cy="225" r="4" fill="#e8735a" opacity="0.7" />
      <circle cx="500" cy="235" r="12" fill="#c0472f" />
    </svg>
  );
}
