import { motion } from "framer-motion";
import { Activity, Info } from "lucide-react";

export default function LungsAnatomy({ result, highlightedRegion }) {
  if (!result || !result.regions) return null;

  const isAffected = (regionName) => {
    const region = result.regions.find((r) => r.name === regionName);
    return Boolean(region?.affected || (region?.confidence && region.confidence >= 0.35));
  };

  const getRegionConfidence = (regionName) => {
    const region = result.regions.find((r) => r.name === regionName);
    return Math.round((Number(region?.confidence || 0)) * 100);
  };

  const getRegionColor = (regionName) => {
    if (highlightedRegion === regionName) return "#1E60E8";
    if (isAffected(regionName)) return "#EF4444";
    return "#10B981";
  };

  const getRegionFillOpacity = (regionName) => {
    if (highlightedRegion === regionName) return 0.75;
    if (isAffected(regionName)) return 0.55;
    return 0.22;
  };

  return (
    <div className="flex flex-col items-center justify-between p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 glass-card-sm h-full shadow-sm">
      <div className="w-full flex items-center justify-between mb-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" />
          Anatomical Mapping
        </h4>
        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          4-Zone Model
        </span>
      </div>

      <div className="relative w-44 h-44 sm:w-48 sm:h-48 my-2 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
          {/* Trachea & Main Bronchi */}
          <g opacity="0.45" className="text-slate-400 dark:text-slate-500">
            {/* Trachea */}
            <path
              d="M96 12 C96 10 104 10 104 12 L104 46 L96 46 Z"
              fill="currentColor"
            />
            {/* Cartilage rings */}
            <line x1="95" y1="18" x2="105" y2="18" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
            <line x1="95" y1="26" x2="105" y2="26" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
            <line x1="95" y1="34" x2="105" y2="34" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
            <line x1="95" y1="42" x2="105" y2="42" stroke="#ffffff" strokeWidth="1" opacity="0.6" />

            {/* Right Main Bronchus (Viewer's Left) */}
            <path
              d="M97 45 C92 50 82 60 78 66 L83 69 C87 64 96 52 100 48 Z"
              fill="currentColor"
            />
            {/* Left Main Bronchus (Viewer's Right) */}
            <path
              d="M103 45 C108 50 118 60 122 66 L117 69 C113 64 104 52 100 48 Z"
              fill="currentColor"
            />
          </g>

          {/* Top-Left Lung (Viewer's Left = Patient's Right Upper Lobe) */}
          <motion.path
            d="M84 55 C64 42 42 65 36 96 C48 97 66 97 84 97 C87 84 90 68 84 55 Z"
            fill={getRegionColor("Top-Left")}
            fillOpacity={getRegionFillOpacity("Top-Left")}
            stroke={getRegionColor("Top-Left")}
            strokeWidth={highlightedRegion === "Top-Left" ? 2.5 : 1.5}
            animate={{ scale: highlightedRegion === "Top-Left" ? 1.02 : 1 }}
            transition={{ duration: 0.3 }}
            className="cursor-pointer transition-colors duration-300"
          />

          {/* Bottom-Left Lung (Viewer's Left = Patient's Right Lower Lobe) */}
          <motion.path
            d="M36 99 C32 128 42 162 58 172 C76 166 85 152 84 99 C66 99 48 99 36 99 Z"
            fill={getRegionColor("Bottom-Left")}
            fillOpacity={getRegionFillOpacity("Bottom-Left")}
            stroke={getRegionColor("Bottom-Left")}
            strokeWidth={highlightedRegion === "Bottom-Left" ? 2.5 : 1.5}
            animate={{ scale: highlightedRegion === "Bottom-Left" ? 1.02 : 1 }}
            transition={{ duration: 0.3 }}
            className="cursor-pointer transition-colors duration-300"
          />

          {/* Top-Right Lung (Viewer's Right = Patient's Left Upper Lobe) */}
          <motion.path
            d="M116 55 C136 42 158 65 164 96 C152 97 134 97 116 97 C113 84 110 68 116 55 Z"
            fill={getRegionColor("Top-Right")}
            fillOpacity={getRegionFillOpacity("Top-Right")}
            stroke={getRegionColor("Top-Right")}
            strokeWidth={highlightedRegion === "Top-Right" ? 2.5 : 1.5}
            animate={{ scale: highlightedRegion === "Top-Right" ? 1.02 : 1 }}
            transition={{ duration: 0.3 }}
            className="cursor-pointer transition-colors duration-300"
          />

          {/* Bottom-Right Lung with Cardiac Notch (Viewer's Right = Patient's Left Lower Lobe) */}
          <motion.path
            d="M164 99 C168 128 158 162 142 172 C124 166 117 148 116 99 C134 99 152 99 164 99 Z"
            fill={getRegionColor("Bottom-Right")}
            fillOpacity={getRegionFillOpacity("Bottom-Right")}
            stroke={getRegionColor("Bottom-Right")}
            strokeWidth={highlightedRegion === "Bottom-Right" ? 2.5 : 1.5}
            animate={{ scale: highlightedRegion === "Bottom-Right" ? 1.02 : 1 }}
            transition={{ duration: 0.3 }}
            className="cursor-pointer transition-colors duration-300"
          />

          {/* Heart Silhouette Outline / Cardiac Notch indication */}
          <path
            d="M90 105 C90 92 110 92 115 110 C120 128 102 144 95 148 C90 144 82 128 90 105 Z"
            fill="rgba(148, 163, 184, 0.08)"
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>

        {/* Pulsing Hotspot Waves for Affected Zones */}
        {result.regions.map((r) => {
          if (!isAffected(r.name)) return null;
          let left = "28%";
          let top = "36%";
          if (r.name === "Top-Left") { left = "28%"; top = "36%"; }
          if (r.name === "Bottom-Left") { left = "28%"; top = "70%"; }
          if (r.name === "Top-Right") { left = "72%"; top = "36%"; }
          if (r.name === "Bottom-Right") { left = "72%"; top = "70%"; }

          return (
            <div
              key={r.name}
              className="absolute pointer-events-none"
              style={{ left, top, transform: "translate(-50%, -50%)" }}
            >
              <span className="relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500/80 shadow-md shadow-rose-500/50" />
              </span>
            </div>
          );
        })}
      </div>

      <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Patient Orientation (Left is Patient's Right)</span>
        </p>
      </div>
    </div>
  );
}
