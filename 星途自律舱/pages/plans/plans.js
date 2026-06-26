const { DIMENSIONS, DIMENSION_MAP } = require('../../utils/constants');
const { formatDate, formatDisplayDate } = require('../../utils/date');
const {
  listCustomPlans,
  saveCustomPlan,
  deleteCustomPlan,
  getPlanLogMap,
  markPlanCompletion,
  submitCheckin
} = require('../../utils/storage');
const { getAssetBundle } = require('../../utils/assets');
const { playSound, playTapFeedback } = require('../../utils/sound');

const DEFAULT_METRIC = {
  sport: '30 分钟',
  diet: '5 星',
  study: '60 分钟',
  work: '1 小时',
  plan: '3/3 项',
  sleep: '7 小时'
};

const DEFAULT_MOOD = {
  sport: '适中',
  diet: '很健康',
  study: '非常专注',
  work: '已完成',
  plan: '按计划完成',
  sleep: '不错'
};

const PLACEHOLDER_ACTION = {
  sport: '例如：跑步 3 公里 / 拉伸 20 分钟',
  diet: '例如：喝水 8 杯 / 记录三餐',
  study: '例如：刷算法题 2 道 / 背单词 30 个',
  work: '例如：完成登录页 / 整理项目文档',
  plan: '例如：写今日三件事 / 晚间复盘',
  sleep: '例如：23:30 前放下手机 / 睡前拉伸'
};

