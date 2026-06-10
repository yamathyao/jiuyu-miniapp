# 九屿高阶技巧提示正确性加固设计

## 背景

当前小游戏已经接通按难度分级的提示流程，并为 `skilled / expert` 提供了：

- `naked-pair`
- `box-line-reduction`
- `x-wing`
- `xy-wing`

这几类高阶技巧的文案入口与多格高亮。

但现阶段高阶提示的正确性仍主要依赖运行时 heuristic：

- 题库里的 `techniques` 还是宽标签
- `hint-engine` 默认优先取 `techniques[0]`
- `targetIndex / relatedIndexes` 大多是“像样的猜测”，而不是题库权威标注
- 校验脚本尚未验证高阶提示元数据本身是否可信

这会带来一个体验风险：用户看到的是明确的技巧名称，但当前题面与当前提示位置未必足够支撑该技巧的讲解口径。

因此，这一轮应先把“高阶提示说得准”做扎实，再继续补更重的教学表现或更多新技巧。

## 本轮目标

本轮目标不是增加新的技巧种类，而是为现有 4 类高阶技巧建立**可验证的权威提示来源**。

本轮交付后应满足：

- `skilled / expert` 题可携带经过显式标注的高阶提示元数据
- `hint-engine` 对高阶题优先消费题库中的权威元数据
- 高阶提示的 `technique / targetIndex / relatedIndexes` 不再只依赖 heuristic 猜测
- 题库校验脚本与测试可以识别高阶提示元数据是否合法
- `beginner / intermediate` 的既有提示链路不受影响

## 范围

### 本轮要做

- 为 `skilled / expert` 题补充最小必要的高阶提示元数据
- 让 `hint-engine` 优先使用该元数据构建高阶提示
- 为高阶提示元数据补充静态校验
- 为高阶提示优先级与回退策略补充自动化测试
- 保持现有 scene / toolbar / 低难提示流程稳定

### 本轮不做

- 新增更多技巧种类
- 把高阶技巧识别完全改成求解器级自动推导
- 重做提示 UI 结构
- 为每道题补完整逐步教程脚本
- 扩展到云端题库或外部编辑工具

## 设计方案

### 总体策略

采用“**混合方案**”：

- 题库补充“最小必要的权威标注”
- `hint-engine` 优先消费题库权威标注
- 仅在元数据缺失或非法时，才回退到当前 heuristic

这样可以先把高阶提示正确性立住，同时保留后续把更多技巧逐步迁移到更强推导逻辑的空间。

### 为什么不直接走纯引擎推导

纯引擎推导长期更理想，但这轮如果直接让 `hint-engine` 完整推导：

- `naked-pair / box-line-reduction / x-wing / xy-wing` 的识别复杂度会明显上升
- 范围会从“加固现有提示正确性”扩张成“实现半个高阶求解器”
- 很容易把验证成本、回归面和实现时间都推高

当前更合适的做法是：先让系统引用一份经过显式标注与脚本校验的权威来源，再逐步增强自动推导能力。

## 数据设计

### 题库高阶提示元数据

当前 `skilled / expert` 题里的 `techniques` 保留，但不再作为唯一提示依据。

建议新增一个轻量 `hint` 字段：

```js
{
  id: "expert-001",
  difficulty: "expert",
  puzzle: "...",
  solution: "...",
  techniques: ["x-wing", "xy-wing"],
  hint: {
    primaryTechnique: "x-wing",
    targetIndex: 27,
    relatedIndexes: [9, 18, 36, 45],
    context: {
      pattern: "row-column"
    }
  }
}
```

字段含义：

- `primaryTechnique`
  本次高阶提示实际要讲的主技巧。它不再默认等于 `techniques[0]`，而是显式声明。

- `targetIndex`
  当前高阶提示的目标格。用于：
  - 反馈文案里的 `row / column / box`
  - scene 层的目标高亮
  - 高阶提示测试中的稳定断言

- `relatedIndexes`
  当前技巧需要一起高亮的关键格子索引。用于承载：
  - `box-line-reduction` 的同带关联格
  - `x-wing` 的行列联动格
  - `xy-wing` 的 pivot / wing 关联格

- `context`
  用于补最小结构语义，而不是做重型教程脚本。

首版只建议保留非常轻的语义，例如：

```js
{
  pattern: "box-line"
}
```

或：

```js
{
  pattern: "row-column"
}
```

或：

```js
{
  pattern: "pivot-wing"
}
```

这轮先不要求 `context` 存放完整“消去值、影响范围、步骤链”。

### 元数据适用范围

本轮只要求：

- `skilled` 题可以补 `naked-pair / box-line-reduction`
- `expert` 题可以补 `x-wing / xy-wing`

`beginner / intermediate` 不补这套结构，避免把简单题也拉进过重的数据维护。

## Hint Engine 设计

### 双轨模式

`hint-engine` 改成双轨模式：

- `beginner / intermediate`
  保持现状，继续使用当前提示层级与目标格选择逻辑

- `skilled / expert`
  优先走“权威元数据轨”，在元数据缺失或非法时再回退到 heuristic

### 高阶题提示构建顺序

对 `skilled / expert`，建议按以下顺序构建提示：

