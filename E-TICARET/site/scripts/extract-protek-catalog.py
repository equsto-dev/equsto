#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PRO-TEK Hijyen katalog PDF → ürün JSON + ürün görselleri.

Kaynak: scripts/data/protek/PROTEK-KATALOG.pdf (görüntü tabanlı; OCR + manuel doğrulama)

  python3 scripts/extract-protek-catalog.py
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import fitz  # pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "scripts/data/protek/PROTEK-KATALOG.pdf"
OUT_JSON = ROOT / "scripts/data/protek/protek-catalog.json"
OUT_IMG = ROOT / "public/data/protek/images"
PAGE_CACHE = Path("/tmp/protek-pages-hires")

BRAND = "PRO-TEK Hijyen"
WEBSITE = "https://www.protekhijyen.com.tr"


def P(
    code: str,
    name_tr: str,
    name_en: str,
    page: int,
    category: str,
    dims: str = "",
    features: list[str] | None = None,
    slot: tuple[int, int, int, int] | None = None,
    **extra,
) -> dict:
    """slot = (col, row, cols, rows) for image crop on page; None = full product band."""
    return {
        "code": code.replace(" ", "").upper(),
        "model": code.replace(" ", "").upper().replace("PH", "PH "),
        "name_tr": name_tr.strip(),
        "name_en": name_en.strip(),
        "page": page,
        "category": category,
        "dims_mm": dims.strip(),
        "features": features or [],
        "slot": list(slot) if slot else None,
        **extra,
    }


