"""
unet_train.py
Grid search + training finale di U-Net (encoder EfficientNet-B0) per
segmentazione foresta/sfondo su immagini satellitari 256×256.

Grid:
    lr           : [1e-4, 5e-4, 1e-3]
    weight_decay : [1e-4, 1e-3]
    → 6 configurazioni × SEARCH_EPOCHS epoche
    → training finale FINAL_EPOCHS epoche con la migliore config

Output:
    runs/unet/grid_search/<config>/   ← checkpoint intermedi
    runs/unet/final/best_model.pth    ← modello finale
    unet_grid_results.json
    unet_best_params.yaml
"""

import itertools
import json
import yaml
import numpy as np
import torch
import torch.nn as nn
from pathlib import Path
from torch.utils.data import DataLoader
import segmentation_models_pytorch as smp

from unet_dataset import ForestDataset

# ── Config ────────────────────────────────────────────────────────────────────
BASE          = Path(__file__).parent
RUNS_DIR      = BASE / "runs" / "unet"
DEVICE        = torch.device("cuda" if torch.cuda.is_available() else "cpu")

ENCODER       = "efficientnet-b0"
ENCODER_WEIGHTS = "imagenet"
IMG_SIZE      = 256
BATCH_SIZE    = 32
WORKERS       = 4
SEARCH_EPOCHS = 15
FINAL_EPOCHS  = 80
PATIENCE      = 12     # early stopping nel training finale

PARAM_GRID = {
    "lr":           [1e-4, 5e-4, 1e-3],
    "weight_decay": [1e-4, 1e-3],
}


# ── Loss ──────────────────────────────────────────────────────────────────────

class CombinedLoss(nn.Module):
    """BCE + Dice — ottimale per segmentazione binaria sbilanciata."""
    def __init__(self):
        super().__init__()
        self.bce  = smp.losses.SoftBCEWithLogitsLoss()
        self.dice = smp.losses.DiceLoss(mode="binary")

    def forward(self, pred, target):
        return 0.5 * self.bce(pred, target) + 0.5 * self.dice(pred, target)


# ── Metrics ───────────────────────────────────────────────────────────────────

def batch_iou(preds: torch.Tensor, targets: torch.Tensor, threshold: float = 0.5) -> float:
    preds_bin = (torch.sigmoid(preds) > threshold).float()
    inter = (preds_bin * targets).sum(dim=(1, 2, 3))
    union = ((preds_bin + targets) > 0).float().sum(dim=(1, 2, 3))
    iou   = (inter / (union + 1e-8)).mean().item()
    return iou


# ── Model factory ─────────────────────────────────────────────────────────────

def build_model() -> nn.Module:
    return smp.Unet(
        encoder_name=ENCODER,
        encoder_weights=ENCODER_WEIGHTS,
        in_channels=3,
        classes=1,
        activation=None,        # logits — usiamo BCEWithLogits
    ).to(DEVICE)


# ── Training loop (una configurazione) ───────────────────────────────────────

