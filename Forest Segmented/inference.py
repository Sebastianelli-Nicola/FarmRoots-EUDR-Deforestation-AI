"""
inference.py
Confronta due immagini satellitari e rileva cambiamenti nella copertura forestale.

Il modello usato viene scelto automaticamente:
    1. U-Net  (runs/unet/final/best_model.pth)   — priorità
    2. YOLO   (runs/final/forest_seg/weights/best.pt) — fallback

Uso:
    python inference.py --before path/img1.jpg --after path/img2.jpg
    python inference.py --before path/img1.jpg --after path/img2.jpg --output result.png
    python inference.py --before path/img1.jpg --after path/img2.jpg --model yolo

Output:
    - Visualizzazione affiancata (6 pannelli)
    - Statistiche di cambiamento (% deforestazione / riforestazione)
    - Salvataggio opzionale del risultato
"""

import argparse
import cv2
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
BASE            = Path(__file__).parent
UNET_MODEL_PATH = BASE / "runs" / "unet"  / "final" / "best_model.pth"
YOLO_MODEL_PATH = BASE / "runs" / "final" / "forest_seg" / "weights" / "best.pt"
IMG_SIZE        = 256
YOLO_CONF       = 0.10
UNET_THRESHOLD  = 0.5

# Colori overlay (RGB per matplotlib)
COLOR_DEFOREST  = (220,  50,  50)
COLOR_REFOREST  = ( 50, 200,  80)
COLOR_STABLE_F  = ( 34, 139,  34)
COLOR_STABLE_BG = (200, 200, 200)


# ── Model loading ─────────────────────────────────────────────────────────────

def _load_unet():
    import torch
    import torch.nn as nn
    import segmentation_models_pytorch as smp

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model  = smp.Unet(
        encoder_name="efficientnet-b0",
        encoder_weights=None,
        in_channels=3,
        classes=1,
        activation=None,
    )
    state = torch.load(UNET_MODEL_PATH, map_location=device)
    model.load_state_dict(state)
    model.to(device)
    model.eval()
    return model, device


def _load_yolo():
    from ultralytics import YOLO
    return YOLO(str(YOLO_MODEL_PATH))


def resolve_model(preference: str | None = None):
    """
    Restituisce (model, model_type) dove model_type è 'unet' o 'yolo'.
    preference: 'unet' | 'yolo' | None (auto)
    """
    if preference == "yolo":
        print(f"  Modello: YOLO  ({YOLO_MODEL_PATH})")
        return _load_yolo(), "yolo"

    if preference == "unet" or preference is None:
        if UNET_MODEL_PATH.exists():
            print(f"  Modello: U-Net ({UNET_MODEL_PATH})")
            return _load_unet(), "unet"
        elif preference == "unet":
            raise FileNotFoundError(
                f"Modello U-Net non trovato: {UNET_MODEL_PATH}\n"
                "Esegui prima: venv/bin/python unet_train.py"
            )

    # Fallback YOLO
    if YOLO_MODEL_PATH.exists():
        print(f"  Modello: YOLO  ({YOLO_MODEL_PATH})  [fallback]")
        return _load_yolo(), "yolo"

    raise FileNotFoundError(
        "Nessun modello trovato.\n"
        f"  U-Net: {UNET_MODEL_PATH}\n"
        f"  YOLO:  {YOLO_MODEL_PATH}"
    )


# ── Inference ─────────────────────────────────────────────────────────────────

