const { DIMENSIONS, CHECKIN_TEMPLATES } = require('./constants');

function getMissingDimensions(completedDimensions = []) {
  const completed = new Set(completedDimensions);
  return DIMENSIONS.filter((item) => !completed.has(item.id));
}

function getPlanetMood(completedCount = 0) {
  if (completedCount >= 6) {
    return {
      title: '星球今天完全点亮',
      text: '六个生态区都亮起来了，今天可以收工，也可以去看看生态区变化。',
      tone: 'perfect'
    };
  }
  if (completedCount >= 4) {
    return {
      title: '星球正在加速复苏',
      text: '已经完成大半，补上一个薄弱生态区就很接近完美一天。',
      tone: 'warm'
    };
  }
  if (completedCount >= 2) {
    return {
      title: '生态区开始发光',
      text: '现在最适合趁热打铁，再完成一个 15 分钟小行动。',
      tone: 'sprout'
    };
  }
  if (completedCount >= 1) {
    return {
      title: '第一束光已经出现',
      text: '别急着追求完美，今天再点亮一个区域就很好。',
      tone: 'seed'
    };
  }
  return {
    title: '星球还在等待第一束光',
    text: '从最容易的一项开始，先让今天动起来。',
    tone: 'quiet'
  };
}

function getNextAction(goal, completedDimensions = []) {
  const completed = new Set(completedDimensions);
  const focus = goal && goal.focusDimensions && goal.focusDimensions.length
    ? goal.focusDimensions
    : DIMENSIONS.map((item) => item.id);
  const dimensionId = focus.find((id) => !completed.has(id)) || getMissingDimensions(completedDimensions)[0]?.id || DIMENSIONS[0].id;
  const dimension = DIMENSIONS.find((item) => item.id === dimensionId) || DIMENSIONS[0];
  const template = CHECKIN_TEMPLATES.find((item) => item.dimension === dimension.id);
  return {
    dimension,
    template,
    title: template ? template.title : `${dimension.name}打卡`,
    subtitle: template ? template.subtitle : `点亮${dimension.sceneName}`
  };
}

function buildTodayQuests(goal, completedDimensions = []) {
  const completed = new Set(completedDimensions);
  const next = getNextAction(goal, completedDimensions);
  const focusCompleted = goal && goal.focusDimensions
    ? goal.focusDimensions.filter((id) => completed.has(id)).length
    : completed.size;
  return [
    {
      id: 'first-light',
      title: '点亮第一束光',
      desc: '完成任意一个生态区打卡',
      done: completed.size > 0
    },
    {
      id: 'focus-zone',
      title: `推进${next.dimension.sceneName}`,
      desc: next.subtitle,
      done: completed.has(next.dimension.id),
      dimension: next.dimension.id
    },
    {
      id: 'goal-rhythm',
      title: goal ? `维持${goal.name}` : '建立今日节奏',
      desc: goal ? `目标维度已完成 ${focusCompleted}/${goal.focusDimensions.length}` : '选择一个目标后会有专属任务',
      done: goal ? focusCompleted >= Math.min(2, goal.focusDimensions.length) : false
    }
  ];
}

function buildMotivation(goal, completedDimensions = []) {
  const completedCount = completedDimensions.length;
  const nextAction = getNextAction(goal, completedDimensions);
  return {
    ringDegrees: completedCount * 60,
    perfectDay: completedCount >= 6,
    missingDimensions: getMissingDimensions(completedDimensions),
    planetMood: getPlanetMood(completedCount),
    nextAction,
    todayQuests: buildTodayQuests(goal, completedDimensions),
    questDoneCount: buildTodayQuests(goal, completedDimensions).filter((item) => item.done).length
  };
}

module.exports = {
  getMissingDimensions,
  getPlanetMood,
  getNextAction,
  buildTodayQuests,
  buildMotivation
};
