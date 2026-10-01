#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Canlı yayın → anlık EN→TR sesli çeviri (F1 / gürültülü yayın uyumlu)

Amaç:
  - Yayını SUSTURMAZ. Motor / ortam sesi hoparlörde kalır.
  - Varsayılan: Türkçe SESLENDİRME aynı hoparlöre (yayınla karışık).
  - TTS çalarken loopback geçici kapatılır → geri besleme olmaz.
  - İsteğe bağlı altyazı penceresi (--no-ui ile kapat).

Kurulum:
    cd tools/canli-ceviri
    python -m venv .venv
    # Windows: .venv\\Scripts\\Activate.ps1
    pip install -r requirements.txt

Kullanım:
    python canli_ceviri.py --list
    # Önerilen: yayın + Türkçe aynı hoparlörde
    python canli_ceviri.py --in "Hoparlör"
    # Çıkışı açıkça seçmek istersen
    python canli_ceviri.py --in "Hoparlör" --out "Hoparlör"
"""
from __future__ import annotations

import argparse
import asyncio
import queue
import threading
import time
import tkinter as tk
from collections import deque
from dataclasses import dataclass

import numpy as np
import soundcard as sc
import sounddevice as sd

SR_IN = 16000
FRAME = 512  # ~32 ms
FRAME_S = FRAME / SR_IN
PREROLL = 5
TTS_SR = 24000
# TTS bittikten sonra loopback'te kalan yankı için kısa bekleme
TTS_COOLDOWN_S = 0.35

seg_q: queue.Queue = queue.Queue(maxsize=8)
tts_q: queue.Queue = queue.Queue(maxsize=8)
play_q: queue.Queue = queue.Queue(maxsize=4)
ui_q: queue.Queue = queue.Queue(maxsize=32)

# TTS hoparlördeyken yakalamayı durdur (aynı cihaz → geri besleme)
tts_gate = threading.Event()  # set = şu an TTS çalıyor / soğuma
tts_gate_until = 0.0
_tts_gate_lock = threading.Lock()


@dataclass
class UiMsg:
    en: str = ""
    tr: str = ""
    lag: float = 0.0
    status: str = ""


def list_devices() -> None:
    print("Yakalanabilecek cihazlar (--in) [loopback]:")
    for s in sc.all_speakers():
        print("  -", s.name)
    print("\nOynatma cihazları (--out) [Türkçe ses]:")
    for i, d in enumerate(sd.query_devices()):
        if d["max_output_channels"] > 0:
            print(f"  - [{i}] {d['name']}")


def find_out_device(name: str | None):
    """None → sistem varsayılan çıkışı. İsim verilirse kısmi eşleşme."""
    if not name:
        return None
    for i, d in enumerate(sd.query_devices()):
        if d["max_output_channels"] > 0 and name.lower() in d["name"].lower():
            return i
    raise SystemExit(f"Çıkış cihazı bulunamadı: {name}")


def arm_tts_gate(duration_s: float) -> None:
    """TTS süresi + cooldown boyunca yakalamayı kilitle."""
    global tts_gate_until
    until = time.time() + max(0.05, duration_s) + TTS_COOLDOWN_S
    with _tts_gate_lock:
        tts_gate_until = max(tts_gate_until, until)
        tts_gate.set()


def capture_blocked() -> bool:
    if not tts_gate.is_set():
        return False
    with _tts_gate_lock:
        if time.time() >= tts_gate_until:
            tts_gate.clear()
            return False
    return True


def ensure_translation_model() -> None:
    import argostranslate.package as pkg
    import argostranslate.translate as tr

    langs = tr.get_installed_languages()
    en = next((l for l in langs if l.code == "en"), None)
    if en and any(t.to_lang.code == "tr" for t in en.translations_from):
        return
    print("İngilizce→Türkçe Argos modeli indiriliyor (tek seferlik)...")
    pkg.update_package_index()
    p = next(
        x
        for x in pkg.get_available_packages()
        if x.from_code == "en" and x.to_code == "tr"
    )
    pkg.install_from_path(p.download())


def speech_score(frame: np.ndarray, sr: int = SR_IN) -> float:
    """Motor gürültüsü vs konuşma (300–3400 Hz)."""
    x = frame.astype(np.float32)
    if x.size < 64:
        return 0.0
    x = x - np.mean(x)
    rms = float(np.sqrt(np.mean(x * x)) + 1e-9)
    n = 1 << int(np.ceil(np.log2(x.size)))
    spec = np.fft.rfft(x * np.hanning(x.size), n=n)
    mag = np.abs(spec) ** 2
    freqs = np.fft.rfftfreq(n, d=1.0 / sr)
    speech = float(mag[(freqs >= 300) & (freqs <= 3400)].sum() + 1e-12)
    low = float(mag[(freqs >= 40) & (freqs < 250)].sum() + 1e-12)
    high = float(mag[(freqs > 4000) & (freqs < 7500)].sum() + 1e-12)
    ratio = speech / (low + high + speech)
    zc = float(np.mean(np.abs(np.diff(np.sign(x)))) * 0.5)
    zc_w = 1.0 if 0.02 < zc < 0.35 else 0.35
    return rms * ratio * zc_w * 8.0


# ---------------------------------------------------------------- UI
class OverlayUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Canlı Çeviri")
        self.root.attributes("-topmost", True)
        try:
            self.root.attributes("-alpha", 0.92)
        except tk.TclError:
            pass
        self.root.configure(bg="#111111")
        self.root.geometry("900x160+40+40")
        self.lbl_tr = tk.Label(
            self.root,
            text="Dinleniyor…",
            fg="#f5f5f5",
            bg="#111111",
            font=("Segoe UI", 22, "bold"),
            wraplength=860,
            justify="left",
            anchor="w",
        )
        self.lbl_en = tk.Label(
            self.root,
            text="",
            fg="#9aa0a6",
            bg="#111111",
            font=("Segoe UI", 12),
            wraplength=860,
            justify="left",
            anchor="w",
        )
        self.lbl_st = tk.Label(
            self.root,
            text="",
            fg="#6abf69",
            bg="#111111",
            font=("Segoe UI", 10),
            anchor="w",
        )
        self.lbl_tr.pack(fill="x", padx=16, pady=(14, 4))
        self.lbl_en.pack(fill="x", padx=16, pady=2)
        self.lbl_st.pack(fill="x", padx=16, pady=(4, 10))
        self.root.protocol("WM_DELETE_WINDOW", self.root.quit)

    def pump(self) -> None:
        try:
            while True:
                msg: UiMsg = ui_q.get_nowait()
                if msg.tr:
                    self.lbl_tr.config(text=msg.tr)
                if msg.en:
                    self.lbl_en.config(text=msg.en)
                if msg.status or msg.lag:
                    lag = f"gecikme {msg.lag:.1f}s" if msg.lag else ""
                    self.lbl_st.config(
                        text=" · ".join(x for x in (msg.status, lag) if x)
                    )
        except queue.Empty:
            pass
        self.root.after(50, self.pump)

    def run(self) -> None:
        self.pump()
        self.root.mainloop()


def ui_put(**kwargs) -> None:
    try:
        ui_q.put_nowait(UiMsg(**kwargs))
    except queue.Full:
        try:
            ui_q.get_nowait()
        except queue.Empty:
            pass
        try:
            ui_q.put_nowait(UiMsg(**kwargs))
        except queue.Full:
            pass


# ---------------------------------------------------------------- yakalama
def capture_loop(
    in_name: str | None,
    threshold: float,
    silence_frames: int,
    max_frames: int,
    min_frames: int,
):
    speaker = sc.get_speaker(in_name) if in_name else sc.default_speaker()
    mic = sc.get_microphone(id=str(speaker.name), include_loopback=True)
    print(f"Yakalanan (loopback): {speaker.name}")
    ui_put(status=f"Yakalanıyor: {speaker.name}")

    preroll: deque = deque(maxlen=PREROLL)
    buf: list[np.ndarray] = []
    scores: list[float] = []
    speaking = False
    silent = 0
    t0 = 0.0

    def emit(frames: list[np.ndarray], t_start: float) -> None:
        if len(frames) < min_frames:
            return
        try:
            seg_q.put_nowait((np.concatenate(frames).astype(np.float32), t_start))
        except queue.Full:
            try:
                seg_q.get_nowait()
            except queue.Empty:
                pass
            try:
                seg_q.put_nowait(
                    (np.concatenate(frames).astype(np.float32), t_start)
                )
            except queue.Full:
                pass

    with mic.recorder(samplerate=SR_IN, channels=1, blocksize=FRAME) as rec:
        while True:
            fr = rec.record(numframes=FRAME)[:, 0].astype(np.float32)

            # Aynı hoparlöre TTS basılırken loopback'i yoksay (geri besleme yok)
            if capture_blocked():
                preroll.clear()
                buf, scores, speaking, silent = [], [], False, 0
                continue

            sc_ = speech_score(fr)
            loud = sc_ > threshold

            if not speaking:
                preroll.append((fr, sc_))
                if loud:
                    speaking, silent = True, 0
                    buf = [f for f, _ in preroll]
                    scores = [s for _, s in preroll]
                    t0 = time.time() - len(buf) * FRAME_S
                    preroll.clear()
                continue

            buf.append(fr)
            scores.append(sc_)
            silent = 0 if loud else silent + 1

            if silent >= silence_frames:
                emit(buf, t0)
                buf, scores, speaking, silent = [], [], False, 0
            elif len(buf) >= max_frames:
                lo = max(1, len(buf) // 3)
                cut = lo + int(np.argmin(scores[lo:])) + 1
                emit(buf[:cut], t0)
                buf, scores = buf[cut:], scores[cut:]
                t0 += cut * FRAME_S


# ------------------------------------------------------- STT + çeviri
def stt_translate_loop(model_size: str, want_tts: bool) -> None:
    from faster_whisper import WhisperModel as WM
    import argostranslate.translate as atr

    try:
        import ctranslate2

        gpu = ctranslate2.get_cuda_device_count() > 0
    except Exception:
        gpu = False

    model = WM(
        model_size,
        device="cuda" if gpu else "cpu",
        compute_type="float16" if gpu else "int8",
    )
    print(f"Whisper hazır ({'GPU' if gpu else 'CPU'} / {model_size}). Dinleniyor…")
    ui_put(status=f"Hazır · {model_size} · {'GPU' if gpu else 'CPU'}")

    while True:
        audio, t0 = seg_q.get()
        if capture_blocked():
            continue
        if time.time() - t0 > 8.0:
            continue
        t1 = time.time()
        segs, _ = model.transcribe(
            audio,
            language="en",
            beam_size=1,
            best_of=1,
            temperature=0.0,
            without_timestamps=True,
            condition_on_previous_text=False,
            vad_filter=False,
        )
        parts = [
            s.text.strip()
            for s in segs
            if getattr(s, "no_speech_prob", 0) < 0.65
        ]
        text = " ".join(parts).strip()
        if len(text) < 2:
            continue
        if text.lower() in {"thank you", "thanks", "you", ".", "..."}:
            continue
        t2 = time.time()
        tr = atr.translate(text, "en", "tr")
        t3 = time.time()
        lag = t3 - t0
        print(
            f"EN: {text}\nTR: {tr}\n"
            f"   (STT {t2-t1:.2f}s · çev {t3-t2:.2f}s · toplam {lag:.1f}s)"
        )
        ui_put(en=text, tr=tr, lag=lag, status="canlı")
        if want_tts:
            try:
                tts_q.put_nowait((tr, t0))
            except queue.Full:
                pass


# ------------------------------------------------------------- TTS
def synth_loop(voice: str, max_lag: float, volume: float) -> None:
    import edge_tts as etts
    import miniaudio as ma

    loop = asyncio.new_event_loop()

    async def synth(text: str, rate: str) -> bytes:
        data = b""
        async for ch in etts.Communicate(text, voice, rate=rate).stream():
            if ch["type"] == "audio":
                data += ch["data"]
        return data

    while True:
        text, t0 = tts_q.get()
        lag = time.time() - t0
        if lag > max_lag:
            print(f"   [TTS atlandı: {lag:.1f}s geride]")
            continue
        rate = "+45%" if lag > 3.5 else "+30%" if lag > 2.5 else "+20%"
        try:
            mp3 = loop.run_until_complete(synth(text, rate))
            dec = ma.decode(
                mp3,
                output_format=ma.SampleFormat.SIGNED16,
                nchannels=1,
                sample_rate=TTS_SR,
            )
            pcm = np.frombuffer(dec.samples, dtype=np.int16)
            pcm = (pcm.astype(np.float32) * volume).astype(np.int16)
            try:
                play_q.put_nowait((pcm, t0))
            except queue.Full:
                pass
        except Exception as e:
            print("TTS hatası:", e)


def play_loop(out_dev, max_lag: float) -> None:
    stream = sd.OutputStream(
        samplerate=TTS_SR, channels=1, dtype="int16", device=out_dev
    )
    stream.start()
    while True:
        pcm, t0 = play_q.get()
        lag = time.time() - t0
        if lag > max_lag + 1.5:
            continue
        dur = len(pcm) / float(TTS_SR)
        arm_tts_gate(dur)
        print(f"   >> Hoparlörde seslendiriliyor ({lag:.1f}s, {dur:.1f}s)")
        ui_put(status="seslendiriliyor")
        stream.write(pcm.reshape(-1, 1))
        ui_put(status="canlı")


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Canlı yayın EN→TR sesli çeviri — yayın + Türkçe aynı hoparlörde"
    )
    ap.add_argument("--list", action="store_true", help="Ses cihazlarını listele")
    ap.add_argument(
        "--in", dest="inp", default=None, help="Yayın hoparlörü (loopback)"
    )
    ap.add_argument(
        "--out",
        default=None,
        help="Türkçe ses çıkışı (varsayılan: sistem hoparlörü / --in ile aynı)",
    )
    ap.add_argument(
        "--subtitles-only",
        action="store_true",
        help="Seslendirme yok; sadece altyazı",
    )
    ap.add_argument(
        "--tts",
        action="store_true",
        help="(Uyumluluk) Seslendirme zaten varsayılan",
    )
    ap.add_argument(
        "--no-ui",
        action="store_true",
        help="Altyazı penceresini kapat",
    )
    ap.add_argument(
        "--model",
        default="tiny.en",
        help="Whisper: tiny.en (hız) / base.en / small.en (kalite)",
    )
    ap.add_argument(
        "--threshold",
        type=float,
        default=0.012,
        help="Konuşma skoru eşiği (motor gürültüsünde: 0.02–0.04)",
    )
    ap.add_argument(
        "--silence",
        type=float,
        default=0.22,
        help="Cümle sonu sessizliği (sn)",
    )
    ap.add_argument(
        "--chunk",
        type=float,
        default=1.8,
        help="En uzun parça (sn)",
    )
    ap.add_argument(
        "--max-lag",
        type=float,
        default=4.0,
        help="TTS için max geride kalma (sn)",
    )
    ap.add_argument(
        "--volume",
        type=float,
        default=0.9,
        help="Türkçe ses seviyesi 0–1 (yayın motor sesinin üstüne)",
    )
    ap.add_argument("--voice", default="tr-TR-AhmetNeural")
    a = ap.parse_args()

    if a.list:
        return list_devices()

    want_tts = not a.subtitles_only
    # Varsayılan çıkış: --out yoksa --in (aynı hoparlör) veya sistem default
    out_name = a.out if a.out is not None else a.inp

    ensure_translation_model()
    out_dev = find_out_device(out_name) if want_tts else None

    threading.Thread(
        target=stt_translate_loop, args=(a.model, want_tts), daemon=True
    ).start()
    if want_tts:
        vol = max(0.05, min(1.0, a.volume))
        threading.Thread(
            target=synth_loop, args=(a.voice, a.max_lag, vol), daemon=True
        ).start()
        threading.Thread(
            target=play_loop, args=(out_dev, a.max_lag), daemon=True
        ).start()

    cap_kwargs = dict(
        in_name=a.inp,
        threshold=a.threshold,
        silence_frames=max(2, int(a.silence / FRAME_S)),
        max_frames=max(8, int(a.chunk / FRAME_S)),
        min_frames=max(4, int(0.28 / FRAME_S)),
    )

    out_label = out_name or "sistem varsayılan hoparlör"
    if a.no_ui:
        if want_tts:
            print(
                f"Seslendirme → {out_label}\n"
                "Yayın susmaz; Türkçe aynı hoparlöre karışır.\n"
                "Ctrl+C ile çık."
            )
        else:
            print("Sadece konsol. Ctrl+C ile çık.")
        try:
            capture_loop(**cap_kwargs)
        except KeyboardInterrupt:
            print("Kapatıldı.")
        return

    threading.Thread(target=capture_loop, kwargs=cap_kwargs, daemon=True).start()
    if want_tts:
        print(
            f"Seslendirme → {out_label}\n"
            "Yayın (motor vb.) açık kalır; Türkçe hoparlöre eklenir.\n"
            "Kapatmak için pencereyi kapatın veya Ctrl+C."
        )
    else:
        print(
            "Sadece altyazı. Yayın sesi değişmez.\n"
            "Kapatmak için pencereyi kapatın veya Ctrl+C."
        )
    try:
        OverlayUI().run()
    except KeyboardInterrupt:
        print("Kapatıldı.")


if __name__ == "__main__":
    main()
