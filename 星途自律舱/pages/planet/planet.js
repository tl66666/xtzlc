const { DIMENSIONS, GOAL_PRESETS } = require('../../utils/constants');
const { getProfile, saveProfile, listCheckins, getGoal, saveGoal, getOnboardingSeen, saveOnboardingSeen } = require('../../utils/storage');
const { formatDisplayDate } = require('../../utils/date');
const { buildDashboardStats } = require('../../utils/stats');
const { getGoalPreset, buildGoalProgress, getRecommendedTemplates } = require('../../utils/goals');
const { buildMotivation } = require('../../utils/motivation');
const { buildEcosystemState } = require('../../utils/ecosystem');
const { getAssetBundle } = require('../../utils/assets');
const { resolveCloudAssetURL } = require('../../utils/cloudSync');
const { playSound, playTapFeedback } = require('../../utils/sound');

Page({
  data: {
    profile: {},
    dimensions: DIMENSIONS,
    stats: {
      today: {
        completedCount: 0,
        completedDimensions: []
      }
    },
    levelInfo: {},
    goal: null,
    goalPresets: GOAL_PRESETS,
    goalProgress: null,
    recommendedAction: null,
    motivation: {
      ringDegrees: 0,
      planetMood: {},
      nextAction: {},
      todayQuests: [],
      questDoneCount: 0
    },
    ecosystem: [],
    ecosystemUnlockedTotal: 0,
    showGuide: false,
    showNameSetup: false,
    showTour: false,
    guidePhase: 'ready',
    guideVideoReady: true,
    guideVideoFailed: false,
    guideVideoResolving: false,
    guideVideoBlocked: false,
    planetNameDraft: '',
    assets: getAssetBundle(),
    planetImage: '',
    onboardingVideoUrl: '',
    onboardingFrame: '',
    onboardingFrameIndex: 0,
    todayDisplay: formatDisplayDate(),
    homeHeadStyle: '',
    homeMetaStyle: '',
    goalFocusLabels: [],
    showGoalEditor: false
  },

  onShow() {
    this.setupHomeChrome();
    this.startDateTicker();
    this.refresh();
    const profile = getProfile();
    const needsOnboarding = !getOnboardingSeen();
    const needsName = !profile.planetName || profile.planetName === '未命名星球';
    if (needsOnboarding) {
      this.setData({
        showGuide: true,
        showNameSetup: false,
        showTour: false,
        planetNameDraft: needsName ? '' : profile.planetName
      });
      this.prepareGuideVideo();
      this.syncTabBarVisibility();
    } else if (needsName) {
      this.setData({
        showNameSetup: true,
        showTour: false,
        planetNameDraft: ''
      });
      this.syncTabBarVisibility();
    } else {
      this.syncTabBarVisibility();
    }
  },

  syncTabBarVisibility() {
    const shouldHide = this.data.showGuide || this.data.showNameSetup || this.data.showTour;
    const action = shouldHide ? wx.hideTabBar : wx.showTabBar;
    if (!action) return;
    action({
      animation: false,
      fail() {}
    });
  },

  setupHomeChrome() {
    try {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const capsule = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
      const top = capsule ? capsule.bottom + 10 : (windowInfo.statusBarHeight || 24) + 54;
      const right = capsule ? (windowInfo.windowWidth - capsule.left + 10) : 110;
      this.setData({
        homeHeadStyle: `padding-top:${top}px;padding-right:${right}px;`,
        homeMetaStyle: `padding-right:${right}px;`
      });
    } catch (error) {
      this.setData({
        homeHeadStyle: 'padding-top:72px;padding-right:110px;',
        homeMetaStyle: 'padding-right:110px;'
      });
    }
  },

  startDateTicker() {
    clearInterval(this.dateTicker);
    this.setData({
      todayDisplay: formatDisplayDate()
    });
    this.dateTicker = setInterval(() => {
      this.setData({
        todayDisplay: formatDisplayDate()
      });
    }, 60000);
  },

  prepareGuideVideo() {
    if (this.data.guideVideoResolving || this.data.guideVideoBlocked || this.data.onboardingVideoUrl) return;
    const source = this.data.assets.onboardingIgnite;
    if (!source) {
      this.setData({
        onboardingVideoUrl: '',
        guideVideoFailed: true
      });
      return;
    }
    this.setData({
      onboardingVideoUrl: '',
      guideVideoResolving: true,
      guideVideoFailed: false
    });
    resolveCloudAssetURL('onboardingIgnite', source).then((url) => {
      const playable = /^https?:\/\//.test(url || '') || /^wxfile:\/\//.test(url || '');
      this.setData({
        onboardingVideoUrl: playable ? url : '',
        guideVideoResolving: false,
        guideVideoFailed: !playable,
        guideVideoBlocked: !playable
      });
      if (!playable) {
        console.warn('onboarding video url is not playable, check cloud storage read permission', url);
      }
    }).catch((error) => {
      console.warn('onboarding video resolve failed', error);
      this.setData({
        onboardingVideoUrl: '',
        guideVideoResolving: false,
        guideVideoFailed: true,
        guideVideoBlocked: true
      });
    });
  },

  onGuideVideoReady() {
    this.setData({
      guideVideoReady: true,
      guideVideoFailed: false
    });
  },

  onGuideVideoError(event) {
    console.error('onboarding video error', event && event.detail ? event.detail : event);
    this.setData({
      guideVideoReady: false,
      guideVideoFailed: true
    });
    clearTimeout(this.guideFallbackTimer);
    this.guideFallbackTimer = setTimeout(() => {
      this.finishGuideVideo();
    }, 1600);
  },

  refresh() {
    const profile = getProfile();
    const records = listCheckins();
    const stats = buildDashboardStats(records);
    const savedGoal = getGoal();
    const goal = savedGoal ? getGoalPreset(savedGoal.id) : null;
    const goalProgress = goal ? buildGoalProgress(goal.id, stats.today.completedDimensions) : null;
    const recommendedAction = goal ? getRecommendedTemplates(goal.id).find((template) => !stats.today.completedDimensions.includes(template.dimension)) : null;
    const goalFocusLabels = goal ? goal.focusDimensions.map((id) => {
      const dimension = DIMENSIONS.find((item) => item.id === id);
      return dimension ? dimension.name : id;
    }) : [];
    const motivation = buildMotivation(goal, stats.today.completedDimensions);
    const ecosystem = buildEcosystemState(records);
    const assets = getAssetBundle();
    const planetImage = profile.totalStarlight > 0 || !assets.planetEmpty
      ? assets.planetOverview
      : assets.planetEmpty;
    this.setData({
      assets,
      todayDisplay: formatDisplayDate(),
      profile,
      stats,
      levelInfo: profile.levelInfo,
      goal,
      goalProgress,
      goalFocusLabels,
      recommendedAction,
      motivation,
      ecosystem,
      planetImage,
      ecosystemUnlockedTotal: ecosystem.reduce((sum, item) => sum + item.unlockedCount, 0),
      dimensions: DIMENSIONS.map((item) => ({
        ...item,
        completed: stats.today.completedDimensions.includes(item.id)
      }))
    });
  },

  openCheckin(event) {
    wx.switchTab({
      url: '/pages/checkin/checkin'
    });
  },

  openEcology(event) {
    const dimension = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/ecology/ecology?dimension=${dimension}`
    });
  },

  openEcologyHub() {
    wx.navigateTo({
      url: '/pages/ecologyHub/ecologyHub'
    });
  },

  openNextAction() {
    wx.switchTab({
      url: '/pages/checkin/checkin'
    });
  },

  renamePlanet() {
    wx.showModal({
      title: '星球命名',
      content: '第一版先使用默认星球名。后面接入弹窗输入后，可以在这里改名。',
      showCancel: false
    });
  },

  handlePlanetTap() {
    this.openEcologyHub();
  },

  chooseGoal(event) {
    saveGoal(event.currentTarget.dataset.id);
    this.refresh();
    this.setData({
      showGoalEditor: false
    });
    wx.showToast({
      title: '目标已设定',
      icon: 'none'
    });
  },

  openGoalEditor() {
    this.setData({
      showGoalEditor: true
    });
  },

  closeGoalEditor() {
    this.setData({
      showGoalEditor: false
    });
  },

  noop() {},

  closeGuide() {
    if (this.data.guidePhase === 'playing') return;
    if (!this.data.onboardingVideoUrl) {
      this.prepareGuideVideo();
    }
    playTapFeedback('heavy');
    this.setData({
      guidePhase: 'playing',
      guideVideoReady: false,
      guideVideoFailed: this.data.guideVideoBlocked
    });
    clearTimeout(this.guideFallbackTimer);
    this.guideFallbackTimer = setTimeout(() => {
      this.finishGuideVideo();
    }, 11000);
  },

  finishGuideVideo() {
    if (!this.data.showGuide) return;
    clearTimeout(this.guideFallbackTimer);
    playSound('unlock');
    this.setData({
      showGuide: false,
      showNameSetup: true,
      guidePhase: 'ready',
      guideVideoReady: true
    });
    this.syncTabBarVisibility();
  },

  onHide() {
    clearTimeout(this.guideFallbackTimer);
    clearInterval(this.dateTicker);
  },

  onUnload() {
    clearTimeout(this.guideFallbackTimer);
    clearInterval(this.dateTicker);
  },

  onGuideVideoEnded() {
    this.finishGuideVideo();
  },

  inputPlanetName(event) {
    this.setData({
      planetNameDraft: event.detail.value
    });
  },

  savePlanetNameAndTour() {
    const name = (this.data.planetNameDraft || '').trim() || '晨光自律星';
    saveProfile({
      ...getProfile(),
      planetName: name
    });
    this.refresh();
    this.setData({
      showNameSetup: false,
      showTour: true
    });
    this.syncTabBarVisibility();
    playSound('success');
  },

  finishTour() {
    saveOnboardingSeen();
    this.setData({
      showTour: false
    });
    this.syncTabBarVisibility();
  }
});
