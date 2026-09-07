#!/usr/bin/env python3
"""Generate reproducible, original procedural RTS audio. No external samples.

Dependencies: numpy, scipy, soundfile. Optional: espeak for clearly labelled
placeholder English voices. Run: python tools/generate_audio.py --out audio
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import shutil
import subprocess
import tempfile
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

SR = 48000
SEED = 739174
rng = np.random.default_rng(SEED)


def env(x: np.ndarray, attack: float = .003, release: float = .03) -> np.ndarray:
    x = np.asarray(x, dtype=np.float64).copy()
    a = min(len(x)//2, max(1, int(SR*attack)))
    r = min(len(x)//2, max(1, int(SR*release)))
    fade = np.ones(len(x))
    fade[:a] = np.sin(np.linspace(0, np.pi/2, a))**2
    fade[-r:] = np.cos(np.linspace(0, np.pi/2, r))**2
    return x * (fade[:, None] if x.ndim == 2 else fade)


def noise(d: float, lo: float = 100, hi: float = 7000) -> np.ndarray:
    n = max(64, round(d * SR))
    x = rng.standard_normal(n)
    sos = butter(2, [max(10, lo), min(SR*.45, hi)], btype='bandpass', fs=SR, output='sos')
    return sosfilt(sos, x)


def tone(d: float, f: float, decay: float = 5, end: float | None = None) -> np.ndarray:
    t = np.arange(round(d*SR))/SR
    if end is None:
        phase = 2*np.pi*f*t
    else:
        phase = 2*np.pi*(f*t+(end-f)*t*t/(2*d))
    return np.sin(phase)*np.exp(-decay*t/max(d,.01))


def combine(d: float, parts: list[tuple[float, np.ndarray]], wrap: bool = False) -> np.ndarray:
    y = np.zeros(round(d*SR), dtype=np.float64)
    for start, x in parts:
        p = round(start*SR)
        if wrap:
            idx = (np.arange(len(x))+p) % len(y)
            np.add.at(y, idx, x)
        elif p < len(y):
            count = min(len(x), len(y)-p)
            if count > 0: y[p:p+count] += x[:count]
    return y


def hit(d: float, material: str, scale: float = 1.) -> np.ndarray:
    t = np.arange(round(d*SR))/SR
    bases = {'wood': [180, 410, 970], 'stone':[130, 680, 1700],
             'metal':[430, 1137, 1943, 3101], 'soft':[85, 165],
             'click':[1000, 1600], 'earth':[65, 120, 260]}
    fs = bases.get(material, bases['wood'])
    y = np.zeros(len(t))
    for k, f in enumerate(fs):
        dec = (8 if material == 'metal' else 20) * (1+k*.15)
        y += np.sin(2*np.pi*f*scale*t+rng.uniform(-.2,.2))*np.exp(-dec*t)/(k+1)
    y += .9*noise(d, 80, 6000)*np.exp(-55*t)
    return env(y, .0008, .03)


def whoosh(d: float, low: float = 250, high: float = 4000) -> np.ndarray:
    t = np.linspace(0,1,round(d*SR))
    return noise(d, low, high)*np.sin(np.pi*t)**2


def boom(d: float, heavy: bool = False) -> np.ndarray:
    t = np.arange(round(d*SR))/SR
    y = 1.7*tone(d, 130 if heavy else 170, 9, 28)
    y += 1.8*noise(d, 25, 2200)*np.exp(-t*(3 if heavy else 6))
    y += .7*noise(d, 1300, 9500)*np.exp(-t*40)
    return env(y, .001, .15)


def pluck(d: float, midi: float, level: float = 1) -> np.ndarray:
    f = 440*2**((midi-69)/12)
    t = np.arange(round(d*SR))/SR
    y = sum(np.sin(2*np.pi*f*k*t)*np.exp(-t*(3+k*1.5))/k**1.6 for k in range(1,7))
    return level*env(y, .002, .06)


def chime(notes: list[int], spacing: float = .12, duration: float = .9) -> np.ndarray:
    d = (len(notes)-1)*spacing+duration
    return env(combine(d, [(i*spacing, pluck(duration,n)) for i,n in enumerate(notes)]))


def make(kind: str, v: int) -> np.ndarray:
    scale = rng.uniform(.90,1.10)
    if kind == 'click': return hit(.08,'click',scale)
    if kind == 'confirm': return chime([74,81], .065, .30)
    if kind == 'cancel': return chime([69,62], .055, .25)
    if kind == 'error': return combine(.30,[(0,tone(.13,145*scale,3)),(.15,tone(.13,115*scale,3))])
    if kind == 'select': return pluck(.25,62+v*2)
    if kind == 'queued': return pluck(.19,74)
    if kind == 'rally': return chime([62,69],.07,.27)
    if kind == 'ping': return chime([86,81],.15,.55)
    if kind == 'attacked': return combine(1.2,[(i*.25,hit(.5,'metal',.75)) for i in range(3)])
    if kind == 'age': return chime([50,57,62,65,69,74],.13,1.3)
    if kind == 'research': return chime([69,72,76],.08,.7)
    if kind == 'complete': return chime([62,69,74],.08,.5)
    if kind == 'trained': return chime([57,62],.06,.3)
    if kind == 'population': return chime([62,60,57],.09,.35)
    if kind == 'resource': return chime([57,53],.12,.45)
    if kind == 'chop': return combine(.45,[(0,.6*whoosh(.12)),(.09,hit(.35,'wood',scale))])
    if kind == 'mine': return hit(.55,'stone',scale)+.25*hit(.55,'metal',scale*1.5)
    if kind in ('harvest','gather'): return env(noise(.45,450,5500)*(.25+np.sin(np.linspace(0,np.pi,21600))**2),.07,.12)
    if kind == 'deposit': return combine(.45,[(i*.065,.55*hit(.19,'wood' if i%2 else 'metal',scale)) for i in range(4)])
    if kind in ('build','repair'): return combine(.70,[(0,hit(.24,'wood',scale)),(.30,.8*hit(.24,'wood',scale*1.1))])
    if kind == 'foot_dirt': return env(hit(.19,'soft',scale)+.7*noise(.19,400,7000)*np.exp(-np.arange(9120)/1500))
    if kind == 'foot_stone': return hit(.18,'stone',scale*1.5)
    if kind == 'hoof': return combine(.35,[(0,hit(.16,'wood',scale*1.1)),(.13,.7*hit(.17,'stone',scale))])
    if kind == 'wheel': return env(noise(.65,80,1400)*(.45+.2*np.sin(np.arange(31200)/SR*2*np.pi*17)),.06,.1)
    if kind in ('sword','spear'): return env(whoosh(.26,250,6000)+.2*tone(.26,600*scale,4,220),.025,.03)
    if kind == 'metal': return hit(.65,'metal',scale)
    if kind == 'flesh': return hit(.2,'soft',scale)
    if kind == 'bow': return env(combine(.35,[(0,pluck(.3,50+v)),(.03,.6*whoosh(.2,500,8000))]))
    if kind == 'arrow_wood': return hit(.28,'wood',scale*2.3)
    if kind == 'arrow_ground': return hit(.22,'earth',scale)+.3*whoosh(.22,700,7000)
    if kind == 'crossbow': return combine(.4,[(0,hit(.18,'metal',1.6*scale)),(.025,.7*pluck(.3,55)),(.03,.8*whoosh(.2))])
    if kind == 'gun': return env(boom(.65)*.7+hit(.65,'metal',scale)*.3)
    if kind == 'ram': return hit(.95,'wood',scale*.6)+.75*boom(.95)
    if kind in ('catapult','trebuchet'):
        d = .85 if kind == 'catapult' else 1.15
        return combine(d,[(0,hit(d,'wood',scale*.8)),(.1,.7*whoosh(d-.1,120,2500))])
    if kind == 'rock': return boom(1.1)+.6*hit(1.1,'stone',scale*.7)
    if kind in ('cannon','naval_cannon'): return boom(1.8,True)
    if kind == 'explosion': return boom(1.45,True)
    if kind == 'collapse': return combine(2.2,[(0,boom(2.2,True))]+[(i*.12,.6*hit(.7,'wood' if i%2 else 'stone',rng.uniform(.5,1.8))) for i in range(12)])
    if kind == 'heal': return chime([74,77,81],.12+v*.006,.7+v*.04)
    if kind == 'conversion_start': return env(tone(1.8,170,1,390)+.5*tone(1.8,255,1,585),.18,.25)
    if kind == 'conversion_complete': return chime([62,65,69,74],.09,.9)
    if kind == 'relic': return chime([81,86,89],.1,1.1)
    if kind == 'oar': return env(noise(.65,140,4000)*np.sin(np.linspace(0,np.pi,31200))**2,.02,.07)
    if kind == 'fire': return env(noise(.9,200,6500)*(.5+.3*np.sin(np.arange(43200)/SR*2*np.pi*11)),.08,.18)
    if kind == 'sink': return combine(2.2,[(0,noise(2.2,70,2200)*np.exp(-np.arange(105600)/SR*1.6)),(.08,hit(1.3,'wood',.7))])
    if kind == 'death': return combine(.6,[(0,.5*whoosh(.25,150,3000)),(.22,hit(.3,'soft',scale)),(.30,.4*hit(.3,'metal',scale*.5))])
    if kind == 'victory': return chime([50,57,62,65,69,74,77,81],.2,1.6)
    if kind == 'defeat': return chime([62,60,57,53,50],.29,1.8)
    raise ValueError(kind)


# (folder, event, generator kind, variants, game bus, cooldown seconds, max simultaneous)
SPECS = [
('ui','click','click',2,'ui',.04,3),('ui','confirm','confirm',1,'ui',.1,2),
('ui','cancel','cancel',1,'ui',.1,2),('ui','error','error',2,'ui',.5,1),
('ui','select','select',2,'ui',.08,1),('ui','queued','queued',1,'ui',.06,2),
('ui','rally','rally',1,'ui',.15,1),('ui','ping','ping',1,'ui',.7,2),
('alerts','under_attack','attacked',2,'alerts',8,1),('alerts','age_complete','age',1,'alerts',2,1),
('alerts','research_complete','research',1,'alerts',.5,1),('alerts','building_complete','complete',1,'alerts',.5,1),
('alerts','unit_complete','trained',1,'alerts',.6,1),('alerts','population_full','population',1,'alerts',4,1),
('alerts','resource_low','resource',1,'alerts',3,1),
('economy','wood_chop','chop',3,'world',.06,4),('economy','mine_strike','mine',3,'world',.06,4),
('economy','harvest','harvest',3,'world',.15,3),('economy','gather','gather',3,'world',.15,3),
('economy','deposit','deposit',2,'world',.12,3),('economy','build_hammer','build',3,'world',.12,4),
('economy','repair_hammer','repair',3,'world',.12,4),
('movement','footstep_dirt','foot_dirt',3,'world',.04,6),('movement','footstep_stone','foot_stone',3,'world',.04,6),
('movement','horse_hoof','hoof',3,'world',.07,5),('movement','wheel','wheel',3,'world',.2,3),
('combat','sword_swing','sword',3,'world',.03,8),('combat','spear_thrust','spear',3,'world',.03,8),
('combat','impact_metal','metal',3,'world',.04,8),('combat','impact_soft','flesh',3,'world',.04,8),
('combat','bow_release','bow',3,'world',.03,8),('combat','arrow_wood','arrow_wood',3,'world',.04,8),
('combat','arrow_ground','arrow_ground',3,'world',.04,8),('combat','crossbow_release','crossbow',3,'world',.04,8),
('combat','handgun_shot','gun',3,'world',.06,6),('combat','unit_death','death',3,'world',.08,5),
('siege','ram_hit','ram',3,'world',.1,3),('siege','catapult_launch','catapult',2,'world',.1,3),
('siege','rock_impact','rock',3,'world',.08,4),('siege','trebuchet_launch','trebuchet',2,'world',.1,3),
('siege','cannon_shot','cannon',2,'world',.12,3),('siege','explosion','explosion',2,'world',.1,4),
('siege','building_collapse','collapse',2,'world',.2,3),
('monastery','heal','heal',2,'world',.3,2),('monastery','conversion_start','conversion_start',1,'world',.5,2),
('monastery','conversion_complete','conversion_complete',1,'world',.3,2),('monastery','relic_pickup','relic',1,'alerts',.4,1),
('naval','oar_splash','oar',3,'world',.12,4),('naval','cannon_shot','naval_cannon',2,'world',.12,3),
('naval','fire_attack','fire',2,'world',.1,3),('naval','ship_sink','sink',2,'world',.2,3),
('results','victory','victory',1,'alerts',4,1),('results','defeat','defeat',1,'alerts',4,1),
]


def circular_noise(n:int, cutoff:float) -> np.ndarray:
    f = np.fft.rfftfreq(n,1/SR)
    phases = rng.uniform(0,2*np.pi,len(f))
    amp = 1/(1+(f/cutoff)**3)
    amp[0] = 0
    x = np.fft.irfft(amp*np.exp(1j*phases), n)
    return x/(np.std(x)+1e-12)


def ambience(kind: str, d:float=16.) -> np.ndarray:
    n=round(d*SR)
    if kind=='forest':
        y=.11*circular_noise(n,1900)
        parts=[]
        for _ in range(13):
            dur=rng.uniform(.09,.22)
            bird=env(tone(dur,rng.uniform(2400,3600),1,rng.uniform(3700,4800)),.02,.025)
            parts.append((rng.uniform(0,d),.16*bird))
        y+=combine(d,parts,True)
    elif kind in ('river','sea'):
        base = circular_noise(n,3300 if kind=='river' else 1300)
        cycles=7 if kind=='river' else 3
        mod=.5+.4*np.sin(2*np.pi*cycles*np.arange(n)/n)
        y=.23*base*mod
    elif kind=='fire':
        y=.08*circular_noise(n,2200)
        y+=combine(d,[(rng.uniform(0,d),.08*hit(rng.uniform(.04,.13),'wood',rng.uniform(1,3))) for _ in range(80)],True)
    else: raise ValueError(kind)
    # Delay preserves periodicity and produces gentle stereo width.
    return np.stack([y,np.roll(y,173)*.97],axis=1)


def music(battle:bool=False) -> np.ndarray:
    d=32.; beat=.5; parts=[]
    # An original 16-bar modal sketch; all events wrap for seamless looping.
    progression=[(50,57,62,65),(48,55,60,64),(46,53,58,62),(48,55,60,64)]*4
    melody=[74,77,76,69,72,74,81,77,76,74,72,69,65,69,72,74]
    for bar,chord in enumerate(progression):
        t0=bar*2
        for j in range(4): parts.append((t0+j*beat,.3*pluck(1.6,chord[j]+12)))
        parts.append((t0,.22*pluck(2.2,chord[0]-12)))
        parts.append((t0+.5,.28*pluck(1.5,melody[bar])))
        if battle:
            for j in range(4):
                parts.append((t0+j*beat,.6*hit(.24,'earth',.75 if j%2==0 else 1.4)))
            parts.append((t0+1.75,.16*hit(.13,'metal',2.1)))
    y=combine(d,parts,True)
    return np.stack([y+np.roll(y,691)*.08,y+np.roll(y,997)*.08],axis=1)


VOICES={
'villager_select':'Ready.', 'villager_move':'On my way.', 'villager_build':'Building.',
'villager_gather':'To work.', 'villager_repair':'Making repairs.',
'soldier_select':'Your orders.', 'soldier_move':'Moving out.', 'soldier_attack':'Advance.',
'cavalry_select':'Mounted and ready.', 'cavalry_move':'Ride out.',
'siege_select':'Engine ready.', 'siege_attack':'Take aim.',
'monk_select':'At your service.', 'monk_heal':'Be restored.',
'under_attack':'Our settlement is under attack.', 'population_full':'Build more houses.',
'not_enough_resources':'Not enough resources.', 'age_complete':'A new age begins.',
'victory':'Victory is ours.', 'defeat':'We have been defeated.'
}


def main()->None:
    parser=argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, default=Path('audio'))
    parser.add_argument('--no-voices', action='store_true')
    a=parser.parse_args(); out=a.out; out.mkdir(parents=True,exist_ok=True)
    assets=[]; events={}
    def save(rel:str,x:np.ndarray,loop:bool=False,source:str='original_procedural_dsp')->None:
        x=np.asarray(x,dtype=np.float64)
        if not np.isfinite(x).all(): raise ValueError(f'Nonfinite audio: {rel}')
        x-=x.mean(axis=0)
        if not loop: x=env(x,.001,.02)
        target=.251 if loop else .501 # -12 / -6 dBFS peak headroom
        peak=float(np.max(np.abs(x)))
        if peak<1e-8: raise ValueError(f'Silent audio: {rel}')
        x=x*(target/peak)
        p=out/rel; p.parent.mkdir(parents=True,exist_ok=True)
        sf.write(p,x,SR,subtype='PCM_16')
        q=p.with_suffix('.ogg'); sf.write(q,x,SR,format='OGG',subtype='VORBIS')
        read,rate=sf.read(p,always_2d=True)
        item={'id':rel.removesuffix('.wav').replace('/','.'),'wav':rel,
              'ogg':q.relative_to(out).as_posix(),'sample_rate_hz':rate,
              'frames':len(read),'duration_seconds':round(len(read)/rate,6),'channels':read.shape[1],
              'peak_dbfs':round(20*math.log10(max(np.max(np.abs(read)),1e-12)),3),
              'rms_dbfs':round(20*math.log10(max(np.sqrt(np.mean(read*read)),1e-12)),3),
              'loop':loop,'source':source,
              'sha256_wav':hashlib.sha256(p.read_bytes()).hexdigest(),
              'sha256_ogg':hashlib.sha256(q.read_bytes()).hexdigest()}
        if loop:
            item['loop_start_frame']=0; item['loop_end_frame']=len(read)
            item['boundary_step']=float(np.max(np.abs(read[0]-read[-1])))
        assets.append(item)
    for folder,event,kind,variants,bus,cooldown,max_count in SPECS:
        ids=[]
        for v in range(variants):
            rel=f'{folder}/{event}_{v+1:02d}.wav'
            save(rel,make(kind,v)); ids.append(assets[-1]['id'])
        events[f'{folder}.{event}']={'variants':ids,'bus':bus,'spatial':bus=='world',
            'gain':.55 if bus=='world' else .65,'cooldown_seconds':cooldown,
            'max_concurrent':max_count,'random_pitch_range':[.96,1.04] if variants>1 else [1,1]}
    for kind in ['forest','river','sea','fire']:
        save(f'ambience/{kind}_loop.wav',ambience(kind),True)
        events[f'ambience.{kind}']={'variants':[assets[-1]['id']],'bus':'ambience','spatial':False,'gain':.4,'max_concurrent':1}
    for kind in ['explore','battle']:
        save(f'music/{kind}_loop.wav',music(kind=='battle'),True)
        events[f'music.{kind}']={'variants':[assets[-1]['id']],'bus':'music','spatial':False,'gain':.5,'max_concurrent':1}
    voice_tool=shutil.which('espeak')
    if not a.no_voices and voice_tool:
        for key,text in VOICES.items():
            with tempfile.TemporaryDirectory() as tmp:
                p=Path(tmp)/'voice.wav'
                subprocess.run([voice_tool,'-v','en-gb','-s','150','-p','36','-w',str(p),text],check=True,capture_output=True)
                x,rate=sf.read(p)
                g=math.gcd(SR,rate); x=resample_poly(x,SR//g,rate//g)
                save(f'voice_placeholder/{key}.wav',x,source='espeak_en_gb_synthetic_placeholder')
                events[f'voice.{key}']={'variants':[assets[-1]['id']],'bus':'voice','spatial':False,'gain':.7,
                    'cooldown_seconds':1.1,'max_concurrent':1,'text':text,'placeholder':True}
    manifest={'schema_version':1,'pack_name':'Ironvale original procedural RTS starter audio',
              'seed':SEED,'sample_rate_hz':SR,'asset_count':len(assets),
              'voice_tool':str(voice_tool) if voice_tool else None,
              'notes':['No Age of Empires recordings, melodies, or samples included.',
                       'Procedural effects and music are prototype assets; synthetic voices are explicitly placeholders.',
                       'One game event selects one variant; do not play every variant.',
                       'Spatial enemy audio must obey the receiving player visibility rules.'],
              'events':events,'assets':assets}
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({'assets':len(assets),'events':len(events),'seconds':round(sum(x['duration_seconds'] for x in assets),2),
          'voices':sum(x['source'].startswith('espeak') for x in assets)},indent=2))

if __name__=='__main__': main()
