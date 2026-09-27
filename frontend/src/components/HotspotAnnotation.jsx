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

  // Display hotspot marker & tooltip immediately
  useEffect(() => {
    if (!show || !pos) {
      setCrosshairsDone(false);
      setShowTooltip(false);
      return;
    }

    setCrosshairsDone(true);
    setShowTooltip(true);
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
      {/* Region highlight box if selected */}
      {regionBox && (
        <svg
          width={containerWidth}
          height={containerHeight}
          className="absolute inset-0"
          style={{ zIndex: 15 }}
        >
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
        </svg>
      )}
    </div>
  );
}
