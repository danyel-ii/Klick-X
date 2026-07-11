import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const size = 512;
const radius = 112;
const lineCount = 24;
const hatchSpacing = 13;
const geometryEpsilon = 1e-7;
const seed = "study-blocks:coin-partition-app-icon:v1:24-lines";
const black = "#000000";
const white = "#ffffff";
const palette = [white, black];

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seedValue) {
  return () => {
    let value = (seedValue += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(hashString(seed));

function point(x, y) {
  return { x, y };
}

function subtract(a, b) {
  return point(a.x - b.x, a.y - b.y);
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pushUnique(points, item) {
  if (!points.some((existing) => distance(existing, item) <= geometryEpsilon)) points.push(item);
}

function polygonArea(polygon) {
  let area = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
}

function centroid(polygon) {
  const total = polygon.reduce((sum, item) => point(sum.x + item.x, sum.y + item.y), point(0, 0));
  return point(total.x / Math.max(1, polygon.length), total.y / Math.max(1, polygon.length));
}

function regionSortKey(a, b) {
  const ca = centroid(a);
  const cb = centroid(b);
  return ca.y - cb.y || ca.x - cb.x || polygonArea(a) - polygonArea(b);
}

function polygonBounds(polygon) {
  return {
    minX: Math.min(...polygon.map((item) => item.x)),
    minY: Math.min(...polygon.map((item) => item.y)),
    maxX: Math.max(...polygon.map((item) => item.x)),
    maxY: Math.max(...polygon.map((item) => item.y)),
  };
}

function samplePointInConvexPolygon(polygon) {
  const origin = polygon[0];
  if (!origin || polygon.length < 3) return centroid(polygon);
  const triangles = polygon.slice(1, -1).flatMap((vertex, index) => {
    const next = polygon[index + 2];
    return next ? [[origin, vertex, next]] : [];
  });
  const weights = triangles.map(([a, b, c]) => Math.abs(cross(subtract(b, a), subtract(c, a))) / 2);
  const total = weights.reduce((sum, value) => sum + value, 0);
  const fallbackTriangle = triangles[triangles.length - 1];
  if (total <= geometryEpsilon || !fallbackTriangle) return centroid(polygon);

  let target = random() * total;
  let selected = fallbackTriangle;
  for (let index = 0; index < triangles.length; index += 1) {
    target -= weights[index];
    if (target <= 0) {
      selected = triangles[index];
      break;
    }
  }
  const [a, b, c] = selected;
  let r1 = random();
  let r2 = random();
  if (r1 + r2 > 1) {
    r1 = 1 - r1;
    r2 = 1 - r2;
  }
  return point(a.x + r1 * (b.x - a.x) + r2 * (c.x - a.x), a.y + r1 * (b.y - a.y) + r2 * (c.y - a.y));
}

function orientedCoinToss(polygon) {
  const sampled = samplePointInConvexPolygon(polygon);
  return {
    ...sampled,
    theta: random() * Math.PI,
    side: random() < 0.5 ? "heads" : "tails",
  };
}

function signedLineDistance(item, line) {
  const dx = Math.cos(line.theta);
  const dy = Math.sin(line.theta);
  return (item.x - line.x) * dy - (item.y - line.y) * dx;
}

function interpolate(a, b, da, db) {
  const ratio = da / (da - db);
  return point(a.x + (b.x - a.x) * ratio, a.y + (b.y - a.y) * ratio);
}

function clipPolygonHalfPlane(polygon, line, side) {
  const result = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentDistance = side * signedLineDistance(current, line);
    const nextDistance = side * signedLineDistance(next, line);
    const currentInside = currentDistance >= -geometryEpsilon;
    const nextInside = nextDistance >= -geometryEpsilon;

    if (currentInside && nextInside) {
      pushUnique(result, next);
    } else if (currentInside && !nextInside) {
      pushUnique(result, interpolate(current, next, currentDistance, nextDistance));
    } else if (!currentInside && nextInside) {
      pushUnique(result, interpolate(current, next, currentDistance, nextDistance));
      pushUnique(result, next);
    }
  }
  return result;
}

function splitConvexPolygon(polygon, toss) {
  const positive = clipPolygonHalfPlane(polygon, toss, 1);
  const negative = clipPolygonHalfPlane(polygon, toss, -1);
  return [positive, negative].filter((piece) => piece.length >= 3 && polygonArea(piece) > geometryEpsilon);
}

function pointInConvexPolygon(item, polygon) {
  let sign = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    const value = cross(subtract(b, a), subtract(item, a));
    if (Math.abs(value) <= geometryEpsilon) continue;
    const currentSign = Math.sign(value);
    if (sign && currentSign !== sign) return false;
    sign = currentSign;
  }
  return true;
}

function segmentIntersection(a, b, c, d) {
  const r = subtract(b, a);
  const s = subtract(d, c);
  const denominator = cross(r, s);
  if (Math.abs(denominator) < geometryEpsilon) return null;
  const qp = subtract(c, a);
  const t = cross(qp, s) / denominator;
  const u = cross(qp, r) / denominator;
  if (t < -geometryEpsilon || t > 1 + geometryEpsilon || u < -geometryEpsilon || u > 1 + geometryEpsilon) return null;
  return point(a.x + t * r.x, a.y + t * r.y);
}

function clipSegmentToConvexPolygon(a, b, polygon) {
  const hits = [];
  if (pointInConvexPolygon(a, polygon)) hits.push(a);
  if (pointInConvexPolygon(b, polygon)) hits.push(b);

  for (let index = 0; index < polygon.length; index += 1) {
    const edgeStart = polygon[index];
    const edgeEnd = polygon[(index + 1) % polygon.length];
    const hit = segmentIntersection(a, b, edgeStart, edgeEnd);
    if (hit) pushUnique(hits, hit);
  }

  if (hits.length < 2) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ordered = hits.sort((left, right) => (left.x - a.x) * dx + (left.y - a.y) * dy - ((right.x - a.x) * dx + (right.y - a.y) * dy));
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  if (!first || !last || distance(first, last) <= geometryEpsilon) return null;
  return { a: first, b: last };
}

function generateHatchesForPolygon(polygon, angle) {
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const vx = -Math.sin(angle);
  const vy = Math.cos(angle);
  const bounds = polygonBounds(polygon);
  const corners = [point(bounds.minX, bounds.minY), point(bounds.minX, bounds.maxY), point(bounds.maxX, bounds.minY), point(bounds.maxX, bounds.maxY)];
  const normalProjections = corners.map((corner) => corner.x * vx + corner.y * vy);
  const directionProjections = corners.map((corner) => corner.x * ux + corner.y * uy);
  const start = Math.floor((Math.min(...normalProjections) - hatchSpacing) / hatchSpacing) * hatchSpacing;
  const end = Math.ceil((Math.max(...normalProjections) + hatchSpacing) / hatchSpacing) * hatchSpacing;
  const directionMidpoint = (Math.min(...directionProjections) + Math.max(...directionProjections)) / 2;
  const halfLength = (Math.max(...directionProjections) - Math.min(...directionProjections)) / 2 + 2 * hatchSpacing + 10;
  const segments = [];

  for (let offset = start; offset <= end + geometryEpsilon; offset += hatchSpacing) {
    const px = directionMidpoint * ux + offset * vx;
    const py = directionMidpoint * uy + offset * vy;
    const segment = clipSegmentToConvexPolygon(point(px - halfLength * ux, py - halfLength * uy), point(px + halfLength * ux, py + halfLength * uy), polygon);
    if (segment) segments.push(segment);
  }

  return segments;
}

function fmt(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function polygonPath(points) {
  const [first, ...rest] = points;
  return [`M ${fmt(first.x)} ${fmt(first.y)}`, ...rest.map((item) => `L ${fmt(item.x)} ${fmt(item.y)}`), "Z"].join(" ");
}

function generateArtwork() {
  const regions = [[point(36, 36), point(476, 36), point(476, 476), point(36, 476)]];

  for (let index = 1; index < lineCount; index += 1) {
    const selectedIndex = regions.reduce(
      (largestIndex, region, regionIndex) => (polygonArea(region) > polygonArea(regions[largestIndex] ?? []) ? regionIndex : largestIndex),
      0,
    );
    const selected = regions[selectedIndex];
    if (!selected) break;
    let pieces = [];
    for (let attempt = 0; attempt < 8 && pieces.length !== 2; attempt += 1) {
      pieces = splitConvexPolygon(selected, orientedCoinToss(selected));
    }
    if (pieces.length !== 2) break;
    regions.splice(selectedIndex, 1, ...pieces);
  }

  return regions.sort(regionSortKey).map((polygon, index) => {
    const color = palette[index % palette.length];
    return {
      id: index + 1,
      polygon,
      color,
      inverted: color === black,
      hatchSegments: generateHatchesForPolygon(polygon, orientedCoinToss(polygon).theta),
    };
  });
}

function svg() {
  const faces = generateArtwork();
  const paths = faces
    .map((face) => {
      const d = polygonPath(face.polygon);
      const stroke = face.inverted ? white : black;
      const hatchPath = face.hatchSegments
        .filter((_, index) => index % 2 === 0)
        .map((segment) => `M ${fmt(segment.a.x)} ${fmt(segment.a.y)} L ${fmt(segment.b.x)} ${fmt(segment.b.y)}`)
        .join(" ");
      const hatches = hatchPath ? `<path d="${hatchPath}" fill="none" stroke="${stroke}" stroke-width="1.25" stroke-linecap="round"/>` : "";
      return `<g><path d="${d}" fill="${face.color}"/><path d="${d}" fill="none" stroke="${stroke}" stroke-width="1.35"/>${hatches}</g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-labelledby="title">
  <title id="title">Study Blocks black and white coin-partition artwork icon</title>
  <defs>
    <clipPath id="rounded"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></clipPath>
  </defs>
  <rect width="${size}" height="${size}" fill="${black}"/>
  <g clip-path="url(#rounded)">
    <rect width="${size}" height="${size}" fill="${black}"/>
    <g>${paths}</g>
    <rect x="36" y="36" width="440" height="440" rx="86" fill="none" stroke="${white}" stroke-width="6"/>
  </g>
</svg>
`;
}

function icoFromPng(pngBuffer, imageSize) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const directory = Buffer.alloc(16);
  directory.writeUInt8(imageSize === 256 ? 0 : imageSize, 0);
  directory.writeUInt8(imageSize === 256 ? 0 : imageSize, 1);
  directory.writeUInt8(0, 2);
  directory.writeUInt8(0, 3);
  directory.writeUInt16LE(1, 4);
  directory.writeUInt16LE(32, 6);
  directory.writeUInt32LE(pngBuffer.length, 8);
  directory.writeUInt32LE(header.length + directory.length, 12);
  return Buffer.concat([header, directory, pngBuffer]);
}

async function main() {
  const root = process.cwd();
  const iconSvg = svg();
  const iconSvgPath = path.join(root, "public", "icon.svg");
  await fs.writeFile(iconSvgPath, iconSvg);

  const render = (imageSize, { opaque = true, palette = true } = {}) => {
    let pipeline = sharp(Buffer.from(iconSvg)).resize(imageSize, imageSize);
    if (opaque) pipeline = pipeline.flatten({ background: black });
    if (!palette) pipeline = pipeline.ensureAlpha();
    return pipeline.png({ palette, colors: 256, compressionLevel: 9, dither: 0 });
  };
  await render(512).toFile(path.join(root, "public", "icon.png"));
  await render(180).toFile(path.join(root, "public", "icons", "apple-touch-icon.png"));
  await render(180).toFile(path.join(root, "public", "icons", "apple-touch-icon-grayscale.png"));
  await render(192).toFile(path.join(root, "public", "icons", "icon-192.png"));
  await render(192).toFile(path.join(root, "public", "icons", "icon-192-grayscale.png"));
  await render(512).toFile(path.join(root, "public", "icons", "icon-512.png"));
  await render(512).toFile(path.join(root, "public", "icons", "icon-512-grayscale.png"));
  await render(512, { opaque: true }).toFile(path.join(root, "public", "icons", "maskable-512.png"));
  await render(512, { opaque: true }).toFile(path.join(root, "public", "icons", "maskable-512-grayscale.png"));
  await render(1254).toFile(path.join(root, "public", "icons", "image.png"));

  const faviconPng = await render(32, { palette: false }).toBuffer();
  await fs.writeFile(path.join(root, "src", "app", "favicon.ico"), icoFromPng(faviconPng, 32));
}

await main();
