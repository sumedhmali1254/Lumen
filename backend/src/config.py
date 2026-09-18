import torch
from pathlib import Path

# ---- Paths ----
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "raw" / "chest_xray"
MODEL_DIR = ROOT / "models"
RESULTS_DIR = ROOT / "results"
MODEL_PATH = MODEL_DIR / "lumen_densenet121.pth"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# ---- Device ----
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ---- Image ----
IMG_SIZE = 224          # DenseNet-121 expects 224x224
MEAN = [0.485, 0.456, 0.406]   # ImageNet normalization
STD  = [0.229, 0.224, 0.225]

# ---- Training hyperparameters (from the XAI-ICP paper, Table 9) ----
BATCH_SIZE = 32         # lower to 16 if you hit CUDA out-of-memory
EPOCHS = 25
LEARNING_RATE = 1e-4    # paper used 1e-5; 1e-4 converges faster for binary
LR_REDUCE_FACTOR = 0.1  # reduce LR by 10x
LR_PATIENCE = 2         # if val loss doesn't improve for 2 epochs
EARLY_STOP_PATIENCE = 8
NUM_WORKERS = 4         # set to 0 on Windows if you get multiprocessing errors

# ---- Classes ----
CLASS_NAMES = ["NORMAL", "PNEUMONIA"]
NUM_CLASSES = len(CLASS_NAMES)

# For the multi-label NIH version, switch to:
# CLASS_NAMES = ["Infiltration", "Effusion", "Cardiomegaly", "Atelectasis"]
# MULTI_LABEL = True
MULTI_LABEL = False