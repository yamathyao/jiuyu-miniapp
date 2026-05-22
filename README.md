# 九屿 Jiuyu Miniapp

> 一款日常可玩、专业可调的数独微信小程序。  
> A Sudoku WeChat Mini Program designed to be friendly for daily play and precise enough for serious solving.

🧩 **当前阶段 / Status:** 产品设计与项目骨架已完成，下一步进入棋盘核心开发。  
📱 **平台 / Platform:** 微信小程序 / WeChat Mini Program  
🌿 **策略 / Strategy:** 本地优先 / Local-first

## ✨ 简介 / Introduction

**九屿** 是一个数独小程序项目。“九”对应数独中的九个 3x3 宫格，“屿”代表彼此独立又互相连接的解题区域。这个名字希望带来一种清爽、安静、轻微有趣的数独体验：不像传统工具那样冷，也不把数独做成过度闯关游戏。

首版的核心目标不是堆功能，而是打磨一个稳定顺手的单人本地数独闭环：打开快、棋盘顺、提示有用、每天愿意回来。

**Jiuyu** is a Sudoku miniapp project. The name hints at the nine 3x3 regions of a Sudoku board as small connected islands. The product direction is calm, lightweight, and slightly playful: more approachable than a strict puzzle tool, but more focused than a casual mini-game.

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
| 产品设计 / Product design | Done | 已整理设计方案与首版范围 |
| 项目骨架 / Project scaffold | Done | 已创建原生微信小程序目录结构 |
| 棋盘核心 / Board core | Next | 实现棋盘状态、选格、高亮、输入、撤销 |
| 本地存档 / Local storage | Planned | 保存当前局、设置和统计 |
| 提示引擎 / Hint engine | Planned | 从基础技巧开始实现分层提示 |
| 完成页与统计 / Result and stats | Planned | 完成一局后更新并展示统计 |

## 📚 文档导航 / Documentation

| 文档 | 内容 | 适合什么时候看 |
|---|---|---|
| [九屿数独小程序设计方案](docs/2026-05-22-jiuyu-sudoku-miniapp-design.md) | 产品定位、核心体验、难度系统、提示系统、MVP 范围 | 理解九屿为什么这样设计 |
| [九屿小程序首版实施计划](docs/2026-05-22-jiuyu-miniapp-implementation-plan.md) | 技术选择、目录结构、模块职责、阶段计划 | 准备进入开发或拆任务时 |
| [微信小程序源码目录](miniprogram/) | 页面、组件、服务层和工具模块 | 查看当前工程骨架 |
| [题库占位模块](miniprogram/data/puzzles.js) | 本地题库数据结构示例 | 设计或扩展题库时 |
| [游戏引擎占位模块](miniprogram/services/game-engine.js) | 游戏状态创建与后续棋盘逻辑入口 | 开发棋盘核心逻辑时 |
| [提示引擎占位模块](miniprogram/services/hint-engine.js) | 分层提示能力入口 | 开发提示系统时 |
| [数独工具函数](miniprogram/utils/sudoku.js) | 行、列、宫坐标计算 | 开发棋盘规则与高亮时 |

## 🗂️ 项目结构 / Project Structure

```text
jiuyu-miniapp/
  docs/                         Product design and implementation notes
  miniprogram/                  WeChat Mini Program source
    app.js
    app.json
    app.wxss
    pages/
      home/                     Home, daily entry, continue game
      game/                     Main Sudoku board experience
      settings/                 Difficulty and assistance settings
      result/                   Completion result page
      stats/                    Local statistics
    components/
      sudoku-board/             Board rendering and cell interaction
      number-pad/               Number input
      game-toolbar/             Notes, undo, erase, hint, check
    data/
      puzzles.js                Local puzzle bank
    services/
      game-engine.js            Game state and board operations
      hint-engine.js            Layered hint logic
      storage.js                Local storage wrapper
      stats-service.js          Stats update logic
    utils/
      constants.js
      sudoku.js                 Sudoku coordinate helpers
  project.config.json           WeChat DevTools project config
```

## 🚀 开发方式 / Getting Started

1. 克隆仓库 / Clone the repository.

```bash
git clone https://github.com/yamathyao/jiuyu-miniapp.git
cd jiuyu-miniapp
```

2. 使用微信开发者工具导入项目目录。  
   Open the project folder with WeChat DevTools.

3. AppID 可先使用测试号，后续替换为正式小程序 AppID。  
   Use a test AppID first, then replace it with the official Mini Program AppID later.

4. 小程序入口页面：  
   Entry page:

```text
miniprogram/pages/home/home
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

These features are intentionally out of scope for the first version. The first milestone should prove that a local-first, lightweight, smooth Sudoku miniapp is worth opening every day.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

本项目使用 [MIT License](LICENSE) 开源。
