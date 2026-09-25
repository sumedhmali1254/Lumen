import { motion } from 'framer-motion';

function getFindingStyles(finding) {
  const isDetected = finding.positive ?? finding.detected;
  const riskLevel = finding.risk_level ?? 'Low';

  if (riskLevel === 'Moderate / Borderline') {
    return {
      pill: 'bg-amber-50 text-amber-700 border border-amber-200',
      dot: 'bg-amber-500',
    };
  }

  if (!isDetected) {
    return {
      pill: 'bg-gray-100 text-shell-muted border border-gray-200/50',
      dot: 'bg-gray-300',
    };
  }

  return {
    pill: 'bg-alert/10 text-alert border border-alert/20',
    dot: 'bg-alert',
  };
}

export default function FindingsSummary({ findings, selectedDisease, onSelectDisease }) {
  if (!findings || findings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="flex flex-wrap items-center gap-2 mt-5"
    >
      <span className="text-xs font-semibold text-shell-muted uppercase tracking-wider mr-1">
        Findings:
      </span>
      {findings.map((finding, i) => {
        const name = finding.disease || finding.name;
        const pct = ((finding.probability ?? finding.confidence ?? 0) * 100).toFixed(0);
        const isDetected = finding.positive ?? finding.detected;
        const riskLevel = finding.risk_level;
        const styles = getFindingStyles(finding);
        const isSelected = finding.raw_key === selectedDisease;

        let statusText = isDetected ? 'Detected' : 'Not Detected';
        if (riskLevel === 'Moderate / Borderline') {
          statusText = 'Borderline';
        }

        return (
          <motion.button
            type="button"
            key={finding.raw_key || name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
            onClick={() => finding.raw_key && onSelectDisease?.(finding.raw_key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${styles.pill} ${
              isSelected ? 'ring-2 ring-primary/40' : ''
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
            {name}: {statusText} {pct}%
          </motion.button>
        );
      })}
    </motion.div>
  );
}
