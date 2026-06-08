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
      currentDifficulty: "当前难度: {difficulty}"
    },
    settings: {
      title: "设置",
      pageTitle: "设置",
      subtitle: "在这里调整语言与挑战节奏。",
      languageLabel: "语言",
      languageAction: "切换",
      languageZh: "简体中文",
      languageEn: "English",
      languageSummary: "当前语言：{language}",
      languageHint: "进入语言页后立即生效",
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
        playful: "Start with a gentle round and settle into the rhythm.",
        pro: "Enter a focused solving rhythm."
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
      currentDifficulty: "Current difficulty: {difficulty}"
    },
    settings: {
      title: "Settings",
      pageTitle: "Settings",
      subtitle: "Adjust language and challenge pace.",
      languageLabel: "Language",
      languageAction: "Change",
      languageZh: "简体中文",
      languageEn: "English",
      languageSummary: "Current language: {language}",
      languageHint: "Changes apply right away",
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
        technique: "Naked Single: this cell has only one candidate left.",
        answer: "R1C3 can be filled with 4."
      },
      expert: {
        technique: "Naked Single, R1C3, 4."
      },
      fallback: {
        technique: "Naked Single: this cell has only one candidate left."
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
