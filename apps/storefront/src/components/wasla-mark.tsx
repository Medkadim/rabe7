// The Waslak "W" — a zigzag stroke in brand teal with two amber anchor
// points at its ends, symbolizing the link between the actors in the
// supply chain. Per the charte graphique this pairing (teal stroke, amber
// anchors) never changes across contexts, only the surrounding colors do.
export function WaslaMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={(size * 24) / 28}
      viewBox="0 0 28 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4,6 L9,18 L14,9 L19,18 L24,6"
        stroke="var(--brand)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="6" r="2.6" fill="var(--accent)" />
      <circle cx="24" cy="6" r="2.6" fill="var(--accent)" />
    </svg>
  );
}
