import numpy as np
import pandas as pd
from PIL import Image
from tqdm import tqdm
from src import config_cxr14 as cfg
from src.explain_multilabel import cam_to_bbox, gradcam_for
from src.model_multilabel import load_trained_model

ORIG_SIZE = 1024

def load_bboxes():
    df = pd.read_csv(cfg.BBOX_CSV)
    df.columns = [c.strip() for c in df.columns]
    cols = list(df.columns)
    df = df.rename(columns={cols[0]: "image", cols[1]: "finding", cols[2]: "x", cols[3]: "y", cols[4]: "w", cols[5]: "h"})
    df = df[["image", "finding", "x", "y", "w", "h"]]
    df["finding"] = df["finding"].str.strip().replace(cfg.BBOX_TO_LABEL)
    return df[df["finding"].isin(cfg.LABELS)]

def iou_iobb(pred, gt):
    px, py, pw, ph = pred
    gx, gy, gw, gh = gt
    ix1, iy1 = max(px, gx), max(py, gy)
    ix2, iy2 = min(px + pw, gx + gw), min(py + ph, gy + gh)
    inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
    if inter == 0:
        return 0.0, 0.0
    union = (pw * ph) + (gw * gh) - inter
    return inter / union, inter / (pw * ph)

def main(percentile=90):
    bb = load_bboxes()
    index = pd.concat([pd.read_csv(c, usecols=["image", "path"]) for c in (cfg.TRAIN_CSV, cfg.VAL_CSV, cfg.TEST_CSV) if c.exists()]).drop_duplicates("image").set_index("image")["path"]
    bb = bb[bb["image"].isin(index.index)]
    model = load_trained_model()
    scale = ORIG_SIZE / cfg.IMG_SIZE

    rows = []
    for r in tqdm(list(bb.itertuples(index=False))):
        img = Image.open(cfg.RAW_DIR / index[r.image])
        _, cam = gradcam_for(model, img, r.finding)
        box = cam_to_bbox(cam, percentile=percentile)
        if box is None:
            rows.append({"image": r.image, "finding": r.finding, "iou": 0.0, "iobb": 0.0})
            continue
        pred = (box["x"] * scale, box["y"] * scale, box["w"] * scale, box["h"] * scale)
        iou, iobb = iou_iobb(pred, (r.x, r.y, r.w, r.h))
        rows.append({"image": r.image, "finding": r.finding, "iou": round(iou, 4), "iobb": round(iobb, 4)})

    res = pd.DataFrame(rows)
    out = cfg.RESULTS_DIR / "localization" / "cxr14_localization.csv"
    res.to_csv(out, index=False)
    summary = res.groupby("finding").agg(
        n=("iou", "size"), mean_iou=("iou", "mean"), mean_iobb=("iobb", "mean"),
        acc_iou_10=("iou", lambda s: (s > 0.10).mean()),
        acc_iou_25=("iou", lambda s: (s > 0.25).mean()),
        acc_iou_50=("iou", lambda s: (s > 0.50).mean()),
    ).round(3)
    print("\n" + summary.to_string())
    summary.to_csv(cfg.RESULTS_DIR / "localization" / "cxr14_localization_summary.csv")

if __name__ == "__main__":
    main()