"use client";

import { clsx } from "clsx";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { artworkGeneratorVersion, generateCoinPartitionArtwork, generateLegacyCoinPartitionArtwork } from "@/lib/fractals";
import type { ArtworkPoint, ArtworkSegment, CoinPartitionArtwork, DailyFractal } from "@/lib/types";

function fmt(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function polygonPath(points: ArtworkPoint[]) {
  const [first, ...rest] = points;
  if (!first) return "";
  return [`M ${fmt(first.x)} ${fmt(first.y)}`, ...rest.map((point) => `L ${fmt(point.x)} ${fmt(point.y)}`), "Z"].join(" ");
}

function hatchPath(segments: ArtworkSegment[]) {
  return segments
    .map((segment) => `M ${fmt(segment.a.x)} ${fmt(segment.a.y)} L ${fmt(segment.b.x)} ${fmt(segment.b.y)}`)
    .join(" ");
}

function FinalArtworkSvg({ artwork, label, visibleSteps }: { artwork: CoinPartitionArtwork; label: string; visibleSteps: number }) {
  const faces = useMemo(
    () =>
      artwork.faces.map((face) => ({
        face,
        polygon: polygonPath(face.polygon),
        hatches: hatchPath(face.hatchSegments),
      })),
    [artwork],
  );
  const visibleFaceCount = visibleSteps >= artwork.lineCount ? faces.length : Math.min(faces.length, visibleSteps);
  const visibleFaces = faces.slice(0, visibleFaceCount);
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
      <g id="final-faces">
        {visibleFaces.map(({ face, polygon, hatches }) => {
          const foreground = face.inverted ? "white" : "black";
          const fill = face.color;
          return (
            <g key={face.id}>
              <path d={polygon} fill={fill} fillOpacity={face.inverted ? 0.9 : 0.72} fillRule="evenodd" stroke="none" data-color={face.color} data-polarity={face.inverted ? "inverted" : "normal"} />
              {hatches ? <path d={hatches} fill="none" stroke={foreground} strokeLinecap="butt" strokeWidth="0.18" data-hatches="true" /> : null}
              <path d={polygon} fill="none" fillRule="evenodd" stroke={foreground} strokeWidth="0.15" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export const DailyFractalCanvas = memo(function DailyFractalCanvas({
  fractal,
  label,
  className,
}: {
  fractal: DailyFractal;
  label: string;
  className?: string;
}) {
  const artworkSeed = fractal.config.seed || fractal.seed;
  const persistedArtwork = fractal.config.artwork;
  const generatorVersion = fractal.generatorVersion ?? 1;
  const artwork = useMemo(
    () => persistedArtwork ?? (generatorVersion >= artworkGeneratorVersion ? generateCoinPartitionArtwork(artworkSeed) : generateLegacyCoinPartitionArtwork(artworkSeed)),
    [artworkSeed, generatorVersion, persistedArtwork],
  );
  const totalSteps = fractal.totalSteps ?? artwork.lineCount ?? 1;
  const visibleSteps = Math.max(0, Math.min(totalSteps, fractal.visibleSteps ?? totalSteps));
  const renderedSteps = generatorVersion < artworkGeneratorVersion && fractal.status === "completed" ? artwork.faces.length : visibleSteps;
  return (
    <div className={clsx("overflow-hidden rounded-2xl bg-[var(--surface)]", className)}>
      <FinalArtworkSvg artwork={artwork} label={label} visibleSteps={renderedSteps} />
    </div>
  );
});

export function LazyDailyFractalCanvas({
  fractal,
  label,
  className,
}: {
  fractal: DailyFractal;
  label: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "240px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={clsx("min-h-44", className)}>
      {visible ? (
        <DailyFractalCanvas fractal={fractal} label={label} className="h-full" />
      ) : (
        <div className="h-full min-h-44 rounded-2xl bg-[var(--surface)]" aria-hidden />
      )}
    </div>
  );
}
