import * as T from 'three';
import { CONTENT } from '../content/catalog.js';
import type { PlayerView, Point, ViewEntity } from '../protocol/types.js';
import { ModelFactory } from './models.js';
interface Visual { group: T.Group; model: T.Group; ring: T.Mesh; health: T.Group; fill: T.Mesh; entity: ViewEntity; target: T.Vector3 }

export class GameRenderer {
  private scene = new T.Scene();
  private camera = new T.OrthographicCamera(-16,16,12,-12,.1,180);
  private renderer: T.WebGLRenderer;
  private factory = new ModelFactory();
  private visuals = new Map<number, Visual>();
  private view: PlayerView | null = null;
  private deaths: { group: T.Group; model: T.Group; start: number; building: boolean; cell: number }[] = [];
  private deathEvents = new Set<string>();
  private center = new T.Vector3(12,0,12);
  private span = 12;
  private ray = new T.Raycaster();
  private plane = new T.Plane(new T.Vector3(0,1,0),0);
  private fogData = new Uint8Array(64*64*4);
  private fogTexture = new T.DataTexture(this.fogData,64,64);
  private ownedGeometries: T.BufferGeometry[] = [];
  private ownedMaterials: T.Material[] = [];
  private ringGeometry = new T.RingGeometry(.39,.46,32);
  private ringMaterial = new T.MeshBasicMaterial({color:0xf5df8c,side:T.DoubleSide,depthWrite:false});
  private marker: T.Mesh;
  private markerUntil = 0;
  private placement: T.Mesh;
  private placementMaterial = new T.MeshBasicMaterial({color:0x72ddab,transparent:true,opacity:.4,depthWrite:false,side:T.DoubleSide});
  private resizeObserver: ResizeObserver;
  private frame = 0;
  private frames = 0;
  private frameTimes: number[] = [];
  private lastTime = 0;
  private disposed = false;
  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new T.WebGLRenderer({canvas,antialias:true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.setClearColor(0x172b30);
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.scene.add(new T.HemisphereLight(0xffefd1,0x496660,2.4));
    const sun=new T.DirectionalLight(0xffe5bd,2.3); sun.position.set(-20,40,15); this.scene.add(sun);
    const groundGeometry=new T.PlaneGeometry(64,64);
    const groundMaterial=new T.MeshLambertMaterial({color:0x7a9261});
    this.ownedGeometries.push(groundGeometry,this.ringGeometry); this.ownedMaterials.push(groundMaterial,this.ringMaterial,this.placementMaterial);
    const ground=new T.Mesh(groundGeometry,groundMaterial); ground.rotation.x=-Math.PI/2; ground.position.set(32,0,32); this.scene.add(ground);
    // Ground coloration is cosmetic, fixed and independent of hidden map resources.
    const grid=new T.GridHelper(64,64,0x72855d,0x72855d); grid.position.set(32,.006,32); this.scene.add(grid); this.ownedGeometries.push(grid.geometry); this.ownedMaterials.push(...(Array.isArray(grid.material)?grid.material:[grid.material]));
    this.fogTexture.magFilter=T.NearestFilter; this.fogTexture.minFilter=T.NearestFilter;
    const fogMaterial=new T.MeshBasicMaterial({map:this.fogTexture,transparent:true,depthWrite:false}); this.ownedMaterials.push(fogMaterial);
    const fog=new T.Mesh(groundGeometry,fogMaterial); fog.rotation.x=-Math.PI/2; fog.position.set(32,.025,32); fog.renderOrder=2; this.scene.add(fog);
    this.marker=new T.Mesh(this.ringGeometry,this.ringMaterial); this.marker.rotation.x=-Math.PI/2; this.marker.visible=false; this.scene.add(this.marker);
    this.placement=new T.Mesh(this.factory.geometries.box,this.placementMaterial); this.placement.visible=false; this.scene.add(this.placement);
    this.writeFog([],[]);
    this.resizeObserver=new ResizeObserver(()=>this.resize()); this.resizeObserver.observe(canvas); this.resize();
    this.frame=requestAnimationFrame(t=>this.animate(t));
  }
  private resize(): void { const r=this.canvas.getBoundingClientRect(); this.renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false); const aspect=Math.max(1,r.width)/Math.max(1,r.height); this.camera.left=-this.span*aspect; this.camera.right=this.span*aspect; this.camera.top=this.span; this.camera.bottom=-this.span; this.camera.updateProjectionMatrix(); this.positionCamera(); }
  private positionCamera():void { this.camera.position.copy(this.center).add(new T.Vector3(18,27,18)); this.camera.lookAt(this.center); this.camera.updateMatrixWorld(); }
  private writeFog(visible:number[],explored:number[]):void {
    const seen=new Set(visible), known=new Set(explored);
    for(let z=0;z<64;z++) for(let x=0;x<64;x++) { const id=z*64+x, offset=((63-z)*64+x)*4; this.fogData[offset]=17;this.fogData[offset+1]=34;this.fogData[offset+2]=40;this.fogData[offset+3]=seen.has(id)?0:known.has(id)?145:255; }
    this.fogTexture.needsUpdate=true;
  }
  update(view:PlayerView,selected:ReadonlySet<number>):void {
    this.view=view; this.writeFog(view.visible,view.explored);
    const visibleCells = new Set(view.visible);
    // An absent entity may merely have left sight. Only permitted death events
    // authorize retaining a brief cosmetic corpse, never a selectable entity.
    for (const event of view.events) {
      if (event.name !== 'combat.unit_death' && event.name !== 'siege.building_collapse') continue;
      const key = `${event.id}:${event.entity ?? ''}:${event.name}`;
      if (this.deathEvents.has(key)) continue;
      this.deathEvents.add(key);
      if (this.deathEvents.size > 512) this.deathEvents.delete(this.deathEvents.values().next().value!);
      const visual = event.entity === undefined ? undefined : this.visuals.get(event.entity);
      const cell = Math.floor(event.z / 1000) * 64 + Math.floor(event.x / 1000);
      if (!visual || !visual.entity.visible || !visibleCells.has(cell)) continue;
      visual.ring.visible = false; visual.health.visible = false;
      this.visuals.delete(visual.entity.id);
      this.deaths.push({ group: visual.group, model: visual.model, start: performance.now(), building: visual.entity.kind === 'building', cell });
    }
    this.deaths = this.deaths.filter(death => {
      if (visibleCells.has(death.cell)) return true;
      this.scene.remove(death.group); return false;
    });
    const present=new Set<number>();
    for(const e of view.entities) {
      if(e.kind==='unit'&&!e.visible&&e.owner!==view.player) continue;
      present.add(e.id); let v=this.visuals.get(e.id);
      if(v&&(v.entity.visible!==e.visible||v.entity.def!==e.def)) {this.scene.remove(v.group);this.visuals.delete(e.id);v=undefined;}
      if(!v) {
        const group=new T.Group(),model=this.factory.create(e);group.add(model);
        const ring=new T.Mesh(this.ringGeometry,this.ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=.04;const size=e.kind==='building'?(CONTENT.buildings[e.def]?.size??2)*1.3:1;ring.scale.setScalar(size);group.add(ring);
        const health=new T.Group();health.position.y=e.kind==='building'?3.3:e.def==='scout'?2:1.4;
        const back=new T.Mesh(this.factory.geometries.box,this.factory.material(0x253b3b));back.scale.set(.85,.08,.025);health.add(back);
        const fill=new T.Mesh(this.factory.geometries.box,this.factory.material(e.owner===view.player?0x7bd9b3:0xed9474));fill.position.z=.02;health.add(fill);group.add(health);
        group.position.set(e.x/1000,0,e.z/1000);this.scene.add(group);
        v={group,model,ring,health,fill,entity:e,target:group.position.clone()};this.visuals.set(e.id,v);
      }
      v.entity=e;v.target.set(e.x/1000,0,e.z/1000);v.ring.visible=selected.has(e.id)&&e.visible;
      v.health.visible=e.visible&&e.kind!=='resource'&&(selected.has(e.id)||e.hp<e.maxHp);
      const hp=Math.max(0,Math.min(1,e.hp/e.maxHp));v.fill.scale.set(.8*hp,.045,.03);v.fill.position.x=-.4*(1-hp);
      v.model.scale.y=e.kind==='building'&&e.progress!==undefined?Math.max(.12,e.progress):1;
    }
    for(const [id,v] of this.visuals) if(!present.has(id)) {this.scene.remove(v.group);this.visuals.delete(id);}
  }
  private animate(time:number):void {
    if(this.disposed)return;const elapsed=this.lastTime?time-this.lastTime:16;const dt=Math.min(elapsed,100);this.lastTime=time;this.frames++;this.frameTimes.push(elapsed);if(this.frameTimes.length>1800)this.frameTimes.shift();
    for(const v of this.visuals.values()) {
      const d=v.group.position.distanceToSquared(v.target);if(d>.0001) {if(v.entity.kind==='unit')v.model.rotation.y=Math.atan2(v.target.x-v.group.position.x,v.target.z-v.group.position.z);v.group.position.lerp(v.target,1-Math.exp(-dt/55));}
      const active=v.entity.visible&&v.entity.kind==='unit';const action=v.entity.activity??'';
      v.model.position.y=active&&d>.002?Math.abs(Math.sin(time*.013+v.entity.id))*.055:0;
      v.model.rotation.z=active&&/gather|attack|build|repair/.test(action)?Math.sin(time*.012+v.entity.id)*.12:0;
      const rotor=v.model.getObjectByName('rotor');if(rotor&&v.entity.visible)rotor.rotation.z=time*.0006;
      v.health.quaternion.copy(this.camera.quaternion);
    }
    this.deaths = this.deaths.filter(death => {
      const age = (time - death.start) / 650;
      if (age >= 1) { this.scene.remove(death.group); return false; }
      if (death.building) death.model.scale.y = Math.max(.03, 1 - age);
      else { death.model.rotation.z = Math.min(1, age * 2) * Math.PI / 2; death.model.position.y = -.2 * age; }
      death.group.scale.setScalar(1 - Math.max(0, age - .6) * 2.4);
      return true;
    });
    this.marker.visible=time<this.markerUntil;if(this.marker.visible)this.marker.scale.setScalar(1+(this.markerUntil-time)/700);
    this.renderer.render(this.scene,this.camera);this.frame=requestAnimationFrame(t=>this.animate(t));
  }
  screenToWorld(clientX:number,clientY:number):Point|null {
    const rect=this.canvas.getBoundingClientRect();if(clientX<rect.left||clientX>rect.right||clientY<rect.top||clientY>rect.bottom)return null;
    this.ray.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),this.camera);
    const p=this.ray.ray.intersectPlane(this.plane,new T.Vector3());return p&&p.x>=0&&p.z>=0&&p.x<64&&p.z<64?{x:Math.round(p.x*1000),z:Math.round(p.z*1000)}:null;
  }
  pick(clientX:number,clientY:number):number|undefined {
    if(!this.screenToWorld(clientX,clientY))return undefined;
    const targets=[...this.visuals.values()].filter(v=>v.entity.visible||v.entity.owner===this.view?.player);
    const hits=this.ray.intersectObjects(targets.map(v=>v.model),true);for(const hit of hits){let o:T.Object3D|null=hit.object;while(o){const v=targets.find(v=>v.model===o);if(v)return v.entity.id;o=o.parent;}}return undefined;
  }
  selectRect(x1:number,y1:number,x2:number,y2:number):number[] {
    const rect=this.canvas.getBoundingClientRect(),ids:number[]=[];
    for(const v of this.visuals.values()) if(v.entity.kind==='unit'&&v.entity.owner===this.view?.player&&v.entity.visible){const p=v.group.position.clone().project(this.camera);const x=rect.left+(p.x+1)*rect.width/2,y=rect.top+(1-p.y)*rect.height/2;if(x>=Math.min(x1,x2)&&x<=Math.max(x1,x2)&&y>=Math.min(y1,y2)&&y<=Math.max(y1,y2)&&p.z>=-1&&p.z<=1)ids.push(v.entity.id);}return ids;
  }
  pan(dx:number,dz:number):void {this.center.x=T.MathUtils.clamp(this.center.x+dx,0,64);this.center.z=T.MathUtils.clamp(this.center.z+dz,0,64);this.positionCamera();}
  zoom(delta:number):void {this.span=T.MathUtils.clamp(this.span*Math.exp(delta*.001),5,32);this.resize();}
  focus(point:Point):void {this.center.set(T.MathUtils.clamp(point.x/1000,0,64),0,T.MathUtils.clamp(point.z/1000,0,64));this.positionCamera();}
  setPlacement(def:string|null,point?:Point,valid=true):void {this.placement.visible=!!def&&!!point;if(def&&point){const size=CONTENT.buildings[def]?.size??2;this.placement.scale.set(size,.15,size);this.placement.position.set(point.x/1000,.12,point.z/1000);this.placementMaterial.color.set(valid?0x72ddab:0xee775f);}}
  setOrderMarker(point:Point):void {this.marker.position.set(point.x/1000,.06,point.z/1000);this.markerUntil=performance.now()+700;}
  getCameraPosition():Point {return {x:Math.round(this.center.x*1000),z:Math.round(this.center.z*1000)};}
  getDiagnostics():{frames:number;frameTimes:number[];drawCalls:number;entities:number} {return {frames:this.frames,frameTimes:[...this.frameTimes],drawCalls:this.renderer.info.render.calls,entities:this.visuals.size};}
  dispose():void {this.disposed=true;cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.fogTexture.dispose();for(const g of this.ownedGeometries)g.dispose();for(const m of this.ownedMaterials)m.dispose();this.factory.dispose();this.scene.clear();this.visuals.clear();this.deaths=[];this.deathEvents.clear();this.renderer.dispose();}
}
