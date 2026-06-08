# Home Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 收口首页主体留白与纵向节奏，在不改变首页现有行为的前提下，让品牌区、主按钮组、难度区、设置入口和底部状态文案形成更稳定的视觉中轴。

**Architecture:** 继续沿用 `js/scene/home-scene.js` 中“布局常量 + `visualSpec` 绘制”的结构，只调整布局相关常量与少量绘制定位，不重做首页交互流，也不扩展到棋盘工具栏。测试继续集中在 `tests/game-engine.test.js`，用布局关系断言保护首页命中与节奏变化。 

**Tech Stack:** WeChat Mini Game Canvas API、CommonJS、Node `--test`

---

## File Structure

- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\home-scene.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/specs/2026-06-08-jiuyu-home-spacing-design.md`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/plans/2026-06-08-home-spacing-implementation.md`

## Guardrails

- 不修改首页的动作类型与跳转语义：`continue / new-game / toggle-difficulty-picker / difficulty / settings` 必须保持兼容。
- 不删除现有 `visualSpec` 的难度分层能力；布局调整后仍需保留后续按难度切换颜色、描边和装饰线条的空间。
- 不在本计划中顺手修改 `js/scene/board-scene.js`、`js/ui/toolbar.js`、`js/scene/settings-scene.js` 或 `js/scene/language-scene.js`。
- 工作区已有无关未提交改动；执行时只处理本计划涉及文件。
- 每个任务结束后都回归 `node --test tests/game-engine.test.js`。

### Task 1: 先用测试锁定首页新的纵向节奏关系

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`
- Test: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 在首页测试附近追加布局关系断言**

在 `tests/game-engine.test.js` 里紧接现有首页测试后追加：

```js
test("home scene keeps a balanced vertical rhythm for the default layout", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const metrics = homeScene.getMetrics({
    difficultyPickerOpen: false
  });

  assert.ok(metrics.primaryButtonTop > 230);
  assert.ok(metrics.primaryButtonTop < 255);
  assert.ok(metrics.difficultyTop - metrics.secondaryButtonTop < 110);
  assert.ok(metrics.settingsTop - metrics.difficultyTop < 110);
  assert.ok(metrics.footerTop - metrics.settingsTop < 80);
});

test("home scene keeps visual spec fields available for difficulty-based styling", function () {
  const homeScene = createHomeScene({
    canvasWidth: 375,
    canvasHeight: 812
  });
  const playfulSpec = homeScene.getVisualSpec({
    selectedDifficulty: "beginner"
  });
  const proSpec = homeScene.getVisualSpec({
    selectedDifficulty: "expert"
  });

  assert.equal(playfulSpec.tone, "playful");
  assert.equal(proSpec.tone, "pro");
  assert.equal(typeof playfulSpec.ornament, "string");
  assert.equal(typeof proSpec.helperFill, "string");
});
```

- [ ] **Step 2: 运行定向测试，确认它会先失败或暴露当前节奏不满足新目标**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
FAIL，至少出现首页纵向节奏相关断言失败
```

- [ ] **Step 3: 提交测试约束**

```bash
git add tests/game-engine.test.js
git commit -m "test(ui): 补首页节奏布局断言"
```

### Task 2: 调整首页布局常量并收口纵向节奏

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\js\scene\home-scene.js`
- Test: `D:\GithubWorkspace\jiuyu-miniapp\tests\game-engine.test.js`

- [ ] **Step 1: 调整首页核心布局常量，收紧中轴节奏**

在 `createHomeScene` 顶部常量区替换为：

```js
  const brandTop = 106;
  const primaryButtonTop = 242;
  const buttonHeight = 58;
  const secondaryButtonTop = primaryButtonTop + buttonHeight + 16;
  const difficultyTop = secondaryButtonTop + buttonHeight + 34;
  const difficultyHeight = 54;
  const difficultyGap = 12;
  const difficultyWidth = contentWidth;
```

- [ ] **Step 2: 调整 `getMetrics` 中 settings 与 footer 的垂直间距**

在 `getMetrics(renderState)` 中替换对应计算：

```js
    const settingsTop = difficultyTop + difficultyHeight + 28 +
      (difficultyRows > 1 ? (difficultyRows - 1) * (difficultyHeight + difficultyGap) : 0);
    const languageOptionTop = settingsTop + 58;
    const languageOptionHeight = 46;
    const languageOptionWidth = contentWidth;
    const footerTop = settingsTop + 62;
