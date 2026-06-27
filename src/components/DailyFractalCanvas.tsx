"use client";

import { clsx } from "clsx";
import type { ArtworkPoint, CoinPartitionArtwork, DailyFractal } from "@/lib/types";

function fmt(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function polygonPath(points: ArtworkPoint[]) {
  const [first, ...rest] = points;
  if (!first) return "";
  return [`M ${fmt(first.x)} ${fmt(first.y)}`, ...rest.map((point) => `L ${fmt(point.x)} ${fmt(point.y)}`), "Z"].join(" ");
}

function LegacyArtwork({ fractal }: { fractal: DailyFractal }) {
  const color = fractal.config.palette[0] ?? "var(--accent)";
  return (
    <div className="grid h-full min-h-44 w-full place-items-center rounded-2xl bg-[var(--surface)]">
      <div className="h-24 w-24 rounded-full border border-[var(--app-border)]" style={{ background: `radial-gradient(circle, ${color}, transparent 68%)` }} />
    </div>
  );
}

function FinalArtworkSvg({ artwork, label, visibleSteps }: { artwork: CoinPartitionArtwork; label: string; visibleSteps: number }) {
  const visibleFaceCount = visibleSteps >= artwork.lineCount ? artwork.faces.length : Math.min(artwork.faces.length, visibleSteps);
  const visibleFaces = artwork.faces.slice(0, visibleFaceCount);
  const pendingFaces = artwork.faces.slice(visibleFaceCount);
  return (
    <svg
      role="img"
      aria-label={label}
      className="h-full min-h-44 w-full rounded-2xl bg-white"
      viewBox={`0 0 ${artwork.pageWidth} ${artwork.pageHeight}`}
      preserveAspectRatio="xMidYMid meet"
      data-stage="final"
      data-line-count={artwork.lineCount}
      data-visible-steps={visibleSteps}
    >
      <rect x="0" y="0" width={artwork.pageWidth} height={artwork.pageHeight} fill="white" />
      <g id="pending-faces" opacity="0.18">
        {pendingFaces.map((face) => (
          <path key={face.id} d={polygonPath(face.polygon)} fill="none" stroke="black" strokeWidth="0.12" />
        ))}
      </g>
      <g id="final-faces">
        {visibleFaces.map((face) => {
          const foreground = face.inverted ? "white" : "black";
          const fill = face.color;
          return (
            <g key={face.id}>
              <path d={polygonPath(face.polygon)} fill={fill} fillOpacity={face.inverted ? 0.9 : 0.72} fillRule="evenodd" stroke="none" data-color={face.color} data-polarity={face.inverted ? "inverted" : "normal"} />
              <g fill="none" stroke={foreground} strokeLinecap="butt" strokeWidth="0.18">
                {face.hatchSegments.map((segment, index) => (
                  <polyline key={index} points={`${fmt(segment.a.x)},${fmt(segment.a.y)} ${fmt(segment.b.x)},${fmt(segment.b.y)}`} />
                ))}
              </g>
              <path d={polygonPath(face.polygon)} fill="none" fillRule="evenodd" stroke={foreground} strokeWidth="0.15" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export function DailyFractalCanvas({
  fractal,
  label,
  className,
}: {
  fractal: DailyFractal;
  label: string;
  className?: string;
}) {
  const artwork = fractal.config.artwork;
  const totalSteps = fractal.totalSteps ?? artwork?.lineCount ?? 1;
  const visibleSteps = Math.max(0, Math.min(totalSteps, fractal.visibleSteps ?? totalSteps));
  return (
    <div className={clsx("overflow-hidden rounded-2xl bg-[var(--surface)]", className)}>
      {artwork ? <FinalArtworkSvg artwork={artwork} label={label} visibleSteps={visibleSteps} /> : <LegacyArtwork fractal={fractal} />}
    </div>
  );
}
