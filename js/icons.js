/* Lightweight inline SVG icon library. All icons are 24x24, stroke-based,
   and use currentColor so they inherit color from CSS. No external assets. */
const ICON_PATHS = {
  // Chrome / navigation
  logo: '<path d="M12 2 L20 12 L12 22 L4 12 Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  listChecks: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.2 1.2L6.5 5"/><path d="M3.5 12l1.2 1.2L6.5 11"/><path d="M3.5 18l1.2 1.2L6.5 17"/>',
  barChart: '<path d="M4 20V10M12 20V4M20 20v-7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.96 19a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.09Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z"/>',
  chevronsLeft: '<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>',
  chevronsRight: '<path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  flame: '<path d="M12 22c4.4 0 7-2.7 7-6.5 0-3.2-2-5-3.3-7.3-.7-1.2-.9-2.6-.7-4.2-2.6 1-4.7 3.4-5 6.2-1.4-1-1.9-2.6-2-4.2-1.8 1.9-2.5 4.6-2 7 .3 1.6 1.1 3 2 4C6.7 18.6 7.7 22 12 22Z"/>',
  inbox: '<path d="M3 12h4.5l1.5 3h6l1.5-3H21"/><path d="M5 4h14l2 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z"/>',

  // Row / CRUD actions
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  pin: '<path d="M12 17v5"/><path d="M8 3h8l-1 6 3 3v2H6v-2l3-3Z"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 13h4"/>',
  restore: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
  trash: '<path d="M4 7h16"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',

  // Habit category icons
  activity: '<path d="M22 12h-4l-3 8L9 4l-3 8H2"/>',
  bookOpen: '<path d="M2 5c2-1.3 5-2 8-1v14c-3-1-6-.3-8 1Z"/><path d="M22 5c-2-1.3-5-2-8-1v14c3-1 6-.3 8 1Z"/>',
  droplet: '<path d="M12 2s7 7.3 7 12.3A7 7 0 1 1 5 14.3C5 9.3 12 2 12 2Z"/>',
  monitor: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  feather: '<path d="M20.2 3.8a11 11 0 0 0-15 0C1.9 8.1 2 15 2 22c7 0 13.9.1 18.2-3.2a11 11 0 0 0 0-15Z"/><path d="M16 8 8 16"/>',
  dollar: '<path d="M12 2v20"/><path d="M17 6.5C16.2 5 14.4 4 12 4c-3 0-5 1.6-5 4s2 3.4 5 4 5 1.6 5 4-2 4-5 4c-2.4 0-4.2-1-5-2.5"/>',
  apple: '<path d="M16 4c-.7 1.2-1.8 1.9-3.3 2-1.5.1-2.7-.5-3.7 0"/><path d="M12 8c-4.4 0-7 3.4-7 7.3 0 3.6 2.8 6.7 4.8 6.7 1 0 1.5-.6 2.2-.6.7 0 1.2.6 2.2.6 2 0 5-3.3 5-7 0-3.7-2.8-7-7.2-7Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  penTool: '<path d="m12 19 7-7 3 3-7 7-3-3Z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z"/><path d="m2 2 7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a4 4 0 0 0 4-4c0-4.4-3.6-8-8-8Z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15" cy="8" r="1"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  wind: '<path d="M3 8h9.5a2.5 2.5 0 1 0-2.4-3.2"/><path d="M3 13h13.5a2.5 2.5 0 1 1-2.4 3.2"/><path d="M3 18h7.5a2 2 0 1 1-1.9 2.6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.8 2Z"/>'
};

const Icons = {
  svg(name, size = 18, cls = '') {
    const path = ICON_PATHS[name] || ICON_PATHS.target;
    return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  }
};

/* Curated habit icon set used by the "New / Edit habit" picker.
   Each entry has a stable key (stored on the habit) and a friendly label. */
const HABIT_ICON_SET = [
  { key: 'activity', label: 'Fitness' },
  { key: 'bookOpen', label: 'Reading' },
  { key: 'droplet', label: 'Water' },
  { key: 'monitor', label: 'Coding' },
  { key: 'feather', label: 'Mindfulness' },
  { key: 'dollar', label: 'Money' },
  { key: 'moon', label: 'Sleep' },
  { key: 'apple', label: 'Nutrition' },
  { key: 'target', label: 'Goal' },
  { key: 'penTool', label: 'Writing' },
  { key: 'palette', label: 'Creative' },
  { key: 'music', label: 'Music' },
  { key: 'wind', label: 'Chores' },
  { key: 'phone', label: 'Social' }
];
