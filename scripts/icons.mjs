// Renders the app icon SVG to the PNG sizes iOS and the manifest need.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const svg = (size, maskable) => {
  const pad = maskable ? 0.2 : 0.16; // maskable keeps art inside the 80% safe zone
  const r = maskable ? 0 : size * 0.22;
  const inner = size * (1 - pad * 2);
  const x0 = size * pad, bw = inner * 0.22, gap = (inner - bw * 3) / 2;
  const hs = [0.5, 0.72, 0.94].map((k) => inner * k);
  const bars = hs.map((h, i) => `<rect x="${x0 + i * (bw + gap)}" y="${x0 + inner - h}" width="${bw}" height="${h}" rx="${bw * 0.32}" fill="#fff" opacity="${0.7 + i * 0.15}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#72BEE6"/><stop offset="1" stop-color="#3C7CEB"/></linearGradient></defs>
    <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>${bars}</svg>`;
};

const out = [
  ['public/apple-touch-icon.png', 180, true], // iOS rounds the corners itself
  ['public/icon-192.png', 192, false],
  ['public/icon-512.png', 512, false],
  ['public/icon-512-maskable.png', 512, true]
];

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage();
for (const [file, size, mask] of out) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(size, mask)}</body></html>`);
  writeFileSync(file, await page.locator('svg').screenshot({ omitBackground: true }));
  console.log('wrote', file);
}
writeFileSync('public/icon.svg', svg(512, false));
await browser.close();
