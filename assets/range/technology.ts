export type Branch = 'arms' | 'supply' | 'fort' | 'troops' | 'radio' | 'joint';
export interface Technology {
  id: string; name: string; branch: Branch; cost: number; parents: string[];
  column: number; tier: number; effect: string;
}
const node = (id:string, name:string, branch:Branch, cost:number, column:number, tier:number, parents:string[], effect:string):Technology =>
  ({id,name,branch,cost,column,tier,parents,effect});

export const technologies:Technology[] = [
  node('g18','马卡洛夫 PM','arms',0,2,0,[],'开局配发的手枪。每次开波恢复弹匣和备弹。'),
  node('mosin','莫辛纳甘','arms',120,1,1,['g18'],'高精度栓动步枪。右键开镜，V 切换倍率。'),
  node('pouch','备用弹袋','supply',60,3,1,['g18'],'普通枪械随身备弹上限提高 50%。'),
  node('ak','自动步枪','arms',90,1,2,['mosin'],'30 发弹匣，持续连发。'),
  node('truck','弹药运输车','supply',120,3,2,['pouch'],'每波驶抵塔台右后方。到黄条补给口按 E，最多领取三次。'),
  node('shotgun','泵动霰弹枪','arms',60,0,3,['ak'],'近距离扇形散射，可击退最多三只逼近铁网的僵尸。'),
  node('lmg','轻机枪','arms',180,1,3,['ak'],'60 发弹匣，每发最多贯穿两只僵尸。'),
  node('radio','连部电台','radio',150,4,3,['truck'],'每波两次常规呼叫，解锁时赠送一次单发试射。'),
  node('rocket','火箭筒','arms',200,0,4,['lmg'],'单发装填，备用两发。命中点四米内爆炸。'),
  node('heavy','架设式重机枪','fort',180,1,4,['lmg'],'塔台中央枪位按 E 入座，左键射击。独立弹链 200 发。'),
  node('strike','定点炮击','radio',135,4,4,['radio'],'标记落点，约两秒后三发连续落下。消耗一次常规呼叫。'),
  node('twin','双联高射机枪','fort',210,0,5,['heavy'],'左侧塔台枪位，两路齐射。每波 300 发弹链。'),
  node('infantry','哨塔步兵','troops',135,1,5,['heavy'],'侧塔进驻一名步兵，每波 90 发，自动射击。'),
  node('salvo','火箭炮齐射','joint',240,3,5,['truck','strike'],'八枚火箭覆盖两排落区，消耗一次常规呼叫。'),
  node('barrage','滚动炮幕','radio',180,4,5,['strike'],'从准星落点向纵深连续轰击四段。消耗一次常规呼叫。'),
  node('mortar','迫击炮阵地','fort',200,0,6,['twin'],'按指挥键标记落区，阵地自动炮击区内尸群，每波八发。'),
  node('tower','增建哨塔','troops',165,1,6,['infantry'],'另一侧增建哨塔，配备第二名步兵和独立弹药。'),
  node('strafe','强击机扫射','radio',210,4,6,['barrage'],'飞机沿指定方向扫射一遍，消耗一次常规呼叫。'),
  node('cannon','固定无后坐力炮','fort',225,0,7,['mortar'],'右侧枪位按 E 入座，直射爆炸。每波六发。'),
  node('reserve','机动预备班','troops',200,1,7,['tower'],'两名步兵各自携弹 60 发，指挥键可调往指定入口。'),
  node('airdrop','付费空投补给','joint',180,3,7,['truck','strafe'],'每次花费 $45，五秒后在呼叫处落箱。走近拾取，可重复购买。'),
  node('bomb','航空炸弹','radio',240,4,7,['strafe'],'三秒后重弹覆盖标记点，爆心半径六米。消耗一次呼叫。'),
  node('car','轮式装甲车','troops',240,1,8,['reserve'],'装甲车随预备班调动，停车后自动射击，每波 240 发。'),
  node('crew','常驻机枪组','joint',180,2,8,['heavy','reserve'],'一名预备兵接管空置重机枪，沿用枪座剩余弹链。'),
  node('flak','自行高炮增援','joint',300,0,9,['twin','car'],'履带高炮车随队转场，自动双发齐射，每波 160 轮。'),
  node('tank','坦克增援','joint',360,2,9,['car','truck'],'坦克机枪自动射击。指挥键点名主炮，每波六发。')
];
export const techById = new Map(technologies.map(item=>[item.id,item]));
export const DROP_PRICE=45;
export const branchNames:Record<Branch,string>={arms:'单兵武器',supply:'补给',fort:'固定武备',troops:'驻防部队',radio:'场外支援',joint:'联合解锁'};
export const commandIds=['trial','strike','barrage','strafe','bomb','salvo','airdrop','reserve','mortar','tank'] as const;
export type Order=typeof commandIds[number];
export function orderName(id:Order){return id==='trial'?'电台试射':id==='reserve'?'调动增援':id==='mortar'?'迫击炮落区':id==='tank'?'坦克主炮':techById.get(id)!.name;}
