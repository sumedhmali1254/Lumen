import argparse
import json
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from tqdm import tqdm

from src import config_cxr14 as cfg
from src.chestxray14_dataset import (
    get_dataloaders,
    get_pos_weight
)
from src.model_multilabel import build_model


# ============================================================
# AUC
# ============================================================

def binary_auc(y_true, y_score):

    y_true = np.asarray(
        y_true
    ).astype(np.int64)

    y_score = np.asarray(
        y_score
    ).astype(np.float64)

    positives = np.sum(
        y_true == 1
    )

    negatives = np.sum(
        y_true == 0
    )

    if positives == 0 or negatives == 0:
        return float("nan")

    order = np.argsort(
        y_score,
        kind="mergesort"
    )

    sorted_scores = y_score[order]
    sorted_labels = y_true[order]

    ranks = np.empty(
        len(sorted_scores),
        dtype=np.float64
    )

    start = 0
    n = len(sorted_scores)

    while start < n:

        end = start + 1

        while (
            end < n
            and sorted_scores[end]
            == sorted_scores[start]
        ):
            end += 1

        average_rank = (
            start + 1 + end
        ) / 2.0

        ranks[start:end] = average_rank

        start = end

    positive_ranks = ranks[
        sorted_labels == 1
    ]

    auc = (
        np.sum(positive_ranks)
        - positives * (positives + 1) / 2.0
    ) / (
        positives * negatives
    )

    return float(auc)


def mean_auc(y_true, y_prob):

    aucs = []
    per_class = {}

    for i, lab in enumerate(
        cfg.LABELS
    ):

        auc = binary_auc(
            y_true[:, i],
            y_prob[:, i]
        )

        if np.isnan(auc):

            per_class[lab] = None

        else:

            per_class[lab] = float(
                auc
            )

            aucs.append(
                auc
            )

    if not aucs:
        return float("nan"), per_class

    return (
        float(np.mean(aucs)),
        per_class
    )


# ============================================================
# TRAIN ONE EPOCH
# ============================================================

def train_one_epoch(
    model,
    loader,
    criterion,
    optimizer,
    scaler
):

    model.train()

    total_loss = 0.0
    n = 0

    progress = tqdm(
        loader,
        desc="train",
        leave=False
    )

    for x, y in progress:

        x = x.to(
            cfg.DEVICE,
            non_blocking=True
        )

        y = y.to(
            cfg.DEVICE,
            non_blocking=True
        )

        optimizer.zero_grad(
            set_to_none=True
        )

        with torch.amp.autocast(
            "cuda",
            enabled=cfg.USE_AMP
        ):

            logits = model(x)

            loss = criterion(
                logits,
                y
            )

        scaler.scale(
            loss
        ).backward()

        scaler.step(
            optimizer
        )

        scaler.update()

        total_loss += (
            loss.item()
            * x.size(0)
        )

        n += x.size(0)

        progress.set_postfix(
            loss=f"{loss.item():.4f}"
        )

    if n == 0:
        return 0.0

    return total_loss / n


# ============================================================
# VALIDATION
# ============================================================

@torch.no_grad()
def evaluate(
    model,
    loader,
    criterion
):

    model.eval()

    total_loss = 0.0
    n = 0

    ys = []
    ps = []

    progress = tqdm(
        loader,
        desc="valid",
        leave=False
    )

    for x, y in progress:

        x = x.to(
            cfg.DEVICE,
            non_blocking=True
        )

        y = y.to(
            cfg.DEVICE,
            non_blocking=True
        )

        with torch.amp.autocast(
            "cuda",
            enabled=cfg.USE_AMP
        ):

            logits = model(x)

            loss = criterion(
                logits,
                y
            )

        total_loss += (
            loss.item()
            * x.size(0)
        )

        n += x.size(0)

        ys.append(
            y.detach()
            .cpu()
            .numpy()
        )

        ps.append(
            torch.sigmoid(
                logits.float()
            )
            .cpu()
            .numpy()
        )

    if n == 0:

        return (
            0.0,
            float("nan"),
            {}
        )

    y_true = np.concatenate(
        ys,
        axis=0
    )

    y_prob = np.concatenate(
        ps,
        axis=0
    )

    m_auc, per_class = mean_auc(
        y_true,
        y_prob
    )

    return (
        total_loss / n,
        m_auc,
        per_class
    )


# ============================================================
# CHECKPOINT
# ============================================================

def checkpoint_path():

    return (
        cfg.MODEL_DIR
        / "lumen_chestxray14_checkpoint.pth"
    )


def save_checkpoint(
    path,
    model,
    optimizer,
    scheduler,
    scaler,
    epoch,
    best_auc,
    history
):

    checkpoint = {

        "epoch": epoch,

        "model_state_dict":
            model.state_dict(),

        "optimizer_state_dict":
            optimizer.state_dict(),

        "scheduler_state_dict":
            scheduler.state_dict(),

        "scaler_state_dict":
            scaler.state_dict(),

        "best_auc":
            best_auc,

        "history":
            history
    }

    torch.save(
        checkpoint,
        path
    )


