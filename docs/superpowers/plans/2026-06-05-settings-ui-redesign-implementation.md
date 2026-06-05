# 方庭九屿设置入口与分级视觉重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为方庭九屿落地独立设置页与语言页、补齐棋盘页设置入口，并按难度完成两组更精致的国风 / 水墨视觉重构。

**Architecture:** 继续沿用 `main.js` 驱动多 scene 的轻量结构，在不引入真正路由框架的前提下，把当前首页内嵌设置流拆为 `home / settings / language / board` 四个状态。视觉层通过 `theme-policy` 与各 scene 自身的 `visualSpec` 做分级切换，业务状态仍集中在 `main.js`。

**Tech Stack:** WeChat Mini Game Canvas API、CommonJS、Node `--test`

---

### Task 1: 用测试锁定新的场景流与设置入口

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`
- Reference: `D:\GithubWorkspace\jiuyu-miniapp\js\main.js`
- Reference: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\home-scene.js`
- Reference: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\board-scene.js`

- [ ] **Step 1: 为首页、棋盘页和主流程补充失败测试**

```js
test("home scene exposes a settings action without inline language options", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics();

  assert.deepEqual(
    homeScene.hitTest(metrics.contentLeft + 20, metrics.settingsTop + 20),
    { type: "action", value: "settings" }
  );
  assert.equal(
    homeScene.hitTest(metrics.contentLeft + 20, metrics.languageOptionTop + 20, {
      settingsOpen: true
    }),
    null
  );
});

test("board scene exposes a settings button hit area in the header", function () {
  const boardScene = createBoardScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = boardScene.getMetrics();

  assert.deepEqual(
    boardScene.hitTestHeaderAction(metrics.settingsLeft + 8, metrics.settingsTop + 8),
    { type: "action", value: "settings" }
  );
});

test("main entry can open settings from home and switch language on the dedicated language page", function () {
  const texts = [];
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
            fillText: function (text) {
              texts.push(text);
            }
          };
        }
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

    touchHandler({ touches: [{ clientX: 60, clientY: 580 }] });
    touchHandler({ touches: [{ clientX: 120, clientY: 300 }] });
    touchHandler({ touches: [{ clientX: 220, clientY: 360 }] });

    assert.ok(texts.includes("语言"));
    assert.ok(texts.includes("Language"));
    assert.equal(writes[writes.length - 1][0], STORAGE_KEYS.settings);
    assert.equal(writes[writes.length - 1][1].language, "en");
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});
```

- [ ] **Step 2: 运行定向测试，确认它们先失败**

Run: `node --test tests/game-engine.test.js`
Expected: FAIL，至少出现以下一种失败：
- `homeScene.hitTest(...)` 仍返回语言选项
- `boardScene.hitTestHeaderAction is not a function`
- 主流程仍停留在首页内嵌设置逻辑

- [ ] **Step 3: 提交测试骨架**

```bash
git add tests/game-engine.test.js
git commit -m "test: 补设置页重构行为测试"
```

### Task 2: 重写首页 scene，去掉内嵌设置并提升入口页气质

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\home-scene.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\i18n\locales.js`
- Test: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 为首页 scene 的新文案与视觉 spec 补测试**

```js
test("home scene visual spec uses dedicated settings entry copy", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const zhSpec = homeScene.getVisualSpec({
    selectedDifficulty: "beginner",
    t: createTranslator("zh-CN")
  });
  const enSpec = homeScene.getVisualSpec({
    selectedDifficulty: "expert",
    t: createTranslator("en")
  });

  assert.equal(zhSpec.settingsLabel, "设置");
  assert.equal(enSpec.settingsLabel, "Settings");
  assert.equal(typeof zhSpec.decorTone, "string");
  assert.equal(typeof enSpec.decorTone, "string");
});
```

- [ ] **Step 2: 实现首页纯入口页结构**

