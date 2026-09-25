import HistoryGrid from '../components/HistoryGrid';

export default function HistoryPage() {
  return (
    <div className="pt-24 pb-20 min-h-[85vh] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-black/[0.05] dark:border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              Clinical Archive
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-shell-heading tracking-tight">
              Analysis History
            </h1>
            <p className="text-sm text-shell-muted mt-1 max-w-xl">
              Review past chest radiograph interpretations, AI pathology detections, Grad-CAM heatmaps, and quadrant metrics.
            </p>
          </div>
        </div>
      </div>
      <HistoryGrid showHeader={false} />
    </div>
  );
}
