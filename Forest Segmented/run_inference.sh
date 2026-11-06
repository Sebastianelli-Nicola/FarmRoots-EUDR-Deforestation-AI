#!/usr/bin/env bash
# run_inference.sh — confronto forest change detection
#
# Uso:
#   bash run_inference.sh <baseline> <after> [unet|yolo]
#
# Esempi:
#   bash run_inference.sh foresta_2022.jpg foresta_2024.png
#   bash run_inference.sh foresta_2022     foresta_2024          # senza estensione
#   bash run_inference.sh foresta_2022     foresta_2024    yolo  # forza YOLO
#
# Le immagini vengono cercate in:
#   baseline → Foto_per_test/<baseline>.(jpg|png)
#   after    → Foto_per_test/after/<after>.(jpg|png)
#
# Il risultato viene salvato in:
#   Foto_per_test/output/<baseline_stem>_vs_<after_stem>.png

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PYTHON="$SCRIPT_DIR/venv/bin/python"

# ── Controllo argomenti ───────────────────────────────────────────────────────
if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
    echo "Uso: bash run_inference.sh <baseline> <after> [unet|yolo]"
    echo ""
    echo "  <baseline>  nome immagine in Foto_per_test/         (jpg o png)"
    echo "  <after>     nome immagine in Foto_per_test/after/   (jpg o png)"
    echo "  [unet|yolo] modello da usare  (default: auto — U-Net se disponibile)"
    exit 1
fi

BEFORE="$1"
AFTER="$2"
MODEL_PREF="${3:-}"

# ── Controllo venv ────────────────────────────────────────────────────────────
if [ ! -f "$VENV_PYTHON" ]; then
    echo "Errore: venv non trovato in $SCRIPT_DIR/venv"
    echo "Crea il venv con: python3 -m venv venv && venv/bin/pip install -r requirements.txt"
    exit 1
fi

# ── Esecuzione ────────────────────────────────────────────────────────────────
echo "=== Forest Change Detection ==="
echo "  Baseline : $BEFORE"
echo "  After    : $AFTER"
[ -n "$MODEL_PREF" ] && echo "  Modello  : $MODEL_PREF"
echo ""

cd "$SCRIPT_DIR"
"$VENV_PYTHON" - <<EOF
from inference import run_from_folder
model_pref = "$MODEL_PREF" if "$MODEL_PREF" else None
run_from_folder("$BEFORE", "$AFTER", model_pref)
EOF
