const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/>',
  check: '<path d="m5.5 12.5 4 4L18.5 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sun: '<circle cx="12" cy="12" r="3.4"/><path d="M12 3.5V5.4M12 18.6v1.9M3.5 12h1.9M18.6 12h1.9M6 6l1.3 1.3M16.7 16.7 18 18M18 6l-1.3 1.3M7.3 16.7 6 18"/>',
  speaker:
    '<path d="M11 5.5 7.2 8.2H4.6v7.6h2.6L11 18.5Z"/><path d="M15.8 9.2a4 4 0 0 1 0 5.6"/><path d="M18.4 6.6a7.6 7.6 0 0 1 0 10.8"/>',
  play: '<path d="M9 5.5v13l11-6.5Z" fill="currentColor" stroke-linejoin="round"/>',
  sparkle:
    '<path d="M12 4.5 13.7 9l4.8 1.6L13.7 12.2 12 16.7l-1.7-4.5-4.8-1.6L10.3 9Z"/><path d="M18.5 16l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9Z"/>',
  book: '<path d="M12 6.4C10.6 4.9 8.7 4 6.4 4H4.6v15h1.8c2.3 0 4.3.9 5.6 2.3 1.3-1.4 3.3-2.3 5.6-2.3h1.8V4h-1.8c-2.3 0-4.2.9-5.6 2.4Z"/><path d="M12 6.4v14.9"/>',
  pencil: '<path d="m5 19 1.1-4L16.8 4.3a1.9 1.9 0 0 1 2.7 0l.2.2a1.9 1.9 0 0 1 0 2.7L9.1 17.9 5 19Z"/><path d="m14.5 6.5 3 3"/>',
  cards: '<path d="M6.5 5.5H17a2 2 0 0 1 2 2V17"/><path d="M4.5 8H15a2 2 0 0 1 2 2v8.5H6.5A2 2 0 0 1 4.5 16.5Z"/><path d="M6.5 5.5A2 2 0 0 0 4.5 7.5v.5"/>',
  star: '<path d="m12 4.6 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 9.8l5-.7Z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
  bell: '<path d="M6 9.5a6 6 0 0 1 12 0c0 4.2 1.4 5.5 1.4 5.5H4.6S6 13.7 6 9.5Z"/><path d="M10.2 19a1.9 1.9 0 0 0 3.6 0"/>',
  "chev-l": '<path d="m14.5 6-6 6 6 6"/>',
  "chev-r": '<path d="m9.5 6 6 6-6 6"/>',
  "chev-d": '<path d="m6 9.5 6 6 6-6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  gear: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M6 14v6"/>',
  chart: '<path d="M5 20v-7M10 20V4M15 20v-4M20 20V9"/>',
};

export function svg(name) {
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (ICONS[name] || "") +
    "</svg>"
  );
}

export function ringSVG(pct) {
  var r = 11,
    c = 2 * Math.PI * r;
  var off = c * (1 - pct / 100);
  return (
    '<svg viewBox="0 0 26 26" aria-hidden="true" style="width:26px;height:26px">' +
    '<circle class="ring-bg" cx="13" cy="13" r="' +
    r +
    '"/><circle class="ring-fg" cx="13" cy="13" r="' +
    r +
    '" stroke-dasharray="' +
    c +
    '" stroke-dashoffset="' +
    off +
    '"/></svg>'
  );
}

export const KIND_ICON = {
  warm: "sun",
  hear: "speaker",
  new: "sparkle",
  read: "book",
  write: "pencil",
  sort: "cards",
  celeb: "star",
};

export const ACCENT = {
  peach: ["var(--peach)", "var(--peach-deep)"],
  sky: ["var(--sky)", "var(--sky-deep)"],
  mint: ["var(--mint)", "var(--mint-deep)"],
  lilac: ["var(--lilac)", "var(--lilac-deep)"],
  rose: ["var(--rose)", "var(--rose-deep)"],
};

export const KIND_LABEL = {
  warm: "Starter",
  hear: "Listen",
  new: "New",
  read: "Read",
  write: "Write",
  sort: "Sort",
  celeb: "Star",
};