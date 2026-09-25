import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
from sklearn.metrics import (average_precision_score, brier_score_loss,
                             confusion_matrix, precision_recall_fscore_support,
                             roc_auc_score, roc_curve)
from tqdm import tqdm
from src import config_cxr14 as cfg
from src.chestxray14_dataset import ChestXray14Dataset
from src.model_multilabel import load_trained_model
from torch.utils.data import DataLoader

@torch.no_grad()
def collect(model, csv_path):
    ds = ChestXray14Dataset(csv_path, train=False)
    dl = DataLoader(ds, batch_size=cfg.BATCH_SIZE, shuffle=False, num_workers=cfg.NUM_WORKERS, pin_memory=torch.cuda.is_available())
    ys, ps = [], []
    for x, y in tqdm(dl, desc=f"Inferring {csv_path.name}"):
        x = x.to(cfg.DEVICE, non_blocking=True)
        with torch.amp.autocast("cuda", enabled=cfg.USE_AMP):
            logits = model(x)
        ps.append(torch.sigmoid(logits.float()).cpu().numpy())
        ys.append(y.numpy())
    return np.concatenate(ys), np.concatenate(ps)

def pick_thresholds(y_true, y_prob):
    th = {}
    for i, lab in enumerate(cfg.LABELS):
        yt = y_true[:, i]
        if yt.min() == yt.max():
            th[lab] = 0.5
            continue
        fpr, tpr, cuts = roc_curve(yt, y_prob[:, i])
        th[lab] = float(cuts[np.argmax(tpr - fpr)])
    return th

def metrics_table(y_true, y_prob, thresholds):
    rows = []
    for i, lab in enumerate(cfg.LABELS):
        yt, yp = y_true[:, i], y_prob[:, i]
        t = thresholds[lab]
        pred = (yp >= t).astype(int)
        if yt.min() == yt.max():
            continue
        tn, fp, fn, tp = confusion_matrix(yt, pred, labels=[0, 1]).ravel()
        prec, rec, f1, _ = precision_recall_fscore_support(yt, pred, average="binary", zero_division=0)
        rows.append({
            "disease": lab, "n_pos": int(yt.sum()), "prevalence": round(100 * yt.mean(), 2),
            "threshold": round(t, 4), "auc": round(roc_auc_score(yt, yp), 4),
            "pr_auc": round(average_precision_score(yt, yp), 4), "sensitivity": round(rec, 4),
            "specificity": round(tn / (tn + fp) if (tn + fp) else 0.0, 4), "precision": round(prec, 4),
            "f1": round(f1, 4), "brier": round(brier_score_loss(yt, yp), 4),
            "TP": int(tp), "FP": int(fp), "FN": int(fn), "TN": int(tn),
        })
    return pd.DataFrame(rows)

def plot_calibration(y_true, y_prob, out, n_bins=10, diseases=["Pneumonia", "Effusion", "Cardiomegaly", "Infiltration"]):
    fig, ax = plt.subplots(figsize=(6, 6))
    ax.plot([0, 1], [0, 1], "k--", label="Perfectly calibrated")
    for lab in diseases:
        i = cfg.LABELS.index(lab)
        yt, yp = y_true[:, i], y_prob[:, i]
        bins = np.linspace(0, 1, n_bins + 1)
        idx = np.digitize(yp, bins) - 1
        xs, ys = [], []
        for b in range(n_bins):
            m = idx == b
            if m.sum() >= 20:
                xs.append(yp[m].mean())
                ys.append(yt[m].mean())
        ax.plot(xs, ys, "o-", label=f"{lab} (Brier {brier_score_loss(yt, yp):.3f})")
    ax.set_xlabel("Predicted Probability")
    ax.set_ylabel("Observed Frequency")
    ax.set_title("LUMEN Reliability Diagram")
    ax.legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(out, dpi=140)
    plt.close(fig)

def main():
    model = load_trained_model()
    yv, pv = collect(model, cfg.VAL_CSV)
    thresholds = pick_thresholds(yv, pv)
    with open(cfg.THRESHOLDS_JSON, "w") as f:
        json.dump(thresholds, f, indent=2)

    yt, pt = collect(model, cfg.TEST_CSV)
    table = metrics_table(yt, pt, thresholds)
    out_csv = cfg.RESULTS_DIR / "metrics" / "cxr14_test_metrics.csv"
    table.to_csv(out_csv, index=False)
    print("\n" + table.to_string(index=False))
    
    plot_calibration(yt, pt, cfg.RESULTS_DIR / "calibration" / "cxr14_calibration.png")
    np.savez_compressed(cfg.RESULTS_DIR / "metrics" / "cxr14_test_raw.npz", y_true=yt, y_prob=pt)

if __name__ == "__main__":
    main()