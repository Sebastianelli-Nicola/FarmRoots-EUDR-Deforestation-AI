"""
prepare_dataset.py
Converte le maschere binarie in formato YOLO-seg (poligoni normalizzati)
e divide il dataset in train/val/test con split stratificato.

Struttura output:
    dataset/
        images/train|val|test/  ← symlink o copia delle immagini
        labels/train|val|test/  ← file .txt YOLO-seg
    dataset.yaml
"""

import os
import shutil
import cv2
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
import yaml

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE       = Path(__file__).parent
IMAGES_DIR = BASE / "images"
MASKS_DIR  = BASE / "masks"
DATASET    = BASE / "dataset"

SPLITS = {"train": 0.70, "val": 0.15, "test": 0.15}
MASK_THRESHOLD = 127          # soglia binarizzazione maschera JPEG
MIN_CONTOUR_AREA = 16         # pixel² — scarta contorni microscopici
APPROX_EPSILON_FACTOR = 0.002 # semplificazione poligono (% del perimetro)
IMG_SIZE = 256


def mask_to_yolo_polygons(mask_path: Path) -> list[str]:
    """
    Legge una maschera, estrae i contorni della foresta e restituisce
    una lista di stringhe in formato YOLO-seg:
        "0 x1 y1 x2 y2 ... xn yn"  (coordinate normalizzate [0,1])
    """
    mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
    if mask is None:
        return []

    _, binary = cv2.threshold(mask, MASK_THRESHOLD, 255, cv2.THRESH_BINARY)

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    lines = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < MIN_CONTOUR_AREA:
            continue

        # Semplifica il poligono
        epsilon = APPROX_EPSILON_FACTOR * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)

        if len(approx) < 3:
            continue

        # Normalizza in [0, 1]
        coords = approx.reshape(-1, 2) / IMG_SIZE
        coords = coords.clip(0.0, 1.0)

        flat = " ".join(f"{x:.6f} {y:.6f}" for x, y in coords)
        lines.append(f"0 {flat}")

    return lines


def forest_coverage(mask_path: Path) -> float:
    mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
    if mask is None:
        return 0.0
    return float((mask > MASK_THRESHOLD).sum()) / mask.size


def stratify_bins(coverages: list[float], n_bins: int = 5) -> list[int]:
    """Assegna ogni sample a un bin di copertura per la stratificazione."""
    arr = np.array(coverages)
    bins = np.percentile(arr, np.linspace(0, 100, n_bins + 1))
    bins[-1] += 1e-6
    return list(np.digitize(arr, bins[1:-1]))


def setup_dirs():
    for split in SPLITS:
        (DATASET / "images" / split).mkdir(parents=True, exist_ok=True)
        (DATASET / "labels" / split).mkdir(parents=True, exist_ok=True)


def write_yaml(class_names: list[str]):
    cfg = {
        "path": str(DATASET.resolve()),
        "train": "images/train",
        "val":   "images/val",
        "test":  "images/test",
        "nc":    len(class_names),
        "names": class_names,
    }
    with open(BASE / "dataset.yaml", "w") as f:
        yaml.dump(cfg, f, default_flow_style=False, sort_keys=False)
    print(f"  dataset.yaml scritto in {BASE / 'dataset.yaml'}")


def main():
    print("=== Preparazione dataset YOLO-seg ===\n")

    # Raccogli tutte le coppie immagine / maschera
    all_images = sorted(IMAGES_DIR.glob("*.jpg"))
    pairs = []
    missing = 0
    for img_path in all_images:
        mask_name = img_path.name.replace("sat", "mask")
        mask_path = MASKS_DIR / mask_name
        if not mask_path.exists():
            missing += 1
            continue
        pairs.append((img_path, mask_path))

    print(f"  Coppie trovate: {len(pairs)}  |  Maschere mancanti: {missing}")

    # Calcola copertura foresta per ogni sample (usato per stratificazione)
    print("  Calcolo forest coverage per stratificazione...")
    coverages = [forest_coverage(m) for _, m in pairs]
    strat_bins = stratify_bins(coverages)

    # Split stratificato: prima train vs resto, poi val vs test
    indices = list(range(len(pairs)))
    idx_train, idx_tmp, bins_train, bins_tmp = train_test_split(
        indices, strat_bins,
        test_size=(SPLITS["val"] + SPLITS["test"]),
        random_state=42,
        stratify=strat_bins,
    )
    val_ratio = SPLITS["val"] / (SPLITS["val"] + SPLITS["test"])
    idx_val, idx_test = train_test_split(
        idx_tmp,
        test_size=1 - val_ratio,
        random_state=42,
        stratify=bins_tmp,
    )

    split_map = (
        [(i, "train") for i in idx_train]
        + [(i, "val")   for i in idx_val]
        + [(i, "test")  for i in idx_test]
    )

    print(f"  Split: train={len(idx_train)}  val={len(idx_val)}  test={len(idx_test)}")

    # Crea struttura directory
    setup_dirs()

    # Converti maschere e copia file
    print("  Conversione maschere in formato YOLO-seg...")
    stats = {"train": 0, "val": 0, "test": 0}
    empty_labels = 0

    for idx, split in split_map:
        img_path, mask_path = pairs[idx]

        # Copia immagine
        dst_img = DATASET / "images" / split / img_path.name
        shutil.copy2(img_path, dst_img)

        # Genera label YOLO-seg
        yolo_lines = mask_to_yolo_polygons(mask_path)
        label_name = img_path.stem + ".txt"
        dst_lbl = DATASET / "labels" / split / label_name
        with open(dst_lbl, "w") as f:
            f.write("\n".join(yolo_lines))

        if not yolo_lines:
            empty_labels += 1
        stats[split] += 1

    # Scrivi dataset.yaml
    write_yaml(["forest"])

    print(f"\n  File con label vuota (immagini senza foresta): {empty_labels}")
    print(f"  Struttura salvata in: {DATASET}")
    print("\n=== Completato ===")

    # Verifica rapida: stampa qualche label
    sample_labels = list((DATASET / "labels" / "train").glob("*.txt"))[:3]
    for lbl in sample_labels:
        lines = lbl.read_text().strip().splitlines()
        print(f"  {lbl.name}: {len(lines)} contorno/i, primo: {lines[0][:80] if lines else '(vuoto)'}...")


if __name__ == "__main__":
    main()
