function Chef({ x, tone, wrap }: { x: number; tone: string; wrap: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x="-48" y="148" width="96" height="122" rx="16" fill="#16281d" />
      <rect x="-48" y="148" width="96" height="34" rx="16" fill="#1c3624" />
      <path d="M-34 182h68l6 88h-80Z" fill={wrap} opacity="0.9" />
      <circle cx="0" cy="108" r="38" fill={tone} />
      <path d="M-38 98a38 38 0 0 1 76 0v10c-6-14-70-14-76 0Z" fill={wrap} />
      <rect x="-26" y="70" width="52" height="18" rx="9" fill={wrap} />
      <path d="M-16 122a16 10 0 0 0 32 0" stroke="#00000022" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function KitchenScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 420"
      className={className}
      role="img"
      aria-label="Cheffes cuisinières de GreenBox préparant des repas"
    >
      <defs>
        <linearGradient id="ks-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#20301f" />
          <stop offset="100%" stopColor="#101b12" />
        </linearGradient>
        <linearGradient id="ks-counter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a4a3a" />
          <stop offset="100%" stopColor="#232f22" />
        </linearGradient>
      </defs>

      <rect width="640" height="420" fill="url(#ks-bg)" />
      <circle cx="120" cy="70" r="90" fill="#ffffff" opacity="0.04" />
      <circle cx="520" cy="60" r="70" fill="#ffffff" opacity="0.04" />

      <Chef x={160} tone="#c7936a" wrap="#1f5c3f" />
      <Chef x={320} tone="#d9a97c" wrap="#e7c565" />
      <Chef x={480} tone="#a5714f" wrap="#1f5c3f" />

      <rect x="30" y="270" width="580" height="90" rx="18" fill="url(#ks-counter)" />
      <rect x="30" y="270" width="580" height="10" rx="5" fill="#4a5c48" />

      {/* bowls of food on the counter */}
      {[110, 210, 320, 430, 520].map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy={278} rx="42" ry="12" fill="#000" opacity="0.25" />
          <circle cx={x} cy={266} r="34" fill="#f4ecd8" />
          <circle cx={x} cy={266} r="26" fill={i % 2 === 0 ? "#c9873f" : "#57a061"} opacity="0.9" />
          <circle cx={x - 8} cy={258} r="6" fill="#c0472f" />
          <circle cx={x + 9} cy={262} r="5" fill="#3f7d4a" />
        </g>
      ))}

      <rect x="0" y="360" width="640" height="60" fill="#0e2a1e" />
    </svg>
  );
}
