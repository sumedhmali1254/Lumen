import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Sun, Moon, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useBackend } from '../context/BackendContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const { status, isOnline, healthInfo, checkHealth } = useBackend();
  const [isRetrying, setIsRetrying] = useState(false);

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

  const handleRetry = async (e) => {
    e.preventDefault();
    setIsRetrying(true);
    await checkHealth();
    setTimeout(() => setIsRetrying(false), 500);
  };

  const navLinks = [
    { label: 'Analyze', href: '/' },
    { label: 'History', href: '/history' },
  ];

  const deviceName = healthInfo?.device ? healthInfo.device.toUpperCase() : null;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`glass-navbar fixed top-0 left-0 right-0 z-50 ${scrolled ? 'scrolled' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Eye-catching LUMEN Text Logo (No Dot) */}
        <Link to="/" className="flex items-center gap-2 group select-none">
          <span className="text-2xl font-black tracking-[0.15em] bg-gradient-to-r from-blue-600 via-primary-light to-cyan bg-clip-text text-transparent group-hover:opacity-90 transition-all">
            LUMEN
          </span>
          <span className="text-[10px] font-mono font-bold tracking-widest text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 shadow-sm">
            AI
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.label}
                to={link.href}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 shadow-sm'
                    : 'text-shell-body hover:text-shell-heading hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="ml-3 pl-3 border-l border-black/[0.08] dark:border-white/[0.08] flex items-center gap-3">
            {/* Live Model Status Badge */}
            {isOnline ? (
              <div
                title={`Backend connected • Device: ${deviceName || 'CUDA/CPU'}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-sm transition-all"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Model Ready</span>
                {deviceName && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 font-mono uppercase tracking-wider">
                    {deviceName}
                  </span>
                )}
              </div>
            ) : status === 'connecting' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Connecting...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRetry}
                title="Backend offline. Click to test connection."
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Model Inactive</span>
                <RefreshCw className={`w-3 h-3 ml-0.5 text-rose-500 transition-transform ${isRetrying ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-shell-muted hover:text-shell-heading hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Toggle & Status */}
        <div className="flex items-center gap-2 md:hidden">
          {isOnline ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Ready
            </span>
          ) : (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Offline
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-shell-muted hover:bg-black/[0.04] transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
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
          className="md:hidden border-t border-black/[0.06] dark:border-white/[0.08] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl"
        >
          <div className="px-6 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${
                  location.pathname === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-shell-body hover:text-shell-heading hover:bg-black/[0.03]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs text-shell-muted">
              <span>Status:</span>
              <span className={isOnline ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                {isOnline ? `Online (${deviceName || 'Ready'})` : 'Backend Disconnected'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
