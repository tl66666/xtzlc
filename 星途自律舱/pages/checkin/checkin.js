const { DIMENSIONS, DIMENSION_MAP, CHECKIN_ACTIONS } = require('../../utils/constants');
const { formatDate, formatDisplayDate } = require('../../utils/date');
const {
  listCheckins,
  submitCheckin,
  getProfile,
  getGoal,
  listCustomPlans,
  saveCustomPlan,
  deleteCustomPlan
} = require('../../utils/storage');
const { buildDashboardStats } = require('../../utils/stats');
const { getGoalPreset } = require('../../utils/goals');
const { buildMotivation } = require('../../utils/motivation');
const { getAssetBundle } = require('../../utils/assets');
const { playSound, playTapFeedback } = require('../../utils/sound');

const FIELD_PRESETS = {
  sport: {
    placeholder: '例如：晚饭后快走 30 分钟 / 力量训练 4 组',
    primaryLabel: '行动类型',
    primaryOptions: ['跑步', '健身', '拉伸', '球类', '骑行', '散步'],
    metricLabel: '完成量',
    metricOptions: ['15 分钟', '30 分钟', '45 分钟', '60 分钟', '90 分钟'],
    moodLabel: '状态',
    moodOptions: ['轻松', '适中', '有点累', '突破极限']
  },
  diet: {
    placeholder: '例如：三餐规律 / 晚餐少油少糖 / 今天喝水 8 杯',
    primaryLabel: '饮食目标',
    primaryOptions: ['早餐', '午餐', '晚餐', '三餐', '饮水', '加餐'],
    metricLabel: '健康评分',
    metricOptions: ['1 星', '2 星', '3 星', '4 星', '5 星'],
    moodLabel: '感受',
    moodOptions: ['很健康', '正常', '有点放纵']
  },
  study: {
    placeholder: '例如：刷算法题 3 道 / 背单词 30 个 / 看网课 1 节',
    primaryLabel: '学习类型',
    primaryOptions: ['编程', '阅读', '网课', '刷题', '背单词', '论文'],
    metricLabel: '学习时长',
    metricOptions: ['25 分钟', '45 分钟', '60 分钟', '90 分钟', '120 分钟'],
    moodLabel: '专注度',
    moodOptions: ['走神较多', '一般专注', '非常专注']
  },
  work: {
    placeholder: '例如：完成登录页 / 改 2 个 bug / 写项目文档',
    primaryLabel: '工作方式',
    primaryOptions: ['番茄钟', '开发', '文档', '调研', '测试', '复盘'],
    metricLabel: '投入时长',
    metricOptions: ['25 分钟', '1 小时', '2 小时', '4 小时'],
    moodLabel: '完成度',
    moodOptions: ['进行中', '已完成', '延期']
  },
  plan: {
    placeholder: '例如：列出今日三件事 / 晚上复盘 / 制定项目周计划',
    primaryLabel: '计划类型',
    primaryOptions: ['日计划', '周计划', '项目计划', '课程计划', '复盘'],
    metricLabel: '完成情况',
    metricOptions: ['1/3 项', '2/3 项', '3/3 项', '4/5 项', '5/5 项'],
    moodLabel: '执行感受',
    moodOptions: ['超额完成', '按计划完成', '部分完成', '未执行']
  },
  sleep: {
    placeholder: '例如：23:30 前上床 / 睡前不刷手机 / 午睡 20 分钟',
    primaryLabel: '作息目标',
    primaryOptions: ['早睡早起', '正常作息', '睡前远离手机', '午睡', '补觉'],
    metricLabel: '睡眠时长',
    metricOptions: ['6 小时', '7 小时', '8 小时', '9 小时'],
    moodLabel: '睡眠质量',
    moodOptions: ['很好', '不错', '一般', '较差']
  }
};

function getPreset(dimensionId) {
  return FIELD_PRESETS[dimensionId] || FIELD_PRESETS.sport;
}

function buildDefaultForm(dimensionId) {
  const preset = getPreset(dimensionId);
  return {
    primary: preset.primaryOptions[0],
    metric: preset.metricOptions[1] || preset.metricOptions[0],
    mood: preset.moodOptions[0],
    effort: '标准',
    customAction: '',
    note: ''
  };
}

