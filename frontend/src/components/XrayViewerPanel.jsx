import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Move, Edit3, Maximize2, Circle } from 'lucide-react';
import HotspotAnnotation from './HotspotAnnotation';
import HeatmapControls from './HeatmapControls';
import { MOCK_XRAY_SVG, MOCK_HEATMAP_SVG } from '../data/mockData';

export default function XrayViewerPanel({ result, xrayImage, highlightedRegion }) {
  const [viewMode, setViewMode] = useState('heatmap');
  const [intensity, setIntensity] = useState(0.55);
  const [activeTool, setActiveTool] = useState('move');
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 512, h: 512 });

  const imageSrc = xrayImage || MOCK_XRAY_SVG;
  const heatmapSrc = result?.heatmap_base64 || MOCK_HEATMAP_SVG;

  // Track container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ w: rect.width, h: rect.width }); // Square aspect
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Split-view drag
  const handleSplitMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSplitPos(pct);
    };

    const handleUp = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingSplit]);

  const tools = [
    { key: 'move', icon: Move, label: 'Pan/Move' },
    { key: 'annotate', icon: Edit3, label: 'Annotate' },
    { key: 'fullscreen', icon: Maximize2, label: 'Fullscreen' },
  ];

  const handleFullscreen = () => {
    if (containerRef.current?.parentElement) {
      const el = containerRef.current.parentElement;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        el.requestFullscreen?.();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass-card overflow-hidden"
    >
      <div className="dark-panel m-3 md:m-4">
        {/* Toolbar */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5" style={{ zIndex: 25 }}>
          {tools.map((tool) => (
            <button
              key={tool.key}
              onClick={() => {
                if (tool.key === 'fullscreen') handleFullscreen();
                else setActiveTool(tool.key);
              }}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                border border-white/10 backdrop-blur-sm
                ${activeTool === tool.key && tool.key !== 'fullscreen'
                  ? 'bg-primary/30 text-primary-light shadow-md shadow-primary/20 border-primary/40'
                  : 'bg-white/5 text-panel-label hover:bg-white/10 hover:text-panel-heading'
                }
              `}
              aria-label={tool.label}
              title={tool.label}
            >
              <tool.icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Patient Metadata */}
        <div className="absolute top-3 right-3 text-right font-mono text-[10px] text-panel-label/60 leading-relaxed" style={{ zIndex: 25 }}>
          <div>DOE, JOHN · DOB: 01‑01‑1980 · MRN: 1234567</div>
          <div>Date: 12 OCT 2023 · Study: CXR PA Upright</div>
          <div>Technique: 120kVp, 4.0mAs</div>
        </div>

        {/* Image Canvas */}
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden select-none"
          style={{
            aspectRatio: '1 / 1',
            cursor: activeTool === 'move' ? 'grab' : 'crosshair',
          }}
        >
          {/* R orientation marker */}
          <div className="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm font-bold text-white/30" style={{ zIndex: 10 }}>
            R
          </div>

          {/* Original X-ray */}
          {viewMode !== 'split' && (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              src={imageSrc}
              alt="Chest X-ray radiograph"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          )}

          {/* Heatmap overlay (non-split mode) */}
          {viewMode !== 'split' && (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: viewMode === 'heatmap' ? intensity : 0 }}
              transition={{ duration: 0.3 }}
              src={heatmapSrc}
              alt="Grad-CAM heatmap overlay"
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
              draggable={false}
              style={{ opacity: viewMode === 'heatmap' ? intensity : 0 }}
            />
          )}

          {/* Split View */}
          {viewMode === 'split' && (
            <>
              {/* Left: Original */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
              >
                <img
                  src={imageSrc}
                  alt="Original X-ray"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>

              {/* Right: Heatmap */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
              >
                <img
                  src={imageSrc}
                  alt="X-ray with heatmap"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                <img
                  src={heatmapSrc}
                  alt="Heatmap overlay"
                  className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
                  style={{ opacity: intensity }}
                  draggable={false}
                />
              </div>

              {/* Split divider */}
              <div
                className="split-divider"
                style={{ left: `${splitPos}%` }}
                onMouseDown={handleSplitMouseDown}
                onTouchStart={handleSplitMouseDown}
                role="separator"
                aria-label="Split view divider"
                aria-valuenow={Math.round(splitPos)}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-10 rounded-md bg-cyan/20 backdrop-blur-sm border border-cyan/30 flex items-center justify-center">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-3 rounded-full bg-cyan/60" />
                    <div className="w-0.5 h-3 rounded-full bg-cyan/60" />
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 font-mono text-[10px]" style={{ zIndex: 25 }}>
                <span className="px-2 py-0.5 rounded bg-black/50 text-panel-label">Original</span>
                <span className="px-2 py-0.5 rounded bg-black/50 text-cyan">Heatmap</span>
              </div>
            </>
          )}

          {/* Hotspot Annotation */}
          {result?.hotspot && viewMode !== 'original' && (
            <HotspotAnnotation
              hotspot={result.hotspot}
              containerWidth={containerSize.w}
              containerHeight={containerSize.h}
              imageWidth={512}
              imageHeight={512}
              show={true}
              highlightedRegion={highlightedRegion}
            />
          )}
        </div>

        {/* Controls */}
        <div className="px-4 pb-4">
          <HeatmapControls
            intensity={intensity}
            onIntensityChange={setIntensity}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Bottom Info Bar */}
        {result?.image_meta && (
          <div className="px-4 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-[10px] text-panel-label/50">
            <div className="flex items-center gap-4">
              <span>CXR PA {result.image_meta.resolution}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Layer: {result.image_meta.layer}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Circle className={`w-2 h-2 fill-current ${result.image_meta.alignment_ok ? 'text-success' : 'text-alert'}`} />
              <span>Grad-CAM Spatial Alignment: {result.image_meta.alignment_ok ? 'OK' : 'WARN'}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
