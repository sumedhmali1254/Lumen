import { motion } from "framer-motion";
import { Shield, AlertTriangle, Activity } from "lucide-react";

export default function RegionCard({ region, index, onClick, isHighlighted }) {
  const affected = Boolean(region.affected || (region.confidence && region.confidence >= 0.35));
  const confidencePct = Math.round((Number(region.confidence || region.score || 0)) * 100);

  // Anatomical clinical mapping
  const anatomicalLabels = {
    "Top-Left": { name: "Right Upper Zone", lobe: "RUL / RMZ", side: "Patient Right" },
    "Top-Right": { name: "Left Upper Zone", lobe: "LUL", side: "Patient Left" },
    "Bottom-Left": { name: "Right Lower Zone", lobe: "RLL / Base", side: "Patient Right" },
    "Bottom-Right": { name: "Left Lower Zone", lobe: "LLL / Base", side: "Patient Left" },
  };

  const anatomical = anatomicalLabels[region.name] || {
    name: region.name,
    lobe: "Lung Zone",
    side: "Radiographic View"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      whileHover={{ y: -3, scale: 1.01 }}
      onClick={onClick}
      className={`
        p-4.5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group
        ${
          isHighlighted
            ? "bg-white dark:bg-slate-900 ring-2 ring-primary border-primary/50 shadow-xl shadow-primary/10"
            : affected
              ? "bg-white/90 dark:bg-slate-900/90 border border-rose-300 dark:border-rose-900/60 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/5 shadow-sm"
              : "bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/5 shadow-sm"
        }
      `}
      role="button"
      tabIndex={0}
      aria-label={`${region.name} (${anatomical.name}): ${affected ? "Elevated activation" : "Clear"}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              affected
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {affected ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {region.name}
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">
                ({anatomical.name})
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {anatomical.lobe} · {anatomical.side}
            </span>
          </div>
        </div>

        {/* Confidence Percentage Chip */}
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${
            affected
              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          {confidencePct}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden w-full mb-2.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, confidencePct))}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${
            affected
              ? "bg-gradient-to-r from-amber-500 to-rose-500"
              : "bg-gradient-to-r from-emerald-400 to-cyan"
          }`}
        />
      </div>

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              affected ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
            }`}
          />
          <span
            className={`font-bold text-[11px] ${
              affected ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {affected ? "Elevated activation" : "Clear (Baseline)"}
          </span>
        </div>

        <span className="text-[10px] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          Highlight on Viewer ↑
        </span>
      </div>
    </motion.div>
  );
}
