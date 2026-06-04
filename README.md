# 九屿 Jiuyu

> 一款日常可玩、专业可调的数独微信小游戏。  
> A Sudoku WeChat Minigame designed to be friendly for daily play and precise enough for serious solving.

🧩 **当前阶段 / Status:** 文档已收口，当前主线是从小程序结构迁移到微信小游戏结构，并恢复数独主场景闭环。  
📱 **平台 / Platform:** 微信小游戏 / WeChat Minigame  
🌿 **策略 / Strategy:** 本地优先 / Local-first

## ✨ 简介 / Introduction

**九屿** 是一个数独小游戏项目。“九”对应数独中的九个 3x3 宫格，“屿”代表彼此独立又互相连接的解题区域。这个名字希望带来一种清爽、安静、轻微有趣的数独体验：不像传统工具那样冷，也不把数独做成过度闯关游戏。

首版的核心目标不是堆功能，而是打磨一个稳定顺手的单人本地数独闭环：打开快、棋盘顺、提示有用、每天愿意回来。

**Jiuyu** is a Sudoku minigame project. The name hints at the nine 3x3 regions of a Sudoku board as small connected islands. The product direction is calm, lightweight, and slightly playful: more approachable than a strict puzzle tool, but more focused than a casual mini-game.

The first release focuses on the core local Sudoku loop: fast launch, smooth board interaction, useful hints, stable progress, and a reason to come back every day.

## 🧭 产品定位 / Product Positioning

| 中文 | English |
|---|---|
| 日常可玩 | Easy to open and play every day |
| 专业可调 | Assistance can be tuned for serious solvers |
| 本地优先 | Local-first puzzle bank, progress, and stats |
| 提示有教学感 | Hints should teach, not only reveal answers |
| 克制但不冷淡 | Calm visual design with gentle feedback |

## 🧩 核心功能 / Features

### 🎯 首版目标 / MVP

- **本地题库 / Local puzzle bank**  
  内置题目，减少对网络和账号系统的依赖。

- **本地进度 / Local progress**  
  自动保存当前局面、候选数、用时、错误和提示次数。

- **本地统计 / Local stats**  
  记录完成局数、连续天数、最好成绩和平均用时。

- **四档难度 / Four difficulty profiles**  
  入门、进阶、熟练、专家。难度不仅影响题目，也影响提示粒度、排错方式、候选数辅助和视觉气质。

- **顺手的棋盘 / Smooth board interaction**  
  支持选格、同行列宫高亮、相同数字高亮、数字输入、擦除和撤销。

- **候选数 / Notes mode**  
  支持手动候选数，并为后续自动清理候选数留出设计空间。

- **基础排错 / Error checking**  
  支持冲突检查和答案检查，并根据难度档位控制强度。

- **分层提示 / Layered hints**  
  提示从方向、格子、技巧到答案逐层展开，优先帮助用户思考。

### 🌱 后续方向 / Later Ideas

- 技巧训练专题 / Technique training
- 每周挑战 / Weekly challenges
- 题目收藏 / Puzzle bookmarks
- 解题回放 / Solve replay
- 更多高阶技巧提示 / Advanced solving techniques
- 云同步 / Cloud sync
- 好友成绩与排行榜 / Friend scores and leaderboards
- 分享卡片 / Share cards

## 🎨 设计原则 / Design Principles

| 原则 | 说明 |
|---|---|
| 棋盘优先 | 数独体验的质量主要来自棋盘输入、候选数、提示、排错和存档。 |
| 本地优先 | 首版不依赖登录和服务端，优先保证启动快、离线可玩、实现风险低。 |
| 辅助可调 | 新手需要更多帮助，老手需要更少打扰。 |
| 提示分层 | 先给方向，再给格子，再解释技巧，最后才给答案。 |
| 视觉克制 | 保持清爽、耐看、稳定，不做过重装饰。 |

## 🛠️ 项目进度 / Progress

