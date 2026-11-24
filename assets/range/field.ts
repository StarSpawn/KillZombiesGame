import type { Vec3 } from './fracture.ts';
import { DECK } from './outpost.ts';
import { stationPositions, truckStop, HEAVY_PIVOT, SHOULDER, soldierIds } from './field-models.ts';
import { DROP_PRICE, commandIds, orderName, type Order } from './technology.ts';
import { resupply, type Wallet, type ammunition } from './loadout.ts';

type Aim={position:Vec3};
export interface FieldPort {
  pose(id:string,position:Vec3|null,yaw?:number,pitch?:number,recoil?:number,stride?:number):void;
  target(from:Vec3,area?:Vec3,radius?:number):Aim|undefined;
  round(from:Vec3,to:Vec3,radius:number,power?:number):void;
  tell(text:string):void; save():void;
}
type Mount='heavy'|'twin'|'cannon';
const distance=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export const HEAVY_INTERVAL=.235, HEAVY_IMPACT=4.3;
function bearing(from:Vec3,to:Vec3){
  return {yaw:Math.atan2(from[0]-to[0],from[2]-to[2]),pitch:Math.atan2(to[1]-from[1],Math.hypot(to[2]-from[2],to[0]-from[0]))};
}
const units=[
  {id:'infantry',base:[-10.5,DECK,1.38],shots:90,rate:1.45},
  {id:'tower',base:[10.5,DECK,1.38],shots:90,rate:1.45},
  {id:'reserve',base:[-6.2,DECK,2.85],shots:60,rate:1.3},
  {id:'reserve2',base:[-8.2,DECK,2.85],shots:60,rate:1.3},
  {id:'car',base:[-9,0,0],shots:240,rate:.38},
  {id:'flak',base:[-16,0,-1],shots:160,rate:.72},
  {id:'tank',base:[17,0,-1],shots:240,rate:.5},
] as const;
const truckPort:Vec3=[3,DECK,5.92];
export class Field {
  mounted:Mount|null=null;
  truckUses=0; arrival=0; calls=0; tankShells=6; order:Order|null=null;
  drop:Vec3|null=null; dropIn=0; reserveSide=-1; moveWait=0;
  mortarZone:Vec3=[0,0,-14]; mortarShots=8; mortarIn=0;
  private nextShotAt={heavy:0,twin:0,cannon:0};
  belts={heavy:200,twin:300,cannon:6};
  private rounds=new Map<string,number>();
  private timers=new Map<string,number>();
  private positions=new Map<string,Vec3>();
  private queued:{at:number;pos:Vec3;radius:number;origin:Vec3}[]=[];
  private poses=new Map<string,{yaw:number;pitch:number;recoil:number}>();
  private elapsed=0; private airStart=0; private airTarget:Vec3|null=null;
  constructor(private api:FieldPort,private wallet:Wallet,private ammo:ReturnType<typeof ammunition>){
    this.calls=this.has('radio')?2:0;this.truckUses=this.has('truck')?3:0;
    this.order=this.orders()[0]??null;
    for(const id of ['truck','drop','chute','aircraft','mortar','mortarGunner','crew',...Object.keys(stationPositions),...units.map(u=>u.id)])api.pose(id,null);
    for(const [id,p] of Object.entries(stationPositions))if(this.has(id))api.pose(id,p);
    if(this.has('mortar')){api.pose('mortar',[-11.6,DECK,3.9]);api.pose('mortarGunner',[-12.42,DECK,4.1]);}
    if(this.has('crew'))api.pose('crew',[0,DECK,1.1]);
    for(const u of units){
      if(!this.has(u.id==='reserve2'?'reserve':u.id) || (u.id==='reserve2'&&this.has('crew')))continue;
      const p:Vec3=[...u.base];this.positions.set(u.id,p);
      this.rounds.set(u.id,u.shots);this.timers.set(u.id,.45);api.pose(u.id,p);
    }
  }
  has(id:string){return this.wallet.tech.includes(id);}
  orders(){return commandIds.filter(k=>k==='trial'?this.wallet.trial:this.has(k));}
  cycle(){const all=this.orders();this.order=all[(all.indexOf(this.order!)+1)%all.length]??null;}
  private pickup(point:Vec3){return this.drop && this.dropIn<=0 && distance(point,this.drop)<1.4;}
  private nearStation(point:Vec3){return (Object.keys(stationPositions) as Mount[]).find(k=>this.has(k)&&distance(point,stationPositions[k])<1.25);}
  prompt(p:Vec3){
    if(this.mounted)return 'E 离座';
    if(this.pickup(p))return 'E 领取空投';
    if(this.truckUses && this.arrival>=4 && distance(p,truckPort)<1.65)return 'E 领取补给 · 余 '+this.truckUses+' 次';
    const m=this.nearStation(p);return m?'E 操控'+({heavy:'重机枪',twin:'双联机枪',cannon:'无后坐力炮'}[m]):'';
  }
  interact(p:Vec3){
    if(this.mounted){this.mounted=null;if(this.has('crew'))this.api.pose('crew',[0,DECK,1.1]);return;}
    const drop=this.pickup(p),truck=this.truckUses && this.arrival>=4 && distance(p,truckPort)<1.65;
    if(drop||truck){
      if(!resupply(this.ammo,this.wallet)){this.api.tell('备弹已满');return;}
      if(drop){this.drop=null;this.api.pose('drop',null);}else this.truckUses--;
      this.api.tell('随身备弹已补充');return;
    }
    this.mounted=this.nearStation(p)??null;
    if(this.mounted==='heavy' && this.has('crew'))this.api.pose('crew',[-1.15,DECK,1.35]);
  }
  pickupDrop(p:Vec3){if(!this.mounted && this.pickup(p) && resupply(this.ammo,this.wallet)){this.drop=null;this.api.pose('drop',null);this.api.tell('已领取空投补给');}}
  trackMount(yaw:number,pitch:number){
    if(this.mounted==='heavy')this.api.pose('heavy',stationPositions.heavy,-yaw,pitch,Math.max(0,(this.nextShotAt.heavy-this.elapsed)/HEAVY_INTERVAL));
  }
  private heavyRound(aim:Vec3){
    const p=stationPositions.heavy,origin:Vec3=[p[0],p[1]+HEAVY_PIVOT,p[2]];
    const {yaw,pitch}=bearing(origin,aim),len=Math.hypot(aim[0]-origin[0],aim[1]-origin[1],aim[2]-origin[2]);
    const muzzle:Vec3=[origin[0]-Math.sin(yaw)*Math.cos(pitch)*1.22,origin[1]+Math.sin(pitch)*1.22,origin[2]-Math.cos(yaw)*Math.cos(pitch)*1.22];
    const phase=(200-this.belts.heavy)*2.39996;
    const spread=(.008+.016*Math.abs(Math.sin(phase*2.1)))*len;
    const lateral=Math.sin(phase)*spread,vertical=Math.cos(phase)*spread;
    const end:Vec3=[aim[0]+Math.cos(yaw)*lateral+Math.sin(yaw)*Math.sin(pitch)*vertical,
      aim[1]+Math.cos(pitch)*vertical,aim[2]-Math.sin(yaw)*lateral+Math.cos(yaw)*Math.sin(pitch)*vertical];
    this.api.round(muzzle,end,0,HEAVY_IMPACT);
  }
  mountFire(aim:Vec3){
    const id=this.mounted;if(!id||this.nextShotAt[id]>this.elapsed)return false;
    const count=id==='twin'?2:1;if(this.belts[id]<count){this.api.tell('阵地弹药耗尽 · E 离座');return false;}
    this.belts[id]-=count;this.nextShotAt[id]=this.elapsed+(id==='cannon'?3:id==='heavy'?HEAVY_INTERVAL:.105);
    if(id==='heavy'){this.heavyRound(aim);return true;}
    const p=stationPositions[id],from:Vec3=[p[0],p[1]+1.3,p[2]-.65];
    this.api.pose(id,p,bearing(p,aim).yaw);this.api.round(from,aim,id==='cannon'?3.2:0);
    if(id==='twin')this.api.round([from[0]+.35,from[1],from[2]],[aim[0]+.68,aim[1],aim[2]],0);
    return true;
  }
  execute(aim:Vec3,point:Vec3,yaw:number){
    const k=this.order;if(!k)return;
    if(k==='airdrop'){
      if(this.drop){this.api.tell('上一份空投尚未领取');return;}
      if(this.wallet.cash<DROP_PRICE){this.api.tell('空投需要 $'+DROP_PRICE);return;}
      this.wallet.cash-=DROP_PRICE;this.api.save();this.drop=[...point];this.dropIn=5;
      this.api.tell('运输机应答 · 五秒后投送');return;
    }
    if(k==='reserve'){
      if(this.moveWait>0){this.api.tell('部队正在整队');return;}
      this.reserveSide=aim[0]<0?-1:1;this.moveWait=15;this.api.tell('增援转往'+(this.reserveSide<0?'左':'右')+'侧入口');return;
    }
    if(k==='mortar'){this.mortarZone=[...aim];this.api.tell('迫击炮落区已更新');return;}
    if(k==='tank'){
      if(!this.tankShells){this.api.tell('主炮弹药耗尽');return;}
      this.api.pose('tank',[17,0,-1],Math.atan2(17-aim[0],-1-aim[2]));
      this.tankShells--;this.queued.push({at:this.elapsed+.5,pos:[...aim],origin:[17,2,-1],radius:4});return;
    }
    if(k==='trial'){if(!this.wallet.trial)return;this.wallet.trial=false;this.api.save();}
    else if(!this.calls){this.api.tell('本波电台呼叫已用完');return;}else this.calls--;
    const count=k==='salvo'?8:k==='barrage'?4:k==='strafe'?12:k==='strike'?3:1;
    if(k==='bomb'||k==='strafe'){this.airTarget=[...aim];this.airStart=this.elapsed;}
    for(let i=0;i<count;i++){
      const along=k==='barrage'?i*3.5:k==='strafe'?(i-3)*1.8:k==='salvo'?Math.floor(i/4)*3:0;
      const side=k==='salvo'?((i%4)-1.5)*3:k==='strike'?(i-1)*.9:0;
      const pos:Vec3=[aim[0]+Math.sin(yaw)*along+Math.cos(yaw)*side,aim[1],aim[2]-Math.cos(yaw)*along+Math.sin(yaw)*side];
      this.queued.push({at:this.elapsed+(k==='bomb'?3:k==='strafe'?.8:2)+i*(k==='barrage'?1:.16),pos,radius:k==='bomb'?6:k==='strafe'?2.2:3.7,origin:[pos[0]-5,24,pos[2]-8]});
    }
    this.api.tell(orderName(k)+'已受理');if(k==='trial')this.order=this.orders()[0]??null;
  }
  tick(dt:number,spawned:number){
    this.elapsed+=dt;this.moveWait=Math.max(0,this.moveWait-dt);
    if(this.has('truck') && spawned>0 && this.arrival<4){
      this.arrival=Math.min(4,this.arrival+dt);
      this.api.pose('truck',[truckStop[0],0,truckStop[2]+(4-this.arrival)*5]);
      if(this.arrival===4)this.api.tell('弹药车已到 · 塔台右后方领取');
    }
    if(this.drop && this.dropIn>0){
      this.dropIn=Math.max(0,this.dropIn-dt);
      const p:Vec3=[this.drop[0],this.drop[1]+this.dropIn*2.7,this.drop[2]];
      this.api.pose('drop',p);this.api.pose('chute',this.dropIn>0?p:null);
    }
    if(this.airTarget){const t=this.elapsed-this.airStart,p=this.airTarget;
      this.api.pose('aircraft',t<4?[p[0]-28+t*16,15,p[2]-10+t*1.5]:null,Math.PI/2);if(t>=4)this.airTarget=null;}
    for(let i=this.queued.length-1;i>=0;i--){const q=this.queued[i];if(q.at<=this.elapsed){this.api.round(q.origin,q.pos,q.radius);this.queued.splice(i,1);}}
    for(const [id,pose] of this.poses){
      if(pose.recoil<=0 || (id==='crew' && this.mounted==='heavy'))continue;
      pose.recoil=Math.max(0,pose.recoil-dt*7.5);
      const pos=id==='crew'?[0,DECK,1.1] as Vec3:id==='mortarGunner'?[-12.42,DECK,4.1] as Vec3:this.positions.get(id)!;
      this.api.pose(id,pos,pose.yaw,pose.pitch,pose.recoil);
      if(id==='crew')this.api.pose('heavy',stationPositions.heavy,pose.yaw,pose.pitch,pose.recoil);
    }
    for(const u of units){
      const p=this.positions.get(u.id);if(!p)continue;
      if(['reserve','reserve2','car','flak'].includes(u.id)){
        const goal=this.reserveSide*Math.abs(u.base[0]),dx=goal-p[0];
        if(Math.abs(dx)>.08){p[0]+=Math.sign(dx)*Math.min(Math.abs(dx),dt*4);this.api.pose(u.id,p,-Math.sign(dx)*Math.PI/2,0,0,Math.sin(this.elapsed*9));continue;}
      }
      const left=this.rounds.get(u.id)!;if(!left)continue;
      const timer=(this.timers.get(u.id)??0)-dt;this.timers.set(u.id,timer);if(timer>0)continue;
      const origin:Vec3=[p[0],p[1]+(soldierIds.includes(u.id)?SHOULDER:1.45),p[2]],enemy=this.api.target(origin);
      this.timers.set(u.id,enemy?u.rate:.35);if(!enemy)continue;
      const pose={...bearing(origin,enemy.position),recoil:1};
      if(soldierIds.includes(u.id)){
        this.poses.set(u.id,pose);this.api.pose(u.id,p,pose.yaw,pose.pitch,1);
        origin[0]+=.125*Math.cos(pose.yaw)-.80*Math.sin(pose.yaw)*Math.cos(pose.pitch);
        origin[1]+=.80*Math.sin(pose.pitch)-.025;
        origin[2]-=.125*Math.sin(pose.yaw)+.80*Math.cos(pose.yaw)*Math.cos(pose.pitch);
      }else this.api.pose(u.id,p,pose.yaw);
      this.api.round(origin,enemy.position,0);if(u.id==='flak')this.api.round([origin[0]+.4,origin[1],origin[2]],enemy.position,0);
      this.rounds.set(u.id,left-1);
    }
    if(this.has('crew') && this.mounted!=='heavy' && this.belts.heavy>0 && this.nextShotAt.heavy<=this.elapsed){
      const timer=(this.timers.get('crew')??0)-dt;this.timers.set('crew',timer);
      if(timer<=0){const p:Vec3=[0,DECK+1.3,.2],enemy=this.api.target(p);
        this.timers.set('crew',enemy ? HEAVY_INTERVAL : .4);
        if(enemy){
          this.belts.heavy--;this.nextShotAt.heavy=this.elapsed+HEAVY_INTERVAL;const pose={...bearing(p,enemy.position),recoil:1};this.poses.set('crew',pose);
          this.api.pose('crew',[0,DECK,1.1],pose.yaw,pose.pitch,1);this.api.pose('heavy',stationPositions.heavy,pose.yaw,pose.pitch,1);
          this.heavyRound(enemy.position);
        }}
    }
    this.mortarIn-=dt;
    if(this.has('mortar')&&this.mortarShots && this.mortarIn<=0){
      const p:Vec3=[-11.6,DECK+1,3.9],enemy=this.api.target(p,this.mortarZone,7);
      this.mortarIn=enemy?4:.5;if(enemy){this.mortarShots--;const pose={...bearing(p,enemy.position),recoil:1};this.poses.set('mortarGunner',pose);this.api.pose('mortarGunner',[-12.42,DECK,4.1],pose.yaw,pose.pitch,1);this.api.round(p,enemy.position,3.1);}
    }
  }
}
