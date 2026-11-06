"""
evaluate.py
Valuta il modello finale sul test set e genera un report completo.

Metriche calcolate:
    - Pixel Accuracy, Mean IoU, Dice Coefficient
    - Precision, Recall, F1 (a livello pixel)
    - mAP50 / mAP50-95 (metrica YOLO nativa)
    - Distribuzione degli score di confidenza
    - Visualizzazioni: campioni predetti, confusion matrix, istogrammi

Output:
    evaluation_report/
        metrics.json
        report.md
        plots/
            sample_predictions.png
            iou_distribution.png
            precision_recall_curve.png
            score_summary.png
"""

import json
import cv2
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from pathlib import Path
from datetime import datetime, timezone
from ultralytics import YOLO

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE         = Path(__file__).parent
DATASET_YAML = BASE / "dataset.yaml"
MODEL_PATH   = BASE / "runs" / "final" / "forest_seg" / "weights" / "best.pt"
TEST_IMGS    = BASE / "dataset" / "images" / "test"
TEST_LBLS    = BASE / "dataset" / "labels" / "test"
MASKS_DIR    = BASE / "masks"
REPORT_DIR   = BASE / "evaluation_report"
PLOTS_DIR    = REPORT_DIR / "plots"

IMG_SIZE     = 256
CONF_THRESH  = 0.25
IOU_THRESH   = 0.5


# ── Metric helpers ────────────────────────────────────────────────────────────

def pred_to_binary_mask(result, img_size: int = IMG_SIZE) -> np.ndarray:
    """Converte il risultato YOLO in maschera binaria 2D."""
    mask = np.zeros((img_size, img_size), dtype=np.uint8)
    if result.masks is None:
        return mask
    for m in result.masks.data:
        m_np = m.cpu().numpy()
        m_resized = cv2.resize(m_np, (img_size, img_size))
        mask = np.maximum(mask, (m_resized > 0.5).astype(np.uint8))
    return mask


def gt_to_binary_mask(mask_path: Path, img_size: int = IMG_SIZE) -> np.ndarray:
    """Legge la maschera ground truth e la binarizza."""
    m = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
    if m is None:
        return np.zeros((img_size, img_size), dtype=np.uint8)
    return (m > 127).astype(np.uint8)


def pixel_metrics(gt: np.ndarray, pred: np.ndarray) -> dict:
    tp = int(((gt == 1) & (pred == 1)).sum())
    tn = int(((gt == 0) & (pred == 0)).sum())
    fp = int(((gt == 0) & (pred == 1)).sum())
    fn = int(((gt == 1) & (pred == 0)).sum())

    pixel_acc  = (tp + tn) / (tp + tn + fp + fn + 1e-8)
    precision  = tp / (tp + fp + 1e-8)
    recall     = tp / (tp + fn + 1e-8)
    f1         = 2 * precision * recall / (precision + recall + 1e-8)
    iou        = tp / (tp + fp + fn + 1e-8)
    dice       = 2 * tp / (2 * tp + fp + fn + 1e-8)

    return {
        "pixel_acc": pixel_acc, "precision": precision, "recall": recall,
        "f1": f1, "iou": iou, "dice": dice,
        "tp": tp, "tn": tn, "fp": fp, "fn": fn,
    }


# ── Plots ─────────────────────────────────────────────────────────────────────

def plot_samples(model, test_images: list[Path], gt_masks: list[Path], n: int = 12):
    """Griglia n campioni: immagine | ground truth | predizione."""
    indices = np.linspace(0, len(test_images) - 1, n, dtype=int)

    fig, axes = plt.subplots(n, 3, figsize=(9, n * 3))
    fig.suptitle("Campioni di predizione sul test set\n(sinistra: originale | centro: GT | destra: predetto)",
                 fontsize=11, y=1.01)

    for row, idx in enumerate(indices):
        img_path = test_images[idx]
        gt_path  = gt_masks[idx]

        img = cv2.cvtColor(cv2.imread(str(img_path)), cv2.COLOR_BGR2RGB)
        gt  = gt_to_binary_mask(gt_path)

        results = model.predict(str(img_path), conf=CONF_THRESH, verbose=False)
        pred    = pred_to_binary_mask(results[0])

        # Overlay colorato
        gt_overlay   = img.copy(); gt_overlay[gt   == 1] = [0, 255, 0]
        pred_overlay = img.copy(); pred_overlay[pred == 1] = [0, 200, 255]

        m = pixel_metrics(gt, pred)

        axes[row, 0].imshow(img);           axes[row, 0].set_title(img_path.stem[:25], fontsize=7)
        axes[row, 1].imshow(gt_overlay);    axes[row, 1].set_title(f"GT  (foresta {gt.mean()*100:.0f}%)", fontsize=7)
        axes[row, 2].imshow(pred_overlay);  axes[row, 2].set_title(f"Pred  IoU={m['iou']:.2f}  Dice={m['dice']:.2f}", fontsize=7)

        for ax in axes[row]:
            ax.axis("off")

    plt.tight_layout()
    path = PLOTS_DIR / "sample_predictions.png"
    plt.savefig(path, dpi=120, bbox_inches="tight")
    plt.close()
    print(f"  Salvato: {path}")


