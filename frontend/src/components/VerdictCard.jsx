import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';

function ConfidenceRing({ value, detected, size = 72, strokeWidth = 7 }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    function animate(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(value * eased * 10) / 10);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [value]);

  const gradientId = detected ? 'ring-gradient-alert' : 'ring-gradient-success';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-gradient-alert" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5484D" />
            <stop offset="100%" stopColor="#F5A623" />
          </linearGradient>
          <linearGradient id="ring-gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22B573" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={detected ? 'rgba(229, 72, 77, 0.12)' : 'rgba(34, 181, 115, 0.12)'}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-sm font-bold tabular-nums leading-none ${detected ? 'text-alert' : 'text-success'}`}>
          {Number.isFinite(animatedValue) ? Math.round(animatedValue) : 0}%
        </span>
      </div>
    </div>
  );
}

function formatPathologyList(names) {
  if (!names.length) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export default function VerdictCard({ result, selectedDisease, displayConfidence }) {
  if (!result) return null;

  const findings = result.findings || [];
  const hasFindings = findings.some((f) => f.positive);
  const activePathology = findings.find((f) => f.raw_key === selectedDisease) || findings[0];
  const confidence = Number.isFinite(displayConfidence)
    ? displayConfidence
    : activePathology
      ? Math.round(activePathology.probability * 100)
      : 0;

  const positiveNames = findings
    .filter((f) => f.positive)
    .map((f) => f.disease || f.raw_key)
    .slice(0, 3);

  const header = hasFindings
    ? 'Pathological Findings Detected'
    : 'No Significant Pathologies Detected';

  const description = hasFindings
    ? `Elevated indicators for ${formatPathologyList(positiveNames)}.`
    : 'No pathological features exceeded decision thresholds.';

  const selectedName = activePathology?.disease || activePathology?.raw_key || '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card overflow-hidden ${
        hasFindings
          ? 'bg-gradient-to-r from-alert/[0.06] via-white/90 to-caution/[0.04]'
          : 'bg-gradient-to-r from-success/[0.06] via-white/90 to-cyan/[0.04]'
      }`}
    >
      <div className="px-4 py-3 md:px-5 md:py-3.5 flex items-center gap-4">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {hasFindings ? (
            <AlertTriangle className="w-5 h-5 text-alert shrink-0" strokeWidth={2.2} />
          ) : (
            <CheckCircle className="w-5 h-5 text-success shrink-0" strokeWidth={2.2} />
          )}
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${
            hasFindings ? 'bg-alert/10 text-alert' : 'bg-success/10 text-success'
          }`}>
            {hasFindings ? 'Abnormal' : 'Normal'}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-extrabold text-shell-heading leading-tight truncate">
              {header}
            </h2>
            <p className="text-xs text-shell-body truncate">{description}</p>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end mr-1 shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-shell-muted font-semibold">Selected</span>
          <span className="text-xs font-bold text-shell-heading">{selectedName}</span>
        </div>

        <ConfidenceRing value={confidence} detected={hasFindings} />
      </div>
    </motion.div>
  );
}
