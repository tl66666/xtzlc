const { getProfile, saveProfile, listCheckins, listAchievements, getReminder, saveReminder, resetOnboardingSeen } = require('../../utils/storage');
const { getAssetBundle } = require('../../utils/assets');
const { getCloudStatus, syncDashboardFromCloud, exportCloudData } = require('../../utils/cloudSync');

Page({
  data: {
    profile: {},
    assets: getAssetBundle(),
    totalCheckins: 0,
    achievementCount: 0,
    cloudStatus: getCloudStatus(),
    reminder: getReminder()
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({
      profile: getProfile(),
      totalCheckins: listCheckins().length,
      achievementCount: listAchievements().length,
      cloudStatus: getCloudStatus(),
      reminder: getReminder()
    });
  },

  editNickname() {
    wx.showModal({
      title: '编辑旅人名',
      editable: true,
      placeholderText: '例如：唐乐',
      content: this.data.profile.nickname || '',
      success: (res) => {
        if (!res.confirm || !res.content.trim()) return;
        saveProfile({
          ...getProfile(),
          nickname: res.content.trim()
        });
        this.refresh();
      }
    });
  },

  editPlanetName() {
    wx.showModal({
      title: '命名你的星球',
      editable: true,
      placeholderText: '例如：晨光自律星',
      content: this.data.profile.planetName || '',
      success: (res) => {
        if (!res.confirm || !res.content.trim()) return;
        saveProfile({
          ...getProfile(),
          planetName: res.content.trim()
        });
        this.refresh();
      }
    });
  },

  toggleReminder() {
    const next = saveReminder({
      enabled: !this.data.reminder.enabled
    });
    this.setData({ reminder: next });
    wx.showToast({
      title: next.enabled ? '提醒计划已开启' : '提醒计划已关闭',
      icon: 'none'
    });
  },

  bindReminderTime(event) {
    const next = saveReminder({
      enabled: true,
      time: event.detail.value
    });
    this.setData({ reminder: next });
  },

  editReminderMessage() {
    wx.showModal({
      title: '提醒文案',
      editable: true,
      placeholderText: '例如：今晚给星球补一束光',
      content: this.data.reminder.message || '',
      success: (res) => {
        if (!res.confirm || !res.content.trim()) return;
        const next = saveReminder({
          message: res.content.trim()
        });
        this.setData({ reminder: next });
      }
    });
  },

  requestReminderGuide() {
    wx.showModal({
      title: '打卡提醒说明',
      content: '当前已保存提醒计划。微信真正的系统通知需要在公众平台申请订阅消息模板 ID，后续填入模板 ID 后即可接入每日提醒。',
      showCancel: false
    });
  },

  replayIntro() {
    resetOnboardingSeen();
    wx.switchTab({
      url: '/pages/planet/planet'
    });
  },

  openAchievements() {
    wx.navigateTo({
      url: '/pages/achievements/achievements'
    });
  },

  exportData() {
    const payload = {
      profile: getProfile(),
      checkins: listCheckins(),
      achievements: listAchievements()
    };
    wx.setClipboardData({
      data: JSON.stringify(payload, null, 2),
      success: () => {
        wx.showToast({
          title: '数据已复制',
          icon: 'none'
        });
      }
    });
  },

  syncCloud() {
    wx.showLoading({ title: '同步中' });
    syncDashboardFromCloud().then((result) => {
      wx.hideLoading();
      this.refresh();
      wx.showToast({
        title: result ? '云端同步完成' : '暂未同步成功',
        icon: 'none'
      });
    });
  },

  exportCloud() {
    exportCloudData().then((result) => {
      if (!result) {
        wx.showToast({
          title: '云端导出失败',
          icon: 'none'
        });
        return;
      }
      wx.setClipboardData({
        data: JSON.stringify(result, null, 2),
        success: () => {
          wx.showToast({
            title: '云端数据已复制',
            icon: 'none'
          });
        }
      });
    });
  },

  showCloudGuide() {
    wx.showModal({
      title: '云开发接入',
      content: '当前版本已接入云端同步。请在微信开发者工具里创建数据库集合，并上传 login、submitCheckin、getDashboard、exportData 四个云函数。',
      showCancel: false
    });
  },

  showAbout() {
    wx.showModal({
      title: '星途自律舱',
      content: '一个以成长星球为核心视觉反馈的自律打卡微信小程序。完成运动、饮食、学习、工作、计划、睡眠打卡后，星球会逐步从荒芜变得繁荣。',
      showCancel: false
    });
  }
});
