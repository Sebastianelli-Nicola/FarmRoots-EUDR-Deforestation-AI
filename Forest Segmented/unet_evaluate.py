"""
unet_evaluate.py
Valutazione completa del modello U-Net su test set.

Metriche calcolate:
    - IoU (Jaccard Index)
    - Dice coefficient (F1)
    - Pixel Accuracy
    - Precision / Recall

Output:
    unet_evaluation_report/
        metrics.json
        report.md
        iou_distribution.png
        dice_distribution.png
        confusion_matrix.png
        sample_predictions.png
"""

import json
import numpy as np
import torch
import torch.nn as nn
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from pathlib import Path
from torch.utils.data import DataLoader
import segmentation_models_pytorch as smp

from unet_dataset import ForestDataset

# ── Config ────────────────────────────────────────────────────────────────────
BASE        = Path(__file__).parent
MODEL_PATH  = BASE / "runs" / "unet" / "final" / "best_model.pth"
REPORT_DIR  = BASE / "unet_evaluation_report"
DEVICE      = torch.device("cuda" if torch.cuda.is_available() else "cpu")

ENCODER         = "efficientnet-b0"
ENCODER_WEIGHTS = "imagenet"
BATCH_SIZE      = 32
WORKERS         = 4
THRESHOLD       = 0.5


# ── Model ─────────────────────────────────────────────────────────────────────

def build_model() -> nn.Module:
    model = smp.Unet(
        encoder_name=ENCODER,
        encoder_weights=None,
        in_channels=3,
        classes=1,
        activation=None,
    )
    state = torch.load(MODEL_PATH, map_location=DEVICE)
    model.load_state_dict(state)
    model.to(DEVICE)
    model.eval()
    return model


# ── Per-batch metrics ─────────────────────────────────────────────────────────

def compute_batch_metrics(preds_bin: torch.Tensor, targets: torch.Tensor):
    """
    preds_bin, targets : (B, 1, H, W) float
    Returns lists of per-image iou, dice, pixel_acc, precision, recall.
    """
    ious, dices, accs, precs, recs = [], [], [], [], []
    for p, t in zip(preds_bin, targets):
        tp = (p * t).sum().item()
        fp = (p * (1 - t)).sum().item()
        fn = ((1 - p) * t).sum().item()
        tn = ((1 - p) * (1 - t)).sum().item()
        total = tp + fp + fn + tn

        iou  = tp / (tp + fp + fn + 1e-8)
        dice = 2 * tp / (2 * tp + fp + fn + 1e-8)
        acc  = (tp + tn) / (total + 1e-8)
        prec = tp / (tp + fp + 1e-8)
        rec  = tp / (tp + fn + 1e-8)

        ious.append(iou)
        dices.append(dice)
        accs.append(acc)
        precs.append(prec)
        recs.append(rec)
    return ious, dices, accs, precs, recs


# ── Plots ─────────────────────────────────────────────────────────────────────

def plot_distribution(values: list, metric_name: str, save_path: Path):
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.hist(values, bins=40, color="steelblue", edgecolor="white", alpha=0.85)
    mean_v = np.mean(values)
    ax.axvline(mean_v, color="crimson", linestyle="--", linewidth=1.5,
               label=f"Media={mean_v:.4f}")
    ax.set_xlabel(metric_name)
    ax.set_ylabel("Numero di immagini")
    ax.set_title(f"Distribuzione {metric_name} — Test Set")
    ax.legend()
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()


def plot_confusion_matrix(tp_total, fp_total, fn_total, tn_total, save_path: Path):
    matrix = np.array([[tn_total, fp_total],
                        [fn_total, tp_total]], dtype=np.float64)
    total  = matrix.sum()
    norm   = matrix / total * 100

    fig, ax = plt.subplots(figsize=(5, 4))
    im = ax.imshow(norm, cmap="Blues", vmin=0, vmax=100)
    plt.colorbar(im, ax=ax, label="%")

    labels = [["TN", "FP"], ["FN", "TP"]]
    for i in range(2):
        for j in range(2):
            ax.text(j, i, f"{labels[i][j]}\n{norm[i,j]:.1f}%",
                    ha="center", va="center", fontsize=12,
                    color="white" if norm[i, j] > 60 else "black")

    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(["Pred. Sfondo", "Pred. Foresta"])
    ax.set_yticklabels(["Vero Sfondo", "Vera Foresta"])
    ax.set_title("Confusion Matrix (pixel-level)")
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()