# (col, row, cols, rows) — 0-indexed grid over usable page content (below header, above footer)
PRODUCTS: list[dict] = [
    # --- s.4 Turnikeli el dezenfeksiyon ---
    P("PH5101", "Duvara Monte Çift Çanak Hazneli Turnikeli El Dezenfeksiyon Sistemi",
      "Wall Mount Two Hand Disinfection System with Turnstile", 4,
      "turnikeli-el-dezenfeksiyon", "850x500x740",
      ["Fotocell algılamalı çift çanak", "Dezenfeksiyon sonrası turnike açılır", "Yalnızca sıvı alkol bazlı dezenfektan", "CE"],
      (0, 0, 3, 1)),
    P("PH5102", "Ayaklı Hijyenik Paspaslı Tutunma Barlı Turnikeli El Dezenfeksiyon Sistemi",
      "Two Hand Disinfection System with Turnstile (Handrail and Hygienic Mat)", 4,
      "turnikeli-el-dezenfeksiyon", "1100x700x1500",
      ["Ayaklı kombine set", "Hijyenik paspas", "Tutunma barı", "CE"],
      (1, 0, 3, 1)),
    P("PH5103", "Ayaklı Hijyenik Paspaslı Turnikeli El Dezenfeksiyon Sistemi",
      "Two Hand Disinfection System with Turnstile and Hygienic Mat", 4,
      "turnikeli-el-dezenfeksiyon", "900x420x1400",
      ["Kompakt ayaklı gövde", "Hijyenik paspas", "CE"],
      (2, 0, 3, 1)),
    # --- s.5 Turnikeler ---
    P("PH5151", "Yarım Boy 4 Kollu Tekli Turnike",
      "Half-Height 4 Arms Single Turnstile", 5,
      "hijyen-turnikeleri", "1320x1500 (geçiş yüksekliği 1187)",
      ["Zemin bağlantı", "Kablo giriş-çıkış"],
      (0, 0, 2, 2)),
    P("PH5150", "Yarım Boy 4 Kollu Çiftli Turnike",
      "Half-Height 4 Arms Double Turnstile", 5,
      "hijyen-turnikeleri", "2030x1500",
      ["Çift geçiş", "Zemin bağlantı", "Kablo giriş-çıkış"],
      (1, 0, 2, 2)),
    P("PH5105", "Mekanik Üç Kollu Çıkış Turnikesi",
      "Mechanical 3 Armed Exit Turnstile", 5,
      "hijyen-turnikeleri", "700x450x950",
      ["Paslanmaz çelik tripod"],
      (0, 1, 2, 2)),
    P("PH5106", "Mekanik Yaprak Turnike",
      "Mechanical Sheet Turnstile", 5,
      "hijyen-turnikeleri", "1010x1010",
      ["Paslanmaz yaprak kapı"],
      (1, 1, 2, 2)),
    # --- s.6–9 Sanitasyon üniteleri ---
    P("PH5401", "Dizden Kumandalı Evyeli Sanitasyon Hattı",
      "Knee Operated Sink Sanitation Unit", 6,
      "sanitasyon-uniteleri", "1100x2000x1800",
      ["Dizden kumandalı evye (10-15 sn)", "Çift çanaklı turnikeli el dezenfeksiyon", "Kağıt havlu dolabı", "Hijyenik paspas", "304 inox", "Basamaklar dahil ölçü", "CE"],
      (0, 0, 1, 2)),
    P("PH5418", "Taban Fırçalı Sanitasyon Hattı",
      "Sanitation Unit With Horizontal Boot Brushing System", 6,
      "sanitasyon-uniteleri", "1100x2000x1800",
      ["Yatay taban fırçalama (turnike altı)", "Dizden kumandalı veya fotoselli evye", "Polietilen turnikeli el dezenfeksiyon", "304 inox", "Basamaklar dahil"],
      (0, 1, 1, 2)),
    P("PH5421", "Taban Fırçalamalı Turnikeli El Dezenfeksiyon Sistemi",
      "Horizontal Boot Brushing And Turnstile Hand Disinfection System", 7,
      "sanitasyon-uniteleri", "1100x1600x1800",
      ["Yatay fırçalı taban fırçalama", "Opsiyonel dozaj pompası", "Polietilen turnikeli el dezenfeksiyon", "304 inox", "Basamaklar dahil"],
      (0, 0, 1, 2)),
    P("PH5411", "Taban Fırçalamalı Nem Alıcı Paspaslı Turnikeli El Dezenfeksiyon Sistemi",
      "Horizontal Boot Brushing And Turnstile Hand Disinfection System with Mat", 7,
      "sanitasyon-uniteleri", "1100x2000x1800",
      ["Yatay fırçalı taban fırçalama", "Nem alıcı paspas", "Polietilen turnikeli el dezenfeksiyon", "304 inox"],
      (0, 1, 1, 2)),
    P("PH5409", "Yatay-Dikey Fırçalı Çizme Fırçalamalı Sanitasyon Hattı",
      "Sanitation Unit With Horizontal-Vertical Boot Brushing", 8,
      "sanitasyon-uniteleri", "1100x2800x1800",
      ["Yatay ve dikey çizme fırçalama", "Dizden kumandalı veya fotoselli evye", "Polietilen turnikeli el dezenfeksiyon", "304 inox", "Basamaklar dahil"],
      (0, 0, 1, 2)),
    P("PH5416", "Yatay-Dikey Fırçalamalı Turnikeli El Dezenfeksiyon Sistemi",
      "Horizontal-Vertical Boot Brushing Turnstile Hand Disinfection System", 8,
      "sanitasyon-uniteleri", "1100x2000x1800",
      ["Yatay ve dikey fırça", "Polietilen turnikeli el dezenfeksiyon", "304 inox"],
      (0, 1, 1, 2)),
    P("PH5404", "İkili Fotoselli Evyeli Sanitasyon Hattı",
      "Sanitation Unit With Double Photocell Sink", 9,
      "sanitasyon-uniteleri", "1250x2800x1800",
      ["İkili fotoselli evye", "Fotoselli krom sabunluk", "Kağıt havlu dolabı 400 kapasite", "Çift çanaklı turnikeli el dezenfeksiyon", "Hijyenik paspas", "Basamaklar dahil", "CE"],
      (0, 0, 1, 2)),
    P("PH5405", "Özel Proje Sanitasyon Hattı (Yatay-Dikey Fırçalı)",
      "Special Project Sanitation Unit", 9,
      "sanitasyon-uniteleri", "",
      ["Yatay-dikey fırçalı çizme fırçalama", "Dizden kumandalı veya fotoselli evye", "Köşeli sistem", "Özel proje"],
      (0, 1, 1, 2)),
    # --- s.10 Çizme fırçalama / kurutma ---
    P("PH5203", "Yatay Fırçalı Taban Fırçalama ve Dezenfeksiyon Ünitesi",
      "Horizontal Sole Scrubbing Brush and Disinfection Unit", 10,
      "cizme-fircalama", "1100x1500x1100",
      ["304 kalite paslanmaz çelik", "Fotoselli otomatik fırça ve su püskürtme", "Atık su tahliyesi", "Ø32 tutunma barı", "Giriş/çıkış basamak", "Basamaklar dahil", "CE"],
      (0, 0, 2, 2)),
    P("PH5201", "Yatay Dikey Fırçalı Çizme Fırçalama ve Dezenfeksiyon Ünitesi",
      "Horizontal and Vertical Boot Scrubbing Brush and Disinfection Unit", 10,
      "cizme-fircalama", "1100x1500x1100",
      ["Yatay + dikey fırça", "8-10 sn otomatik çevrim", "304 paslanmaz", "Basamaklar dahil", "CE"],
      (1, 0, 2, 2)),
    P("PH5205", "30’lu Çizme Kurutma",
      "Boot Drying Unit 30", 10,
      "cizme-kurutma", "650x750x1900",
      ["30 çizme kapasitesi", "304 inox"],
      (0, 1, 2, 2)),
    P("PH5206", "30’lu Fanlı Çizme Kurutma",
      "Boot Drying Unit with Fan 30", 10,
      "cizme-kurutma", "650x750x1900",
      ["30 çizme kapasitesi", "Fanlı kurutma", "220-230V", "304 inox"],
      (1, 1, 2, 2)),
    # --- s.15–16 Evye sistemleri ---
    P("PH5301", "Dekoratif El Yıkama Evyesi",
      "Decorative Sink", 15, "el-yikama-evyeleri", "430x480x500", ["CE"], (0, 0, 2, 3)),
    P("PH5303", "Dizden Kumandalı El Yıkama Evyesi (Duvara Monte)",
      "Wall Mounted Knee Operated Sink", 15, "el-yikama-evyeleri", "430x468x935",
      ["Dizden kumanda", "Opsiyonel mix aparatı", "CE"], (1, 0, 2, 3)),
    P("PH5306", "Üretim İçi Pedallı El Yıkama Evyesi",
      "Pedal Operated Sink", 15, "el-yikama-evyeleri", "420x500x1170", ["Pedallı"], (0, 1, 2, 3)),
    P("PH5342", "Fotoselli Dik Çıkma Musluklu Evye",
      "Automatic Sink", 15, "el-yikama-evyeleri", "500x500x650", ["Fotoselli", "CE"], (1, 1, 2, 3)),
    P("PH5326", "Ayaklı Kombine Evye",
      "Single Station Combined Sink", 15, "el-yikama-evyeleri", "600x600x1450", ["Ayaklı kombine"], (0, 2, 2, 3)),
    P("PH5330", "Seyyar El Yıkama Evyesi",
      "Mobile Sink", 15, "el-yikama-evyeleri", "450x660x940",
      ["Su tesisatı ve gider olmayan yerler için"], (1, 2, 2, 3)),
    P("PH5317", "Üçlü Pedallı El Yıkama Evyesi",
      "Trio Pedal Operated Sink", 16, "el-yikama-evyeleri", "550x1800x1300", ["3 istasyon", "Pedallı", "CE"], (0, 0, 2, 3)),
    P("PH5315", "İkili Fotoselli El Yıkama Evyesi",
      "Dual Automatic Sink", 16, "el-yikama-evyeleri", "540x1300x1300", ["İkili fotoselli", "CE"], (1, 0, 2, 3)),
    P("PH5328", "Dörtlü Pedallı El Yıkama Evyesi",
      "Four Station Pedal Operated Sink", 16, "el-yikama-evyeleri", "540x2300x1300", ["4 istasyon", "Pedallı"], (0, 1, 2, 3)),
    P("PH5340", "Zaman Ayarlı Fotoselli ve Elektrikli Dizden Kumandalı Evye",
      "Automatic Timer Photocell and Electric Knee Operated Sink", 16, "el-yikama-evyeleri", "600x1100x1200",
      ["Zaman ayarlı", "Fotoselli", "Elektrikli dizden kumanda", "CE"], (1, 1, 2, 3)),
    P("PH5325", "Biberon Yıkama Evyesi",
      "Bottle Washing Sink", 16, "el-yikama-evyeleri", "540x1420x1218", ["Biberon kurutma rafı", "CE"], (0, 2, 2, 3)),
    P("PH5322", "Aparat Yıkama Evyesi",
      "Equipment Washing Sink", 16, "el-yikama-evyeleri", "730x1420x1095", ["Çift hazne", "Ön yıkama sprey", "CE"], (1, 2, 2, 3)),
    # --- s.17 Musluk / aparat ---
    P("PH4914", "Dik Çıkma Batarya", "Wall Mount Lavatory Tap", 17, "musluk-aparatlari", "", [], (0, 0, 4, 3)),
    P("PH4908", "Fotoselli Çift Su Girişli Batarya", "Sensor Tap (Hot and Cold Water)", 17, "musluk-aparatlari", "", [], (1, 0, 4, 3)),
    P("PH4907", "Kuğu Boyun", "Swan Neck Faucet", 17, "musluk-aparatlari", "", [], (2, 0, 4, 3)),
    P("PH4906", "Fotoselli Tek Su Girişli Batarya", "Sensor Tap (Just Cold Water)", 17, "musluk-aparatlari", "", [], (3, 0, 4, 3)),
    P("PH4910", "Çift Su Girişli Pedal", "Double Water Inlet Pedal", 17, "musluk-aparatlari", "", [], (0, 1, 4, 3)),
    P("PH4903", "Çift Su Girişli Tek Pedal", "Double Water Inlet Single Out Pedal", 17, "musluk-aparatlari", "", [], (1, 1, 4, 3)),
    P("PH4904", "Tek Su Girişli Pedal", "Single Water Inlet Pedal", 17, "musluk-aparatlari", "", [], (2, 1, 4, 3)),
    P("PH4901", "Bas Aparatı", "Time Delay Urinal Flusher", 17, "musluk-aparatlari", "", [], (0, 2, 4, 3)),
    P("PH4902", "Mix Aparatı", "Mixed Device", 17, "musluk-aparatlari", "", [], (1, 2, 4, 3)),
    # --- s.19 Sabunluklar ---
    P("PH4301", "Köpük Dispenser (Mat ve Saten Çelik)", "Foam Soap Dispenser (Mat and Sateen)", 19, "sivi-sabunluklar", "130x130x210", [], (0, 0, 3, 2)),
    P("PH4302", "Sıvı Sabunluk (Mat ve Saten Çelik)", "Soap Dispenser (Mat and Sateen)", 19, "sivi-sabunluklar", "130x130x210", [], (1, 0, 3, 2)),
    P("PH4316", "Fotoselli Sıvı Sabunluk ve Dezenfektan Püskürtücü (5 Lt Gizli Bidonlu)", "Automatic Soap and Disinfectant Dispenser with 5Lt Canister", 19, "sivi-sabunluklar", "130x130x210", ["Paslanmaz çelik", "5 lt gizli bidon"], (2, 0, 3, 2)),
    P("PH4303", "Fotoselli Dezenfektan Püskürtücü", "Automatic Disinfectant Dispenser", 19, "sivi-sabunluklar", "100x100x230", ["Paslanmaz çelik"], (0, 1, 3, 2)),
    P("PH4304", "Dirsek Darbeli Sıvı Sabunluk ve Dezenfektan Verici", "Elbow Push Soap and Disinfectant Dispenser", 19, "sivi-sabunluklar", "215x82x290", [], (1, 1, 3, 2)),
    P("PH4314", "Ankastre Sıvı Sabunluk", "Built In Soap Dispenser", 19, "sivi-sabunluklar", "120x120x290", [], (2, 1, 3, 2)),
    # --- s.20 El kurutma / kağıt havlu ---
    P("PH4501", "Fotoselli El Kurutma Cihazı (Saten Krom)", "Automatic Hand Dryer Satin Chrome", 20, "el-kurutma", "270x290x330", ["Güç 2400W", "2 yıl garanti"], (1, 0, 3, 2)),
    P("PH4502", "Fotoselli El Kurutma Cihazı (Beyaz Epoksi)", "Automatic Hand Dryer White Epoxy", 20, "el-kurutma", "270x290x330", ["Güç 2400W", "2 yıl garanti"], (2, 0, 3, 2)),
    P("PH4503", "Fotoselli El Kurutma Cihazı (Mat Krom)", "Automatic Hand Dryer Mat Chrome", 20, "el-kurutma", "270x290x330", ["Güç 2400W", "2 yıl garanti"], (0, 0, 3, 2)),
    P("PH4403", "Z Katlı Kağıt Havlu Dolabı 400 Kapasiteli", "Z Fold Paper Towel Cabinet 400", 20, "kagit-havlu", "100x270x330", ["Kilitli", "304 18/10 Cr-Ni"], (1, 1, 4, 2)),
    P("PH4404", "Z Katlı Kağıt Havlu Dolabı 200 Kapasiteli", "Z Fold Paper Towel Cabinet 200", 20, "kagit-havlu", "100x270x210", ["Kilitli", "304 18/10 Cr-Ni"], (0, 1, 4, 2)),
    P("PH4401", "Z Katlı Kağıt Havlu Dolap Sistemi Kombi Set 400", "Paper Towel Cabinet Combined Set 400", 20, "kagit-havlu", "", ["400 kağıt kapasiteli"], (2, 1, 4, 2)),
    P("PH4402", "Z Katlı Kağıt Havlu Dolap Sistemi Kombi Set", "Paper Towel Cabinet Combined Set", 20, "kagit-havlu", "", [], (3, 1, 4, 2)),
    P("PH4405", "Kağıt Havlu Dolabı", "Paper Towel Cabinet", 20, "kagit-havlu", "", [], None),
    P("PH4406", "Kağıt Havlu Dolabı", "Paper Towel Cabinet", 20, "kagit-havlu", "", [], None),
    # --- s.21 Hızlı el kurutma ---
    P("PH4509", "Hızlı El Kurutma Sistemi (Dyson Airblade)",
      "Fast Hand Drying System (Dyson Airblade)", 21, "el-kurutma", "",
      ["HEPA filtre", "Yaklaşık 12 sn kurutma", "Antibakteriyel katkı", "Atık su haznesi yok"],
      (0, 0, 1, 1)),
    # --- s.22 Koruyucu malzeme dolapları ---
    P("PH4101", "Tekli/İkili/Üçlü Ekipman Dolabı", "Single Dual Trio Equipment Cabinet", 22, "koruyucu-dolaplar", "220x500x800", [], (0, 0, 4, 2)),
    P("PH4102", "Ekipman Dolabı", "Equipment Cabinet", 22, "koruyucu-dolaplar", "220x500x400", [], (1, 0, 4, 2)),
    P("PH4105", "Ekipman Dolabı", "Equipment Cabinet", 22, "koruyucu-dolaplar", "220x340x400", [], (2, 0, 4, 2)),
    P("PH4107", "Galos Bone Maske Tek Kullanımlık Ziyaretçi Önlük Dolabı",
      "Visitors Apron Cabinet for Galosh Bonnet and Mask", 22, "koruyucu-dolaplar", "220x170x400", [], (3, 0, 4, 2)),
    P("PH4109", "Tek Kullanımlık Ziyaretçi Önlük Dolabı (S)", "Single Visitors Apron Cabinet", 22, "koruyucu-dolaplar", "170x250x500", [], (0, 1, 4, 2)),
    P("PH4110", "Tek Kullanımlık Ziyaretçi Önlük Dolabı (D)", "Dual Visitors Apron Cabinet", 22, "koruyucu-dolaplar", "170x500x500", [], (1, 1, 4, 2)),
    P("PH4111", "Tekerlekli İkili Ziyaretçi Önlük Dolabı Kombine Set",
      "Combined Dual Apron Visitors Cabinet with Wheels", 22, "koruyucu-dolaplar", "220x500x1400",
      ["Galos-bone-maske dolabı", "Çöp kovalı"], (2, 1, 4, 2)),
    P("PH4112", "Tekli Eldivenlik", "Single Glove Dispenser", 22, "koruyucu-dolaplar", "70x130x210", [], (0, 1, 4, 2)),
    P("PH4113", "İkili Eldivenlik", "Dual Glove Dispenser", 22, "koruyucu-dolaplar", "70x260x210", [], (1, 1, 4, 2)),
    P("PH4114", "Üçlü Eldivenlik", "Trio Glove Dispenser", 22, "koruyucu-dolaplar", "70x400x210", [], (2, 1, 4, 2)),
    # --- s.23 Soyunma / sterilizasyon ---
    P("PH4215", "10’lu Soyunma Dolabı", "10 Door Staff Locker", 23, "personel-dolaplari", "400x1750x2100", [], (0, 0, 2, 2)),
    P("PH4207", "3’lü Soyunma Dolabı", "Triple Staff Locker", 23, "personel-dolaplari", "400x1050x2100", [], (1, 0, 2, 2)),
    P("PH4205", "Önlük Sterilizasyon Dolabı", "Apron Sterilization Cabinet", 23, "sterilizasyon", "1800x700x500",
      ["Zaman ayarlı", "UVC ampul", "İstenilen adette üretim"], (0, 1, 2, 2)),
    # --- s.24 Bıçak dezenfeksiyon ---
    P("PH4201", "UVC Bıçak Sterilizasyon Cihazı 10’lu", "UV Knife Sterilizer 10", 24, "bicak-dezenfeksiyon", "152x605x600",
      ["10 bıçak", "Zaman ayarlı", "UVC", "Mıknatıslı", "220-230V 50Hz", "Yalnızca dezenfeksiyon amaçlı"], (0, 0, 2, 2)),
    P("PH4202", "UVC Bıçak Sterilizasyon Cihazı 20’li", "UV Knife Sterilizer 20", 24, "bicak-dezenfeksiyon", "152x725x825",
      ["20 bıçak", "Satır/döner bıçak uygun", "UVC", "220-230V 50Hz"], (1, 0, 2, 2)),
    P("PH4203", "Rezistanslı Bıçak Sterilizasyon Cihazı", "Resistance Knife Sterilizer", 24, "bicak-dezenfeksiyon", "126x490x474",
      ["10 bıçak", "Su ısısı ile dezenfeksiyon", "Çıkarılabilir sepet", "220-230V 50Hz"], (0, 1, 2, 2)),
    # --- s.25 Vücut / araç dezenfeksiyon ---
    P("PH5501", "Vücut Dezenfeksiyon Ünitesi", "Body Disinfection Unit", 25, "vucut-dezenfeksiyon", "1130x900x2042",
      ["Fotoselli dezenfektan püskürtme", "Komple vücut dezenfeksiyonu", "Özel proje mümkün"], (0, 0, 2, 1)),
    P("PH5601", "Araç Dezenfeksiyon Sistemi", "Vehicle Disinfection System", 25, "arac-dezenfeksiyon", "2000x4000x5000", [], (1, 0, 2, 1)),
    # --- s.28 Sinek öldürücü ---
    P("PH7201", "FLY-TECH 2x40W 120cm Uzun Sinek Öldürücü", "FLY-TECH 2x40W 120cm Fly Killer", 28, "sinek-oldurucu", "320x1260x180",
      ["304 inox", "2x40W 120cm Sylvania BL", "Etki alanı 120-150 m²", "Tavan askılı", "220V", "Yedek yapışkan plaka"], (0, 0, 2, 2)),
    P("PH7202", "FLY-TECH 2x40W 60cm Kısa Sinek Öldürücü", "FLY-TECH 2x40W 60cm Fly Killer", 28, "sinek-oldurucu", "320x630x180",
      ["304 inox", "Etki alanı 60-80 m²", "Tavan askılı", "220V"], (1, 0, 2, 2)),
    P("PH7203", "FLY-TECH 1x40W Aplik Model Sinek Öldürücü", "FLY-TECH 1x40W Wall Mount Fly Killer", 28, "sinek-oldurucu", "",
      ["Duvara monte", "Etki alanı 40-50 m²", "Şarküteri/pastane/restoran uygun"], (0, 1, 2, 2)),
    P("PH7204", "FLY-TECH Sinek Öldürücü", "FLY-TECH Fly Killer", 28, "sinek-oldurucu", "", ["304 inox"], (1, 1, 2, 2)),
    # --- s.29 Acil emniyet duşları ---
    P("PH6101", "Göz Duşu El Kumandalı Masa Tipi (Paslanmaz/Boyalı)",
      "Manual Eye Wash Bench Type", 29, "acil-emniyet-duslari", "810x320x220 (koli)",
      ["El kumandalı", "Paslanmaz boru", "Çanak paslanmaz veya ABS", "Su girişi 1/2\"", "Min 11,5 lt/dk"], (0, 0, 2, 2)),
    P("PH6103", "Göz Duşu El Kumandalı Yere Monte (Paslanmaz/Boyalı)",
      "Manual Eye Wash Floor Mount", 29, "acil-emniyet-duslari", "320x320x220 (koli)",
      ["Yere monte", "Paslanmaz boru", "Min 11,5 lt/dk"], (1, 0, 2, 2)),
    P("PH6105", "Göz & Vücut Duşu El Kumandalı Yere Monte",
      "Manual Eye and Body Shower Floor Mount", 29, "acil-emniyet-duslari", "",
      ["Göz + vücut duşu", "Yere monte ayak tabla"], (0, 1, 2, 2)),
    P("PH6107", "Göz & Vücut Duşu El Kumandalı Duvara Monte",
      "Manual Eye and Body Shower Wall Mount", 29, "acil-emniyet-duslari", "",
      ["Göz + vücut duşu", "Duvara monte"], (1, 1, 2, 2)),
    # --- s.30 Çöp kovaları ---
    P("PH4801", "Endüstriyel Pedallı Çöp Kovası 50 LT", "Industrial Pedal Trash Bin 50L", 30, "endustriyel-cop-kovasi", "400x500", ["50 LT", "Paslanmaz"], (1, 1, 2, 3)),
    P("PH4802", "Endüstriyel Pedallı Çöp Kovası 40 LT", "Industrial Pedal Trash Bin 40L", 30, "endustriyel-cop-kovasi", "400x400", ["40 LT", "Paslanmaz"], (0, 1, 2, 3)),
    P("PH4803", "Endüstriyel Pedallı Çöp Kovası 70 LT", "Industrial Pedal Trash Bin 70L", 30, "endustriyel-cop-kovasi", "400x630", ["70 LT", "Paslanmaz"], (1, 0, 2, 3)),
    P("PH4804", "Endüstriyel Pedallı Çöp Kovası 90 LT", "Industrial Pedal Trash Bin 90L", 30, "endustriyel-cop-kovasi", "400x730", ["90 LT", "Paslanmaz"], (0, 0, 2, 3)),
    P("PH4805", "Sallanır Kapaklı Çöp Kovası 11 LT", "Rocking Lid Trash Bin 11L", 30, "endustriyel-cop-kovasi", "380x190x170", ["11 LT"], (0, 2, 4, 3)),
    P("PH4806", "Sallanır Kapaklı Çöp Kovası 16 LT", "Rocking Lid Trash Bin 16L", 30, "endustriyel-cop-kovasi", "440x220x220", ["16 LT"], (1, 2, 4, 3)),
    P("PH4807", "Sallanır Kapaklı Çöp Kovası 36 LT", "Rocking Lid Trash Bin 36L", 30, "endustriyel-cop-kovasi", "580x290x290", ["36 LT"], (2, 2, 4, 3)),
    P("PH4808", "Sallanır Kapaklı Çöp Kovası 54 LT", "Rocking Lid Trash Bin 54L", 30, "endustriyel-cop-kovasi", "790x290x290", ["54 LT"], (3, 2, 4, 3)),
    # --- s.32–33 Hijyenik paspas ---
    P("PH3201", "Kendinden Hazneli Hijyenik Paspas 40x60",
      "Hygienic Self Contained Mat 40x60", 32, "hijyenik-paspaslar", "400x600x30",
      ["3 katmanlı yapı", "Bondflex-D orta katman", "Dezenfektan haznesi"], (0, 0, 2, 1)),
    P("PH3202", "Kendinden Hazneli Hijyenik Paspas 60x85",
      "Hygienic Self Contained Mat 60x85", 32, "hijyenik-paspaslar", "600x850x30",
      ["3 katmanlı yapı", "Dezenfektan haznesi"], (1, 0, 2, 1)),
    P("PH3302", "Hijyenik Paspas", "Hygienic Mat", 32, "hijyenik-paspaslar", "", [], None),
    P("PH3400", "Yapışkanlı Antibakteriyel Hijyenik Paspas 45x115",
      "Hygienic Antibacterial Sticky Mat 45x115", 33, "hijyenik-paspaslar", "450x1150x20",
      ["30 numaralı yaprak/ped", "10 ped/koli", "Kullan-at", "FDA gıda teması uygun bileşenler"], (0, 0, 1, 1)),
    # --- s.34 Özel imalat ---
    P("PH5361", "Önlük ve Çizme Yıkama Platformu",
      "Apron and Boots Washing Platform", 34, "ozel-imalat", "750x1000x2000",
      ["Önlük ve çizme için ayrı fırçalar", "304 inox"], (0, 0, 1, 1)),
]

