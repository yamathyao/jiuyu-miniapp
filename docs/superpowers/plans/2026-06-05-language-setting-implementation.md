# Fangting Jiuyu Language Setting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为方庭九屿增加简体中文与英文双语设置，并让全部用户可见文本统一走 i18n 层。

**Architecture:** 新增轻量 `js/i18n/` 目录，提供 locale 字典和 `t(key, params)` 翻译入口。`main.js` 持有 `language` 全局设置并负责把翻译能力传给首页、棋盘、工具栏、提示与检查模块；`storage.js` 扩展保存 `settings.language`，首页 `设置` 区承接语言切换。

**Tech Stack:** WeChat Minigame, JavaScript, CommonJS, Node test runner

---

> 说明：原计划中的“首页内嵌语言设置展开”已由后续方案替换为“独立设置页 + 独立语言页”。相关执行以 `docs/superpowers/plans/2026-06-05-settings-ui-redesign-implementation.md` 为准。

## File Structure

- Create: `js/i18n/locales.js`
- Create: `js/i18n/index.js`
- Modify: `js/services/storage.js`
- Modify: `js/scene/home-scene.js`
- Modify: `js/scene/board-scene.js`
- Modify: `js/ui/toolbar.js`
- Modify: `js/services/hint-engine.js`
- Modify: `js/services/checker.js`
- Modify: `js/main.js`
- Modify: `tests/game-engine.test.js`
- Modify: `docs/2026-06-04-jiuyu-current-design.md`
- Modify: `docs/2026-06-04-jiuyu-current-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-06-05-language-setting-implementation.md`

## Guardrails

- Do not modify or stage `miniprogram/project.config.json`; it is unrelated local noise.
- Keep `node --test tests/game-engine.test.js` green after each task.
- Keep internal difficulty enum values unchanged: `beginner / intermediate / skilled / expert`.
- Keep brand display fixed as `方庭九屿` in both languages.
- Do not introduce a third-party i18n framework.
- All new user-facing strings added in this plan must come from the i18n dictionary, not inline literals.

### Task 1: 为 i18n 基础能力补失败测试

**Files:**
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在测试顶部引入尚未存在的 i18n 模块**

在 `tests/game-engine.test.js` 的 require 区块后追加：

```js
const {
  DEFAULT_LOCALE,
  normalizeLocale,
  createTranslator
} = require("../js/i18n");
```

- [x] **Step 2: 在测试末尾追加 i18n 失败用例**

在 `tests/game-engine.test.js` 末尾追加：

```js
test("normalizeLocale falls back to zh-CN for unsupported languages", function () {
  assert.equal(DEFAULT_LOCALE, "zh-CN");
  assert.equal(normalizeLocale("en"), "en");
  assert.equal(normalizeLocale("fr"), "zh-CN");
});

test("createTranslator returns translated difficulty labels and interpolated copy", function () {
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(zh("difficulty.beginner"), "新手");
  assert.equal(en("difficulty.beginner"), "Beginner");
  assert.equal(
    en("home.currentDifficulty", {
      difficulty: en("difficulty.expert")
    }),
    "Current difficulty: Expert"
  );
});
```

- [x] **Step 3: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示 ../js/i18n 模块不存在
```

- [ ] **Step 4: Commit**

```bash
git add tests/game-engine.test.js
git commit -m "test(i18n): 补充翻译基础失败用例"
```

### Task 2: 实现 i18n 基础模块

**Files:**
- Create: `js/i18n/locales.js`
- Create: `js/i18n/index.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 创建 `js/i18n/locales.js`**

新增 `js/i18n/locales.js`：

```js
const LOCALES = {
  "zh-CN": {
    difficulty: {
      beginner: "新手",
      intermediate: "进阶",
      skilled: "熟练",
      expert: "专家"
    },
    home: {
      currentDifficulty: "当前难度: {difficulty}"
    }
  },
  en: {
    difficulty: {
      beginner: "Beginner",
      intermediate: "Intermediate",
      skilled: "Skilled",
      expert: "Expert"
    },
    home: {
      currentDifficulty: "Current difficulty: {difficulty}"
    }
  }
};

module.exports = {
  LOCALES
};
```

- [x] **Step 2: 创建 `js/i18n/index.js`**

新增 `js/i18n/index.js`：

