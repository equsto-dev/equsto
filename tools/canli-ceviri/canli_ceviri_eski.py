"""
Canlı İngilizce -> Türkçe sesli çeviri (düşük gecikme sürümü)

Kurulum:
    pip install soundcard sounddevice numpy faster-whisper argostranslate edge-tts miniaudio

Kullanım:
    python canli_ceviri.py --list
    python canli_ceviri.py --in "Hoparlör" --out "Kulaklık"

Türkçe sesi, yakalanan cihazdan FARKLI cihaza verin (geri besleme olmasın).
"""
import argparse
import asyncio
import queue
import threading
import time
from collections import deque

import numpy as np
import sounddevice as sd
import soundcard as sc
import miniaudio
import edge_tts
import argostranslate.package
import argostranslate.translate
from faster_whisper import WhisperModel

SR_IN = 16000
FRAME = 800                 # 50 ms
FRAME_S = FRAME / SR_IN
PREROLL = 3                 # konuşma başı kesilmesin diye 150 ms ön tampon
TTS_SR = 24000

seg_q = queue.Queue()       # (ses, t0)
tts_q = queue.Queue()       # (metin, t0)
play_q = queue.Queue()      # (pcm, t0)


def list_devices():
    print("Yakalanabilecek cihazlar (--in):")
    for s in sc.all_speakers():
        print("  -", s.name)
    print("\nOynatma cihazları (--out):")
    for i, d in enumerate(sd.query_devices()):
        if d["max_output_channels"] > 0:
            print(f"  - [{i}] {d['name']}")


def find_out_device(name):
    if not name:
        return None
    for i, d in enumerate(sd.query_devices()):
        if d["max_output_channels"] > 0 and name.lower() in d["name"].lower():
            return i
    raise SystemExit(f"Çıkış cihazı bulunamadı: {name}")


def ensure_translation_model():
    langs = argostranslate.translate.get_installed_languages()
    en = next((l for l in langs if l.code == "en"), None)
    if en and any(t.to_lang.code == "tr" for t in en.translations_from):
        return
    print("İngilizce->Türkçe çeviri modeli indiriliyor (tek seferlik)...")
    argostranslate.package.update_package_index()
    pkg = next(p for p in argostranslate.package.get_available_packages()
               if p.from_code == "en" and p.to_code == "tr")
    argostranslate.package.install_from_path(pkg.download())


# ---------------------------------------------------------------- yakalama
def capture_loop(in_name, threshold, silence_frames, max_frames, min_frames):
    speaker = sc.get_speaker(in_name) if in_name else sc.default_speaker()
    mic = sc.get_microphone(id=str(speaker.name), include_loopback=True)
    print(f"Yakalanan cihaz: {speaker.name}")

    preroll = deque(maxlen=PREROLL)
    buf, rms_l = [], []
    speaking, silent, t0 = False, 0, 0.0

    def emit(frames, t_start):
        if len(frames) >= min_frames:
            seg_q.put((np.concatenate(frames), t_start))

    with mic.recorder(samplerate=SR_IN, channels=1, blocksize=FRAME) as rec:
        while True:
            fr = rec.record(numframes=FRAME)[:, 0].astype(np.float32)
            r = float(np.sqrt(np.mean(fr ** 2)))
            loud = r > threshold

            if not speaking:
                preroll.append((fr, r))
                if loud:
                    speaking, silent = True, 0
                    buf = [f for f, _ in preroll]
                    rms_l = [x for _, x in preroll]
                    t0 = time.time() - len(buf) * FRAME_S
                    preroll.clear()
                continue

            buf.append(fr)
            rms_l.append(r)
            silent = 0 if loud else silent + 1

            if silent >= silence_frames:               # doğal cümle/duraklama sonu
                emit(buf, t0)
                buf, rms_l, speaking, silent = [], [], False, 0
            elif len(buf) >= max_frames:               # zorunlu kesim: en sessiz noktadan
                lo = len(buf) // 2
                cut = lo + int(np.argmin(rms_l[lo:])) + 1
                emit(buf[:cut], t0)
                buf, rms_l = buf[cut:], rms_l[cut:]
                t0 += cut * FRAME_S