CATEGORY_LABELS = {
    "turnikeli-el-dezenfeksiyon": "Turnikeli El Dezenfeksiyon Sistemleri",
    "hijyen-turnikeleri": "Hijyen Turnikeleri",
    "sanitasyon-uniteleri": "Sanitasyon Üniteleri",
    "cizme-fircalama": "Çizme Fırçalama Üniteleri",
    "cizme-kurutma": "Çizme Kurutma Üniteleri",
    "el-yikama-evyeleri": "El Yıkama Evyeleri",
    "musluk-aparatlari": "Musluk Aparatları",
    "sivi-sabunluklar": "Sıvı Sabunluklar",
    "el-kurutma": "El Kurutma Sistemleri",
    "kagit-havlu": "Kağıt Havlu Dolap Sistemleri",
    "koruyucu-dolaplar": "Koruyucu Malzeme Dolapları",
    "personel-dolaplari": "Personel Soyunma Dolapları",
    "sterilizasyon": "Sterilizasyon Dolapları",
    "bicak-dezenfeksiyon": "Bıçak Dezenfeksiyon Sistemleri",
    "vucut-dezenfeksiyon": "Vücut Dezenfeksiyon Üniteleri",
    "arac-dezenfeksiyon": "Araç Dezenfeksiyon Sistemleri",
    "sinek-oldurucu": "Sinek Öldürücü Üniteler",
    "acil-emniyet-duslari": "Acil Emniyet Duşları",
    "endustriyel-cop-kovasi": "Endüstriyel Çöp Kovaları",
    "hijyenik-paspaslar": "Hijyenik Paspaslar",
    "ozel-imalat": "Özel İmalatlar",
}

