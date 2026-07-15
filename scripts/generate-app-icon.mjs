import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceSize = 1254;

function icoFromPng(pngBuffer, imageSize) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const directory = Buffer.alloc(16);
  directory.writeUInt8(imageSize === 256 ? 0 : imageSize, 0);
  directory.writeUInt8(imageSize === 256 ? 0 : imageSize, 1);
  directory.writeUInt16LE(1, 4);
  directory.writeUInt16LE(32, 6);
  directory.writeUInt32LE(pngBuffer.length, 8);
  directory.writeUInt32LE(header.length + directory.length, 12);

  return Buffer.concat([header, directory, pngBuffer]);
}

async function main() {
  const root = process.cwd();
  const source = path.join(root, "public", "icon-source.png");
  const output = (relativePath, size) =>
    sharp(source)
      .resize(size, size, { fit: "cover" })
      .flatten({ background: "#999999" })
      .png({ compressionLevel: 9 })
      .toFile(path.join(root, relativePath));

  await Promise.all([
    output("public/icon.png", 512),
    output("public/icons/apple-touch-icon.png", 180),
    output("public/icons/apple-touch-icon-grayscale.png", 180),
    output("public/icons/icon-192.png", 192),
    output("public/icons/icon-192-grayscale.png", 192),
    output("public/icons/icon-512.png", 512),
    output("public/icons/icon-512-grayscale.png", 512),
    output("public/icons/maskable-512.png", 512),
    output("public/icons/maskable-512-grayscale.png", 512),
    output("public/icons/image.png", sourceSize),
  ]);

  const faviconPng = await sharp(source).resize(32, 32, { fit: "cover" }).ensureAlpha().png().toBuffer();
  await fs.writeFile(path.join(root, "src", "app", "favicon.ico"), icoFromPng(faviconPng, 32));
}

await main();
