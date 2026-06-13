const LOCALES = {
  "zh-CN": {
    common: {
      back: "返回",
      secondsShort: "s"
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
      initialExam: {
        title: "首次进入，先完成一次难度测试",
        subtitle: "在时限内完成，可解锁当前难度及以下难度",
        fallback: "时间到了也可以继续做完，但这次测试不算通过，也不会获得积分",
        entryTag: "难度测试",
        entryAction: "点击开始"
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
        hasSave: "可继续上局",
        noSave: "还没有可继续的棋局"
      },
      returnCard: {
        title: "最近一局",
        summary: "{difficulty} · {time}s",
        streakLabel: "连续 {streak} 天",
        prompt: {
          hasSave: "继续这局，或马上新开。",
          noSave: "新开一局，把节奏续上。"
        }
      },
      recentSummary: "最近完成：{difficulty} · {time}s · 连续 {streak} 天",
      currentDifficulty: "当前难度: {difficulty}",
      difficultyLocked: "未解锁",
      lockedDialog: {
        title: "{difficulty} 尚未解锁",
        examAction: "参加考试",
        pointsAction: "查看积分",
        pointsProgress: "当前积分 {points} / {cost}",
        pointsRemaining: "还差 {remaining} 积分解锁",
        fallbackHint: "考试失败后可继续练习，但不计积分",
        examUnlockHint: "通过考试可直接解锁当前难度"
      }
    },
    settings: {
      title: "设置",
      pageTitle: "设置",
      subtitle: "在这里调整语言与挑战节奏。",
      backHome: "回到首页",
      resumeGameLabel: "回到游戏",
      resumeGameHint: "返回当前棋盘，并继续这一局",
      languageLabel: "语言",
      languageAction: "选择",
      languageZh: "简体中文",
      languageEn: "English",
      languageJa: "日本語",
      languageSummary: "当前语言：{language}",
      languageHint: "点开后直接选择并立即生效",
      examHomeHint: "回到考试难度选择",
      restartLabel: "重开一局",
      restartHint: "按当前难度立即开始新棋局",
      exitExamLabel: "退出考试",
      exitExamHint: "退出后回普通首页，并按新手难度继续",
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
      helperFuture: "后续音效、视觉偏好或辅助能力都可继续放在这里。",
      examLockedHint: "考试进行中，当前仅支持返回首页和切换语言。"
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
      pointsAwarded: "积分 +{points}",
      pointsBlocked: "本局不计入积分",
      timeLabel: "用时",
      hintLabel: "提示",
      checkLabel: "检查",
      mistakeLabel: "错误",
      statsTitle: "本地统计",
      statsTotalLabel: "累计完成",
      statsCompletedLabel: "当前难度完成",
      statsCurrentStreakLabel: "当前连续",
      statsBestStreakLabel: "最佳连续",
      statsCurrentStreakValue: "当前连续 {streak} 天",
      statsBestStreakValue: "最佳连续 {streak} 天",
      statsBestLabel: "当前难度最好",
      statsAverageLabel: "当前难度平均",
      statsHintsLabel: "当前难度提示",
      statsHintsAverageLabel: "当前难度平均提示",
      tags: {
        zeroHints: "零提示",
        zeroMistakes: "零错误",
        oneShot: "一次完成"
      }
    },
    board: {
      timerLabel: "计时",
      examActive: "考试中",
      examFailed: "考试未通过",
      examDifficultyLabel: "{difficulty}考试",
      examRemaining: "剩余 {time}"
    },
    share: {
      friendTitle: "方庭九屿：一款本地优先的数独微信小游戏",
      timelineTitle: "方庭九屿｜本地优先的数独小游戏"
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
        cell: "第{row}行第{column}列这个格子已经可以确定。",
        technique: "第{row}行第{column}列这个格子现在只剩一个可以填的数字。",
        answer: "第{row}行第{column}列可以填写 {value}。"
      },
      intermediate: {
        direction: "先从第{row}行与第{box}宫入手，这一段已经能继续推进，但先别急着直接落子。",
        cell: "先看第{row}行第{column}列，这个格子已经可以填写了。",
        technique: "第{row}行第{column}列这个格子已经收束到唯一答案，可以直接填写。"
      },
      skilled: {
        direction: "先看第{row}行与第{box}宫的交界，只收这片范围，先别把视线放大。",
        technique: "这里可以直接利用 Naked Single，R{row}C{column} 不必再扩散检查。",
        techniqueByTechnique: {
          "box-line-reduction": "关注这一宫与同带的交界，候选已经开始向同一条带收束。",
          "naked-pair": "关注这组并排候选，Naked Pair 已经成形，可继续收窄。"
        }
      },
      expert: {
        technique: "技巧提示：{technique}。",
        techniqueByTechnique: {
          "x-wing": "比较这两组对应候选落点；这里已形成 X-Wing。",
          "xy-wing": "关注枢纽格与两侧翼格的候选关系；这里已形成 XY-Wing。"
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
      back: "Back",
      secondsShort: "s"
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
      initialExam: {
        title: "Choose an exam difficulty",
        subtitle: "Pass to unlock this difficulty and below",
        fallback: "You can still finish the run after timeout, but it earns no points",
        entryTag: "Exam",
        entryAction: "Tap to start"
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
        hasSave: "Continue your last run.",
        noSave: "No run to continue yet."
      },
      returnCard: {
        title: "Recent run",
        summary: "{difficulty} · {time}s",
        streakLabel: "Streak {streak} days",
        prompt: {
          hasSave: "Continue this run or start fresh.",
          noSave: "Start fresh and keep the streak going."
        }
      },
      recentSummary: "Recent finish: {difficulty} · {time}s · streak {streak}",
      currentDifficulty: "Current difficulty: {difficulty}",
      difficultyLocked: "Locked",
      lockedDialog: {
        title: "{difficulty} is locked",
        examAction: "Take exam",
        pointsAction: "View points",
        pointsProgress: "Points {points} / {cost}",
        pointsRemaining: "{remaining} more points to unlock",
        fallbackHint: "Failed exam runs can continue, but earn no points",
        examUnlockHint: "Pass the exam to unlock this level directly"
      }
    },
    settings: {
      title: "Settings",
      pageTitle: "Settings",
      subtitle: "Adjust language and challenge pace.",
      backHome: "Back home",
      resumeGameLabel: "Resume game",
      resumeGameHint: "Return to the current board and keep solving",
      languageLabel: "Language",
      languageAction: "Choose",
      languageZh: "简体中文",
      languageEn: "English",
      languageJa: "日本語",
      languageSummary: "Current language: {language}",
      languageHint: "Open and pick a language to apply it instantly",
      examHomeHint: "Return to exam difficulty choice",
      restartLabel: "Restart run",
      restartHint: "Start a fresh puzzle at the current difficulty",
      exitExamLabel: "Exit exam",
      exitExamHint: "Return home and continue from Beginner difficulty",
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
      helperFuture: "Sound, visual, and helper options can live here later.",
      examLockedHint: "During an exam, only Home and language switching stay available."
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
      pointsAwarded: "Points +{points}",
      pointsBlocked: "No points awarded",
      timeLabel: "Time",
      hintLabel: "Hints",
      checkLabel: "Checks",
      mistakeLabel: "Mistakes",
      statsTitle: "Local stats",
      statsTotalLabel: "Completed",
      statsCompletedLabel: "Completed at this level",
      statsCurrentStreakLabel: "Current streak",
      statsBestStreakLabel: "Best streak",
      statsCurrentStreakValue: "Current streak {streak} days",
      statsBestStreakValue: "Best streak {streak} days",
      statsBestLabel: "Best at this level",
      statsAverageLabel: "Average at this level",
      statsHintsLabel: "Hints at this level",
      statsHintsAverageLabel: "Average hints at this level",
      tags: {
        zeroHints: "No hints",
        zeroMistakes: "No mistakes",
        oneShot: "One-shot clear"
      }
    },
    board: {
      timerLabel: "Time",
      examActive: "Exam in progress",
      examFailed: "Exam failed",
      examDifficultyLabel: "{difficulty} Exam",
      examRemaining: "Remaining {time}"
    },
    share: {
      friendTitle: "Fangting Jiuyu: a local-first Sudoku WeChat game",
      timelineTitle: "Fangting Jiuyu | A local-first Sudoku mini game"
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
        cell: "The cell at row {row}, column {column} can already be determined.",
        technique: "The cell at row {row}, column {column} now has only one possible number left.",
        answer: "Row {row}, column {column} can be filled with {value}."
      },
      intermediate: {
        direction: "Start with row {row} around box {box}. This segment is ready to move, but hold the placement for a moment.",
        cell: "Look at row {row}, column {column} first. This cell can already be filled in.",
        technique: "The cell at row {row}, column {column} has narrowed down to one answer, so it can be filled in now."
      },
      skilled: {
        direction: "Check the overlap between row {row} and box {box}. Keep the scan inside that pocket before widening out.",
        technique: "A Naked Single is enough here: R{row}C{column}. No wider scan is needed.",
        techniqueByTechnique: {
          "box-line-reduction": "Focus on the overlap between this box and its shared band. The candidates are already collapsing onto the same band.",
          "naked-pair": "Focus on this paired candidate set. A Naked Pair is already in place and can narrow the grid further."
        }
      },
      expert: {
        technique: "Technique hint: {technique}.",
        techniqueByTechnique: {
          "x-wing": "Compare these matched candidate positions. An X-Wing is already formed here.",
          "xy-wing": "Focus on the candidate links between the pivot and its two wings. An XY-Wing is already formed here."
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
  },
  ja: {
    common: {
      back: "戻る",
      secondsShort: "秒"
    },
    difficulty: {
      beginner: "初級",
      intermediate: "中級",
      skilled: "上級",
      expert: "上級者向け"
    },
    home: {
      subtitle: {
        playful: "やさしい一局から始めましょう。",
        pro: "集中して解き進めましょう。"
      },
      initialExam: {
        title: "最初に難易度テストを受けてください",
        subtitle: "時間内にクリアすると、その難易度以下が解放されます",
        fallback: "時間切れ後も続行できますが、不合格となりポイントも入りません",
        entryTag: "難易度テスト",
        entryAction: "タップして開始"
      },
      difficultyLabel: "難易度",
      difficultyAction: {
        expand: "変更",
        collapse: "閉じる"
      },
      primary: {
        continue: "続きから",
        newGame: "新しい一局"
      },
      status: {
        hasSave: "前回の続きから遊べます。",
        noSave: "続きの盤面はまだありません。"
      },
      returnCard: {
        title: "最近の一局",
        summary: "{difficulty} · {time}秒",
        streakLabel: "連続 {streak}日",
        prompt: {
          hasSave: "この一局を続けるか、新しく始めます。",
          noSave: "新しい一局を始めて流れをつなげましょう。"
        }
      },
      recentSummary: "最近の完了: {difficulty} · {time}秒 · 連続 {streak}日",
      currentDifficulty: "現在の難易度: {difficulty}",
      difficultyLocked: "未解放",
      lockedDialog: {
        title: "{difficulty} はまだ解放されていません",
        examAction: "試験を受ける",
        pointsAction: "ポイントを見る",
        pointsProgress: "現在のポイント {points} / {cost}",
        pointsRemaining: "解放まであと {remaining} ポイント",
        fallbackHint: "試験に失敗しても練習は続けられますが、ポイントは加算されません",
        examUnlockHint: "試験に合格するとこの難易度を直接解放できます"
      }
    },
    settings: {
      title: "設定",
      pageTitle: "設定",
      subtitle: "言語とプレイテンポを調整できます。",
      backHome: "ホームへ戻る",
      resumeGameLabel: "ゲームに戻る",
      resumeGameHint: "現在の盤面に戻って続けます",
      languageLabel: "言語",
      languageAction: "選択",
      languageZh: "简体中文",
      languageEn: "English",
      languageJa: "日本語",
      languageSummary: "現在の言語: {language}",
      languageHint: "開いて選ぶとすぐに反映されます",
      examHomeHint: "試験の難易度選択に戻る",
      restartLabel: "新しい一局を開始",
      restartHint: "現在の難易度で新しい盤面を始めます",
      exitExamLabel: "試験を終了",
      exitExamHint: "通常のホームへ戻り、初級難易度として続けます",
      difficultyLabel: "難易度",
      difficultyHint: "プレイテンポ",
      difficultyCurrent: "現在の難易度: {difficulty}",
      difficultySummary: "現在の難易度: {difficulty}",
      difficultyBeginnerHint: "やさしい進行でヒントも多め",
      difficultyIntermediateHint: "落ち着いて考えやすいバランス",
      difficultySkilledHint: "テンポ重視でチェックは控えめ",
      difficultyExpertHint: "冷静に詰める上級者向け",
      difficultyChanged: "難易度を{difficulty}に切り替え、新しい盤面を開始しました。",
      helper: "基本設定はここで調整できます。",
      helperFuture: "音や表示、補助設定も今後ここに追加できます。",
      examLockedHint: "試験中はホームへ戻ることと言語切替のみ利用できます。"
    },
    languagePage: {
      title: "言語",
      subtitle: "表示する言語を選択してください。",
      applied: "選択するとすぐに反映されます"
    },
    completion: {
      titleByDifficulty: {
        beginner: "この一局をクリアしました",
        intermediate: "安定してクリアしました",
        skilled: "この一局を突破しました",
        expert: "盤面をクリアしました"
      },
      encouragementByDifficulty: {
        beginner: "いい流れです。このまま続けましょう。",
        intermediate: "落ち着いた解き方ができています。",
        skilled: "テンポよく進められています。さらに上を狙えます。",
        expert: "無駄の少ない解き切りでした。"
      },
      statsAction: "統計を見る",
      nextAction: "もう一局",
      homeAction: "ホームへ",
      backToCompletion: "結果に戻る",
      pointsAwarded: "ポイント +{points}",
      pointsBlocked: "この一局はポイント対象外です",
      timeLabel: "時間",
      hintLabel: "ヒント",
      checkLabel: "チェック",
      mistakeLabel: "ミス",
      statsTitle: "ローカル統計",
      statsTotalLabel: "累計クリア",
      statsCompletedLabel: "この難易度のクリア数",
      statsCurrentStreakLabel: "現在の連続",
      statsBestStreakLabel: "最長連続",
      statsCurrentStreakValue: "現在の連続 {streak}日",
      statsBestStreakValue: "最長連続 {streak}日",
      statsBestLabel: "この難易度の最速",
      statsAverageLabel: "この難易度の平均",
      statsHintsLabel: "この難易度のヒント数",
      statsHintsAverageLabel: "この難易度の平均ヒント",
      tags: {
        zeroHints: "ヒントなし",
        zeroMistakes: "ミスなし",
        oneShot: "一発クリア"
      }
    },
    board: {
      timerLabel: "時間",
      examActive: "試験中",
      examFailed: "試験不合格",
      examDifficultyLabel: "{difficulty}試験",
      examRemaining: "残り {time}"
    },
    share: {
      friendTitle: "方庭九屿：ローカルファーストの数独WeChatミニゲーム",
      timelineTitle: "方庭九屿｜ローカルファーストの数独ミニゲーム"
    },
    toolbar: {
      note: "メモ",
      undo: "元に戻す",
      erase: "消す",
      hint: "ヒント",
      check: "チェック"
    },
    hint: {
      beginner: {
        direction: "まずは{row}行と{box}ボックスの重なりを見ましょう。ここで1マス確定できます。",
        cell: "{row}行{column}列はもう確定できます。",
        technique: "{row}行{column}列は入る数字が1つに絞れています。",
        answer: "{row}行{column}列には {value} を入れます。"
      },
      intermediate: {
        direction: "まずは{row}行と{box}ボックスの重なりを見ると、次に進めます。",
        cell: "まず{row}行{column}列を見てください。このマスは埋められます。",
        technique: "{row}行{column}列は候補が1つに絞れているので、そのまま確定できます。"
      },
      skilled: {
        direction: "{row}行と{box}ボックスの重なりに絞って見てください。この範囲だけで前進できます。",
        technique: "ここは候補が1つに絞れています。{row}行{column}列を確定できます。",
        techniqueByTechnique: {
          "box-line-reduction": "このボックスと同じ帯の重なりに注目してください。候補が同じ帯に寄っています。",
          "naked-pair": "この2つの候補の組に注目してください。同じ2候補だけが残っていて、他を絞れます。"
        }
      },
      expert: {
        technique: "手筋ヒント: {technique}。",
        techniqueByTechnique: {
          "x-wing": "対応する候補位置を比べると、ここで X-Wing が成立しています。",
          "xy-wing": "枢軸マスと両翼マスの候補関係を見ると、ここで XY-Wing が成立しています。"
        }
      },
      fallback: {
        direction: "まずは{row}行と{box}ボックスの重なりを狭めましょう。",
        cell: "{row}行{column}列はもう確定できます。",
        technique: "ここは候補が1つだけなので、{row}行{column}列を確定できます。"
      }
    },
    check: {
      hasIssueByDifficulty: {
        beginner: "修正が必要な入力があります。",
        intermediate: "入力を見直したい場所があります。",
        skilled: "競合があります。先に解消してください。",
        expert: "競合があります。"
      },
      cleanByDifficulty: {
        beginner: "今のところ修正が必要な箇所はありません。",
        intermediate: "この手順に目立つ問題はありません。",
        skilled: "今のところ競合はありません。",
        expert: "競合は見つかっていません。"
      }
    }
  }
};

module.exports = {
  LOCALES
};
