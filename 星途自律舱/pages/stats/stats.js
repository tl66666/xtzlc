const { DIMENSIONS } = require('../../utils/constants');
const { listCheckins, getProfile } = require('../../utils/storage');
const { buildDashboardStats } = require('../../utils/stats');
const { getAssetBundle } = require('../../utils/assets');

Page({
  data: {
    stats: {},
    profile: {},
    assets: getAssetBundle(),
    dimensionBars: [],
    maxDimensionCount: 1
  },

  onShow() {
    const records = listCheckins();
    const stats = buildDashboardStats(records);
    const maxDimensionCount = Math.max(...Object.values(stats.dimensionCounts), 1);
    this.setData({
      stats,
      profile: getProfile(),
      maxDimensionCount,
      dimensionBars: DIMENSIONS.map((dimension) => ({
        ...dimension,
        count: stats.dimensionCounts[dimension.id] || 0,
        percent: Math.round(((stats.dimensionCounts[dimension.id] || 0) / maxDimensionCount) * 100)
      }))
    });
  }
});
