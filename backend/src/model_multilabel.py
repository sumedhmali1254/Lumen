from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models
from src import config_cxr14 as cfg


def build_model(pretrained=True, checkpoint_path=None):

    weights = (
        models.DenseNet121_Weights.IMAGENET1K_V1
        if pretrained
        else None
    )

    model = models.densenet121(
        weights=weights
    )

    in_features = (
        model.classifier.in_features
    )

    model.classifier = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(
            in_features,
            cfg.NUM_LABELS
        )
    )

    model = model.to(cfg.DEVICE)

    if (
        checkpoint_path
        and Path(checkpoint_path).exists()
    ):

        print(
            f"--> Loading weights from "
            f"{checkpoint_path}"
        )

        state = torch.load(
            checkpoint_path,
            map_location=cfg.DEVICE
        )

        if (
            isinstance(state, dict)
            and "state_dict" in state
        ):
            state = state["state_dict"]

        model.load_state_dict(
            state
        )

    return model


def load_trained_model(path=None):

    path = path or cfg.MODEL_PATH

    return build_model(
        pretrained=False,
        checkpoint_path=path
    )


def get_target_layer(model):

    return model.features.denseblock4


@torch.no_grad()
def predict_probs(model, tensor):

    logits = model(tensor)

    return torch.sigmoid(logits)