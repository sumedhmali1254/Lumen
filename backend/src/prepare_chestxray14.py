import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from src import config_cxr14 as cfg


# ============================================================
# IMAGE INDEX
# ============================================================

def build_path_index(force=False):

    if cfg.PATH_INDEX_JSON.exists() and not force:
        with open(cfg.PATH_INDEX_JSON, encoding="utf-8") as f:
            return json.load(f)

    print(f"Scanning {cfg.RAW_DIR} for PNG files...")

    index = {}

    for p in cfg.RAW_DIR.rglob("*.png"):
        index[p.name] = str(
            p.relative_to(cfg.RAW_DIR)
        ).replace("\\", "/")

    if not index:
        sys.exit(
            f"ERROR: No .png files found under {cfg.RAW_DIR}"
        )

    with open(cfg.PATH_INDEX_JSON, "w", encoding="utf-8") as f:
        json.dump(index, f)

    print(
        f"Found {len(index):,} images cached to "
        f"{cfg.PATH_INDEX_JSON.name}"
    )

    return index


# ============================================================
# METADATA
# ============================================================

def load_metadata():

    if not cfg.META_CSV.exists():
        sys.exit(
            f"ERROR: {cfg.META_CSV} not found."
        )

    df = pd.read_csv(cfg.META_CSV)

    rename = {
        "Image Index": "image",
        "Finding Labels": "findings",
        "Follow-up #": "followup",
        "Patient ID": "patient_id",
        "Patient Age": "age",
        "Patient Gender": "sex",
        "View Position": "view",
    }

    df = df.rename(columns=rename)[
        list(rename.values())
    ]

    finding_sets = (
        df["findings"]
        .str.split("|")
        .apply(set)
    )

    for lab in cfg.LABELS:

        df[lab] = finding_sets.apply(
            lambda s, l=lab: int(l in s)
        ).astype("int8")

    df["No_Finding"] = (
        df[cfg.LABELS].sum(axis=1) == 0
    ).astype("int8")

    df["age"] = pd.to_numeric(
        df["age"],
        errors="coerce"
    )

    return df


# ============================================================
# OFFICIAL TRAIN / TEST SPLIT
# ============================================================

def official_split(df):

    if not (
        cfg.OFFICIAL_TRAINVAL_LIST.exists()
        and cfg.OFFICIAL_TEST_LIST.exists()
    ):
        return None, None

    trainval = set(
        cfg.OFFICIAL_TRAINVAL_LIST.read_text(
            encoding="utf-8"
        ).split()
    )

    test = set(
        cfg.OFFICIAL_TEST_LIST.read_text(
            encoding="utf-8"
        ).split()
    )

    trainval_df = df[
        df["image"].isin(trainval)
    ].copy()

    test_df = df[
        df["image"].isin(test)
    ].copy()

    return trainval_df, test_df


# ============================================================
# PATIENT-LEVEL SPLIT
# ============================================================

def patient_split(df, frac, seed):

    rng = np.random.default_rng(seed)

    patients = df["patient_id"].unique()

    rng.shuffle(patients)

    n_small = max(
        1,
        int(len(patients) * frac)
    )

    small_ids = set(
        patients[:n_small]
    )

    large_df = df[
        ~df["patient_id"].isin(small_ids)
    ].copy()

    small_df = df[
        df["patient_id"].isin(small_ids)
    ].copy()

    return large_df, small_df


# ============================================================
# OLD SINGLE-BATCH SAMPLING
# ============================================================

def subsample_by_patient(df, max_images, seed):

    if max_images is None or len(df) <= max_images:
        return df.copy()

    rng = np.random.default_rng(seed)

    patients = df["patient_id"].unique()

    rng.shuffle(patients)

    counts = df["patient_id"].value_counts()

    keep = []
    total = 0

    for pid in patients:

        if total >= max_images:
            break

        keep.append(pid)
        total += int(counts[pid])

    return df[
        df["patient_id"].isin(set(keep))
    ].copy()


# ============================================================
# BATCH DIRECTORY
# ============================================================

def get_batch_dir():

    batch_dir = (
        cfg.RESULTS_DIR
        / "training_batches"
    )

    batch_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    return batch_dir


# ============================================================
# REGISTER EXISTING BATCH 1
# ============================================================

def register_existing_batch_1(train_df):

    batch_dir = get_batch_dir()

    batch1_file = (
        batch_dir / "batch_01.csv"
    )

    if batch1_file.exists():

        batch1 = pd.read_csv(
            batch1_file
        )

        print(
            f"[OK] Existing Batch 1 found: "
            f"{len(batch1):,} images"
        )

        return batch1

    if not cfg.TRAIN_CSV.exists():

        sys.exit(
            "\nERROR: Existing train.csv was not found.\n"
            "The script cannot identify your already-trained Batch 1."
        )

    old_train = pd.read_csv(
        cfg.TRAIN_CSV
    )

    if "image" not in old_train.columns:

        sys.exit(
            "ERROR: Existing train.csv does not contain "
            "an 'image' column."
        )

    old_images = set(
        old_train["image"]
    )

    batch1 = train_df[
        train_df["image"].isin(old_images)
    ].copy()

    if len(batch1) == 0:

        sys.exit(
            "ERROR: Could not match your existing "
            "train.csv images with the current "
            "training dataset."
        )

    batch1.to_csv(
        batch1_file,
        index=False
    )

    print()
    print("=" * 60)
    print("EXISTING BATCH 1 REGISTERED")
    print("=" * 60)
    print(
        f"Batch 1 images: {len(batch1):,}"
    )
    print(
        f"Saved to: {batch1_file}"
    )
    print("=" * 60)

    return batch1


