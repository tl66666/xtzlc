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
    reminderEnabled: true,
    reminderTime: '19:30',
    repeat: '每天'
  };
}

function planSummary(plan) {
  const payload = plan.payload || {};
  const action = payload.customAction || payload.primary || plan.title || '行动';
  const metric = payload.metric || DEFAULT_METRIC[plan.dimension] || '完成';
  return `${action} · ${metric}`;
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
      nextTitle: '先建立一个计划',
      nextSubtitle: '把今天真正要做的事保存下来，再进入行动舱执行。'
    },
    draft: createDraft(),
    result: null
  },

  onLoad(options = {}) {
    if (options.mode === 'new') {
      this.setData({ mode: 'editor', draft: createDraft(options) });
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
    const plans = listCustomPlans().map((plan) => {
      const dimension = DIMENSION_MAP[plan.dimension] || DIMENSION_MAP.study;
      const log = logs[plan.id];
      return {
        ...plan,
        dimensionName: dimension.name,
        sceneName: dimension.sceneName,
        color: dimension.color,
        icon: dimension.icon,
        summary: planSummary(plan),
        reminderText: plan.reminderEnabled === false ? '未开启提醒' : `${plan.reminderTime || '19:30'} 开始`,
        doneToday: !!log,
        doneAt: log ? log.completedAt : ''
      };
    });
    const next = plans.find((item) => !item.doneToday) || plans[0] || null;
    this.setData({
      date: today,
      dateDisplay: formatDisplayDate(),
      plans,
      summary: {
        total: plans.length,
        done: plans.filter((item) => item.doneToday).length,
        nextTitle: next ? next.title : '先建立一个计划',
        nextSubtitle: next ? `${next.reminderText} · ${next.dimensionName}` : '把今天真正要做的事保存下来，再进入行动舱执行。'
      }
    });
  },

  createPlan() {
    playTapFeedback();
    this.setData({ mode: 'editor', draft: createDraft({ dimension: 'study' }), result: null });
  },

  openEditor(event) {
    const id = event.currentTarget.dataset.id;
    this.openEditorById(id);
  },

  openEditorById(id) {
    const plan = listCustomPlans().find((item) => item.id === id);
    if (!plan) {
      this.refresh();
      return;
    }
    const payload = plan.payload || {};
    this.setData({
      mode: 'editor',
      result: null,
      draft: {
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
      }
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
      'draft.mood': this.data.draft.mood || DEFAULT_MOOD[id] || ''
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
    saveCustomPlan({
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
    wx.showToast({ title: '计划已保存', icon: 'success' });
    this.setData({ mode: 'list', result: null });
    this.refresh();
  },

  removePlan(event) {
    const id = event.currentTarget.dataset.id || this.data.draft.id;
    if (!id) return;
    const plan = listCustomPlans().find((item) => item.id === id);
    wx.showModal({
      title: '删除计划',
      content: `确定删除「${plan ? plan.title : '这个计划'}」吗？`,
      success: (res) => {
        if (!res.confirm) return;
        deleteCustomPlan(id);
        this.setData({ mode: 'list', result: null });
        this.refresh();
      }
    });
  },

  startActionRoom(event) {
    const id = event.currentTarget.dataset.id;
    const plan = listCustomPlans().find((item) => item.id === id);
    if (!plan) return;
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
        dimension: (DIMENSION_MAP[plan.dimension] || {}).name || '计划'
      }
    });
    this.refresh();
    playSound(unlock ? 'unlock' : 'success');
  },

  closeResult() {
    this.setData({ result: null });
  },

  goCheckin() {
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  noop() {
    return false;
  }
});
