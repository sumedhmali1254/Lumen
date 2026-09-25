import sys
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
from PIL import Image
from tqdm import tqdm
from src import config_cxr14 as cfg

def collect_images():
    frames = []
    for csv in (cfg.TRAIN_CSV, cfg.VAL_CSV, cfg.TEST_CSV):
        if csv.exists():
            frames.append(pd.read_csv(csv, usecols=["image", "path"]))
    if not frames:
        sys.exit("Run python -m src.prepare_chestxray14 first.")
    return pd.concat(frames).drop_duplicates("image")

def convert(row):
    src = cfg.RAW_DIR / row.path
    dst = cfg.CACHE_DIR / row.image
    if dst.exists():
        return
    try:
        img = Image.open(src).convert("L").resize((cfg.CACHE_SIZE, cfg.CACHE_SIZE), Image.BILINEAR)
        img.save(dst, optimize=True)
    except Exception as e:
        print(f"Failed {row.image}: {e}")

def main():
    cfg.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    df = collect_images()
    print(f"Caching {len(df):,} images at {cfg.CACHE_SIZE}px into {cfg.CACHE_DIR}")
    rows = list(df.itertuples(index=False))
    with ThreadPoolExecutor(max_workers=8) as ex:
        list(tqdm(ex.map(convert, rows), total=len(rows)))
    print("Caching complete.")

if __name__ == "__main__":
    main()