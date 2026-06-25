const { DIMENSIONS, DIMENSION_MAP } = require('../../utils/constants');
const { formatDate } = require('../../utils/date');
const { submitCheckin, getProfile } = require('../../utils/storage');
const { getAssetBundle } = require('../../utils/assets');
const { playSound, playTapFeedback } = require('../../utils/sound');

const ROOM_CONFIG = {
  study: {
    roomName: '星窗自习室',
    actionVerb: '开始自习',
    finishVerb: '交卷结算',
    guide: '把手机放远一点，选一个小目标，先专注 25 分钟。',
    focusLabels: ['刷题', '阅读', '背诵', '写代码']
  },
  work: {
    roomName: '轨道工作台',
    actionVerb: '开始推进',
    finishVerb: '提交进度',
    guide: '只推进一个具体任务，结束时写下产出。',
    focusLabels: ['开发', '文档', '调研', '复盘']
  },
  sport: {
    roomName: '低重力训练场',
    actionVerb: '开始训练',
    finishVerb: '记录训练',
    guide: '先热身，再完成一个可以坚持的运动单元。',
    focusLabels: ['拉伸', '跑步', '力量', '散步']
  },
  diet: {
    roomName: '星球餐桌',
    actionVerb: '开始记录',
    finishVerb: '保存餐盘',
    guide: '记录真实饮食，不追求完美，先让饮食花园有迹可循。',
    focusLabels: ['饮水', '早餐', '正餐', '少糖']
  },
  plan: {
    roomName: '灯塔规划室',
    actionVerb: '开始规划',
    finishVerb: '锁定航线',
    guide: '写下今天最重要的一件事，再拆成下一步。',
    focusLabels: ['日计划', '周计划', '复盘', '拆任务']
  },
  sleep: {
    roomName: '月光安眠舱',
    actionVerb: '开始降噪',
    finishVerb: '记录作息',
    guide: '睡前少一点刺激，让星球进入夜间恢复模式。',
    focusLabels: ['放下手机', '拉伸', '冥想', '早睡']
  }
};

function pad(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${pad(minutes)}:${pad(rest)}`;
}

function durationText(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
}

Page({
  data: {
    dimension: null,
    room: ROOM_CONFIG.study,
    payload: {},
    actionTitle: '',
    sceneImage: '',
    assets: getAssetBundle(),
    timerText: '00:00',
    elapsedSeconds: 0,
    running: false,
    outcome: '',
    result: null,
    profile: getProfile()
  },

  onLoad(options) {
    const dimensionId = options.dimension || 'study';
    const dimension = DIMENSION_MAP[dimensionId] || DIMENSION_MAP.study;
    const room = ROOM_CONFIG[dimension.id] || ROOM_CONFIG.study;
    let pending = null;
    try {
      pending = wx.getStorageSync('star_cabin_pending_action');
    } catch (error) {
      pending = null;
    }
    const payload = pending && pending.dimension === dimension.id ? (pending.payload || {}) : {};
    const actionTitle = payload.customAction || payload.note || `${dimension.name}行动`;
    wx.setNavigationBarTitle({ title: room.roomName });
    this.setData({
      dimension,
      room,
      payload,
      actionTitle,
      outcome: payload.note || '',
      sceneImage: dimension.sceneImage,
      profile: getProfile()
    });
  },

  onUnload() {
    this.stopTicker();
  },

  stopTicker() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  startFocus() {
    if (this.data.running) return;
    playTapFeedback();
    this.setData({ running: true });
    this.stopTicker();
    this.timer = setInterval(() => {
      const next = this.data.elapsedSeconds + 1;
      this.setData({
        elapsedSeconds: next,
        timerText: formatTimer(next)
      });
    }, 1000);
  },

  pauseFocus() {
    this.stopTicker();
    this.setData({ running: false });
    playTapFeedback();
  },

  resetFocus() {
    this.stopTicker();
    this.setData({
      running: false,
      elapsedSeconds: 0,
      timerText: '00:00'
    });
  },

  chooseFocusLabel(event) {
    const value = event.currentTarget.dataset.value;
    this.setData({
      actionTitle: value,
      payload: {
        ...this.data.payload,
        customAction: value,
        primary: value
      }
    });
    playTapFeedback();
  },

  inputOutcome(event) {
    this.setData({ outcome: event.detail.value });
  },

  finishAction() {
    const dimension = this.data.dimension;
    if (!dimension) return;
    this.stopTicker();
    const seconds = this.data.elapsedSeconds || 60;
    const metric = durationText(seconds);
    const outcome = (this.data.outcome || '').trim();
    const payload = {
      ...this.data.payload,
      primary: this.data.payload.primary || this.data.actionTitle || dimension.name,
      customAction: this.data.actionTitle || this.data.payload.customAction || `${dimension.name}行动`,
      metric,
      focusSeconds: seconds,
      note: outcome || this.data.payload.note || this.data.room.guide
    };
    const result = submitCheckin({
      dimension: dimension.id,
      date: formatDate(),
      payload
    });
    const unlock = result.ecosystemUnlocks[0] || null;
    const achievement = result.unlocked[0] || null;
    const completedCount = result.stats.today.completedCount || 0;
    const nextDimension = DIMENSIONS.find((item) => !(result.stats.today.completedDimensions || []).includes(item.id));
    this.setData({
      running: false,
      payload,
      result: {
        actionName: payload.customAction || payload.primary || this.data.actionTitle,
        starlight: result.record.starlight,
        totalStarlight: result.profile.totalStarlight,
        starCoins: result.profile.starCoins,
        unlockName: unlock ? unlock.name : '',
        unlockDesc: unlock ? unlock.desc : '本次行动已被记录，生态区进度已经推进。',
        achievementName: achievement ? achievement.name : '',
        completedCount,
        chestProgress: Math.min(100, Math.round((completedCount / 6) * 100)),
        chestLabel: completedCount >= 6 ? '今日宝箱已开启' : `今日已点亮 ${completedCount}/6`,
        nextDimensionName: nextDimension ? nextDimension.name : ''
      },
      profile: result.profile
    });
    playSound(unlock ? 'unlock' : 'success');
  },

  closeResult() {
    this.setData({ result: null });
  },

  goEcology() {
    const id = this.data.dimension ? this.data.dimension.id : 'study';
    wx.redirectTo({ url: `/pages/ecology/ecology?dimension=${id}` });
  },

  goCheckin() {
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  noop() {
    return false;
  }
});
