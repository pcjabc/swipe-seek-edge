/**
 * 生成扩展图标（无需第三方依赖）
 * 用法: node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "icons");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (y * size + x) * 4;
      const nx = (x - center) / size;
      const ny = (y - center) / size;

      // 圆角方块背景
      const inCard =
        Math.abs(nx) < 0.34 &&
        Math.abs(ny) < 0.34;

      // 横向双箭头（象征滑动 seek）
      const arrow =
        Math.abs(ny) < 0.06 &&
        Math.abs(nx) < 0.28 &&
        (Math.abs(nx) > 0.08 || Math.abs(ny) > 0.015);

      const tipLeft =
        nx < -0.12 &&
        Math.abs(nx + 0.2) + Math.abs(ny) * 2.2 < 0.12;
      const tipRight =
        nx > 0.12 &&
        Math.abs(nx - 0.2) + Math.abs(ny) * 2.2 < 0.12;

      if (inCard) {
        pixels[idx] = 0x00;
        pixels[idx + 1] = 0x78;
        pixels[idx + 2] = 0xd4;
        pixels[idx + 3] = 255;
      } else if (arrow || tipLeft || tipRight) {
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 255;
      } else {
        pixels[idx + 3] = 0;
      }
    }
  }

  const raw = Buffer.alloc(size * (1 + size * 4));
  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0;
    offset += 1;
    pixels.copy(raw, offset, y * size * 4, (y + 1) * size * 4);
    offset += size * 4;
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

mkdirSync(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const file = join(outDir, `icon-${size}.png`);
  writeFileSync(file, createIcon(size));
  console.log("wrote", file);
}
