"use client";

import { CAPACITY_META } from "@/shared/constants/models";
import Tooltip from "./Tooltip";

function formatContext(tokens) {
  if (!tokens || typeof tokens !== "number" || tokens <= 0 || !Number.isFinite(tokens)) return null;
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}k`;
  }
  return `${tokens}`;
}

function getContextColor(tokens) {
  if (tokens >= 1_000_000) {
    return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
  }
  if (tokens >= 128_000) {
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  }
  if (tokens >= 32_000) {
    return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
  }
  return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30";
}

// Render small icon badges and context length for a model's capabilities
export default function CapacityBadges({
  caps,
  className = "",
  colorOverride,
  size = 14,
  showContext = true,
}) {
  if (!caps) return null;

  const ctxFormatted = showContext ? formatContext(caps.contextWindow) : null;
  const active = Object.keys(CAPACITY_META).filter((k) => caps[k]);

  if (!ctxFormatted && active.length === 0) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {ctxFormatted && (
        <Tooltip text={`Kapasitas Konteks: ${caps.contextWindow.toLocaleString()} token`}>
          <span
            className={`inline-flex items-center px-1.5 py-0.2 rounded font-mono font-semibold text-[9px] border leading-tight ${getContextColor(
              caps.contextWindow
            )}`}
          >
            {ctxFormatted}
          </span>
        </Tooltip>
      )}

      {active.length > 0 && (
        <span className="inline-flex items-center gap-0.5">
          {active.map((k) => (
            <Tooltip key={k} text={`${CAPACITY_META[k].label} — ${CAPACITY_META[k].desc}`}>
              <span
                className={`material-symbols-outlined leading-none cursor-help transition-transform hover:scale-110 ${
                  colorOverride || CAPACITY_META[k].color
                }`}
                style={{ fontSize: `${size}px` }}
              >
                {CAPACITY_META[k].icon}
              </span>
            </Tooltip>
          ))}
        </span>
      )}
    </span>
  );
}