def plot_iou_distribution(ious: list[float]):
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.hist(ious, bins=40, color="steelblue", alpha=0.8, edgecolor="white")
    ax.axvline(np.mean(ious), color="red", linestyle="--", linewidth=1.5, label=f"Media={np.mean(ious):.3f}")
    ax.axvline(np.median(ious), color="orange", linestyle="--", linewidth=1.5, label=f"Mediana={np.median(ious):.3f}")
    ax.set_xlabel("IoU per immagine")
    ax.set_ylabel("Conteggio")
    ax.set_title("Distribuzione IoU sul test set")
    ax.legend()
    plt.tight_layout()
    path = PLOTS_DIR / "iou_distribution.png"
    plt.savefig(path, dpi=130)
    plt.close()
    print(f"  Salvato: {path}")


def plot_confusion_summary(total_tp, total_tn, total_fp, total_fn):
    cm = np.array([[total_tn, total_fp], [total_fn, total_tp]], dtype=np.int64)
    labels = np.array([
        [f"TN\n{total_tn:,}", f"FP\n{total_fp:,}"],
        [f"FN\n{total_fn:,}", f"TP\n{total_tp:,}"],
    ])
    fig, ax = plt.subplots(figsize=(5, 4))
    sns.heatmap(cm, annot=labels, fmt="", cmap="Blues", ax=ax,
                xticklabels=["Pred: BG", "Pred: Foresta"],
                yticklabels=["GT: BG", "GT: Foresta"])
    ax.set_title("Confusion matrix (pixel aggregati — test set)")
    plt.tight_layout()
    path = PLOTS_DIR / "confusion_matrix.png"
    plt.savefig(path, dpi=130)
    plt.close()
    print(f"  Salvato: {path}")


def plot_score_summary(metrics_per_image: list[dict]):
    keys = ["pixel_acc", "precision", "recall", "f1", "iou", "dice"]
    labels_it = ["Pixel Acc", "Precision", "Recall", "F1", "IoU", "Dice"]
    means = [np.mean([m[k] for m in metrics_per_image]) for k in keys]
    stds  = [np.std( [m[k] for m in metrics_per_image]) for k in keys]

    colors = ["#2ecc71" if v >= 0.80 else "#f39c12" if v >= 0.60 else "#e74c3c" for v in means]

    fig, ax = plt.subplots(figsize=(9, 4))
    bars = ax.bar(labels_it, means, yerr=stds, capsize=4, color=colors, edgecolor="white", width=0.6)
    ax.set_ylim(0, 1.05)
    ax.axhline(0.8, color="gray", linestyle="--", linewidth=0.8, label="Soglia 0.80")
    for bar, val in zip(bars, means):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.02,
                f"{val:.3f}", ha="center", va="bottom", fontsize=9, fontweight="bold")
    ax.set_title("Metriche medie sul test set (±std)")
    ax.legend()
    plt.tight_layout()
    path = PLOTS_DIR / "score_summary.png"
    plt.savefig(path, dpi=130)
    plt.close()
    print(f"  Salvato: {path}")


# ── Report ────────────────────────────────────────────────────────────────────

