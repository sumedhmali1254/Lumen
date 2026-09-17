import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';

function ConfidenceRing({ value, detected, size = 100, strokeWidth = 8 }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const duration = 1200;
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
    <div className="relative" style={{ width: size, height: size }}>
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
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={detected ? 'rgba(229, 72, 77, 0.1)' : 'rgba(34, 181, 115, 0.1)'}
          strokeWidth={strokeWidth}
        />
        {/* Animated arc */}
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
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold tabular-nums ${detected ? 'text-alert' : 'text-success'}`}>
          {animatedValue.toFixed(1)}%
        </span>
        <span className="text-[10px] text-shell-muted font-medium uppercase tracking-wider">
          Confidence
        </span>
      </div>
    </div>
  );
}

export default function VerdictCard({ result }) {
  if (!result) return null;

  const { pneumonia_detected, overall_confidence, verdict_text, hotspot } = result;
  const confidencePercent = (overall_confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        glass-card overflow-hidden
        ${pneumonia_detected
          ? 'bg-gradient-to-br from-alert/[0.04] via-white/85 to-caution/[0.03]'
          : 'bg-gradient-to-br from-success/[0.04] via-white/85 to-cyan/[0.03]'
        }
      `}
    >
      <div className="p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
          {/* Icon + Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              {pneumonia_detected ? (
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <AlertTriangle className="w-8 h-8 text-alert" strokeWidth={2} />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                >
                  <CheckCircle className="w-8 h-8 text-success" strokeWidth={2} />
                </motion.div>
              )}
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                pneumonia_detected
                  ? 'bg-alert/10 text-alert'
                  : 'bg-success/10 text-success'
              }`}>
                {pneumonia_detected ? 'Alert' : 'Normal'}
              </div>
            </div>

            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-3xl md:text-[36px] font-extrabold text-shell-heading leading-tight mb-3"
            >
              {pneumonia_detected
                ? 'Pneumonia Indicators Detected'
                : 'No Pneumonia Indicators Detected'
              }
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="text-base md:text-lg text-shell-body leading-relaxed"
            >
              {pneumonia_detected && hotspot
                ? `Infiltrate found in the ${hotspot.zone} lung region`
                : 'The X-ray appears normal across all lung regions'
              }
            </motion.p>
          </div>

          {/* Confidence Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="shrink-0"
          >
            <ConfidenceRing
              value={confidencePercent}
              detected={pneumonia_detected}
              size={120}
              strokeWidth={10}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
