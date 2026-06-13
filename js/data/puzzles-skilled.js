const skilledPuzzles = [
  {
    id: "skilled-001",
    difficulty: "skilled",
    puzzle: "030000000000500003097030000800005007070080010900700008000020870200007000000000050",
    solution: "435269781682571493197834562826195347374682915951743628519326874248957136763418259",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 9,
      relatedIndexes: [],
      context: {
        pattern: "pair"
      }
    }
  },
  {
    id: "skilled-002",
    difficulty: "skilled",
    puzzle: "030000000000500003087030000900005007070090010800700009000020970200007000000000050",
    solution: "435268791692571483187934562926185347374692815851743629518326974249857136763419258",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "box-line-reduction",
      targetIndex: 0,
      relatedIndexes: [9, 18],
      context: {
        pattern: "box-line"
      }
    }
  },
  {
    id: "skilled-003",
    difficulty: "skilled",
    puzzle: "050000000000700005029050000100007009090010030200900001000040190400009000000000070",
    solution: "657482913814793625329156784148327569596814237273965841732548196461279358985631472",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 0,
      relatedIndexes: [1, 9],
      context: {
        pattern: "pair"
      }
    }
  },
  {
    id: "skilled-004",
    difficulty: "skilled",
    puzzle: "050000000000700005028050000100007008080010030200800001000040180400008000000000070",
    solution: "657492813914783625328156794149327568586914237273865941732549186461278359895631472",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "box-line-reduction",
      targetIndex: 8,
      relatedIndexes: [17, 26],
      context: {
        pattern: "box-line"
      }
    }
  },
  {
    id: "skilled-005",
    difficulty: "skilled",
    puzzle: "040000000000600004018040000900006008080090020100800009000030980300008000000000060",
    solution: "546371892793682514218945673937216458485793126162854739621437985359168247874529361",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 9,
      relatedIndexes: [],
      context: {
        pattern: "pair"
      }
    }
  },
  {
    id: "skilled-006",
    difficulty: "skilled",
    puzzle: "060000000000800006031060000200008001010020040300100002000050210500001000000000080",
    solution: "768593124925814736431267895259438671617925348384176952843659217572381469196742583",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 9,
      relatedIndexes: [],
      context: {
        pattern: "pair"
      }
    }
  },
  {
    id: "skilled-007",
    difficulty: "skilled",
    puzzle: "070000000000900007042070000300009002020030050400200003000060320600002000000000090",
    solution: "879614235136925847542378916361549782728136459495287163954761328683492571217853694",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 9,
      relatedIndexes: [],
      context: {
        pattern: "pair"
      }
    }
  },
  {
    id: "skilled-008",
    difficulty: "skilled",
    puzzle: "080000000000100008053080000400001003030040060500300004000070430700003000000000010",
    solution: "981725346247136958653489127472651893839247561516398274165872439794513682328964715",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 9,
      relatedIndexes: [],
      context: {
        pattern: "pair"
      }
    }
  },
  {
    id: "skilled-009",
    difficulty: "skilled",
    puzzle: "090000000000200009064090000500002004040050070600400005000080540800004000000000020",
    solution: "192836457358247169764591238583762914941358672627419385276983541815624793439175826",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 9,
      relatedIndexes: [],
      context: {
        pattern: "pair"
      }
    }
  },
  {
    id: "skilled-010",
    difficulty: "skilled",
    puzzle: "000000000060000200805000009094000020050060083000500400007000050000705000000006037",
    solution: "213947568469358271875612349694873125152469783738521496387194652926735814541286937",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 0,
      relatedIndexes: [1, 9],
      context: {
        pattern: "pair"
      }
    }
  },
  {
    id: "skilled-011",
    difficulty: "skilled",
    puzzle: "000000560000000071000000348004000005002060000030501400000004002000000004500090800",
    solution: "213847569468359271975612348684973125152468793739521486397184652826735914541296837",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "box-line-reduction",
      targetIndex: 0,
      relatedIndexes: [9, 18],
      context: {
        pattern: "box-line"
      }
    }
  },
  {
    id: "skilled-012",
    difficulty: "skilled",
    puzzle: "000000560000300000000002000000980000000060000000001476008074002706800000040006008",
    solution: "213748569467359281985612347674983125152467893839521476398174652726835914541296738",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 0,
      relatedIndexes: [1, 9],
      context: {
        pattern: "pair"
      }
    }
  },
  {
    id: "skilled-013",
    difficulty: "skilled",
    puzzle: "010000000000300001095010000600003005050060080900500006000070650700005000000000030",
    solution: "213749568467358291895612347674893125152467983938521476389174652726935814541286739",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 9,
      relatedIndexes: [],
      context: {
        pattern: "pair"
      }
    }
  },
  {
    id: "skilled-014",
    difficulty: "skilled",
    puzzle: "010000000000300001095010000600003005050060070900500006000080650800005000000000030",
    solution: "213849567468357291795612348684793125152468973937521486379184652826935714541276839",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 9,
      relatedIndexes: [],
      context: {
        pattern: "pair"
      }
    }
  },
  {
    id: "skilled-015",
    difficulty: "skilled",
    puzzle: "010000000000300001085010000600003005050060070800500006000090650900005000000000030",
    solution: "213948567469357281785612349694783125152469873837521496378194652926835714541276938",
    techniques: ["naked-pair", "box-line-reduction"],
    hint: {
      primaryTechnique: "naked-pair",
      targetIndex: 9,
      relatedIndexes: [],
      context: {
        pattern: "pair"
      }
    }
  }
];

module.exports = {
  skilledPuzzles
};
