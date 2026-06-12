Component({
  properties: {
    dimension: {
      type: Object,
      value: {}
    },
    completed: {
      type: Boolean,
      value: false
    },
    summary: {
      type: String,
      value: '今日还未点亮'
    },
    streak: {
      type: Number,
      value: 0
    },
    rate: {
      type: Number,
      value: 0
    }
  },

  methods: {
    handleTap() {
      this.triggerEvent('tapcard', {
        dimension: this.data.dimension
      });
    }
  }
});
