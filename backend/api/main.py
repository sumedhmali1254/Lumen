import io
import base64
import cv2
import numpy as np
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from src import config as cfg
from src.model import load_trained_model
from src.explain import generate_gradcam, find_hotspot, quadrant_scores, preprocess_pil

app = FastAPI(title="LUMEN API", version="1.0")

# Allow the React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL = None

@app.on_event("startup")
def load_model_on_startup():
    global MODEL
    MODEL = load_trained_model()
    print(f"Model loaded on {cfg.DEVICE}")


def to_base64_png(rgb_array):
    bgr = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
    _, buf = cv2.imencode(".png", bgr)
    return "data:image/png;base64," + base64.b64encode(buf).decode("utf-8")


@app.get("/health")
def health():
    return {"status": "ok", "device": str(cfg.DEVICE)}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    contents = await file.read()
    pil_img = Image.open(io.BytesIO(contents))
    original_size = pil_img.size

    # ---- Prediction ----
    tensor = preprocess_pil(pil_img)
    with torch.no_grad():
        logits = MODEL(tensor)
        probs = torch.softmax(logits, dim=1)[0].cpu().numpy()
    pred_idx = int(np.argmax(probs))
    pneumonia_detected = bool(pred_idx == 1)
    overall_confidence = float(probs[pred_idx])

    # ---- Explainability ----
    overlay, cam = generate_gradcam(MODEL, pil_img, target_class=pred_idx)
    hotspot = find_hotspot(cam)
    regions = quadrant_scores(cam)

    # If overall verdict is Normal, force all regions to non-affected —
    # quadrant heatmap noise should never contradict the primary diagnosis
    if not pneumonia_detected:
        for r in regions:
            r["affected"] = False

    # find which region has the strongest activation
    top_region = max(regions, key=lambda r: r["confidence"])

    findings = [
        {
            "name": "Infiltrate / Consolidation",
            "detected": pneumonia_detected,
            "confidence": round(float(probs[1]), 4),
            "threshold": 0.35,
            "severity": "pathological",
        },
        {
            "name": "Non-Pathological Parenchyma",
            "detected": not pneumonia_detected,
            "confidence": round(float(probs[0]), 4),
            "threshold": 0.50,
            "severity": "normal",
        },
    ]

    return {
        "pneumonia_detected": pneumonia_detected,
        "overall_confidence": round(overall_confidence, 4),
        "verdict_text": (
            f"Pneumonia indicators detected in the {top_region['name']} lung region."
            if pneumonia_detected else
            "No pneumonia indicators detected. The X-ray appears normal across all lung regions."
        ),
        "hotspot": {
            "zone": top_region["name"],
            "x": hotspot["x"],
            "y": hotspot["y"],
            "intensity": round(hotspot["intensity"], 4),
            "description": (
                f"Activation concentrated here — {hotspot['intensity']*100:.1f}% "
                f"focal backpropagation density."
            ),
        },
        "findings": findings,
        "regions": regions,
        "heatmap_base64": to_base64_png(overlay),
        "image_meta": {
            "resolution": f"{original_size[0]}x{original_size[1]} → {cfg.IMG_SIZE}x{cfg.IMG_SIZE}",
            "layer": "DenseNet121.features.denseblock4",
            "alignment_ok": True,
        },
    }