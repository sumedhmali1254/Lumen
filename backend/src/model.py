import torch
import torch.nn as nn
from torchvision import models
from . import config as cfg


def build_model(pretrained=True):
    """
    DenseNet-121 with ImageNet weights, classifier head replaced.
    This is exactly the architecture from the paper: DenseNet-121
    → Global Average Pooling → Dense layer → output.
    (torchvision's densenet already includes the GAP internally.)
    """
    weights = models.DenseNet121_Weights.IMAGENET1K_V1 if pretrained else None
    model = models.densenet121(weights=weights)

    in_features = model.classifier.in_features    # 1024
    model.classifier = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_features, cfg.NUM_CLASSES)
    )
    return model.to(cfg.DEVICE)


def load_trained_model(path=None):
    """Load your saved weights for inference (used by the API)."""
    path = path or cfg.MODEL_PATH
    model = build_model(pretrained=False)
    model.load_state_dict(torch.load(path, map_location=cfg.DEVICE))
    model.eval()
    return model


def get_target_layer(model):
    """The last conv block — this is what Grad-CAM hooks into."""
    return model.features.denseblock4