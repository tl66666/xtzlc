Component({
  properties: {
    value: {
      type: Number,
      value: 0
    },
    total: {
      type: Number,
      value: 6
    },
    label: {
      type: String,
      value: '今日'
    }
  },

  observers: {
    'value,total': function updateDegrees(value, total) {
      const ratio = total > 0 ? Math.min(value / total, 1) : 0;
      this.setData({
        degrees: Math.round(ratio * 360)
      });
    }
  },

  data: {
    degrees: 0
  }
});
