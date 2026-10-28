"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  ReactFlow,
  Handle,
  Position,
  Controls,
  BaseEdge,
  getBezierPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AI_PROVIDERS } from "@/shared/constants/providers";
import { getProviderIconSrc, markProviderIconMissing } from "@/shared/utils/providerIcon";

// Force-stop FE animation if a provider stays active longer than this
const FE_ACTIVE_TIMEOUT_MS = 60000;
const FE_ACTIVE_TICK_MS = 1000;

// Kame + electric particles along active edges
const KAME_PARTICLE_COUNT = 6;
const SPARK_COUNT = 5;

function getProviderConfig(providerId) {
  return AI_PROVIDERS[providerId] || { color: "#6b7280", name: providerId };
}

function getProviderImageUrl(providerId) {
  return getProviderIconSrc(providerId);
}

// Custom provider node - rectangle with image + name
function ProviderNode({ data }) {
  const { label, color, imageUrl, textIcon, active, error } = data;
  const [imgError, setImgError] = useState(false);
  const isError = Boolean(error);
  const borderCol = isError ? "#ef4444" : active ? color : "var(--color-border)";
  const shadowStyle = isError
    ? "0 0 16px rgba(239, 68, 68, 0.45)"
    : active
    ? `0 0 16px ${color}40`
    : "none";

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border-2 transition-all duration-300 bg-bg"
      style={{
        borderColor: borderCol,
        boxShadow: shadowStyle,
        minWidth: "150px",
      }}
    >
      <Handle type="target" position={Position.Top} id="top" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Right} id="right" className="!bg-transparent !border-0 !w-0 !h-0" />

      {/* Provider icon */}
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: isError ? "rgba(239, 68, 68, 0.15)" : `${color}15` }}
      >
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={label}
            className="w-6 h-6 rounded-sm object-contain"
            loading="lazy"
            decoding="async"
            onError={() => {
              const m = imageUrl?.match(/^\/providers\/([^/]+)\.png$/i);
              if (m) markProviderIconMissing(m[1]);
              setImgError(true);
            }}
          />
        ) : (
          <span className="text-sm font-bold" style={{ color: isError ? "#ef4444" : color }}>{textIcon}</span>
        )}
      </div>

      {/* Provider name */}
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className="text-base font-medium truncate"
          style={{ color: isError ? "#ef4444" : active ? color : "var(--color-text)" }}
        >
          {label}
        </span>
        {isError && (
          <span className="text-[10px] font-semibold text-red-500 uppercase tracking-tight">
            Gagal Tersambung
          </span>
        )}
      </div>

      {/* Active / Error indicator */}
      {isError ? (
        <span className="relative flex h-2.5 w-2.5 shrink-0" title="Gagal Tersambung">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
      ) : active ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
        </span>
      ) : null}
    </div>
  );
}

ProviderNode.propTypes = {
  data: PropTypes.object.isRequired,
};

// Center 9Router node — pulse/glow on card only (no expanding rings)
function RouterNode({ data }) {
  const powering = (data.activeCount || 0) > 0;
  return (
    <div
      className={`relative z-[1] flex items-center justify-center px-5 py-3 rounded-xl border-2 min-w-[130px] ${
        powering
          ? "topology-router-core border-yellow-300 bg-gradient-to-br from-primary/30 via-yellow-400/20 to-cyan-400/25"
          : "border-primary bg-primary/5 shadow-md"
      }`}
    >
      <Handle type="source" position={Position.Top} id="top" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-transparent !border-0 !w-0 !h-0" />

      <img
        src="/favicon.svg"
        alt="9Router"
        className={`w-6 h-6 mr-2 ${powering ? "topology-router-icon" : ""}`}
        loading="lazy"
        decoding="async"
      />
      <span className={`text-sm font-bold ${powering ? "topology-router-label text-yellow-300" : "text-primary"}`}>
        9Router
      </span>
      {data.activeCount > 0 && (
        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-yellow-400 text-black text-xs font-bold topology-router-badge">
          {data.activeCount}
        </span>
      )}
    </div>
  );
}

RouterNode.propTypes = {
  data: PropTypes.object.isRequired,
};

