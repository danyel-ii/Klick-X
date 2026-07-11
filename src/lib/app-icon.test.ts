import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const rasterIcons = [
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
  it("uses only black and white in the SVG source", async () => {
    const source = await readFile(join(process.cwd(), "public/icon.svg"), "utf8");
    const colors = new Set(source.match(/#[\da-f]{6}/gi)?.map((color) => color.toLowerCase()));

    expect(colors).toEqual(new Set(["#000000", "#ffffff"]));
  });

  it.each(rasterIcons)("renders %s as opaque grayscale", async (file) => {
    const { data, info } = await sharp(join(process.cwd(), file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let coloredPixels = 0;
    let transparentPixels = 0;

    for (let index = 0; index < data.length; index += info.channels) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      if (red !== green || green !== blue) coloredPixels += 1;
      if (alpha !== 255) transparentPixels += 1;
    }

    expect({ coloredPixels, transparentPixels }).toEqual({ coloredPixels: 0, transparentPixels: 0 });
  });

  it("embeds an RGBA PNG in the ICO for Turbopack", async () => {
    const favicon = await readFile(join(process.cwd(), "src/app/favicon.ico"));
    const embeddedPngOffset = 22;
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(favicon.subarray(embeddedPngOffset, embeddedPngOffset + pngSignature.length)).toEqual(pngSignature);
    expect(favicon[embeddedPngOffset + 25]).toBe(6);
  });
});
