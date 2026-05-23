"use client";

import { useEffect, useMemo, useRef } from "react";
import { clsx } from "clsx";
import type { DailyFractal, FractalConfig } from "@/lib/types";

function cssColor(value: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const root = window.getComputedStyle(document.documentElement);
  const variableMatch = value.match(/^var\((--[^)]+)\)$/);
  if (variableMatch) {
    const resolved = root.getPropertyValue(variableMatch[1]).trim();
    return resolved ? `oklch(${resolved})` : fallback;
  }
  if (value.startsWith("oklch(var(")) {
    const name = value.match(/var\((--[^)]+)\)/)?.[1];
    const resolved = name ? root.getPropertyValue(name).trim() : "";
    return resolved ? `oklch(${resolved})` : fallback;
  }
  return value;
}

function drawBranch(
  ctx: CanvasRenderingContext2D,
  config: FractalConfig,
  x: number,
  y: number,
  angle: number,
  length: number,
  depth: number,
  colorIndex: number,
) {
  if (depth <= 0 || length < 2) return;
  const nextX = x + Math.cos(angle) * length;
  const nextY = y + Math.sin(angle) * length;
  const color = cssColor(config.palette[colorIndex % config.palette.length], "#7c3aed");

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.6, config.lineWidth * (depth / config.depth));
  ctx.shadowColor = color;
  ctx.shadowBlur = 12 * config.glow;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(
    x + Math.cos(angle - config.curl) * length * 0.34,
    y + Math.sin(angle - config.curl) * length * 0.34,
    x + Math.cos(angle + config.curl) * length * 0.72,
    y + Math.sin(angle + config.curl) * length * 0.72,
    nextX,
    nextY,
  );
  ctx.stroke();

  drawBranch(ctx, config, nextX, nextY, angle - config.spread, length * config.branchScale, depth - 1, colorIndex + 1);
  drawBranch(ctx, config, nextX, nextY, angle + config.spread, length * config.branchScale, depth - 1, colorIndex + 2);
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const config = fractal.config;
  const serialized = useMemo(() => JSON.stringify(config), [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(240, Math.floor(rect.width * scale));
    const height = Math.max(180, Math.floor(rect.height * scale));
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createRadialGradient(width * 0.45, height * 0.42, width * 0.1, width * 0.5, height * 0.48, width * 0.76);
    bg.addColorStop(0, cssColor(config.palette[0] ?? "var(--color-primary)", "#7c3aed"));
    bg.addColorStop(0.42, cssColor(config.palette[1] ?? "var(--color-secondary)", "#0891b2"));
    bg.addColorStop(1, cssColor("var(--color-base-300)", "#0f172a"));
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.34;

    for (let ring = 0; ring < config.rings; ring += 1) {
      ctx.strokeStyle = cssColor(config.palette[ring % config.palette.length], "#7c3aed");
      ctx.globalAlpha = 0.12 + ring * 0.015;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * (0.25 + ring / Math.max(2, config.rings)), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.9;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let arm = 0; arm < config.symmetry; arm += 1) {
      const armAngle = config.rotation + (arm / config.symmetry) * Math.PI * 2;
      for (const [index, branch] of config.branches.entries()) {
        drawBranch(ctx, config, centerX, centerY, armAngle + branch.angle * 0.18, radius * branch.length, config.depth, index + arm);
      }
    }
    ctx.globalAlpha = 1;
  }, [fractal.seed, serialized, config]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={clsx("h-full min-h-44 w-full rounded-2xl bg-[var(--surface)]", className)}
    />
  );
}
