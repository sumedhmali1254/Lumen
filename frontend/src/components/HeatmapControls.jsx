import { Eye, Layers, SplitSquareVertical, Sliders, Sun, Contrast, RotateCcw } from 'lucide-react';

export default function HeatmapControls({
  intensity,
  onIntensityChange,
  viewMode,
  onViewModeChange,
  brightness = 100,
  onBrightnessChange,
  contrast = 100,
  onContrastChange,
  onResetAdjustments,
}) {
  const modes = [
    { key: 'original', label: 'Original X-Ray', icon: Eye },
    { key: 'heatmap', label: 'Heatmap Overlay', icon: Layers },
    { key: 'split', label: 'Split Compare', icon: SplitSquareVertical },
  ];

  const presets = [25, 50, 75, 100];
  const hasAdjustments = brightness !== 100 || contrast !== 100 || intensity !== 65;

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/80 shadow-lg text-white space-y-3.5">
      {/* Top Row: Mode Selection & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan" />
          Visualization & Image Adjustments
        </span>

        <div className="flex items-center gap-2">
          {/* Reset button if adjusted */}
          {hasAdjustments && (
            <button
              type="button"
              onClick={onResetAdjustments}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Reset all brightness, contrast and opacity adjustments"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Mode Selector Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/90 border border-slate-700/80">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.key;
              return (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => onViewModeChange(mode.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sliders Grid: Brightness, Contrast & Heatmap Opacity */}
      <div className="pt-2.5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Slider 1: X-Ray Brightness / Exposure */}
        <div className="space-y-1 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              X-Ray Brightness
            </span>
            <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
              {brightness}%
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="160"
            step="2"
            value={brightness}
            onChange={(e) => onBrightnessChange?.(Number(e.target.value))}
            className="w-full h-1.5 rounded-lg bg-slate-700 accent-amber-400 cursor-pointer"
            aria-label="X-Ray brightness adjustment"
          />
        </div>

        {/* Slider 2: X-Ray Contrast / Shade */}
        <div className="space-y-1 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Contrast className="w-3.5 h-3.5 text-cyan" />
              Contrast / Shade
            </span>
            <span className="font-mono text-xs font-bold text-cyan tabular-nums">
              {contrast}%
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="160"
            step="2"
            value={contrast}
            onChange={(e) => onContrastChange?.(Number(e.target.value))}
            className="w-full h-1.5 rounded-lg bg-slate-700 accent-cyan cursor-pointer"
            aria-label="X-Ray contrast adjustment"
          />
        </div>

        {/* Slider 3: Heatmap Opacity (when heatmap/split mode is active) */}
        {viewMode !== 'original' ? (
          <div className="space-y-1 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary-light" />
                Heatmap Saliency
              </span>
              <span className="font-mono text-xs font-bold text-primary-light tabular-nums">
                {Math.round(intensity)}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="1"
              value={intensity}
              onChange={(e) => onIntensityChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-slate-700 accent-primary cursor-pointer"
              aria-label="Heatmap intensity opacity"
            />
          </div>
        ) : (
          <div className="hidden lg:flex items-center justify-center p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30 text-slate-500 text-xs font-mono">
            Switch to Heatmap to adjust overlay
          </div>
        )}
      </div>
    </div>
  );
}