```js
function draw(context, renderState) {
  const metrics = getMetrics();
  const hasSavedGame = !renderState || renderState.hasSavedGame !== false;
  const selectedDifficulty = renderState && renderState.selectedDifficulty
    ? renderState.selectedDifficulty
    : "beginner";
  const t = renderState && typeof renderState.t === "function"
    ? renderState.t
    : function (key) {
        return key;
      };
  const visualSpec = getVisualSpec(renderState);

  context.fillStyle = visualSpec.background;
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  drawBrandBackdrop(context, metrics, visualSpec);
  drawBrandText(context, metrics, visualSpec);
  drawPrimaryActions(context, metrics, hasSavedGame, visualSpec);
  drawDifficultyGrid(context, metrics, selectedDifficulty, visualSpec, t);
  drawSettingsEntry(context, metrics, visualSpec);
  drawHomeFooter(context, metrics, hasSavedGame, visualSpec);
}

function hitTest(x, y, state) {
  const metrics = getMetrics();
  const hasSavedGame = !state || state.hasSavedGame !== false;
  const primaryAction = hasSavedGame ? "continue" : "new-game";

  if (isInsideRect(x, y, metrics.primaryButtonLeft, metrics.primaryButtonTop, contentWidth, buttonHeight)) {
    return { type: "action", value: primaryAction };
  }

  if (isInsideRect(x, y, metrics.secondaryButtonLeft, metrics.secondaryButtonTop, contentWidth, buttonHeight)) {
    return { type: "action", value: "new-game" };
  }

  const difficultyAction = hitDifficultyCard(x, y, metrics);
  if (difficultyAction) {
    return difficultyAction;
  }

  if (isInsideRect(x, y, contentLeft, settingsTop, contentWidth, 46)) {
    return { type: "action", value: "settings" };
  }

  return null;
}
```

- [ ] **Step 3: 补首页翻译键**

```js
settings: {
  title: "设置",
  pageTitle: "设置",
  languageLabel: "语言",
  languageSummary: "当前语言：{language}",
  difficultySummary: "当前难度：{difficulty}",
  helper: "可在这里调整语言等基础选项。"
},
languagePage: {
  title: "语言",
  applied: "切换后立即生效"
},
common: {
  back: "返回"
}
```

- [ ] **Step 4: 运行测试确认首页改动通过**

Run: `node --test tests/game-engine.test.js`
Expected: 首页相关测试 PASS，其余可能仍因设置页 / 语言页 / main 流程未完成而失败

- [ ] **Step 5: 提交首页重构**

```bash
git add js/scene/home-scene.js js/i18n/locales.js tests/game-engine.test.js
git commit -m "feat(ui): 重构首页入口页样式"
```

### Task 3: 新增设置页与语言页 scene

**Files:**
- Create: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\settings-scene.js`
- Create: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\language-scene.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\i18n\locales.js`

- [ ] **Step 1: 为设置页和语言页命中区域补失败测试**

```js
const { createSettingsScene } = require("../js/scene/settings-scene");
const { createLanguageScene } = require("../js/scene/language-scene");

test("settings scene exposes back and language actions", function () {
  const settingsScene = createSettingsScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = settingsScene.getMetrics();

  assert.deepEqual(
    settingsScene.hitTest(metrics.backLeft + 8, metrics.backTop + 8),
    { type: "action", value: "back" }
  );
  assert.deepEqual(
    settingsScene.hitTest(metrics.languageCardLeft + 8, metrics.languageCardTop + 8),
    { type: "action", value: "language" }
  );
});

test("language scene exposes back and locale actions", function () {
  const languageScene = createLanguageScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = languageScene.getMetrics();

  assert.deepEqual(
    languageScene.hitTest(metrics.backLeft + 8, metrics.backTop + 8),
    { type: "action", value: "back" }
  );
  assert.deepEqual(
    languageScene.hitTest(metrics.optionLeft + 8, metrics.optionTop + 8),
    { type: "language", value: "zh-CN" }
  );
  assert.deepEqual(
    languageScene.hitTest(metrics.optionLeft + 8, metrics.optionTop + metrics.optionGap + metrics.optionHeight + 8),
    { type: "language", value: "en" }
  );
});
```

- [ ] **Step 2: 实现设置页 scene**

```js
function createSettingsScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;
  const contentWidth = Math.min(canvasWidth - 40, 320);
  const contentLeft = Math.floor((canvasWidth - contentWidth) / 2);
  const headerTop = 92;
  const languageCardTop = 256;

  function getMetrics() {
    return {
      contentLeft,
      contentWidth,
      backLeft: contentLeft,
      backTop: headerTop,
      languageCardLeft: contentLeft,
      languageCardTop: languageCardTop
    };
  }

  function draw(context, renderState) {
    // 绘制返回、标题、语言卡片、难度摘要与说明区
  }

  function hitTest(x, y) {
    // 命中返回与语言卡片
  }

  return {
    draw,
    hitTest,
    getMetrics
  };
}
```

- [ ] **Step 3: 实现语言页 scene**