# ============================================================
# CREATE BATCH
# ============================================================

def create_batch(
    full_train_df,
    batch_number,
    batch_size
):

    batch_dir = get_batch_dir()

    current_file = (
        batch_dir
        / f"batch_{batch_number:02d}.csv"
    )

    # --------------------------------------------------------
    # Reuse existing batch
    # --------------------------------------------------------

    if current_file.exists():

        print()
        print(
            f"[OK] Batch {batch_number} already exists."
        )

        batch = pd.read_csv(
            current_file
        )

        print(
            f"Images: {len(batch):,}"
        )

        return batch

    # --------------------------------------------------------
    # Batch 1 = already trained
    # --------------------------------------------------------

    batch1 = register_existing_batch_1(
        full_train_df
    )

    batch1_images = set(
        batch1["image"]
    )

    # --------------------------------------------------------
    # IMPORTANT
    #
    # Create ONE deterministic pool after removing Batch 1.
    #
    # Remaining training images:
    #
    # Batch 2 -> pool[0:20,000]
    # Batch 3 -> pool[20,000:40,000]
    # Batch 4 -> pool[40,000:48,000]
    #
    # This prevents skipped images.
    # --------------------------------------------------------

    pool = full_train_df[
        ~full_train_df["image"].isin(
            batch1_images
        )
    ].copy()

    pool = pool.sample(
        frac=1,
        random_state=cfg.SEED
    ).reset_index(drop=True)

    print()
    print("=" * 60)
    print("DETERMINISTIC TRAINING POOL")
    print("=" * 60)
    print(
        f"Batch 1 excluded : {len(batch1):,}"
    )
    print(
        f"Remaining pool   : {len(pool):,}"
    )
    print("=" * 60)

    # --------------------------------------------------------
    # Batch number validation
    # --------------------------------------------------------

    if batch_number < 2:

        sys.exit(
            "ERROR: Batch mode starts at Batch 2."
        )

    # --------------------------------------------------------
    # Calculate exact position
    # --------------------------------------------------------

    start = (
        (batch_number - 2)
        * batch_size
    )

    end = min(
        start + batch_size,
        len(pool)
    )

    if start >= len(pool):

        sys.exit(
            f"\nERROR: There are no images left "
            f"for Batch {batch_number}.\n"
            f"Pool size: {len(pool):,}\n"
            f"Requested start: {start:,}"
        )

    batch = pool.iloc[
        start:end
    ].copy()

    # --------------------------------------------------------
    # Load previous batches
    # --------------------------------------------------------

    used_images = set()

    previous_files = sorted(
        batch_dir.glob("batch_*.csv")
    )

    for previous_file in previous_files:

        if previous_file == current_file:
            continue

        if "_backup" in previous_file.stem:
            continue

        previous_df = pd.read_csv(
            previous_file
        )

        if "image" in previous_df.columns:

            used_images.update(
                previous_df["image"]
            )

    # --------------------------------------------------------
    # Safety check 1
    # --------------------------------------------------------

    overlap = (
        set(batch["image"])
        & used_images
    )

    if overlap:

        sys.exit(
            f"\nERROR: {len(overlap):,} duplicate "
            f"images detected."
        )

    # --------------------------------------------------------
    # Safety check 2
    # --------------------------------------------------------

    expected_size = min(
        batch_size,
        len(pool) - start
    )

    if len(batch) != expected_size:

        sys.exit(
            f"\nERROR: Expected "
            f"{expected_size:,} images but got "
            f"{len(batch):,}."
        )

    # --------------------------------------------------------
    # Save batch
    # --------------------------------------------------------

    batch.to_csv(
        current_file,
        index=False
    )

    print()
    print("=" * 60)
    print(f"BATCH {batch_number}")
    print("=" * 60)

    print(
        f"Images selected : {len(batch):,}"
    )

    print(
        f"Pool position   : "
        f"{start:,} - {end - 1:,}"
    )

    print(
        f"Pool remaining  : "
        f"{len(pool) - end:,}"
    )

    print(
        f"Saved to        : {current_file}"
    )

    print(
        "[OK] No image overlap with previous batches."
    )

    print("=" * 60)

    return batch


# ============================================================
# PREVALENCE REPORT
# ============================================================

