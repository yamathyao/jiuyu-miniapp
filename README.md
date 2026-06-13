# 方庭九屿 Jiuyu Miniapp

> 一款本地优先、支持分层提示的数独微信小游戏。  
> A local-first Sudoku WeChat Minigame with layered guidance for different skill levels.

🧩 **当前状态 / Status:** 主循环、四档难度、三语言界面、计时、统计与微信原生分享已完成，当前仓库可作为成品基线继续维护。  
📱 **平台 / Platform:** 微信小游戏 / WeChat Minigame  
🌿 **策略 / Strategy:** 本地优先 / Local-first

## ✨ 简介 / Introduction

**方庭九屿** 聚焦单人本地数独体验：打开快、棋盘顺、可稳定完成一局，也能通过按难度分层的提示与检查，兼顾新手上手和熟练玩家专注解题。

当前版本已经完成完整主循环，包含首页、棋盘、设置、语言切换、局内计时、完成反馈、本地统计，以及微信原生分享能力，适合作为可直接上线或继续精修的产品基线。

**Jiuyu** focuses on a smooth single-player local Sudoku experience: fast launch, responsive board interaction, reliable puzzle flow, and difficulty-aware guidance that supports both new players and experienced solvers.

The current build already covers the full gameplay loop, including home screen, board scene, settings, language switching, in-game timer, completion feedback, local stats, and native WeChat sharing.

## 🧭 产品定位 / Product Positioning

| 中文 | English |
|---|---|
| 日常可玩 | Easy to open and play every day |
| 专业可调 | Assistance scales with solver skill |
| 本地优先 | No login or backend dependency |
| 反馈克制 | Clear feedback without noisy interruption |
| 提示可理解 | Hints explain directly in the current language |

## 🧩 核心特性 / Features

### 🎯 主玩法闭环 / Core Gameplay Loop

- **四档难度 / Four difficulty levels**  
  `beginner / intermediate / skilled / expert`

- **三语言界面 / Three UI languages**  
  `简体中文 / English / 日本語`

- **棋盘核心交互 / Board interaction**  
  选格、填数、笔记、擦除、撤销、高亮已完整接通。

- **局内计时 / In-game timer**  
  单局秒表持续推进，完成后定格在结算时间，不会继续走动。

- **本地存档 / Local save**  
  自动保存当前局面；未完成棋局支持继续游戏，已完成棋局返回首页后按新局处理。

- **完成反馈 / Completion feedback**  
  已完成完成卡片、结果标签与回流入口。

### 🧠 提示与检查 / Hints and Validation

- **分层提示 / Layered hints**  
  按难度提供不同强度的方向提示、格位提示和技巧提示。

- **直白解释 / Direct wording**  
  新手和进阶难度不直接抛出 `R3C5`、`Naked Single` 这类术语，而是使用当前语言的直接解释。

- **技术向表达 / Technical guidance for expert play**  
  更高难度下保留更硬、更技术性的提示风格。

- **分级检查 / Difficulty-aware checking**  
  根据难度控制检查反馈的严格程度。

### 📈 本地体验增强 / Local Experience

- **本地统计 / Local stats**  
  完成数、平均时间、平均提示数、连续天数。

- **微信原生分享 / Native WeChat share**  
  支持右上角菜单分享给好友、分享到朋友圈。

- **高分屏适配 / High-DPR rendering**  
  按设备像素比初始化画布，提升真机清晰度。

- **首页布局收口 / Home layout polish**  
  首页品牌卡片、主按钮、设置区与局内顶部区域已经按真机观感完成留白和位置调整。

- **结构化题库 / Structured puzzle bank**  
  带校验与摘要脚本，约束题库结构多样性。

## 🎨 设计原则 / Design Principles

| 原则 | 说明 |
|---|---|
| 棋盘优先 | 重点保证输入、提示、排错、存档和完成反馈的顺滑度。 |
| 本地优先 | 首版不依赖登录、云端和外部服务。 |
| 辅助分层 | 新手获得直接帮助，老手减少干扰。 |
| 语言一致 | 提示内容优先用当前语言的直观表达。 |
| 视觉克制 | 清晰、稳定、耐看，不过度装饰。 |

## 🗂️ 项目结构 / Project Structure

```text
jiuyu-miniapp/
  game.js
  game.json
  js/
    main.js
    data/
      puzzles-*.js
    scene/
    services/
    ui/
    utils/
  scripts/
  tests/
  project.config.json
```

## 🚀 开发与运行 / Getting Started

1. 克隆仓库 / Clone the repository.

```bash
git clone https://github.com/yamathyao/jiuyu-miniapp.git
cd jiuyu-miniapp
```

2. 使用微信开发者工具按“微信小游戏”项目导入仓库目录。  
   Open the project folder with WeChat DevTools as a WeChat Minigame project.

3. 配置对应小游戏 AppID 后即可运行。  
   Use a valid WeChat Minigame AppID before previewing or building.

## 🧪 验证建议 / Verification

建议至少完成以下验证：

- 高 DPR 设备上的文字与棋盘是否足够清晰
- 局内计时是否持续推进，并在完成卡片中正确落地
- 完成一局后退出再进入时，首页是否回到“开始新局”状态
- 右上角菜单中的“分享给好友 / 分享到朋友圈”是否符合预期
- 首页品牌卡片与右上角区域、局内提示区与计数标记之间的留白是否自然

运行当前逻辑回归：

```bash
node --test tests/game-engine.test.js
```

## 🧱 题库维护 / Puzzle Maintenance

调整题库后，建议至少运行：

```bash
node scripts/validate-puzzles.js
node scripts/summarize-puzzles.js
```

- `validate-puzzles.js`：校验题目合法性、解答一致性和最小结构多样性门槛
- `summarize-puzzles.js`：输出各难度题量、givens 分布和结构簇摘要

## 🧭 当前范围 / Current Scope

当前仓库聚焦数独核心玩法与本地体验，不包含以下外围能力：

- 登录 / Login
- 云同步 / Cloud sync
- 排行榜 / Leaderboards
- 动态挑战分享或战绩分享 / Shareable challenge or result cards
- 广告 / Ads
- 皮肤商城 / Theme shop

这些能力并非不重要，而是有意放在核心体验稳定之后再考虑。

## 📄 License

本项目使用 [MIT License](LICENSE) 开源。  
This project is licensed under the [MIT License](LICENSE).