# Sayfa başına mutlak kırpım (x0,y0,x1,y1) — 0..1 normalize, asimetrik layoutlar için
ABS_CROPS: dict[str, tuple[float, float, float, float]] = {
    # s.4 — solda metin / sağda büyük foto (PH5101), altta PH5102/5103
    "PH5101": (0.42, 0.06, 0.97, 0.42),
    "PH5102": (0.04, 0.48, 0.48, 0.78),
    "PH5103": (0.52, 0.48, 0.96, 0.78),
    # s.16 — 2 sütun × 3 satır
    "PH5317": (0.04, 0.08, 0.49, 0.34),
    "PH5315": (0.51, 0.08, 0.96, 0.34),
    "PH5328": (0.04, 0.36, 0.49, 0.58),
    "PH5340": (0.51, 0.36, 0.96, 0.58),
    "PH5325": (0.04, 0.60, 0.49, 0.82),
    "PH5322": (0.51, 0.60, 0.96, 0.82),
    # s.15 — 2×3
    "PH5301": (0.04, 0.08, 0.49, 0.34),
    "PH5303": (0.51, 0.08, 0.96, 0.34),
    "PH5306": (0.04, 0.36, 0.49, 0.58),
    "PH5342": (0.51, 0.36, 0.96, 0.58),
    "PH5326": (0.04, 0.60, 0.49, 0.82),
    "PH5330": (0.51, 0.60, 0.96, 0.82),
    # s.10
    "PH5203": (0.04, 0.08, 0.49, 0.42),
    "PH5201": (0.51, 0.08, 0.96, 0.42),
    "PH5205": (0.04, 0.55, 0.49, 0.82),
    "PH5206": (0.51, 0.55, 0.96, 0.82),
    # s.6
    "PH5401": (0.35, 0.08, 0.96, 0.42),
    "PH5418": (0.35, 0.48, 0.96, 0.82),
}



