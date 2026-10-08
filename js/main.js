/* =========================================================
   ПЕТУШКИ — анимации
   Появление блоков: IntersectionObserver + CSS (надёжно).
   GSAP — только для декоративных эффектов.
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Появление блоков ---------- */
  var targets = document.querySelectorAll(
    '.reveal, .stage, .service, .adv__item, .card'
  );

  /* Задержка для каскада внутри групп */
  document.querySelectorAll('.stage').forEach(function (el, i) {
    el.style.setProperty('--d', (i * 70) + 'ms');
  });
  document.querySelectorAll('.service').forEach(function (el, i) {
    el.style.setProperty('--d', (i * 60) + 'ms');
  });
  document.querySelectorAll('.adv__item').forEach(function (el, i) {
    el.style.setProperty('--d', (i * 90) + 'ms');
  });
  document.querySelectorAll('.card').forEach(function (el, i) {
    el.style.setProperty('--d', (i * 80) + 'ms');
  });

  if (reduce || !('IntersectionObserver' in window)) {
    /* Показываем всё сразу — без анимаций */
    targets.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(function (el) { io.observe(el); });

  /* Страховка: через 3 с показываем всё, что осталось смещённым */
  window.setTimeout(function () {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  }, 3000);

  /* ---------- Декоративные эффекты GSAP ---------- */
  if (typeof window.gsap === 'undefined' || reduce) return;

  var hasST = typeof window.ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* Заголовок героя — анимация входа через CSS-класс (надёжно).
     GSAP здесь не используем: gsap.from() с opacity:0 может «застрять»
     и оставить заголовок невидимым, если твин не доиграет. */
  var heroTitle = document.querySelector('.hero__title');
  if (heroTitle) {
    heroTitle.classList.add('hero-in');
  }

  /* Навигация шапки — узкая тень при скролле */
  var topbar = document.querySelector('.topbar');
  if (topbar) {
    var onScroll = function () {
      topbar.style.boxShadow = window.scrollY > 8
        ? '0 4px 18px rgba(0,0,0,.22)'
        : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Пульсация зелёной точки в списке этапов */
  var greens = document.querySelectorAll('.stage__dots i:nth-child(3), .dots i:nth-child(3)');
  greens.forEach(function (d, i) {
    gsap.to(d, {
      boxShadow: '0 0 0 5px rgba(68,255,0,.35)',
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i * 0.06
    });
  });

  /* Промо: въезд блока -20% */
  var promoBig = document.querySelector('.promo__big');
  if (promoBig) {
    gsap.from(promoBig, {
      opacity: 0, x: -40, rotate: -20,
      duration: 0.9, ease: 'back.out(1.4)',
      scrollTrigger: hasST
        ? { trigger: '.promo', start: 'top 88%' }
        : undefined,
      clearProps: 'opacity'
    });
  }

  /* Лёгкий параллакс карточек команды */
  if (hasST) {
    document.querySelectorAll('.card__img').forEach(function (img) {
      gsap.fromTo(img,
        { yPercent: -2 },
        {
          yPercent: 2,
          ease: 'none',
          scrollTrigger: {
            trigger: img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
          }
        }
      );
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
})();
