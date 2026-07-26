// The Wasla symbol — two nodes joined by a single line, literally "a
// connection." Per the charte graphique: the nodes are always brand
// indigo, the connecting line is always accent amber — that pairing
// never changes across contexts, only the surrounding colors do.
export function WaslaMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M17,31 Q24,21 31,17" stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="15" cy="33" r="7.5" fill="var(--brand)" />
      <circle cx="33" cy="15" r="7.5" fill="var(--brand)" />
    </svg>
  );
}
