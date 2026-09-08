import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CONTENT } from '../content/catalog.js';
import type { ViewEntity } from '../protocol/types.js';

/** Original procedural art. Geometry/materials are shared for one renderer lifetime. */
export class ModelFactory {
  readonly geometries = { box: new T.BoxGeometry(1, 1, 1), cone: new T.ConeGeometry(1, 1, 6), rock: new T.DodecahedronGeometry(1, 0), cylinder: new T.CylinderGeometry(1, 1, 1, 8) };
  private prototypes = new Map<string, T.Group>();
  private merged: T.BufferGeometry[] = [];
  private materials = new Map<string, T.MeshLambertMaterial>();
  material(color: number, memory = false): T.MeshLambertMaterial {
    const key = `${color}:${memory}`;
    let mat = this.materials.get(key);
    if (!mat) { const c = new T.Color(color); if (memory) c.lerp(new T.Color(0x626d76), .7).multiplyScalar(.65); mat = new T.MeshLambertMaterial({ color: c, flatShading: true }); this.materials.set(key, mat); }
    return mat;
  }
  create(e: Pick<ViewEntity, 'def' | 'owner' | 'kind' | 'visible' | 'id' | 'resource'>): T.Group {
    const key = `${e.kind}:${e.def}:${e.owner}:${e.visible}:${e.resource ?? ''}`;
    const cached = this.prototypes.get(key); if (cached) return cached.clone(true);
    const g = new T.Group();
    const team = e.owner === 0 ? 0x44c6c0 : 0xee895b;
    const add = (shape: keyof ModelFactory['geometries'], color: number, x: number, y: number, z: number, sx: number, sy: number, sz: number): T.Mesh => {
      const mesh = new T.Mesh(this.geometries[shape], this.material(color, !e.visible)); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh;
    };
    const wood = 0x71513c, plaster = 0xe3d5b2, roof = e.owner === 0 ? 0x397d82 : 0xa45141;
    if (e.kind === 'resource') {
      if (e.resource === 'wood') {
        add('cylinder', wood, 0, .6, 0, .13, 1.2, .13);
        for (let i = 0; i < 3; i++) add('cone', [0x294f42,0x39654b,0x52794e][i]!, 0, 1 + i * .48, 0, .85 - i * .18, 1.4, .85 - i * .18);
      } else if (e.resource === 'food') {
        for (let i = 0; i < 4; i++) { const a = i * 1.7; add('rock', 0x698347, Math.cos(a)*.3, .3, Math.sin(a)*.3, .42,.38,.42); add('rock', 0xb96568, Math.cos(a)*.43,.54,Math.sin(a)*.43,.09,.09,.09); }
      } else {
        for (let i = 0; i < 3; i++) add('rock', e.resource === 'gold' ? [0xc9a451,0xe0c475,0x9b803f][i]! : [0x8d999c,0xb0b6ad,0x737d83][i]!, (i-1)*.36,.27+i*.07,(i%2)*.25,.5,.4+i*.09,.48);
      }
    } else if (e.kind === 'unit') {
      const mounted = e.def === 'scout'; const y = mounted ? .65 : 0;
      if (mounted) { add('box',0x77503a,0,.55,0,.42,.45,.85); add('box',0x77503a,0,.87,-.4,.3,.5,.3); for (const x of [-.15,.15]) for (const z of [-.28,.28]) add('box',0x493b32,x,.23,z,.09,.45,.09); }
      add('cone',team,0,.47+y,0,.24,.53,.24); add('rock',0xe7be92,0,.87+y,0,.17,.19,.17);
      for (const x of [-.1,.1]) add('box',0x3b4143,x,.17+y,0,.1,.33,.13);
      if (e.def !== 'villager') add('cone',0xadbcc0,0,1.03+y,0,.2,.2,.2);
      if (e.def === 'spearman') { add('cylinder',wood,.3,.9,0,.025,1.8,.025); add('cone',0xd3ddcf,.3,1.9,0,.07,.24,.07); }
      else if (e.def === 'archer') { const bow = add('cylinder',0xe1b677,.31,.62+y,0,.035,.65,.035); bow.rotation.z=.35; }
      else if (e.def === 'villager') { const handle = add('box',wood,.28,.5,0,.045,.55,.045); handle.rotation.z=.65; add('box',0xa8b2ae,.12,.7,0,.28,.08,.08); }
      else { add('box',0xd0dbd8,.29,.7+y,0,.055,.65,.06); add('cylinder',team,-.26,.56+y,0,.2,.08,.2).rotation.x=Math.PI/2; }
      // A second visual code for teams, independent of hue.
      add(e.owner === 0 ? 'box' : 'cone',0xf2dfab,0,.65+y,-.17,.11,.13,.06);
    } else {
      const size = CONTENT.buildings[e.def]?.size ?? 2;
      add('box',0x8e927b,0,.06,0,size,.12,size);
      add('box',plaster,0,.65,0,size*.8,1.2,size*.72);
      const cap = add('cone',roof,0,1.65,0,size*.65,.9,size*.62); cap.rotation.y=Math.PI/4;
      for (const x of [-1,1]) for (const z of [-1,1]) add('box',wood,x*size*.38,.67,z*size*.34,.09,1.22,.09);
      add('box',wood,0,.42,size*.365,.4,.8,.05);
      for (const x of [-.5,.5]) add('box',0x465650,x,.88,size*.368,.22,.28,.06);
      add('box',team,0,1.22,size*.375,size*.7,.12,.05);
      if (e.def === 'townCenter') { add('box',plaster,0,1.8,0,.85,1.8,.85); add('cone',roof,0,2.9,0,.78,.8,.78); add('cylinder',wood,.35,3.4,0,.035,1,.035); add('box',team,.58,3.67,0,.45,.26,.025); }
      else if (e.def === 'mill') { const rotor = new T.Group(); rotor.name='rotor'; rotor.position.set(0,1.7,size*.64); for (let i=0;i<4;i++) { const arm=new T.Mesh(this.geometries.box,this.material(plaster,!e.visible)); arm.scale.set(.16,1.7,.07); arm.rotation.z=i*Math.PI/2; rotor.add(arm); } g.add(rotor); }
      else if (e.def === 'barracks') { for (const x of [-.55,.55]) add('cylinder',wood,x,1.8,size*.5,.03,1.4,.03); add('box',team,0,2.2,size*.5,1.2,.3,.04); }
      else if (e.def === 'archeryRange') { const target=add('cylinder',0xf1d6a0,.75,.7,size*.65,.32,.08,.32); target.rotation.x=Math.PI/2; const bull=add('cylinder',0xb65743,.75,.7,size*.7,.13,.09,.13); bull.rotation.x=Math.PI/2; }
      else if (e.def === 'stable') { for (let i=0;i<4;i++) add('box',wood,-.7+i*.45,.4,size*.68,.07,.8,.07); add('box',wood,0,.6,size*.68,1.6,.09,.06); }
      else if (e.def === 'blacksmith') { add('box',0x6c7471,.55,1.65,-.35,.35,1.4,.35); add('box',0x343f40,.7,.42,size*.65,.55,.22,.3); }
      else if (e.def === 'lumberCamp') { for (let i=0;i<3;i++) add('cylinder',0xb78e58,-.6+i*.3,.24,size*.65,.14,.9,.14).rotation.z=Math.PI/2; }
      else if (e.def === 'miningCamp') { for (let i=0;i<3;i++) add('rock',0x9aa3a0,-.6+i*.4,.28,size*.65,.3,.28,.3); }
    }
    // Merge static parts per material once per archetype; clones share GPU buffers.
    const batches = new Map<T.Material, T.BufferGeometry[]>();
    for (const child of [...g.children]) if (child instanceof T.Mesh) {
      child.updateMatrix(); const geo = child.geometry.clone().applyMatrix4(child.matrix);
      const mat = child.material as T.Material; const batch = batches.get(mat) ?? [];
      batch.push(geo); batches.set(mat, batch); g.remove(child);
    }
    for (const [material, pieces] of batches) {
      const geometry = mergeGeometries(pieces); for (const piece of pieces) piece.dispose();
      if (geometry) { this.merged.push(geometry); const mesh = new T.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); }
    }
    this.prototypes.set(key, g);
    return g.clone(true);
  }
  dispose(): void { for (const g of [...Object.values(this.geometries), ...this.merged]) g.dispose(); this.prototypes.clear(); for (const m of this.materials.values()) m.dispose(); }
}
