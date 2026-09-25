export default function HeatmapControls({ intensity, onIntensityChange, viewMode, onViewModeChange }) {
  const modes = [
    { key: 'original', label: 'Original' },
    { key: 'heatmap', label: 'Heatmap' },
    { key: 'split', label: 'Split' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="heatmap-slider" className="text-[10px] font-semibold text-panel-label uppercase tracking-wider">
            Heatmap
          </label>
          <span className="font-mono text-[10px] text-cyan tabular-nums">{Math.round(intensity)}%</span>
        </div>
        <input
          id="heatmap-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value={intensity}
          onChange={(e) => onIntensityChange(Number(e.target.value))}
          className="heatmap-slider w-full"
          aria-label="Heatmap intensity"
        />
      </div>

      <div className="flex rounded-lg bg-white/5 border border-white/5 p-0.5 shrink-0">
        {modes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => onViewModeChange(mode.key)}
            className={`
              px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all duration-200
              ${viewMode === mode.key
                ? 'bg-primary text-white shadow-md'
                : 'text-panel-label hover:text-panel-heading hover:bg-white/5'
              }
            `}
            aria-pressed={viewMode === mode.key}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
