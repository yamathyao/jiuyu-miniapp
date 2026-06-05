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
      languageLabel: "语言",
      languageZh: "简体中文",
      languageEn: "English",
      languageSummary: "当前语言：{language}",
      difficultySummary: "当前难度：{difficulty}",
      helper: "可在这里调整语言等基础选项。"
    },
    languagePage: {
      title: "语言",
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
      languageLabel: "Language",
      languageZh: "简体中文",
      languageEn: "English",
      languageSummary: "Current language: {language}",
      difficultySummary: "Current difficulty: {difficulty}",
      helper: "Adjust your language and other foundational options here."
    },
    languagePage: {
      title: "Language",
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