def load_abs_crops() -> dict[str, tuple[float, float, float, float]]:
    crops_path = ROOT / "scripts/data/protek/photo-crops.json"
    out = dict(ABS_CROPS)
    if crops_path.is_file():
        raw = json.loads(crops_path.read_text(encoding="utf-8"))
        for k, v in raw.items():
            if isinstance(v, (list, tuple)) and len(v) == 4:
                out[str(k).upper()] = (float(v[0]), float(v[1]), float(v[2]), float(v[3]))
    return out

def render_pages(doc: fitz.Document) -> None:
    PAGE_CACHE.mkdir(parents=True, exist_ok=True)
    for i in range(doc.page_count):
        out = PAGE_CACHE / f"page-{i+1:02d}.png"
        if out.exists() and out.stat().st_size > 50_000:
            continue
        pix = doc[i].get_pixmap(matrix=fitz.Matrix(2.5, 2.5), alpha=False)
        pix.save(str(out))


def crop_slot(page_img: Image.Image, slot: list[int] | None, abs_crop: tuple[float, float, float, float] | None = None) -> Image.Image:
    """Crop product photo region from catalog page (üst foto, alt metin)."""
    w, h = page_img.size
    if abs_crop:
        x0, y0, x1, y1 = abs_crop
        return page_img.crop((int(w * x0), int(h * y0), int(w * x1), int(h * y1)))
    # usable content band (skip header ~8%, footer ~8%)
    top, bottom = int(h * 0.09), int(h * 0.90)
    left, right = int(w * 0.04), int(w * 0.96)
    band = page_img.crop((left, top, right, bottom))
    bw, bh = band.size
    if not slot:
        return band.crop((0, 0, bw, int(bh * 0.48)))
    col, row, cols, rows = slot
    cw, ch = bw / cols, bh / rows
    x0 = int(col * cw + cw * 0.03)
    y0 = int(row * ch + ch * 0.02)
    x1 = int((col + 1) * cw - cw * 0.03)
    # Foto kartın üstünde; tek satırlı sayfalarda metin bandın altına düşer
    photo_frac = 0.42 if rows == 1 else 0.55
    y1 = int(row * ch + ch * photo_frac)
    if y1 <= y0 + 40:
        y1 = int(row * ch + ch * 0.5)
    return band.crop((x0, y0, x1, y1))