```js
const { LOCALES } = require("./locales");

const DEFAULT_LOCALE = "zh-CN";

function isSupportedLocale(locale) {
  return Boolean(LOCALES[locale]);
}

function normalizeLocale(locale) {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

function readPath(target, path) {
  return path.split(".").reduce(function (current, key) {
    return current && current[key];
  }, target);
}

function interpolate(template, params) {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, function (match, key) {
    return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match;
  });
}

function createTranslator(locale) {
  const safeLocale = normalizeLocale(locale);
  const dictionary = LOCALES[safeLocale];

  return function t(key, params) {
    const template = readPath(dictionary, key);

    if (typeof template !== "string") {
      return key;
    }

    return interpolate(template, params);
  };
}

module.exports = {
  DEFAULT_LOCALE,
  isSupportedLocale,
  normalizeLocale,
  createTranslator
};
```

- [x] **Step 3: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
新增 i18n 基础测试为 PASS，其余测试继续通过
```

- [ ] **Step 4: Commit**

```bash
git add js/i18n/locales.js js/i18n/index.js tests/game-engine.test.js
git commit -m "feat(i18n): 增加基础翻译模块"
```

### Task 3: 为 settings.language 持久化补失败测试

**Files:**
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 将设置存储测试扩展为包含 language**

将现有 `loadSettings falls back to the default preferred difficulty` 测试中的断言替换为：

```js
  assert.deepEqual(settings, {
    preferredDifficulty: "beginner",
    language: "zh-CN"
  });
```

将现有 `saveSettings persists the preferred difficulty` 测试替换为：

```js
test("saveSettings persists preferred difficulty and language", function () {
  const writes = [];
  const saved = saveSettings(
    {
      preferredDifficulty: "expert",
      language: "en"
    },
    {
      setStorageSync: function (key, value) {
        writes.push([key, value]);
      }
    }
  );

  assert.equal(saved, true);
  assert.equal(writes[0][0], STORAGE_KEYS.settings);
  assert.equal(writes[0][1].preferredDifficulty, "expert");
  assert.equal(writes[0][1].language, "en");
});
```

- [x] **Step 2: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示 loadSettings 返回缺少 language
```

- [ ] **Step 3: Commit**

```bash
git add tests/game-engine.test.js
git commit -m "test(storage): 补充语言设置失败用例"
```

### Task 4: 实现 settings.language 持久化

**Files:**
- Modify: `js/services/storage.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 扩展 `loadSettings` 返回 language 默认值**

将 `js/services/storage.js` 中的 `loadSettings` 替换为：

```js
function loadSettings(storageApi) {
  const savedSettings = readStorage(STORAGE_KEYS.settings, null, storageApi);
  const preferredDifficulty = savedSettings &&
    typeof savedSettings.preferredDifficulty === "string"
    ? savedSettings.preferredDifficulty
    : "beginner";
  const language = savedSettings &&
    typeof savedSettings.language === "string"
    ? savedSettings.language
    : "zh-CN";

  return {
    preferredDifficulty: preferredDifficulty,
    language: language
  };
}
```

- [x] **Step 2: 保持 `saveSettings` 直接写入完整 settings**

`saveSettings` 保持：

```js
function saveSettings(settings, storageApi) {
  return writeStorage(STORAGE_KEYS.settings, settings, storageApi);
}
```

- [x] **Step 3: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
settings 相关测试重新通过
```

- [ ] **Step 4: Commit**

```bash
git add js/services/storage.js tests/game-engine.test.js
git commit -m "feat(storage): 增加语言设置持久化"
```

### Task 5: 为首页文案与语言设置交互补失败测试

**Files:**
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 为首页 visual spec 补中英文文案断言**

在 `tests/game-engine.test.js` 末尾追加：

```js
test("home scene visual spec exposes localized copy for zh-CN", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const t = createTranslator("zh-CN");
  const visualSpec = homeScene.getVisualSpec({
    selectedDifficulty: "beginner",
    t: t
  });

  assert.equal(visualSpec.brandSubtitle, "从轻松一局开始，慢慢找到节奏。");
  assert.equal(visualSpec.primaryLabel, "继续游戏");
  assert.equal(visualSpec.settingsLabel, "设置");
});

test("home scene visual spec exposes localized copy for en", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const t = createTranslator("en");
  const visualSpec = homeScene.getVisualSpec({
    selectedDifficulty: "expert",
    t: t
  });

  assert.equal(visualSpec.brandSubtitle, "Enter a focused solving rhythm.");
  assert.equal(visualSpec.primaryLabel, "Continue");
  assert.equal(visualSpec.settingsLabel, "Settings");
});
```

