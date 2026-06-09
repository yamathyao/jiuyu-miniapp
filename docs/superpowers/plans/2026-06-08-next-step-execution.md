# Next Step Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不扩大行为范围的前提下，继续完成一轮低风险结构整合，让首页 / 设置页 / 语言页的视觉参数与 `main.js` 的页面切换逻辑更清晰、更容易继续维护。

**Architecture:** 先抽公共视觉 spec 构造层，消除 `home / settings / language` 之间重复的难度配色分支，再把 `main.js` 中已经成型的页面切换与状态持久化逻辑拆成更聚焦的 helper。最后只做少量英文文案与视觉回归修整，不在本轮引入新 scene、存档格式或棋盘规则改动。

**Tech Stack:** WeChat Mini Game Canvas API、CommonJS、Node `--test`

---

## File Structure

- Create: `D:\GithubWorkspace\jiuyu-miniapp\js\ui\scene-visual-spec.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\home-scene.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\settings-scene.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\language-scene.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\main.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\i18n\locales.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/plans/2026-06-08-session-wrap.md`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/plans/2026-06-08-next-step-execution.md`

## Scope Guardrails

- 只做“轻量整合 + 定向收口”，不引入新页面、不调整存档结构、不改数独规则。
- `设置页切换难度 = 直接新开局` 这一决策保持不变。
- 首页难度入口继续保留图片方案，不回退到程序化难度图案。
- 若 `main.js` 拆分过程中需要新增模块，只允许抽纯 helper，不在本轮改造为完整状态机。
- 若视觉修整需要再次改图片资源，必须先确认不是可以通过布局或文案解决的问题。
- 任一任务完成后，都至少运行一次 `node --test tests/game-engine.test.js`。

## Recommended Execution Order

1. 先做 Scene 视觉 spec 抽取，降低重复分支。
2. 再做 `main.js` helper 化，避免边改页面边改入口导致回归面扩大。
3. 最后做英文界面和细节回归，确保本轮以可提交状态收口。

### Task 1: 抽出共享 visual spec 构造层

**Files:**
- Create: `D:\GithubWorkspace\jiuyu-miniapp\js\ui\scene-visual-spec.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\home-scene.js:108`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\settings-scene.js:105`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\language-scene.js:42`
- Test: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 为 visual spec 新增独立模块**

在 `js/ui/scene-visual-spec.js` 新建共享构造函数，先只覆盖当前三套 scene 已经共用的难度色板：

```js
function isProDifficulty(difficulty) {
  return difficulty === "skilled" || difficulty === "expert";
}

function createSharedScenePalette(difficulty) {
  if (isProDifficulty(difficulty)) {
    return {
      background: "#f2f1ea",
      haloFill: "#e4e1d7",
      panelFill: "#f4f1e8",
      headerWashFill: "#ece9df",
      titleColor: "#314541",
      bodyColor: "#65716d",
      cardFill: "#fbfaf5",
      cardBorder: "#c8c6ba",
      cardAccent: "#dde4dc",
      accentText: "#39504b",
      helperFill: "#8c9790",
      ornament: "#6f817a",
      dividerFill: "#99a198"
    };
  }

  return {
    background: "#f9efe3",
    haloFill: "#f5e5d1",
    panelFill: "#f8ead7",
    headerWashFill: "#fbf1e4",
    titleColor: "#6b3e42",
    bodyColor: "#8f6d65",
    cardFill: "#fff8ef",
    cardBorder: "#e0bda4",
    cardAccent: "#f5e4d5",
    accentText: "#7a4d4f",
    helperFill: "#b58f72",
    ornament: "#c89256",
    dividerFill: "#c68e5f"
  };
}

module.exports = {
  isProDifficulty: isProDifficulty,
  createSharedScenePalette: createSharedScenePalette
};
```

- [ ] **Step 2: 让 settings-scene 和 language-scene 直接复用共享 palette**

把这两个 scene 里重复的 `isProDifficulty()` 和 `getVisualSpec()` 难度分支替换为共享模块调用，只保留本页面独有字段：

```js
const {
  isProDifficulty,
  createSharedScenePalette
} = require("../ui/scene-visual-spec");