# ============================================================
# LOAD FULL CHECKPOINT
# ============================================================

def load_training_checkpoint(
    path,
    model,
    optimizer,
    scheduler,
    scaler
):

    if not Path(path).exists():

        return (
            0,
            0.0,
            []
        )

    print()
    print("=" * 50)
    print("Loading full training checkpoint")
    print("=" * 50)

    print(path)

    checkpoint = torch.load(
        path,
        map_location=cfg.DEVICE
    )

    model.load_state_dict(
        checkpoint[
            "model_state_dict"
        ]
    )

    optimizer.load_state_dict(
        checkpoint[
            "optimizer_state_dict"
        ]
    )

    scheduler.load_state_dict(
        checkpoint[
            "scheduler_state_dict"
        ]
    )

    scaler.load_state_dict(
        checkpoint[
            "scaler_state_dict"
        ]
    )

    start_epoch = checkpoint.get(
        "epoch",
        0
    )

    best_auc = checkpoint.get(
        "best_auc",
        0.0
    )

    history = checkpoint.get(
        "history",
        []
    )

    print(
        f"Resuming from epoch "
        f"{start_epoch + 1}"
    )

    return (
        start_epoch,
        best_auc,
        history
    )


# ============================================================
# MAIN
# ============================================================

def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume interrupted training"
    )

    parser.add_argument(
        "--next-batch",
        action="store_true",
        help=(
            "Start a fresh 15-epoch training run "
            "using the currently trained model weights"
        )
    )

    parser.add_argument(
        "--fresh",
        action="store_true",
        help=(
            "Start completely fresh from "
            "ImageNet weights"
        )
    )

    args = parser.parse_args()

    # --------------------------------------------------------
    # Reproducibility
    # --------------------------------------------------------

    torch.manual_seed(
        cfg.SEED
    )

    np.random.seed(
        cfg.SEED
    )

    if torch.cuda.is_available():

        torch.cuda.manual_seed_all(
            cfg.SEED
        )

    # --------------------------------------------------------
    # Header
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("LUMEN ChestX-ray14 Training")
    print("=" * 60)

    print(
        "Device:",
        cfg.DEVICE
    )

    if torch.cuda.is_available():

        print(
            "GPU:",
            torch.cuda.get_device_name(0)
        )

    print(
        "Batch size:",
        cfg.BATCH_SIZE
    )

    print(
        "Epochs:",
        cfg.EPOCHS
    )

    print()

    # --------------------------------------------------------
    # Data
    # --------------------------------------------------------

    train_loader, val_loader, _ = (
        get_dataloaders()
    )

    print(
        "Training batches:",
        len(train_loader)
    )

    print(
        "Validation batches:",
        len(val_loader)
    )

    # --------------------------------------------------------
    # Loss
    # --------------------------------------------------------

    pos_weight = get_pos_weight()

    pos_weight = pos_weight.to(
        cfg.DEVICE
    )

    criterion = (
        nn.BCEWithLogitsLoss(
            pos_weight=pos_weight
        )
    )

    # --------------------------------------------------------
    # Paths
    # --------------------------------------------------------

    existing_model = Path(
        cfg.MODEL_PATH
    ).exists()

    full_checkpoint = (
        checkpoint_path()
    )

    # --------------------------------------------------------
    # MODEL SELECTION
    # --------------------------------------------------------

    if args.fresh:

        print()
        print(
            "Starting completely fresh."
        )

        model = build_model(
            pretrained=True,
            checkpoint_path=None
        )

    elif args.next_batch:

        # ----------------------------------------------------
        # NEXT BATCH
        #
        # Load ONLY the trained model weights.
        #
        # Optimizer / scheduler / epoch are reset.
        #
        # This means:
        #
        # Batch 1 weights
        #       ↓
        # Batch 2 training
        #       ↓
        # Batch 2 final model
        #       ↓
        # Batch 3 starts from those weights
        #       ↓
        # Batch 3 gets a fresh 15 epochs
        # ----------------------------------------------------

        if not existing_model:

            raise SystemExit(
                "\nERROR: No trained model found.\n"
                f"Expected:\n{cfg.MODEL_PATH}\n"
                "Train the previous batch first."
            )

        print()
        print("=" * 60)
        print("NEXT BATCH MODE")
        print("=" * 60)

        print(
            "Loading trained model weights:"
        )

        print(
            cfg.MODEL_PATH
        )

        model = build_model(
            pretrained=False,
            checkpoint_path=cfg.MODEL_PATH
        )

        print()
        print(
            "Starting a NEW 15-epoch run."
        )

        print(
            "Optimizer state: RESET"
        )

        print(
            "Scheduler state: RESET"
        )

        print(
            "Epoch counter: RESET"
        )

    elif args.resume and full_checkpoint.exists():

        print()
        print(
            "Full checkpoint found."
        )

        model = build_model(
            pretrained=False,
            checkpoint_path=None
        )

    elif args.resume and existing_model:

        print()
        print(
            "Existing trained model found."
        )

        print(
            "Loading:",
            cfg.MODEL_PATH
        )

        model = build_model(
            pretrained=False,
            checkpoint_path=cfg.MODEL_PATH
        )

    else:

        print()
        print(
            "No trained checkpoint found."
        )

        print(
            "Starting from ImageNet weights."
        )

        model = build_model(
            pretrained=True,
            checkpoint_path=None
        )

    # --------------------------------------------------------
    # Optimizer
    # --------------------------------------------------------

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=cfg.LEARNING_RATE,
        weight_decay=cfg.WEIGHT_DECAY
    )

    # --------------------------------------------------------
    # Scheduler
    # --------------------------------------------------------

    scheduler = (
        torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer,
            mode="max",
            factor=cfg.LR_REDUCE_FACTOR,
            patience=cfg.LR_PATIENCE
        )
    )

    # --------------------------------------------------------
    # AMP
    # --------------------------------------------------------

    scaler = torch.amp.GradScaler(
        "cuda",
        enabled=cfg.USE_AMP
    )

    # --------------------------------------------------------
    # Training state
    # --------------------------------------------------------

    start_epoch = 0
    best_auc = 0.0
    history = []

    # --------------------------------------------------------
    # Resume interrupted training
    # --------------------------------------------------------

    if (
        args.resume
        and not args.next_batch
        and full_checkpoint.exists()
    ):

        (
            start_epoch,
            best_auc,
            history
        ) = load_training_checkpoint(
            full_checkpoint,
            model,
            optimizer,
            scheduler,
            scaler
        )

    # --------------------------------------------------------
    # TRAIN
    # --------------------------------------------------------

    try:

        for epoch in range(
            start_epoch + 1,
            cfg.EPOCHS + 1
        ):

            start_time = time.time()

            train_loss = train_one_epoch(
                model,
                train_loader,
                criterion,
                optimizer,
                scaler
            )

            (
                val_loss,
                val_auc,
                per_class
            ) = evaluate(
                model,
                val_loader,
                criterion
            )

            scheduler.step(
                val_auc
            )

            elapsed = (
                time.time()
                - start_time
            )

            current_lr = (
                optimizer
                .param_groups[0]["lr"]
            )

            print()
            print(
                f"Epoch {epoch:02d}/{cfg.EPOCHS} | "
                f"train loss {train_loss:.4f} | "
                f"val loss {val_loss:.4f} | "
                f"val mAUC {val_auc:.4f} | "
                f"LR {current_lr:.2e} | "
                f"{elapsed:.0f}s"
            )

            history.append(
                {
                    "epoch": epoch,
                    "train_loss": train_loss,
                    "val_loss": val_loss,
                    "val_mean_auc": val_auc,
                    "per_class_auc": per_class
                }
            )

            # ------------------------------------------------
            # Save history
            # ------------------------------------------------

            with open(
                cfg.HISTORY_JSON,
                "w",
                encoding="utf-8"
            ) as f:

                json.dump(
                    history,
                    f,
                    indent=2
                )

            # ------------------------------------------------
            # Save best model
            # ------------------------------------------------

            if (
                not np.isnan(val_auc)
                and val_auc > best_auc
            ):

                best_auc = val_auc

                torch.save(
                    model.state_dict(),
                    cfg.MODEL_PATH
                )

                print(
                    f" -> Saved best model: "
                    f"{cfg.MODEL_PATH.name} "
                    f"(mAUC {best_auc:.4f})"
                )

            # ------------------------------------------------
            # Save full checkpoint
            # ------------------------------------------------

            save_checkpoint(
                full_checkpoint,
                model,
                optimizer,
                scheduler,
                scaler,
                epoch,
                best_auc,
                history
            )

            print(
                f" -> Checkpoint saved: "
                f"{full_checkpoint.name}"
            )

    except KeyboardInterrupt:

        print()
        print("=" * 60)
        print("Training interrupted by user.")
        print("=" * 60)

        print(
            "The latest completed epoch checkpoint "
            "has already been saved."
        )

        print(
            "Use --resume to continue the interrupted run."
        )

        return

    # --------------------------------------------------------
    # Finished
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("Training finished")
    print("=" * 60)

    print(
        "Best validation mAUC:",
        f"{best_auc:.4f}"
    )

    print(
        "Model:",
        cfg.MODEL_PATH
    )

    print(
        "Checkpoint:",
        full_checkpoint
    )


if __name__ == "__main__":
    main()