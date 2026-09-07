#!/usr/bin/env python3
"""Validate delivered RTS audio and event references. Does not assess sound quality."""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path
import numpy as np
import soundfile as sf


def main()->None:
    parser=argparse.ArgumentParser()
    parser.add_argument('--audio',type=Path,default=Path('audio'))
    parser.add_argument('--report',type=Path,default=Path('VALIDATION.json'))
    args=parser.parse_args()
    manifest=json.loads((args.audio/'manifest.json').read_text())
    errors=[]; clips=[]; ids=set(); hashes=set(); loop_checks=[]
    for entry in manifest['assets']:
        aid=entry['id']
        if aid in ids: errors.append(f'Duplicate asset ID {aid}')
        ids.add(aid)
        if entry['sha256_wav'] in hashes: errors.append(f'Duplicate WAV content {aid}')
        hashes.add(entry['sha256_wav'])
        for encoding in ('wav','ogg'):
            path=args.audio/entry[encoding]
            if not path.is_file():
                errors.append(f'Missing {path}'); continue
            if hashlib.sha256(path.read_bytes()).hexdigest()!=entry[f'sha256_{encoding}']:
                errors.append(f'Hash mismatch {path}')
            try: x,sr=sf.read(path,always_2d=True)
            except Exception as exc:
                errors.append(f'Decode failed {path}: {exc}'); continue
            if sr!=48000: errors.append(f'Wrong rate {path}: {sr}')
            if len(x)!=entry['frames']: errors.append(f'Wrong frame count {path}: {len(x)}')
            if x.shape[1]!=entry['channels']: errors.append(f'Wrong channel count {path}')
            if not np.isfinite(x).all(): errors.append(f'Nonfinite samples {path}')
            peak=float(np.max(np.abs(x)))
            rms=float(np.sqrt(np.mean(x*x)))
            if peak>=.999: errors.append(f'Clipping {path}')
            if rms<1e-5: errors.append(f'Silent asset {path}')
            if encoding=='wav':
                info=sf.info(path)
                if info.subtype!='PCM_16':errors.append(f'Wrong WAV subtype {path}')
            if entry['loop']:
                edge=float(np.max(np.abs(x[0]-x[-1])))
                normal=np.abs(np.diff(x,axis=0))
                percentile=float(np.quantile(normal,.999))
                ok=edge<=max(.015,3*percentile)
                if not ok:errors.append(f'Abnormal loop boundary {path}: {edge}')
                loop_checks.append({'asset':aid,'encoding':encoding,'boundary_step':round(edge,8),
                      'within_sample_difference_envelope':ok})
            clips.append({'asset':aid,'encoding':encoding,'frames':len(x),'channels':x.shape[1],
                          'peak':round(peak,7),'rms':round(rms,7)})
    used=set()
    for name,event in manifest['events'].items():
        if not event.get('variants'):errors.append(f'No variants: {name}')
        for aid in event['variants']:
            if aid not in ids:errors.append(f'Broken event reference: {name} -> {aid}')
            used.add(aid)
    if used != ids:errors.append('Unreferenced assets: '+str(sorted(ids-used)))
    report={'status':'PASS' if not errors else 'FAIL', 'logical_clips':len(ids),
        'decoded_files':len(clips),'game_events':len(manifest['events']),
        'sound_effects':sum(not x['loop'] and not x['source'].startswith('espeak') for x in manifest['assets']),
        'ambience_loops':sum(x['id'].startswith('ambience.') for x in manifest['assets']),
        'music_loops':sum(x['id'].startswith('music.') for x in manifest['assets']),
        'placeholder_voices':sum(x['source'].startswith('espeak') for x in manifest['assets']),
        'duration_seconds':round(sum(x['duration_seconds'] for x in manifest['assets']),3),
        'unique_wav_hashes':len(hashes),'errors':errors,'loop_checks':loop_checks,
        'checks':['file presence','WAV and Ogg decode','sample rate','duration/frame count',
                  'channel count','WAV PCM16 subtype','finite samples','non-silence','no clipped samples',
                  'SHA-256 hashes','unique WAV content','event ID referential integrity',
                  'loop boundary within expected sample differences'],
        'not_tested':['perceptual listening quality','browser playback and autoplay behavior',
                      'game integration','3D rendering','multiplayer','gameplay balance and fun',
                      'exact AoE2 roster parity'], 'files':clips}
    args.report.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ['status','logical_clips','decoded_files','game_events','sound_effects',
         'ambience_loops','music_loops','placeholder_voices','unique_wav_hashes','errors']},indent=2))
    if errors:raise SystemExit(1)

if __name__=='__main__':main()
