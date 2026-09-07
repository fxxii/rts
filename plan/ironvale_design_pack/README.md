# Ironvale: design + original RTS starter audio

This package is **not a playable game**. It contains a proposed game design and actual generated audio assets.

## Contents

- `DESIGN.md` — product scope, interpretation boundaries, core systems, content-family inventory, multiplayer architecture, sound integration, development checkpoints and acceptance targets.
- `audio/` — 139 logical clips in two encodings each: WAV and Ogg Vorbis.
- `audio/manifest.json` — 79 game-event mappings, individual asset metadata and hashes.
- `AUDIO_PREVIEW.wav` and `PREVIEW_CUES.md` — a labeled listening montage; not background music for shipping.
- `VALIDATION.json` — technical test results, scope limits and loop-boundary measurements.
- `tools/generate_audio.py` — reproducible procedural sound/music generator; optional eSpeak placeholder voices.
- `tools/validate_audio.py` — file, hash, encoding and manifest tests.
- `requirements.txt` — Python package versions used for this generation.

## Asset summary

113 effects; four 16-second ambience loops; two 32-second original musical loops; 20 English synthetic placeholder voice clips. All WAV files use 48 kHz PCM16. Effects/voices are mono; ambience/music are stereo. WAV and Ogg are alternate encodings of the same clip.

Sound effects are stylized and synthesized, not field recordings. Voices are deliberately labeled placeholders and should not be mistaken for professional performances. No Age of Empires sound, melody, sample, icon or model is included. No claim of production-ready mixing is made.

Each event chooses **one** variant. Use the manifest’s bus, gain, cooldown and concurrency values as starting recommendations, not calibrated final mix settings. Never play a sound per rendered frame. Trigger it from an authorized gameplay/presentation event. Do not send or play hidden enemy events through fog of war.

## Regeneration

From the extracted package directory:

```sh
python -m pip install -r requirements.txt
python tools/generate_audio.py --out audio
python tools/validate_audio.py --audio audio --report VALIDATION.json
```

`espeak` must be installed and on PATH to regenerate voices. The already supplied voices need no generator at runtime. Add `--no-voices` to regenerate only non-vocal assets. Voice outputs can vary between eSpeak versions; supplied hashes describe this delivered pack.

The browser/game does not need Python, NumPy, SciPy, soundfile or eSpeak. They are offline asset-creation tools only.

## Status

Game: proposed, not implemented. 3D models: not included. Online multiplayer: designed, not implemented or tested. All-AoE2-content parity: not established; edition/patch/DLC boundary was unspecified. Sound files: generated and technically checked. Listening and real-browser integration remain necessary.
