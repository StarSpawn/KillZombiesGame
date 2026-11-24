# 港区突围 · 边境哨塔

塔台俯瞰虚构的冷战柏林街区。塔前视野通畅；左翼调度所墙面有 DDR 标记，右翼是装卸棚与货垛，远处有西柏林街牌、邮局与影院。铁网与街道间留有约 20 米空地，后方是铁路货场。普通丧尸从街巷、药房门口、窗口和屋顶分批出现，每只抵达铁网后独立攻击。耐久归零即失守。

WASD 在长岗哨上移动，平台左右可走 26 米，空格跳跃，点击画面捕获鼠标。左键开火、右键瞄准、R 换弹。波次间在军需处配置一主一副，战斗时滚轮或数字键 1、2 切换。手枪与霰弹枪占副武器槽。击毁头部消灭丧尸，每只奖励 $15。初始武器为马卡洛夫 PM。军需处的莫辛纳甘售价 $120，右键开镜，V 在 2×、4×、6× 间轮换，躯干命中会留下更大的缺损。

科技树解锁的步兵在同一平台持枪索敌。解锁架设式重机枪后，到中央枪位按 E 就座或离开；入座后用鼠标转动枪身和环形瞄具，左键开火。

第一波有 8 只普通丧尸，之后每波增加 4 只。清完一波进入军需处，可购买或装备武器，再选择重复挑战或推进。每波重新补弹、修复铁网，已赚现金、已购武器和最高通关波次保存在当前浏览器。旧版现金和武器可继承。

## 本地运行与验证

```powershell
pnpm install --frozen-lockfile
pnpm exec forgeax project build --json
pnpm exec forgeax project preview --port 4178 --json
```

```powershell
pnpm exec tsc --noEmit
pnpm exec vitest run assets/range
pnpm exec forgeax project play scripts/playthrough.mjs --headless true --backend auto --require-ui --timeout-ms 240000 --json
```

活动入口在 `assets/range/`。`range.ts` 连接天工场景、输入和战斗，`outpost.ts` 定义哨塔和铁网，`gun-model.ts` 定义枪模，`loadout.ts` 管理弹药与购买，`fracture.ts`、`motion.ts` 和 `wounds.ts` 管理僵尸破坏与姿态。
