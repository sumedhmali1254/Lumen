import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Clock, Brain, Sparkles, CheckCircle2 } from 'lucide-react';

function AnimatedCounter({ value, suffix = '', duration = 1.5 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const numericValue = parseFloat(value);

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const start = 0;
    const end = numericValue;
    const startTime = performance.now();
    const dur = duration * 1000;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      if (Number.isInteger(numericValue)) {
        el.textContent = Math.round(current) + suffix;
      } else {
        el.textContent = current.toFixed(0) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [inView, numericValue, suffix, duration]);

  return <span ref={ref}>0{suffix}</span>;
}

const stats = [
  { icon: Zap, value: '92', suffix: '%', label: 'Inference Accuracy', color: 'text-primary' },
  { icon: Clock, value: '3', suffix: 's', label: 'Full Diagnostic Pipeline', color: 'text-emerald-500' },
  { icon: Brain, value: '14', suffix: ' Classes', label: 'NIH ChestX-ray14', color: 'text-cyan-dark dark:text-cyan' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

export default function Hero() {
  return (
    <section className="pt-28 pb-12 px-4 sm:px-6 md:pt-36 md:pb-16 relative overflow-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto text-center"
      >
        {/* Top Badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.08] text-primary text-xs font-bold mb-6 border border-primary/15 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>NIH ChestX-ray14 · DenseNet-121 + Grad-CAM Engine</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-shell-heading leading-[1.1] mb-5"
        >
          Explainable AI for{' '}
          <span className="bg-gradient-to-r from-primary via-primary-light to-cyan bg-clip-text text-transparent">
            Chest Radiograph
          </span>{' '}
          Intelligence
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl text-shell-body max-w-2xl mx-auto leading-relaxed mb-10 font-medium"
        >
          Upload chest radiographs for instant multi-label pathology detection, anatomical quadrant scoring, and localized Grad-CAM visual evidence.
        </motion.p>

        {/* Interactive Metric Cards */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card-sm px-5 py-4 flex items-center gap-3.5 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-default border border-slate-200/80 dark:border-white/10"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center shadow-inner">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-left">
                <div className={`text-2xl font-black tracking-tight ${stat.color} font-mono tabular-nums`}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-shell-muted font-bold tracking-tight">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