```

- [ ] **Step 3: 微调品牌背景与设置牌匾的绘制位置，避免新节奏下视觉仍显松散**

在 `drawBrandBackdrop` 和 `drawSettingsEntry` 中做最小定位调整：

```js
function drawBrandBackdrop(context, metrics, visualSpec) {
  context.fillStyle = visualSpec.haloFill;
  context.fillRect(22, 28, canvasWidth - 44, canvasHeight - 56);

  context.fillStyle = visualSpec.brandPanelFill;
  context.fillRect(metrics.contentLeft - 14, 52, contentWidth + 28, 140);

  context.fillStyle = visualSpec.headerWashFill;
  context.fillRect(metrics.contentLeft + 4, 72, contentWidth - 8, 90);

  context.fillStyle = visualSpec.dividerFill;
  context.fillRect(metrics.contentLeft + 18, 88, 46, 2);
  context.fillRect(metrics.contentLeft + contentWidth - 64, 88, 46, 2);

  context.fillStyle = visualSpec.sealFill;
  context.fillRect(metrics.contentLeft + contentWidth - 32, 68, 14, 14);
}

function drawSettingsEntry(context, metrics, visualSpec) {
  const plaqueWidth = Math.floor(contentWidth * 0.76);
  const plaqueLeft = contentLeft + Math.floor((contentWidth - plaqueWidth) / 2);

  drawSettingsPlaque(
    context,
    plaqueLeft,
    metrics.settingsTop,
    plaqueWidth,
    42,
    visualSpec.settingsLabel,
    visualSpec
  );
}
```

- [ ] **Step 4: 确认首页绘制仍通过 `visualSpec` 取色，不把新布局写死到单一难度风格**

检查并保持以下模式不变：

```js
    const visualSpec = getVisualSpec(renderState);
```

并确保：

```js
    context.fillStyle = visualSpec.background;
```

```js
      plaqueLeft,
      metrics.settingsTop,
      plaqueWidth,
      42,
      visualSpec.settingsLabel,
      visualSpec
```

如果发现新增的颜色、描边或线条值直接写在布局调整代码里，则改为复用现有 `visualSpec` 字段。

- [ ] **Step 5: 运行测试确认布局与现有交互都通过**

Run:

```bash
node --test tests/game-engine.test.js
```

Expected:

```text
# pass
# fail 0
```

- [ ] **Step 6: 提交首页布局收口**

```bash
git add js/scene/home-scene.js tests/game-engine.test.js
git commit -m "feat(ui): 收首页主体纵向节奏"
```

### Task 3: 回写文档并完成最终验证

**Files:**
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/specs/2026-06-08-jiuyu-home-spacing-design.md`
- Modify: `D:\GithubWorkspace\jiuyu-miniapp\docs/superpowers/plans/2026-06-08-home-spacing-implementation.md`

- [ ] **Step 1: 在设计文档中明确记录“布局优先、视觉变量保留接口”**

确认 `docs/superpowers/specs/2026-06-08-jiuyu-home-spacing-design.md` 中保留如下约束：

```md
- 本轮以布局收口为主，颜色、描边粗细、装饰线条和局部纹样只做最小必要跟随，不做全面重画
- 首页现有 `playful / pro` 两组视觉分层能力需要继续保留
- 布局常量与视觉常量应继续解耦，便于后续按难度继续调整颜色关系、线条表达和细节装饰
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

- [ ] **Step 3: 检查最终 diff 只包含本轮布局收口相关文件**

Run:

```bash
git -c safe.directory=D:/GithubWorkspace/jiuyu-miniapp diff -- js/scene/home-scene.js tests/game-engine.test.js docs/superpowers/specs/2026-06-08-jiuyu-home-spacing-design.md docs/superpowers/plans/2026-06-08-home-spacing-implementation.md
```

Expected:

```text
只出现首页节奏收口与对应文档改动
```

- [ ] **Step 4: 提交文档收尾**

```bash
git add docs/superpowers/specs/2026-06-08-jiuyu-home-spacing-design.md docs/superpowers/plans/2026-06-08-home-spacing-implementation.md
git commit -m "docs: 补首页节奏收口计划"
```

## Self-Review

- Spec coverage：已覆盖品牌区、主按钮组、难度区、设置入口、底部状态区的节奏调整，以及“保留按难度继续分化颜色/线条”的扩展约束。
- Placeholder scan：计划中没有 `TODO/TBD` 或“稍后实现”类占位词；每个任务都给出具体文件、代码或命令。
- Type consistency：计划统一复用现有 `getMetrics`、`getVisualSpec`、`visualSpec`、`settingsTop`、`footerTop` 等命名，没有引入与现有代码不一致的新接口。
