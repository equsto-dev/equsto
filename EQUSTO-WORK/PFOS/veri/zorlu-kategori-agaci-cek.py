# -*- coding: utf-8 -*-
"""Geriye uyumluluk → ornek-isletme-listesi-cek.py zorlu"""
import subprocess
import sys
from pathlib import Path

args = [sys.executable, str(Path(__file__).parent / "ornek-isletme-listesi-cek.py"), "zorlu", *sys.argv[1:]]
raise SystemExit(subprocess.call(args))