function getVisualSpec(renderState) {
  const difficulty = renderState && renderState.selectedDifficulty
    ? renderState.selectedDifficulty
    : "beginner";
  const palette = createSharedScenePalette(difficulty);

  return Object.assign({}, palette, {
    accentSoftText: isProDifficulty(difficulty) ? "#6e7974" : "#8d6c65"
  });
}
```

`language-scene.js` 若没有 `accentSoftText` 需求，则直接返回 `createSharedScenePalette(difficulty)`。

- [ ] **Step 3: 将 home-scene 改成“共享 palette + 首页扩展字段”**

保留首页独有的 `tone / brandSubtitle / brush* / labelFill`，但公共底色字段不再手写两遍：

```js
const { createSharedScenePalette } = require("../ui/scene-visual-spec");

function getVisualSpec(renderState) {
  const selectedDifficulty = renderState && renderState.selectedDifficulty
    ? renderState.selectedDifficulty
    : "beginner";
  const palette = createSharedScenePalette(selectedDifficulty);
  const isPro = selectedDifficulty === "skilled" || selectedDifficulty === "expert";

  return Object.assign({}, palette, isPro
    ? {
        tone: "pro",
        panelFill: "#f8f6ef",
        panelShadow: "#b8b5aa",
        subtitleColor: "#66736f",
        accentFill: "#586f69",
        accentText: "#ffffff",
        secondaryFill: "#e6e0d6",
        secondaryText: "#324540"
      }
    : {
        tone: "playful",
        panelFill: "#fff8ef",
        panelShadow: "#d8b39d",
        subtitleColor: "#946f60",
        accentFill: "#d8747a",
        accentText: "#ffffff",
        secondaryFill: "#f4dfcf",
        secondaryText: "#7b4c46"
      });
}
```

- [ ] **Step 4: 追加一条回归测试，锁定高难主题色仍然生效**

在 `tests/game-engine.test.js` 追加一条 scene 级断言，确认高难度仍会生成 `#f2f1ea` 背景：

```js
test("settings and language scenes keep the ink-paper palette for pro difficulties", function () {
  const settingsScene = createSettingsScene({ canvasWidth: 375, canvasHeight: 812 });
  const languageScene = createLanguageScene({ canvasWidth: 375, canvasHeight: 812 });

  assert.equal(
    settingsScene.getVisualSpec({ selectedDifficulty: "expert" }).background,
    "#f2f1ea"
  );
  assert.equal(
    languageScene.getVisualSpec({ selectedDifficulty: "skilled" }).background,
    "#f2f1ea"
  );
});
```

- [ ] **Step 5: 运行测试验证重构不改行为**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
PASS
包含新增的 scene palette 回归用例
```

### Task 2: 将 main.js 中的页面切换和状态持久化整理成 helper

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\main.js:141`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`
- Test: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 先在 main.js 内做局部函数归并，不额外新建模块**

围绕现有逻辑先整理出两组 helper，避免本轮同时引入跨文件依赖：

```js
function applyGameSnapshot(nextGame, nextSelectedIndex, nextNoteMode) {
  game = nextGame;
  selectedIndex = nextSelectedIndex;
  noteMode = nextNoteMode;
  persistGameState();
}

function switchScreen(nextScreen) {
  activeScreen = nextScreen;
  draw();
}
```

并将以下分支改为复用：
- `startNewGame()`
- `applyDifficultySelection()`
- `continueGame()`
- `openSettings()`
- `goBackFromSettings()`
- `wx.onTouchStart(...)` 内的 `draw(); return;` 分支

- [ ] **Step 2: 收敛 settings / language / home 三处 touch handler 分支**

把三段页面级分支各自改成“先解析 action，再统一执行”的形态，目标是把 `wx.onTouchStart(...)` 压到更易读的长度：

```js
function handleHomeAction(homeAction) {
  if (!homeAction) {
    return false;
  }

  if (homeAction.type === "difficulty") {
    selectedDifficulty = homeAction.value;
    difficultyPickerOpen = false;
    persistSettingsState();
    switchScreen("home");
    return true;
  }

  return false;
}
```

`handleSettingsAction()` 与 `handleLanguageAction()` 采用同样模式，最后在 `wx.onTouchStart(...)` 中只做分发：

```js
if (activeScreen === "home") {
  if (handleHomeAction(homeScene.hitTest(...))) {
    return;
  }
}
```

- [ ] **Step 3: 用现有测试保障切换难度与返回流不变**

不新增复杂 mock，只确保以下用例仍通过：
- 设置页切换难度会写入 `preferredDifficulty`
- 设置页返回会回到进入来源
- 语言切换后仍停留在语言页并立即刷新文案

若当前测试缺一项，则在 `tests/game-engine.test.js` 补一条最小用例：

```js
test("main entry returns to board when settings is opened from board", function () {
  assert.equal(true, true);
});
```

实现时应把这条占位替换成真实触摸流测试，不允许保留占位断言。

- [ ] **Step 4: 运行测试确认 helper 化后入口行为不回归**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
PASS
原有 63 条与新增入口回归用例全部通过
```

