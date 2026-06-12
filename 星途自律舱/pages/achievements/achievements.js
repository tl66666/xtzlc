const { ACHIEVEMENTS } = require('../../utils/constants');
const { listAchievements } = require('../../utils/storage');
const { getAssetBundle } = require('../../utils/assets');

const ICON_MAP = {
  first_light: '光',
  perfect_day: '冠',
  seven_day_route: '航',
  study_star: '书',
  sport_orbit: '跑',
  regular_sleep: '月',
  starlight_collector: '藏'
};

Page({
  data: {
    assets: getAssetBundle(),
    achievements: []
  },

  onShow() {
    const unlocked = listAchievements();
    const unlockedMap = unlocked.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
    this.setData({
      achievements: ACHIEVEMENTS.map((item) => ({
        ...item,
        iconText: ICON_MAP[item.id] || '星',
        unlocked: Boolean(unlockedMap[item.id]),
        unlockedAt: unlockedMap[item.id] && unlockedMap[item.id].unlockedAt
      }))
    });
  }
});
