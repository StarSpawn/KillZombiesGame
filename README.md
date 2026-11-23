# 港区突围 · 边境哨塔

塔台俯瞰雨中的西柏林风格街区，两侧铁网延伸，背后是铁路货场。普通丧尸从街角建筑后方分批走出，每只抵达铁网后独立攻击。耐久归零即失守。

WASD 在平台移动，空格跳跃，点击画面捕获鼠标。左键开火、右键瞄准、R 换弹、数字键切换已拥有的武器。击毁头部消灭丧尸，每只奖励 $15。

第一波有 4 只普通丧尸，之后每波增加 2 只。清完一波进入军需处，可购买或装备武器，再选择重复挑战或推进。每波重新补弹、修复铁网，已赚现金、已购武器和最高通关波次保存在当前浏览器。旧版现金和武器可继承。

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

活动入口在 `assets/range/`。`range.ts` 连接天工场景、输入和战斗，`outpost.ts` 定义哨塔和铁网，`gun-model.ts` 定义枪模，`loadout.ts` 管理弹药与购买，`fracture.ts`、`motion.ts` 和 `wounds.ts` 管理僵尸破坏与姿态。
