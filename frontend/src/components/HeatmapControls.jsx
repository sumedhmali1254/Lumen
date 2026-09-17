import { motion } from 'framer-motion';

export default function HeatmapControls({ intensity, onIntensityChange, viewMode, onViewModeChange }) {
  const modes = [
    { key: 'original', label: 'Original' },
    { key: 'heatmap', label: 'Heatmap' },
    { key: 'split', label: 'Split View' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-4 px-4 py-3 rounded-xl bg-white/5 border border-white/5"
    >
      {/* Slider */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="heatmap-slider"
            className="text-xs font-semibold text-panel-label uppercase tracking-wider"
          >
            Heatmap Intensity
          </label>
          <span className="font-mono text-xs text-cyan tabular-nums">
            {Math.round(intensity * 100)}%
          </span>
        </div>
        <input
          id="heatmap-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={intensity}
          onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
          className="heatmap-slider w-full"
          aria-label="Heatmap intensity"
        />
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-8 bg-white/10" />

      {/* View Mode Toggle */}
      <div className="flex rounded-lg bg-white/5 border border-white/5 p-0.5 shrink-0">
        {modes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => onViewModeChange(mode.key)}
            className={`
              px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200
              ${viewMode === mode.key
                ? 'bg-primary text-white shadow-md'
                : 'text-panel-label hover:text-panel-heading hover:bg-white/5'
              }
            `}
            aria-pressed={viewMode === mode.key}
            aria-label={`View mode: ${mode.label}`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
