const expertPuzzles = [
  {
    id: "expert-001",
    difficulty: "expert",
    puzzle: "000970000080000090002018005006002900000007030001040000200039670400500000000000100",
    solution: "653974812184265793792318465376852941548197236921643587215439678467581329839726154",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  },
  {
    id: "expert-002",
    difficulty: "expert",
    puzzle: "000070500609003000030050009040200000000300800103000040000080000007000020406017080",
    solution: "814976532659123478732854169948265317275341896163798245391682754587439621426517983",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "xy-wing",
      targetIndex: 55,
      relatedIndexes: [56, 54],
      context: {
        pattern: "pivot-wing"
      }
    }
  },
  {
    id: "expert-003",
    difficulty: "expert",
    puzzle: "000000903072500000003002000080000000000103400400200008000800005500340200940000006",
    solution: "154678923672539814893412567285964371769183452431257698326891745517346289948725136",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  },
  {
    id: "expert-004",
    difficulty: "expert",
    puzzle: "030200000800005001000000300001000009007003008005900067020800900009050000000700015",
    solution: "136298754872345691954176382261487539497563128385921467523814976719652843648739215",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "xy-wing",
      targetIndex: 54,
      relatedIndexes: [45, 63],
      context: {
        pattern: "pivot-wing"
      }
    }
  },
  {
    id: "expert-005",
    difficulty: "expert",
    puzzle: "000000004000400920020031000500000260001000050043000010000652000089703000000008000",
    solution: "875296134316487925924531687598174263761329458243865719437652891689713542152948376",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  },
  {
    id: "expert-006",
    difficulty: "expert",
    puzzle: "000300200000500036005040008009200370002000000304070000000000910700000050260009000",
    solution: "986317245427598136135642798619285374872431569354976821548763912791824653263159487",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  },
  {
    id: "expert-007",
    difficulty: "expert",
    puzzle: "000400000000010200006003810720006000083000600005000900009070003800900004000200500",
    solution: "197428356538619247246753819721396485983542671465187932659874123812935764374261598",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  },
  {
    id: "expert-008",
    difficulty: "expert",
    puzzle: "000530000000700008000060900032010006090003700500008100060000034023040000080000000",
    solution: "218539467649721358357864921832417596194653782576298143761985234923146875485372619",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  },
  {
    id: "expert-009",
    difficulty: "expert",
    puzzle: "000040500001800000008070030003500000000700090600010004870006005104000000090003001",
    solution: "329641578751832469468975132943528617215764893687319254872196345134257986596483721",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  },
  {
    id: "expert-010",
    difficulty: "expert",
    puzzle: "000750000002000000000100240150030000000000004008000300900010050040008197607004000",
    solution: "431752689862943571579186243154639728326875914798421365983217456245368197617594832",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  },
  {
    id: "expert-011",
    difficulty: "expert",
    puzzle: "000050000060043070008100200054030000000000004089001060000007000205009100000000902",
    solution: "431752698962843571578196243154638729326975814789421365893217456245369187617584932",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "xy-wing",
      targetIndex: 0,
      relatedIndexes: [1, 9, 36],
      context: {
        pattern: "pivot-wing"
      }
    }
  },
  {
    id: "expert-012",
    difficulty: "expert",
    puzzle: "000000600060700000007090003004030809000000010070020000000200406240009008610500000",
    solution: "431852697962743581587196243154637829326985714879421365793218456245369178618574932",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  },
  {
    id: "expert-013",
    difficulty: "expert",
    puzzle: "000000087060040000000106003004000000000805010970001000700200450200300000600004800",
    solution: "431952687862743591597186243154637928326895714978421365783219456245368179619574832",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  },
  {
    id: "expert-014",
    difficulty: "expert",
    puzzle: "000002008000800001000070203054000000020090804080021000070000050000300000609004030",
    solution: "431952678762843591598176243154638927326795814987421365873219456245367189619584732",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  },
  {
    id: "expert-015",
    difficulty: "expert",
    puzzle: "000850600000000001080000040004609800006000000000021005073000000045007090008000032",
    solution: "431852679762943581589176243154639827326785914897421365973218456245367198618594732",
    techniques: ["x-wing", "xy-wing"],
    hint: {
      primaryTechnique: "x-wing",
      targetIndex: 0,
      relatedIndexes: [1, 2, 9, 18],
      context: {
        pattern: "row-column"
      }
    }
  }
];

module.exports = {
  expertPuzzles
};
