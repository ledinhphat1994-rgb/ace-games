
// ─── SVG Icons ──────────────────────────────────────────────────────────────
export const ICONS = {
  tv:        "M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM17 2l-5 5-5-5",
  game:      "M6 12h4M8 10v4M15 13h.01M18 11h.01M2 6a6 6 0 0 1 20 0v12a6 6 0 0 1-20 0z",
  phones:    "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3",
  plus:      "M12 5v14M5 12h14",
  left:      "M19 12H5M12 19l-7-7 7-7",
  send:      "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  radio:     "M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49",
  lock:      "M3 11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  users:     "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  x:         "M18 6 6 18M6 6l12 12",
  check:     "M20 6 9 17l-5-5",
  clock:     "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  bell:      "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  trophy:    "M6 9H3l3 8h12l3-8h-3M9 9V5a3 3 0 0 1 6 0v4M12 17v4M8 21h8",
  calendar:  "M8 2v4M16 2v4M3 10h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  home:      "M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5",
  community: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  play:      "M5 3l14 9-14 9z",
  pause:     "M6 4h4v16H6zM14 4h4v16h-4z",
  logout:    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  search:    "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  book:      "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5zM6 6h10M6 10h10",
  user:      "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  sparkles:  "M12 3l1.912 5.885L20 10l-4.088 3.115L17.824 19 12 15.385 6.176 19l1.912-5.885L4 10l6.088-1.115z"
};

export const Ic = ({ name, className = "w-4 h-4" }) => {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
};