```js
function createLanguageScene(options) {
  const canvasWidth = options.canvasWidth || 375;
  const canvasHeight = options.canvasHeight || 812;

  function draw(context, renderState) {
    // 绘制标题、返回、两个语言选项卡与当前生效说明
  }

  function hitTest(x, y) {
    // 返回 back 或 language
  }

  return {
    draw,
    hitTest,
    getMetrics
  };
}
```

- [ ] **Step 4: 运行测试确认新 scene 行为通过**

Run: `node --test tests/game-engine.test.js`
Expected: 设置页与语言页命中测试 PASS，主流程测试可能仍未全部通过

- [ ] **Step 5: 提交新 scene**

```bash
git add js/scene/settings-scene.js js/scene/language-scene.js js/i18n/locales.js tests/game-engine.test.js
git commit -m "feat(ui): 新增设置页与语言页场景"
```

### Task 4: 扩展棋盘页 header 与按钮主题

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\board-scene.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\ui\toolbar.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\ui\theme-policy.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 为棋盘 header 与主题变量补失败测试**

```js
test("theme policy exposes grouped visual tokens for playful and pro modes", function () {
  const playful = getThemeByDifficulty("beginner");
  const pro = getThemeByDifficulty("expert");

  assert.equal(typeof playful.surfaceTint, "string");
  assert.equal(typeof playful.ornament, "string");
  assert.equal(typeof pro.surfaceTint, "string");
  assert.equal(typeof pro.ornament, "string");
});
```

- [ ] **Step 2: 在棋盘页增加设置入口绘制与命中**

```js
function getMetrics() {
  return {
    canvasWidth,
    canvasHeight,
    boardTop,
    boardLeft,
    boardSize,
    cellSize,
    settingsLeft: boardLeft + boardSize - 72,
    settingsTop: boardTop - 112,
    settingsWidth: 72,
    settingsHeight: 32
  };
}

function hitTestHeaderAction(x, y) {
  const metrics = getMetrics();

  if (
    x >= metrics.settingsLeft &&
    x <= metrics.settingsLeft + metrics.settingsWidth &&
    y >= metrics.settingsTop &&
    y <= metrics.settingsTop + metrics.settingsHeight
  ) {
    return { type: "action", value: "settings" };
  }

  return null;
}
```

- [ ] **Step 3: 扩展主题与工具栏样式**

```js
const PLAYFUL_THEME = {
  tone: "playful",
  background: "#f9f1e4",
  surfaceTint: "#fff9f1",
  ornament: "#d9a65a",
  buttonShadow: "#c98b6f",
  buttonDepth: "soft"
};

const PRO_THEME = {
  tone: "pro",
  background: "#f1f3f2",
  surfaceTint: "#fbfbf8",
  ornament: "#5a6b73",
  buttonShadow: "#94a0a8",
  buttonDepth: "sharp"
};
```

- [ ] **Step 4: 运行测试确认棋盘页入口与主题变量通过**

Run: `node --test tests/game-engine.test.js`
Expected: `board scene exposes a settings button hit area in the header` 与主题变量测试 PASS

- [ ] **Step 5: 提交棋盘页与主题更新**

```bash
git add js/scene/board-scene.js js/ui/toolbar.js js/ui/theme-policy.js tests/game-engine.test.js
git commit -m "feat(ui): 增强棋盘页顶部与按钮质感"
```

### Task 5: 接通 main.js 的四场景状态流与设置来源返回

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\main.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`
- Reference: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\settings-scene.js`
- Reference: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\language-scene.js`

- [ ] **Step 1: 为来源返回和棋盘设置入口补失败测试**

```js
test("main entry can open settings from board and return without losing the game screen", function () {
  const texts = [];
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
            fillText: function (text) {
              texts.push(text);
            }
          };
        }
      };
    },
    getStorageSync: function (key) {
      if (key === STORAGE_KEYS.settings) {
        return {
          preferredDifficulty: "expert",
          language: "zh-CN"
        };
      }

      return "";
    },
    onTouchStart: function (handler) {
      touchHandler = handler;
    }
  };

  try {
    require("../js/main");
    touchHandler({ touches: [{ clientX: 180, clientY: 300 }] });
    touchHandler({ touches: [{ clientX: 300, clientY: 70 }] });
    touchHandler({ touches: [{ clientX: 36, clientY: 96 }] });

    assert.ok(texts.includes("方庭九屿"));
    assert.ok(texts.includes("设置"));
    assert.ok(texts.includes("专家"));
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});
```

- [ ] **Step 2: 实现四场景状态机**

```js
let activeScreen = "home";
let settingsEntrySource = "home";