def predict_mask_unet(model, img_path: str | Path, device) -> np.ndarray:
    """Inferenza U-Net → maschera binaria 2D (uint8 0/1)."""
    import torch
    import albumentations as A
    from albumentations.pytorch import ToTensorV2

    MEAN = (0.485, 0.456, 0.406)
    STD  = (0.229, 0.224, 0.225)
    transform = A.Compose([A.Normalize(mean=MEAN, std=STD), ToTensorV2()])

    img = cv2.cvtColor(cv2.imread(str(img_path)), cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    tensor = transform(image=img)["image"].unsqueeze(0).to(device)

    with torch.no_grad():
        logit = model(tensor)
        pred  = (torch.sigmoid(logit) > UNET_THRESHOLD).float()

    return pred.squeeze().cpu().numpy().astype(np.uint8)


def predict_mask_yolo(model, img_path: str | Path) -> np.ndarray:
    """Inferenza YOLO → maschera binaria 2D (uint8 0/1)."""
    results = model.predict(str(img_path), conf=YOLO_CONF,
                            imgsz=IMG_SIZE, verbose=False)
    mask = np.zeros((IMG_SIZE, IMG_SIZE), dtype=np.uint8)
    if results[0].masks is not None:
        for m in results[0].masks.data:
            m_np = m.cpu().numpy()
            m_r  = cv2.resize(m_np, (IMG_SIZE, IMG_SIZE))
            mask = np.maximum(mask, (m_r > 0.5).astype(np.uint8))
    return mask


def predict_mask(model, img_path: str | Path, model_type: str,
                 device=None) -> np.ndarray:
    if model_type == "unet":
        return predict_mask_unet(model, img_path, device)
    return predict_mask_yolo(model, img_path)


# ── Analysis ──────────────────────────────────────────────────────────────────

def change_map(mask_before: np.ndarray, mask_after: np.ndarray) -> np.ndarray:
    rgb = np.zeros((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8)
    rgb[(mask_before == 0) & (mask_after == 0)] = COLOR_STABLE_BG
    rgb[(mask_before == 1) & (mask_after == 1)] = COLOR_STABLE_F
    rgb[(mask_before == 1) & (mask_after == 0)] = COLOR_DEFOREST
    rgb[(mask_before == 0) & (mask_after == 1)] = COLOR_REFOREST
    return rgb


def overlay(img: np.ndarray, mask: np.ndarray, color: tuple,
            alpha: float = 0.45) -> np.ndarray:
    out = img.copy()
    out[mask == 1] = (
        np.array(color) * alpha + img[mask == 1] * (1 - alpha)
    ).astype(np.uint8)
    return out


def compute_stats(mask_before: np.ndarray, mask_after: np.ndarray) -> dict:
    total         = IMG_SIZE * IMG_SIZE
    forest_before = int(mask_before.sum())
    forest_after  = int(mask_after.sum())
    deforested    = int(((mask_before == 1) & (mask_after == 0)).sum())
    reforested    = int(((mask_before == 0) & (mask_after == 1)).sum())
    net_change    = forest_after - forest_before
    return {
        "forest_before_px":  forest_before,
        "forest_after_px":   forest_after,
        "forest_before_pct": forest_before / total * 100,
        "forest_after_pct":  forest_after  / total * 100,
        "deforested_px":     deforested,
        "deforested_pct":    deforested / total * 100,
        "reforested_px":     reforested,
        "reforested_pct":    reforested / total * 100,
        "net_change_px":     net_change,
        "net_change_pct":    net_change / total * 100,
    }


# ── Visualization ─────────────────────────────────────────────────────────────

def save_individual_images(
    img_before:  np.ndarray,
    img_after:   np.ndarray,
    mask_before: np.ndarray,
    mask_after:  np.ndarray,
    base_path:   Path,
):
    """
    Salva le singole immagini accanto al composito:
        <stem>_T1_overlay.png   — immagine prima con foresta evidenziata
        <stem>_T2_overlay.png   — immagine dopo con foresta evidenziata
        <stem>_change.png       — mappa cambiamento
        <stem>_T1_mask.png      — maschera binaria prima (bianco=foresta)
        <stem>_T2_mask.png      — maschera binaria dopo
    """
    stem = Path(base_path).with_suffix("")

    ov_before = overlay(img_before, mask_before, COLOR_STABLE_F)
    ov_after  = overlay(img_after,  mask_after,  COLOR_STABLE_F)
    chg       = change_map(mask_before, mask_after)

    for img_rgb, suffix in [
        (ov_before,                    "_T1_overlay.png"),
        (ov_after,                     "_T2_overlay.png"),
        (chg,                          "_change.png"),
        (mask_before * 255,            "_T1_mask.png"),
        (mask_after  * 255,            "_T2_mask.png"),
    ]:
        out_path = str(stem) + suffix
        cv2.imwrite(out_path, cv2.cvtColor(
            img_rgb.astype(np.uint8), cv2.COLOR_RGB2BGR
        ) if img_rgb.ndim == 3 else img_rgb.astype(np.uint8))
        print(f"  Salvato: {out_path}")


def visualize(
    img_before:  np.ndarray,
    img_after:   np.ndarray,
    mask_before: np.ndarray,
    mask_after:  np.ndarray,
    stats:       dict,
    model_type:  str = "unet",
    save_path:   str | Path | None = None,
):
    chg       = change_map(mask_before, mask_after)
    ov_before = overlay(img_before, mask_before, COLOR_STABLE_F)
    ov_after  = overlay(img_after,  mask_after,  COLOR_STABLE_F)

    fig, axes = plt.subplots(2, 3, figsize=(13, 9))
    fig.suptitle(
        f"Analisi cambiamento copertura forestale  [{model_type.upper()}]",
        fontsize=13, fontweight="bold"
    )

    axes[0, 0].imshow(img_before);  axes[0, 0].set_title("Immagine T1 (prima)")
    axes[0, 1].imshow(img_after);   axes[0, 1].set_title("Immagine T2 (dopo)")
    axes[0, 2].imshow(chg);         axes[0, 2].set_title("Mappa cambiamento")

    axes[1, 0].imshow(ov_before);   axes[1, 0].set_title(f"Foresta T1: {stats['forest_before_pct']:.1f}%")
    axes[1, 1].imshow(ov_after);    axes[1, 1].set_title(f"Foresta T2: {stats['forest_after_pct']:.1f}%")

    ax_stat = axes[1, 2]
    ax_stat.axis("off")
    patches = [
        mpatches.Patch(color=[c/255 for c in COLOR_STABLE_F],  label="Foresta stabile"),
        mpatches.Patch(color=[c/255 for c in COLOR_STABLE_BG], label="Sfondo stabile"),
        mpatches.Patch(color=[c/255 for c in COLOR_DEFOREST],  label="Deforestazione"),
        mpatches.Patch(color=[c/255 for c in COLOR_REFOREST],  label="Riforestazione"),
    ]
    ax_stat.legend(handles=patches, loc="upper left", fontsize=9, title="Legenda")

    net     = stats["net_change_pct"]
    net_str = f"{net:+.2f}%"

    stat_text = (
        f"Copertura forestale\n"
        f"  T1:  {stats['forest_before_pct']:.2f}%  ({stats['forest_before_px']:,} px)\n"
        f"  T2:  {stats['forest_after_pct']:.2f}%  ({stats['forest_after_px']:,} px)\n\n"
        f"Deforestazione:  {stats['deforested_pct']:.2f}%  ({stats['deforested_px']:,} px)\n"
        f"Riforestazione:  {stats['reforested_pct']:.2f}%  ({stats['reforested_px']:,} px)\n\n"
        f"Variazione netta: {net_str}"
    )
    ax_stat.text(0.05, 0.45, stat_text, transform=ax_stat.transAxes,
                 fontsize=9, verticalalignment="center", fontfamily="monospace",
                 bbox=dict(boxstyle="round,pad=0.5",
                           facecolor="#f8f8f8", edgecolor="#cccccc"))

    for ax in axes.flat:
        ax.axis("off")

    plt.tight_layout()

    out = save_path or "change_detection_result.png"
    plt.savefig(out, dpi=150, bbox_inches="tight")
    print(f"  Risultato salvato in: {out}")
    plt.close()


# ── Entry points ──────────────────────────────────────────────────────────────

def run(before_path: str, after_path: str,
        output_path: str | None = None,
        model_preference: str | None = None):

    print(f"\n  T1 (prima): {before_path}")
    print(f"  T2 (dopo):  {after_path}\n")

    model, model_type = resolve_model(model_preference)
    device = model[1] if model_type == "unet" else None
    if model_type == "unet":
        model, device = model

    # Carica immagini per visualizzazione
    img_before = cv2.cvtColor(cv2.imread(before_path), cv2.COLOR_BGR2RGB)
    img_after  = cv2.cvtColor(cv2.imread(after_path),  cv2.COLOR_BGR2RGB)
    img_before = cv2.resize(img_before, (IMG_SIZE, IMG_SIZE))
    img_after  = cv2.resize(img_after,  (IMG_SIZE, IMG_SIZE))

    print("  Inferenza T1...")
    mask_before = predict_mask(model, before_path, model_type, device)
    print("  Inferenza T2...")
    mask_after  = predict_mask(model, after_path,  model_type, device)

    stats = compute_stats(mask_before, mask_after)

    print("\n── Risultati ────────────────────────────────")
    print(f"  Foresta T1:        {stats['forest_before_pct']:.2f}%")
    print(f"  Foresta T2:        {stats['forest_after_pct']:.2f}%")
    print(f"  Deforestazione:    {stats['deforested_pct']:.2f}%  ({stats['deforested_px']} px)")
    print(f"  Riforestazione:    {stats['reforested_pct']:.2f}%  ({stats['reforested_px']} px)")
    net = stats["net_change_pct"]
    print(f"  Variazione netta:  {net:+.2f}%  "
          f"({'↓ perdita' if net < 0 else '↑ guadagno' if net > 0 else '≈ stabile'})")
    print("─────────────────────────────────────────────\n")

    visualize(img_before, img_after, mask_before, mask_after,
              stats, model_type, output_path)

    if output_path:
        save_individual_images(img_before, img_after, mask_before, mask_after,
                               Path(output_path))

    return stats, mask_before, mask_after


def find_image(folder: Path, name: str) -> Path:
    stem = Path(name).stem
    for ext in (".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"):
        candidate = folder / (stem + ext)
        if candidate.exists():
            return candidate
    raise FileNotFoundError(
        f"Immagine '{name}' non trovata in {folder} "
        f"(cercato .jpg, .jpeg, .png)"
    )


def run_from_folder(before_name: str, after_name: str,
                    model_preference: str | None = None) -> None:
    folder  = BASE / "Foto_per_test"
    out_dir = folder / "output"
    out_dir.mkdir(parents=True, exist_ok=True)

    before_path = find_image(folder,          before_name)
    after_path  = find_image(folder / "after", after_name)

    before_stem = Path(before_name).stem
    after_stem  = Path(after_name).stem
    output_path = out_dir / f"{before_stem}_vs_{after_stem}.png"

    print(f"\n  Before : {before_path}")
    print(f"  After  : {after_path}")
    print(f"  Output : {output_path}")

    run(str(before_path), str(after_path), str(output_path), model_preference)


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Forest change detection tra due immagini"
    )
    parser.add_argument("--before",  required=True, help="Percorso immagine T1 (prima)")
    parser.add_argument("--after",   required=True, help="Percorso immagine T2 (dopo)")
    parser.add_argument("--output",  default=None,  help="Percorso output PNG")
    parser.add_argument("--model",   default=None,  choices=["unet", "yolo"],
                        help="Forza il modello da usare (default: auto)")
    args = parser.parse_args()

    run(args.before, args.after, args.output, args.model)