- [x] **Step 2: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示 visualSpec 中缺少本地化文案字段
```

- [ ] **Step 3: Commit**

```bash
git add tests/game-engine.test.js
git commit -m "test(home): 补充首页多语言失败用例"
```

### Task 6: 实现首页多语言与设置区语言切换结构

**Files:**
- Modify: `js/scene/home-scene.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 让 `getVisualSpec` 读取翻译器**

将 `js/scene/home-scene.js` 中 `getVisualSpec` 的开头替换为：

```js
  function getVisualSpec(renderState) {
    const selectedDifficulty = renderState && renderState.selectedDifficulty
      ? renderState.selectedDifficulty
      : "beginner";
    const t = renderState && typeof renderState.t === "function"
      ? renderState.t
      : function (key) {
          return key;
        };
    const isPro = isProDifficulty(selectedDifficulty);
```

并在 pro 分支返回对象中追加：

```js
        brandSubtitle: t("home.subtitle.pro"),
        primaryLabel: t("home.primary.continue"),
        secondaryLabel: t("home.primary.newGame"),
        settingsLabel: t("settings.title"),
        noSaveLabel: t("home.status.noSave"),
        hasSaveLabel: t("home.status.hasSave")
```

在 playful 分支返回对象中追加相同 key：

```js
      brandSubtitle: t("home.subtitle.playful"),
      primaryLabel: t("home.primary.continue"),
      secondaryLabel: t("home.primary.newGame"),
      settingsLabel: t("settings.title"),
      noSaveLabel: t("home.status.noSave"),
      hasSaveLabel: t("home.status.hasSave")
```

- [x] **Step 2: 将首页绘制改为使用 visualSpec 文案**

把 `draw` 中以下内容替换：

```js
    context.fillText(visualSpec.brandSubtitle, canvasWidth / 2, brandTop + 38);
```

并将按钮与底部状态文案替换为：

```js
    drawButton(context, metrics.primaryButtonLeft, metrics.primaryButtonTop, contentWidth, buttonHeight, primaryLabel, {
```

替换为：

```js
    drawButton(
      context,
      metrics.primaryButtonLeft,
      metrics.primaryButtonTop,
      contentWidth,
      buttonHeight,
      hasSavedGame ? visualSpec.primaryLabel : visualSpec.secondaryLabel,
      {
        fill: visualSpec.accentFill,
        shadow: visualSpec.panelShadow,
        text: visualSpec.accentText,
        font: "bold 19px sans-serif"
      }
    );
```

并将“新开一局”“设置”“可继续上次对局”等写死文案替换为：

```js
    drawButton(context, metrics.secondaryButtonLeft, metrics.secondaryButtonTop, contentWidth, buttonHeight, visualSpec.secondaryLabel, {
      fill: visualSpec.secondaryFill,
      shadow: visualSpec.panelShadow,
      text: visualSpec.secondaryText,
      font: "18px sans-serif"
    });
```

```js
    drawButton(context, contentLeft, settingsTop, contentWidth, 46, visualSpec.settingsLabel, {
      fill: visualSpec.panelFill,
      shadow: visualSpec.panelShadow,
      text: visualSpec.secondaryText,
      font: "17px sans-serif"
    });
```

```js
    context.fillText(
      hasSavedGame ? visualSpec.hasSaveLabel : visualSpec.noSaveLabel,
      canvasWidth / 2,
      footerTop
    );
```

- [x] **Step 3: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
首页多语言 visual spec 测试通过
```

- [ ] **Step 4: Commit**

```bash
git add js/scene/home-scene.js tests/game-engine.test.js
git commit -m "feat(home): 接入首页多语言文案"
```

### Task 7: 为工具栏、提示、检查的多语言补失败测试

**Files:**
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 追加工具栏与服务层多语言失败用例**

在 `tests/game-engine.test.js` 末尾追加：

```js
test("toolbar exposes localized tool labels", function () {
  const toolbar = createToolbar({
    canvasWidth: 375,
    canvasHeight: 812,
    boardMetrics: createBoardScene({
      canvasWidth: 375,
      canvasHeight: 812
    }).getMetrics()
  });
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(toolbar.getTools(zh)[0].label, "笔记");
  assert.equal(toolbar.getTools(en)[0].label, "Notes");
});

