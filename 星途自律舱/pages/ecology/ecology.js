const { DIMENSION_MAP, CHECKIN_TEMPLATES } = require('../../utils/constants');
const { listCheckins, getProfile } = require('../../utils/storage');
const { buildDashboardStats } = require('../../utils/stats');
const { getUnlockedParts, getNextUnlock } = require('../../utils/ecosystem');
const { getAssetBundle } = require('../../utils/assets');

function buildRecords(records, dimensionId) {
  return records
    .filter((item) => item.dimension === dimensionId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((item) => ({
      ...item,
      summary: item.dimension === 'plan'
        ? `${item.payload.metric || '已记录'} · ${item.payload.mood || '继续推进'}`
        : `${item.payload.primary || '已记录'} · ${item.payload.metric || '完成'}`
    }));
}

function getGrowthStage(totalCount) {
  if (totalCount >= 20) {
    return { name: '繁荣生态', nextNeed: 0, nextText: '已满级', progress: 100, desc: '建筑灯光稳定亮起，生态区已经形成自己的节奏。' };
  }
  if (totalCount >= 10) {
    const nextNeed = 20 - totalCount;
    return { name: '稳定社区', nextNeed, nextText: `还差 ${nextNeed} 次`, progress: Math.round((totalCount / 20) * 100), desc: '道路和花园开始成形，再坚持一段时间会升级为繁荣生态。' };
  }
  if (totalCount >= 3) {
    const nextNeed = 10 - totalCount;
    return { name: '萌芽营地', nextNeed, nextText: `还差 ${nextNeed} 次`, progress: Math.round((totalCount / 10) * 100), desc: '第一批建筑已经出现，连续记录会让这里更完整。' };
  }
  if (totalCount >= 1) {
    const nextNeed = 3 - totalCount;
    return { name: '初光据点', nextNeed, nextText: `还差 ${nextNeed} 次`, progress: Math.round((totalCount / 3) * 100), desc: '这里刚刚被点亮，先完成三次打卡建立基础。' };
  }
  return { name: '等待开拓', nextNeed: 1, nextText: '还差 1 次', progress: 0, desc: '完成一次打卡，这里就会出现第一束灯光。' };
}

Page({
  data: {
    dimension: null,
    todayDone: false,
    totalCount: 0,
    templates: [],
    records: [],
    profile: {},
    sceneClass: '',
    hasSceneImage: false,
    growthStage: getGrowthStage(0),
    parts: [],
    nextUnlock: null,
    assets: getAssetBundle()
  },

  onLoad(options) {
    const dimensionId = options.dimension || 'sport';
    const dimension = DIMENSION_MAP[dimensionId] || DIMENSION_MAP.sport;
    wx.setNavigationBarTitle({
      title: dimension.sceneName
    });
    this.setData({
      dimension,
      sceneClass: `scene-${dimension.id}`
    });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const dimension = this.data.dimension || DIMENSION_MAP.sport;
    const assets = getAssetBundle();
    const records = listCheckins();
    const stats = buildDashboardStats(records);
    const dimensionRecords = records.filter((item) => item.dimension === dimension.id);
    const growthStage = getGrowthStage(dimensionRecords.length);
    const sceneImage = dimensionRecords.length || !assets.ecologyEmpty
      ? dimension.sceneImage
      : assets.ecologyEmpty;
    this.setData({
      assets,
      dimension: {
        ...dimension,
        sceneImage
      },
      profile: getProfile(),
      todayDone: stats.today.completedDimensions.includes(dimension.id),
      totalCount: dimensionRecords.length,
      growthStage,
      parts: getUnlockedParts(dimension.id, dimensionRecords.length),
      nextUnlock: getNextUnlock(dimension.id, dimensionRecords.length),
      templates: CHECKIN_TEMPLATES.filter((item) => item.dimension === dimension.id),
      records: buildRecords(records, dimension.id)
    });
  },

  goCheckin() {
    wx.switchTab({
      url: '/pages/checkin/checkin'
    });
  },

  onSceneImageLoad() {
    this.setData({
      hasSceneImage: true
    });
  },

  onSceneImageError() {
    this.setData({
      hasSceneImage: false
    });
  }
});
