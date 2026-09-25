import base64
import io
import json

import cv2
import numpy as np
import torch

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image


# ============================================================
# STAGE 1 IMPORTS
# ============================================================

from src import config as cfg1

from src.explain import (
    generate_gradcam as gradcam_binary,
    find_hotspot as hotspot_binary,
    preprocess_pil as preprocess_binary,
    quadrant_scores as quadrants_binary,
)

from src.model import load_trained_model as load_binary_model


# ============================================================
# STAGE 2 IMPORTS
# ============================================================

from src import config_cxr14 as cfg2

from src.explain_multilabel import (
    gradcam_for,
    predict as predict_multilabel,
    quadrant_scores as quadrants_multi,
)

from src.model_multilabel import (
    load_trained_model as load_multilabel_model,
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="LUMEN API",
    version="2.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# GLOBAL MODEL STORAGE
# ============================================================

MODELS = {}

THRESHOLDS = {}


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def load_models_on_startup():

    # --------------------------------------------------------
    # Stage 1 model
    # --------------------------------------------------------

    print("==============================================")
    print("Loading Stage 1 (binary) model...")
    print("==============================================")

    MODELS["binary"] = load_binary_model()

    print("Stage 1 model loaded successfully.")


    # --------------------------------------------------------
    # Stage 2 model
    # --------------------------------------------------------

    print("==============================================")
    print("Loading Stage 2 (multi-label) model...")
    print("==============================================")

    MODELS["multilabel"] = load_multilabel_model()

    print("Stage 2 model loaded successfully.")


    # --------------------------------------------------------
    # Stage 2 thresholds
    # --------------------------------------------------------

    if cfg2.THRESHOLDS_JSON.exists():

        with open(cfg2.THRESHOLDS_JSON, "r") as f:
            THRESHOLDS.update(json.load(f))

        print(
            f"Loaded {len(THRESHOLDS)} per-disease thresholds."
        )

    else:

        print(
            "WARNING: thresholds.json not found."
        )

        print(
            "Run evaluate_multilabel.py first."
        )

        print(
            "Falling back to 0.5 for every disease."
        )

        THRESHOLDS.update(
            {
                lab: 0.5
                for lab in cfg2.LABELS
            }
        )


    print("==============================================")
    print(
        f"LUMEN API ready. Device: {cfg2.DEVICE}"
    )
    print("==============================================")


# ============================================================
# IMAGE -> BASE64 PNG
# ============================================================

def to_base64_png(rgb_array):

    bgr = cv2.cvtColor(
        rgb_array,
        cv2.COLOR_RGB2BGR,
    )

    _, buffer = cv2.imencode(
        ".png",
        bgr,
    )

    return (
        "data:image/png;base64,"
        + base64.b64encode(buffer).decode("utf-8")
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "device": str(cfg2.DEVICE),
        "models_loaded": list(MODELS.keys()),
        "thresholds_loaded": len(THRESHOLDS) > 0,
    }


# ============================================================
# STAGE 1
# BINARY PNEUMONIA CLASSIFICATION
# ============================================================

def predict_binary(pil_img):

    model = MODELS["binary"]

    tensor = preprocess_binary(pil_img)

    with torch.no_grad():

        logits = model(tensor)

        probs = torch.softmax(
            logits,
            dim=1,
        )[0].cpu().numpy()

    pred_idx = int(
        np.argmax(probs)
    )

    pneumonia_detected = bool(
        pred_idx == 1
    )


    # --------------------------------------------------------
    # Grad-CAM
    # --------------------------------------------------------

    overlay, cam = gradcam_binary(
        model,
        pil_img,
        target_class=pred_idx,
    )

    hotspot = hotspot_binary(cam)

    regions = quadrants_binary(cam)

    top_region = max(
        regions,
        key=lambda r: r["confidence"],
    )


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {

        "model_used":
            "binary (Stage 1, Kaggle pneumonia)",

        "pneumonia_detected":
            pneumonia_detected,

        "overall_confidence":
            round(
                float(probs[pred_idx]),
                4,
            ),

        "verdict_text": (

            f"Pneumonia indicators detected "
            f"in the {top_region['name']} lung region."

            if pneumonia_detected

            else
            "No pneumonia indicators detected. "
            "The X-ray appears normal across all lung regions."
        ),

        "hotspot": {

            "zone":
                top_region["name"],

            "x":
                hotspot["x"],

            "y":
                hotspot["y"],

            "intensity":
                round(
                    hotspot["intensity"],
                    4,
                ),
        },

        "findings": [

            {
                "name":
                    "Infiltrate / Consolidation",

                "detected":
                    pneumonia_detected,

                "confidence":
                    round(
                        float(probs[1]),
                        4,
                    ),

                "threshold":
                    0.35,
            },

            {
                "name":
                    "Non-Pathological Parenchyma",

                "detected":
                    not pneumonia_detected,

                "confidence":
                    round(
                        float(probs[0]),
                        4,
                    ),

                "threshold":
                    0.50,
            },
        ],

        "regions":
            regions,

        "heatmap_base64":
            to_base64_png(overlay),
    }


# ============================================================
# STAGE 2
# 14-DISEASE MULTI-LABEL CLASSIFICATION
# ============================================================

def predict_full(
    pil_img,
    top_k=4,
):

    model = MODELS["multilabel"]

    # --------------------------------------------------------
    # Model prediction
    # --------------------------------------------------------

    probs = predict_multilabel(
        model,
        pil_img,
    )


    # --------------------------------------------------------
    # Apply disease-specific thresholds
    # --------------------------------------------------------

    above_threshold = [

        disease

        for disease, probability
        in probs.items()

        if probability >= THRESHOLDS.get(
            disease,
            0.5,
        )
    ]


    # --------------------------------------------------------
    # Select diseases for Grad-CAM
    # --------------------------------------------------------

    if above_threshold:

        show = sorted(
            above_threshold,
            key=lambda disease: -probs[disease],
        )

    else:

        show = sorted(
            probs,
            key=lambda disease: -probs[disease],
        )[:1]


    show = show[:top_k]


    # --------------------------------------------------------
    # Generate heatmaps
    # --------------------------------------------------------

    heatmaps = {}

    regions_by_disease = {}


    for disease in show:

        overlay, cam = gradcam_for(
            model,
            pil_img,
            disease,
        )

        heatmaps[disease] = (
            to_base64_png(overlay)
        )

        regions_by_disease[disease] = (
            quadrants_multi(cam)
        )


    # --------------------------------------------------------
    # Build findings
    # --------------------------------------------------------

    findings = []


    for disease in sorted(
        probs,
        key=lambda d: -probs[d],
    ):

        probability = float(
            probs[disease]
        )

        threshold = float(
            THRESHOLDS.get(
                disease,
                0.5,
            )
        )

        detected = (
            disease in above_threshold
        )


        if detected:

            risk_level = "High"

        elif probability >= (
            threshold * 0.75
        ):

            risk_level = "Moderate"

        else:

            risk_level = "Low"


        findings.append({

            "disease":
                disease.replace("_", " "),

            "raw_key":
                disease,

            "name":
                disease.replace("_", " "),

            "key":
                disease,

            "probability":
                round(
                    probability,
                    4,
                ),

            "confidence":
                round(
                    probability,
                    4,
                ),

            "threshold":
                round(
                    threshold,
                    4,
                ),

            "detected":
                detected,

            "positive":
                detected,

            "risk_level":
                risk_level,

            "has_heatmap":
                disease in heatmaps,
        })


    # --------------------------------------------------------
    # Primary disease
    # --------------------------------------------------------

    if show:

        top_disease = show[0]

    else:

        top_disease = max(
            probs,
            key=probs.get,
        )


    any_detected = (
        len(above_threshold) > 0
    )


    # --------------------------------------------------------
    # Verdict
    # --------------------------------------------------------

    if any_detected:

        names = ", ".join(

            disease.replace("_", " ")

            for disease
            in above_threshold[:3]
        )

        verdict = (
            f"Findings detected: {names}."
        )

    else:

        verdict = (

            "No finding crossed its detection "
            "threshold. Closest match: "

            f"{top_disease.replace('_', ' ')} "
            f"({probs[top_disease] * 100:.1f}%)."
        )


    # --------------------------------------------------------
    # Primary heatmap
    # --------------------------------------------------------

    primary_heatmap = heatmaps.get(
        top_disease,
        "",
    )

    primary_quadrants = (
        regions_by_disease.get(
            top_disease,
            [],
        )
    )


    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {

        "model_used":
            "multilabel "
            "(Stage 2, NIH ChestX-ray14, 14 diseases)",

        "any_finding_detected":
            any_detected,

        "verdict_text":
            verdict,

        "findings":
            findings,

        "primary_disease":
            top_disease.replace(
                "_",
                " ",
            ),

        "selected_disease":
            top_disease,

        # Frontend compatibility
        "heatmap":
            primary_heatmap,

        "quadrants":
            primary_quadrants,

        # All generated heatmaps
        "heatmaps":
            heatmaps,

        "regions_by_disease":
            regions_by_disease,
    }


# ============================================================
# PREDICT ENDPOINT
# ============================================================

@app.post("/predict")
async def predict(

    file: UploadFile = File(...),

    model: str = Query(
        "multilabel",
        enum=[
            "binary",
            "multilabel",
        ],
    ),
):

    # --------------------------------------------------------
    # Validate file
    # --------------------------------------------------------

    if not file.content_type:

        raise HTTPException(
            status_code=400,
            detail="File content type is missing",
        )


    if not file.content_type.startswith(
        "image/"
    ):

        raise HTTPException(
            status_code=400,
            detail="File must be an image",
        )


    # --------------------------------------------------------
    # Validate model
    # --------------------------------------------------------

    if model not in MODELS:

        raise HTTPException(
            status_code=503,
            detail=(
                f"Model '{model}' is not loaded"
            ),
        )


    # --------------------------------------------------------
    # Read uploaded image
    # --------------------------------------------------------

    contents = await file.read()

    try:

        pil_img = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid image file",
        )


    original_size = pil_img.size


    # --------------------------------------------------------
    # Run selected model
    # --------------------------------------------------------

    if model == "binary":

        result = predict_binary(
            pil_img
        )

    else:

        result = predict_full(
            pil_img
        )


    # --------------------------------------------------------
    # Image metadata
    # --------------------------------------------------------

    result["image_meta"] = {

        "resolution":
            f"{original_size[0]}x{original_size[1]}"
            f" -> "
            f"{cfg2.IMG_SIZE}x{cfg2.IMG_SIZE}",

        "layer":
            "DenseNet121.features.denseblock4",

        "alignment_ok":
            True,
    }


    return result