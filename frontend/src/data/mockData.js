// ═══════════════════════════════════════
// LUMEN — Mock Data & API Configuration
// ═══════════════════════════════════════

// Dev toggle: set to true to use mock data, false for live API
export const USE_MOCK_DATA = true;

export const API_BASE_URL = 'http://localhost:8000';

// ── Mock X-ray (a simple SVG as data URI representing a chest X-ray silhouette) ──
export const MOCK_XRAY_SVG = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#3a3a3a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </radialGradient>
    <radialGradient id="lung-l" cx="35%" cy="42%" r="22%">
      <stop offset="0%" stop-color="#2a2a2a"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </radialGradient>
    <radialGradient id="lung-r" cx="65%" cy="42%" r="22%">
      <stop offset="0%" stop-color="#2a2a2a"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="#080808"/>
  <!-- Torso outline -->
  <ellipse cx="256" cy="280" rx="180" ry="220" fill="url(#bg)" opacity="0.9"/>
  <!-- Spine -->
  <rect x="248" y="100" width="16" height="300" rx="8" fill="#1a1a1a" opacity="0.6"/>
  <!-- Ribs -->
  <ellipse cx="256" cy="180" rx="140" ry="18" fill="none" stroke="#2a2a2a" stroke-width="3" opacity="0.5"/>
  <ellipse cx="256" cy="220" rx="148" ry="18" fill="none" stroke="#2a2a2a" stroke-width="3" opacity="0.5"/>
  <ellipse cx="256" cy="260" rx="152" ry="18" fill="none" stroke="#2a2a2a" stroke-width="3" opacity="0.5"/>
  <ellipse cx="256" cy="300" rx="148" ry="18" fill="none" stroke="#2a2a2a" stroke-width="3" opacity="0.5"/>
  <ellipse cx="256" cy="340" rx="140" ry="18" fill="none" stroke="#2a2a2a" stroke-width="3" opacity="0.5"/>
  <!-- Left lung field -->
  <ellipse cx="185" cy="250" rx="75" ry="110" fill="url(#lung-l)" opacity="0.7"/>
  <!-- Right lung field -->
  <ellipse cx="327" cy="250" rx="75" ry="110" fill="url(#lung-r)" opacity="0.7"/>
  <!-- Heart silhouette -->
  <ellipse cx="230" cy="310" rx="50" ry="55" fill="#1e1e1e" opacity="0.6"/>
  <!-- Clavicles -->
  <line x1="120" y1="150" x2="248" y2="135" stroke="#3a3a3a" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  <line x1="264" y1="135" x2="392" y2="150" stroke="#3a3a3a" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
  <!-- Shoulder joints -->
  <circle cx="115" cy="155" r="18" fill="none" stroke="#333" stroke-width="3" opacity="0.4"/>
  <circle cx="397" cy="155" r="18" fill="none" stroke="#333" stroke-width="3" opacity="0.4"/>
  <!-- Film border markers -->
  <text x="30" y="50" font-family="monospace" font-size="28" fill="#555" font-weight="bold">R</text>
  <text x="470" y="50" font-family="monospace" font-size="28" fill="#555" font-weight="bold">L</text>
  <!-- Subtle noise texture -->
  <rect width="512" height="512" fill="url(#bg)" opacity="0.05"/>
</svg>
`)}`;

// ── Mock Heatmap Overlay ──
export const MOCK_HEATMAP_SVG = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="heat-main" cx="73%" cy="35%" r="25%">
      <stop offset="0%" stop-color="#ff0000" stop-opacity="0.85"/>
      <stop offset="30%" stop-color="#ff4400" stop-opacity="0.6"/>
      <stop offset="60%" stop-color="#ff8800" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#ffcc00" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="heat-secondary" cx="68%" cy="45%" r="18%">
      <stop offset="0%" stop-color="#ff2200" stop-opacity="0.5"/>
      <stop offset="50%" stop-color="#ff6600" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#ffaa00" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="heat-minor" cx="30%" cy="55%" r="12%">
      <stop offset="0%" stop-color="#0066ff" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#0088ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="transparent"/>
  <rect width="512" height="512" fill="url(#heat-main)"/>
  <rect width="512" height="512" fill="url(#heat-secondary)"/>
  <rect width="512" height="512" fill="url(#heat-minor)"/>
