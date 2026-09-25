import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, Loader2, CheckCircle } from "lucide-react";

import Hero from "../components/Hero";
import UploadZone from "../components/UploadZone";
import VerdictCard from "../components/VerdictCard";
import FindingsSummary from "../components/FindingsSummary";
import XrayViewerPanel from "../components/XrayViewerPanel";
import ProbabilitiesSidebar from "../components/ProbabilitiesSidebar";
import RegionCard from "../components/RegionCard";
import LungsAnatomy from "../components/LungsAnatomy";
import HowItWorks from "../components/HowItWorks";
import { analyzeXray, MOCK_XRAY_SVG } from "../data/mockData";
import { useHistory } from "../context/HistoryContext";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [xrayPreview, setXrayPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [analysisState, setAnalysisState] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [highlightedRegion, setHighlightedRegion] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [progress, setProgress] = useState(0);
  const viewerRef = useRef(null);
  const { addAnalysis } = useHistory();

  useEffect(() => {
    let interval;
    if (analysisState === "loading") {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 98) return p;
          return p + Math.floor(Math.random() * 8) + 2;
        });
      }, 150);
    } else if (analysisState === "success") {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [analysisState]);

  const handleFileSelected = useCallback((file) => {
    setSelectedFile(file);
    setResult(null);
    setAnalysisState("idle");
    setErrorMsg("");
    setHighlightedRegion(null);
    setSelectedDisease(null);

    const reader = new FileReader();
    reader.onload = (e) => setXrayPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setXrayPreview(null);
    setResult(null);
    setAnalysisState("idle");
    setErrorMsg("");
    setHighlightedRegion(null);
    setSelectedDisease(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;

    setAnalysisState("loading");
    setErrorMsg("");

    try {
      const preview =
        xrayPreview ||
        (await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result || "");
          reader.onerror = () =>
            reject(new Error("Unable to read selected file."));
          reader.readAsDataURL(selectedFile);
        }));

      const data = await analyzeXray(selectedFile);
      setResult(data);
      const selected =
        data.selected_disease || data.findings?.[0]?.raw_key || null;
      setSelectedDisease(selected);
      addAnalysis({
        id: `${selectedFile.name}-${Date.now()}`,
        fileName: selectedFile.name,
        preview,
        result: data,
        verdict: data.verdict_text || "Analysis complete",
        confidence: Number(
          data.findings?.find((f) => f.raw_key === selected)?.probability ??
            data.findings?.[0]?.probability ??
            0,
        ),
        abnormal: Boolean(data.any_finding_detected),
      });
      setAnalysisState("success");
    } catch (err) {
      setErrorMsg(err.message || "Analysis failed. Please try again.");
      setAnalysisState("error");
    }
  }, [selectedFile, xrayPreview, addAnalysis]);

  const handleRegionClick = useCallback((regionName) => {
    setHighlightedRegion((prev) => (prev === regionName ? null : regionName));
    // Scroll to viewer
    viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const buttonStates = {
    idle: {
      width: 220,
      borderRadius: 14,
    },
    loading: {
      width: 280,
      borderRadius: 14,
    },
    success: {
      width: 56,
      borderRadius: 28,
    },
  };

  const findings = result?.findings || [];
  const activePathology =
    findings.find((f) => f.raw_key === selectedDisease) || findings[0];
  const displayConfidence = activePathology
    ? Math.round(activePathology.probability * 100)
    : 0;
  const quadrants =
    result?.all_heatmaps?.[selectedDisease]?.quadrants ||
    result?.quadrants ||
    result?.regions ||
    [];
  const anatomyResult = result ? { ...result, regions: quadrants } : null;

  return (
    <div className="w-full">
      <Hero />
      <UploadZone
        onFileSelected={handleFileSelected}
        selectedFile={selectedFile}
        onClear={handleClearFile}
      />

      {/* Analyze Button */}
      <div className="px-6 pb-8">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-3">
          <motion.button
            onClick={handleAnalyze}
            disabled={!selectedFile || analysisState === "loading"}
            animate={buttonStates[analysisState] || buttonStates.idle}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            whileTap={
              analysisState === "idle" && selectedFile ? { scale: 0.95 } : {}
            }
            className={`
                h-14 flex items-center justify-center gap-2.5 font-semibold text-white
                transition-colors duration-300 shadow-lg
                ${
                  analysisState === "loading"
                    ? "bg-primary cursor-wait"
                    : analysisState === "success"
                      ? "bg-success cursor-default"
                      : selectedFile
                        ? "bg-gradient-to-r from-primary to-primary-light hover:shadow-xl hover:shadow-primary/20 cursor-pointer"
                        : "bg-gray-300 cursor-not-allowed"
                }
              `}
            style={{
              borderRadius: analysisState === "idle" ? 14 : 28,
              overflow: "hidden",
            }}
            aria-label={
              analysisState === "loading" ? "Analyzing..." : "Analyze X-Ray"
            }
          >
            <AnimatePresence mode="wait">
              {analysisState === "loading" ? (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center w-full px-5 gap-1.5"
                >
                  <div className="flex items-center justify-between w-full text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </span>
                    <span className="tabular-nums font-mono">
                      {Math.min(progress, 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white rounded-full"
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ ease: "easeOut", duration: 0.2 }}
                    />
                  </div>
                </motion.div>
              ) : analysisState === "success" ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5"
                >
                  <Scan className="w-5 h-5" />
                  <span>Analyze X-Ray</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Error message */}
          <AnimatePresence>
            {analysisState === "error" && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-alert font-medium"
              >
                {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="px-6 pb-12"
          >
            <div className="max-w-7xl mx-auto space-y-8">
              <div>
                <VerdictCard
                  result={result}
                  selectedDisease={selectedDisease}
                  displayConfidence={displayConfidence}
                />
                <div className="px-2">
                  <FindingsSummary
                    findings={findings}
                    selectedDisease={selectedDisease}
                    onSelectDisease={setSelectedDisease}
                  />
                </div>
              </div>

              <div
                ref={viewerRef}
                className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start"
              >
                <XrayViewerPanel
                  result={result}
                  xrayImage={xrayPreview || MOCK_XRAY_SVG}
                  highlightedRegion={highlightedRegion}
                  selectedDisease={selectedDisease}
                />
                <ProbabilitiesSidebar
                  findings={findings}
                  imageMeta={result.image_meta}
                  selectedDisease={selectedDisease}
                  onSelectDisease={setSelectedDisease}
                />
              </div>

              {quadrants.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-shell-heading mb-4 px-1">
                    Lung Region Analysis
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {quadrants.map((region, i) => (
                        <RegionCard
                          key={region.name}
                          region={region}
                          index={i}
                          onClick={() => handleRegionClick(region.name)}
                          isHighlighted={highlightedRegion === region.name}
                        />
                      ))}
                    </div>
                    <LungsAnatomy
                      result={anatomyResult}
                      highlightedRegion={highlightedRegion}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HowItWorks />
    </div>
  );
}
