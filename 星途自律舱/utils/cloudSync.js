const PROFILE_KEY = 'star_cabin_profile';
const CHECKINS_KEY = 'star_cabin_checkins';
const ACHIEVEMENTS_KEY = 'star_cabin_achievements';
const CUSTOM_PLANS_KEY = 'star_cabin_custom_plans';
const CLOUD_SYNC_KEY = 'star_cabin_cloud_sync';
const CLOUD_LAST_SYNC_KEY = 'star_cabin_cloud_last_sync';
const CLOUD_DATA_SYNC_ENABLED = false;

function hasCloud() {
  return typeof wx !== 'undefined' && wx.cloud;
}

function safeSet(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    console.warn('cloud sync cache failed', key, error);
  }
}

function safeGet(key, fallback) {
  try {
    return wx.getStorageSync(key) || fallback;
  } catch (error) {
    return fallback;
  }
}

function markCloudStatus(status, message = '') {
  const payload = {
    status,
    message,
    updatedAt: new Date().toISOString()
  };
  safeSet(CLOUD_SYNC_KEY, payload);
  return payload;
}

function getCloudStatus() {
  return safeGet(CLOUD_SYNC_KEY, {
    status: 'local',
    message: '本地演示模式',
    updatedAt: ''
  });
}

function callCloudFunction(name, data = {}, options = {}) {
  if (!hasCloud()) {
    markCloudStatus('local', '云开发未就绪，已使用本地数据');
    return Promise.resolve(null);
  }
  if (!options.force && !CLOUD_DATA_SYNC_ENABLED) {
    markCloudStatus('local', '本地演示模式，云端数据同步暂未开启');
    return Promise.resolve(null);
  }
  return wx.cloud.callFunction({ name, data })
    .then((res) => {
      markCloudStatus('online', '云端同步正常');
      safeSet(CLOUD_LAST_SYNC_KEY, Date.now());
      return res.result;
    })
    .catch((error) => {
      markCloudStatus('error', error.errMsg || error.message || '云端同步失败');
      return null;
    });
}

function normalizeProfile(user) {
  if (!user) return null;
  if (user.reminder) {
    safeSet('star_cabin_reminder', user.reminder);
  }
  if (Array.isArray(user.customPlans)) {
    safeSet(CUSTOM_PLANS_KEY, user.customPlans);
  }
  return {
    nickname: user.nickname || '星途旅人',
    avatarUrl: user.avatarUrl || '',
    planetName: user.planetName || '未命名星球',
    reminder: user.reminder || null,
    customPlans: Array.isArray(user.customPlans) ? user.customPlans : [],
    totalStarlight: user.totalStarlight || 0,
    starCoins: user.starCoins || 0,
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    lastActiveDate: user.lastActiveDate || '',
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString()
  };
}

function normalizeCheckins(checkins = []) {
  return checkins.map((item) => ({
    id: item.id || `${item.date}-${item.dimension}`,
    dimension: item.dimension,
    date: item.date,
    payload: item.payload || {},
    starlight: item.starlight || 10,
    createdAt: item.createdAt || item.updatedAt || new Date().toISOString()
  }));
}

function normalizeAchievements(achievements = []) {
  return achievements.map((item) => ({
    ...item,
    id: item.id || item.name,
    unlockedAt: item.unlockedAt || item.createdAt || new Date().toISOString()
  }));
}

async function syncDashboardFromCloud() {
  const result = await callCloudFunction('getDashboard', {}, { force: true });
  if (!result) return null;
  const profile = normalizeProfile(result.user);
  if (profile) safeSet(PROFILE_KEY, profile);
  safeSet(CHECKINS_KEY, normalizeCheckins(result.checkins));
  safeSet(ACHIEVEMENTS_KEY, normalizeAchievements(result.achievements));
  markCloudStatus('online', '已从云端恢复数据');
  return result;
}

function pushCheckinToCloud(input) {
  return callCloudFunction('submitCheckin', input);
}

function updateProfileToCloud(profile) {
  return callCloudFunction('updateProfile', {
    profile
  });
}

function loginCloud() {
  return callCloudFunction('login');
}

function exportCloudData() {
  return callCloudFunction('exportData');
}

function resolveCloudFileURL(fileID) {
  if (!fileID || !String(fileID).startsWith('cloud://') || !hasCloud()) {
    return Promise.resolve(fileID || '');
  }
  return wx.cloud.getTempFileURL({
    fileList: [fileID]
  }).then((res) => {
    const item = res.fileList && res.fileList[0];
    if (!item || !item.tempFileURL) {
      console.warn('cloud file url unresolved', fileID, res);
    }
    return item && item.tempFileURL ? item.tempFileURL : fileID;
  }).catch((error) => {
    console.warn('cloud file url failed', fileID, error);
    return fileID;
  });
}

function resolvePlayableCloudFile(fileID) {
  if (!fileID || !String(fileID).startsWith('cloud://') || !hasCloud()) {
    return Promise.resolve(fileID || '');
  }
  return wx.cloud.getTempFileURL({
    fileList: [fileID]
  }).then((res) => {
    const item = res.fileList && res.fileList[0];
    if (item && item.tempFileURL) {
      return item.tempFileURL;
    }
    if (item && /STORAGE_EXCEED_AUTHORITY/.test(item.errMsg || '')) {
      console.warn('cloud storage read denied, update storage permission', fileID, JSON.stringify(res));
      return '';
    }
    console.warn('cloud temp url missing, downloading file instead', fileID, JSON.stringify(res));
    return wx.cloud.downloadFile({
      fileID
    }).then((downloadRes) => {
      if (downloadRes && downloadRes.tempFilePath) {
        return downloadRes.tempFilePath;
      }
      console.warn('cloud download missing tempFilePath', fileID, downloadRes);
      return '';
    });
  }).catch((error) => {
    console.warn('cloud playable file resolve failed', fileID, error);
    return '';
  });
}

function resolveCloudAssetURL(key, fallbackFileID = '') {
  if (!hasCloud()) {
    return resolvePlayableCloudFile(fallbackFileID);
  }
  return wx.cloud.callFunction({
    name: 'getAssetUrl',
    data: { key }
  }).then((res) => {
    const result = res && res.result;
    if (result && result.ok && result.url) {
      return result.url;
    }
    console.warn('cloud asset url function failed', key, result);
    return resolvePlayableCloudFile(fallbackFileID);
  }).catch((error) => {
    console.warn('cloud asset url function unavailable', key, error);
    return resolvePlayableCloudFile(fallbackFileID);
  });
}

module.exports = {
  getCloudStatus,
  syncDashboardFromCloud,
  pushCheckinToCloud,
  updateProfileToCloud,
  loginCloud,
  exportCloudData,
  resolveCloudFileURL,
  resolvePlayableCloudFile,
  resolveCloudAssetURL
};
