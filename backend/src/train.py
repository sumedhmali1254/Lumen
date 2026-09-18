import torch
import torch.nn as nn
import time
from tqdm import tqdm
from . import config as cfg
from .dataset import get_dataloaders, get_class_weights
from .model import build_model


def train_one_epoch(model, loader, criterion, optimizer):
    model.train()
    running_loss, correct, total = 0.0, 0, 0
    for images, labels in tqdm(loader, desc="  training", leave=False):
        images, labels = images.to(cfg.DEVICE), labels.to(cfg.DEVICE)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        correct += (outputs.argmax(1) == labels).sum().item()
        total += labels.size(0)
    return running_loss / total, correct / total


@torch.no_grad()
def validate(model, loader, criterion):
    model.eval()
    running_loss, correct, total = 0.0, 0, 0
    for images, labels in tqdm(loader, desc="  validating", leave=False):
        images, labels = images.to(cfg.DEVICE), labels.to(cfg.DEVICE)
        outputs = model(images)
        loss = criterion(outputs, labels)
        running_loss += loss.item() * images.size(0)
        correct += (outputs.argmax(1) == labels).sum().item()
        total += labels.size(0)
    return running_loss / total, correct / total


def main():
    print(f"Device: {cfg.DEVICE}")
    train_loader, val_loader, _ = get_dataloaders()

    model = build_model(pretrained=True)
    weights = get_class_weights(train_loader)
    criterion = nn.CrossEntropyLoss(weight=weights)
    optimizer = torch.optim.Adam(model.parameters(), lr=cfg.LEARNING_RATE)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=cfg.LR_REDUCE_FACTOR, patience=cfg.LR_PATIENCE
    )

    best_val_loss = float("inf")
    epochs_no_improve = 0

    for epoch in range(1, cfg.EPOCHS + 1):
        t0 = time.time()
        tr_loss, tr_acc = train_one_epoch(model, train_loader, criterion, optimizer)
        va_loss, va_acc = validate(model, val_loader, criterion)
        scheduler.step(va_loss)

        print(f"Epoch {epoch:02d}/{cfg.EPOCHS} | "
              f"train loss {tr_loss:.4f} acc {tr_acc:.4f} | "
              f"val loss {va_loss:.4f} acc {va_acc:.4f} | "
              f"{time.time()-t0:.0f}s")

        if va_loss < best_val_loss:
            best_val_loss = va_loss
            epochs_no_improve = 0
            torch.save(model.state_dict(), cfg.MODEL_PATH)
            print(f"  ✔ saved best model → {cfg.MODEL_PATH}")
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= cfg.EARLY_STOP_PATIENCE:
                print("Early stopping triggered.")
                break

    print(f"Done. Best val loss: {best_val_loss:.4f}")


if __name__ == "__main__":
    main()