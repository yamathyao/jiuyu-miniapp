# Settings Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重做设置页为“轻面板感 + 可扩展容器”结构，并在设置页内直接支持难度切换，同时保持语言页入口与现有返回流不变。

**Architecture:** 继续沿用 `main.js` 驱动多 scene 的轻量结构，在 `settings-scene` 内补充新的标题区、语言主卡、难度卡组与说明区，并让 `main.js` 接住设置页返回的难度选择动作。持久化仍复用 `saveSettings()`，不新增独立状态模型。 

**Tech Stack:** WeChat Mini Game Canvas API、CommonJS、Node `--test`

---

## File Structure

- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\settings-scene.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\main.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\i18n\locales.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/specs/2026-06-08-jiuyu-settings-page-redesign-design.md`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/plans/2026-06-08-settings-page-redesign-implementation.md`

## Guardrails

- 不改动 `settings -> language` 的既有路径。
- 不引入新的 scene；仍然只使用 `home / settings / language / board`。
- 不改动难度对应的提示与检查策略逻辑；只改变设置入口与当前难度更新方式。
- 设置页新增难度切换后，首页与设置页都可能更新 `preferredDifficulty`，必须统一走 `persistSettingsState()`。
- 不在本计划中顺手修改 `home-scene`、`board-scene` 或 `language-scene` 的布局。
- `当前难度` 提示应位于难度区上方，不再留在底部说明区重复出现。
- `语言` 与 `难度` section 标题需要比旧版更明确，可适当放大并优先居中。

