App({
  globalData: {
    cloudReady: false,
    user: null
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d8gpkxcft4c41ea12',
        traceUser: true
      });
      this.globalData.cloudReady = true;
    }
  }
});
