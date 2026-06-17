(function() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let stars = [];
  let shootingStars = [];

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initStars();
  }

  function initStars() {
    stars = [];
    const count = Math.floor((width * height) / 3000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random(),
        speed: Math.random() * 0.3 + 0.05,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  function createShootingStar() {
    if (Math.random() > 0.005) return;
    shootingStars.push({
      x: Math.random() * width * 0.5,
      y: Math.random() * height * 0.3,
      length: Math.random() * 80 + 40,
      speed: Math.random() * 8 + 6,
      angle: Math.random() * 0.5 + 0.2,
      opacity: 1,
      life: 1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // 绘制普通星星
    stars.forEach(star => {
      star.twinklePhase += star.twinkleSpeed;
      const twinkle = Math.sin(star.twinklePhase) * 0.5 + 0.5;
      const alpha = star.opacity * twinkle;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();

      // 大星星加十字光芒
      if (star.size > 1.2) {
        ctx.beginPath();
        ctx.moveTo(star.x - star.size * 3, star.y);
        ctx.lineTo(star.x + star.size * 3, star.y);
        ctx.moveTo(star.x, star.y - star.size * 3);
        ctx.lineTo(star.x, star.y + star.size * 3);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // 缓慢移动
      star.y -= star.speed;
      if (star.y < 0) {
        star.y = height;
        star.x = Math.random() * width;
      }
    });

    // 绘制流星
    createShootingStar();
    shootingStars = shootingStars.filter(s => s.life > 0);

    shootingStars.forEach(s => {
      s.x += s.speed * Math.cos(s.angle);
      s.y += s.speed * Math.sin(s.angle);
      s.life -= 0.015;
      s.opacity = s.life;

      const tailX = s.x - s.length * Math.cos(s.angle);
      const tailY = s.y - s.length * Math.sin(s.angle);

      const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
      gradient.addColorStop(0.5, `rgba(200, 230, 255, ${s.opacity * 0.5})`);
      gradient.addColorStop(1, `rgba(200, 230, 255, 0)`);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 流星头部光晕
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();
