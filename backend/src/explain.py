import numpy as np
import cv2
import torch
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image
from . import config as cfg
from .dataset import get_transforms
from .model import get_target_layer


def preprocess_pil(pil_img):
    """PIL image → normalized tensor ready for the model."""
    tf = get_transforms(train=False)
    tensor = tf(pil_img.convert("RGB")).unsqueeze(0).to(cfg.DEVICE)
    return tensor


def generate_gradcam(model, pil_img, target_class=None):
    input_tensor = preprocess_pil(pil_img)
    rgb = np.array(pil_img.convert("RGB").resize((cfg.IMG_SIZE, cfg.IMG_SIZE))) / 255.0

    cam = GradCAM(model=model, target_layers=[get_target_layer(model)])
    targets = [ClassifierOutputTarget(target_class)] if target_class is not None else None
    grayscale_cam = cam(input_tensor=input_tensor, targets=targets)[0]

    # Suppress low-activation noise so only real hotspots show color
    grayscale_cam = np.where(grayscale_cam > 0.4, grayscale_cam, 0)

    overlay = show_cam_on_image(rgb.astype(np.float32), grayscale_cam,
                                use_rgb=True, image_weight=0.6)  # more original image showing through
    return overlay, grayscale_cam


def find_hotspot(grayscale_cam):
    """Find the single most activated pixel — this drives the 'hotspot marker' in the UI."""
    y, x = np.unravel_index(np.argmax(grayscale_cam), grayscale_cam.shape)
    return {"x": int(x), "y": int(y), "intensity": float(grayscale_cam.max())}


def quadrant_scores(grayscale_cam):
    # Normalize so the max activation in THIS image = 1.0
    cam_norm = grayscale_cam / (grayscale_cam.max() + 1e-8)

    h, w = cam_norm.shape
    mid_h, mid_w = h // 2, w // 2
    quads = {
        "Top-Left":     cam_norm[:mid_h, :mid_w],
        "Top-Right":    cam_norm[:mid_h, mid_w:],
        "Bottom-Left":  cam_norm[mid_h:, :mid_w],
        "Bottom-Right": cam_norm[mid_h:, mid_w:],
    }
    results = []
    for name, region in quads.items():
        score = float(region.mean())
        results.append({
            "name": name,
            "confidence": round(score, 4),
            "affected": score > 0.55,   # raise threshold, tune after testing
        })
    return results