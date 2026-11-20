# 港区突围

天工引擎 0.5.0 第一人称体素 PvE 原型。镜头从 04 号码头沿街退回安全屋。穿过 1000 米感染街区并抵达码头即可撤离。

| 操作 | 按键 |
| --- | --- |
| 移动与转向 | WASD 移动，点击画面锁定鼠标后可连续转向，Esc 释放 |
| 跳跃或跳过开场镜头 | 空格 |
| 开火、瞄准 | 左键，按住右键 |
| 换弹 | R |
| 打开或关闭安全屋军需商店 | B，或点击商店按钮 |
| 切换已拥有的武器 | 1、2、3 |
| 从二层安全屋出发 | 靠近破窗按 E 升起窗板，按住 W 并按空格越过窗台，落到人行道 |
| 结算后重试 | Enter |

每次出发时 G18 配有三个 17 发弹匣，含已装填的一个。每只僵尸仅在死亡时发放 $15，AK 售价 $90，霰弹枪售价 $60。现金、武器所有权和已结算的最远距离保存在当前浏览器中。再次出发会刷新尸群、生命和弹药。

命中头部、躯干或四肢会打掉命中点的体素，并保留原型的血浆、创口、断肢、爬行和死亡碎块。只有击毁头部才会死亡并发放赏金。

## 本地运行与验证

```powershell
pnpm exec forgeax project build --json
pnpm exec forgeax project preview --port 4178 --json
```

```powershell
pnpm exec tsc --noEmit
pnpm exec vitest run assets/range
pnpm exec forgeax project play scripts/playthrough.mjs --headless true --backend auto --require-ui --timeout-ms 150000 --json
```

活动入口在 `assets/range/`。`range.ts` 连接天工场景、输入和战斗，`street.ts` 定义街区、碰撞和枪模，`loadout.ts` 管理弹药与购买，`fracture.ts`、`motion.ts` 和 `wounds.ts` 管理僵尸破坏与姿态。