</svg>
`)}`;

// ── Mock API Response ──
export const MOCK_RESPONSE = {
  pneumonia_detected: true,
  overall_confidence: 0.914,
  verdict_text: "Pneumonia indicators detected in the Top-Right lung region.",
  hotspot: {
    zone: "Top-Right",
    x: 370,
    y: 180,
    intensity: 0.874,
    description: "Activation concentrated here — 87.4% focal backprop density. Alveolar pattern consistent with lobar opacity."
  },
  findings: [
    { name: "Infiltrate / Consolidation", detected: true, confidence: 0.914, threshold: 0.35 },
    { name: "Pleural Effusion", detected: false, confidence: 0.12, threshold: 0.40 },
    { name: "Atelectasis", detected: false, confidence: 0.08, threshold: 0.30 },
    { name: "Cardiomegaly", detected: false, confidence: 0.15, threshold: 0.35 },
    { name: "Mass / Nodule", detected: false, confidence: 0.05, threshold: 0.25 },
    { name: "Pneumothorax", detected: false, confidence: 0.03, threshold: 0.20 },
  ],
  regions: [
    { name: "Top-Left", affected: false, confidence: 0.12 },
    { name: "Top-Right", affected: true, confidence: 0.87 },
    { name: "Bottom-Left", affected: false, confidence: 0.09 },
    { name: "Bottom-Right", affected: false, confidence: 0.14 },
  ],
  heatmap_base64: null, // Will use MOCK_HEATMAP_SVG
  image_meta: {
    resolution: "2560×2560 → 224×224",
    layer: "DenseNet121.features.denseblock4",
    alignment_ok: true
  }
};

// ── Mock Normal Response (no pneumonia) ──
export const MOCK_RESPONSE_NORMAL = {
  pneumonia_detected: false,
  overall_confidence: 0.96,
  verdict_text: "No pneumonia indicators detected. The X-ray appears normal across all lung regions.",
  hotspot: null,
  findings: [
    { name: "Infiltrate / Consolidation", detected: false, confidence: 0.04, threshold: 0.35 },
    { name: "Pleural Effusion", detected: false, confidence: 0.06, threshold: 0.40 },
    { name: "Atelectasis", detected: false, confidence: 0.03, threshold: 0.30 },
    { name: "Cardiomegaly", detected: false, confidence: 0.08, threshold: 0.35 },
    { name: "Mass / Nodule", detected: false, confidence: 0.02, threshold: 0.25 },
    { name: "Pneumothorax", detected: false, confidence: 0.01, threshold: 0.20 },
  ],
  regions: [
    { name: "Top-Left", affected: false, confidence: 0.05 },
    { name: "Top-Right", affected: false, confidence: 0.04 },
    { name: "Bottom-Left", affected: false, confidence: 0.03 },
    { name: "Bottom-Right", affected: false, confidence: 0.06 },
  ],
  heatmap_base64: null,
  image_meta: {
    resolution: "2560×2560 → 224×224",
    layer: "DenseNet121.features.denseblock4",
    alignment_ok: true
  }
};

// ── Mock History ──
export const MOCK_HISTORY = [
  {
    id: 1,
    filename: "chest_xray_001.png",
    date: "12 Oct 2023",
    pneumonia_detected: true,
    confidence: 0.914,
    verdict: "Pneumonia detected — Top-Right"
  },
  {
    id: 2,
    filename: "chest_xray_002.png",
    date: "10 Oct 2023",
    pneumonia_detected: false,
    confidence: 0.96,
    verdict: "Normal — No findings"
  },
  {
    id: 3,
    filename: "chest_xray_003.png",
    date: "08 Oct 2023",
    pneumonia_detected: true,
    confidence: 0.782,
    verdict: "Pneumonia detected — Bottom-Left"
  },
  {
    id: 4,
    filename: "chest_xray_004.png",
    date: "05 Oct 2023",
    pneumonia_detected: false,
    confidence: 0.93,
    verdict: "Normal — No findings"
  },
];

// ── API Helper ──
export async function analyzeXray(file) {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2200));
    return { ...MOCK_RESPONSE };
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