def save_report(metrics_avg: dict, metrics_std: dict, n_test: int,
                yolo_native: dict, grid_results: list):
    iou = metrics_avg["iou"]
    if iou >= 0.80:
        quality, color = "Ottimo", "🟢"
    elif iou >= 0.65:
        quality, color = "Buono", "🟡"
    else:
        quality, color = "Migliorabile", "🔴"

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    grid_rows = ""
    if grid_results:
        for r in grid_results:
            grid_rows += f"| `lr0={r['config']['lr0']}  wd={r['config']['weight_decay']}` | {r['map50']:.4f} |\n"

    md = f"""# FarmRoots — Forest Segmentation Report

_Generato il: {ts}_

---

## Modello

| Parametro | Valore |
|---|---|
| Architettura | YOLOv8n-seg |
| Pesi base | yolov8n-seg.pt |
| Immagini input | 256 × 256 px |
| Classe | forest (binario) |
| Test set | {n_test} immagini |

---

## Grid Search

| Configurazione | mAP50(seg) val |
|---|---|
{grid_rows}

---

## Metriche sul Test Set

| Metrica | Media | Std |
|---|---|---|
| Pixel Accuracy | {metrics_avg['pixel_acc']:.4f} | {metrics_std['pixel_acc']:.4f} |
| Precision | {metrics_avg['precision']:.4f} | {metrics_std['precision']:.4f} |
| Recall | {metrics_avg['recall']:.4f} | {metrics_std['recall']:.4f} |
| F1 Score | {metrics_avg['f1']:.4f} | {metrics_std['f1']:.4f} |
| IoU (Jaccard) | {metrics_avg['iou']:.4f} | {metrics_std['iou']:.4f} |
| Dice Coefficient | {metrics_avg['dice']:.4f} | {metrics_std['dice']:.4f} |

### Metriche native YOLO (sul test set)
| Metrica | Valore |
|---|---|
| mAP50 (mask) | {yolo_native.get('metrics/mAP50(M)', 'n/a')} |
| mAP50-95 (mask) | {yolo_native.get('metrics/mAP50-95(M)', 'n/a')} |
| mAP50 (box) | {yolo_native.get('metrics/mAP50(B)', 'n/a')} |

---

## Conclusione

**Qualità complessiva: {color} {quality}**

IoU medio = {iou:.3f} — {"il modello segmenta la foresta con alta precisione, adatto all'uso in produzione." if quality == "Ottimo" else "buone prestazioni generali, margine di miglioramento con più dati o epoche." if quality == "Buono" else "si consiglia rivedere augmentation, epoche o bilanciamento delle classi."}

---

## Grafici

- `plots/sample_predictions.png` — campioni visivi (originale | GT | predetto)
- `plots/iou_distribution.png` — distribuzione IoU per immagine
- `plots/confusion_matrix.png` — confusion matrix aggregata a livello pixel
- `plots/score_summary.png` — riepilogo metriche con barre di errore
"""

    with open(REPORT_DIR / "report.md", "w", encoding="utf-8") as f:
        f.write(md)
    print(f"  Salvato: {REPORT_DIR / 'report.md'}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== FarmRoots — Valutazione modello ===\n")

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Modello non trovato: {MODEL_PATH}\nEsegui prima train.py")

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)

    model = YOLO(str(MODEL_PATH))
    print(f"  Modello caricato: {MODEL_PATH}\n")

    # Lista immagini test e maschere GT corrispondenti
    test_images = sorted(TEST_IMGS.glob("*.jpg"))
    gt_masks = []
    valid_images = []
    for img_path in test_images:
        mask_name = img_path.name.replace("sat", "mask")
        mask_path = MASKS_DIR / mask_name
        if mask_path.exists():
            gt_masks.append(mask_path)
            valid_images.append(img_path)

    print(f"  Test set: {len(valid_images)} immagini\n")

    # ── Valutazione pixel-level ───────────────────────────────────────────────
    print("  Calcolo metriche pixel-level...")
    all_metrics = []
    total_tp = total_tn = total_fp = total_fn = 0

    for img_path, gt_path in zip(valid_images, gt_masks):
        results = model.predict(str(img_path), conf=CONF_THRESH, verbose=False)
        pred    = pred_to_binary_mask(results[0])
        gt      = gt_to_binary_mask(gt_path)
        m       = pixel_metrics(gt, pred)
        all_metrics.append(m)
        total_tp += m["tp"]; total_tn += m["tn"]
        total_fp += m["fp"]; total_fn += m["fn"]

    keys = ["pixel_acc", "precision", "recall", "f1", "iou", "dice"]
    metrics_avg = {k: float(np.mean([m[k] for m in all_metrics])) for k in keys}
    metrics_std = {k: float(np.std( [m[k] for m in all_metrics])) for k in keys}

    print("  Metriche medie test set:")
    for k in keys:
        print(f"    {k:15s}: {metrics_avg[k]:.4f} ± {metrics_std[k]:.4f}")

    # ── Metriche native YOLO ──────────────────────────────────────────────────
    print("\n  Valutazione YOLO nativa (mAP)...")
    val_results = model.val(data=str(DATASET_YAML), split="test",
                            imgsz=IMG_SIZE, conf=CONF_THRESH, verbose=False, device=0)
    yolo_native = {k: round(float(v), 4) for k, v in val_results.results_dict.items()}
    print(f"    mAP50(M) = {yolo_native.get('metrics/mAP50(M)', 'n/a')}")
    print(f"    mAP50-95(M) = {yolo_native.get('metrics/mAP50-95(M)', 'n/a')}")

    # ── Carica risultati grid search ──────────────────────────────────────────
    grid_results = []
    grid_path = BASE / "grid_results.json"
    if grid_path.exists():
        with open(grid_path) as f:
            grid_results = json.load(f)

    # ── Plot ──────────────────────────────────────────────────────────────────
    print("\n  Generazione grafici...")
    plot_samples(model, valid_images, gt_masks, n=12)
    plot_iou_distribution([m["iou"] for m in all_metrics])
    plot_confusion_summary(total_tp, total_tn, total_fp, total_fn)
    plot_score_summary(all_metrics)

    # ── Salva metrics.json ────────────────────────────────────────────────────
    output = {
        "n_test": len(valid_images),
        "metrics_avg": metrics_avg,
        "metrics_std": metrics_std,
        "yolo_native": yolo_native,
        "pixel_totals": {
            "tp": total_tp, "tn": total_tn, "fp": total_fp, "fn": total_fn
        },
    }
    with open(REPORT_DIR / "metrics.json", "w") as f:
        json.dump(output, f, indent=2)
    print(f"  Salvato: {REPORT_DIR / 'metrics.json'}")

    # ── Report markdown ───────────────────────────────────────────────────────
    save_report(metrics_avg, metrics_std, len(valid_images), yolo_native, grid_results)

    print(f"\n=== Report salvato in: {REPORT_DIR} ===")


if __name__ == "__main__":
    main()
