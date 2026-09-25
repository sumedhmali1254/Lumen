import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";

function MiniBar({ value, affected }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => setWidth(value * 100), 200);
      return () => clearTimeout(timer);
    }
  }, [inView, value]);

  return (
    <div
      ref={ref}
      className="h-1.5 rounded-full bg-gray-100 overflow-hidden w-full"
    >
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${
          affected
            ? "bg-gradient-to-r from-alert to-caution"
            : "bg-gradient-to-r from-success to-cyan"
        }`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default function RegionCard({ region, index, onClick, isHighlighted }) {
  const affected = region.affected;

  const tones = {
    "Top-Left": {
      border: "border-[#f87171]/60",
      ring: "ring-[#f87171]/35",
      glow: "shadow-[0_0_0_1px_rgba(248,113,113,0.35),0_8px_22px_rgba(248,113,113,0.12)]",
      bar: "from-[#f87171] to-[#fb923c]",
      dot: "bg-[#f87171]",
      badge: "bg-[#f87171]/10 text-[#f87171]",
      label: "text-[#f87171]",
    },
    "Top-Right": {
      border: "border-[#f59e0b]/60",
      ring: "ring-[#f59e0b]/35",
      glow: "shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_8px_22px_rgba(245,158,11,0.12)]",
      bar: "from-[#f59e0b] to-[#fbbf24]",
      dot: "bg-[#f59e0b]",
      badge: "bg-[#f59e0b]/10 text-[#b45309]",
      label: "text-[#b45309]",
    },
    "Bottom-Left": {
      border: "border-[#14b8a6]/60",
      ring: "ring-[#14b8a6]/35",
      glow: "shadow-[0_0_0_1px_rgba(20,184,166,0.35),0_8px_22px_rgba(20,184,166,0.12)]",
      bar: "from-[#14b8a6] to-[#34d399]",
      dot: "bg-[#14b8a6]",
      badge: "bg-[#14b8a6]/10 text-[#0f766e]",
      label: "text-[#0f766e]",
    },
    "Bottom-Right": {
      border: "border-[#60a5fa]/60",
      ring: "ring-[#60a5fa]/35",
      glow: "shadow-[0_0_0_1px_rgba(96,165,250,0.35),0_8px_22px_rgba(96,165,250,0.12)]",
      bar: "from-[#60a5fa] to-[#38bdf8]",
      dot: "bg-[#60a5fa]",
      badge: "bg-[#60a5fa]/10 text-[#2563eb]",
      label: "text-[#2563eb]",
    },
  };

  const tone = tones[region.name] || {
    border: "border-slate-300/70",
    ring: "ring-slate-300/30",
    glow: "shadow-[0_0_0_1px_rgba(148,163,184,0.25),0_8px_22px_rgba(148,163,184,0.08)]",
    bar: "from-slate-400 to-slate-500",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
    label: "text-slate-600",
  };

  const selectedColor =
    {
      "Top-Left": "#f87171",
      "Top-Right": "#f59e0b",
      "Bottom-Left": "#14b8a6",
      "Bottom-Right": "#60a5fa",
    }[region.name] || "#94a3b8";

  const selectedStyles = isHighlighted
    ? {
        borderColor: selectedColor,
        boxShadow: `0 0 0 2px ${selectedColor}33, 0 10px 28px ${selectedColor}33`,
        transform: "scale(1.02)",
        background: "rgba(255,255,255,0.92)",
      }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`
        glass-card-sm p-5 cursor-pointer transition-all duration-300 group rounded-2xl border-[2px]
        ${isHighlighted ? "" : tone.border}
        ${affected ? "hover:border-alert/60" : "hover:border-emerald-400/40"}
      `}
      style={{
        ...selectedStyles,
        borderWidth: isHighlighted ? 2 : 1.5,
        animation: affected
          ? "border-pulse-red 3s ease-in-out infinite"
          : "border-pulse-green 3s ease-in-out infinite",
      }}
      role="button"
      tabIndex={0}
      aria-label={`${region.name} lung region: ${affected ? "Affected" : "Clear"}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {affected ? (
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${tone.badge}`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${tone.label}`} />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-success" />
            </div>
          )}
          <h4 className={`text-sm font-bold ${tone.label}`}>{region.name}</h4>
        </div>
        <span className="font-mono text-xs text-shell-muted tabular-nums">
          {(region.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden w-full">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-all duration-1000 ease-out`}
          style={{
            width: `${Math.max(0, Math.min(100, region.confidence * 100))}%`,
          }}
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
        <span
          className={`text-xs font-semibold ${affected ? "text-alert" : "text-success"}`}
        >
          {affected ? "Elevated activation" : "Clear"}
        </span>
      </div>

      {/* Click hint */}
      <div className="mt-2 text-[10px] text-shell-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Click to highlight on viewer ↑
      </div>
    </motion.div>
  );
}
