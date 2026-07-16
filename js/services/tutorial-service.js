const { foundationLessons } = require("../data/puzzles-foundation");

const LESSON_IDS = foundationLessons.map(function (lesson) {
  return lesson.id;
});

function createEmptyTutorialProgress() {
  return { completedLessonIds: [] };
}

function normalizeTutorialProgress(progress) {
  const completedLessonIds = progress && Array.isArray(progress.completedLessonIds)
    ? progress.completedLessonIds.filter(function (lessonId) {
        return LESSON_IDS.indexOf(lessonId) >= 0;
      })
    : [];

  return {
    completedLessonIds: LESSON_IDS.filter(function (lessonId) {
      return completedLessonIds.indexOf(lessonId) >= 0;
    })
  };
}

function isLessonUnlocked(progress, lessonId) {
  const lessonIndex = LESSON_IDS.indexOf(lessonId);
  const normalized = normalizeTutorialProgress(progress);

  return lessonIndex === 0 || (
    lessonIndex > 0 &&
    normalized.completedLessonIds.indexOf(LESSON_IDS[lessonIndex - 1]) >= 0
  );
}

function completeTutorialLesson(progress, lessonId) {
  const normalized = normalizeTutorialProgress(progress);

  if (LESSON_IDS.indexOf(lessonId) < 0 || normalized.completedLessonIds.indexOf(lessonId) >= 0) {
    return normalized;
  }

  return normalizeTutorialProgress({
    completedLessonIds: normalized.completedLessonIds.concat(lessonId)
  });
}

function isValidTutorialState(tutorialState) {
  const lesson = tutorialState && foundationLessons.find(function (item) {
    return item.id === tutorialState.lessonId;
  });

  return Boolean(lesson) &&
    Number.isInteger(tutorialState.stepIndex) &&
    tutorialState.stepIndex >= 0 &&
    tutorialState.stepIndex < lesson.tutorialSteps.length;
}

function validateTutorialInput(lesson, game, stepIndex, index, value) {
  const step = lesson && lesson.tutorialSteps ? lesson.tutorialSteps[stepIndex] : null;

  if (!step || index !== step.targetIndex) {
    return { status: "blocked" };
  }

  if (String(value) !== game.solution[step.targetIndex]) {
    return { status: "incorrect", step: step };
  }

  return {
    status: stepIndex === lesson.tutorialSteps.length - 1 ? "complete" : "correct",
    step: step,
    nextStepIndex: stepIndex + 1
  };
}

module.exports = {
  LESSON_IDS,
  createEmptyTutorialProgress,
  normalizeTutorialProgress,
  isLessonUnlocked,
  completeTutorialLesson,
  isValidTutorialState,
  validateTutorialInput
};
