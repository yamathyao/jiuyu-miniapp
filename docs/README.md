# 九屿文档导航

> 这份索引用来说明“先看什么、当前以什么为准、历史文档怎么用”。

## 推荐阅读顺序

1. [当前设计基线](./2026-06-04-jiuyu-current-design.md)  
   先看产品定位、平台判断、当前范围和主线方向。

2. [当前实施计划](./2026-06-04-jiuyu-current-implementation-plan.md)  
   再看阶段划分、当前进度、验证方式和执行顺序。

3. [小游戏迁移设计](./superpowers/specs/2026-06-04-jiuyu-minigame-migration-design.md)  
   用于理解为什么从小程序结构切到小游戏结构。

4. [小游戏迁移实施计划](./superpowers/plans/2026-06-04-minigame-migration-implementation.md)  
   用于回看迁移阶段的具体落地步骤与验证记录。

5. [本地存档设计](./superpowers/specs/2026-06-04-jiuyu-local-save-design.md)  
   当前下一阶段的主设计文档。

6. [本地存档实施计划](./superpowers/plans/2026-06-04-local-save-implementation.md)  
   当前下一阶段的执行计划。

## 当前有效文档

以下文档代表当前主线，后续开发默认以它们为准：

- [当前设计基线](./2026-06-04-jiuyu-current-design.md)
- [当前实施计划](./2026-06-04-jiuyu-current-implementation-plan.md)
- [小游戏迁移设计](./superpowers/specs/2026-06-04-jiuyu-minigame-migration-design.md)
- [小游戏迁移实施计划](./superpowers/plans/2026-06-04-minigame-migration-implementation.md)
- [本地存档设计](./superpowers/specs/2026-06-04-jiuyu-local-save-design.md)
- [本地存档实施计划](./superpowers/plans/2026-06-04-local-save-implementation.md)

## 当前状态

- 小游戏入口已切换完成
- `js/` 主线结构已建立
- 数独棋盘核心交互已完成并手工验证正常
- 当前下一阶段是“本地存档与继续游戏”
- 本地存档已完成设计与实施计划，尚未进入代码实现

## 历史文档

以下文档保留作历史参考，不再代表当前技术方向：

- [小程序阶段产品设计](./2026-05-22-jiuyu-sudoku-miniapp-design.md)
- [小程序阶段实施计划](./2026-05-22-jiuyu-miniapp-implementation-plan.md)
- [小程序阶段棋盘核心设计](./superpowers/specs/2026-06-04-jiuyu-board-core-design.md)
- [小程序阶段棋盘核心计划](./superpowers/plans/2026-06-04-board-core-implementation.md)

这些文档仍可用于回看产品定位来源、旧结构判断和棋盘交互规则的收敛过程，但结构设计以小游戏主线文档为准。
