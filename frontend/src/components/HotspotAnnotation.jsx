import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function HotspotAnnotation({
  hotspot,
  containerWidth,
  containerHeight,
  imageWidth,
  imageHeight,
  show,
  highlightedRegion,
}) {
  const annotationRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [crosshairsDone, setCrosshairsDone] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Compute hotspot pixel position relative to the container
  const getHotspotPosition = useCallback(() => {
    if (!hotspot || !imageWidth || !imageHeight) return null;

    // hotspot.x and hotspot.y are in the original image coordinate space (512x512 for mock)
    const scaleX = containerWidth / 512;
    const scaleY = containerHeight / 512;
    const px = hotspot.x * scaleX;
    const py = hotspot.y * scaleY;

    return { px, py };
  }, [hotspot, containerWidth, containerHeight, imageWidth, imageHeight]);

  const pos = getHotspotPosition();

  // Animate tooltip position for auto-repositioning
  useEffect(() => {
    if (!pos || !show) return;

    // Position tooltip: prefer right side, fallback left
    let tx = pos.px + 30;
    let ty = pos.py - 60;

    // If too far right, move to left
    if (tx + 260 > containerWidth) {
      tx = pos.px - 290;
    }
    // If too far left
    if (tx < 10) {
      tx = 10;
    }
    // If too high
    if (ty < 10) {
      ty = 10;
    }
    // If too low
    if (ty + 180 > containerHeight) {
      ty = containerHeight - 190;
    }

    setTooltipPos({ x: tx, y: ty });
  }, [pos, containerWidth, containerHeight, show]);

  // Trigger crosshair → tooltip sequence
  useEffect(() => {
    if (!show || !pos) {
      setCrosshairsDone(false);
      setShowTooltip(false);
      return;
    }

    setCrosshairsDone(false);
    setShowTooltip(false);

    const crossTimer = setTimeout(() => setCrosshairsDone(true), 900);
    const tooltipTimer = setTimeout(() => setShowTooltip(true), 1300);

    return () => {
      clearTimeout(crossTimer);
      clearTimeout(tooltipTimer);
    };
  }, [show, pos]);

  if (!pos || !show) return null;

  // Region bounding box for highlighting
  const getRegionBox = (regionName) => {
    const halfW = containerWidth / 2;
    const halfH = containerHeight / 2;
    const pad = 4;
    switch (regionName) {
      case 'Top-Left': return { x: pad, y: pad, w: halfW - pad * 2, h: halfH - pad * 2 };
      case 'Top-Right': return { x: halfW + pad, y: pad, w: halfW - pad * 2, h: halfH - pad * 2 };
      case 'Bottom-Left': return { x: pad, y: halfH + pad, w: halfW - pad * 2, h: halfH - pad * 2 };
      case 'Bottom-Right': return { x: halfW + pad, y: halfH + pad, w: halfW - pad * 2, h: halfH - pad * 2 };
      default: return null;
    }
  };

  const regionBox = highlightedRegion ? getRegionBox(highlightedRegion) : null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
      <svg
        width={containerWidth}
        height={containerHeight}
        className="absolute inset-0"
        style={{ zIndex: 15 }}
      >
        {/* Horizontal crosshair */}
        <line
          x1={0}
          y1={pos.py}
          x2={containerWidth}
          y2={pos.py}
          stroke="#22D3EE"
          strokeWidth={1}
          opacity={0.7}
          className="crosshair-line"
          style={{ animationDelay: '0.1s' }}
        />
        {/* Vertical crosshair */}
        <line
          x1={pos.px}
          y1={0}
          x2={pos.px}
          y2={containerHeight}
          stroke="#22D3EE"
          strokeWidth={1}
          opacity={0.7}
          className="crosshair-line"
          style={{ animationDelay: '0.3s' }}
        />

        {/* Region highlight box */}
        {regionBox && (
          <motion.rect
            initial={{ opacity: 0, strokeDashoffset: 600 }}
            animate={{ opacity: 1, strokeDashoffset: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            x={regionBox.x}
            y={regionBox.y}
            width={regionBox.w}
            height={regionBox.h}
            fill="none"
            stroke="#E5484D"
            strokeWidth={2}
            strokeDasharray="8 4"
            rx={8}
            opacity={0.8}
          >
            <animate
              attributeName="opacity"
              values="0.5;0.9;0.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </motion.rect>
        )}
      </svg>

      {/* Pulsing hotspot marker */}
      <AnimatePresence>
        {crosshairsDone && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute"
            style={{
              left: pos.px,
              top: pos.py,
              transform: 'translate(-50%, -50%)',
              zIndex: 16,
            }}
          >
            <div
              className="w-10 h-10 rounded-full border-2 border-alert flex items-center justify-center bg-alert/20"
              style={{ animation: 'pulse-hotspot 2s ease-in-out infinite' }}
            >
              <AlertTriangle className="w-4 h-4 text-alert" strokeWidth={2.5} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating annotation card */}
      <AnimatePresence>
        {showTooltip && hotspot && (
          <motion.div
            ref={annotationRef}
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute pointer-events-auto"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              zIndex: 20,
              width: 260,
            }}
          >
            <div className="bg-[#1a1f2e]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-alert" />
                <span className="text-xs font-bold text-alert uppercase tracking-wider">
                  Primary Hotspot
                </span>
              </div>

              {/* Body */}
              <div className="px-4 py-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-panel-label uppercase tracking-wider">Zone:</span>
                  <span className="px-2 py-0.5 rounded-md bg-alert/15 text-alert text-xs font-bold">
                    {hotspot.zone?.replace('-', '‑')}
                  </span>
                </div>

                <p className="text-xs text-panel-heading leading-relaxed">
                  {hotspot.description}
                </p>

                <div className="font-mono text-[10px] text-panel-label leading-relaxed pt-1 border-t border-white/5">
                  Coordinates: (x:{hotspot.x}, y:{hotspot.y})&nbsp;&nbsp;&nbsp;p‑val: &lt;0.001
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
