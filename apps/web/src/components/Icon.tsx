// Inline SVG icons, no downloads. Always paired with a visible word, so they are
// hidden from screen readers.
const PATHS = {
  alert: ['M12 3 2 20h20L12 3z', 'M12 9.5v5', 'M12 17.5h.01'],
  register: ['M9 3h6v3H9z', 'M7 4.5H5V21h14V4.5h-2', 'M8.5 11h7', 'M8.5 15h5'],
  slip: ['M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z', 'M14 6v12'],
  find: ['M12 21s6.5-6 6.5-11a6.5 6.5 0 0 0-13 0c0 5 6.5 11 6.5 11z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  settings: ['M4 7h9', 'M17 7h3', 'M4 17h3', 'M11 17h9', 'M15 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M9 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  back: ['M15 5l-7 7 7 7'],
  home: ['M3 11.5 12 4l9 7.5', 'M5.5 10v10h13V10'],
  speaker: ['M4 9h4l5-4v14l-5-4H4z', 'M16.5 9a4 4 0 0 1 0 6', 'M19 6.5a7.5 7.5 0 0 1 0 11'],
  stop: ['M7 7h10v10H7z'],
  phone: ['M5 3.5h3.5l2 5-2.5 1.5a11 11 0 0 0 6 6l1.5-2.5 5 2V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2z'],
  bell: ['M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9z', 'M10 20.5a2 2 0 0 0 4 0'],
  language: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3 12h18', 'M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  cross: ['M6 6l12 12', 'M18 6 6 18'],
  route: ['M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7'],
  next: ['M9 5l7 7-7 7'],
  help: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7', 'M12 17h.01'],
  // Department picture cards.
  MED: ['M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0z', 'M12 9v7'],
  CHI: ['M12 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', 'M7 12l5-2 5 2', 'M12 10v5', 'M9 21l3-6 3 6'],
  WOM: ['M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z', 'M12 13v8', 'M9 18h6'],
  BON: ['M8.5 15.5l7-7', 'M6.5 14a2 2 0 1 0-1 3.5 2 2 0 1 0 3.5-1', 'M17.5 10a2 2 0 1 0 1-3.5 2 2 0 1 0-3.5 1'],
  ENT: ['M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0', 'M10 10a2 2 0 0 1 4 0'],
  EYE: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  SKI: ['M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M9 9h.01', 'M15 10h.01', 'M10.5 14.5h.01', 'M15.5 15.5h.01'],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = 'size-7' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
