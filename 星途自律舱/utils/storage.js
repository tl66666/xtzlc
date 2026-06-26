const { formatDate } = require('./date');
const { buildDashboardStats } = require('./stats');
const { calculateCheckinReward, calculateDailyReward, getLevelInfo } = require('./rewards');
const { getUnlockedAchievements } = require('./achievements');
const { getNewUnlocks } = require('./ecosystem');
const { pushCheckinToCloud, updateProfileToCloud } = require('./cloudSync');

const PROFILE_KEY = 'star_cabin_profile';
const CHECKINS_KEY = 'star_cabin_checkins';
const ACHIEVEMENTS_KEY = 'star_cabin_achievements';
const GOAL_KEY = 'star_cabin_goal';
const ONBOARDING_KEY = 'star_cabin_onboarding';
const REMINDER_KEY = 'star_cabin_reminder';
const CUSTOM_PLANS_KEY = 'star_cabin_custom_plans';
const PLAN_LOGS_KEY = 'star_cabin_plan_logs';

function safeGet(key, fallback) {
  try {
    return wx.getStorageSync(key) || fallback;
  } catch (error) {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    console.warn('storage failed', key, error);
  }
}

function createDefaultProfile() {
  return {
    nickname: '星途旅人',
    avatarUrl: '',
    planetName: '未命名星球',
    totalStarlight: 0,
    starCoins: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function getProfile() {
  const profile = safeGet(PROFILE_KEY, null) || createDefaultProfile();
  return {
    ...profile,
    levelInfo: getLevelInfo(profile.totalStarlight || 0)
  };
}

function saveProfile(profile) {
  const next = {
    ...profile,
    updatedAt: new Date().toISOString()
  };
  safeSet(PROFILE_KEY, next);
  updateProfileToCloud(next);
  return next;
}

function getReminder() {
  return safeGet(REMINDER_KEY, {
    enabled: false,
    time: '21:30',
    focus: '今日还差的生态区',
    message: '今晚给星球补一束光'
  });
}

function saveReminder(reminder) {
  const next = {
    ...getReminder(),
    ...reminder,
    updatedAt: new Date().toISOString()
  };
  safeSet(REMINDER_KEY, next);
  updateProfileToCloud({ reminder: next });
  return next;
}

function listCustomPlans() {
  return safeGet(CUSTOM_PLANS_KEY, []);
}

function saveCustomPlan(plan) {
  const plans = listCustomPlans();
  const now = new Date().toISOString();
  const id = plan.id || `plan-${Date.now()}`;
  const nextPlan = {
    id,
    title: plan.title,
    dimension: plan.dimension,
    payload: plan.payload || {},
    reminderEnabled: plan.reminderEnabled !== false,
    reminderTime: plan.reminderTime || '19:30',
    repeat: plan.repeat || '每天',
    createdAt: plan.createdAt || now,
    updatedAt: now
  };
  const nextPlans = [
    nextPlan,
    ...plans.filter((item) => item.id !== id)
  ].slice(0, 18);
  safeSet(CUSTOM_PLANS_KEY, nextPlans);
  updateProfileToCloud({ customPlans: nextPlans });
  return nextPlan;
}

function deleteCustomPlan(id) {
  const nextPlans = listCustomPlans().filter((item) => item.id !== id);
  const nextLogs = listPlanLogs().filter((item) => item.planId !== id);
  safeSet(CUSTOM_PLANS_KEY, nextPlans);
  safeSet(PLAN_LOGS_KEY, nextLogs);
  updateProfileToCloud({ customPlans: nextPlans, planLogs: nextLogs.slice(0, 60) });
  return nextPlans;
}

function listPlanLogs() {
  return safeGet(PLAN_LOGS_KEY, []);
}

function markPlanCompletion(planId, date = formatDate(), payload = {}) {
  const logs = listPlanLogs();
  const createdAt = new Date().toISOString();
  const nextLog = {
    id: `${date}-${planId}`,
    planId,
    date,
    done: true,
    payload,
    completedAt: createdAt
  };
  const nextLogs = [
    nextLog,
    ...logs.filter((item) => !(item.planId === planId && item.date === date))
  ].slice(0, 180);
  safeSet(PLAN_LOGS_KEY, nextLogs);
  updateProfileToCloud({ planLogs: nextLogs.slice(0, 60) });
  return nextLog;
}

function getPlanLogMap(date = formatDate()) {
  return listPlanLogs()
    .filter((item) => item.date === date && item.done)
    .reduce((map, item) => {
      map[item.planId] = item;
      return map;
    }, {});
}

function listCheckins() {
  return safeGet(CHECKINS_KEY, []);
}

function listAchievements() {
  return safeGet(ACHIEVEMENTS_KEY, []);
}

function getGoal() {
  return safeGet(GOAL_KEY, null);
}

function saveGoal(goalId) {
  const goal = {
    id: goalId,
    createdAt: new Date().toISOString()
  };
  safeSet(GOAL_KEY, goal);
  return goal;
}

function getOnboardingSeen() {
  return safeGet(ONBOARDING_KEY, false);
}

function saveOnboardingSeen() {
  safeSet(ONBOARDING_KEY, true);
  return true;
}

function resetOnboardingSeen() {
  safeSet(ONBOARDING_KEY, false);
  return false;
}

function resetLocalData() {
  [
    PROFILE_KEY,
    CHECKINS_KEY,
    ACHIEVEMENTS_KEY,
    GOAL_KEY,
    ONBOARDING_KEY,
    REMINDER_KEY,
    CUSTOM_PLANS_KEY,
    PLAN_LOGS_KEY
  ].forEach((key) => {
    try {
      wx.removeStorageSync(key);
    } catch (error) {
      console.warn('remove storage failed', key, error);
    }
  });
  return true;
}

function saveAchievements(items) {
  safeSet(ACHIEVEMENTS_KEY, items);
  return items;
}

function updateStreak(profile, date) {
  if (profile.lastActiveDate === date) {
    return profile;
  }
  const yesterday = new Date(`${date}T00:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayText = formatDate(yesterday);
  const currentStreak = profile.lastActiveDate === yesterdayText ? (profile.currentStreak || 0) + 1 : 1;
  return {
    ...profile,
    currentStreak,
    longestStreak: Math.max(profile.longestStreak || 0, currentStreak),
    lastActiveDate: date
  };
}

function submitCheckin(input) {
  const date = input.date || formatDate();
  const createdAt = new Date().toISOString();
  const records = listCheckins();
  const filtered = records.filter((record) => !(record.date === date && record.dimension === input.dimension));
  const beforeDimensionCount = records.filter((record) => record.dimension === input.dimension).length;
  const existedToday = records.some((record) => record.date === date && record.dimension === input.dimension);
  const record = {
    id: `${date}-${input.dimension}`,
    dimension: input.dimension,
    date,
    payload: input.payload || {},
    starlight: calculateCheckinReward(input),
    createdAt
  };
  const nextRecords = [...filtered, record];
  const afterDimensionCount = nextRecords.filter((item) => item.dimension === input.dimension).length;
  const ecosystemUnlocks = existedToday ? [] : getNewUnlocks(input.dimension, beforeDimensionCount, afterDimensionCount);
  safeSet(CHECKINS_KEY, nextRecords);

  const stats = buildDashboardStats(nextRecords, new Date(`${date}T00:00:00`));
  const beforeProfile = getProfile();
  const existingDailyCount = new Set(records.filter((item) => item.date === date).map((item) => item.dimension)).size;
  const wasPerfect = existingDailyCount >= 6;
  const isPerfect = stats.today.completedCount >= 6;
  const dailyBonus = calculateDailyReward({
    completedCount: isPerfect && !wasPerfect ? stats.today.completedCount : 0,
    currentStreak: beforeProfile.lastActiveDate === date ? beforeProfile.currentStreak : updateStreak(beforeProfile, date).currentStreak
  });
  const streakedProfile = updateStreak(beforeProfile, date);
  const profile = saveProfile({
    ...streakedProfile,
    totalStarlight: (beforeProfile.totalStarlight || 0) + record.starlight + dailyBonus,
    starCoins: (beforeProfile.starCoins || 0) + (isPerfect && !wasPerfect ? 6 : 1)
  });

  const existingAchievements = listAchievements();
  const unlocked = getUnlockedAchievements(profile, stats, existingAchievements.map((item) => item.id));
  if (unlocked.length) {
    saveAchievements([
      ...existingAchievements,
      ...unlocked.map((item) => ({
        ...item,
        unlockedAt: createdAt
      }))
    ]);
  }

  pushCheckinToCloud({
    dimension: record.dimension,
    date: record.date,
    payload: record.payload,
    starlight: record.starlight
  });

  return {
    record,
    profile: getProfile(),
    stats,
    unlocked,
    ecosystemUnlocks
  };
}

module.exports = {
  createDefaultProfile,
  getProfile,
  saveProfile,
  listCheckins,
  submitCheckin,
  listAchievements,
  saveAchievements,
  getGoal,
  saveGoal,
  getOnboardingSeen,
  saveOnboardingSeen,
  getReminder,
  saveReminder,
  listCustomPlans,
  saveCustomPlan,
  deleteCustomPlan,
  listPlanLogs,
  markPlanCompletion,
  getPlanLogMap,
  resetOnboardingSeen,
  resetLocalData
};
