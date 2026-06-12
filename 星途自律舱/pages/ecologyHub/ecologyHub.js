const { DIMENSIONS } = require('../../utils/constants');
const { listCheckins, getProfile } = require('../../utils/storage');
const { buildDashboardStats } = require('../../utils/stats');
const { getAssetBundle } = require('../../utils/assets');

Page({
  data: {
    profile: {},
    dimensions: [],
    completedCount: 0,
    assets: getAssetBundle()
  },

  onShow() {
    const assets = getAssetBundle();
    const records = listCheckins();
    const stats = buildDashboardStats(records);
    const completed = new Set(stats.today.completedDimensions);
    this.setData({
      assets,
      profile: getProfile(),
      completedCount: stats.today.completedCount,
      dimensions: DIMENSIONS.map((item) => ({
        ...item,
        imageFailed: false,
        completed: completed.has(item.id),
        totalCount: records.filter((record) => record.dimension === item.id).length,
        displayImage: records.some((record) => record.dimension === item.id) || !assets.ecologyEmpty
          ? item.hubImage
          : assets.ecologyEmpty,
        statusText: records.some((record) => record.dimension === item.id) ? (completed.has(item.id) ? '今日已亮' : '继续建设') : '待开拓'
      }))
    });
  },

  onZoneImageLoad(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({
      dimensions: this.data.dimensions.map((item) => (
        item.id === id ? { ...item, imageFailed: false } : item
      ))
    });
  },

  onZoneImageError(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({
      dimensions: this.data.dimensions.map((item) => (
        item.id === id ? { ...item, imageFailed: true } : item
      ))
    });
  },

  openEcology(event) {
    wx.navigateTo({
      url: `/pages/ecology/ecology?dimension=${event.currentTarget.dataset.id}`
    });
  },

  goCheckin() {
    wx.switchTab({
      url: '/pages/checkin/checkin'
    });
  }
});
