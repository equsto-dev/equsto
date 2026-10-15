import fitz
import os
import re
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = r'C:\D Disk\FİYAT LİSTELERİ\Remta Katalog 2026.pdf'
IMG_DIR = ROOT / 'public' / 'images' / 'catalog' / 'remta'
IMG_DIR.mkdir(parents=True, exist_ok=True)

doc = fitz.open(PDF_PATH)

print(f"Extracting images from {PDF_PATH} to {IMG_DIR}...")

# Check images per page
page_images = {}
extracted_count = 0

for pno in range(len(doc)):
    page = doc[pno]
    info = page.get_image_info(xrefs=True)
    if not info:
        continue
        
    pr = page.rect
    valid_imgs = []
    
    for im in info:
        xref = im['xref']
        w, h = im['width'], im['height']
        bbox = im['bbox']
        bw = bbox[2] - bbox[0]
        bh = bbox[3] - bbox[1]
        
        # Skip small icons/logos or full page backgrounds
        if w < 100 or h < 100:
            continue
        if bw * bh > pr.width * pr.height * 0.7:
            continue
            
        valid_imgs.append(im)
        
    page_images[pno + 1] = valid_imgs

print(f"Total pages with product images: {len(page_images)}")

# Save each image
saved_images_by_page = {}

for pno, imgs in page_images.items():
    page = doc[pno - 1]
    saved_images_by_page[pno] = []
    
    for idx, im in enumerate(imgs):
        xref = im['xref']
        bbox = im['bbox']
        
        # Try extracting xref pixmap or render bbox
        dest = IMG_DIR / f"p{pno:02d}_{idx+1}.jpg"
        
        try:
            pix = fitz.Pixmap(doc, xref)
            if pix.alpha or pix.n > 3:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            pix.save(str(dest), jpg_quality=92)
            
            # Check if valid image
            if dest.stat().st_size > 1000:
                rel_path = f"images/catalog/remta/p{pno:02d}_{idx+1}.jpg"
                saved_images_by_page[pno].append({
                    'rel_path': rel_path,
                    'bbox': bbox,
                    'width': im['width'],
                    'height': im['height']
                })
                extracted_count += 1
            else:
                dest.unlink(missing_ok=True)
        except Exception as e:
            # Fallback to rendering page bbox
            try:
                clip = fitz.Rect(bbox) & page.rect
                if clip.width > 30 and clip.height > 30:
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip, alpha=False)
                    pix.save(str(dest), jpg_quality=90)
                    if dest.stat().st_size > 1000:
                        rel_path = f"images/catalog/remta/p{pno:02d}_{idx+1}.jpg"
                        saved_images_by_page[pno].append({
                            'rel_path': rel_path,
                            'bbox': bbox,
                            'width': clip.width * 2,
                            'height': clip.height * 2
                        })
                        extracted_count += 1
            except:
                pass

print(f"Successfully extracted {extracted_count} product images into {IMG_DIR}!")