### Task 1: 先用测试锁定新的设置页结构与难度交互

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`
- Test: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 在设置页测试附近追加难度命中测试**

在现有 `settings scene keeps the language action on the centered main card` 测试后追加：

```js
test("settings scene exposes four difficulty actions inside the page", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = settingsScene.getMetrics();

  assert.deepEqual(
    settingsScene.hitTest(metrics.difficultyCardLeft + 10, metrics.difficultyCardTop + 10),
    { type: "difficulty", value: "beginner" }
  );
  assert.deepEqual(
    settingsScene.hitTest(
      metrics.difficultyCardLeft + metrics.difficultyCardWidth + metrics.difficultyCardGap + 10,
      metrics.difficultyCardTop + 10
    ),
    { type: "difficulty", value: "intermediate" }
  );
  assert.deepEqual(
    settingsScene.hitTest(metrics.difficultyCardLeft + 10, metrics.difficultySecondRowTop + 10),
    { type: "difficulty", value: "skilled" }
  );
  assert.deepEqual(
    settingsScene.hitTest(
      metrics.difficultyCardLeft + metrics.difficultyCardWidth + metrics.difficultyCardGap + 10,
      metrics.difficultySecondRowTop + 10
    ),
    { type: "difficulty", value: "expert" }
  );
});
```

- [ ] **Step 2: 追加设置页内切换难度并持久化的主流程测试**

在主流程测试区域追加：

```js
test("main entry can change preferred difficulty directly inside settings", function () {
  const writes = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");
  let touchHandler = null;

  delete require.cache[mainPath];
  global.wx = {
    createCanvas: function () {
      return {
        width: 375,
        height: 812,
        getContext: function () {
          return {
            fillStyle: "",
            font: "",
            textAlign: "",
            textBaseline: "",
            lineWidth: 1,
            clearRect: function () {},
            fillRect: function () {},
            beginPath: function () {},
            moveTo: function () {},
            lineTo: function () {},
            stroke: function () {},
            fill: function () {},
            arcTo: function () {},
            closePath: function () {},
            fillText: function () {}
          };
        }
      };
    },
    createImage: function () {
      return {
        onload: null,
        onerror: null,
        src: ""
      };
    },
    getStorageSync: function (key) {
      if (key === STORAGE_KEYS.settings) {
        return {
          preferredDifficulty: "beginner",
          language: "zh-CN"
        };
      }

      return "";
    },
    setStorageSync: function (key, value) {
      writes.push([key, value]);
    },
    onTouchStart: function (handler) {
      touchHandler = handler;
    }
  };

  try {
    require("../js/main");
    assert.equal(typeof touchHandler, "function");

    const homeScene = createHomeScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const homeMetrics = homeScene.getMetrics({
      difficultyPickerOpen: false
    });
    const settingsScene = createSettingsScene({
      canvasWidth: 375,
      canvasHeight: 812
    });
    const settingsMetrics = settingsScene.getMetrics();

    touchHandler({
      touches: [{
        clientX: homeMetrics.contentLeft + 20,
        clientY: homeMetrics.settingsTop + 20
      }]
    });

    touchHandler({
      touches: [{
        clientX: settingsMetrics.difficultyCardLeft + settingsMetrics.difficultyCardWidth + settingsMetrics.difficultyCardGap + 20,
        clientY: settingsMetrics.difficultySecondRowTop + 20
      }]
    });

    assert.equal(writes[writes.length - 1][0], STORAGE_KEYS.settings);
    assert.equal(writes[writes.length - 1][1].preferredDifficulty, "expert");
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});
```

- [ ] **Step 3: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，至少出现以下一种失败：
- settingsScene.hitTest(...) 还不支持 difficulty
- settingsScene.getMetrics() 不包含 difficulty 卡片坐标
- main.js 尚未处理 settings 场景中的 difficulty 动作
```

- [ ] **Step 4: 提交测试约束**

```bash
git add tests/game-engine.test.js
git commit -m "test(ui): 补设置页难度切换用例"
```

### Task 2: 重做 settings-scene 的布局与命中结构

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\settings-scene.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\i18n\locales.js`
- Test: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 扩展 `getMetrics()`，加入难度卡组坐标**

在 `settings-scene.js` 中把布局常量扩成以下结构：

```js
  const headerTop = 88;
  const panelTop = 146;
  const heroHeight = 92;
  const languageCardTop = panelTop + heroHeight + 24;
  const languageCardHeight = 88;
  const difficultySectionTop = languageCardTop + languageCardHeight + 28;
  const difficultyCardGap = 12;
  const difficultyCardHeight = 74;
  const difficultyCardWidth = Math.floor((contentWidth - difficultyCardGap) / 2);
  const helperCardTop = difficultySectionTop + difficultyCardHeight * 2 + difficultyCardGap + 20;
  const helperCardHeight = 54;
```

并让 `getMetrics()` 返回：

```js
      difficultyCardLeft: contentLeft,
      difficultyCardTop: difficultySectionTop,
      difficultyCardWidth: difficultyCardWidth,
      difficultyCardHeight: difficultyCardHeight,
      difficultyCardGap: difficultyCardGap,
      difficultySecondRowTop: difficultySectionTop + difficultyCardHeight + difficultyCardGap,
      helperCardTop: helperCardTop,
      helperCardHeight: helperCardHeight
```

- [ ] **Step 2: 新增设置页标题区、语言主卡和难度卡组绘制**
- [ ] **Step 2: 新增设置页标题区、语言主卡和难度卡组绘制**

将 `draw(context, renderState)` 组织为：

```js
    drawBackdrop(context, metrics, visualSpec);
    drawTopline(context, metrics, visualSpec, t);
    drawHeroPanel(context, metrics, visualSpec, t);
    drawLanguageCard(context, metrics, visualSpec, renderState, t);
    drawDifficultyCards(context, metrics, visualSpec, renderState, t);
    drawHelperCards(context, metrics, visualSpec, t);
```

并确保 `drawDifficultyCards(...)` 使用 `renderState.selectedDifficulty` 产生激活态，而不是硬编码某一档难度。
同时把 `当前难度：...` 放到难度区标题和卡组之间，作为轻提示，而不是底部摘要卡。

- [ ] **Step 3: 为设置页新增难度卡命中检测**

在 `hitTest(x, y)` 中保留 `back` 和 `language` 检测后，追加：

```js
    const difficultyActions = [
      { value: "beginner", left: metrics.difficultyCardLeft, top: metrics.difficultyCardTop },
      {
        value: "intermediate",
        left: metrics.difficultyCardLeft + metrics.difficultyCardWidth + metrics.difficultyCardGap,
        top: metrics.difficultyCardTop
      },
      { value: "skilled", left: metrics.difficultyCardLeft, top: metrics.difficultySecondRowTop },
      {
        value: "expert",
        left: metrics.difficultyCardLeft + metrics.difficultyCardWidth + metrics.difficultyCardGap,
        top: metrics.difficultySecondRowTop
      }
    ];

    for (let index = 0; index < difficultyActions.length; index += 1) {
      const action = difficultyActions[index];

      if (
        x >= action.left &&
        x <= action.left + metrics.difficultyCardWidth &&
        y >= action.top &&
        y <= action.top + metrics.difficultyCardHeight
      ) {
        return { type: "difficulty", value: action.value };
      }
    }
```

- [ ] **Step 4: 补 i18n 文案，让设置页更像一个完整面板**
- [ ] **Step 4: 补 i18n 文案，让设置页更像一个完整面板**

在 `js/i18n/locales.js` 的 `settings` 下补充：

```js
      subtitle: "在这里调整语言与挑战节奏。",
      languageHint: "进入语言页后立即生效",
      difficultyLabel: "难度",
      difficultyHint: "当前主题气质与提示强度会随难度变化",
      difficultyCurrent: "当前难度：{difficulty}",
      difficultyBeginnerHint: "更轻松，提示更充分",
      difficultyIntermediateHint: "保持陪伴感，也保留思考空间",
      difficultySkilledHint: "更利落，检查更克制",
      difficultyExpertHint: "最冷静，也最专注",
      helperFuture: "后续音效、视觉偏好或辅助能力都可继续放在这里。"
```

并为英文补对应翻译。

- [ ] **Step 5: 运行测试，确认 settings-scene 相关改动通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
settings scene 相关测试 PASS；主流程测试可能仍因 main.js 尚未接 difficulty 动作而失败
```

- [ ] **Step 6: 提交 settings-scene 重构**

```bash
git add js/scene/settings-scene.js js/i18n/locales.js tests/game-engine.test.js
git commit -m "feat(ui): 重构设置页布局结构"
```

### Task 3: 接通设置页内难度切换动作

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\main.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`
- Reference: `D:\GithubWorkspace\jiuyu-miniapp\js\services/storage.js`

- [ ] **Step 1: 在 `activeScreen === "settings"` 分支中接住 difficulty 动作**

在 `main.js` 的 settings 分支中追加：

```js
      if (settingsAction.type === "difficulty") {
        selectedDifficulty = settingsAction.value;
        persistSettingsState();
        draw();
        return;
      }
```

- [ ] **Step 2: 确认设置页绘制持续读取当前共享难度**

保持 `drawSettings()` 使用：

```js
    settingsScene.draw(context, {
      selectedDifficulty: selectedDifficulty,
      language: language,
      t: t
    });
```

不要引入额外的本地难度状态副本。

- [ ] **Step 3: 运行完整测试，确认主流程与持久化通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
# pass
# fail 0
```

- [ ] **Step 4: 提交设置页内难度切换能力**

```bash
git add js/main.js tests/game-engine.test.js
git commit -m "feat(settings): 支持页内切换难度"
```

### Task 4: 回写文档与最终验证

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/specs/2026-06-08-jiuyu-settings-page-redesign-design.md`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/plans/2026-06-08-settings-page-redesign-implementation.md`

- [ ] **Step 1: 确认 spec 中保留这三个核心约束**
- [ ] **Step 1: 确认 spec 中保留这三个核心约束**

在设计文档中确认保留：

```md
- 语言继续保持独立主卡片
- 难度设置直接在当前页展示 4 个可点击选项
- 设置页成为后续新增设置项时可继续扩展的稳定容器
- `当前难度` 位于难度区上方
- `语言 / 难度` 标题更明确，并优先居中
```

- [ ] **Step 2: 运行最终回归**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
# pass
# fail 0
```

- [ ] **Step 3: 检查最终 diff**

Run:

```bash
git -c safe.directory=D:/GithubWorkspace/jiuyu-miniapp diff -- js/scene/settings-scene.js js/main.js js/i18n/locales.js tests/game-engine.test.js docs/superpowers/specs/2026-06-08-jiuyu-settings-page-redesign-design.md docs/superpowers/plans/2026-06-08-settings-page-redesign-implementation.md
```

Expected:

```text
只出现设置页重设计与对应文档改动
```

- [ ] **Step 4: 提交文档收尾**

```bash
git add docs/superpowers/specs/2026-06-08-jiuyu-settings-page-redesign-design.md docs/superpowers/plans/2026-06-08-settings-page-redesign-implementation.md
git commit -m "docs: 补设置页重设计计划"
```

## Self-Review

- Spec coverage：已覆盖轻面板感结构、语言主卡、设置页内难度切换、共享状态同步、可扩展容器和验证要求。
- Placeholder scan：没有 `TODO/TBD` 或模糊步骤；每个任务都给出明确文件、代码或命令。
- Type consistency：统一使用现有 `selectedDifficulty`、`persistSettingsState()`、`settingsScene.hitTest()`、`loadSettings()/saveSettings()` 等命名和接口。
