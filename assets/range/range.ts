import type {} from '@forgeax/engine/app';
import { Time, Update, type EntityHandle } from '@forgeax/engine/ecs';
import { createBoxGeometry, createMeshBuilder } from '@forgeax/engine/geometry';
import { FRAME_START_SCAN_SYSTEM_NAME, INPUT_SNAPSHOT_RESOURCE_KEY, type InputSnapshot } from '@forgeax/engine/input';
import { color, mat4, quat } from '@forgeax/engine/math';
import type { Plugin } from '@forgeax/engine/plugin';
import { Camera, DirectionalLight, Fog, FogModeValue, Instances, Materials, MeshFilter, MeshRenderer, PointLight, ShadowParticipation, Skylight, perspective } from '@forgeax/engine/render';
import { Transform } from '@forgeax/engine/scene';
import type { Asset, AssetHandle, MeshAsset } from '@forgeax/engine/types';
import { FragmentPool, PARTS, SMALL_LIMIT, hitPart, createBodyDamage, breakAt, type BodyDamage, type Hit, type Fragment, type Box, type Vec3 } from './fracture.ts';
import { bodyScale, createMotion, fragmentPose, localPoint, localVector, movementMode, toWorld, walk, type Motion } from './motion.ts';
import { woundDetails } from './wounds.ts';
import { BloodPool, BLOOD_COLORS, BLOOD_LIMIT } from './blood.ts';
import { SHOTGUN_PELLETS } from './weapons.ts';
import { GUNS, ARMORY, BOUNTY, MOSIN_IMPACT, nextZoom, scopeFov, shotOffset, ammunition, equip, otherCarriedGun, initialWallet, restoreWallet, refill, type Gun } from './loadout.ts';
import { gunBoxes, type ViewPiece, sightHeight, gunColors, supportHand, feedBoxes, reloadPose } from './gun-model.ts';
import { Field } from './field.ts';
import { fieldColors, fieldModel, stationPositions, soldierIds, SHOULDER, HEAVY_PIVOT, SIGHT_RISE } from './field-models.ts';
import { purchase } from './loadout.ts';
import { orderName, techById } from './technology.ts';
import { waveCount, waveChoices } from './waves.ts';
import { DECK, DECK_HALF, WALK_X, FENCE_Z, MAX_LIVE, entryKind, entryPath, panel, fenceBays, yardLights, outpost, gate, colors } from './outpost.ts';
import { surfaceTexture, type Surface } from './surfaces.ts';
import { district, districtColors, firstBuilding } from './district.ts';
import { outfits, bodyColors, firstFleshColor, compactVoxels, visibleRuns, type VoxelRun, dressVoxel } from './outfits.ts';

type Phase = 'intro' | 'run' | 'down' | 'supply' | 'choose';
type Zombie = {
  source:string; position: Vec3; route:Vec3[]; waypoint:number; motion: Motion; body: BodyDamage; remainsUntil: number; swing:number; outfit:number;
  wounds: number[]; damaged: Map<number, EntityHandle>; dirty: Set<number>;
};

const cube = createBoxGeometry(1, 1, 1).unwrap();
const palette = bodyColors.map(hex => color.linearRgb(Number.parseInt(hex.slice(1), 16)));
const zero: Vec3 = [0, 0, 0];
const unit: Vec3 = [1, 1, 1];
const up: Vec3 = [0, 1, 0];
const emptyTransforms = new Float32Array(0);
const remainsLifetime = 6.5;
const remainsShrinkTime = 0.45;


function remainsMesh(): MeshAsset {
  const colors = [0x661623, 0x942333, 0xc93a47, 0xe77766, 0x592929].map(hex => color.linearRgb(hex));
  const boxes: Box[] = [];
  const tile = 0.15;
  for (let x = -5; x <= 5; x++) {
    for (let z = -4; z <= 4; z++) {
      const distance = Math.hypot(x / 5, z / 4);
      const variation = (x * x + 3 * z * z + x * z) % 7;
      if (distance > 1.06 || (distance > 0.78 && variation < 2)) continue;
      boxes.push({ x: x * tile, y: 0.007 + variation * 0.001, z: z * tile,
        sx: tile, sy: 0.014, sz: tile, color: distance > 0.75 || variation < 2 ? 0 : 1 });
    }
  }
  for (let i = 0; i < 25; i++) {
    const angle = i * 2.399963;
    const distance = Math.sqrt(i / 25);
    const height = 0.04 + (1 - distance) * 0.23 + (i % 3) * 0.018;
    boxes.push({ x: Math.cos(angle) * distance * 0.69, y: 0.02 + height / 2,
      z: Math.sin(angle) * distance * 0.54, sx: 0.10 + (i % 4) * 0.04, sy: height,
      sz: 0.10 + (i % 3) * 0.045, color: i % 5 === 1 ? 3 : i % 5 === 2 ? 4 : 2 });
  }
  return mergeBoxes(boxes, zero, colors);
}

function mergeBoxes(boxes: readonly Box[], pivot: Vec3, colors = palette, tileSize=0): MeshAsset {
  const positions = cube.attributes.position as Float32Array;
  const sourceNormals = cube.attributes.normal as Float32Array;
  const sourceUvs = cube.attributes.uv as Float32Array;
  const sourceTangents = cube.attributes.tangent as Float32Array;
  const vertices = new Float32Array(positions.length * boxes.length);
  const normals = new Float32Array(vertices.length);
  const uvs = new Float32Array((vertices.length / 3) * 2);
  const rgba = new Float32Array((vertices.length / 3) * 4);
  const tangents = new Float32Array(rgba.length);
  const sourceIndices = cube.indices!;
  const indices = new Uint32Array(sourceIndices.length * boxes.length);
  const verticesPerBox = positions.length / 3;
  for (const [n, b] of boxes.entries()) {
    for (let v = 0; v < verticesPerBox; v++) {
      const src = v * 3;
      const dst = (n * verticesPerBox + v) * 3;
      vertices[dst] = positions[src] * b.sx + b.x - pivot[0];
      vertices[dst + 1] = positions[src + 1] * b.sy + b.y - pivot[1];
      vertices[dst + 2] = positions[src + 2] * b.sz + b.z - pivot[2];
      const ci = (n * verticesPerBox + v) * 4;
      const tint = colors[b.color];
      rgba[ci] = tint[0]; rgba[ci + 1] = tint[1]; rgba[ci + 2] = tint[2]; rgba[ci + 3] = 1;
    }
    normals.set(sourceNormals, n * positions.length);
    if(tileSize){
      for(let v=0;v<verticesPerBox;v++){
        const src=v*3,dst=(n*verticesPerBox+v)*3,i=(n*verticesPerBox+v)*2;
        uvs[i]=vertices[dst+(sourceNormals[src]!==0?2:0)]/tileSize;
        uvs[i+1]=vertices[dst+(sourceNormals[src+1]!==0?2:1)]/tileSize;
      }
    }else uvs.set(sourceUvs, n * verticesPerBox * 2);
    tangents.set(sourceTangents, n * verticesPerBox * 4);
    for (let i = 0; i < sourceIndices.length; i++) {
      indices[n * sourceIndices.length + i] = sourceIndices[i] + n * verticesPerBox;
    }
  }
  const attributes = { position: vertices, normal: normals, tangent: tangents, uv: uvs, color: rgba };
  return createMeshBuilder({ attributes, indices }).build().unwrap();
}