test("hint engine returns localized messages", function () {
  const game = createGame(puzzles[0]);
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(
    getNextHint(game, "beginner", { currentLevel: null, targetIndex: -1 }, zh).message,
    "先看第一行前 3 格，这里有一个数字可以先确定。"
  );
  assert.equal(
    getNextHint(game, "beginner", { currentLevel: null, targetIndex: -1 }, en).message,
    "Start with the first three cells in row 1. One value can already be fixed there."
  );
});

test("checker returns localized messages", function () {
  const game = createGame(puzzles[0]);
  const wrong = applyInputValue(game, 2, "1");
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");

  assert.equal(runDifficultyCheck(wrong, "beginner", zh).message, "发现需要处理的填写。");
  assert.equal(runDifficultyCheck(wrong, "beginner", en).message, "There are entries that need attention.");
});
```

- [x] **Step 2: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示 toolbar 缺少 getTools 或 hint/check 未接收翻译器
```

- [ ] **Step 3: Commit**

```bash
git add tests/game-engine.test.js
git commit -m "test(i18n): 补充工具栏与提示检查失败用例"
```

### Task 8: 实现工具栏、提示、检查的多语言

**Files:**
- Modify: `js/i18n/locales.js`
- Modify: `js/ui/toolbar.js`
- Modify: `js/services/hint-engine.js`
- Modify: `js/services/checker.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 扩展 `js/i18n/locales.js` 文案字典**

将 `js/i18n/locales.js` 替换为：

```js
const LOCALES = {
  "zh-CN": {
    difficulty: {
      beginner: "新手",
      intermediate: "进阶",
      skilled: "熟练",
      expert: "专家"
    },
    home: {
      subtitle: {
        playful: "从轻松一局开始，慢慢找到节奏。",
        pro: "进入专注解题状态。"
      },
      primary: {
        continue: "继续游戏",
        newGame: "开始新局"
      },
      status: {
        hasSave: "可继续上次对局",
        noSave: "还没有可继续的对局"
      },
      currentDifficulty: "当前难度: {difficulty}"
    },
    settings: {
      title: "设置"
    },
    toolbar: {
      note: "笔记",
      undo: "撤销",
      erase: "擦除",
      hint: "提示",
      check: "检查"
    },
    hint: {
      beginner: {
        direction: "先看第一行前 3 格，这里有一个数字可以先确定。",
        cell: "R1C3 这个格子已经可以确定。",
        technique: "这里是 Naked Single，这个格子的候选数只剩一个。",
        answer: "R1C3 可以填写 4。"
      },
      expert: {
        technique: "Naked Single，R1C3，4。"
      },
      fallback: {
        technique: "这里是 Naked Single，这个格子的候选数只剩一个。"
      }
    },
    check: {
      hasIssue: "发现需要处理的填写。",
      clean: "当前未发现需要处理的问题。"
    }
  },
  en: {
    difficulty: {
      beginner: "Beginner",
      intermediate: "Intermediate",
      skilled: "Skilled",
      expert: "Expert"
    },
    home: {
      subtitle: {
        playful: "Start with a gentle round and settle into the rhythm.",
        pro: "Enter a focused solving rhythm."
      },
      primary: {
        continue: "Continue",
        newGame: "New Game"
      },
      status: {
        hasSave: "Your last game is ready to continue.",
        noSave: "No game is ready to continue yet."
      },
      currentDifficulty: "Current difficulty: {difficulty}"
    },
    settings: {
      title: "Settings"
    },
    toolbar: {
      note: "Notes",
      undo: "Undo",
      erase: "Erase",
      hint: "Hint",
      check: "Check"
    },
    hint: {
      beginner: {
        direction: "Start with the first three cells in row 1. One value can already be fixed there.",
        cell: "Cell R1C3 can already be determined.",
        technique: "This is a Naked Single. Only one candidate remains in this cell.",
        answer: "R1C3 can be filled with 4."
      },
      expert: {
        technique: "Naked Single, R1C3, 4."
      },
      fallback: {
        technique: "This is a Naked Single. Only one candidate remains in this cell."
      }
    },
    check: {
      hasIssue: "There are entries that need attention.",
      clean: "No issues need attention right now."
    }
  }
};

module.exports = {
  LOCALES
};
```

- [x] **Step 2: 为工具栏暴露本地化 tools**

将 `js/ui/toolbar.js` 中的 `tools` 常量替换为：

```js
  const toolKeys = ["note", "undo", "erase", "hint", "check"];