function decodeOption(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function createDraft(options = {}) {
  const dimension = options.dimension || 'study';
  const action = decodeOption(options.action || options.title || '');
  return {
    id: decodeOption(options.id || ''),
    title: decodeOption(options.title || action || ''),
    dimension,
    action,
    metric: decodeOption(options.metric || DEFAULT_METRIC[dimension] || '30 分钟'),
    mood: decodeOption(options.mood || DEFAULT_MOOD[dimension] || '已完成'),
    note: decodeOption(options.note || ''),
    reminderEnabled: options.reminderEnabled !== 'false',
    reminderTime: decodeOption(options.reminderTime || '19:30'),
    repeat: '每天'
  };
}

function buildPlanSummary(plan) {
  const payload = plan.payload || {};
  const action = payload.customAction || payload.primary || plan.title || '行动';
  const metric = payload.metric || DEFAULT_METRIC[plan.dimension] || '完成';
  return `${action} · ${metric}`;
}

function sortPlans(a, b) {
  const aDone = a.doneToday ? 1 : 0;
  const bDone = b.doneToday ? 1 : 0;
  if (aDone !== bDone) return aDone - bDone;
  const aTime = a.reminderEnabled === false ? '99:99' : (a.reminderTime || '19:30');
  const bTime = b.reminderEnabled === false ? '99:99' : (b.reminderTime || '19:30');
  if (aTime !== bTime) return aTime.localeCompare(bTime);
  return (b.updatedAt || '').localeCompare(a.updatedAt || '');
}

function decoratePlan(plan, logs) {
  const dimension = DIMENSION_MAP[plan.dimension] || DIMENSION_MAP.study;
  const log = logs[plan.id];
  const reminderText = plan.reminderEnabled === false ? '未开启提醒' : `${plan.reminderTime || '19:30'} 提醒`;
  return {
    ...plan,
    dimensionName: dimension.name,
    sceneName: dimension.sceneName,
    color: dimension.color,
    icon: dimension.icon,
    summary: buildPlanSummary(plan),
    reminderText,
    reminderTimeText: plan.reminderEnabled === false ? '--:--' : (plan.reminderTime || '19:30'),
    doneToday: !!log,
    doneAt: log ? log.completedAt : '',
    statusText: log ? '今日已完成' : '等待执行'
  };
}

Page({
  data: {
    mode: 'list',
    date: formatDate(),
    dateDisplay: formatDisplayDate(),
    assets: getAssetBundle(),
    dimensions: DIMENSIONS,
    plans: [],
    summary: {
      total: 0,
      done: 0,
      undone: 0,
      percent: 0,
      next: null,
      nextTitle: '先建立一个计划',
      nextSubtitle: '把今天真正要做的事保存下来，再进入行动舱执行。',
      reminderLine: '暂无提醒'
    },
    draft: createDraft(),
    actionPlaceholder: PLACEHOLDER_ACTION.study,
    result: null
  },

  onLoad(options = {}) {
    if (options.mode === 'new') {
      const draft = createDraft(options);
      this.setData({
        mode: 'editor',
        draft,
        actionPlaceholder: PLACEHOLDER_ACTION[draft.dimension] || PLACEHOLDER_ACTION.study
      });
      return;
    }
    if (options.mode === 'edit' && options.id) {
      this.openEditorById(options.id);
      return;
    }
    this.refresh();
  },

  onShow() {
    if (this.data.mode === 'list') {
      this.refresh();
    }
  },

  refresh() {
    const today = formatDate();
    const logs = getPlanLogMap(today);
    const plans = listCustomPlans()
      .map((plan) => decoratePlan(plan, logs))
      .sort(sortPlans);
    const done = plans.filter((item) => item.doneToday).length;
    const next = plans.find((item) => !item.doneToday) || null;
    const reminder = next || plans.find((item) => item.reminderEnabled !== false) || null;
    this.setData({
      date: today,
      dateDisplay: formatDisplayDate(),
      plans,
      summary: {
        total: plans.length,
        done,
        undone: Math.max(0, plans.length - done),
        percent: plans.length ? Math.round((done / plans.length) * 100) : 0,
        next,
        nextTitle: next ? next.title : (plans.length ? '今日计划已清空' : '先建立一个计划'),
        nextSubtitle: next ? `${next.reminderText} · ${next.dimensionName}` : (plans.length ? '今天的计划都已记录，可以去看看星球变化。' : '把今天真正要做的事保存下来，再进入行动舱执行。'),
        reminderLine: reminder ? `${reminder.reminderTimeText} · ${reminder.title}` : '暂无提醒'
      }
    });
  },

  createPlan() {
    playTapFeedback();
    const draft = createDraft({ dimension: 'study' });
    this.setData({
      mode: 'editor',
      draft,
      actionPlaceholder: PLACEHOLDER_ACTION[draft.dimension],
      result: null
    });
  },

  openEditor(event) {
    this.openEditorById(event.currentTarget.dataset.id);
  },

  openEditorById(id) {
    const plan = listCustomPlans().find((item) => item.id === id);
    if (!plan) {
      this.refresh();
      return;
    }
    const payload = plan.payload || {};
    const draft = {
      id: plan.id,
      title: plan.title || '',
      dimension: plan.dimension || 'study',
      action: payload.customAction || payload.primary || '',
      metric: payload.metric || DEFAULT_METRIC[plan.dimension] || '',
      mood: payload.mood || DEFAULT_MOOD[plan.dimension] || '',
      note: payload.note || '',
      reminderEnabled: plan.reminderEnabled !== false,
      reminderTime: plan.reminderTime || '19:30',
      repeat: plan.repeat || '每天'
    };
    this.setData({
      mode: 'editor',
      result: null,
      draft,
      actionPlaceholder: PLACEHOLDER_ACTION[draft.dimension] || PLACEHOLDER_ACTION.study
    });
  },

  backToList() {
    this.setData({ mode: 'list', result: null });
    this.refresh();
  },

  inputTitle(event) {
    this.setData({ 'draft.title': event.detail.value });
  },

  inputAction(event) {
    this.setData({ 'draft.action': event.detail.value });
  },

  inputMetric(event) {
    this.setData({ 'draft.metric': event.detail.value });
  },

  inputNote(event) {
    this.setData({ 'draft.note': event.detail.value });
  },

  selectDimension(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({
      'draft.dimension': id,
      'draft.metric': this.data.draft.metric || DEFAULT_METRIC[id] || '',
      'draft.mood': this.data.draft.mood || DEFAULT_MOOD[id] || '',
      actionPlaceholder: PLACEHOLDER_ACTION[id] || PLACEHOLDER_ACTION.study
    });
    playTapFeedback();
  },

  changeTime(event) {
    this.setData({ 'draft.reminderTime': event.detail.value });
  },

  toggleReminder(event) {
    this.setData({ 'draft.reminderEnabled': event.detail.value });
  },

  saveDraft() {
    const draft = this.data.draft;
    const title = (draft.title || '').trim();
    const action = (draft.action || title || '').trim();
    if (!title || !action) {
      wx.showToast({ title: '先写计划名称和行动内容', icon: 'none' });
      return;
    }
    const dimension = DIMENSION_MAP[draft.dimension] || DIMENSION_MAP.study;
    const plan = saveCustomPlan({
      id: draft.id,
      title,
      dimension: dimension.id,
      reminderEnabled: draft.reminderEnabled,
      reminderTime: draft.reminderTime,
      repeat: draft.repeat || '每天',
      payload: {
        primary: action,
        customAction: action,
        metric: draft.metric || DEFAULT_METRIC[dimension.id] || '完成',
        mood: draft.mood || DEFAULT_MOOD[dimension.id] || '已完成',
        note: draft.note || `${dimension.sceneName}每日计划`
      }
    });
    playSound('success');
    this.setData({
      mode: 'list',
      result: {
        saved: true,
        title: draft.id ? '计划已更新' : '计划已保存',
        subtitle: plan.reminderEnabled ? `${plan.reminderTime} 会在计划中心提醒你执行` : '已放入今日计划中心',
        starlight: 0,
        completedCount: this.data.summary.done || 0,
        achievementName: '',
        primaryText: '进入行动舱',
        planId: plan.id
      }
    });
    this.refresh();
  },

  removePlan(event) {
    const id = event.currentTarget.dataset.id || this.data.draft.id;
    if (!id) return;
    const plan = listCustomPlans().find((item) => item.id === id);
    wx.showModal({
      title: '删除计划',
      content: `确定删除「${plan ? plan.title : '这个计划'}」吗？删除后不会影响已经产生的打卡星光。`,
      success: (res) => {
        if (!res.confirm) return;
        deleteCustomPlan(id);
        playTapFeedback();
        this.setData({ mode: 'list', result: null });
        this.refresh();
        wx.showToast({ title: '计划已删除', icon: 'none' });
      }
    });
  },

  startNextActionRoom() {
    const next = this.data.summary.next;
    if (!next) {
      this.createPlan();
      return;
    }
    this.launchPlanAction(next);
  },

  startActionRoom(event) {
    const id = event.currentTarget.dataset.id;
    const plan = listCustomPlans().find((item) => item.id === id);
    if (!plan) return;
    this.launchPlanAction(plan);
  },

  launchPlanAction(plan) {
    try {
      wx.setStorageSync('star_cabin_pending_action', {
        dimension: plan.dimension,
        payload: {
          ...(plan.payload || {}),
          planId: plan.id,
          customAction: plan.title || ((plan.payload || {}).customAction)
        },
        createdAt: Date.now()
      });
    } catch (error) {
      console.warn('save pending plan action failed', error);
    }
    playTapFeedback();
    wx.navigateTo({ url: `/pages/actionRoom/actionRoom?dimension=${plan.dimension}` });
  },

  completeToday(event) {
    const id = event.currentTarget.dataset.id;
    const plan = listCustomPlans().find((item) => item.id === id);
    if (!plan) return;
    if (this.data.plans.find((item) => item.id === id && item.doneToday)) {
      wx.showToast({ title: '这个计划今天已经完成', icon: 'none' });
      return;
    }
    const payload = {
      ...(plan.payload || {}),
      planId: plan.id,
      customAction: plan.title || ((plan.payload || {}).customAction),
      note: ((plan.payload || {}).note) || '按计划完成'
    };
    const result = submitCheckin({
      dimension: plan.dimension,
      date: this.data.date,
      payload
    });
    markPlanCompletion(plan.id, this.data.date, {
      checkinId: result.record.id,
      dimension: plan.dimension,
      title: plan.title
    });
    const unlock = result.ecosystemUnlocks[0] || null;
    const achievement = result.unlocked[0] || null;
    this.setData({
      result: {
        title: `${plan.title} 已完成`,
        subtitle: unlock ? `解锁生态：${unlock.name}` : '已记录到今天的成长星球',
        starlight: result.record.starlight,
        completedCount: result.stats.today.completedCount || 0,
        achievementName: achievement ? achievement.name : '',
        primaryText: '查看生态变化',
        dimensionId: plan.dimension
      }
    });
    this.refresh();
    playSound(unlock ? 'unlock' : 'success');
  },

  closeResult() {
    this.setData({ result: null });
  },

  handleResultPrimary() {
    const result = this.data.result || {};
    if (result.saved && result.planId) {
      const plan = listCustomPlans().find((item) => item.id === result.planId);
      if (plan) {
        this.setData({ result: null });
        this.launchPlanAction(plan);
      }
      return;
    }
    if (result.dimensionId) {
      wx.navigateTo({ url: `/pages/ecology/ecology?dimension=${result.dimensionId}` });
      this.setData({ result: null });
      return;
    }
    this.closeResult();
  },

  goCheckin() {
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  noop() {
    return false;
  }
});
