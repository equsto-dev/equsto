#!/usr/bin/env python3
"""Add English fields to Besos landing and catalogue JSON."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LANDING = ROOT / "public" / "data" / "vitrum-bars-landing.json"
CATALOGUE = ROOT / "public" / "data" / "vitrum-bars-catalogue.json"

BLURBS_EN = {
    "the-manhattan": (
        "Our bestselling two-person station was designed with the input of professional bartenders. "
        "It is the cornerstone of our line-up, providing an instant system from which to run a busy bar service."
    ),
    "the-boulverdier": (
        "A two-person station designed specifically for crafting artisanal cocktails. "
        "Born from a client who needed to produce large volumes of cocktails within a limited space, "
        "it has fast become a client favourite."
    ),
    "the-clover": (
        "For mixologists who craft intricate creations from myriad ingredients and garnishes, "
        "this station has been created to work with you. Its streamlined style and ample storage options "
        "are designed to stimulate creativity."
    ),
}

DESCRIPTIONS_EN = {
    "BES-P23": "Our bestselling two-person station with integrated freezer drawers, extended drip tray, sink and glass storage.",
    "BES-P24": "Two-person station designed for artisan cocktails, with an extended drip tray section and twin sinks.",
    "BES-P25": "Signature bar module with extended bottle speed rail, easy-access garnish trays and a large insulated ice well.",
    "PL/BM.F.3.1-18": "Bar module with integrated freezer drawers, sink and practical glass storage.",
    "PL/BM.F.4.2-22": "Dishwashing module with integrated glass storage and under-counter dishwasher for fast, efficient cleaning.",
    "PL/BM.F.4.3-22": "Bar module with integrated freezer drawers, sink, glass storage and extended bottle speed rail.",
    "PL/BM.F.1-08": "Bar module with integrated freezer drawer and quick-access bottle speed rail.",
    "PL/BM.F.2-12": "Bar module fitted with integrated freezer drawers and quick-access bottle speed rail.",
    "PL/BM.F.3-1-12": "Bar station with integrated chilled drawers and quick-access bottle speed rail.",
    "PL/BM.F.3-2-12": "Dishwashing module with integrated glass storage and under-counter dishwasher.",
    "PL/BM.F.3-3-12": "Bar station with integrated chilled drawers and extended speed rail.",
    "PL/BM.F.4-16": "Bar station with integrated freezer drawers and extended speed rail.",
    "SL/BM-10": "Bar module with insulated ice well and two neutral storage drawers.",
    "SL/BM-10.S": "Bar module with insulated ice well, multiple neutral drawers and a functional sink.",
    "SL/SM-04": "Sink module with dedicated section for organic waste disposal.",
    "BL/BM-14": "Bar module with insulated ice well, bottle speed rail and sink for smooth service.",
    "BL/BM-16": "Extended bar module with two insulated ice wells, bottle speed rail and sink.",
    "ML/BM.3-19": "Event bar station with quick assembly and fast setup and breakdown.",
    "ML/BM.7-31": "Bar station with integrated freezer drawers and extended speed rail.",
    "PL/CM.C.1-12": "Coffee module with under-counter chilled bay and additional storage drawers.",
    "PL/CM.N-12": "Coffee module with integrated neutral storage cabinet.",
    "PL/SM.N.3-15": "Sink module with extended glass storage, twin drip trays and pre-mix compartments.",
    "PL/SM.S.N.3-09": "Sink module with integrated glass storage.",
    "PL/SM.N.2-09": "Sink module with glass storage, integrated drip tray and pre-mix compartment.",
    "PL/SM.N.1-08": "Sink module with neutral storage sections for practical layout and use.",
    "PL/SM-04": "Sink module with dedicated section for organic waste.",
    "PL/WM.1-12": "Dishwashing module with integrated glass storage and under-counter dishwasher.",
    "PL/IM.N-08": "Modular bar unit with integrated ice machine and additional storage bay.",
    "PL/NM-3D.S": "Modular bar unit with neutral drawers for multi-purpose storage.",
    "PL/NM-3D.T": "Cash desk module with generous storage space.",
    "PL/NM-N-1": "Bar unit with integrated glass storage and adjustable drawer height.",
    "PL/NM.ND-2": "Bar unit with integrated glass storage and drip tray to contain spills.",
    "PL/AM-1": "Corner module with functional drip tray for bespoke bar configurations.",
    "PL/AM-2": "Corner module with flush drip tray for bespoke bar configurations.",
    "PL/AM-3": "Corner module with drip tray and integrated beer tap mechanism.",
    "AG-232": "Professional mixer tap with ceramic cartridge and polished chrome lever.",
    "AG-305BF": "Mixer tap with ceramic cartridge, chrome lever and swivel spout; chrome-plated brass body.",
    "AG-305KBF": "Mixer tap with robust ceramic cartridge, polished chrome lever and swivel spout.",
    "AG-MF2": "Mixer tap with ceramic cartridge; AISI-304 stainless steel body.",
    "AG-03": "Mixer tap with ceramic cartridge, polished chrome lever and spring-return swivel spout.",
    "AG-D30M": "Tap set with stainless braided hose, swivel spout, chrome lever and spring return.",
    "AG-8025E": "Sensor tap with chrome-plated brass body; detection range up to 10 cm.",
}


def update_landing() -> None:
    landing = json.loads(LANDING.read_text(encoding="utf-8"))
    for item in landing.get("signatureTrio", []):
        item["blurbEn"] = BLURBS_EN.get(item["slug"], item.get("blurbEn", ""))
    if "serveYou" in landing:
        landing["serveYou"]["ctaCatalogEn"] = "Browse bar product catalogue"
        landing["serveYou"]["ctaInfoEn"] = "I'd like more information"
    LANDING.write_text(json.dumps(landing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_catalogue() -> None:
    data = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    updated = 0
    for product in data.get("products", []):
        code = product.get("code", "")
        if code in DESCRIPTIONS_EN:
            product["descriptionEn"] = DESCRIPTIONS_EN[code]
            updated += 1
    CATALOGUE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {updated} product descriptions")


if __name__ == "__main__":
    update_landing()
    update_catalogue()
    print("Besos EN JSON updated")