def plot_samples(model: nn.Module, dataset: ForestDataset, save_path: Path, n: int = 6):
    """Visualizza n campioni con immagine / maschera GT / predizione."""
    indices = np.linspace(0, len(dataset) - 1, n, dtype=int)
    fig, axes = plt.subplots(n, 3, figsize=(9, n * 3))
    fig.suptitle("Campioni Test — Immagine | GT | Predizione", fontsize=11)

    MEAN = np.array([0.485, 0.456, 0.406])
    STD  = np.array([0.229, 0.224, 0.225])

    for row, idx in enumerate(indices):
        img_tensor, mask_tensor = dataset[idx]

        # Inverti normalizzazione per visualizzare
        img_np = img_tensor.permute(1, 2, 0).numpy()
        img_np = (img_np * STD + MEAN).clip(0, 1)

        gt = mask_tensor.squeeze().numpy()

        with torch.no_grad():
            inp   = img_tensor.unsqueeze(0).to(DEVICE)
            logit = model(inp)
            pred  = (torch.sigmoid(logit) > THRESHOLD).float().squeeze().cpu().numpy()

        axes[row, 0].imshow(img_np)
        axes[row, 0].set_title("Immagine" if row == 0 else "")
        axes[row, 0].axis("off")

        axes[row, 1].imshow(gt, cmap="Greens", vmin=0, vmax=1)
        axes[row, 1].set_title("Ground Truth" if row == 0 else "")
        axes[row, 1].axis("off")

        axes[row, 2].imshow(pred, cmap="Greens", vmin=0, vmax=1)
        axes[row, 2].set_title("Predizione" if row == 0 else "")
        axes[row, 2].axis("off")

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()


# ── Report ────────────────────────────────────────────────────────────────────

