const expertPuzzles = [
  {
    id: "expert-001",
    difficulty: "expert",
    puzzle: "000000012000000003002300000070050000000000000000040080000009600400000000830000000",
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
    puzzle: "000000032000000008002800000040060000000000000000090040000002700500000000420000000",
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
    puzzle: "000000023000000004003400000080060000000000000000050090000001700500000000940000000",
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
    puzzle: "000000054000000001004100000060080000000000000000020060000004900700000000640000000",
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
    puzzle: "000000034000000005004500000090070000000000000000060010000002800600000000150000000",
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
    puzzle: "000000045000000006005600000010080000000000000000070020000003900700000000260000000",
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
    puzzle: "000000056000000007006700000020090000000000000000080030000004100800000000370000000",
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
    puzzle: "000000067000000008007800000030010000000000000000090040000005200900000000480000000",
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
    puzzle: "000000078000000009008900000040020000000000000000010050000006300100000000590000000",
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
    puzzle: "000002600002000500000100200050600000000000000000001000003000000200300000007090000",
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
    puzzle: "000002090900000070000100000000608000006000010000000005003000000205000000007000000",
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
    puzzle: "000000097000000001007100000050030000000000000000020060000008400200000000610000000",
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
    puzzle: "000000087000000001007100000050030000000000000000020060000009400200000000610000000",
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
    puzzle: "000000078000000001008100000050030000000000000000020060000009400200000000610000000",
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
    puzzle: "000000079000000001009100000050030000000000000000020060000008400200000000610000000",
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
