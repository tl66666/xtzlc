/**
 * 星途自律舱 - 滚动动效系统
 * 视差背景 + 渐入动画 + 浮动粒子 + 模块间桥接
 */
(function () {
  'use strict';

  /* ===== 0. Hero 视频无缝循环 + 微信兼容 ===== */
  (function setupHeroLoop() {
    var heroVideo = document.querySelector('.hero-video-bg');
    if (!heroVideo) return;

    var isWeixin = /MicroMessenger/i.test(navigator.userAgent);

    // 微信内置浏览器：切换为低码率 loop mobile 版，更容易加载和自动播放
    if (isWeixin) {
      var source = heroVideo.querySelector('source');
      if (source && source.src.indexOf('hero-bg-loop-mobile.mp4') === -1) {
        source.src = source.src.replace('hero-bg-loop.mp4', 'hero-bg-loop-mobile.mp4');
        heroVideo.load();
      }
    }

    function tryPlay() {
      var playPromise = heroVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          // 自动播放被阻止时，等待微信桥接 ready 再试
        });
      }
    }

    // 微信 JSBridge ready 后尝试播放
    if (isWeixin && typeof window.WeixinJSBridge !== 'undefined') {
      window.WeixinJSBridge.invoke('getNetworkType', {}, tryPlay);
    } else if (document.addEventListener) {
      document.addEventListener('WeixinJSBridgeReady', function () {
        if (isWeixin && window.WeixinJSBridge) {
          window.WeixinJSBridge.invoke('getNetworkType', {}, tryPlay);
        }
      }, false);
    }

    // 常规浏览器：loadedmetadata 后尝试播放
    heroVideo.addEventListener('loadedmetadata', tryPlay);
    heroVideo.addEventListener('canplay', tryPlay);

    // 视频已用 OpenCV 做首尾 crossfade 处理成无缝循环，无需 JS 过渡
  })();

  /* ===== 1. 视差背景滚动 ===== */
  const bgLayers = document.querySelectorAll('.section-img-bg');
  let ticking = false;

  function updateParallax() {
    var scrollY = window.pageYOffset;

    bgLayers.forEach(function (layer) {
      // 使用 background-position-y 移动背景图内部，而非 transform 移动整个元素
      // 避免 div 移位露出边缘空白
      var speed = 0.08;
      layer.style.backgroundPositionY = (scrollY * speed) + 'px';
    });

    // Hero video 微视差
    var heroVideo = document.querySelector('.hero-video-bg');
    if (heroVideo) {
      heroVideo.style.transform = 'translateY(' + (scrollY * 0.05) + 'px) scale(1.05)';
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  /* ===== 2. 滚动渐入动画 (IntersectionObserver) ===== */
  const revealEls = document.querySelectorAll('[data-reveal]');

  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay')) || 0;
        setTimeout(function () {
          el.classList.add('revealed');
        }, delay);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealEls.forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ===== 3. 导航高亮随滚动 ===== */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.topbar nav a');

  const navObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
        });
        var id = entry.target.getAttribute('id');
        var activeLink = document.querySelector('.topbar nav a[href="#' + id + '"]');
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '-80px 0px -50% 0px'
  });

  sections.forEach(function (sec) {
    navObserver.observe(sec);
  });

  /* ===== 4. 浮动星光粒子环境 ===== */
  function createAmbientParticles() {
    var container = document.createElement('div');
    container.className = 'ambient-particles';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);

    for (var i = 0; i < 15; i++) {
      var p = document.createElement('div');
      p.className = 'ambient-dot';
      var size = 2 + Math.random() * 4;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 8 + 's';
      p.style.animationDuration = (6 + Math.random() * 10) + 's';
      p.style.opacity = (0.2 + Math.random() * 0.5);
      container.appendChild(p);
    }
  }

  createAmbientParticles();

  /* ===== 5. 模块桥接 + 滚动进度条 ===== */
  function updateSectionBlend() {
    var scrolled = window.pageYOffset;
    var winH = window.innerHeight;
    var allSections = document.querySelectorAll('section');

    allSections.forEach(function (sec) {
      var rect = sec.getBoundingClientRect();
      var overlapStyle = sec.querySelector('.section-overlay');
      if (!overlapStyle) return;

      var topRatio = 1 - Math.max(0, Math.min(1, rect.top / (winH * 0.5)));
      var botRatio = Math.max(0, Math.min(1, (winH - rect.bottom) / (winH * 0.5)));

      var alpha = 0.55 + (topRatio + botRatio) * 0.2;
      overlapStyle.style.background =
        'linear-gradient(180deg, rgba(1,8,40,' + alpha + ') 0%, rgba(1,8,40,' + (alpha + 0.15) + ') 100%)';
    });

    // 更新滚动进度条
    var progressBar = document.querySelector('.scroll-progress');
    if (progressBar) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docH > 0 ? (scrolled / docH) * 100 : 0;
      progressBar.style.width = Math.min(progress, 100) + '%';
    }
  }

  var blendTicking = false;
  window.addEventListener('scroll', function () {
    if (!blendTicking) {
      requestAnimationFrame(updateSectionBlend);
      blendTicking = false;
    }
    blendTicking = true;
  }, { passive: true });

})();
