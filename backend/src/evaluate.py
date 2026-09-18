import torch
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (classification_report, confusion_matrix,
                             roc_curve, auc, roc_auc_score)
from . import config as cfg
from .dataset import get_dataloaders
from .model import load_trained_model


@torch.no_grad()
def evaluate():
    _, _, test_loader = get_dataloaders()
    model = load_trained_model()

    all_labels, all_preds, all_probs = [], [], []
    for images, labels in test_loader:
        images = images.to(cfg.DEVICE)
        outputs = model(images)
        probs = torch.softmax(outputs, dim=1)[:, 1]
        preds = outputs.argmax(1).cpu()

        all_labels.extend(labels.numpy())
        all_preds.extend(preds.numpy())
        all_probs.extend(probs.cpu().numpy())

    all_labels = np.array(all_labels)
    all_preds  = np.array(all_preds)
    all_probs  = np.array(all_probs)

    # --- Precision / Recall / F1 / Accuracy table ---
    print(classification_report(all_labels, all_preds,
                                target_names=cfg.CLASS_NAMES, digits=4))
    print(f"AUC: {roc_auc_score(all_labels, all_probs):.4f}")

    # --- Confusion matrix figure ---
    cm = confusion_matrix(all_labels, all_preds)
    plt.figure(figsize=(5, 4))
    sns.heatmap(cm, annot=True, fmt="d", cmap="mako",
                xticklabels=cfg.CLASS_NAMES, yticklabels=cfg.CLASS_NAMES)
    plt.xlabel("Predicted"); plt.ylabel("True"); plt.title("LUMEN — Confusion Matrix")
    plt.tight_layout()
    plt.savefig(cfg.RESULTS_DIR / "metrics" / "confusion_matrix.png", dpi=150)

    # --- ROC curve figure ---
    fpr, tpr, _ = roc_curve(all_labels, all_probs)
    plt.figure(figsize=(5, 4))
    plt.plot(fpr, tpr, label=f"AUC = {auc(fpr, tpr):.3f}")
    plt.plot([0, 1], [0, 1], "r--")
    plt.xlabel("False Positive Rate"); plt.ylabel("True Positive Rate")
    plt.title("LUMEN — ROC Curve"); plt.legend()
    plt.tight_layout()
    plt.savefig(cfg.RESULTS_DIR / "metrics" / "roc_curve.png", dpi=150)
    print("Figures saved to results/metrics/")


if __name__ == "__main__":
    (cfg.RESULTS_DIR / "metrics").mkdir(parents=True, exist_ok=True)
    evaluate()