import { motion } from 'framer-motion';

export default function FindingsSummary({ findings }) {
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
        const pct = (finding.confidence * 100).toFixed(0);
        return (
          <motion.span
            key={finding.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
              ${finding.detected
                ? 'bg-alert/10 text-alert border border-alert/20'
                : 'bg-gray-100 text-shell-muted border border-gray-200/50'
              }
            `}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${finding.detected ? 'bg-alert' : 'bg-gray-300'}`} />
            {finding.name.replace(' / Consolidation', '')}: {finding.detected ? 'Detected' : 'Not Detected'} {pct}%
          </motion.span>
        );
      })}
    </motion.div>
  );
}
