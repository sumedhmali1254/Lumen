import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

function statusFor(finding) {
  const isPositive = finding.positive ?? finding.detected;
  if (isPositive) {
    return { label: 'Detected', tone: 'text-alert bg-alert/10', bar: 'linear-gradient(90deg, #E5484D, #F5A623)' };
  }
  if (finding.risk_level === 'Moderate / Borderline') {
    return { label: 'Watch', tone: 'text-caution bg-caution/10', bar: 'linear-gradient(90deg, #F5A623, #FCD34D)' };
  }
  return { label: 'Low', tone: 'text-shell-muted bg-gray-100', bar: 'linear-gradient(90deg, #94A3B8, #CBD5E1)' };
}

function PathologyRow({ finding, selected, onSelect }) {
  const [filled, setFilled] = useState(false);
  const pct = (finding.probability ?? 0) * 100;
  const thresholdPct = (finding.threshold ?? 0) * 100;
  const status = statusFor(finding);

  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(finding.raw_key)}
      className={`w-full text-left rounded-xl px-3 py-2.5 transition-all ${
        selected
          ? 'bg-primary/10 ring-1 ring-primary/25 shadow-sm'
          : 'hover:bg-black/[0.03]'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: isPositiveColor(finding) }}
        />
        <span className="text-sm font-semibold text-shell-heading flex-1 min-w-0 truncate">
          {finding.disease || finding.name}
        </span>
        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${status.tone}`}>
          {status.label}
        </span>
        <span className="font-mono text-xs font-semibold text-shell-heading tabular-nums w-12 text-right">
          {pct.toFixed(1)}%
        </span>
      </div>

      <div className="relative h-2.5 rounded-full bg-slate-200/80 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: filled ? `${Math.min(Math.max(pct, 2), 100)}%` : '0%',
            background: status.bar,
            transition: 'width 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        <div
          className="absolute top-[-2px] bottom-[-2px] w-[2px] rounded-full bg-slate-700/70"
          style={{ left: `${Math.min(thresholdPct, 98)}%` }}
          title={`Decision threshold ${thresholdPct.toFixed(1)}%`}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-shell-muted">
        <span>Threshold {thresholdPct.toFixed(1)}%</span>
        <span>{pct >= thresholdPct ? 'Above cutoff' : 'Below cutoff'}</span>
      </div>
    </button>
  );
}

function isPositiveColor(finding) {
  if (finding.positive ?? finding.detected) return '#E5484D';
  if (finding.risk_level === 'Moderate / Borderline') return '#F5A623';
  return '#CBD5E1';
}

export default function ProbabilitiesSidebar({ findings, selectedDisease, onSelectDisease }) {
  if (!findings || findings.length === 0) return null;

  const positives = findings.filter((f) => f.positive).length;

  return (
    <div className="glass-card h-full min-h-0 flex flex-col p-4 md:p-5">
      <div className="flex items-center gap-2.5 mb-1 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-shell-heading leading-tight">Pathology scores</h3>
          <p className="text-[11px] text-shell-muted">
            {positives} of {findings.length} above threshold · click to view heatmap
          </p>
        </div>
      </div>

      <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
        {findings.map((finding) => (
          <PathologyRow
            key={finding.raw_key || finding.disease}
            finding={finding}
            selected={finding.raw_key === selectedDisease}
            onSelect={onSelectDisease}
          />
        ))}
      </div>
    </div>
  );
}
