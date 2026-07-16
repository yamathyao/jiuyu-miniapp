const foundationLessons = [
  {
    id: "foundation-001",
    difficulty: "foundation",
    puzzle: "530678912602195348190342567800060003400803001700020006060000280000419005000080079",
    solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
    techniques: ["naked-single"],
    tutorialSteps: [
      { targetIndex: 2, relatedIndexes: [0, 1, 3, 4, 5, 6, 7, 8], explanationKey: "tutorial.steps.row" },
      { targetIndex: 10, relatedIndexes: [9, 11, 12, 13, 14, 15, 16, 17], explanationKey: "tutorial.steps.row" },
      { targetIndex: 20, relatedIndexes: [18, 19, 21, 22, 23, 24, 25, 26], explanationKey: "tutorial.steps.row" }
    ]
  },
  {
    id: "foundation-002",
    difficulty: "foundation",
    puzzle: "005080300160070084837500209906125408503090000402736000301057040728040060604010003",
    solution: "245981376169273584837564219976125438513498627482736951391657842728349165654812793",
    techniques: ["hidden-single"],
    tutorialSteps: [
      { targetIndex: 0, relatedIndexes: [9, 18, 27, 36, 45, 54, 63, 72], explanationKey: "tutorial.steps.column" },
      { targetIndex: 11, relatedIndexes: [2, 20, 29, 38, 47, 56, 65, 74], explanationKey: "tutorial.steps.column" },
      { targetIndex: 22, relatedIndexes: [4, 13, 31, 40, 49, 58, 67, 76], explanationKey: "tutorial.steps.column" }
    ]
  },
  {
    id: "foundation-003",
    difficulty: "foundation",
    puzzle: "640709000700216000019453070900070530537904812804030967172000390000521006000090081",
    solution: "645789123783216459219453678961872534537964812824135967172648395398521746456397281",
    techniques: ["naked-single", "hidden-single"],
    tutorialSteps: [
      { targetIndex: 4, relatedIndexes: [3, 5, 12, 13, 14, 21, 22, 23], explanationKey: "tutorial.steps.box" },
      { targetIndex: 35, relatedIndexes: [33, 34, 42, 43, 44, 51, 52, 53], explanationKey: "tutorial.steps.box" },
      { targetIndex: 46, relatedIndexes: [36, 37, 38, 45, 47, 54, 55, 56], explanationKey: "tutorial.steps.box" }
    ]
  }
];

module.exports = {
  foundationLessons
};
