import { useEffect, useRef, useState } from 'react';
import { BarChart3, Filter, ChevronDown, CheckCircle2, XCircle, LayoutList } from 'lucide-react';

function statusFor(finding) {
  const isPositive = finding.positive ?? finding.detected;
  if (isPositive) {
    return { label: 'Detected', tone: 'text-rose-500 bg-rose-500/10', bar: 'linear-gradient(90deg, #E5484D, #F5A623)' };
  }
  if (finding.risk_level === 'Moderate / Borderline') {
    return { label: 'Watch', tone: 'text-amber-500 bg-amber-500/10', bar: 'linear-gradient(90deg, #F5A623, #FCD34D)' };
  }
  return { label: 'Not Detected', tone: 'text-slate-500 bg-slate-400/10', bar: 'linear-gradient(90deg, #94A3B8, #CBD5E1)' };
}

function isPositiveColor(finding) {
  if (finding.positive ?? finding.detected) return '#E5484D';
  if (finding.risk_level === 'Moderate / Borderline') return '#F5A623';
  return '#CBD5E1';
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
          : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
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

      <div className="relative h-2.5 rounded-full bg-slate-200/80 dark:bg-slate-700/60 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: filled ? `${Math.min(Math.max(pct, 2), 100)}%` : '0%',
            background: status.bar,
            transition: 'width 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        <div
          className="absolute top-[-2px] bottom-[-2px] w-[2px] rounded-full bg-slate-700/70 dark:bg-slate-300/60"
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

const FILTER_OPTIONS = [
  { key: 'all',      label: 'All Findings',  Icon: LayoutList,  color: 'text-slate-500' },
  { key: 'detected', label: 'Detected',       Icon: CheckCircle2, color: 'text-rose-500' },
  { key: 'clear',    label: 'Not Detected',   Icon: XCircle,     color: 'text-slate-400' },
];

export default function ProbabilitiesSidebar({ findings, selectedDisease, onSelectDisease }) {
  const [filter, setFilter] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!findings || findings.length === 0) return null;

  const positives = findings.filter((f) => f.positive).length;

  const filteredFindings = findings.filter((f) => {
    if (filter === 'all') return true;
    if (filter === 'detected') return (f.positive ?? f.detected) === true;
    if (filter === 'clear') return !(f.positive ?? f.detected);
    return true;
  });

  const activeOption = FILTER_OPTIONS.find((o) => o.key === filter);

  return (
    <div className="glass-card flex flex-col p-4 md:p-5 overflow-hidden" style={{ maxHeight: "calc(580px + 13.5rem)" }}>
      {/* Header Row */}
      <div className="flex items-center gap-2 mb-1 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-shell-heading leading-tight">Pathology scores</h3>
          <p className="text-[11px] text-shell-muted">
            {positives} of {findings.length} above threshold · click to view heatmap
          </p>
        </div>

        {/* Filter Dropdown Button */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm cursor-pointer ${
              filter !== 'all'
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/30 hover:text-primary'
            }`}
            title="Filter findings"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{activeOption?.label ?? 'All'}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
              {FILTER_OPTIONS.map(({ key, label, Icon, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setFilter(key); setDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-left transition-colors cursor-pointer ${
                    filter === key
                      ? 'bg-primary/10 text-primary'
                      : 'text-shell-heading hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${filter === key ? 'text-primary' : color}`} />
                  {label}
                  {filter === key && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="shrink-0 h-px bg-slate-100 dark:bg-slate-800 mt-2 mb-1" />

      {/* Results List — scrollable within the capped height */}
      <div
        className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-0.5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(148,163,184,0.5) transparent" }}
      >
        {filteredFindings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-shell-muted">
            <XCircle className="w-8 h-8 opacity-30" />
            <p className="text-xs text-center">
              No {filter === 'detected' ? 'detected' : 'clear'} findings
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <PathologyRow
              key={finding.raw_key || finding.disease}
              finding={finding}
              selected={finding.raw_key === selectedDisease}
              onSelect={onSelectDisease}
            />
          ))
        )}
      </div>
    </div>
  );
}