// Active: electric beam with green (router -> provider) and orange (provider -> router).
// Error: pulsating red edge (gagal tersambung).
// Last: orange edge (provider -> router).
// Idle: subtle border.
function TopologyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const active = Boolean(data?.active);
  const error = Boolean(data?.error);
  const last = Boolean(data?.last);
  const stroke = style.stroke || "var(--color-border)";
  const filterId = `topo-electric-${id}`;

  // State 1: Gagal Tersambung (MERAH)
  if (error) {
    return (
      <g className="topology-edge-error">
        <defs>
          <filter id={`topo-err-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.8" />
          </filter>
        </defs>
        {/* Glowing red backline */}
        <path
          d={edgePath}
          fill="none"
          stroke="#ef4444"
          strokeWidth={7}
          strokeOpacity={0.35}
          filter={`url(#topo-err-${id})`}
        />
        {/* Animated dashed red main edge */}
        <BaseEdge
          id={id}
          path={edgePath}
          style={{ stroke: "#ef4444", strokeWidth: 2.5, strokeDasharray: "6 4" }}
          className="topology-edge-error-line"
        />
        {/* Pulsing warning particles */}
        <circle r={3.5} fill="#ef4444" style={{ filter: "drop-shadow(0 0 5px #ef4444)" }}>
          <animateMotion dur="1.2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      </g>
    );
  }

  // State 2: Active (HIJAU input token: Router -> Provider, ORANGE output token: Provider -> Router)
  if (active) {
    return (
      <g className="topology-edge-electric">
        <defs>
          <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2" result="noise">
              <animate attributeName="baseFrequency" values="0.8;1.4;0.8" dur="0.25s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>

        {/* Outer glowing halo */}
        <path
          d={edgePath}
          fill="none"
          stroke={`url(#grad-${id})`}
          strokeWidth={8}
          strokeOpacity={0.35}
          strokeLinecap="round"
          filter={`url(#${filterId})`}
          className="topology-edge-halo"
        />

        {/* Mid dual stream core line */}
        <BaseEdge
          id={id}
          path={edgePath}
          style={{ stroke: `url(#grad-${id})`, strokeWidth: 2.5, opacity: 0.95 }}
          className="topology-edge-plasma"
        />

        {/* Hijau: Input Tokens (Router -> Provider) */}
        {Array.from({ length: 4 }, (_, i) => (
          <circle
            key={`${id}-in-${i}`}
            r={i % 2 === 0 ? 3.5 : 2.5}
            fill="#10b981"
            opacity={0.95}
            style={{ filter: "drop-shadow(0 0 5px #10b981)" }}
          >
            <animateMotion
              dur={`${0.5 + i * 0.1}s`}
              repeatCount="indefinite"
              path={edgePath}
              begin={`${i * 0.12}s`}
            />
          </circle>
        ))}

        {/* Orange: Output Tokens / Respon (Provider -> Router) */}
        {Array.from({ length: 4 }, (_, i) => (
          <circle
            key={`${id}-out-${i}`}
            r={i % 2 === 0 ? 3.5 : 2.5}
            fill="#f97316"
            opacity={0.95}
            style={{ filter: "drop-shadow(0 0 5px #f97316)" }}
          >
            <animateMotion
              dur={`${0.5 + i * 0.1}s`}
              repeatCount="indefinite"
              path={edgePath}
              keyPoints="1;0"
              keyTimes="0;1"
              begin={`${i * 0.12 + 0.05}s`}
            />
          </circle>
        ))}
      </g>
    );
  }

  // State 3: Last connected / response path (ORANGE: Provider -> Router)
  if (last) {
    return (
      <g className="topology-edge-last">
        <BaseEdge id={id} path={edgePath} style={{ stroke: "#f97316", strokeWidth: 2, opacity: 0.8 }} />
        {/* Soft orange pulse particle from provider back to router */}
        <circle r={2.5} fill="#f97316" opacity={0.85} style={{ filter: "drop-shadow(0 0 4px #f97316)" }}>
          <animateMotion dur="2.2s" repeatCount="indefinite" path={edgePath} keyPoints="1;0" keyTimes="0;1" />
        </circle>
      </g>
    );
  }

  // State 4: Idle
  return <BaseEdge id={id} path={edgePath} style={{ ...style, stroke }} />;
}

TopologyEdge.propTypes = {
  id: PropTypes.string,
  sourceX: PropTypes.number,
  sourceY: PropTypes.number,
  targetX: PropTypes.number,
  targetY: PropTypes.number,
  sourcePosition: PropTypes.string,
  targetPosition: PropTypes.string,
  style: PropTypes.object,
  data: PropTypes.object,
};

const nodeTypes = { provider: ProviderNode, router: RouterNode };
const edgeTypes = { topology: TopologyEdge };

// Place N nodes evenly along an ellipse around the router center.
function buildLayout(providers, activeSet, lastSet, errorSet) {
  const nodeW = 180;
  const nodeH = 30;
  const routerW = 120;
  const routerH = 44;
  const nodeGap = 24;

  const count = providers.length;

  // Compute rx so arc spacing between nodes >= nodeW + nodeGap
  const minRx = ((nodeW + nodeGap) * count) / (2 * Math.PI);
  const rx = Math.max(320, minRx);
  const ry = Math.max(200, rx * 0.55); // ellipse ratio ~0.55
  if (count === 0) {
    return {
      nodes: [{ id: "router", type: "router", position: { x: 0, y: 0 }, data: { activeCount: 0 }, draggable: false }],
      edges: [],
    };
  }

  const nodes = [];
  const edges = [];

  nodes.push({
    id: "router",
    type: "router",
    position: { x: -routerW / 2, y: -routerH / 2 },
    data: { activeCount: activeSet.size },
    draggable: false,
  });

  const edgeStyle = (active, last, error) => {
    if (error) return { stroke: "#ef4444", strokeWidth: 2.5, opacity: 0.9 };
    if (active) return { stroke: "#10b981", strokeWidth: 3, opacity: 1 };
    if (last) return { stroke: "#f97316", strokeWidth: 2, opacity: 0.8 };
    return { stroke: "var(--color-border)", strokeWidth: 1, opacity: 0.3 };
  };

  providers.forEach((p, i) => {
    const config = getProviderConfig(p.provider);
    const active = activeSet.has(p.provider?.toLowerCase());
    const last = !active && lastSet.has(p.provider?.toLowerCase());
    const error = !active && errorSet.has(p.provider?.toLowerCase());
    const nodeId = `provider-${p.provider}`;
    const data = {
      label: (config.name !== p.provider ? config.name : null) || p.nodeName || p.name || p.provider,
      color: config.color || "#6b7280",
      imageUrl: getProviderImageUrl(p.provider),
      textIcon: config.textIcon || (p.provider || "?").slice(0, 2).toUpperCase(),
      active,
      error,
      last,
    };

    // Distribute evenly starting from top (−π/2), clockwise
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    const cx = rx * Math.cos(angle);
    const cy = ry * Math.sin(angle);

    // Pick router handle closest to the node direction
    let sourceHandle, targetHandle;
    if (Math.abs(angle + Math.PI / 2) < Math.PI / 4 || Math.abs(angle - 3 * Math.PI / 2) < Math.PI / 4) {
      sourceHandle = "top"; targetHandle = "bottom";
    } else if (Math.abs(angle - Math.PI / 2) < Math.PI / 4) {
      sourceHandle = "bottom"; targetHandle = "top";
    } else if (cx > 0) {
      sourceHandle = "right"; targetHandle = "left";
    } else {
      sourceHandle = "left"; targetHandle = "right";
    }

    nodes.push({
      id: nodeId,
      type: "provider",
      position: { x: cx - nodeW / 2, y: cy - nodeH / 2 },
      data,
      draggable: false,
    });

    edges.push({
      id: `e-${nodeId}`,
      type: "topology",
      source: "router",
      sourceHandle,
      target: nodeId,
      targetHandle,
      // Built-in animated uses stroke-dasharray (CPU-heavy); use particle beam instead
      animated: false,
      data: { active },
      style: edgeStyle(active, last, error),
    });
  });

  return { nodes, edges };
}

export default function ProviderTopology({ providers = [], activeRequests = [], lastProvider = "", errorProvider = "" }) {
  // Serialize to stable string keys so useMemo only re-runs when values actually change
  const activeKey = useMemo(
    () => activeRequests.map((r) => r.provider?.toLowerCase()).filter(Boolean).sort().join(","),
    [activeRequests]
  );
  const lastKey = lastProvider?.toLowerCase() || "";
  const errorKey = errorProvider?.toLowerCase() || "";

  const rawActiveSet = useMemo(() => new Set(activeKey ? activeKey.split(",") : []), [activeKey]);
  const lastSet = useMemo(() => new Set(lastKey ? [lastKey] : []), [lastKey]);
  const errorSet = useMemo(() => new Set(errorKey ? [errorKey] : []), [errorKey]);

  // Track firstSeen per active provider; drop provider if running too long (BE stuck)
  const firstSeenRef = useRef({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const seen = firstSeenRef.current;
    const now = Date.now();
    for (const p of rawActiveSet) {
      if (!seen[p]) seen[p] = now;
    }
    for (const p of Object.keys(seen)) {
      if (!rawActiveSet.has(p)) delete seen[p];
    }
  }, [rawActiveSet]);

  useEffect(() => {
    if (rawActiveSet.size === 0) return;
    const id = setInterval(() => setTick((t) => t + 1), FE_ACTIVE_TICK_MS);
    return () => clearInterval(id);
  }, [rawActiveSet]);

  const activeSet = useMemo(() => {
    const now = Date.now();
    const filtered = new Set();
    for (const p of rawActiveSet) {
      const ts = firstSeenRef.current[p];
      if (!ts || now - ts < FE_ACTIVE_TIMEOUT_MS) filtered.add(p);
    }
    return filtered;
  }, [rawActiveSet, tick]);

  const { nodes, edges } = useMemo(
    () => buildLayout(providers, activeSet, lastSet, errorSet),
    [providers, activeSet, lastSet, errorSet]
  );

  // Stable key — only remount when provider list changes
  const providersKey = useMemo(
    () => providers.map((p) => p.provider).sort().join(","),
    [providers]
  );

  const rfInstance = useRef(null);
  const containerRef = useRef(null);
  const fitOpts = { padding: 0.2, duration: 200 };
  const onInit = useCallback((instance) => {
    rfInstance.current = instance;
    setTimeout(() => instance.fitView(fitOpts), 50);
  }, []);

  // Re-fit on container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (rfInstance.current) rfInstance.current.fitView(fitOpts);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Re-fit when node count/layout changes
  useEffect(() => {
    if (rfInstance.current) {
      const id = setTimeout(() => rfInstance.current.fitView(fitOpts), 50);
      return () => clearTimeout(id);
    }
  }, [nodes.length]);

  return (
    <div ref={containerRef} className="relative h-[320px] w-full min-w-0 rounded-lg border border-border bg-bg-subtle/30 sm:h-[480px]">
      {/* Topology Status Legend Overlay */}
      <div className="absolute top-2.5 left-2.5 z-10 hidden sm:flex flex-wrap items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface/90 border border-border/80 backdrop-blur-md text-[11px] font-medium text-text-muted shadow-sm pointer-events-none select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          <span className="text-text-main font-semibold">Hijau: Input (Router → Provider)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
          <span className="text-text-main font-semibold">Oranye: Output (Provider → Router)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
          <span className="text-red-500 font-semibold">Merah: Gagal Tersambung</span>
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="h-full flex items-center justify-center text-text-muted text-sm">
          No providers connected
        </div>
      ) : (
        <ReactFlow
          key={providersKey}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={fitOpts}
          minZoom={0.1}
          maxZoom={2}
          onInit={onInit}
          proOptions={{ hideAttribution: true }}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick
          preventScrolling={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Controls showInteractive={false} className="react-flow-controls-custom" />
        </ReactFlow>
      )}
    </div>
  );
}

ProviderTopology.propTypes = {
  providers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    provider: PropTypes.string,
    name: PropTypes.string,
  })),
  activeRequests: PropTypes.arrayOf(PropTypes.shape({
    provider: PropTypes.string,
    model: PropTypes.string,
    account: PropTypes.string,
  })),
  lastProvider: PropTypes.string,
  errorProvider: PropTypes.string,
};
