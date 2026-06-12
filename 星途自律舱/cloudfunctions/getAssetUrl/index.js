const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const ASSET_FILES = {
  onboardingIgnite: 'cloud://cloud1-d8gpkxcft4c41ea12.636c-cloud1-d8gpkxcft4c41ea12-1442290145/onboarding-ignite.mp4'
};

exports.main = async (event) => {
  const key = event && event.key;
  const fileID = ASSET_FILES[key];

  if (!fileID) {
    return {
      ok: false,
      error: 'ASSET_NOT_FOUND'
    };
  }

  try {
    const result = await cloud.getTempFileURL({
      fileList: [fileID]
    });
    const item = result.fileList && result.fileList[0];
    return {
      ok: Boolean(item && item.tempFileURL),
      fileID,
      url: item && item.tempFileURL ? item.tempFileURL : '',
      detail: item || null
    };
  } catch (error) {
    return {
      ok: false,
      fileID,
      error: error.message || error.errMsg || String(error)
    };
  }
};