def prevalence_report(splits):

    rows = []

    for lab in cfg.LABELS + ["No_Finding"]:

        row = {
            "label": lab
        }

        for name, d in splits.items():

            row[
                f"{name}_n"
            ] = int(
                d[lab].sum()
            )

            row[
                f"{name}_%"
            ] = round(
                100 * d[lab].mean(),
                2
            )

        rows.append(row)

    rep = pd.DataFrame(rows)

    print(
        "\n--- Label Prevalence ---"
    )

    print(
        rep.to_string(index=False)
    )

    metrics_dir = (
        cfg.RESULTS_DIR
        / "metrics"
    )

    metrics_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    rep.to_csv(
        metrics_dir / "cxr14_prevalence.csv",
        index=False
    )


# ============================================================
# MAIN
# ============================================================

def main():

    ap = argparse.ArgumentParser()

    ap.add_argument(
        "--max-train-images",
        type=int,
        default=None
    )

    ap.add_argument(
        "--max-test-images",
        type=int,
        default=None
    )

    ap.add_argument(
        "--val-frac",
        type=float,
        default=0.15
    )

    ap.add_argument(
        "--view",
        choices=["PA", "AP", "both"],
        default="both"
    )

    ap.add_argument(
        "--random-split",
        action="store_true"
    )

    ap.add_argument(
        "--rescan",
        action="store_true"
    )

    ap.add_argument(
        "--batch-number",
        type=int,
        default=None
    )

    ap.add_argument(
        "--batch-size",
        type=int,
        default=20000
    )

    args = ap.parse_args()

    # --------------------------------------------------------
    # 1. Find images
    # --------------------------------------------------------

    index = build_path_index(
        force=args.rescan
    )

    # --------------------------------------------------------
    # 2. Load metadata
    # --------------------------------------------------------

    df = load_metadata()

    df["path"] = df["image"].map(index)

    df = df.dropna(
        subset=["path"]
    )

    # --------------------------------------------------------
    # 3. View filter
    # --------------------------------------------------------

    if args.view != "both":

        df = df[
            df["view"] == args.view
        ]

    # --------------------------------------------------------
    # 4. Official split
    # --------------------------------------------------------

    if args.random_split:

        trainval, test = patient_split(
            df,
            frac=0.20,
            seed=cfg.SEED
        )

    else:

        trainval, test = official_split(
            df
        )

        if trainval is None:

            print(
                "Official split files not found."
            )

            trainval, test = patient_split(
                df,
                frac=0.20,
                seed=cfg.SEED
            )

    # --------------------------------------------------------
    # 5. Patient-level validation split
    # --------------------------------------------------------

    train, val = patient_split(
        trainval,
        frac=args.val_frac,
        seed=cfg.SEED
    )

    # --------------------------------------------------------
    # 6. Batch mode
    # --------------------------------------------------------

    if args.batch_number is not None:

        if args.batch_number < 2:

            sys.exit(
                "ERROR: Batch number must be 2 or greater."
            )

        batch = create_batch(
            train,
            args.batch_number,
            args.batch_size
        )

        batch_images = set(
            batch["image"]
        )

        train = train[
            train["image"].isin(
                batch_images
            )
        ].copy()

    # --------------------------------------------------------
    # 7. Normal mode
    # --------------------------------------------------------

    else:

        train = subsample_by_patient(
            train,
            args.max_train_images,
            cfg.SEED
        )

    # --------------------------------------------------------
    # 8. Validation / test
    # --------------------------------------------------------

    val = subsample_by_patient(
        val,
        (
            None
            if args.max_train_images is None
            else max(
                2000,
                args.max_train_images // 6
            )
        ),
        cfg.SEED
    )

    test = subsample_by_patient(
        test,
        args.max_test_images,
        cfg.SEED
    )

    # --------------------------------------------------------
    # 9. Patient leakage check
    # --------------------------------------------------------

    split_patients = {
        "train": set(
            train.patient_id
        ),
        "val": set(
            val.patient_id
        ),
        "test": set(
            test.patient_id
        )
    }

    for a, b in [
        ("train", "val"),
        ("train", "test"),
        ("val", "test")
    ]:

        overlap = (
            split_patients[a]
            & split_patients[b]
        )

        assert not overlap, (
            f"PATIENT LEAKAGE between "
            f"{a} and {b}: "
            f"{len(overlap)} patients"
        )

    print(
        "\n[OK] No patient appears "
        "in more than one train/val/test split"
    )

    # --------------------------------------------------------
    # 10. Save CSVs
    # --------------------------------------------------------

    cols = [
        "image",
        "path",
        "patient_id",
        "age",
        "sex",
        "view",
        "followup"
    ] + cfg.LABELS + ["No_Finding"]

    for name, d, out in [
        ("train", train, cfg.TRAIN_CSV),
        ("val", val, cfg.VAL_CSV),
        ("test", test, cfg.TEST_CSV)
    ]:

        d[cols].to_csv(
            out,
            index=False
        )

        print(
            f"{name:5s}: "
            f"{len(d):6,} images / "
            f"{d.patient_id.nunique():5,} patients "
            f"-> {out}"
        )

    # --------------------------------------------------------
    # 11. Prevalence
    # --------------------------------------------------------

    prevalence_report(
        {
            "train": train,
            "val": val,
            "test": test
        }
    )


if __name__ == "__main__":
    main()