Page({
  data: {
    date: formatDate(),
    dateDisplay: formatDisplayDate(),
    dimensions: [],
    stats: { today: { completedCount: 0, completedDimensions: [] } },
    profile: {},
    goal: null,
    motivation: { ringDegrees: 0, todayQuests: [], questDoneCount: 0 },
    activeId: 'sport',
    active: {
      ...DIMENSION_MAP.sport,
      preset: FIELD_PRESETS.sport
    },
    form: buildDefaultForm('sport'),
    quickActions: [],
    customPlans: [],
    activePlans: [],
    rewardModal: null,
    dailyChest: { ready: false, claimed: false, label: '完成六类后开启', progress: 0 },
    rewardFrames: getAssetBundle().starlightFrames,
    assets: getAssetBundle()
  },

  onShow() {
    this.refresh();
  },

  refresh(keepActive = true) {
    const records = listCheckins();
    const stats = buildDashboardStats(records);
    const profile = getProfile();
    const savedGoal = getGoal();
    const goal = getGoalPreset(savedGoal ? savedGoal.id : 'balanced_life');
    const completedSet = new Set(stats.today.completedDimensions || []);
    const dimensions = DIMENSIONS.map((dimension) => {
      const record = records.find((item) => item.date === stats.today.date && item.dimension === dimension.id);
      return {
        ...dimension,
        completed: completedSet.has(dimension.id),
        summary: record ? this.buildSummary(dimension.id, record.payload) : '等待点亮',
        count: records.filter((item) => item.dimension === dimension.id).length
      };
    });
    const nextActiveId = keepActive && this.data.activeId
      ? this.data.activeId
      : ((dimensions.find((item) => !item.completed) || dimensions[0] || {}).id || 'sport');

    this.setData({
      dateDisplay: formatDisplayDate(),
      stats,
      profile,
      goal,
      motivation: buildMotivation(goal, stats.today.completedDimensions),
      dimensions,
      dailyChest: this.buildDailyChest(stats),
      customPlans: this.decoratePlans(listCustomPlans())
    }, () => {
      this.activateDimension(nextActiveId, false);
    });
  },

  buildDailyChest(stats) {
    const count = stats.today.completedCount || 0;
    const remain = Math.max(0, 6 - count);
    return {
      ready: count >= 6,
      claimed: count >= 6,
      label: count >= 6 ? '完美宝箱已开启' : `还差 ${remain} 类`,
      remain,
      progress: Math.min(100, Math.round((count / 6) * 100))
    };
  },

  decoratePlans(plans) {
    return plans.map((plan) => {
      const dimension = DIMENSION_MAP[plan.dimension] || {};
      return {
        ...plan,
        dimensionName: dimension.name || '计划',
        color: dimension.color || '#d9972f',
        summary: this.buildSummary(plan.dimension, plan.payload)
      };
    });
  },

  activateDimension(dimensionId, resetForm = true) {
    const dimension = DIMENSION_MAP[dimensionId] || DIMENSIONS[0];
    const preset = getPreset(dimension.id);
    const actionSource = CHECKIN_ACTIONS[dimension.id] || [];
    const activePlans = this.data.customPlans.filter((plan) => plan.dimension === dimension.id);
    this.setData({
      activeId: dimension.id,
      active: { ...dimension, preset },
      quickActions: actionSource.slice(0, 3),
      activePlans,
      form: resetForm ? buildDefaultForm(dimension.id) : (this.data.form && this.data.form.primary ? this.data.form : buildDefaultForm(dimension.id))
    });
  },

  selectDimension(event) {
    const id = event.currentTarget.dataset.id;
    this.activateDimension(id, true);
    playTapFeedback();
  },

  buildSummary(dimension, payload = {}) {
    const action = payload.customAction || payload.note || payload.primary || '已完成';
    const metric = payload.metric || '完成';
    return `${action} · ${metric}`;
  },

  inputCustomAction(event) {
    this.setData({ 'form.customAction': event.detail.value });
  },

  inputNote(event) {
    this.setData({ 'form.note': event.detail.value });
  },

  choosePrimary(event) {
    this.setData({ 'form.primary': event.currentTarget.dataset.value });
    playTapFeedback();
  },

  chooseMetric(event) {
    this.setData({ 'form.metric': event.currentTarget.dataset.value });
    playTapFeedback();
  },

  chooseMood(event) {
    this.setData({ 'form.mood': event.currentTarget.dataset.value });
    playTapFeedback();
  },

  chooseEffort(event) {
    this.setData({ 'form.effort': event.currentTarget.dataset.value });
    playTapFeedback();
  },

  useQuickAction(event) {
    const id = event.currentTarget.dataset.id;
    const action = this.data.quickActions.find((item) => item.id === id);
    if (!action) return;
    this.setData({
      form: {
        ...this.data.form,
        ...action.payload,
        customAction: action.title,
        note: action.desc
      }
    });
    playTapFeedback();
  },

  usePlan(event) {
    const id = event.currentTarget.dataset.id;
    const plan = listCustomPlans().find((item) => item.id === id);
    if (!plan) return;
    this.activateDimension(plan.dimension, true);
    this.setData({
      form: {
        ...buildDefaultForm(plan.dimension),
        ...plan.payload
      }
    });
    playTapFeedback();
  },

  deletePlan(event) {
    const id = event.currentTarget.dataset.id;
    const plan = this.data.customPlans.find((item) => item.id === id);
    if (!plan) return;
    wx.showModal({
      title: '删除计划',
      content: `确定删除「${plan.title}」吗？`,
      success: (res) => {
        if (!res.confirm) return;
        deleteCustomPlan(id);
        this.refresh(true);
      }
    });
  },

  saveCurrentPlan() {
    if (!this.data.active) return;
    const title = (this.data.form.customAction || `${this.data.active.name}行动`).trim();
    if (!title) {
      wx.showToast({ title: '先写下你要做什么', icon: 'none' });
      return;
    }
    saveCustomPlan({
      title,
      dimension: this.data.active.id,
      payload: { ...this.data.form }
    });
    this.refresh(true);
    playSound('success');
    wx.showToast({ title: '已保存到我的计划', icon: 'none' });
  },

  enterActionRoom() {
    if (!this.data.active) return;
    const customAction = (this.data.form.customAction || '').trim();
    const payload = {
      ...this.data.form,
      customAction: customAction || `${this.data.form.primary} ${this.data.form.metric}`
    };
    try {
      wx.setStorageSync('star_cabin_pending_action', {
        dimension: this.data.active.id,
        payload,
        createdAt: Date.now()
      });
    } catch (error) {
      console.warn('save pending action failed', error);
    }
    playTapFeedback();
    wx.navigateTo({
      url: `/pages/actionRoom/actionRoom?dimension=${this.data.active.id}`
    });
  },

  submitActive() {
    if (!this.data.active) return;
    const customAction = (this.data.form.customAction || '').trim();
    const payload = {
      ...this.data.form,
      customAction: customAction || `${this.data.form.primary} ${this.data.form.metric}`
    };
    const result = submitCheckin({
      dimension: this.data.active.id,
      date: this.data.date,
      payload
    });
    const dimension = DIMENSION_MAP[this.data.active.id];
    const ecosystemUnlock = result.ecosystemUnlocks[0] || null;
    const achievement = result.unlocked[0] || null;
    const isPerfect = (result.stats.today.completedCount || 0) >= 6;
    const completedCount = result.stats.today.completedCount || 0;
    const nextDimension = DIMENSIONS.find((item) => !(result.stats.today.completedDimensions || []).includes(item.id));
    const rewardModal = {
      dimensionId: dimension.id,
      dimensionName: dimension.name,
      sceneName: dimension.sceneName,
      color: dimension.color,
      actionName: payload.customAction || payload.primary || `${dimension.name}行动`,
      starlight: result.record.starlight,
      totalStarlight: result.profile.totalStarlight,
      starCoins: result.profile.starCoins,
      completedCount,
      chestProgress: Math.min(100, Math.round((completedCount / 6) * 100)),
      chestLabel: isPerfect ? '今日宝箱已开启' : `今日已点亮 ${completedCount}/6`,
      nextDimensionName: nextDimension ? nextDimension.name : '',
      ecosystemUnlockName: ecosystemUnlock ? ecosystemUnlock.name : '',
      ecosystemUnlockType: ecosystemUnlock ? ecosystemUnlock.type : '',
      ecosystemUnlockDesc: ecosystemUnlock ? ecosystemUnlock.desc : '这次行动已经化成星光，继续积累会让生态区出现更多建筑、道路、花园和灯光。',
      achievementName: achievement ? achievement.name : '',
      isPerfect,
      title: ecosystemUnlock ? `解锁：${ecosystemUnlock.name}` : `${dimension.sceneName}获得星光`,
      subtitle: isPerfect
        ? '今天六个生态区全部点亮，完美宝箱已经开启。'
        : `星光已汇入${dimension.sceneName}，还差 ${Math.max(0, 6 - result.stats.today.completedCount)} 类可开启今日宝箱。`
    };

    this.setData({ rewardModal }, () => {
      this.refresh(true);
    });
    playSound(ecosystemUnlock ? 'unlock' : 'success');
  },

  closeRewardModal() {
    this.setData({ rewardModal: null });
  },

  continueNext() {
    const next = this.data.dimensions.find((item) => !item.completed);
    this.setData({ rewardModal: null });
    if (next) {
      this.activateDimension(next.id, true);
    }
  },

  goRewardEcology() {
    if (!this.data.rewardModal) return;
    const dimensionId = this.data.rewardModal.dimensionId;
    this.setData({ rewardModal: null });
    wx.navigateTo({ url: `/pages/ecology/ecology?dimension=${dimensionId}` });
  },

  noop() {
    return false;
  }
});
