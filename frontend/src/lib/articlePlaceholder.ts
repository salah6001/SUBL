const PALETTES: Array<[string, string, string]> = [
  ['#EFF6FF', '#BFDBFE', '#1D4ED8'], // blue
  ['#F0FDF4', '#BBF7D0', '#15803D'], // green
  ['#FFF7ED', '#FED7AA', '#C2410C'], // orange
  ['#F5F3FF', '#DDD6FE', '#6D28D9'], // purple
  ['#F0FDFA', '#99F6E4', '#0F766E'], // teal
];

function palette(tag: string): [string, string, string] {
  const hash = tag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTES[hash % PALETTES.length];
}

function keyboardSvg(bg: string, light: string, accent: string, label: string): string {
  const rows = [
    [40, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48],
    [56, 44, 44, 44, 44, 44, 44, 44, 44, 44, 40],
    [64, 44, 44, 44, 44, 44, 44, 44, 44, 80],
    [80, 44, 44, 44, 44, 44, 44, 44, 64],
    [40, 40, 160, 40, 40],
  ];

  const GAP = 6;
  const KEY_H = 36;
  const START_Y = 80;
  let svgKeys = '';

  rows.forEach((widths, ri) => {
    let x = 40;
    const y = START_Y + ri * (KEY_H + GAP);
    widths.forEach((w, ki) => {
      const isAccent = (ri === 1 && ki === 9) || (ri === 3 && ki === 0) || (ri === 4 && ki === 2);
      svgKeys += `<rect x="${x}" y="${y}" width="${w}" height="${KEY_H}" rx="5"
        fill="${isAccent ? accent : light}" opacity="${isAccent ? '1' : '0.85'}"/>`;
      if (!isAccent) {
        const cx = x + w / 2;
        const cy = y + KEY_H / 2 + 5;
        svgKeys += `<text x="${cx}" y="${cy}" text-anchor="middle" font-size="10"
          font-family="system-ui,sans-serif" fill="${accent}" opacity="0.5">▪</text>`;
      }
      x += w + GAP;
    });
  });

  const tagUpper = label.toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
  <rect width="600" height="360" fill="${bg}"/>
  <rect x="20" y="55" width="560" height="265" rx="16" fill="${light}" opacity="0.4"/>
  ${svgKeys}
  <text x="300" y="342" text-anchor="middle" font-size="13" letter-spacing="3"
    font-family="system-ui,sans-serif" font-weight="600" fill="${accent}" opacity="0.7">${tagUpper}</text>
</svg>`;
}

export function getArticlePlaceholder(tag = ''): string {
  const [bg, light, accent] = palette(tag);
  const svg = keyboardSvg(bg, light, accent, tag || 'Article');
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

export function avatarPlaceholder(name = ''): string {
  const initials = name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="20" fill="#BFDBFE"/>
  <text x="20" y="25" text-anchor="middle" font-size="14" font-weight="600"
    font-family="system-ui,sans-serif" fill="#1D4ED8">${initials}</text>
</svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}