# ------------------------------------------------------- yazıya + çeviri
def stt_translate_loop(model_size):
    try:
        import ctranslate2
        gpu = ctranslate2.get_cuda_device_count() > 0
    except Exception:
        gpu = False
    model = WhisperModel(model_size, device="cuda" if gpu else "cpu",
                         compute_type="float16" if gpu else "int8")
    print(f"Model hazır ({'GPU' if gpu else 'CPU'}). Dinleniyor...")
    while True:
        audio, t0 = seg_q.get()
        t1 = time.time()
        segs, _ = model.transcribe(
            audio, language="en", beam_size=1, best_of=1, temperature=0.0,
            without_timestamps=True, condition_on_previous_text=False,
            vad_filter=False)
        parts = [s.text.strip() for s in segs if s.no_speech_prob < 0.6]
        text = " ".join(parts).strip()
        if not text:
            continue
        t2 = time.time()
        tr = argostranslate.translate.translate(text, "en", "tr")
        t3 = time.time()
        print(f"EN: {text}\nTR: {tr}\n   (yazıya {t2-t1:.2f}s, çeviri {t3-t2:.2f}s)")
        tts_q.put((tr, t0))


# ------------------------------------------------------------- seslendirme
def synth_loop(voice, max_lag):
    loop = asyncio.new_event_loop()

    async def synth(text, rate):
        data = b""
        async for ch in edge_tts.Communicate(text, voice, rate=rate).stream():
            if ch["type"] == "audio":
                data += ch["data"]
        return data

    while True:
        text, t0 = tts_q.get()
        lag = time.time() - t0
        if lag > max_lag:                               # çok geride: atla, canlıya yetiş
            print(f"   [atlandı: {lag:.1f}s geride]")
            continue
        # gecikme arttıkça konuşmayı hızlandır
        rate = "+45%" if lag > 3.5 else "+30%" if lag > 2.5 else "+15%"
        try:
            mp3 = loop.run_until_complete(synth(text, rate))
            dec = miniaudio.decode(mp3, output_format=miniaudio.SampleFormat.SIGNED16,
                                   nchannels=1, sample_rate=TTS_SR)
            play_q.put((np.frombuffer(dec.samples, dtype=np.int16), t0))
        except Exception as e:
            print("TTS hatası:", e)


def play_loop(out_dev, max_lag):
    stream = sd.OutputStream(samplerate=TTS_SR, channels=1, dtype="int16", device=out_dev)
    stream.start()
    while True:
        pcm, t0 = play_q.get()
        lag = time.time() - t0
        if lag > max_lag + 1.5:
            continue
        print(f"   >> oynatılıyor, toplam gecikme {lag:.1f}s")
        stream.write(pcm.reshape(-1, 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--in", dest="inp", default=None)
    ap.add_argument("--out", default=None)
    ap.add_argument("--model", default="base.en", help="tiny.en / base.en / small.en")
    ap.add_argument("--threshold", type=float, default=0.01)
    ap.add_argument("--silence", type=float, default=0.3, help="cümle sonu sessizliği (sn)")
    ap.add_argument("--chunk", type=float, default=3.0, help="en uzun parça (sn)")
    ap.add_argument("--max-lag", type=float, default=5.0, help="bundan geride kalan cümle atlanır (sn)")
    ap.add_argument("--voice", default="tr-TR-AhmetNeural")
    a = ap.parse_args()

    if a.list:
        return list_devices()

    ensure_translation_model()
    out_dev = find_out_device(a.out)

    threading.Thread(target=stt_translate_loop, args=(a.model,), daemon=True).start()
    threading.Thread(target=synth_loop, args=(a.voice, a.max_lag), daemon=True).start()
    threading.Thread(target=play_loop, args=(out_dev, a.max_lag), daemon=True).start()
    try:
        capture_loop(a.inp, a.threshold,
                     int(a.silence / FRAME_S), int(a.chunk / FRAME_S), int(0.4 / FRAME_S))
    except KeyboardInterrupt:
        print("Kapatıldı.")


if __name__ == "__main__":
    main()