def slug_code(code: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", code.lower()).strip("-")


def main() -> None:
    if not PDF.is_file():
        raise SystemExit(f"PDF yok: {PDF}")
    doc = fitz.open(PDF)
    render_pages(doc)
    doc.close()

    OUT_IMG.mkdir(parents=True, exist_ok=True)
    products_out = []
    seen = set()

    for p in PRODUCTS:
        code = p["code"]
        if code in seen:
            continue
        seen.add(code)
        page_path = PAGE_CACHE / f"page-{p['page']:02d}.png"
        if not page_path.exists():
            # fallback /tmp cache from earlier OCR run
            alt = Path(f"/tmp/protek-pages/page-{p['page']:02d}.png")
            page_path = alt if alt.exists() else page_path
        img_rel = f"data/protek/images/{slug_code(code)}.jpg"
        img_abs = ROOT / "public" / img_rel
        if page_path.exists():
            page_img = Image.open(page_path).convert("RGB")
            crop = crop_slot(page_img, p.get("slot"), load_abs_crops().get(code))
            # min size pad
            if crop.size[0] < 80 or crop.size[1] < 80:
                crop = page_img
            crop.save(img_abs, "JPEG", quality=88, optimize=True)
        else:
            img_rel = ""

        cat_label = CATEGORY_LABELS.get(p["category"], p["category"])
        features = p.get("features") or []
        specs_lines = [
            p["name_tr"],
            p["name_en"],
            "",
            f"Ürün kodu: {code}",
            f"Marka: {BRAND}",
            f"Kategori: {cat_label}",
        ]
        if p.get("dims_mm"):
            specs_lines.append(f"Ölçü (mm): {p['dims_mm']}")
        if features:
            specs_lines.append("")
            specs_lines.append("Özellikler")
            for f in features:
                specs_lines.append(f"• {f}")
        specs_lines += [
            "",
            f"Kaynak: PRO-TEK Hijyen Katalog (sayfa {p['page']})",
            f"Üretici: {WEBSITE}",
            "Fiyat: daha sonra eklenecek",
        ]

        products_out.append(
            {
                "code": code,
                "model": code,
                "name": p["name_tr"],
                "name_en": p["name_en"],
                "brand": BRAND,
                "oem_brand": "PRO-TEK",
                "dept": "yikama",
                "category": p["category"],
                "category_label": cat_label,
                "page": p["page"],
                "dims_mm": p.get("dims_mm") or "",
                "features": features,
                "specs": "\n".join(specs_lines),
                "image": img_rel,
                "website": WEBSITE,
            }
        )

    catalog = {
        "liste": "PRO-TEK Hijyen Katalog",
        "source": str(PDF.relative_to(ROOT)),
        "brand": BRAND,
        "website": WEBSITE,
        "productCount": len(products_out),
        "categories": CATEGORY_LABELS,
        "products": products_out,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Yazıldı: {OUT_JSON} ({len(products_out)} ürün)")
    print(f"Görseller: {OUT_IMG} ({len(list(OUT_IMG.glob('*.jpg')))} jpg)")


if __name__ == "__main__":
    main()