def write_report(metrics: dict, save_path: Path):
    md = f"""# U-Net Evaluation Report — Forest Segmentation

## Dataset
- **Split**: test
- **Campioni**: {metrics['n_samples']}
- **Device**: {metrics['device']}
- **Modello**: U-Net + EfficientNet-B0 encoder (ImageNet pretrained)

## Metriche (media sul test set)

| Metrica         | Valore |
|-----------------|--------|
| IoU (Jaccard)   | {metrics['mean_iou']:.4f} |
| Dice (F1)       | {metrics['mean_dice']:.4f} |
| Pixel Accuracy  | {metrics['mean_pixel_acc']:.4f} |
| Precision       | {metrics['mean_precision']:.4f} |
| Recall          | {metrics['mean_recall']:.4f} |

## Confusion Matrix (pixel-level)

| | Pred. Sfondo | Pred. Foresta |
|---|---|---|
| **Vero Sfondo** | TN={metrics['tn_pct']:.1f}% | FP={metrics['fp_pct']:.1f}% |
| **Vera Foresta** | FN={metrics['fn_pct']:.1f}% | TP={metrics['tp_pct']:.1f}% |

## Interpretazione

- **IoU={metrics['mean_iou']:.4f}**: {"Ottima" if metrics['mean_iou']>0.75 else "Buona" if metrics['mean_iou']>0.60 else "Discreta" if metrics['mean_iou']>0.45 else "Da migliorare"} sovrapposizione tra predizione e ground truth.
- **Dice={metrics['mean_dice']:.4f}**: Media armonica precision/recall a livello pixel.
- **Pixel Acc={metrics['mean_pixel_acc']:.4f}**: Percentuale di pixel classificati correttamente.

## File generati
- `iou_distribution.png` — istogramma IoU per immagine
- `dice_distribution.png` — istogramma Dice per immagine
- `confusion_matrix.png` — confusion matrix normalizzata pixel-level
- `sample_predictions.png` — campioni visuali (immagine / GT / pred)
- `metrics.json` — tutte le metriche in formato JSON
"""
    save_path.write_text(md)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== U-Net Evaluation ===")
    print(f"  Model  : {MODEL_PATH}")
    print(f"  Device : {DEVICE}\n")

    if not MODEL_PATH.exists():
        print(f"  ERRORE: modello non trovato in {MODEL_PATH}")
        print("  Esegui prima: venv/bin/python unet_train.py")
        return

    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    model   = build_model()
    test_ds = ForestDataset("test")
    test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False,
                             num_workers=WORKERS, pin_memory=True)
    print(f"  Test set: {len(test_ds)} immagini\n")

    all_ious, all_dices, all_accs, all_precs, all_recs = [], [], [], [], []
    tp_total = fp_total = fn_total = tn_total = 0.0

    with torch.no_grad():
        for images, masks in test_loader:
            images, masks = images.to(DEVICE), masks.to(DEVICE)
            with torch.amp.autocast("cuda"):
                logits = model(images)
            preds_bin = (torch.sigmoid(logits) > THRESHOLD).float()

            # Per-image metrics
            ious, dices, accs, precs, recs = compute_batch_metrics(preds_bin, masks)
            all_ious.extend(ious)
            all_dices.extend(dices)
            all_accs.extend(accs)
            all_precs.extend(precs)
            all_recs.extend(recs)

            # Global pixel counts
            tp_total += (preds_bin * masks).sum().item()
            fp_total += (preds_bin * (1 - masks)).sum().item()
            fn_total += ((1 - preds_bin) * masks).sum().item()
            tn_total += ((1 - preds_bin) * (1 - masks)).sum().item()

    total_px = tp_total + fp_total + fn_total + tn_total
    metrics = {
        "n_samples":       len(test_ds),
        "device":          str(DEVICE),
        "mean_iou":        float(np.mean(all_ious)),
        "std_iou":         float(np.std(all_ious)),
        "mean_dice":       float(np.mean(all_dices)),
        "std_dice":        float(np.std(all_dices)),
        "mean_pixel_acc":  float(np.mean(all_accs)),
        "mean_precision":  float(np.mean(all_precs)),
        "mean_recall":     float(np.mean(all_recs)),
        "tp_pct":          tp_total / total_px * 100,
        "fp_pct":          fp_total / total_px * 100,
        "fn_pct":          fn_total / total_px * 100,
        "tn_pct":          tn_total / total_px * 100,
    }

    print("── Risultati ────────────────────────────────")
    print(f"  IoU           : {metrics['mean_iou']:.4f}  ±{metrics['std_iou']:.4f}")
    print(f"  Dice          : {metrics['mean_dice']:.4f}  ±{metrics['std_dice']:.4f}")
    print(f"  Pixel Accuracy: {metrics['mean_pixel_acc']:.4f}")
    print(f"  Precision     : {metrics['mean_precision']:.4f}")
    print(f"  Recall        : {metrics['mean_recall']:.4f}")
    print(f"  TP={metrics['tp_pct']:.1f}%  FP={metrics['fp_pct']:.1f}%  "
          f"FN={metrics['fn_pct']:.1f}%  TN={metrics['tn_pct']:.1f}%")
    print("─────────────────────────────────────────────\n")

    # Plots
    print("  Generazione grafici...")
    plot_distribution(all_ious,   "IoU",   REPORT_DIR / "iou_distribution.png")
    plot_distribution(all_dices,  "Dice",  REPORT_DIR / "dice_distribution.png")
    plot_confusion_matrix(tp_total, fp_total, fn_total, tn_total,
                          REPORT_DIR / "confusion_matrix.png")
    plot_samples(model, test_ds, REPORT_DIR / "sample_predictions.png", n=6)

    # JSON + MD
    with open(REPORT_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    write_report(metrics, REPORT_DIR / "report.md")

    print(f"  Report salvato in: {REPORT_DIR}/")
    print("=== Valutazione completata ===")


if __name__ == "__main__":
    main()