```

在 `getMetrics` 下方追加：

```js
  function getTools(t) {
    const translate = typeof t === "function"
      ? t
      : function (key) {
          return key;
        };

    return toolKeys.map(function (toolKey) {
      return {
        key: toolKey,
        label: translate("toolbar." + toolKey)
      };
    });
  }
```

并将 `draw` 中：

```js
    const toolWidth = width / tools.length;

    tools.forEach(function (tool, index) {
```

替换为：

```js
    const tools = getTools(theme && theme.t);
    const toolWidth = width / tools.length;

    tools.forEach(function (tool, index) {
```

并在 `hitTest` 中将：

```js
      const toolWidth = width / tools.length;
      const index = Math.floor((x - left) / toolWidth);
      return {
        type: "tool",
        value: tools[index].key
      };
```

替换为：

```js
      const toolWidth = width / toolKeys.length;
      const index = Math.floor((x - left) / toolWidth);
      return {
        type: "tool",
        value: toolKeys[index]
      };
```

并导出中追加：

```js
    getTools,
```

- [x] **Step 3: 接入 hint/check 翻译器**

将 `js/services/checker.js` 中的 `buildResult` 替换为：

```js
function buildResult(mode, issueIndexes, t) {
  const sortedIndexes = issueIndexes.slice().sort(function (left, right) {
    return left - right;
  });
  const translate = typeof t === "function"
    ? t
    : function (key) {
        return key;
      };

  return {
    mode: mode,
    hasIssue: sortedIndexes.length > 0,
    message: sortedIndexes.length > 0
      ? translate("check.hasIssue")
      : translate("check.clean"),
    issueIndexes: sortedIndexes
  };
}
```

并将调用链替换为：

```js
function checkConflicts(game, t) {
```

```js
  return buildResult("conflict", issueIndexes, t);
```

```js
function checkAgainstSolution(game, t) {
```

```js
  return buildResult("solution", issueIndexes, t);
```

```js
function runDifficultyCheck(game, difficulty, t) {
```

```js
    return checkConflicts(game, t);
```

```js
  return checkAgainstSolution(game, t);
```

将 `js/services/hint-engine.js` 中 `buildHintMessage` 替换为：

```js
function buildHintMessage(level, difficulty, t) {
  const translate = typeof t === "function"
    ? t
    : function (key) {
        return key;
      };

  if (difficulty === "expert" && level === "technique") {
    return translate("hint.expert.technique");
  }

  if (difficulty === "beginner") {
    return translate("hint.beginner." + level);
  }

  return translate("hint.fallback.technique");
}
```

并将：

```js
function getNextHint(game, difficulty, hintState) {
```

替换为：

```js
function getNextHint(game, difficulty, hintState, t) {
```

以及：

```js
    message: buildHintMessage(level, difficulty),
```

替换为：

```js
    message: buildHintMessage(level, difficulty, t),
```

- [x] **Step 4: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
工具栏、提示、检查的多语言测试通过
```

- [ ] **Step 5: Commit**

```bash
git add js/i18n/locales.js js/ui/toolbar.js js/services/hint-engine.js js/services/checker.js tests/game-engine.test.js
git commit -m "feat(i18n): 接入工具栏与提示检查翻译"
```

### Task 9: 为启动语言与首页设置切换补失败测试

**Files:**
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 扩展 main 启动测试，要求用 settings.language 渲染首页**

将现有 `main entry boots into the home screen and shows the product title` 测试替换为：

```js
test("main entry boots into the home screen using the stored language", function () {
  const texts = [];
  const originalWx = global.wx;
  const mainPath = require.resolve("../js/main");

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
          language: "en"
        };
      }

      return "";
    },
    onTouchStart: function () {}
  };

  try {
    assert.doesNotThrow(function () {
      require("../js/main");
    });
    assert.ok(texts.includes("Settings"));
    assert.ok(texts.includes("Current difficulty: Expert"));
  } finally {
    delete require.cache[mainPath];
    global.wx = originalWx;
  }
});
```

- [x] **Step 2: 运行测试并确认先失败**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，并提示 main.js 尚未读取 settings.language
```

- [ ] **Step 3: Commit**

```bash
git add tests/game-engine.test.js
git commit -m "test(main): 补充启动语言失败用例"
```

### Task 10: 接通 main.js 的语言状态与场景翻译

**Files:**
- Modify: `js/main.js`
- Modify: `js/scene/board-scene.js`
- Modify: `js/ui/toolbar.js`
- Modify: `tests/game-engine.test.js`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在 `main.js` 中引入翻译器并持有 language**

在 `js/main.js` 顶部追加：

```js
const { createTranslator } = require("./i18n");
```

将 settings 读取与状态初始化替换为：

```js
  const settings = loadSettings();
  const defaultPuzzle = findPuzzleByDifficulty(settings.preferredDifficulty);
  const restoredSession = loadCurrentGame(createGame(defaultPuzzle));
  let activeScreen = "home";
  let selectedDifficulty = settings.preferredDifficulty;
  let language = settings.language;
  let t = createTranslator(language);
```

并将 `persistSettingsState` 替换为：

```js
  function persistSettingsState() {
    saveSettings({
      preferredDifficulty: selectedDifficulty,
      language: language
    });
  }
```

- [x] **Step 2: 将首页、棋盘、工具栏与服务层调用接到翻译器**

在 `drawHome()` 中把 renderState 替换为：

```js
    homeScene.draw(context, {
      hasSavedGame: hasSavedGame,
      selectedDifficulty: selectedDifficulty,
      language: language,
      t: t
    });
```

在 `drawBoard()` 中把 `boardScene.draw` 替换为：

```js
    boardScene.draw(context, cells, {
      theme: Object.assign({}, theme, { t: t }),
      feedbackMessage: feedbackMessage,
      feedbackType: feedbackType,
      title: "方庭九屿",
      difficultyLabel: t("difficulty." + difficulty)
    });
```

在提示与检查调用中替换为：

```js
        const hint = getNextHint(game, game.difficulty, hintState, t);
```

```js
        const result = runDifficultyCheck(game, game.difficulty, t);
```

- [x] **Step 3: 让棋盘顶部绘制标题与难度标签**

在 `js/scene/board-scene.js` 的 `draw` 开头，在棋盘填充前追加：

```js
    const title = renderState ? renderState.title || "" : "";
    const difficultyLabel = renderState ? renderState.difficultyLabel || "" : "";

    if (title) {
      context.fillStyle = "#1f2933";
      context.font = "bold 24px sans-serif";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(title, boardLeft, boardTop - 108);
    }

    if (difficultyLabel) {
      context.fillStyle = "#607078";
      context.font = "14px sans-serif";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(difficultyLabel, boardLeft, boardTop - 84);
    }
```

- [x] **Step 4: 运行测试并确认通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
main 启动语言测试通过，全部测试继续通过
```

- [ ] **Step 5: Commit**

```bash
git add js/main.js js/scene/board-scene.js js/ui/toolbar.js tests/game-engine.test.js
git commit -m "feat(i18n): 接通启动语言与场景翻译"
```

### Task 11: 更新主文档并做最终验证

**Files:**
- Modify: `docs/2026-06-04-jiuyu-current-design.md`
- Modify: `docs/2026-06-04-jiuyu-current-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-06-05-language-setting-implementation.md`
- Test: `tests/game-engine.test.js`

- [x] **Step 1: 在当前设计基线中补充双语主线**

在 `docs/2026-06-04-jiuyu-current-design.md` 中追加或替换为能表达以下结论的内容：

```md
- 当前主线之一是补齐首页设置中的双语能力，首批支持简体中文与英文
- 所有用户可见文本统一走 i18n 层，品牌名“方庭九屿”保持不翻译
```

- [x] **Step 2: 在当前实施计划中补充语言设置主线**

在 `docs/2026-06-04-jiuyu-current-implementation-plan.md` 中追加或替换为能表达以下结论的内容：

```md
当前主线继续包含：首页入口、难度选择、分级 UI、提示检查统一整理，以及简体中文/英文双语设置接入。
```

- [x] **Step 3: 运行最终自动化验证**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
全部测试通过，0 fail
```

- [x] **Step 4: 回写本计划勾选状态与验证结果**

将已完成步骤从 `- [ ]` 改为 `- [x]`，并保持验证描述与实际执行一致。

- [ ] **Step 5: Commit**

```bash
git add docs/2026-06-04-jiuyu-current-design.md docs/2026-06-04-jiuyu-current-implementation-plan.md docs/superpowers/plans/2026-06-05-language-setting-implementation.md
git commit -m "docs: 更新双语设置实施计划"
```
