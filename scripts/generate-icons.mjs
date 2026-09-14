import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BLUE = "#1E51A4";

mkdirSync("public/icons", { recursive: true });

function svgIcon({ size, padding, rounded }) {
  const inner = size - padding * 2;
  const fontSize = inner * 0.62;
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${rounded}" fill="${BLUE}"/>
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fontSize}" fill="#ffffff">#</text>
  </svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, padding: 0, rounded: 40 },
  { file: "icon-512.png", size: 512, padding: 0, rounded: 100 },
  { file: "maskable-512.png", size: 512, padding: 70, rounded: 0 },
  { file: "apple-touch-icon.png", size: 180, padding: 0, rounded: 38 },
];

for (const t of targets) {
  const svg = svgIcon(t);
  await sharp(Buffer.from(svg)).png().toFile(`public/icons/${t.file}`);
  console.log("generated", t.file);
}

// favicon (32px, simple)
await sharp(Buffer.from(svgIcon({ size: 64, padding: 0, rounded: 14 })))
  .png()
  .toFile("public/icons/favicon-64.png");
console.log("generated favicon-64.png");
