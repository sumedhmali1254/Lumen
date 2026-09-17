import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Clock, Brain } from 'lucide-react';

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
      // Ease out cubic
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
  { icon: Zap, value: '92', suffix: '%', label: 'Accuracy', color: 'text-primary' },
  { icon: Clock, value: '3', suffix: 's', label: 'Instant Results', color: 'text-success' },
  { icon: Brain, value: '100', suffix: '%', label: 'Fully Explainable', color: 'text-cyan' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

export default function Hero() {
  return (
    <section className="pt-28 pb-12 px-6 md:pt-36 md:pb-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto text-center"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.07] text-primary text-xs font-semibold mb-6 border border-primary/10">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Powered by DenseNet-121 + Grad-CAM
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-shell-heading leading-[1.1] mb-5"
        >
          Explainable AI for{' '}
          <span className="bg-gradient-to-r from-primary via-primary-light to-cyan bg-clip-text text-transparent">
            Chest Radiograph
          </span>{' '}
          Analysis
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-shell-body max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Upload a chest X-ray and get an instant, human-readable diagnosis with 
          visual explanations. Know exactly <em>where</em> and <em>why</em>.
        </motion.p>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card-sm px-6 py-4 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-default">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color === 'text-primary' ? 'from-primary/10 to-primary/5' : stat.color === 'text-success' ? 'from-success/10 to-success/5' : 'from-cyan/10 to-cyan/5'} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-left">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-shell-muted font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