def train_config(
    config: dict,
    train_loader: DataLoader,
    val_loader:   DataLoader,
    epochs: int,
    save_dir: Path | None = None,
) -> tuple[float, nn.Module]:
    """
    Addestra il modello con la config data.
    Restituisce (best_val_iou, best_model_state).
    """
    model     = build_model()
    optimizer = torch.optim.AdamW(model.parameters(),
                                  lr=config["lr"],
                                  weight_decay=config["weight_decay"])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    criterion = CombinedLoss()
    scaler    = torch.amp.GradScaler("cuda")

    best_iou   = 0.0
    best_state = None

    for epoch in range(1, epochs + 1):
        # ── Train ─────────────────────────────────────────────────────────────
        model.train()
        train_loss = 0.0
        for images, masks in train_loader:
            images, masks = images.to(DEVICE), masks.to(DEVICE)
            optimizer.zero_grad()
            with torch.amp.autocast("cuda"):
                preds = model(images)
                loss  = criterion(preds, masks)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            train_loss += loss.item()

        scheduler.step()

        # ── Val ───────────────────────────────────────────────────────────────
        model.eval()
        val_iou = 0.0
        with torch.no_grad():
            for images, masks in val_loader:
                images, masks = images.to(DEVICE), masks.to(DEVICE)
                with torch.amp.autocast("cuda"):
                    preds = model(images)
                val_iou += batch_iou(preds, masks)
        val_iou /= len(val_loader)

        if val_iou > best_iou:
            best_iou   = val_iou
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        if epoch % 5 == 0 or epoch == epochs:
            print(f"    Epoch {epoch:3d}/{epochs}  "
                  f"loss={train_loss/len(train_loader):.4f}  val_iou={val_iou:.4f}  "
                  f"best={best_iou:.4f}")

    if save_dir and best_state:
        save_dir.mkdir(parents=True, exist_ok=True)
        torch.save(best_state, save_dir / "best.pth")

    return best_iou, best_state


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"=== U-Net Forest Segmentation Training ===")
    print(f"  Device  : {DEVICE}")
    print(f"  Encoder : {ENCODER} (pretrained={ENCODER_WEIGHTS})")
    print(f"  Batch   : {BATCH_SIZE}  |  Search epochs: {SEARCH_EPOCHS}  |  Final epochs: {FINAL_EPOCHS}\n")

    # DataLoader
    train_ds = ForestDataset("train")
    val_ds   = ForestDataset("val")
    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,
                              num_workers=WORKERS, pin_memory=True)
    val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False,
                              num_workers=WORKERS, pin_memory=True)
    print(f"  Train: {len(train_ds)}  |  Val: {len(val_ds)}\n")

    # ── Grid search ───────────────────────────────────────────────────────────
    keys   = list(PARAM_GRID.keys())
    combos = [dict(zip(keys, v)) for v in itertools.product(*PARAM_GRID.values())]
    print(f"  Grid search: {len(combos)} configurazioni × {SEARCH_EPOCHS} epoche\n")

    grid_results = []
    for i, cfg in enumerate(combos):
        print(f"── Config {i+1}/{len(combos)}: {cfg}")
        save_dir = RUNS_DIR / "grid_search" / f"cfg_{i+1}"
        best_iou, _ = train_config(cfg, train_loader, val_loader,
                                   SEARCH_EPOCHS, save_dir)
        grid_results.append({"config": cfg, "val_iou": best_iou})
        print(f"   → best val IoU: {best_iou:.4f}\n")

    grid_results.sort(key=lambda x: x["val_iou"], reverse=True)

    print("=== Risultati Grid Search ===")
    for r in grid_results:
        marker = " ◀ migliore" if r == grid_results[0] else ""
        print(f"  lr={r['config']['lr']:.0e}  wd={r['config']['weight_decay']:.0e}"
              f"  →  IoU={r['val_iou']:.4f}{marker}")

    best_cfg = grid_results[0]["config"]
    print(f"\n  Configurazione scelta: {best_cfg}")

    with open(BASE / "unet_grid_results.json", "w") as f:
        json.dump(grid_results, f, indent=2)
    with open(BASE / "unet_best_params.yaml", "w") as f:
        yaml.dump(best_cfg, f)
    print("  Salvati: unet_grid_results.json, unet_best_params.yaml")

    # ── Training finale ───────────────────────────────────────────────────────
    print(f"\n=== Training finale ({FINAL_EPOCHS} epoche, early stopping patience={PATIENCE}) ===")

    model     = build_model()
    optimizer = torch.optim.AdamW(model.parameters(),
                                  lr=best_cfg["lr"],
                                  weight_decay=best_cfg["weight_decay"])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=FINAL_EPOCHS)
    criterion = CombinedLoss()
    scaler    = torch.amp.GradScaler("cuda")

    final_dir  = RUNS_DIR / "final"
    final_dir.mkdir(parents=True, exist_ok=True)

    best_iou    = 0.0
    no_improve  = 0
    history     = []

    for epoch in range(1, FINAL_EPOCHS + 1):
        # Train
        model.train()
        train_loss = 0.0
        for images, masks in train_loader:
            images, masks = images.to(DEVICE), masks.to(DEVICE)
            optimizer.zero_grad()
            with torch.amp.autocast("cuda"):
                preds = model(images)
                loss  = criterion(preds, masks)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            train_loss += loss.item()
        train_loss /= len(train_loader)
        scheduler.step()

        # Val
        model.eval()
        val_iou = 0.0
        with torch.no_grad():
            for images, masks in val_loader:
                images, masks = images.to(DEVICE), masks.to(DEVICE)
                with torch.amp.autocast("cuda"):
                    preds = model(images)
                val_iou += batch_iou(preds, masks)
        val_iou /= len(val_loader)

        history.append({"epoch": epoch, "train_loss": train_loss, "val_iou": val_iou})

        improved = val_iou > best_iou
        if improved:
            best_iou   = val_iou
            no_improve = 0
            torch.save(model.state_dict(), final_dir / "best_model.pth")
        else:
            no_improve += 1

        marker = " ✓ saved" if improved else ""
        print(f"  Epoch {epoch:3d}/{FINAL_EPOCHS}  "
              f"loss={train_loss:.4f}  val_iou={val_iou:.4f}  best={best_iou:.4f}{marker}")

        if no_improve >= PATIENCE:
            print(f"\n  Early stopping dopo {PATIENCE} epoche senza miglioramento.")
            break

    # Salva history
    with open(final_dir / "history.json", "w") as f:
        json.dump(history, f, indent=2)

    print(f"\n  Modello salvato: {final_dir / 'best_model.pth'}")
    print(f"  Miglior val IoU: {best_iou:.4f}")
    print("=== Training completato ===")


if __name__ == "__main__":
    main()
