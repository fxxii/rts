# Supplied audio integration evidence

Implemented 2026-09-08 on the foundation workspace. This is technical integration evidence, not an audible-quality or complete game-event coverage claim.

## Provenance and copying

`node --experimental-strip-types tools/sync-assets.ts` passed: 139 logical clips, 278 original encoding SHA-256 checks, 79 event mappings. The served files were verified byte-for-byte against the supplied originals after copying. The script pins the original manifest SHA-256 `dc568e15646fb15cb9f02db79d8aa8ab679a50bf886f09c3d28be725b3bc5251`, validates all references before writes, rejects traversal/output symlinks, and writes only `public/audio/`. It does not invoke generation tools or modify the original pack.

Source: `plan/ironvale_design_pack/README.md`, `audio/manifest.json`, `tools/generate_audio.py` and `tools/validate_audio.py`. Assets are original procedural prototype effects/music; the 20 eSpeak voices are **synthetic placeholders**. No recordings were invented or substituted. Credits/settings must retain that label.

## Runtime API and responsibilities

`new AudioEngine(onError?: (message: string) => void)` reports manifest/decode failures through its optional callback. Invoke `start()` directly from the Start/Create/Join/practice gesture; it calls `AudioContext.resume()` before any await. After start, `getEventNames()` exposes the 79 actual manifest event IDs for development preview. Missing manifest/decode failures do not throw into simulation.

`play(name, position?)` selects one variant, respects manifest gains/cooldowns/concurrency/pitch, maps world/UI buses to effects, and uses camera-position-relative panning/attenuation for spatial events. Call `setListener(x,z)` as the fixed-orientation camera pans. Alerts and voices have higher source priority than effects/distant work; active sources are capped at 32. Callers must provide only permitted-view events and issue one acknowledgment per selected-group order. The engine cannot infer fog permission or grouping from a sound name.

`setVolume(bus,value)` and `getVolumes()` provide six clamped persistent controls: master, effects, voice, alerts, ambience, music. Browser storage failure preserves session controls. `setBattle(false/true)` starts exploration/battle loops on a shared clock phase and crossfades their gains; voice/alert activity ducks music. `dispose()` aborts requests, invalidates pending decodes, stops/disconnects sources, clears decoded buffers and closes the context. Call it on match exit/transition; `start()` can initialize the same object again. `getDiagnostics()` exposes bounded errors, decoded/active/pending counts, starts per event, fallback count and music gain values for preview/testing.

API selection checked against the official [Web Audio API specification](https://www.w3.org/TR/webaudio-1.1/): buffer decoding, single-use sources, gain scheduling, context activation and panner/listener APIs.

## Checks and remaining acceptance

- Asset validation/copy and focused ESLint passed for `src/client/audio.ts`, `tools/sync-assets.ts`, `tests/browser/audio.spec.ts`.
- `npm exec -- tsc --noEmit` reported no errors in these files, but the overall command failed on concurrent unfinished simulation/content files. A clean project typecheck remains an integration gate.
- Four executable Playwright tests cover gesture activation, one acknowledgment despite simultaneous duplicates, all persistent buses, cleanup, real Ogg/WAV decoding of all 278 files, forced Ogg decode failure with WAV fallback, loops/crossfade/ducking and source limits. **Not run here:** no index page, Playwright config or installed browser cache existed at the check. Run `npm run test:browser -- tests/browser/audio.spec.ts` after the root supplies the runtime/browser.
- These module tests do not establish actual UI-to-game-event wiring, fog filtering, group-order caller behavior or audible listening quality. Integrated browser journeys must verify those paths.
- Human listening remains required for economy, construction/production, age-up, combat, siege, navy, monastery, alerts, results, loop seams and transitions. Event families absent from the current playable rules are not started, even though their supplied sounds decode or appear in preview. Safari/WAV fallback and real output-device listening remain unverified.

## Integrator verification update

After the runtime was wired, all four module browser checks passed, including decoding all278encodings. A fifth test played actual practice harvest and production events through the composed game audio, then reloaded and activated audio through Reconnect. The first harvest poll exceeded its10-second wall-clock window under software rendering; the isolated rerun passed, and the test now allows20seconds while asserting the same actual event-start count. Typecheck/lint and asset validation passed in the integrated workspace. Audible human listening and unimplemented event families remain open.