| 阶段 | 状态 | 说明 |
|---|---|---|
| 产品设计 / Product design | Done | 已完成当前产品基线与小游戏方向收口 |
| 文档合并 / Documentation merge | Done | 已统一当前主设计与主计划文档 |
| 小游戏迁移 / Minigame migration | Next | 切换入口结构并恢复单场景数独主循环 |
| 本地存档 / Local storage | Planned | 在小游戏主场景稳定后恢复 |
| 提示引擎 / Hint engine | Planned | 在小游戏主场景稳定后恢复 |
| 完成反馈与统计 / Result and stats | Planned | 在小游戏主场景稳定后恢复 |

## 📚 文档导航 / Documentation

| 文档 | 内容 | 适合什么时候看 |
|---|---|---|
| [九屿当前设计基线](docs/2026-06-04-jiuyu-current-design.md) | 当前产品定位、平台判断、小游戏结构方向、当前 MVP 边界 | 想知道“现在到底按什么做”时 |
| [九屿当前实施计划](docs/2026-06-04-jiuyu-current-implementation-plan.md) | 当前阶段划分、实施顺序、验证策略、主文档关系 | 准备继续开发或接手项目时 |
| [小游戏迁移设计](docs/superpowers/specs/2026-06-04-jiuyu-minigame-migration-design.md) | 小游戏结构迁移的详细设计 | 需要理解迁移原因与结构取舍时 |
| [小游戏迁移实施计划](docs/superpowers/plans/2026-06-04-minigame-migration-implementation.md) | 详细执行步骤、验证命令和提交节点 | 准备实际落地迁移时 |
| [历史小程序设计](docs/2026-05-22-jiuyu-sudoku-miniapp-design.md) | 小程序阶段的产品讨论与定位来源 | 回看历史判断时 |
| [历史小程序计划](docs/2026-05-22-jiuyu-miniapp-implementation-plan.md) | 小程序阶段的实施拆解 | 回看旧结构来源时 |

## 🗂️ 项目结构 / Project Structure

```text
jiuyu-miniapp/
  docs/                         Current docs + historical docs
  game.js                       Minigame entry (target)
  game.json                     Minigame config (target)
  js/                           Minigame runtime source (target)
    main.js                     Bootstrapping and touch dispatch
    data/
      puzzles.js                Local puzzle bank
    services/
      game-engine.js            Game state and board operations
    utils/
      sudoku.js                 Sudoku coordinate helpers
    scene/
      board-scene.js            Board rendering and hit testing
    ui/
      toolbar.js                Number bar and tool controls
  miniprogram/                  Legacy mini program structure kept during migration
  tests/                        Logic regression tests
  project.config.json           WeChat DevTools project config
```

## 🚀 开发方式 / Getting Started

1. 克隆仓库 / Clone the repository.

```bash
git clone https://github.com/yamathyao/jiuyu-miniapp.git
cd jiuyu-miniapp
```

2. 使用微信开发者工具以小游戏项目方式导入项目目录。  
   Open the project folder with WeChat DevTools as a minigame project.

3. AppID 需使用小游戏对应的 AppID。  
   Use the AppID created for WeChat Minigame.

4. 当前迁移目标入口：  
   Current target entry:

```text
game.js
```

## 🧱 当前边界 / Current Scope

首版暂不做以下能力：

- 登录 / Login
- 云同步 / Cloud sync
- 好友排行 / Friend leaderboard
- 分享挑战 / Share challenge
- 广告 / Ads
- 皮肤商城 / Theme shop
- AI 提示 / AI hints
- 复杂闯关地图 / Complex level map

这些功能并不是不重要，而是需要等核心体验稳定后再加入。九屿第一阶段应该先证明：一个本地、轻量、顺手的数独小程序，值得用户每天打开。

These features are intentionally out of scope for the first version. The first milestone should prove that a local-first, lightweight, smooth Sudoku minigame is worth opening every day.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

本项目使用 [MIT License](LICENSE) 开源。
