from pathlib import Path
import torch

# Paths
ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw" / "chestxray14"
PROC_DIR = ROOT / "data" / "processed" / "chestxray14"
CACHE_DIR = ROOT / "data" / "processed" / "cxr14_cache"
MODEL_DIR = ROOT / "models"
RESULTS_DIR = ROOT / "results"

META_CSV = RAW_DIR / "Data_Entry_2017.csv"
BBOX_CSV = RAW_DIR / "BBox_List_2017.csv"
OFFICIAL_TRAINVAL_LIST = RAW_DIR / "train_val_list.txt"
OFFICIAL_TEST_LIST = RAW_DIR / "test_list.txt"

TRAIN_CSV = PROC_DIR / "train.csv"
VAL_CSV = PROC_DIR / "val.csv"
TEST_CSV = PROC_DIR / "test.csv"
PATH_INDEX_JSON = PROC_DIR / "image_path_index.json"

MODEL_PATH = MODEL_DIR / "lumen_chestxray14.pth"
HISTORY_JSON = RESULTS_DIR / "metrics" / "cxr14_history.json"
THRESHOLDS_JSON = RESULTS_DIR / "metrics" / "cxr14_thresholds.json"

for d in (PROC_DIR, MODEL_DIR, RESULTS_DIR / "metrics", 
          RESULTS_DIR / "heatmaps", RESULTS_DIR / "calibration", 
          RESULTS_DIR / "localization"):
    d.mkdir(parents=True, exist_ok=True)

# Labels
LABELS = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration",
    "Mass", "Nodule", "Pneumonia", "Pneumothorax",
    "Consolidation", "Edema", "Emphysema", "Fibrosis",
    "Pleural_Thickening", "Hernia"
]
NUM_LABELS = len(LABELS)
PRETTY = {lab: lab.replace("_", " ") for lab in LABELS}

BBOX_LABELS = ["Atelectasis", "Cardiomegaly", "Effusion", "Infiltrate",
               "Mass", "Nodule", "Pneumonia", "Pneumothorax"]
BBOX_TO_LABEL = {"Infiltrate": "Infiltration"}

# Training Hyperparameters
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
USE_AMP = torch.cuda.is_available()
IMG_SIZE = 224
CACHE_SIZE = 256
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

BATCH_SIZE = 32
EPOCHS = 15
LEARNING_RATE = 1e-4
WEIGHT_DECAY = 1e-5
LR_REDUCE_FACTOR = 0.2
LR_PATIENCE = 2
EARLY_STOP_PATIENCE = 5
NUM_WORKERS = 0  # Set to 0 if Windows DataLoader hangs
POS_WEIGHT_CAP = 10.0
SEED = 42