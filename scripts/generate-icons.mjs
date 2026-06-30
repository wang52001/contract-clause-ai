import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, "..", "public", "icons", "icon.svg");
const outDir = join(__dirname, "..", "public", "icons");

mkdirSync(outDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-512-maskable.png", size: 512, maskable: true },
];

for (const { name, size, maskable } of sizes) {
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const resize = maskable ? size - padding * 2 : size;

  await sharp(svgBuffer)
    .resize(resize, resize)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 15, g: 23, b: 42, alpha: 1 },
    })
    .png()
    .toFile(join(outDir, name));

  console.log(`生成 ${name} (${size}x${size}${maskable ? " maskable" : ""})`);
}

console.log("图标生成完成");
