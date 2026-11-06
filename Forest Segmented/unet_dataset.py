"""
unet_dataset.py
PyTorch Dataset per la segmentazione foresta/sfondo.
Legge direttamente da images/ e masks/ usando lo split già creato da prepare_dataset.py.
"""

import cv2
import numpy as np
from pathlib import Path
from torch.utils.data import Dataset
import albumentations as A
from albumentations.pytorch import ToTensorV2

BASE      = Path(__file__).parent
MASKS_DIR = BASE / "masks"

# ImageNet stats — encoder pre-addestrato su ImageNet
MEAN = (0.485, 0.456, 0.406)
STD  = (0.229, 0.224, 0.225)


def get_transforms(split: str) -> A.Compose:
    if split == "train":
        return A.Compose([
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.5),
            A.RandomRotate90(p=0.5),
            A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.2,
                               rotate_limit=45, border_mode=cv2.BORDER_REFLECT, p=0.5),
            A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05, p=0.4),
            A.GaussianBlur(blur_limit=(3, 5), p=0.2),
            A.Normalize(mean=MEAN, std=STD),
            ToTensorV2(),
        ])
    else:
        return A.Compose([
            A.Normalize(mean=MEAN, std=STD),
            ToTensorV2(),
        ])


class ForestDataset(Dataset):
    """
    Carica immagini dalla cartella dataset/images/<split>/
    e le maschere corrispondenti da masks/.
    """

    def __init__(self, split: str):
        images_dir = BASE / "dataset" / "images" / split
        self.images = sorted(images_dir.glob("*.jpg"))
        self.transform = get_transforms(split)

    def __len__(self) -> int:
        return len(self.images)

    def __getitem__(self, idx: int):
        img_path  = self.images[idx]
        mask_name = img_path.name.replace("sat", "mask")
        mask_path = MASKS_DIR / mask_name

        image = cv2.cvtColor(cv2.imread(str(img_path)), cv2.COLOR_BGR2RGB)
        mask  = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)

        if mask is None:
            mask = np.zeros((image.shape[0], image.shape[1]), dtype=np.float32)
        else:
            mask = (mask > 127).astype(np.float32)

        aug   = self.transform(image=image, mask=mask)
        image = aug["image"]           # (3, H, W) float tensor
        mask  = aug["mask"].unsqueeze(0)  # (1, H, W) float tensor

        return image, mask
