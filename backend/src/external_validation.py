"""
LUMEN Stage 6 external validation on CheXpert.
Put this at: backend/src/external_validation.py
Run from : backend/ -> python -m src.external_validation
"""
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import torch
from PIL import Image
from sklearn.metrics import roc_auc_score
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm

from src import config_cxr14 as cfg
from src.chestxray14_dataset import get_transforms
from src.model_multilabel import load_trained_model

CHEXPERT_DIR = cfg.ROOT / "data" / "raw" / "chexpert"
CHEXPERT_VALID_CSV = CHEXPERT_DIR / "valid.csv"

# Shared labels between NIH ChestX-ray14 and CheXpert
SHARED_LABELS = {
    "Atelectasis": "Atelectasis",
    "Cardiomegaly": "Cardiomegaly",
    "Effusion": "Pleural Effusion",
    "Pneumonia": "Pneumonia",
    "Pneumothorax": "Pneumothorax",
    "Consolidation": "Consolidation",
    "Edema": "Edema",
}

class CheXpertDataset(Dataset):
    """Loads CheXpert images + shared labels using U-Ignore policy (-1 skipped)."""
    def __init__(self, csv_path, root, transform):
        df = pd.read_csv(csv_path)

        resolved_paths = []
        for p_str in df["Path"]:
            # Remove leading wrapper prefix if present in CSV
            p_clean = p_str.replace("CheXpert-v1.0-small/", "").replace("CheXpert-v1.0/", "")
            
            p1 = root / p_clean
            p2 = root / p_str
            p3 = root.parent / p_str

            if p1.exists():
                resolved_paths.append(p1)
            elif p2.exists():
                resolved_paths.append(p2)
            elif p3.exists():
                resolved_paths.append(p3)
            else:
                sys.exit(f"ERROR: Image not found: {p_clean}\nChecked at: {p1}")

        self.df = df.reset_index(drop=True)
        self.paths = resolved_paths
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = self.paths[idx]
        img = Image.open(img_path).convert("RGB")
        x = self.transform(img)
        y = np.full(len(SHARED_LABELS), np.nan, dtype=np.float32)
        for i, (nih_lab, chex_col) in enumerate(SHARED_LABELS.items()):
            v = row.get(chex_col, np.nan)
            if pd.isna(v) or v == -1:
                continue  # U-Ignore / blank
            y[i] = float(v)
        return x, torch.from_numpy(y), idx

@torch.no_grad()
def run(max_images=None):
    if not CHEXPERT_VALID_CSV.exists():
        sys.exit(f"ERROR: {CHEXPERT_VALID_CSV} not found at {CHEXPERT_VALID_CSV}")

    transform = get_transforms(train=False)
    ds = CheXpertDataset(CHEXPERT_VALID_CSV, CHEXPERT_DIR, transform)
    if max_images:
        ds.df = ds.df.iloc[:max_images].reset_index(drop=True)

    dl = DataLoader(ds, batch_size=cfg.BATCH_SIZE, shuffle=False, num_workers=cfg.NUM_WORKERS)
    print(f"CheXpert validation images: {len(ds)}")

    model = load_trained_model()
    nih_label_names = list(SHARED_LABELS.keys())
    nih_indices = [cfg.LABELS.index(lab) for lab in nih_label_names]

    all_y, all_p = [], []
    for x, y, _ in tqdm(dl, desc="external validation"):
        x = x.to(cfg.DEVICE)
        with torch.amp.autocast("cuda", enabled=cfg.USE_AMP):
            logits = model(x)
            probs = torch.sigmoid(logits.float()).cpu().numpy()
        all_p.append(probs[:, nih_indices])
        all_y.append(y.numpy())

    y_true = np.concatenate(all_y)
    y_prob = np.concatenate(all_p)

    rows = []
    for i, lab in enumerate(nih_label_names):
        mask = ~np.isnan(y_true[:, i])
        yt, yp = y_true[mask, i], y_prob[mask, i]
        if yt.min() == yt.max() or mask.sum() < 20:
            rows.append({"disease": lab, "n_scored": int(mask.sum()), "auc": np.nan})
            continue
        rows.append({
            "disease": lab,
            "n_scored": int(mask.sum()),
            "prevalence_%": round(100 * yt.mean(), 2),
            "auc_on_chexpert": round(roc_auc_score(yt, yp), 4),
        })

    table = pd.DataFrame(rows)
    out = cfg.RESULTS_DIR / "metrics" / "external_validation_chexpert.csv"
    table.to_csv(out, index=False)

    print("\n=== External validation: trained on NIH, tested on CheXpert ===")
    print(table.to_string(index=False))
    print(f"\nsaved -> {out}")

if __name__ == "__main__":
    run()