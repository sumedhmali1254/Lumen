import { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { BarChart3, MapPin } from 'lucide-react';
import { useRef } from 'react';

function AnimatedBar({ finding, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);
  const pct = finding.confidence * 100;
  const thresholdPct = finding.threshold * 100;
  const delta = pct - thresholdPct;
  const exceeds = delta > 0;

  useEffect(() => {
    if (!inView) return;
    const duration = 800;
    const delay = index * 120;
    const timeout = setTimeout(() => {
      const start = performance.now();
      function animate(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(pct * eased);
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timeout);
  }, [inView, pct, index]);

  const barColor = finding.detected
    ? 'bg-gradient-to-r from-alert to-alert/70'
    : 'bg-gradient-to-r from-gray-300 to-gray-200';

  const dotColor = finding.detected ? 'bg-alert' : 'bg-gray-300';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -10 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group"
    >
      <div className="flex items-center gap-3 mb-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <span className="text-sm font-medium text-shell-heading flex-1 min-w-0 truncate">
          {finding.name}
        </span>
        <span className="font-mono text-xs text-shell-muted tabular-nums shrink-0">
          {displayValue.toFixed(1)}%
        </span>
        {exceeds && finding.detected && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-alert bg-alert/10 shrink-0">
            +{delta.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Bar */}
      <div className="relative h-2 rounded-full bg-gray-100 overflow-hidden ml-5">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
          style={{ width: `${displayValue}%` }}
          initial={{ width: 0 }}
        />
        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-shell-muted/40"
          style={{ left: `${thresholdPct}%` }}
        />
      </div>

      <div className="ml-5 mt-1">
        <span className="text-[10px] text-shell-muted">
          Threshold: {thresholdPct.toFixed(1)}%
        </span>
      </div>
    </motion.div>
  );
}

export default function ProbabilitiesSidebar({ findings, imageMeta }) {
  if (!findings || findings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-card p-6 md:p-7"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-shell-heading">Probabilities</h3>
      </div>
      <p className="text-[11px] text-shell-muted leading-relaxed mb-6 pl-[42px]">
        Softmax calibrated logistic output, evaluated against CheXNet label distribution thresholds.
      </p>

      {/* Findings List */}
      <div className="space-y-5">
        {findings.map((finding, i) => (
          <AnimatedBar key={finding.name} finding={finding} index={i} />
        ))}
      </div>

      {/* Technical Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1, duration: 0.5 }}
        className="mt-7 p-4 rounded-xl bg-gradient-to-br from-primary/[0.03] to-cyan/[0.02] border border-primary/10"
      >
        <div className="flex items-center gap-2 mb-2.5">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-shell-heading">
            Gradient Backpropagation Tensor
          </span>
        </div>
        <p className="text-[11px] text-shell-muted leading-relaxed">
          Weights correspond to final convolution layer activations projected into spatial map. 
          Activation clusters align with known radiographic bronchovascular markings in the apical region. 
          High-density focal zones indicate areas where the model assigns greatest predictive weight.
        </p>
      </motion.div>
    </motion.div>
  );
}
