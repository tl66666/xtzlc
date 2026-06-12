const { getLevelInfo } = require('../../utils/rewards');

Component({
  properties: {
    totalStarlight: {
      type: Number,
      value: 0
    },
    completedCount: {
      type: Number,
      value: 0
    },
    completedDimensions: {
      type: Array,
      value: []
    }
  },

  data: {
    levelName: '荒芜星',
    hasImage: false
  },

  lifetimes: {
    attached() {
      this.angle = 0;
      this.dragging = false;
      this.particles = [];
      this.drawTimer = setInterval(() => this.draw(), 66);
    },

    detached() {
      clearInterval(this.drawTimer);
    }
  },

  observers: {
    'totalStarlight': function updateLevel(totalStarlight) {
      this.setData({
        levelName: getLevelInfo(totalStarlight).name
      });
      this.draw();
    }
  },

  methods: {
    handleTouchStart(event) {
      this.dragging = true;
      this.lastX = event.touches[0].x;
    },

    handleTouchMove(event) {
      if (!this.dragging) return;
      const x = event.touches[0].x;
      this.angle += (x - this.lastX) * 0.012;
      this.lastX = x;
      this.draw();
    },

    handleTouchEnd() {
      this.dragging = false;
    },

    burst() {
      this.particles = Array.from({ length: 28 }, () => ({
        x: 187 + Math.random() * 10,
        y: 228 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 7,
        vy: -Math.random() * 7,
        life: 1
      }));
      this.triggerEvent('planettap');
      this.draw();
    },

    onImageLoad() {
      this.setData({ hasImage: true });
      if (this.drawTimer) {
        clearInterval(this.drawTimer);
        this.drawTimer = null;
      }
    },

    onImageError() {
      this.setData({ hasImage: false });
      if (!this.drawTimer) {
        this.drawTimer = setInterval(() => this.draw(), 66);
      }
    },

    drawStars(ctx, width, height) {
      ctx.setFillStyle('#050A18');
      ctx.fillRect(0, 0, width, height);
      const amberNebula = ctx.createCircularGradient(width * 0.22, height * 0.18, 180);
      amberNebula.addColorStop(0, 'rgba(245,200,66,0.16)');
      amberNebula.addColorStop(1, 'rgba(245,200,66,0)');
      ctx.setFillStyle(amberNebula);
      ctx.fillRect(0, 0, width, height);

      const blueNebula = ctx.createCircularGradient(width * 0.78, height * 0.3, 220);
      blueNebula.addColorStop(0, 'rgba(74,155,217,0.14)');
      blueNebula.addColorStop(1, 'rgba(74,155,217,0)');
      ctx.setFillStyle(blueNebula);
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 125; i += 1) {
        const x = (i * 53 + 17) % width;
        const y = (i * 89 + 31) % height;
        const alpha = 0.18 + ((i % 7) * 0.09);
        ctx.setFillStyle(`rgba(255,255,255,${alpha})`);
        ctx.beginPath();
        ctx.arc(x, y, i % 4 === 0 ? 1.8 : 1, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    drawEllipse(ctx, x, y, radiusX, radiusY, rotation, fill) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(radiusX, radiusY);
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      if (fill) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
      ctx.restore();
    },

    drawOrbit(ctx, cx, cy, radius) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.28);
      ctx.setStrokeStyle('rgba(245,200,66,0.24)');
      ctx.setLineWidth(2);
      this.drawEllipse(ctx, 0, 0, radius * 1.48, radius * 0.38, 0, false);
      ctx.setStrokeStyle('rgba(126,196,240,0.18)');
      this.drawEllipse(ctx, 0, 6, radius * 1.68, radius * 0.48, 0, false);
      const satelliteX = Math.cos(this.angle * 1.7) * radius * 1.48;
      const satelliteY = Math.sin(this.angle * 1.7) * radius * 0.38;
      ctx.setFillStyle('rgba(245,200,66,0.95)');
      ctx.beginPath();
      ctx.arc(satelliteX, satelliteY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },

    drawPlanet(ctx, cx, cy, radius) {
      const level = getLevelInfo(this.properties.totalStarlight).level;
      const gradient = ctx.createCircularGradient(cx, cy, radius);
      gradient.addColorStop(0, '#F9F1C2');
      gradient.addColorStop(0.18, level >= 3 ? '#7ED39B' : '#7A8088');
      gradient.addColorStop(0.45, level >= 4 ? '#2F75A8' : '#354766');
      gradient.addColorStop(1, '#101729');

      ctx.setShadow(0, 0, 42, 'rgba(74,155,217,0.48)');
      ctx.setFillStyle(gradient);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.setShadow(0, 0, 0, 'transparent');

      ctx.setFillStyle('rgba(255,255,255,0.34)');
      ctx.beginPath();
      ctx.arc(cx - radius * 0.35, cy - radius * 0.38, radius * 0.22, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 18 + level * 3; i += 1) {
        const offset = this.angle * 35;
        const x = cx + Math.cos(i * 1.7 + offset) * radius * (0.18 + (i % 4) * 0.15);
        const y = cy + Math.sin(i * 1.2) * radius * 0.58;
        const w = 26 + (i % 4) * 12;
        ctx.setFillStyle(i % 4 === 0 ? 'rgba(92,184,92,0.52)' : i % 4 === 1 ? 'rgba(74,155,217,0.38)' : 'rgba(245,200,66,0.16)');
        this.drawEllipse(ctx, x, y, w, 12 + (i % 3) * 4, i * 0.5, true);
      }

      ctx.setFillStyle('rgba(255,255,255,0.16)');
      for (let i = 0; i < 4; i += 1) {
        const x = cx - radius * 0.52 + i * radius * 0.34 + Math.sin(this.angle + i) * 10;
        const y = cy - radius * 0.18 + Math.cos(this.angle + i) * 18;
        ctx.beginPath();
        ctx.arc(x, y, 16 + i * 2, 0, Math.PI * 2);
        ctx.arc(x + 18, y + 2, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      this.drawEcology(ctx, cx, cy, radius, level);

      const shade = ctx.createCircularGradient(cx + radius * 0.18, cy + radius * 0.18, radius * 1.05);
      shade.addColorStop(0, 'rgba(0,0,0,0.12)');
      shade.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.setFillStyle(shade);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.setStrokeStyle('rgba(126,196,240,0.32)');
      ctx.setLineWidth(10);
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    },

    drawEcology(ctx, cx, cy, radius, level) {
      const completed = new Set(this.properties.completedDimensions || []);
      const modules = [
        { id: 'sport', x: -0.52, y: 0.18, color: '#E8653A' },
        { id: 'diet', x: -0.2, y: -0.26, color: '#5CB85C' },
        { id: 'study', x: 0.18, y: -0.2, color: '#4A9BD9' },
        { id: 'work', x: 0.46, y: 0.08, color: '#9B6DC6' },
        { id: 'plan', x: -0.02, y: 0.34, color: '#E8B83A' },
        { id: 'sleep', x: 0.36, y: -0.36, color: '#5B7FCC' }
      ];

      modules.forEach((item, index) => {
        const active = completed.has(item.id) || level >= index + 3;
        const x = cx + radius * item.x;
        const y = cy + radius * item.y;
        ctx.setGlobalAlpha(active ? 0.95 : 0.24);
        ctx.setStrokeStyle(item.color);
        ctx.setFillStyle(active ? item.color : 'rgba(255,255,255,0.18)');
        ctx.setLineWidth(2);

        if (item.id === 'sport') {
          this.drawEllipse(ctx, x, y, 22, 9, -0.2, false);
          ctx.fillRect(x - 15, y - 2, 30, 3);
        }

        if (item.id === 'diet') {
          for (let i = 0; i < 3; i += 1) {
            ctx.beginPath();
            ctx.arc(x - 13 + i * 13, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(x - 14 + i * 13, y + 3, 2, 10);
          }
        }

        if (item.id === 'study') {
          ctx.fillRect(x - 14, y - 14, 28, 26);
          ctx.setFillStyle('rgba(255,255,255,0.85)');
          ctx.fillRect(x - 8, y - 7, 4, 4);
          ctx.fillRect(x + 4, y - 7, 4, 4);
        }

        if (item.id === 'work') {
          ctx.fillRect(x - 11, y - 22, 8, 34);
          ctx.fillRect(x + 1, y - 12, 10, 24);
          ctx.setStrokeStyle('rgba(255,255,255,0.65)');
          ctx.beginPath();
          ctx.moveTo(x + 8, y - 26);
          ctx.lineTo(x + 18, y - 34);
          ctx.stroke();
        }

        if (item.id === 'plan') {
          ctx.beginPath();
          ctx.moveTo(x, y - 24);
          ctx.lineTo(x + 13, y + 12);
          ctx.lineTo(x - 13, y + 12);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y - 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        if (item.id === 'sleep') {
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillRect(x - 2, y - 18, 4, 36);
        }
        ctx.setGlobalAlpha(1);
      });
    },

    drawParticles(ctx, cx, cy) {
      ctx.setFillStyle('rgba(245,200,66,0.9)');
      this.particles = this.particles
        .map((item) => ({
          ...item,
          x: item.x + item.vx,
          y: item.y + item.vy,
          vy: item.vy + 0.22,
          life: item.life - 0.045
        }))
        .filter((item) => item.life > 0);

      this.particles.forEach((item) => {
        ctx.setGlobalAlpha(Math.max(item.life, 0));
        ctx.beginPath();
        ctx.arc(cx + item.x - 187, cy + item.y - 228, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.setGlobalAlpha(1);
    },

    draw() {
      try {
        const ctx = wx.createCanvasContext('planetCanvas', this);
        const width = 375;
        const height = 345;
        this.angle += this.dragging ? 0 : 0.004;
        const cx = width / 2;
        const cy = 188;
        this.drawStars(ctx, width, height);
        this.drawOrbit(ctx, cx, cy, 112 + this.properties.completedCount * 2);
        this.drawPlanet(ctx, cx, cy, 104 + this.properties.completedCount * 3);
        this.drawParticles(ctx, cx, cy);
        ctx.draw();
      } catch (error) {
        clearInterval(this.drawTimer);
        this.drawTimer = null;
      }
    }
  }
});
