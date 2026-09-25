import numpy as np
import pandas as pd
import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from src import config_cxr14 as cfg

def get_transforms(train=True):
    if train:
        return transforms.Compose([
            transforms.Resize((cfg.IMG_SIZE, cfg.IMG_SIZE)),
            transforms.RandomRotation(10),
            transforms.RandomAffine(degrees=0, translate=(0.05, 0.05), scale=(0.95, 1.05)),
            transforms.ColorJitter(brightness=0.1, contrast=0.1),
            transforms.ToTensor(),
            transforms.Normalize(cfg.MEAN, cfg.STD),
        ])
    return transforms.Compose([
        transforms.Resize((cfg.IMG_SIZE, cfg.IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(cfg.MEAN, cfg.STD),
    ])

class ChestXray14Dataset(Dataset):
    def __init__(self, csv_path, train=False, transform=None, return_meta=False):
        self.df = pd.read_csv(csv_path)
        self.transform = transform if transform is not None else get_transforms(train)
        self.return_meta = return_meta
        self.labels = self.df[cfg.LABELS].values.astype(np.float32)

    def __len__(self):
        return len(self.df)

    def resolve_path(self, row):
        cached = cfg.CACHE_DIR / row["image"]
        return cached if cached.exists() else cfg.RAW_DIR / row["path"]

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img = Image.open(self.resolve_path(row)).convert("RGB")
        x = self.transform(img)
        y = self.labels[idx]
        if self.return_meta:
            return x, y, row["image"]
        return x, y

def get_dataloaders(batch_size=None, num_workers=None):
    bs = batch_size or cfg.BATCH_SIZE
    nw = cfg.NUM_WORKERS if num_workers is None else num_workers
    train_ds = ChestXray14Dataset(cfg.TRAIN_CSV, train=True)
    val_ds = ChestXray14Dataset(cfg.VAL_CSV, train=False)
    test_ds = ChestXray14Dataset(cfg.TEST_CSV, train=False)

    common = dict(num_workers=nw, pin_memory=torch.cuda.is_available(), persistent_workers=(nw > 0))
    train_loader = DataLoader(train_ds, batch_size=bs, shuffle=True, drop_last=True, **common)
    val_loader = DataLoader(val_ds, batch_size=bs, shuffle=False, **common)
    test_loader = DataLoader(test_ds, batch_size=bs, shuffle=False, **common)
    return train_loader, val_loader, test_loader

def get_pos_weight():
    df = pd.read_csv(cfg.TRAIN_CSV)
    pos = df[cfg.LABELS].sum().values.astype(np.float32)
    neg = len(df) - pos
    pos = np.maximum(pos, 1.0)
    w = np.clip(neg / pos, 1.0, cfg.POS_WEIGHT_CAP)
    return torch.tensor(w, dtype=torch.float32, device=cfg.DEVICE)