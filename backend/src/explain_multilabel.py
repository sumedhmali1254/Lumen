import sys
import cv2
import numpy as np
import torch
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from src import config_cxr14 as cfg
from src.chestxray14_dataset import get_transforms
from src.model_multilabel import get_target_layer, load_trained_model

def preprocess_pil(pil_img):
    tf = get_transforms(train=False)
    return tf(pil_img.convert("RGB")).unsqueeze(0).to(cfg.DEVICE)

def rgb_float(pil_img):
    arr = np.array(pil_img.convert("RGB").resize((cfg.IMG_SIZE, cfg.IMG_SIZE)))
    return (arr / 255.0).astype(np.float32)

def predict(model, pil_img):
    with torch.no_grad():
        logits = model(preprocess_pil(pil_img))
        probs = torch.sigmoid(logits)[0].cpu().numpy()
    return {lab: float(p) for lab, p in zip(cfg.LABELS, probs)}


def apply_lung_mask(cam_map):
    """
    Zero out Grad-CAM activations outside the central thoracic region
    to eliminate out-of-bounds background heatmaps.
    """
    h, w = cam_map.shape
    mask = np.zeros((h, w), dtype=np.float32)
    mask[int(h * 0.10):int(h * 0.85), int(w * 0.08):int(w * 0.92)] = 1.0
    return cam_map * mask


def create_clean_rgba_overlay(cam_map):
    """
    Creates a clean, transparent RGBA thermal overlay.
    Only regions with meaningful activation (>= 0.30) are shown —
    everything below is fully transparent so the original X-ray shows through.
    Active areas use authentic JET colormap (Red -> Orange -> Yellow -> Green -> Cyan).
    """
    cam_norm = np.clip(cam_map, 0, 1).astype(np.float32)

    # Hard cutoff: anything below 0.30 activation is invisible
    THRESHOLD = 0.30
    cam_norm[cam_norm < THRESHOLD] = 0.0

    cam_uint8 = np.uint8(255 * cam_norm)
    color_bgr = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    color_rgb = cv2.cvtColor(color_bgr, cv2.COLOR_BGR2RGB)

    h, w = cam_norm.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = color_rgb

    # Alpha: 0 for sub-threshold, quadratic ramp for heat zones (steeper = tighter focus)
    # Remap the 0.30..1.0 range into 0..1 for a smooth ramp
    active_mask = cam_norm >= THRESHOLD
    ramp = np.where(active_mask, (cam_norm - THRESHOLD) / (1.0 - THRESHOLD), 0.0)
    # Quadratic ramp: low-mid activations fade quickly, only strong activations are opaque
    alpha = np.where(active_mask, np.clip(ramp ** 1.5 * 220 + 30, 0, 240), 0)
    rgba[:, :, 3] = alpha.astype(np.uint8)

    # Convert to BGRA for OpenCV PNG encoding
    bgra = cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA)
    return bgra


def find_hotspot(cam_map):
    """
    Find the peak activation point in the CAM map and convert to 512x512 coordinate space.
    """
    h, w = cam_map.shape
    y, x = np.unravel_index(np.argmax(cam_map), cam_map.shape)
    
    # Scale to 512x512 standard canvas coordinate space
    x_512 = int(round(x * 512.0 / w))
    y_512 = int(round(y * 512.0 / h))
    
    # Determine quadrant zone
    zone = "Top-Left"
    if x >= w // 2 and y < h // 2:
        zone = "Top-Right"
    elif x < w // 2 and y >= h // 2:
        zone = "Bottom-Left"
    elif x >= w // 2 and y >= h // 2:
        zone = "Bottom-Right"

    return {
        "x": x_512,
        "y": y_512,
        "intensity": round(float(cam_map.max()), 4),
        "zone": zone,
        "description": f"Highest spatial saliency density in {zone} region (activation: {cam_map.max():.2f})."
    }


def gradcam_for(model, pil_img, disease):
    idx = cfg.LABELS.index(disease)
    cam = GradCAM(model=model, target_layers=[get_target_layer(model)])
    grayscale = cam(input_tensor=preprocess_pil(pil_img), targets=[ClassifierOutputTarget(idx)])[0]
    grayscale = apply_lung_mask(grayscale.astype(np.float32))
    overlay = show_cam_on_image(rgb_float(pil_img), grayscale, use_rgb=True)
    clean_bgra = create_clean_rgba_overlay(grayscale)
    hotspot = find_hotspot(grayscale)
    return overlay, clean_bgra, grayscale, hotspot

def cam_to_bbox(cam, percentile=90):
    thresh = np.percentile(cam, percentile)
    mask = (cam > thresh).astype(np.uint8)
    n, _, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if n <= 1:
        return None
    largest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = stats[largest, :4]
    return {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}

def quadrant_scores(cam, threshold=0.35):
    h, w = cam.shape
    mh, mw = h // 2, w // 2
    quads = {
        "Top-Left": cam[:mh, :mw], "Top-Right": cam[:mh, mw:],
        "Bottom-Left": cam[mh:, :mw], "Bottom-Right": cam[mh:, mw:]
    }
    return [{"name": k, "confidence": round(float(v.mean()), 4), "affected": bool(v.mean() > threshold)} for k, v in quads.items()]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Usage: python -m src.explain_multilabel <path_to_image.png>")
    img = Image.open(sys.argv[1])
    model = load_trained_model()
    probs = predict(model, img)
    for disease, prob in sorted(probs.items(), key=lambda x: -x[1])[:3]:
        overlay, clean_bgra, cam, hotspot = gradcam_for(model, img, disease)
        print(f"Disease: {disease} | Prob: {prob:.3f} | Hotspot: {hotspot} | Quadrants: {quadrant_scores(cam)}")