const PATHS = {
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  github: (
    <path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  ),
};

export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}

/** The Stampboard mark: a dark tile, two ledger lines and a tilted vermilion stamp. */
export function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="6" fill="#141310" />
      <rect x="6" y="9" width="20" height="4" fill="#f4f1ea" />
      <rect x="6" y="15" width="13" height="4" fill="#f4f1ea" />
      <rect
        x="21"
        y="17"
        width="7"
        height="7"
        fill="#c23523"
        transform="rotate(-8 24.5 20.5)"
      />
    </svg>
  );
}

/** The Derinbay Labs mark used on the footer nameplate. */
export function LabsMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M3.5 5h6a7 7 0 0 1 0 14h-6z" />
      <circle cx="20" cy="17" r="2.2" fill="currentColor" />
    </svg>
  );
}
