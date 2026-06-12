const CLOUD_ASSETS = {
  appBg: '',
  planetOverview: '',
  planetEmpty: '',
  ecologyEmpty: '',
  rewardChest: '',
  unlockBadge: '',
  onboardingIgnite: 'cloud://cloud1-d8gpkxcft4c41ea12.636c-cloud1-d8gpkxcft4c41ea12-1442290145/onboarding-ignite.mp4',
  onboardingCover: '',
  onboardingFrames: [],
  starlightFrames: [],
  hub: {
    sport: '',
    diet: '',
    study: '',
    work: '',
    plan: '',
    sleep: ''
  },
  ecology: {
    sport: '',
    diet: '',
    study: '',
    work: '',
    plan: '',
    sleep: ''
  }
};

const LOCAL_ASSETS = {
  appBg: '/assets/images/app-bg.jpg',
  planetOverview: '/assets/images/planet-overview-cut-520.png',
  planetEmpty: '/assets/images/planet-empty-cut-440.png',
  ecologyEmpty: '/assets/images/ecology-empty.jpg',
  rewardChest: '/assets/images/reward-chest.png',
  unlockBadge: '/assets/images/unlock-badge.png',
  onboardingIgnite: '',
  onboardingCover: '/assets/images/onboarding-cover.jpg',
  onboardingFrames: [],
  starlightFrames: [],
  hub: {
    sport: '/assets/images/hub-sport.jpg',
    diet: '/assets/images/hub-diet.jpg',
    study: '/assets/images/hub-study.jpg',
    work: '/assets/images/hub-work.jpg',
    plan: '/assets/images/hub-plan.jpg',
    sleep: '/assets/images/hub-sleep.jpg'
  },
  ecology: {
    sport: '/assets/images/ecology-sport.jpg',
    diet: '/assets/images/ecology-diet.jpg',
    study: '/assets/images/ecology-study.jpg',
    work: '/assets/images/ecology-work.jpg',
    plan: '/assets/images/ecology-plan.jpg',
    sleep: '/assets/images/ecology-sleep.jpg'
  }
};

function preferCloud(cloudValue, localValue) {
  if (Array.isArray(cloudValue)) {
    return cloudValue.length ? cloudValue : localValue;
  }
  return cloudValue || localValue || '';
}

function getAsset(key) {
  return preferCloud(CLOUD_ASSETS[key], LOCAL_ASSETS[key]);
}

function getHubImage(dimensionId) {
  return preferCloud(CLOUD_ASSETS.hub[dimensionId], LOCAL_ASSETS.hub[dimensionId]);
}

function getEcologyImage(dimensionId) {
  return preferCloud(CLOUD_ASSETS.ecology[dimensionId], LOCAL_ASSETS.ecology[dimensionId]);
}

function getAssetBundle() {
  return {
    appBg: getAsset('appBg'),
    planetOverview: getAsset('planetOverview'),
    planetEmpty: getAsset('planetEmpty'),
    ecologyEmpty: getAsset('ecologyEmpty'),
    rewardChest: getAsset('rewardChest'),
    unlockBadge: getAsset('unlockBadge'),
    onboardingIgnite: getAsset('onboardingIgnite'),
    onboardingCover: getAsset('onboardingCover'),
    onboardingFrames: getAsset('onboardingFrames'),
    starlightFrames: getAsset('starlightFrames')
  };
}

module.exports = {
  CLOUD_ASSETS,
  LOCAL_ASSETS,
  getAsset,
  getHubImage,
  getEcologyImage,
  getAssetBundle
};