### Task 3: 进行一轮英文界面与文案收口

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\i18n\locales.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\home-scene.js:13`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\settings-scene.js:23`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\language-scene.js:103`
- Test: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 收紧首页英文副标题，避免再出现单行溢出**

优先通过文案长度与换行上限解决，不先动图片或整体布局。建议将英文副标题保持在 6 到 10 个词内，例如：

```js
"home.subtitle.pro": "Find a focused solving rhythm.",
"home.subtitle.playful": "Begin softly and settle in."
```

- [ ] **Step 2: 统一英文页面的 section 留白策略**

仅做参数级调整，不再逐像素试探。建议对 settings / language 统一采用：

```js
const sectionGap = 32;
const sectionTitleToCardGap = 20;
const metaGap = 20;
```

若 `language-scene.js` 仍偏紧，则优先把：

```js
const sectionTop = panelTop + heroHeight + 32;
const optionTop = sectionTop + 34;
```

而不是继续在绘制函数内部单独偏移文本。

- [ ] **Step 3: 回归英文提示文案，确保棋盘页提示仍然简洁**

检查 `locales.js` 中今天已缩短的提示是否还保持以下方向：

```js
"hint.nakedSingle.detail": "this cell has only one candidate left."
```

若新增英文文案，需要继续遵守“短句、单行优先、术语不堆叠”的规则。

- [ ] **Step 4: 运行测试并做最小人工回归清单**

Run:

```bash
node --test tests/game-engine.test.js
```

人工回归清单：

```text
1. 中文设置页中“语言”上下留白仍明显大于旧版
2. 英文设置页中 “Language” 不贴近卡片标题区
3. 英文首页品牌副标题不会单行溢出
4. 设置页切换难度后，当前提示与棋局都同步更新
```

### Task 4: 更新文档并准备提交窗口

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/plans/2026-06-08-session-wrap.md`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/plans/2026-06-08-next-step-execution.md`

- [ ] **Step 1: 在 session-wrap 中补上“已完成 / 下一步”边界**

至少补三点：

```text
- 已完成：设置页、语言页、工具栏和包体收口
- 下一步：scene visual spec 抽取
- 下一步：main.js helper 化与英文界面回归
```

- [ ] **Step 2: 执行完本计划后，回填本文件复选框与验证结果**

回填格式保持：

```md
- [x] Step 名称
  - 验证：`node --test tests/game-engine.test.js`
  - 结果：PASS
```

- [ ] **Step 3: 提交前做一次状态确认**

Run:

```bash
git status --short
```

Expected:

```text
只包含本轮计划涉及的代码、文档和必要资源文件
没有意外新增的大体积原图或调试文件
```

## Stop Points

- 如果 visual spec 抽取后需要同时修改 `board-scene.js` 或 `theme-policy.js` 才能维持一致，先停止，重新确认是否扩大成本边界。
- 如果 `main.js` helper 化后测试需要大规模重写，说明拆分点选得不对，应回退到“只整理函数顺序，不拆分 handler”。
- 如果英文布局问题只能依靠再次修改图片资源解决，先暂停并重新评估是否值得进包体。

## Validation Baseline

- 必跑：`node --test tests/game-engine.test.js`
- 提交前建议再看一轮：
  - 首页难度图片宽度与整体节奏
  - 设置页中英文切换后的留白
  - 棋盘页竹简数字键与功能键对比关系

## Self-Review

- 本计划已覆盖当前收尾文档中提到的两个核心后续方向：
  - `settings / language / home` 的视觉 spec 抽取
  - `main.js` 的状态切换与页面跳转收敛
- 本计划没有扩展到新 scene、存档改造或图片重绘，边界保持在当前可控范围内。
- 本计划保留了测试与人工回归双验证，适合下一次直接执行。
