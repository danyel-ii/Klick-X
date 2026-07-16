import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const rasterIcons = [
  "public/icon-source.png",
  "public/icon.png",
  "public/icons/apple-touch-icon.png",
  "public/icons/apple-touch-icon-grayscale.png",
  "public/icons/icon-192.png",
  "public/icons/icon-192-grayscale.png",
  "public/icons/icon-512.png",
  "public/icons/icon-512-grayscale.png",
  "public/icons/maskable-512.png",
  "public/icons/maskable-512-grayscale.png",
  "public/icons/image.png",
];

describe("app icon assets", () => {
  it.each(rasterIcons)("renders %s as an opaque square", async (file) => {
    const { data, info } = await sharp(join(process.cwd(), file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparentPixels = 0;

    for (let index = 0; index < data.length; index += info.channels) {
      const alpha = data[index + 3];
      if (alpha !== 255) transparentPixels += 1;
    }

    expect(info.width).toBe(info.height);
    expect(transparentPixels).toBe(0);
  });

  it("embeds an RGBA PNG in the ICO for Turbopack", async () => {
    const favicon = await readFile(join(process.cwd(), "src/app/favicon.ico"));
    const embeddedPngOffset = 22;
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(favicon.subarray(embeddedPngOffset, embeddedPngOffset + pngSignature.length)).toEqual(pngSignature);
    expect(favicon[embeddedPngOffset + 25]).toBe(6);
  });

  it("uses the shared warm ivory and near-black palette at the reference scale", async () => {
    const { data, info } = await sharp(join(process.cwd(), "public/icon-source.png"))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const colors = new Set<string>();
    let minX = info.width;
    let minY = info.height;
    let maxX = -1;
    let maxY = -1;

    for (let index = 0; index < data.length; index += info.channels) {
      const color = `${data[index]},${data[index + 1]},${data[index + 2]}`;
      colors.add(color);
      if (color !== "23,22,17") continue;

      const pixel = index / info.channels;
      const x = pixel % info.width;
      const y = Math.floor(pixel / info.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    expect(colors).toEqual(new Set(["244,239,228", "23,22,17"]));
    expect((maxX - minX + 1) / info.width).toBeCloseTo(0.63, 2);
    expect((maxY - minY + 1) / info.height).toBeCloseTo(0.62, 2);
  });
});
