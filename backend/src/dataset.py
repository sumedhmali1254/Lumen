import torch
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms
from . import config as cfg


def get_transforms(train=True):
    """
    Training gets augmentation (rotation/shift/zoom) exactly like the paper:
    rotation=30, shift=0.30, zoom=0.30. Validation/test gets only resize+normalize.
    """
    if train:
        return transforms.Compose([
            transforms.Resize((cfg.IMG_SIZE, cfg.IMG_SIZE)),
            transforms.RandomRotation(30),
            transforms.RandomAffine(degrees=0, translate=(0.3, 0.3), scale=(0.7, 1.3)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.ToTensor(),
            transforms.Normalize(cfg.MEAN, cfg.STD),
        ])
    return transforms.Compose([
        transforms.Resize((cfg.IMG_SIZE, cfg.IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(cfg.MEAN, cfg.STD),
    ])


def get_dataloaders():
    """
    Loads the Kaggle chest_xray folder structure.
    Re-splits train into train/val because the official val folder has only 16 images.
    """
    full_train = datasets.ImageFolder(cfg.DATA_DIR / "train", transform=get_transforms(True))
    test_set   = datasets.ImageFolder(cfg.DATA_DIR / "test",  transform=get_transforms(False))

    val_size = int(0.15 * len(full_train))
    train_size = len(full_train) - val_size
    train_set, val_set = random_split(
        full_train, [train_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )
    # validation should not be augmented
    val_set.dataset.transform = get_transforms(False)

    train_loader = DataLoader(train_set, batch_size=cfg.BATCH_SIZE, shuffle=True,
                              num_workers=cfg.NUM_WORKERS, pin_memory=True)
    val_loader   = DataLoader(val_set,   batch_size=cfg.BATCH_SIZE, shuffle=False,
                              num_workers=cfg.NUM_WORKERS, pin_memory=True)
    test_loader  = DataLoader(test_set,  batch_size=cfg.BATCH_SIZE, shuffle=False,
                              num_workers=cfg.NUM_WORKERS, pin_memory=True)

    print(f"Train: {len(train_set)} | Val: {len(val_set)} | Test: {len(test_set)}")
    return train_loader, val_loader, test_loader


def get_class_weights(train_loader):
    """
    Pneumonia dataset is imbalanced (~3:1). Class weights stop the model
    from just guessing 'pneumonia' every time. The paper compares with/without.
    """
    counts = torch.zeros(cfg.NUM_CLASSES)
    for _, labels in train_loader:
        for l in labels:
            counts[l] += 1
    weights = counts.sum() / (cfg.NUM_CLASSES * counts)
    print(f"Class counts: {counts.tolist()} → weights: {weights.tolist()}")
    return weights.to(cfg.DEVICE)