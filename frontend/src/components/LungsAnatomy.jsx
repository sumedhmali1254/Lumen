import { motion } from "framer-motion";

export default function LungsAnatomy({ result, highlightedRegion }) {
  if (!result || !result.regions) return null;

  const regionPalette = {
    "Top-Left": { fill: "#f87171", stroke: "#ef4444" },
    "Top-Right": { fill: "#f59e0b", stroke: "#d97706" },
    "Bottom-Left": { fill: "#14b8a6", stroke: "#0f766e" },
    "Bottom-Right": { fill: "#60a5fa", stroke: "#2563eb" },
  };

  const isAffected = (regionName) => {
    const region = result.regions.find((r) => r.name === regionName);
    return region ? region.affected : false;
  };

  const getRegionColor = (regionName) => {
    if (highlightedRegion === regionName)
      return regionPalette[regionName]?.stroke || "#e2e8f0";
    return isAffected(regionName)
      ? "var(--color-alert)"
      : "var(--color-success)";
  };

  const getRegionOpacity = (regionName) => {
    if (highlightedRegion === regionName) return 0.9;
    return isAffected(regionName) ? 0.6 : 0.25;
  };

  const getStrokeWidth = (regionName) =>
    highlightedRegion === regionName ? 3 : 1;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10 glass-card">
      <h3 className="text-sm font-bold text-shell-heading mb-4 uppercase tracking-wide">
        Anatomical Mapping
      </h3>
      <div className="relative w-48 h-48 sm:w-56 sm:h-56">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
          {/* Trachea */}
          <path
            d="M95 10 L105 10 L105 45 L95 45 Z"
            fill="var(--color-shell-muted)"
            opacity="0.3"
          />
          <path
            d="M100 40 L85 60 L80 55 L95 35 Z"
            fill="var(--color-shell-muted)"
            opacity="0.3"
          />
          <path
            d="M100 40 L115 60 L120 55 L105 35 Z"
            fill="var(--color-shell-muted)"
            opacity="0.3"
          />

          {/* Top-Left Lung (Viewer's Left, Patient's Right) */}
          <motion.path
            d="M85 55 C60 45 40 70 35 100 C45 100 65 100 85 100 C90 85 95 70 85 55 Z"
            fill={getRegionColor("Top-Left")}
            initial={{ opacity: 0 }}
            animate={{ opacity: getRegionOpacity("Top-Left") }}
            transition={{ duration: 1 }}
            stroke={
              highlightedRegion === "Top-Left"
                ? regionPalette["Top-Left"].stroke
                : "var(--color-shell-heading)"
            }
            strokeWidth={getStrokeWidth("Top-Left")}
            className="transition-colors duration-500"
          />
          {/* Bottom-Left Lung */}
          <motion.path
            d="M35 100 C30 130 40 160 55 170 C75 165 85 155 85 100 C65 100 45 100 35 100 Z"
            fill={getRegionColor("Bottom-Left")}
            initial={{ opacity: 0 }}
            animate={{ opacity: getRegionOpacity("Bottom-Left") }}
            transition={{ duration: 1, delay: 0.1 }}
            stroke={
              highlightedRegion === "Bottom-Left"
                ? regionPalette["Bottom-Left"].stroke
                : "var(--color-shell-heading)"
            }
            strokeWidth={getStrokeWidth("Bottom-Left")}
            className="transition-colors duration-500"
          />

          {/* Top-Right Lung (Viewer's Right, Patient's Left) */}
          <motion.path
            d="M115 55 C140 45 160 70 165 100 C155 100 135 100 115 100 C110 85 105 70 115 55 Z"
            fill={getRegionColor("Top-Right")}
            initial={{ opacity: 0 }}
            animate={{ opacity: getRegionOpacity("Top-Right") }}
            transition={{ duration: 1, delay: 0.2 }}
            stroke={
              highlightedRegion === "Top-Right"
                ? regionPalette["Top-Right"].stroke
                : "var(--color-shell-heading)"
            }
            strokeWidth={getStrokeWidth("Top-Right")}
            className="transition-colors duration-500"
          />
          {/* Bottom-Right Lung */}
          <motion.path
            d="M165 100 C170 130 160 160 145 170 C125 165 115 155 115 100 C135 100 155 100 165 100 Z"
            fill={getRegionColor("Bottom-Right")}
            initial={{ opacity: 0 }}
            animate={{ opacity: getRegionOpacity("Bottom-Right") }}
            transition={{ duration: 1, delay: 0.3 }}
            stroke={
              highlightedRegion === "Bottom-Right"
                ? regionPalette["Bottom-Right"].stroke
                : "var(--color-shell-heading)"
            }
            strokeWidth={getStrokeWidth("Bottom-Right")}
            className="transition-colors duration-500"
          />
        </svg>

        {/* Pulsing indicator for affected areas */}
        {result.regions.map((r) => {
          if (!r.affected) return null;
          let cx, cy;
          if (r.name === "Top-Left") {
            cx = "25%";
            cy = "35%";
          }
          if (r.name === "Bottom-Left") {
            cx = "25%";
            cy = "75%";
          }
          if (r.name === "Top-Right") {
            cx = "75%";
            cy = "35%";
          }
          if (r.name === "Bottom-Right") {
            cx = "75%";
            cy = "75%";
          }

          return (
            <motion.div
              key={r.name}
              className="absolute w-6 h-6 bg-alert/40 rounded-full blur-sm"
              style={{ left: cx, top: cy, transform: "translate(-50%, -50%)" }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          );
        })}
      </div>
      <p className="text-xs text-shell-muted mt-2 text-center">
        Patient orientation (Left side of image is Patient's Right Lung)
      </p>
    </div>
  );
}
