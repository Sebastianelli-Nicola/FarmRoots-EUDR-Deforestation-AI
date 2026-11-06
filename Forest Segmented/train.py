"""
train.py
Grid search sugli iperparametri chiave di YOLOv8n-seg, poi training finale
con la configurazione migliore.


Grid:
    lr0          : [0.001, 0.005, 0.01]
    weight_decay : [0.0005, 0.001]
    → 6 configurazioni × SEARCH_EPOCHS epoche
    → training finale con FINAL_EPOCHS epoche

Output:
    runs/grid_search/  ← esperimenti di ricerca
    runs/final/        ← modello finale
    best_params.yaml   ← iperparametri scelti
"""

import os
import yaml
import json
import itertools
from pathlib import Path
from ultralytics import YOLO

# ── Config ────────────────────────────────────────────────────────────────────
BASE          = Path(__file__).parent
DATASET_YAML  = BASE / "dataset.yaml"
RUNS_DIR      = BASE / "runs"

MODEL_WEIGHTS = "yolov8n-seg.pt"   # nano-seg: ~3.4 M params, leggero
IMG_SIZE      = 256
SEARCH_EPOCHS = 20                  # epoche per ogni config della grid
FINAL_EPOCHS  = 100                 # epoche training finale
BATCH_SIZE    = 32                  # RTX 5080 16 GB → 32 comodo
WORKERS       = 4

# Grid di iperparametri
PARAM_GRID = {
    "lr0":          [0.001, 0.005, 0.01],
    "weight_decay": [0.0005, 0.001],
}

# Iperparametri fissi (augmentation adatta a immagini satellitari)
FIXED_PARAMS = {
    "hsv_h":   0.015,   # leggera variazione tonalità
    "hsv_s":   0.4,
    "hsv_v":   0.4,
    "degrees": 45.0,    # rotazione fino a 45° (immagini satellitari = isotrope)
    "fliplr":  0.5,
    "flipud":  0.5,
    "mosaic":  1.0,
    "scale":   0.3,
    "translate": 0.1,
}


def grid_configs() -> list[dict]:
    keys = list(PARAM_GRID.keys())
    values = list(PARAM_GRID.values())
    return [dict(zip(keys, combo)) for combo in itertools.product(*values)]


def train_config(config: dict, name: str, epochs: int) -> float:
    """
    Addestra un modello con la configurazione data.
    Restituisce la box/seg mAP50 sul validation set.
    """
    model = YOLO(MODEL_WEIGHTS)
    params = {**FIXED_PARAMS, **config}

    results = model.train(
        data=str(DATASET_YAML),
        epochs=epochs,
        imgsz=IMG_SIZE,
        batch=BATCH_SIZE,
        workers=WORKERS,
        project=str(RUNS_DIR / "grid_search"),
        name=name,
        exist_ok=True,
        device=0,           # GPU 0
        patience=10,        # early stopping nella grid
        save=False,         # non salvare checkpoint intermedi nella grid
        plots=False,
        verbose=False,
        **params,
    )

    # Estrai mAP50 segmentazione dall'ultimo epoch
    metrics = results.results_dict
    # Ultralytics: metrics/mAP50(M) = mAP50 segmentation mask
    map50 = metrics.get("metrics/mAP50(M)", metrics.get("metrics/mAP50(B)", 0.0))
    return float(map50)


def main():
    print("=== FarmRoots — Forest Segmentation Training ===\n")
    print(f"  Modello base : {MODEL_WEIGHTS}")
    print(f"  Dataset      : {DATASET_YAML}")
    print(f"  Search epochs: {SEARCH_EPOCHS}  |  Final epochs: {FINAL_EPOCHS}")
    print(f"  Batch size   : {BATCH_SIZE}\n")

    configs = grid_configs()
    print(f"  Grid search: {len(configs)} configurazioni\n")
    for i, cfg in enumerate(configs):
        print(f"  [{i+1}/{len(configs)}] {cfg}")
    print()

    # ── Grid search ───────────────────────────────────────────────────────────
    results_grid = []
    for i, cfg in enumerate(configs):
        name = f"gs_{i+1}_lr{cfg['lr0']}_wd{cfg['weight_decay']}"
        print(f"── Config {i+1}/{len(configs)}: {cfg}  →  {name}")
        map50 = train_config(cfg, name, SEARCH_EPOCHS)
        results_grid.append({"config": cfg, "name": name, "map50": map50})
        print(f"   mAP50(seg): {map50:.4f}\n")

    # Ordina per mAP50 decrescente
    results_grid.sort(key=lambda x: x["map50"], reverse=True)

    print("\n=== Risultati Grid Search ===")
    for r in results_grid:
        print(f"  {r['name']:50s}  mAP50={r['map50']:.4f}")

    best = results_grid[0]
    best_params = {**FIXED_PARAMS, **best["config"]}
    print(f"\n  Migliore configurazione: {best['config']}  (mAP50={best['map50']:.4f})")

    # Salva risultati grid
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    with open(BASE / "grid_results.json", "w") as f:
        json.dump(results_grid, f, indent=2)
    with open(BASE / "best_params.yaml", "w") as f:
        yaml.dump(best_params, f, default_flow_style=False)
    print("  Salvati: grid_results.json, best_params.yaml")

    # ── Training finale ───────────────────────────────────────────────────────
    print(f"\n=== Training finale ({FINAL_EPOCHS} epoche) ===")
    model = YOLO(MODEL_WEIGHTS)
    final_results = model.train(
        data=str(DATASET_YAML),
        epochs=FINAL_EPOCHS,
        imgsz=IMG_SIZE,
        batch=BATCH_SIZE,
        workers=WORKERS,
        project=str(RUNS_DIR / "final"),
        name="forest_seg",
        exist_ok=True,
        device=0,
        patience=20,
        save=True,
        plots=True,
        verbose=True,
        **best_params,
    )

    best_model_path = RUNS_DIR / "final" / "forest_seg" / "weights" / "best.pt"
    print(f"\n  Modello finale salvato in: {best_model_path}")
    print("=== Training completato ===")


if __name__ == "__main__":
    main()
