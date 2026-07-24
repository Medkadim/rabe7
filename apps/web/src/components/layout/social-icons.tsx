type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M14 8.5h2V5.3c-.35-.05-1.55-.15-2.95-.15-2.92 0-4.92 1.83-4.92 5.2v2.7H5.5v3.6h2.63V21h3.62v-4.35H14.6l.5-3.6h-3.35v-2.35c0-1.04.29-1.75 1.75-1.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7.6" cy="8" r="1.15" fill="currentColor" />
      <path d="M7.6 10.8v6.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M11.4 16.9v-3.5c0-1.3.8-2.2 2-2.2s1.8.8 1.8 2.1v3.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M11.4 10.8v6.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
