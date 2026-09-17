import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Menu, X, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const navLinks = [
    { label: 'Analyze', href: '/' },
    { label: 'History', href: '/history' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`glass-navbar fixed top-0 left-0 right-0 z-50 ${scrolled ? 'scrolled' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-light to-cyan shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Activity className="w-5 h-5 text-white relative z-10" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-shell-heading to-shell-muted bg-clip-text text-transparent group-hover:from-primary group-hover:to-cyan transition-all duration-300">
            LUMEN
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="px-4 py-2 text-sm font-medium text-shell-body hover:text-shell-heading rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-3 pl-3 border-l border-black/[0.06] dark:border-white/[0.06] flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Model Ready
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-shell-muted hover:text-shell-heading hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-shell-muted hover:bg-black/[0.04] transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-shell-heading hover:bg-black/[0.04] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-black/[0.04] bg-white/90 backdrop-blur-xl"
        >
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-shell-body hover:text-shell-heading rounded-lg hover:bg-black/[0.03] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
