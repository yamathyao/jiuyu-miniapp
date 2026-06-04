> 历史文档说明：本文基于微信小程序结构编写，已不再代表当前实施主线。  
> 当前请优先阅读：[九屿当前实施计划](./2026-06-04-jiuyu-current-implementation-plan.md)。

# 九屿小程序首版实施计划

## 目标

基于《九屿数独小程序设计方案》，创建一个可在微信开发者工具中继续开发的原生小程序项目骨架，并把首版开发拆成可执行阶段。

首版核心目标：

- 本地题库、本地存档、本地统计。
- 首页、棋盘页、设置页、完成页、统计页。
- 四档难度：入门、进阶、熟练、专家。
- 棋盘输入、候选数、撤销、擦除、暂停。
- 基础排错与分层提示。

## 技术选择

| 方向 | 选择 | 理由 |
|---|---|---|
| 小程序形态 | 原生微信小程序 | 目录清晰、启动快、无需首日引入构建链 |
| 语言 | JavaScript | 降低初期配置成本，后续可按需迁移 TypeScript |
| 样式 | WXSS | 直接贴合微信小程序运行时 |
| 数据 | wx storage + 本地 JS 题库 | 符合首版本地优先策略 |
| 测试 | 纯逻辑模块优先拆出，可后续接 Jest/Vitest | 首日先建可测试边界，不急于引入依赖 |

## 目录结构

```text
jiuyu-miniapp/
  docs/
    2026-05-22-jiuyu-sudoku-miniapp-design.md
    2026-05-22-jiuyu-miniapp-implementation-plan.md
  miniprogram/
    app.js
    app.json
    app.wxss
    sitemap.json
    pages/
      home/
        home.js
        home.json
        home.wxml
        home.wxss
      game/
        game.js
        game.json
        game.wxml
        game.wxss
      settings/
        settings.js
        settings.json
        settings.wxml
        settings.wxss
      result/
        result.js
        result.json
        result.wxml
        result.wxss
      stats/
        stats.js
        stats.json
        stats.wxml
        stats.wxss
    components/
      sudoku-board/
        sudoku-board.js
        sudoku-board.json
        sudoku-board.wxml
        sudoku-board.wxss
      number-pad/
        number-pad.js
        number-pad.json
        number-pad.wxml
        number-pad.wxss
      game-toolbar/
        game-toolbar.js
        game-toolbar.json
        game-toolbar.wxml
        game-toolbar.wxss
    data/
      puzzles.js
    services/
      game-engine.js
      hint-engine.js
      storage.js
      stats-service.js
    utils/
      constants.js
      sudoku.js
  project.config.json
  project.private.config.json
  README.md
```

## 模块职责

| 模块 | 职责 |
|---|---|
| `pages/home` | 展示继续当前局、今日一题、新开一局、统计和设置入口 |
| `pages/game` | 串联棋盘、数字键盘、工具栏、计时、提示、排错和存档 |
| `pages/settings` | 管理难度档位和辅助偏好 |
| `pages/result` | 展示完成结果和下一步动作 |
| `pages/stats` | 展示本地统计 |
| `components/sudoku-board` | 只负责棋盘展示、选格和格子事件 |
| `components/number-pad` | 负责数字输入、禁用态和笔记模式反馈 |
| `components/game-toolbar` | 负责笔记、撤销、擦除、提示、检查、暂停等命令入口 |
| `services/game-engine` | 管理游戏状态、填数、笔记、撤销、完成判断 |
| `services/hint-engine` | 提供分层提示，首版先支持唯一候选、隐藏唯一、基础排除 |
| `services/storage` | 封装本地存储 key，避免页面直接散落 `wx.getStorageSync` |
| `services/stats-service` | 更新完成数、连续天数、最好成绩、平均用时 |
| `utils/sudoku` | 放置数独坐标、宫格、同行列宫检查等纯函数 |

## 阶段计划

### 阶段 1：项目骨架

- 创建原生小程序基础文件。
- 创建页面和组件目录。
- 创建服务层与工具层占位模块。
- 写入 README，说明项目定位和启动方式。
- 初始化 Git 并配置 GitHub remote。

验收标准：

- 微信开发者工具可以导入项目目录。
- `app.json` 中路由完整。
- 所有页面、组件、服务模块职责清晰。

### 阶段 2：棋盘核心

- 实现棋盘数据结构。
- 实现 9x9 棋盘渲染。
- 实现选格、同行列宫高亮、相同数字高亮。
- 实现数字输入、擦除、撤销。
- 实现题目给定数字不可编辑。

验收标准：

- 可以完成一局静态题目的基本输入。
- 输入错误不会破坏状态。
- 撤销能回到上一步。

### 阶段 3：本地题库与存档

- 接入本地题库。
- 新开一局按难度选择题目。
- 自动保存当前局面、笔记、用时、错误和提示次数。
- 首页可继续当前局。

验收标准：

- 关闭并重新进入小程序后可恢复当前局。
- 不同难度能选择不同题目。

### 阶段 4：辅助与提示

- 实现冲突检查。
- 实现答案检查。
- 实现唯一候选提示。
- 实现隐藏唯一提示。
- 按难度控制提示粒度。

验收标准：

- 入门档能获得更明确提示。
- 专家档提示更克制。
- 排错方式可被设置项控制。

### 阶段 5：设置、统计与完成页

- 实现四档难度设置。
- 实现高级辅助偏好。
- 完成后更新统计。
- 展示用时、错误、提示次数、完成反馈。

验收标准：

- 完成一局后统计正确更新。
- 设置变化能影响新局和当前局辅助行为。

## 开发约束

- 首版不接服务端。
- 首版不做登录、云同步、排行榜、分享挑战、广告和皮肤商城。
- 棋盘页优先级高于首页装饰。
- 逻辑模块优先写成纯函数，方便后续补测试。
- 页面文件保持轻量，复杂逻辑放入 `services` 和 `utils`。

## Git 约定

提交信息使用：

```text
<type>(scope): <summary>
```

示例：

```text
docs: 初始化九屿设计与实施计划
chore: 创建小程序项目骨架
feat(game): 实现棋盘基础输入
```