1. 读取当前题的高阶 hint 元数据
2. 校验元数据是否完整且可用
3. 若可用，则直接用它生成：
   - `technique`
   - `targetIndex`
   - `relatedIndexes`
   - `hintMeta`
4. 若不可用，则回退到现有：
   - `findHintTarget()`
   - `getRelatedIndexesByTechnique()`
5. 最终统一输出既有 hint 结构，避免 scene / main 分叉

### 建议接口形态

建议在 `hint-engine` 内部抽一个高阶元数据消费 helper，例如：

```js
function getAdvancedHintSeed(game) {
  // 返回 { technique, targetIndex, relatedIndexes, context } 或 null
}
```

再由 `getNextHint()` 统一组装：

```js
{
  level: "technique",
  technique: "x-wing",
  message: "...",
  targetIndex: 27,
  relatedIndexes: [9, 18, 36, 45],
  progress: {
    current: 1,
    total: 1
  },
  value: "7"
}
```

### 回退策略

为了避免系统在不稳时“说得太满”，回退路径需要更保守：

- 若高阶元数据缺失：允许回退到现有 heuristic
- 若高阶元数据非法：不抛异常，安全回退
- 若回退后仍无法给出足够可信的多格关系：允许只保留更泛的高阶 technique 文案，不强行暗示精确结构

这样可以保证：

- 高阶提示系统不因为单题元数据错误而崩
- 现有体验不会断
- 后续补齐数据时，系统会自动越来越稳定

## 校验设计

### validate-puzzles.js 扩展

`scripts/validate-puzzles.js` 新增对高阶 hint 元数据的静态校验。

对带 `hint` 的题，至少校验：

- `primaryTechnique` 必须存在且是字符串
- `primaryTechnique` 必须属于允许的技巧集合
- `primaryTechnique` 必须包含在当前题 `techniques` 数组里
- `targetIndex` 必须是 `0..80` 的整数
- `targetIndex` 不得指向 givens
- `relatedIndexes` 必须是数组
- `relatedIndexes` 每一项都必须是 `0..80` 的整数
- `relatedIndexes` 不得包含重复项
- `relatedIndexes` 不得包含 `targetIndex`
- `context` 若存在，必须是对象

### 当前不做的强校验

本轮不要求 `validate-puzzles.js` 在静态阶段完整证明：

- 该题当前一定能由该技巧唯一推出
- `relatedIndexes` 对应的所有格子都构成严格求解证明链

因为这会把校验器复杂度直接拉向技巧求解器。

本轮先做到“字段结构正确 + 与题面基本一致 + 与 declared technique 一致”。

## 测试策略

### Hint Engine 专项测试

在 `tests/game-engine.test.js` 中新增或重写高阶专项断言，至少覆盖：

1. 当高阶题存在合法元数据时：
   - `getNextHint()` 优先返回元数据里的 `technique`
   - `targetIndex` 与 `relatedIndexes` 与元数据一致

2. 当高阶题缺少元数据时：
   - `getNextHint()` 回退到现有 heuristic
   - 不影响返回结构完整性

3. 当高阶题元数据非法时：
   - `getNextHint()` 不抛异常
   - 会安全回退

4. 当 `primaryTechnique` 与 `techniques[0]` 不一致时：
   - 文案与返回的 `technique` 必须跟 `primaryTechnique` 对齐
   - 不再默认吃 `techniques[0]`

### 题库脚本回归

本轮验收底线继续保持：

```bash
node scripts/validate-puzzles.js
node --test tests/game-engine.test.js
```

必要时再补：

```bash
node scripts/summarize-puzzles.js
```

用于观察高阶题库扩充后数量与 givens 分布是否明显偏移。

## 技术落点

本轮建议主要改动以下文件：

- `js/data/puzzles-skilled.js`
- `js/data/puzzles-expert.js`
- `js/services/hint-engine.js`
- `scripts/validate-puzzles.js`
- `tests/game-engine.test.js`

若实现中发现 `hint` 元数据结构需要抽公共校验 helper，可新增一个小型纯函数模块，但不在本轮扩成独立 puzzle authoring 系统。

## 完成标准

本轮可以认为“完成”的标准是：

- 至少一批 `skilled / expert` 题补上了可校验的高阶 hint 元数据
- `hint-engine` 已优先消费这些元数据
- 高阶提示的 `technique / targetIndex / relatedIndexes` 不再只依赖 runtime 猜测
- `validate-puzzles.js` 可以识别高阶元数据是否合法
- `tests/game-engine.test.js` 对优先级、回退与 technique 对齐有稳定断言
- `beginner / intermediate` 的提示行为未回归

## 风险与取舍

- 这轮不会自动解决“所有高阶提示都能被引擎证明”的问题，只是先让提示来源更可信
- 题库维护会比原来更细，但这是换取高阶提示稳定性的必要成本
- 若后续要扩更多高阶技巧，建议继续沿这套“权威标注 + 渐进推导”路径演进

## 后续阶段建议

在本轮完成后，更适合继续做的下一步是：

1. 利用 `context` 补更像教学的 technique 文案
2. 细化高亮层次，例如区分 pivot / wing / elimination band
3. 再评估是否为部分技巧补更强的自动推导能力