// Chamfered cross sections catch light on the first-person silhouettes at every view angle.
function viewModel(pieces:readonly ViewPiece[], colors:ReturnType<typeof color.linearRgb>[]):MeshAsset {
  const position:number[]=[],normal:number[]=[],rgba:number[]=[],indices:number[]=[];
  const uv:number[]=[],tangent:number[]=[];
  for(const b of pieces){
    const tint=colors[b.color];
    const ring=(end:number):Vec3[]=>{
      const scale=end<0?(b.taper??1):1;
      const w=b.sx*scale/2,h=b.sy*scale/2,cut=Math.min(w,h)*.46;
      const cy=b.y+end*(b.rise??0)*.5,turn=b.roll??0;
      return [[-w+cut,-h],[w-cut,-h],[w,-h+cut],[w,h-cut],[w-cut,h],[-w+cut,h],[-w,h-cut],[-w,-h+cut]]
        .map(([x,y])=>[b.x+x*Math.cos(turn)-y*Math.sin(turn),cy+x*Math.sin(turn)+y*Math.cos(turn),b.z+end*b.sz/2]);
    };
    const face=(vertices:Vec3[])=>{
      const start=position.length/3;
      const edge=normalized(sub(vertices[1],vertices[0]));
      const n=normalized(cross(edge,sub(vertices[2],vertices[0])));
      for(const v of vertices){
        position.push(...v);normal.push(...n);rgba.push(tint[0],tint[1],tint[2],1);uv.push(0,0);tangent.push(...edge,1);
      }
      for(let i=1;i+1<vertices.length;i++)indices.push(start,start+i,start+i+1);
    };
    const front=ring(-1),rear=ring(1);
    face([...front].reverse());face(rear);
    for(let i=0;i<8;i++){const next=(i+1)%8;face([front[i],front[next],rear[next],rear[i]]);}
  }
  return createMeshBuilder({attributes:{position:Float32Array.from(position),normal:Float32Array.from(normal),
    color:Float32Array.from(rgba),uv:Float32Array.from(uv),tangent:Float32Array.from(tangent)},indices:Uint32Array.from(indices)}).build().unwrap();
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalized(v: Vec3): Vec3 {
  const length = Math.hypot(...v);
  return [v[0] / length, v[1] / length, v[2] / length];
}

function fleshChips(boxes: readonly Box[], budget: number): Box[] {
  const count = Math.min(budget, boxes.length);
  return Array.from({ length: count }, (_, i) => {
    const { x, y, z } = boxes[Math.floor((i + 0.5) * boxes.length / count)];
    const size = 0.075 + (i % 4) * 0.022;
    const shade = i % 4 === 0 ? 2 : i % 3 === 0 ? 1 : 0;
    return { x, y, z, sx: size, sy: size * 0.85, sz: size, color: firstFleshColor + shade };
  });
}

function fleshClump({ x, y, z }: Box, index: number): Box[] {
  const size = 0.19 + (index % 3) * 0.04;
  const side = index % 2 ? -1 : 1;
  const accent = size * 0.64;
  return [
    { x, y, z, sx: size, sy: size * 0.86, sz: size, color: firstFleshColor + index % 2 },
    { x: x + side * size * 0.52, y: y + size * 0.25, z: z + size * 0.21,
      sx: accent, sy: accent, sz: accent, color: firstFleshColor + 2 },
  ];
}

export const voxelRange: Plugin.Object = {
  name: 'voxel-zombie-range',
  inject: ['world', 'assets', 'gameHost'],
  apply(ctx) {
    if (!ctx.gameHost || !ctx.assets) throw new Error('Voxel range needs a game host and asset registry');
    const { world } = ctx;
    const gameHost = ctx.gameHost;
    const assets = ctx.assets;
    ctx.effect(() => {
      const owned: AssetHandle[] = [];
      const retain = <T extends Asset>(asset: T) => {
        const handle = assets.create(asset).unwrap();
        owned.push(handle);
        return handle;
      };
      const boxMesh = retain(cube);
      const bodyMaterial = retain(Materials.standard({ baseColor: '#ffffff', roughness: 0.83 }));
      const chipMats = bodyColors.map(hex => retain(Materials.standard({ baseColor: hex, roughness: 0.81 })));
      const footMaterial = retain(Materials.unlit('#101a21'));
      const spawned: EntityHandle[] = [];
      const dynamicEntities = new Set<EntityHandle>();
      const mesh = (assetHandle: AssetHandle<'mesh'>, material: AssetHandle<'material'>, pos: Vec3, scale: Vec3) => {
        const entity = world.spawn(
          { component: Transform, data: { pos, scale } },
          { component: MeshFilter, data: { assetHandle } },
          { component: MeshRenderer, data: { materials: [material] } },
        ).unwrap();
        spawned.push(entity);
        return entity;
      };
      // Draw a subpixel instance behind the title overlay so the first shot can reuse
      // the combat material pipelines. No live ammunition or gameplay state is used.
      let warmFrames=3;
      const warmTransform=mat4.create();
      mat4.compose(warmTransform,[0,DECK+1,-2],quat.create(),[.001,.001,.001]);
      const batch = (assetHandle: AssetHandle<'mesh'>, material: AssetHandle<'material'>, capacity: number, castsShadow = true, warm=false) => {
        const entity = world.spawn(
          { component: Transform, data: {} },
          { component: MeshFilter, data: { assetHandle } },
          { component: MeshRenderer, data: { materials: [material] } },
          { component: Instances, data: { transforms: emptyTransforms } },
        ).unwrap();
        if (!castsShadow) world.addComponent(entity, { component: ShadowParticipation, data: { cast: false } }).unwrap();
        spawned.push(entity);
        const buffer = new Float32Array(capacity * 16);
        let size = 0;
        let published = 0;
        return {
          clear() { size = 0; },
          push(matrix: Float32Array) {
            if (size === capacity) return false;
            buffer.set(matrix, size++ * 16);
            return true;
          },
          publish() {
            if(warm && warmFrames>0 && !size){buffer.set(warmTransform);size=1;}
            if (size !== published) {
              world.set(entity, Instances, { transforms: size ? buffer.subarray(0, size * 16) : emptyTransforms }).unwrap();
              published = size;
            } else if (size) {
              world.setArrayRange(entity, Instances, 'transforms', 0, buffer.subarray(0, size * 16)).unwrap();
            }
          },
        };
      };

      const tintPalette = (hexes: string[]) => hexes.map(hex => color.linearRgb(parseInt(hex.slice(1), 16)));
      const sceneColors=tintPalette(colors);
      mesh(retain(viewModel(outpost,sceneColors)),bodyMaterial,zero,unit);
      const masonry=new Set(['#ac8771','#bba88b','#9d7c68','#916b58','#a77b62','#ac8a77']);
      const groups:Record<Surface|'plain',Box[]>={masonry:[],concrete:[],gravel:[],plain:[]};
      for(const piece of district){
        const hex=districtColors[piece.color];
        const kind=masonry.has(hex)?'masonry':hex==='#69695e'||hex==='#786f59'?'gravel':
          Math.max(piece.sx,piece.sy,piece.sz)>=6?'concrete':'plain';
        groups[kind].push(piece);
      }
      const facadeColors=tintPalette(districtColors);
      mesh(retain(mergeBoxes(groups.plain,zero,facadeColors)),bodyMaterial,zero,unit);
      for(const surface of ['masonry','concrete','gravel'] as const){
        const texture=retain(surfaceTexture(surface));
        const material=retain(Materials.standard({baseColor:'#ffffff',baseColorTexture:texture,roughness:surface==='gravel'?.64:.91}));
        mesh(retain(mergeBoxes(groups[surface],zero,facadeColors,4)),material,zero,unit);
      }
      const singlePanel=retain(viewModel(panel,sceneColors));
      const eightPanels=Array.from({length:8},(_,i)=>panel.map(b=>({...b,x:b.x+i*3}))).flat();
      const panelGroup=retain(viewModel(eightPanels,sceneColors));
      for(let i=0;i<fenceBays.length;){
        const bay=fenceBays[i], grouped=fenceBays[i+7]===bay+7;
        mesh(grouped?panelGroup:singlePanel,bodyMaterial,[bay*3,0,0],unit);
        i+=grouped?8:1;
      }
      const fence=mesh(retain(viewModel(gate,sceneColors)),bodyMaterial,zero,unit);
      const lampWarm=retain(Materials.unlit('#ffc88b')), lampAlarm=retain(Materials.unlit('#ee6048'));
      for(const [x,y,z] of yardLights){
        mesh(boxMesh,lampWarm,[x,y-.06,z-.24],[.6,.18,.045]);
        mesh(boxMesh,lampAlarm,[x,y+.25,z],[.14,.18,.14]);
        spawned.push(world.spawn({component:Transform,data:{pos:[x,y-.45,z-.7]}},
          {component:PointLight,data:{color:color.linearRgb(0xffb371),intensity:56,range:12}}).unwrap());
      }
      const crowdSize=MAX_LIVE+8;
      const gunMeshes = Object.fromEntries(GUNS.map(g => [g, retain(viewModel(gunBoxes(g), tintPalette(gunColors))) ])) as Record<Gun, AssetHandle<'mesh'>>;
      const viewGun = mesh(gunMeshes.g18, bodyMaterial, [0,-20,0], unit);
      const gunPalette=tintPalette(gunColors);
      const hand=mesh(retain(viewModel(supportHand,gunPalette)),bodyMaterial,[0,-20,0],unit);
      const feeds=Object.fromEntries(GUNS.map(g=>[g,retain(viewModel(feedBoxes(g),gunPalette))])) as Record<Gun,AssetHandle<'mesh'>>;
      const feed=mesh(feeds.g18,bodyMaterial,[0,-20,0],unit);
      const legBatches=PARTS.slice(4).map(part=>batch(retain(mergeBoxes(part.intact,zero)),bodyMaterial,crowdSize));
      const outfitsByPart=outfits.map((_,outfit)=>PARTS.map((part,index)=>{
        const painted=part.boxes.map(box=>dressVoxel(outfit,index,box));
        const runs:VoxelRun[]=[];
        const compact=compactVoxels(painted,runs);
        return {painted,runs,compact};
      }));
      const bodiesByOutfit=outfitsByPart.map(parts=>[
        ...parts.slice(0,4).map(part=>batch(retain(mergeBoxes(part.compact,zero)),bodyMaterial,crowdSize)),...legBatches
      ]);
      const bodyBatches=[...new Set(bodiesByOutfit.flat())];
      const largeMeshes = new Map<Readonly<Fragment>, { entity: EntityHandle; generation: number }>();
      const tracerBatch = batch(boxMesh, retain(Materials.unlit('#ffe29a')), 36,true,true);
      const tracers: { start: Vec3; end: Vec3; life: number; width: number }[] = [];
      const bloodBatches = BLOOD_COLORS.map(hex => batch(boxMesh, retain(Materials.unlit(hex)), BLOOD_LIMIT,true,true));
      const chipBatches = chipMats.map(material => batch(boxMesh, material, SMALL_LIMIT,true,true));
      const remainsBatch = batch(retain(remainsMesh()), bodyMaterial, crowdSize,true,true);
      let remainsCount = 0;
      const footBatch = batch(boxMesh, footMaterial, crowdSize);

      const fieldActors=new Map<string,EntityHandle>();
      const modelColors=tintPalette(fieldColors);
      const fieldMeshes=new Map<string,AssetHandle<'mesh'>>();
      function placeFieldPart(id:string,model:string,pos:Vec3|null,yaw:number,pitch=0){
        let entity=fieldActors.get(id);
        if(!entity && !pos)return;
        if(!entity){
          let handle=fieldMeshes.get(model);
          if(!handle){handle=retain(viewModel(fieldModel(model),modelColors));fieldMeshes.set(model,handle);}
          entity=mesh(handle,bodyMaterial,pos!,unit);fieldActors.set(id,entity);
        }
        world.set(entity,Transform,{pos:pos??[0,-80,0],quat:quat.fromEuler(quat.create(),pitch,yaw,0,'YXZ')}).unwrap();
      }
      function poseField(id:string,pos:Vec3|null,yaw=0,pitch=0,recoil=0,stride=0){
        if(id==='heavy'){
          placeFieldPart(id,id,pos,0);
          const slide=recoil*recoil*.064;
          placeFieldPart('heavyGun','heavyGun',pos && [pos[0]+Math.sin(yaw)*slide,pos[1]+HEAVY_PIVOT,pos[2]+Math.cos(yaw)*slide],yaw,pitch+slide*.22);
        }else if(soldierIds.includes(id)){
          for(const side of [-1,1]){
            const leg=side<0?'legLeft':'legRight',step=stride*side*.15;
            placeFieldPart(id+leg,leg,pos && [pos[0]+Math.sin(yaw)*step,pos[1]+Math.max(0,step)*.36,pos[2]+Math.cos(yaw)*step],yaw);
          }
          const back=.065*recoil,upper=id==='crew'?'crewUpper':'upper';
          placeFieldPart(id+'upper',upper,pos && [pos[0]+Math.sin(yaw)*back,pos[1]+SHOULDER-.028*recoil,
            pos[2]+Math.cos(yaw)*back],yaw,pitch+.09*recoil);
        }else placeFieldPart(id,id,pos,yaw,pitch);
      }
      const bursts:{pos:Vec3;radius:number;life:number}[]=[];
      const sparks=batch(boxMesh,retain(Materials.unlit('#ffac51')),72,false);
      const smoke=batch(boxMesh,retain(Materials.standard({baseColor:'#525959',roughness:1})),72,false);
      const mist=color.linearRgb(0x455553);
      const fog=world.spawn({component:Fog,data:{mode:FogModeValue.linear,color:mist,near:23,far:113,maxOpacity:.98}}).unwrap();
      const rainCount=620;
      const rainfall=batch(boxMesh,retain(Materials.unlit('#798a8c')),rainCount,false);
      const rainRotation=quat.fromEuler(quat.create(),0,0,.13,'XYZ');
      // Conservative radius of the largest .013 × .30 × .013 rain box.
      const rainRadius=.16;
      // Stable world-space seeds keep the streaks falling past the player during turns.
      const drops=Array.from({length:rainCount},(_,i)=>{
        const hash=(k:number)=>{const v=Math.sin(i*93.37+k*17.31)*43758.54;return v-Math.floor(v);};
        const matrix=mat4.create();
        mat4.compose(matrix,zero,rainRotation,[.013,.16+hash(5)*.14,.013]);
        return {x:hash(1)*32,y:hash(2)*12,z:hash(3)*32,speed:8+hash(4)*4,matrix};
      });
      const wrap=(v:number,span:number)=>v-span*Math.floor(v/span);
      const light = world.spawn({ component: DirectionalLight, data: {
        direction: [0.66, -0.51, -0.55], color: color.linearRgb(0xc1d7d1), intensity: 1.18, castShadow:true,
      } }).unwrap();
      const rim = world.spawn({ component: DirectionalLight, data: {
        direction: [-0.72, -0.42, 0.45], color: color.linearRgb(0xffad6c), intensity: .57,
      } }).unwrap();
      const ambient = world.spawn({ component: Skylight, data: {
        color: color.linearRgb(0xb3c2cd), groundColor: color.linearRgb(0x53565b), intensity: .60,
      } }).unwrap();
      const camera = world.spawn({ component: Transform, data: {} }, {
        component: Camera, data: perspective({ fov: 1.24, aspect: 16/9, near: .035, far: 385 }),
      }).unwrap();
      spawned.push(fog, light, rim, ambient, camera);
      const port = gameHost.port;
      const fragments = new FragmentPool();
      const blood = new BloodPool();
      const transform = mat4.create();
      const rotation = quat.create();
      const particleScale: Vec3 = [1, 1, 1];
      const zombies: Zombie[] = [];
      let phase: Phase = 'intro';
      let wave=1, spawnedCount=0, spawnIn=0;
      let hp = 100, kills = 0, shots = 0, hurt = 0;
      let weapon: Gun = 'g18', wallet = initialWallet(), ammo = ammunition(), restored = false;
      let field:Field|null=null;
      let blastCount=0;
      let zoom=2;
      let cooldown = 0, reload = 0, aiming = false, recoil = 0, aimBlend = 0;
      let kick=0,sway=0;
      let lastImpact: {part:number;collapsed:boolean}|null=null;
      let lastSpread={x:0,y:0};
      let notice='',noticeFor=0,hitMarker=0;
      let x=0,z=1.85,feet=DECK,jumpSpeed=0,yaw=0,pitch=-.18,stride=0;
      let eye: Vec3 = [0,DECK+1.68,3.4], forward: Vec3 = [0,0,-1], right: Vec3 = [1,0,0], vertical: Vec3 = [0,1,0];
      let width = 0, height = 0, lastFov = -1, lastState = 0;
      function snapshot() {
        return {phase,hp,kills,shots,weapon,cash:wallet.cash,owned:wallet.owned,bestWave:wallet.bestWave,
          tech:wallet.tech,carried:[wallet.primary,wallet.secondary].filter(Boolean),trial:wallet.trial,order:field?.order?orderName(field.order):'',calls:field?.calls??0,
          blastCount,truckDocked:(field?.arrival??0)>=4,commandCount:field?.orders().length??0,truckUses:field?.truckUses??0,dropIn:field?.dropIn??0,dropWaiting:!!field?.drop && field.dropIn===0,
          mounted:field?.mounted??null,mountAmmo:field?.mounted?field.belts[field.mounted]:0,
          prompt:field?.prompt([x,feet,z])??'',wave,total:waveCount(wave),spawned:spawnedCount,choices:waveChoices(wallet.bestWave,wave),
          zoom,loaded:ammo[weapon].loaded,spare:ammo[weapon].spare,aiming,reload,hitMarker,hurt,notice,ready:restored && !warmFrames};
      }
      function state() { port?.postMessage({ type: 'state', ...snapshot() }); }
      function save() { if (restored) port?.postMessage({ type: 'save', wallet }); }
      function tell(text: string, duration = 1.7) { notice = text; noticeFor = duration; }
      function finishWave(cleared:boolean){
        phase=cleared?'supply':'down';if(field)field.mounted=null;aiming=false;reload=0;
        gameHost.setPointerLockAllowed?.(false);
        if(cleared)wallet.bestWave=Math.max(wallet.bestWave,wave);
        else world.set(fence,Transform,{pos:[0,-2.7,0]}).unwrap();
        save();state();
      }

      function renderLarge(fragment: Readonly<Fragment>) {
        let entry = largeMeshes.get(fragment);
        if (!entry || entry.generation !== fragment.generation) {
          const handle = assets.create(mergeBoxes(fragment.boxes, fragment.pivot)).unwrap();
          if (entry) world.set(entry.entity, MeshFilter, { assetHandle: handle }).unwrap();
          else {
            entry = { entity: world.spawn(
              { component: Transform, data: {} }, { component: MeshFilter, data: { assetHandle: handle } },
              { component: MeshRenderer, data: { materials: [bodyMaterial] } },
            ).unwrap(), generation: fragment.generation };
            dynamicEntities.add(entry.entity);
            largeMeshes.set(fragment, entry);
          }
          entry.generation = fragment.generation;
          assets.release(handle).unwrap();
        }
        world.set(entry.entity, Transform, { pos: fragment.position, quat: rotation }).unwrap();
      }

      function placeCamera() {
        const viewport = gameHost.drawingBufferSize?.();
        const scoped=weapon==='mosin' && !field?.mounted;
        const aimFov=scoped?scopeFov(zoom):.93;
        const fov=1.25+(aimFov-1.25)*aimBlend;
        eye = [x,1.68+feet+Math.sin(stride)*.026,z];
        const viewPitch=Math.max(-1.42,Math.min(1.42,pitch+kick));
        forward = [Math.sin(yaw+sway)*Math.cos(viewPitch),Math.sin(viewPitch),-Math.cos(yaw+sway)*Math.cos(viewPitch)];
        right=normalized(cross(forward,up)); vertical=cross(right,forward);
        if(field?.mounted==='heavy'){
          const seat=stationPositions.heavy;
          eye=seat.map((n,i)=>n+(i===1?HEAVY_PIVOT:0)-forward[i]*.72+vertical[i]*(SIGHT_RISE+.055*(1-aimBlend))) as Vec3;
          field.trackMount(yaw+sway,viewPitch);
        }
        const target = eye.map((n,i)=>n+forward[i]) as Vec3;
        const q=quat.fromLookAt(rotation,eye,target,up);
        world.set(camera,Transform,{pos:eye,quat:q}).unwrap();
        const w=viewport?.width||1280, h=viewport?.height||720;
        if(width!==w || height!==h || Math.abs(lastFov-fov)>.0003) {
          width=w;height=h;lastFov=fov;
          world.set(camera, Camera, { ...perspective({fov,aspect:w/h,near:.035,far:385}), clearColor:[mist[0],mist[1],mist[2],1] }).unwrap();
        }
        const progress=reload>0?1-reload/ARMORY[weapon].reload:0;
        const pose=reloadPose(weapon,progress);
        const offX=.22*(1-aimBlend)-pose.lift*.6, offY=-.22*(1-aimBlend)-sightHeight[weapon]*aimBlend+pose.lift;
        const gunPos=eye.map((n,i)=>n+forward[i]*(.50+({g18:.015,ak:.13,shotgun:.14,mosin:.145,lmg:.14,rocket:.18}[weapon])*aimBlend-.055*recoil)+right[i]*offX+vertical[i]*offY) as Vec3;
        const cos=Math.cos(pose.cant),sin=Math.sin(pose.cant);
        const gunUp=vertical.map((n,i)=>n*cos+right[i]*sin) as Vec3;
        const gunDirection=normalized(forward.map((n,i)=>n-right[i]*.19*(1-aimBlend)+vertical[i]*.068*(1-aimBlend)) as Vec3);
        const gunTarget=eye.map((n,i)=>n+gunDirection[i]) as Vec3;
        const oriented=quat.fromLookAt(rotation,eye,gunTarget,gunUp);
        const rigRight=normalized(cross(gunDirection,gunUp)),rigUp=cross(rigRight,gunDirection);
        const attach=(entity:EntityHandle,offset:Vec3,visible=true)=>{
          const pos=gunPos.map((n,i)=>n+rigRight[i]*offset[0]+rigUp[i]*offset[1]-gunDirection[i]*offset[2]) as Vec3;
          world.set(entity,Transform,{pos:phase==='run' && !field?.mounted && visible && !(scoped && aimBlend>.90)?pos:[0,-20,0],quat:oriented}).unwrap();
        };
        attach(viewGun,zero);
        attach(hand,pose.hand);
        attach(feed,pose.feed,(weapon!=='shotgun' && weapon!=='mosin')||progress>.12 && progress<.88);
      }

      function beginWave(level:number){
        if(!restored || warmFrames || phase==='run' || !Number.isSafeInteger(level) || level<1 || level>wallet.bestWave+1)return;
        for(const entity of dynamicEntities)world.despawn(entity).unwrap();
        dynamicEntities.clear();largeMeshes.clear();zombies.length=0;tracers.length=0;blood.clear();fragments.reset();
        wave=level;spawnedCount=0;spawnIn=0;hp=100;kills=shots=0;
        x=0;z=1.85;feet=DECK;jumpSpeed=0;yaw=0;pitch=-.18;stride=0;
        hurt=hitMarker=cooldown=reload=aimBlend=recoil=kick=sway=0;aiming=false;lastImpact=null;
        ammo=ammunition(wallet.tech.includes('pouch'));
        bursts.length=0;blastCount=0;
        field=new Field({pose:poseField,target:fieldTarget,round:fieldRound,tell,save},wallet,ammo);
        notice='';noticeFor=0;phase='run';
        world.set(fence,Transform,{pos:zero}).unwrap();
        gameHost.setPointerLockAllowed?.(true);placeCamera();state();
      }
      function reinforce(dt:number){
        spawnIn-=dt;
        if(spawnIn>0 || spawnedCount>=waveCount(wave) || zombies.filter(v=>!v.body.destroyed).length>=MAX_LIVE)return;
        const route=entryPath(spawnedCount,wave),position:Vec3=[...route[0]];
        const zombie:Zombie={source:entryKind(spawnedCount,wave),position,route,waypoint:1,motion:createMotion(),body:createBodyDamage(),swing:0,
          outfit:(spawnedCount*8+wave-1)%outfits.length,remainsUntil:0,damaged:new Map(),dirty:new Set(),wounds:[0,0,0,0,0,0]};
        walk(zombie.motion,zombie.body,position,route[1],0,0);
        zombies.push(zombie);spawnedCount++;spawnIn=Math.max(.28,2.1-wave*.12);
      }

      function updateDamagedMesh(zombie: Zombie, part: number) {
        const old = zombie.damaged.get(part);
        const {runs,painted}=outfitsByPart[zombie.outfit][part];
        const boxes=visibleRuns(runs,painted,zombie.body.alive[part]);
        const wounds = boxes.length ? woundDetails(zombie.body, part) : [];
        zombie.wounds[part] = wounds.length;
        if (!boxes.length) {
          if (old !== undefined) { world.despawn(old).unwrap(); dynamicEntities.delete(old); }
          zombie.damaged.delete(part);
          return;
        }
        const handle = assets.create(mergeBoxes([...boxes, ...wounds], zero)).unwrap();
        if (old !== undefined) world.set(old, MeshFilter, { assetHandle: handle }).unwrap();
        else {
          const entity = world.spawn(
            { component: Transform, data: { pos: zombie.position } },
            { component: MeshFilter, data: { assetHandle: handle } },
            { component: MeshRenderer, data: { materials: [bodyMaterial] } },
          ).unwrap();
          dynamicEntities.add(entity);
          zombie.damaged.set(part, entity);
        }
        assets.release(handle).unwrap();
      }

      function damage(zombie: Zombie, hit: Hit, direction: Vec3, effects: boolean, bloodCount = 26, strength=1) {
        const pose = zombie.motion.parts[hit.part];
        const previousLimbs = zombie.body.missingLimbs;
        const result = breakAt(zombie.body, hit, normalized(localVector(pose, direction)),strength);
        lastImpact={part:hit.part,collapsed:result.collapsed};
        if (!result.removed.length) return;
        if (result.collapsed && effects) zombie.remainsUntil = world.getResource(Time).elapsed + remainsLifetime;
        const near = Math.hypot(eye[0] - zombie.position[0], eye[2] - zombie.position[2]) < 13;
        const amount = near ? 16 : 4;
        if (effects) {
          if (bloodCount) blood.spray(toWorld(pose, hit.point), direction, result.collapsed ? bloodCount * 2 : bloodCount);
          const chipBudget = amount;
          const chips = result.collapsed ? fleshChips(result.removed, chipBudget) : result.removed.map(box=>dressVoxel(zombie.outfit,hit.part,box));
          fragments.spawn(hit.part, hit.point, zombie.position, zombie.motion.yaw, direction, chipBudget, chips, [], fragmentPose(pose));
          for (const chunk of result.detached) {
            const detachedPose = fragmentPose(zombie.motion.parts[chunk.part]);
            if (!result.collapsed) {
              fragments.spawn(chunk.part, hit.point, zombie.position, zombie.motion.yaw, direction, amount, [], chunk.boxes.map(box=>dressVoxel(zombie.outfit,chunk.part,box)), detachedPose);
              continue;
            }
            const looseFlesh = fleshChips(chunk.boxes, near ? 6 : 4);
            fragments.spawn(chunk.part, hit.point, zombie.position, zombie.motion.yaw, direction, amount, looseFlesh, [], detachedPose);
            const clumps = Math.min(near ? 3 : 2, Math.ceil(chunk.boxes.length / 30));
            for (let i = 0; i < clumps; i++) {
              const index = chunk.part * 3 + i;
              const origin = chunk.boxes[Math.floor((i + 0.5) * chunk.boxes.length / clumps)];
              const angle = index * 2.399963;
              const outward: Vec3 = [Math.cos(angle), 0, Math.sin(angle)];
              fragments.spawn(chunk.part, hit.point, zombie.position, zombie.motion.yaw, outward, amount, [], fleshClump(origin, index), detachedPose);
            }
          }
        }
        const lostLimbs = zombie.body.missingLimbs ^ previousLimbs;
        if (lostLimbs) zombie.dirty.add(0);
        for (let part = 0; part < PARTS.length; part++) {
          if (part === hit.part || result.collapsed || (lostLimbs & (1 << part))) zombie.dirty.add(part);
        }
        hitMarker = .16;
        if (result.collapsed) { kills++; wallet.cash += BOUNTY; tell('击杀  +$'+BOUNTY); save(); }
      }

      function nearest(origin: Vec3, direction: Vec3, wall: number,skip?:Zombie) {
        let closest = wall;
        let result: { zombie: Zombie; hit: Hit } | undefined;
        for (const zombie of zombies) {
          if (zombie.body.destroyed || zombie===skip) continue;
          const dx = zombie.position[0] - origin[0], dy = zombie.position[1]+1.1 - origin[1], dz = zombie.position[2] - origin[2];
          const along = Math.max(0, dx * direction[0] + dy * direction[1] + dz * direction[2]);
          if (dx * dx + dy * dy + dz * dz - along * along > 6.25) continue;
          for (const [part, pose] of zombie.motion.parts.entries()) {
            if (zombie.body.missingLimbs & (1 << part)) continue;
            const hit = hitPart(localPoint(pose, origin), localVector(pose, direction), zombie.body, part, closest);
            if (!hit) continue;
            closest = hit.t;
            result = { zombie, hit };
          }
        }
        return result;
      }

      function aimPoint():Vec3{
        const ground=forward[1]<-.001?Math.min(100,-eye[1]/forward[1]):100;
        const wall=firstBuilding(eye,forward,ground), hit=nearest(eye,forward,wall);
        return eye.map((v,i)=>v+forward[i]*(hit?.hit.t??wall)) as Vec3;
      }
      function fieldTarget(from:Vec3,area?:Vec3,radius=0){
        let best:Vec3|null=null,score=-Infinity;
        for(const zombie of zombies){
          const p=zombie.position;
          if(zombie.body.destroyed || p[2]<=score || (area && Math.hypot(p[0]-area[0],p[2]-area[2])>radius))continue;
          const t=toWorld(zombie.motion.parts[1],PARTS[1].pivot);
          const delta=sub(t,from),len=Math.hypot(...delta);
          if(firstBuilding(from,normalized(delta),len)<len-.1)continue;
          score=p[2];best=t;
        }
        return best?{position:best}:undefined;
      }
      function fieldRound(from:Vec3,to:Vec3,radius:number,power=1){
        const delta=sub(to,from),length=Math.max(.01,Math.hypot(...delta)),dir=normalized(delta);
        if(tracers.length>=36)tracers.shift();
        tracers.push({start:[...from],end:[...to],life:.16,width:radius?.075:.033});
        if(!radius){
          const hit=nearest(from,dir,firstBuilding(from,dir,length+.9));
          if(hit)damage(hit.zombie,hit.hit,dir,true,power>1?28:14,power);return;
        }
        blastCount++;
        if(bursts.length>=18)bursts.shift();
        bursts.push({pos:[...to],radius,life:.55});
        for(const zombie of zombies){
          if(zombie.body.destroyed)continue;
          const p=zombie.position,d=Math.hypot(p[0]-to[0],p[1]+.9-to[1],p[2]-to[2]);
          if(d>radius)continue;
          const part=d<radius*.7?1:0,brick=zombie.body.alive[part].findIndex(Boolean);if(brick<0)continue;
          const b=PARTS[part].boxes[brick],out=normalized([p[0]-to[0],.9,p[2]-to[2]]);
          damage(zombie,{part,brick,t:0,point:[b.x,b.y,b.z]},out,true,24,5.5);
          if(part===1 && !zombie.body.destroyed){
            for(let i=0;i<3 && !zombie.body.destroyed;i++){
              const next=zombie.body.alive[1].findIndex(Boolean);if(next<0)break;
              const box=PARTS[1].boxes[next];
              damage(zombie,{part:1,brick:next,t:0,point:[box.x,box.y,box.z]},out,true,8,4);
            }
          }
        }
      }

      function shoot() {
        if(field?.mounted){
          if(field.mountFire(aimPoint())){shots++;if(field.mounted==='heavy')kick=Math.min(.09,kick+.032);}
          return;
        }
        const rounds=ammo[weapon];
        if (reload>0 || cooldown>0) return;
        if (!rounds.loaded) { beginReload(); return; }
        rounds.loaded--; shots++; cooldown=ARMORY[weapon].interval; recoil=1;
        const count=weapon==='shotgun'?SHOTGUN_PELLETS:1;
        const muzzle=eye.map((n,i)=>n+right[i]*.17*(1-aimBlend)-vertical[i]*.14+forward[i]*.64) as Vec3;
        const pushed=new Set<Zombie>();
        for(let p=0;p<count;p++){
          const offset=shotOffset(weapon,shots,p,aiming,kick);
          if(!p)lastSpread=offset;
          const direction=normalized(forward.map((n,i)=>n+right[i]*offset.x+vertical[i]*offset.y) as Vec3);
          const wall=firstBuilding(eye,direction,direction[1]<0 ? Math.min(120,-eye[1]/direction[1]) : 120);
          const impact=nearest(eye,direction,wall);
          const length=impact?.hit.t ?? Math.min(100,wall);
          const end=eye.map((n,i)=>n+direction[i]*length) as Vec3;
          if(tracers.length>=36)tracers.shift();
          tracers.push({start:muzzle,end,life:.065,width:.012});
          if(weapon==='rocket'){fieldRound(muzzle,end,4);continue;}
          if(impact){
            damage(impact.zombie,impact.hit,direction,true,count>1?12:28,weapon==='mosin'?MOSIN_IMPACT:1);
            if(weapon==='lmg'){
              const second=nearest(eye,direction,wall,impact.zombie);
              if(second)damage(second.zombie,second.hit,direction,true,20);
            }
            if(weapon==='shotgun' && impact.hit.t<12 && pushed.size<3 && !pushed.has(impact.zombie)){
              pushed.add(impact.zombie);impact.zombie.position[2]-=.85;
            }
          }
        }
        kick=Math.min(.15,kick+ARMORY[weapon].kick*(aiming?.66:1));
        sway=Math.sin(shots*2.4)*kick*.32;
        state();
      }
      function beginReload(){
        if(reload>0 || ammo[weapon].loaded===ARMORY[weapon].size) return;
        if(!ammo[weapon].spare){tell('备弹耗尽 · 切换已装备的武器');return;}
        reload=ARMORY[weapon].reload;
      }
      function selectGun(gun:Gun) {
        if(field?.mounted && phase==='run')return;
        if((phase!=='run' && phase!=='supply')||!restored)return;
        const buying=!wallet.owned.includes(gun);
        if(phase==='run' && (buying || (gun!==wallet.primary && gun!==wallet.secondary)))return;
        if(phase==='supply' && !equip(wallet,gun)){tell('请检查解锁前置与赏金');state();return;}
        if(gun!==weapon){weapon=gun;reload=kick=sway=0;cooldown=.18;world.set(feed,MeshFilter,{assetHandle:feeds[gun]}).unwrap();world.set(viewGun,MeshFilter,{assetHandle:gunMeshes[gun]}).unwrap();}
        if(buying)tell('已购入 '+ARMORY[gun].name);
        if(phase==='supply')save();
        state();
      }
      function renderBlood(dt:number) {
        blood.step(dt);
        for (const layer of bloodBatches) layer.clear();
        for (const particle of blood.active) {
          quat.fromEuler(rotation, ...particle.rotation, 'XYZ');
          particleScale.fill(particle.size);
          mat4.compose(transform, particle.position, rotation, particleScale);
          bloodBatches[particle.color].push(transform);
        }
        for (const layer of bloodBatches) layer.publish();
      }

      function message(event:MessageEvent) {
        const data=event.data;
        if(data?.type==='restore' && !restored){wallet=restoreWallet(data.wallet);weapon=wallet.primary??wallet.secondary;
          world.set(viewGun,MeshFilter,{assetHandle:gunMeshes[weapon]}).unwrap();world.set(feed,MeshFilter,{assetHandle:feeds[weapon]}).unwrap();restored=true;state();}
        if(data?.type==='status')state();
        if(data?.type==='retry' && phase==='down')beginWave(wave);
        if(data?.type==='skip' && phase==='intro' && restored && !warmFrames){
          if(wallet.bestWave){phase='choose';state();}else beginWave(1);
        }
        if(data?.type==='choose' && phase==='supply'){phase='choose';state();}
        if(data?.type==='supply' && (phase==='choose'||phase==='down')){phase='supply';state();}
        if(data?.type==='wave' && phase==='choose')beginWave(data.level);
        if(data?.type==='tech' && phase==='supply' && restored && purchase(wallet,data.id)){
          tell('已解锁 '+techById.get(data.id)!.name);save();state();
        }
        if(data?.type==='gun' && GUNS.includes(data.gun))selectGun(data.gun);
      }
      placeCamera();state();
      port?.addEventListener('message',message);port?.start();
      const removeRead=gameHost.gameProjection?.registerRead({
        id:'voxel-zombie.street',title:'Outpost defense',
        read:()=>({...snapshot(),x,z,feet,yaw,pitch,kick,lastSpread,lastImpact,eye:[...eye],fov:lastFov,
          viewRig:[viewGun,hand,feed].map(entity=>Array.from(world.get(entity,Transform).unwrap().pos)),
          bodies:zombies.map(v=>({source:v.source,x:v.position[0],z:v.position[2],y:v.position[1],dead:v.body.destroyed,outfit:outfits[v.outfit][0],hits:[...v.body.hits],chestWounds:v.wounds[0],mode:movementMode(v.body)})),
          blood:blood.active.length, fragments:fragments.active.length}),
      });
      world.addSystem(Update,{
        name:'voxel-zombie-range-update',after:[FRAME_START_SCAN_SYSTEM_NAME],queries:[],commands:'none',
        fn(){
          const time=world.getResource(Time), now=performance.now(), elapsed=time.elapsed;
          const dt=Math.min(.08,Math.max(0,time.delta));
          const input=world.getResource<InputSnapshot>(INPUT_SNAPSHOT_RESOURCE_KEY), keys=input?.keyboard, mouse=input?.mouse;
          const press=(code:string)=>!!keys?.justPressedCode(code);
          if(phase==='down' && press('Enter'))beginWave(wave);
          if(phase==='intro' && press('Space') && restored){
            if(wallet.bestWave){phase='choose';state();}else beginWave(1);
          }
          if(phase==='run' && restored){
            reinforce(dt);
            if(press('Digit1') && wallet.primary)selectGun(wallet.primary);
            else if(press('Digit2'))selectGun(wallet.secondary);
            else if(mouse?.pointerLocked && mouse.wheelDelta && wallet.primary)selectGun(otherCarriedGun(wallet,weapon));
            if(weapon==='mosin' && press('KeyV')){zoom=nextZoom(zoom);state();}
            aiming=!!mouse?.pointerLocked && mouse.button(2);
            aimBlend+=(Number(aiming)-aimBlend)*Math.min(1,dt*16);
            if(mouse?.pointerLocked) {
              const sensitivity=aiming?(weapon==='mosin' && !field?.mounted ? .0023/zoom:.0013):.0023;
              yaw+=mouse.movementDelta.x*sensitivity;
              pitch=Math.max(-1.35,Math.min(1.35,pitch-mouse.movementDelta.y*sensitivity));
            }
            const horiz=Number(!!keys?.downCode('KeyD'))-Number(!!keys?.downCode('KeyA'));
            const ahead=Number(!!keys?.downCode('KeyW'))-Number(!!keys?.downCode('KeyS'));
            const point:Vec3=[x,feet,z];
            if(field){
              if(press('KeyE')){field.interact(point);if(field.mounted){const p=stationPositions[field.mounted];x=p[0];z=p[2]+.65;reload=0;}}
              if(press('KeyQ'))field.cycle();
              if(press('KeyT'))field.execute(aimPoint(),[x,DECK,z],yaw);
              field.tick(dt,spawnedCount);field.pickupDrop(point);
            }
            const moving=!field?.mounted&&(horiz!==0||ahead!==0);
            const speed=(field?.mounted?0:aiming?2.65:5.65)*dt/Math.max(1,Math.hypot(horiz,ahead));
            const ground=DECK;
            if(!field?.mounted && press('Space')&&feet<=ground+.001)jumpSpeed=6.8;
            jumpSpeed-=18*dt;feet=Math.max(ground,feet+jumpSpeed*dt);if(feet===ground)jumpSpeed=0;
            x=Math.max(-WALK_X,Math.min(WALK_X,x+(Math.cos(yaw)*horiz+Math.sin(yaw)*ahead)*speed));
            z=Math.max(.43,Math.min(6.32,z+(Math.sin(yaw)*horiz-Math.cos(yaw)*ahead)*speed));
            if(moving)stride+=dt*9;
            if(!field?.mounted && press('KeyR'))beginReload();
            if(reload>0){reload=Math.max(0,reload-dt);if(!reload)refill(ammo[weapon],ARMORY[weapon].size);}
            const recovery=ARMORY[weapon].recovery*dt;
            kick=Math.max(0,kick-recovery);
            sway=Math.sign(sway)*Math.max(0,Math.abs(sway)-recovery*.4);
            cooldown=Math.max(0,cooldown-dt);recoil=Math.max(0,recoil-dt*9);
          }
          placeCamera();
          rainfall.clear();
          for(const drop of drops){
            const px=eye[0]-16+wrap(drop.x+elapsed*drop.speed*.13-eye[0]+16,32);
            const pz=eye[2]-16+wrap(drop.z-eye[2]+16,32);
            const py=wrap(drop.y-elapsed*drop.speed,12);
            if(Math.abs(px)<DECK_HALF+.3 && pz>-.3 && pz<7.1 && py<DECK+3.8)continue;
            const depth=(px-eye[0])*forward[0]+(py-eye[1])*forward[1]+(pz-eye[2])*forward[2];
            if(depth < -rainRadius)continue;
            drop.matrix[12]=px;
            drop.matrix[13]=py;
            drop.matrix[14]=pz;
            rainfall.push(drop.matrix);
          }
          rainfall.publish();
          if(phase==='run' && restored && mouse?.pointerLocked && (mouse.justPressed(0)||mouse.button(0))) shoot();
          noticeFor-=dt;if(noticeFor<=0)notice='';
          hitMarker=Math.max(0,hitMarker-dt);hurt=Math.max(0,hurt-dt);
          sparks.clear();smoke.clear();
          for(let i=bursts.length-1;i>=0;i--){
            const b=bursts[i],age=.55-b.life;
            for(let j=0;j<4;j++){const a=j*2.4+i,spread=b.radius*(.12+age*.7);
              const pos:Vec3=[b.pos[0]+Math.cos(a)*spread,b.pos[1]+age*(2+j)+.4,b.pos[2]+Math.sin(a)*spread];
              const scale=b.radius*(age<.16?.33:.18+b.life*.4);
              quat.fromEuler(rotation,a,age*2,a,'XYZ');mat4.compose(transform,pos,rotation,[scale,scale*1.4,scale]);
              (age<.16?sparks:smoke).push(transform);
            }
            b.life-=dt;if(b.life<=0)bursts.splice(i,1);
          }
          sparks.publish();smoke.publish();renderBlood(dt);
          footBatch.clear();
          bodyBatches.forEach(layer => layer.clear());
          remainsBatch.clear();
          remainsCount = 0;
          for (const [i, zombie] of zombies.entries()) {
            for (const part of zombie.dirty) updateDamagedMesh(zombie, part);
            zombie.dirty.clear();
            if (zombie.body.destroyed) {
              const remaining = zombie.remainsUntil - elapsed;
              if (remaining > 0) {
                const scale = Math.min(1, remaining / remainsShrinkTime);
                quat.fromEuler(rotation, 0, zombie.motion.yaw + i * 2.399963, 0, 'XYZ');
                mat4.compose(transform, zombie.position, rotation, [scale, scale, scale]);
                remainsBatch.push(transform);
                remainsCount++;
              }
              continue;
            }
            if(Math.abs(zombie.position[2]-eye[2])>185)continue;
            const pos=zombie.position;
            if(phase==='run'){
              const windup=pos[2]>=FENCE_Z-.65 ? Math.max(0,1-zombie.swing/.5) : 0;
              let target=zombie.route[zombie.waypoint];
              if(zombie.waypoint<zombie.route.length-1){
                const dx=target[0]-pos[0],dz=target[2]-pos[2],distance=Math.hypot(dx,dz);
                pos[1]=Math.max(target[1],pos[1]-dt*6);
                if(distance<.16 && Math.abs(pos[1]-target[1])<.01)target=zombie.route[++zombie.waypoint];
                else if(distance>.001)target=[target[0]+1.18*dx/distance,0,target[2]+1.18*dz/distance];
              }
              walk(zombie.motion,zombie.body,pos,target,i*.81,dt*1.8,windup);
              if(pos[2]>=FENCE_Z-.65){
                zombie.swing-=dt;
                if(zombie.swing<=0){
                  hp=Math.max(0,hp-3);zombie.swing=1.25;hurt=.2;
                  if(!hp)finishWave(false);
                }
              }
            }
            for (const [part, layer] of bodiesByOutfit[zombie.outfit].entries()) {
              const pose = zombie.motion.parts[part];
              const damaged = zombie.damaged.get(part);
              if (damaged !== undefined) {
                world.set(damaged, Transform, { pos: pose.position, quat: pose.rotation, scale:bodyScale }).unwrap();
              } else if (!zombie.body.hits[part] && !(zombie.body.missingLimbs & (1 << part))) layer.push(pose.matrix);
            }
            quat.fromEuler(rotation, 0, zombie.motion.yaw, 0, 'XYZ');
            const [footX, , footZ] = zombie.position;
            const crawling = zombie.motion.mode !== 'chase' && zombie.motion.mode !== 'hop';
            mat4.compose(transform, [footX, zombie.position[1]+0.009, footZ + (crawling ? 0.55 : 0)], rotation, [0.94, 0.01, crawling ? 1.24 : 0.57]);
            footBatch.push(transform);
          }
          if(phase==='run')world.set(fence,Transform,{pos:[0,0,.12*Math.sin(hurt*48)*hurt/.2]}).unwrap();
          if(phase==='run' && kills===waveCount(wave))finishWave(true);
          for(let i=zombies.length-1;i>=0;i--){
            if(zombies[i].body.destroyed && zombies[i].remainsUntil<=elapsed)zombies.splice(i,1);
          }
          footBatch.publish();
          bodyBatches.forEach(layer => layer.publish());

          remainsBatch.publish();
          fragments.step(dt);
          chipBatches.forEach(layer => layer.clear());
          const liveLarge = new Set<Readonly<Fragment>>();
          for (const fragment of fragments.active) {
            quat.fromEuler(rotation, ...fragment.rotation, 'XYZ');
            if (fragment.part < 0) {
              mat4.compose(transform, fragment.position, rotation, fragment.dimensions);
              chipBatches[fragment.color].push(transform);
            } else {
              liveLarge.add(fragment);
              renderLarge(fragment);
            }
          }
          for (const [fragment, entry] of largeMeshes) {
            if (!liveLarge.has(fragment)) {
              world.despawn(entry.entity).unwrap(); dynamicEntities.delete(entry.entity); largeMeshes.delete(fragment);
            }
          }
          chipBatches.forEach(layer => layer.publish());
          tracerBatch.clear();
          for (let index = tracers.length - 1; index >= 0; index--) {
            const tracer = tracers[index];
            tracer.life -= time?.delta ?? 0;
            if (tracer.life <= 0) { tracers.splice(index, 1); continue; }
            const midpoint = tracer.start.map((n, axis) => (n + tracer.end[axis]) / 2) as Vec3;
            quat.fromLookAt(rotation, tracer.start, tracer.end, up);
            mat4.compose(transform, midpoint, rotation, [tracer.width, tracer.width, Math.hypot(...sub(tracer.end, tracer.start))]);
            tracerBatch.push(transform);
          }
          tracerBatch.publish();
          if(warmFrames>0 && --warmFrames===0)state();
          if (now - lastState > 180) {
            lastState = now;
            state();
          }
        },
      }).unwrap();

      return () => {
        gameHost.setPointerLockAllowed?.(false);
        removeRead?.();
        port?.removeEventListener('message', message);
        world.removeSystem(Update, 'voxel-zombie-range-update');
        for (const entity of dynamicEntities) world.despawn(entity);
        for (const entity of spawned) world.despawn(entity);
        for (const handle of owned) assets.release(handle);
      };
    });
  },
};