function openSettings(source) {
  settingsEntrySource = source;
  activeScreen = "settings";
}

function goBackFromSettings() {
  activeScreen = settingsEntrySource === "board" ? "board" : "home";
}

function draw() {
  if (activeScreen === "home") {
    drawHome();
    return;
  }

  if (activeScreen === "settings") {
    drawSettings();
    return;
  }

  if (activeScreen === "language") {
    drawLanguage();
    return;
  }

  drawBoard();
}
```

- [ ] **Step 3: 接通触控分发**

```js
if (activeScreen === "home") {
  const homeAction = homeScene.hitTest(point.x, point.y, {
    hasSavedGame: hasSavedGame
  });

  if (homeAction && homeAction.type === "action" && homeAction.value === "settings") {
    openSettings("home");
    draw();
    return;
  }
}

if (activeScreen === "settings") {
  const settingsAction = settingsScene.hitTest(point.x, point.y);

  if (settingsAction && settingsAction.value === "back") {
    goBackFromSettings();
    draw();
    return;
  }

  if (settingsAction && settingsAction.value === "language") {
    activeScreen = "language";
    draw();
    return;
  }
}

if (activeScreen === "language") {
  const languageAction = languageScene.hitTest(point.x, point.y);

  if (languageAction && languageAction.type === "language") {
    language = languageAction.value;
    t = createTranslator(language);
    persistSettingsState();
    draw();
    return;
  }
}
```

- [ ] **Step 4: 运行完整测试**

Run: `node --test tests/game-engine.test.js`
Expected: PASS，全部测试通过

- [ ] **Step 5: 提交主流程重构**

```bash
git add js/main.js tests/game-engine.test.js
git commit -m "feat(flow): 接通设置页与语言页状态流"
```

### Task 6: 文档回写与最终验证

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs\superpowers\specs\2026-06-05-language-setting-design.md`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs\superpowers\specs\2026-06-05-jiuyu-home-ui-hint-check-design.md`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs\superpowers\plans\2026-06-05-language-setting-implementation.md`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs\superpowers\plans\2026-06-05-home-ui-hint-check-implementation.md`

- [ ] **Step 1: 回写文档，标明旧方案已被独立设置页方案替代**

```md
## 变更说明

2026-06-05 后续迭代已将“首页内嵌设置展开”替换为：

- 独立设置页
- 独立语言页
- 棋盘页设置入口

相关实现与后续维护以 `2026-06-05-jiuyu-settings-ui-redesign-design.md` 为准。
```

- [ ] **Step 2: 运行最终验证**

Run: `node --test tests/game-engine.test.js`
Expected: `# pass` 全部通过，`# fail 0`

- [ ] **Step 3: 检查 git diff**

Run: `git -c safe.directory=D:/GithubWorkspace/jiuyu-miniapp diff -- js/main.js js/scene/home-scene.js js/scene/settings-scene.js js/scene/language-scene.js js/scene/board-scene.js js/ui/theme-policy.js js/ui/toolbar.js js/i18n/locales.js tests/game-engine.test.js docs/superpowers/specs/2026-06-05-jiuyu-settings-ui-redesign-design.md docs/superpowers/plans/2026-06-05-settings-ui-redesign-implementation.md`
Expected: 仅出现本次 UI 重构相关改动

- [ ] **Step 4: 提交文档与最终收尾**

```bash
git add docs/superpowers/specs/2026-06-05-jiuyu-settings-ui-redesign-design.md docs/superpowers/plans/2026-06-05-settings-ui-redesign-implementation.md docs/superpowers/specs/2026-06-05-language-setting-design.md docs/superpowers/specs/2026-06-05-jiuyu-home-ui-hint-check-design.md docs/superpowers/plans/2026-06-05-language-setting-implementation.md docs/superpowers/plans/2026-06-05-home-ui-hint-check-implementation.md
git commit -m "docs: 更新设置页重构方案说明"
```

## Self-Review

- Spec coverage：已覆盖首页纯入口页、独立设置页、独立语言页、棋盘页设置入口、两组主题视觉、状态来源返回与测试验证。
- Placeholder scan：计划中所有任务均给出明确文件、命令与代码方向，没有留 `TODO/TBD`。
- Type consistency：统一使用 `activeScreen`、`settingsEntrySource`、`language`、`selectedDifficulty`、`hitTest` / `hitTestHeaderAction` 等命名。
