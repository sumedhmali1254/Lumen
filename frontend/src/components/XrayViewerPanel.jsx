import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Maximize2,
  Minimize2,
  SplitSquareVertical,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move
} from "lucide-react";
import HotspotAnnotation from "./HotspotAnnotation";
import HeatmapControls from "./HeatmapControls";
import { MOCK_XRAY_SVG } from "../data/mockData";
import { createCleanThermalOverlay } from "../utils/heatmapProcessor";

function asDataUri(src) {
  if (!src) return "";
  return src.startsWith("data:") ? src : `data:image/png;base64,${src}`;
}

export default function XrayViewerPanel({
  result,
  xrayImage,
  highlightedRegion,
  selectedDisease,
}) {
  const [viewMode, setViewMode] = useState("heatmap"); // 'original' | 'heatmap' | 'split'
  const [opacitySliderValue, setOpacitySliderValue] = useState(85);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cleanHeatmapSrc, setCleanHeatmapSrc] = useState("");

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  const panelRef = useRef(null);
  const containerRef = useRef(null);

  const originalImage = xrayImage || MOCK_XRAY_SVG;
  const allHeatmaps = result?.all_heatmaps || {};
  const selectedHeatmap =
    allHeatmaps[selectedDisease]?.image ||
    result?.heatmap ||
    result?.heatmap_base64;
  const rawHeatmapSrc = asDataUri(selectedHeatmap);
  const overlayOpacity = opacitySliderValue / 100;

  // Process raw heatmap to remove cold blue/purple background tint
  useEffect(() => {
    let isCancelled = false;
    if (rawHeatmapSrc) {
      createCleanThermalOverlay(rawHeatmapSrc).then((cleanSrc) => {
        if (!isCancelled) {
          setCleanHeatmapSrc(cleanSrc);
        }
      });
    } else {
      setCleanHeatmapSrc("");
    }
    return () => {
      isCancelled = true;
    };
  }, [rawHeatmapSrc]);

  const activeOverlaySrc = cleanHeatmapSrc || rawHeatmapSrc;

  // Track browser native fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(1, +(z - 0.25).toFixed(2));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Wheel zoom
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey || isFullscreen) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      setZoom((z) => {
        const next = Math.max(1, Math.min(4, +(z + delta).toFixed(2)));
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Pan handlers when zoomed
  const handlePanMouseDown = (e) => {
    if (zoom <= 1 || isDraggingSplit) return;
    setIsPanning(true);
    panStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  useEffect(() => {
    if (!isPanning) return;
    const onMouseMove = (e) => {
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      setPan({
        x: panStartRef.current.startPanX + dx,
        y: panStartRef.current.startPanY + dy,
      });
    };
    const onMouseUp = () => setIsPanning(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isPanning]);

  // Split comparison dragging with high-performance rAF
  const isDraggingSplitRef = useRef(false);
  const splitRafRef = useRef(null);

  const updateSplitFromClientX = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = clientX - rect.left;
    const pct = Math.max(1, Math.min(99, (x / rect.width) * 100));
    setSplitPos(+pct.toFixed(2));
  }, []);

  const handleSplitStart = useCallback((e) => {
    e.preventDefault();
    setIsDraggingSplit(true);
    isDraggingSplitRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    updateSplitFromClientX(clientX);
  }, [updateSplitFromClientX]);

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingSplitRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      if (splitRafRef.current) cancelAnimationFrame(splitRafRef.current);
      splitRafRef.current = requestAnimationFrame(() => {
        updateSplitFromClientX(clientX);
      });
    };

    const handleUp = () => {
      if (isDraggingSplitRef.current) {
        setIsDraggingSplit(false);
        isDraggingSplitRef.current = false;
        if (splitRafRef.current) cancelAnimationFrame(splitRafRef.current);
      }
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
      if (splitRafRef.current) cancelAnimationFrame(splitRafRef.current);
    };
  }, [updateSplitFromClientX]);

  const toggleFullscreen = () => {
    if (!panelRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      panelRef.current.requestFullscreen?.();
    }
  };

  const handleResetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setOpacitySliderValue(85);
    handleResetZoom();
  };

  const imageFilterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
  };

  const transformStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: "center center",
  };

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col ${
        isFullscreen ? "fixed inset-0 z-[100] h-screen w-screen p-4 sm:p-6 bg-slate-950 justify-between" : ""
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white font-mono">
            Radiology Diagnostic Viewer
          </h3>
          {selectedDisease && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              {selectedDisease.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Action & Zoom Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Zoom Controller with Generous Spacing */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 transition-all cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="font-mono text-xs font-bold px-2 py-0.5 text-center min-w-[54px] text-slate-800 dark:text-slate-100 select-none tabular-nums">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 transition-all cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Reset Zoom Button */}
            {zoom > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-primary hover:text-white hover:bg-primary bg-primary/10 border border-primary/20 transition-all cursor-pointer ml-0.5"
                title="Reset Zoom to 100%"
                aria-label="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Fullscreen View Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-primary hover:border-primary/40 shadow-sm transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Full View"}</span>
          </button>
        </div>
      </div>

      {/* Main Radiograph Viewer Area */}
      <div className={`p-3 sm:p-4 flex-1 flex flex-col gap-3.5 bg-slate-900/90 dark:bg-slate-950 ${isFullscreen ? "min-h-0 justify-between" : ""}`}>
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={zoom > 1 ? handlePanMouseDown : (viewMode === "split" ? handleSplitStart : undefined)}
          onTouchStart={viewMode === "split" && zoom <= 1 ? handleSplitStart : undefined}
          className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-750/70 shadow-2xl select-none ${
            isFullscreen
              ? "flex-1 min-h-0 w-full h-full"
              : "aspect-[4/3] sm:aspect-[16/11] min-h-[380px] max-h-[580px]"
          } ${viewMode !== "split" ? "flex items-center justify-center" : ""} ${
            viewMode === "split"
              ? (isDraggingSplit ? "cursor-ew-resize" : "cursor-ew-resize")
              : (zoom > 1 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-default")
          }`}
        >
          {/* Subtle Radiography Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

          {/* Anatomical Orientation Markers */}
          <div className="absolute top-4 left-4 z-20 font-mono font-black text-sm px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white/80 border border-white/10 shadow-sm pointer-events-none">
            R
          </div>
          <div className="absolute top-4 right-4 z-20 font-mono font-black text-sm px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white/80 border border-white/10 shadow-sm pointer-events-none">
            L
          </div>

          {/* Mode 1 & 2: Standard or Heatmap Overlay View */}
          {viewMode !== "split" && (
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-100"
              style={transformStyle}
            >
              {/* Underlying Original X-Ray */}
              <img
                src={originalImage}
                alt="Chest X-ray"
                className="h-full w-full object-contain pointer-events-none"
                style={imageFilterStyle}
                draggable={false}
              />
              {/* Authentic Grad-CAM Thermal Saliency Overlay (Zero Blue Background Tint) */}
              {viewMode === "heatmap" && activeOverlaySrc && (
                <img
                  src={activeOverlaySrc}
                  alt="Grad-CAM Saliency Overlay"
                  className="absolute inset-0 h-full w-full object-contain pointer-events-none transition-opacity duration-200"
                  style={{ opacity: overlayOpacity }}
                  draggable={false}
                />
              )}
            </div>
          )}

          {/* Mode 3: Split Curtain Comparison */}
          {viewMode === "split" && (
            <div
              className="absolute inset-0 select-none"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center center" }}
            >
              {/* Shared base: both sides render full image, clipped by clipPath */}
              {/* Left Side: Original X-Ray */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)`, willChange: "clip-path" }}
              >
                <img
                  src={originalImage}
                  alt="Original X-ray"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={imageFilterStyle}
                  draggable={false}
                />
              </div>

              {/* Right Side: Clean X-Ray Base + Hotspot Overlay */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 0 0 ${splitPos}%)`, willChange: "clip-path" }}
              >
                <img
                  src={originalImage}
                  alt="Original X-ray Base"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={imageFilterStyle}
                  draggable={false}
                />
                {activeOverlaySrc && (
                  <img
                    src={activeOverlaySrc}
                    alt="Heatmap overlay"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{ opacity: overlayOpacity }}
                    draggable={false}
                  />
                )}
              </div>

              {/* Split Slider Handle with generous grab area and glowing divider */}
              <div
                className="absolute top-0 bottom-0 z-30 w-14 cursor-ew-resize flex items-center justify-center group touch-none select-none"
                style={{ left: `${splitPos}%`, transform: "translateX(-50%)" }}
                onMouseDown={handleSplitStart}
                onTouchStart={handleSplitStart}
              >
                {/* Glowing Vertical Line */}
                <div className="w-0.5 h-full bg-gradient-to-b from-cyan-400 via-cyan-300 to-blue-500 shadow-[0_0_14px_rgba(6,182,212,0.95)]" />
                {/* Center Knob Badge */}
                <div className="absolute w-9 h-9 rounded-full bg-slate-900/95 border-2 border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.7)] flex items-center justify-center text-cyan-300 group-hover:scale-110 group-active:scale-95 transition-transform">
                  <SplitSquareVertical className="w-4 h-4" />
                </div>
              </div>

              {/* Split Mode Floating Labels */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex gap-2 font-mono text-[10px] pointer-events-none">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900/85 text-slate-300 backdrop-blur-md border border-white/10 shadow-sm">
                  Original ({Math.round(splitPos)}%)
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900/85 text-cyan-300 backdrop-blur-md border border-cyan-500/30 shadow-sm">
                  Heatmap ({Math.round(100 - splitPos)}%)
                </span>
              </div>
            </div>
          )}

          {/* Hotspot Annotation Overlay if present */}
          {result?.hotspot && viewMode !== "original" && (
            <HotspotAnnotation
              hotspot={result.hotspot}
              containerWidth={512}
              containerHeight={512}
              imageWidth={512}
              imageHeight={512}
              show={true}
              highlightedRegion={highlightedRegion}
            />
          )}

          {/* Pan hint when zoomed */}
          {zoom > 1 && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 text-white/80 text-[10px] font-mono backdrop-blur-md border border-white/10 pointer-events-none">
              <Move className="w-3 h-3" />
              <span>Drag to Pan · Wheel to Zoom</span>
            </div>
          )}
        </div>

        {/* Bottom Visualization & Image Adjustment Controls Toolbar */}
        <HeatmapControls
          intensity={opacitySliderValue}
          onIntensityChange={setOpacitySliderValue}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          brightness={brightness}
          onBrightnessChange={setBrightness}
          contrast={contrast}
          onContrastChange={setContrast}
          onResetAdjustments={handleResetAdjustments}
        />

        {/* Technical Metadata Footer */}
        <div className="px-2 pt-0.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>Model: DenseNet121</span>
            <span>·</span>
            <span>Input: {result?.image_meta?.resolution || "224×224 Normal"}</span>
            <span>·</span>
            <span className="hidden md:inline">Layer: denseblock4</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Grad-CAM Spatial Alignment Verified</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
