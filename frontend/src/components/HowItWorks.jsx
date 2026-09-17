import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Upload, Cpu, Eye, FileText } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload',
    description: 'Drop your chest X-ray image — JPG, PNG, DICOM supported.',
    color: 'from-primary/10 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    icon: Cpu,
    title: 'DenseNet-121 Analysis',
    description: 'A 121-layer deep CNN processes the image through learned radiographic features.',
    color: 'from-cyan/10 to-cyan/5',
    iconColor: 'text-cyan-dark',
  },
  {
    icon: Eye,
    title: 'Grad-CAM Explanation',
    description: 'Gradient-weighted class activation mapping highlights the exact regions driving the prediction.',
    color: 'from-caution/10 to-caution/5',
    iconColor: 'text-caution',
  },
  {
    icon: FileText,
    title: 'Human-Readable Verdict',
    description: 'Results presented in plain language anyone can understand, with visual annotations.',
    color: 'from-success/10 to-success/5',
    iconColor: 'text-success',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" className="px-6 py-16 md:py-20" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-shell-heading mb-3">
            How It Works
          </h2>
          <p className="text-sm text-shell-muted max-w-xl mx-auto">
            From upload to verdict in under 3 seconds — fully explainable at every step.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 relative">
          {/* Connection line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/20 via-cyan/20 to-success/20" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="glass-card-sm p-6 text-center relative hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >
              {/* Step number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-shell-muted shadow-sm">
                {i + 1}
              </div>

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-4`}>
                <step.icon className={`w-6 h-6 ${step.iconColor}`} />
              </div>

              <h3 className="text-sm font-bold text-shell-heading mb-2">{step.title}</h3>
              <p className="text-xs text-shell-muted leading-relaxed">{step.description}</p>

              {/* Arrow (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 -right-4 text-shell-muted/30 text-lg">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
