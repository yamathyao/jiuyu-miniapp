const LOCALES = {
  "zh-CN": {
    common: {
      back: "返回"
    },
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
      difficultyLabel: "难度选择",
      difficultyAction: {
        expand: "切换",
        collapse: "收起"
      },
      primary: {
        continue: "继续游戏",
        newGame: "开始新局"
      },
      status: {
        hasSave: "可继续上次对局",
        noSave: "还没有可继续的对局"
      },
      recentSummary: "最近完成：{difficulty} · {time}s · 连续 {streak} 天",
      currentDifficulty: "当前难度: {difficulty}"
    },
    settings: {
      title: "设置",
      pageTitle: "设置",
      subtitle: "在这里调整语言与挑战节奏。",
      languageLabel: "语言",
      languageAction: "选择",
      languageZh: "简体中文",
      languageEn: "English",
      languageSummary: "当前语言：{language}",
      languageHint: "点开后直接选择并立即生效",
      restartLabel: "重开一局",
      restartHint: "按当前难度立即开始新棋局",
      difficultyLabel: "难度",
      difficultyHint: "挑战节奏",
      difficultyCurrent: "当前难度：{difficulty}",
      difficultySummary: "当前难度：{difficulty}",
      difficultyBeginnerHint: "更轻松，提示更充分",
      difficultyIntermediateHint: "陪伴感与思考空间并存",
      difficultySkilledHint: "更利落，检查更克制",
      difficultyExpertHint: "最冷静，也最专注",
      difficultyChanged: "已切换到{difficulty}难度，并开始新棋局。",
      helper: "可在这里调整语言等基础选项。",
      helperFuture: "后续音效、视觉偏好或辅助能力都可继续放在这里。"
    },
    languagePage: {
      title: "语言",
      subtitle: "选择你希望看到的界面语言。",
      applied: "切换后立即生效"
    },
    completion: {
      titleByDifficulty: {
        beginner: "这一局完成了",
        intermediate: "这局完成得很稳",
        skilled: "这一局拿下了",
        expert: "已完成本局"
      },
      encouragementByDifficulty: {
        beginner: "很好，继续保持这个节奏。",
        intermediate: "你已经开始进入自己的解题节奏了。",
        skilled: "节奏很利落，可以继续往更难的题走。",
        expert: "这是一局很克制的完成。"
      },
      statsAction: "查看统计",
      nextAction: "再来一局",
      homeAction: "回到首页",
      backToCompletion: "返回完成卡片",
      timeLabel: "用时",
      hintLabel: "提示",
      checkLabel: "检查",
      mistakeLabel: "错误",
      statsTitle: "本地统计",
      statsTotalLabel: "累计完成",
      statsCompletedLabel: "当前难度完成",
      statsCurrentStreakLabel: "当前连续",
      statsBestStreakLabel: "最佳连续",
      statsBestLabel: "当前难度最好",
      statsAverageLabel: "当前难度平均",
      statsHintsLabel: "当前难度提示",
      statsHintsAverageLabel: "当前难度平均提示"
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
        direction: "先看第{row}行与第{box}宫的交界，这里有一个数字可以先确定。",
        cell: "R{row}C{column} 这个格子已经可以确定。",
        technique: "这里是 Naked Single，R{row}C{column} 的候选数只剩一个。",
        answer: "R{row}C{column} 可以填写 {value}。"
      },
      intermediate: {
        direction: "先从第{row}行与第{box}宫入手，这一段已经能继续推进，但先别急着直接落子。",
        cell: "把注意力放在 R{row}C{column}，这里已经可以落子。",
        technique: "这里能用 Naked Single，R{row}C{column} 的候选数已经收束到唯一答案。"
      },
      skilled: {
        direction: "先看第{row}行与第{box}宫的交界，只收这片范围，先别把视线放大。",
        technique: "这里可以直接利用 Naked Single，R{row}C{column} 不必再扩散检查。",
        techniqueByTechnique: {
          "box-line-reduction": "先利用 Box-Line Reduction，把注意力收在 R{row}C{column} 周围这一带。",
          "naked-pair": "这里的 Naked Pair 已经成形，先围绕 R{row}C{column} 收窄候选，再决定要不要外扩。 "
        }
      },
      expert: {
        technique: "技巧提示：{technique}。",
        techniqueByTechnique: {
          "x-wing": "技巧提示：X-Wing。先看关联的行列。",
          "xy-wing": "技巧提示：XY-Wing。先看互相牵制的枢纽格。"
        }
      },
      fallback: {
        direction: "先收窄第{row}行与第{box}宫的交界。",
        cell: "R{row}C{column} 这个格子已经可以确定。",
        technique: "这里是 Naked Single，R{row}C{column} 的候选数只剩一个。"
      }
    },
    check: {
      hasIssueByDifficulty: {
        beginner: "发现需要处理的填写。",
        intermediate: "这里有几处填写可以再核对一下。",
        skilled: "当前有冲突，需要先清掉。",
        expert: "发现冲突。"
      },
      cleanByDifficulty: {
        beginner: "当前未发现需要处理的问题。",
        intermediate: "目前这一步没有明显问题。",
        skilled: "当前没有冲突。",
        expert: "未发现冲突。"
      }
    }
  },
  en: {
    common: {
      back: "Back"
    },
    difficulty: {
      beginner: "Beginner",
      intermediate: "Intermediate",
      skilled: "Skilled",
      expert: "Expert"
    },
    home: {
      subtitle: {
        playful: "Begin softly and settle in.",
        pro: "Find a focused solving rhythm."
      },
      difficultyLabel: "Difficulty",
      difficultyAction: {
        expand: "Choose",
        collapse: "Hide"
      },
      primary: {
        continue: "Continue",
        newGame: "New Game"
      },
      status: {
        hasSave: "Your last game is ready to continue.",
        noSave: "No game is ready to continue yet."
      },
      recentSummary: "Recent finish: {difficulty} · {time}s · streak {streak}",
      currentDifficulty: "Current difficulty: {difficulty}"
    },
    settings: {
      title: "Settings",
      pageTitle: "Settings",
      subtitle: "Adjust language and challenge pace.",
      languageLabel: "Language",
      languageAction: "Choose",
      languageZh: "简体中文",
      languageEn: "English",
      languageSummary: "Current language: {language}",
      languageHint: "Open and pick a language to apply it instantly",
      restartLabel: "Restart run",
      restartHint: "Start a fresh puzzle at the current difficulty",
      difficultyLabel: "Difficulty",
      difficultyHint: "Challenge rhythm",
      difficultyCurrent: "Current difficulty: {difficulty}",
      difficultySummary: "Current difficulty: {difficulty}",
      difficultyBeginnerHint: "Gentle pace, fuller hints",
      difficultyIntermediateHint: "Warm pace, more room",
      difficultySkilledHint: "Sharper pace, fewer checks",
      difficultyExpertHint: "Calm, focused mode",
      difficultyChanged: "Switched to {difficulty} and started a new game.",
      helper: "Adjust your language and other foundational options here.",
      helperFuture: "Sound, visual, and helper options can live here later."
    },
    languagePage: {
      title: "Language",
      subtitle: "Choose your interface language.",
      applied: "Changes apply immediately"
    },
    completion: {
      titleByDifficulty: {
        beginner: "Puzzle complete",
        intermediate: "Steady finish",
        skilled: "Run cleared",
        expert: "Run completed"
      },
      encouragementByDifficulty: {
        beginner: "Nice work. Keep that rhythm going.",
        intermediate: "That solve felt steady and in control.",
        skilled: "Clean pacing. You can push higher.",
        expert: "A measured finish all the way through."
      },
      statsAction: "View stats",
      nextAction: "Play again",
      homeAction: "Back home",
      backToCompletion: "Back to summary",
      timeLabel: "Time",
      hintLabel: "Hints",
      checkLabel: "Checks",
      mistakeLabel: "Mistakes",
      statsTitle: "Local stats",
      statsTotalLabel: "Completed",
      statsCompletedLabel: "Completed at this level",
      statsCurrentStreakLabel: "Current streak",
      statsBestStreakLabel: "Best streak",
      statsBestLabel: "Best at this level",
      statsAverageLabel: "Average at this level",
      statsHintsLabel: "Hints at this level",
      statsHintsAverageLabel: "Average hints at this level"
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
        direction: "Start with row {row} around box {box}. One value can already be fixed there.",
        cell: "Cell R{row}C{column} can already be determined.",
        technique: "Naked Single: R{row}C{column} has only one candidate left.",
        answer: "R{row}C{column} can be filled with {value}."
      },
      intermediate: {
        direction: "Start with row {row} around box {box}. This segment is ready to move, but hold the placement for a moment.",
        cell: "Focus on R{row}C{column}. It can be placed now.",
        technique: "Use a Naked Single here. R{row}C{column} already collapses to one candidate."
      },
      skilled: {
        direction: "Check the overlap between row {row} and box {box}. Keep the scan inside that pocket before widening out.",
        technique: "A Naked Single is enough here: R{row}C{column}. No wider scan is needed.",
        techniqueByTechnique: {
          "box-line-reduction": "Use the box-line reduction around R{row}C{column} and keep the scan tight to that band first.",
          "naked-pair": "Lean on the naked pair near R{row}C{column} and keep the scan local before widening out."
        }
      },
      expert: {
        technique: "Technique hint: {technique}.",
        techniqueByTechnique: {
          "x-wing": "Technique hint: X-Wing. Watch the linked row and column first.",
          "xy-wing": "Technique hint: XY-Wing. Watch the linked pivots first."
        }
      },
      fallback: {
        direction: "Tighten the row {row} / box {box} intersection first.",
        cell: "Cell R{row}C{column} can already be resolved.",
        technique: "Naked Single: R{row}C{column} has only one candidate left."
      }
    },
    check: {
      hasIssueByDifficulty: {
        beginner: "There are entries that need attention.",
        intermediate: "A few entries are worth checking again.",
        skilled: "There is a conflict to resolve first.",
        expert: "Conflict found."
      },
      cleanByDifficulty: {
        beginner: "No issues need attention right now.",
        intermediate: "This step looks clean for now.",
        skilled: "No conflicts right now.",
        expert: "No conflicts found."
      }
    }
  }
};

module.exports = {
  LOCALES
};
