/* =========================================================
   ПЕТУШКИ — анимации
   GSAP + ScrollTrigger, с безопасным фолбэком без библиотеки
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.add('js');
  /* gsap-ready ставим ТОЛЬКО когда GSAP реально загружен —
     до этого момента CSS не скрывает ни один блок. */
  if (typeof window.gsap !== 'undefined') {
    document.documentElement.classList.add('gsap-ready');
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Год в подвале ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Бургер ---------- */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('is-open');
    });
  }

  var hasGSAP = typeof window.gsap !== 'undefined';

  /* =========================================================
     Фолбэк без GSAP (или reduced-motion): только CSS-переходы
     ========================================================= */
  if (!hasGSAP || reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    /* Каскадные задержки задаём и здесь — анимация остаётся живой */
    document.querySelectorAll('.adv__item').forEach(function (el, i) {
      el.style.setProperty('--delay', (i * 70) + 'ms');
    });
    document.querySelectorAll('.service').forEach(function (el, i) {
      el.style.setProperty('--delay', (i * 80) + 'ms');
    });

    document.querySelectorAll('.reveal, .adv__item, .service, .promo__card')
      .forEach(function (el) { io.observe(el); });

    /* Счётчик скидки работает и без GSAP */
    var pv = document.querySelector('.promo__value');
    var pc = document.querySelector('.promo__card');
    if (pv && pc) {
      var pcIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          pcIO.disconnect();
          var n = 0;
          var t = setInterval(function () {
            n += 1;
            pv.textContent = '-' + Math.min(n, 20) + '%';
            if (n >= 20) { clearInterval(t); pv.textContent = '-20%'; }
          }, 55);
        });
      }, { threshold: 0.3 });
      pcIO.observe(pc);
    }
    return;
  }

  /* =========================================================
     GSAP-путь
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);

  /* 1. Появление блоков при скролле — на CSS-transition + IntersectionObserver.
     Это НАДЁЖНЕЕ, чем GSAP-твины: элемент виден сразу при попадании в зону,
     состояние не «зависает» между кадрами, и нет конфликтов со ScrollTrigger. */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) {
    el.classList.add('is-in');
    revealIO.observe(el);
  });

  /* 2. Заголовок героя и подзаголовок.
     Анимируем через CSS-transition (не @keyframes с `both`): базовое состояние
     в CSS — ВИДИМОЕ, скрипт лишь на миг ставит стартовое и сразу снимает его.
     Даже если transition не проиграется, элемент останется видимым. */
  ['.hero__title', '.hero__sub'].forEach(function (sel, i) {
    var el = document.querySelector(sel);
    if (!el) return;
    el.style.transition = 'opacity .8s cubic-bezier(.2,.8,.2,1) ' +
                          (0.08 + i * 0.2) + 's, transform .8s cubic-bezier(.2,.8,.2,1) ' +
                          (0.08 + i * 0.2) + 's';
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.opacity = '';
        el.style.transform = '';
      });
    });
  });

  /* 3. Окна коллажа: вход через CSS-transition + покачивание GSAP.
     Базовое состояние CSS — видимое; стартовое ставится и снимается скриптом. */
  document.querySelectorAll('[data-float]').forEach(function (el, i) {
    var baseRotate = i % 2 === 0 ? -1.2 : 1.6;
    el.style.setProperty('--base-rot', baseRotate + 'deg');
    el.style.transform = 'translateY(0) rotate(' + baseRotate + 'deg)';

    var delay = 0.3 + i * 0.16;
    el.style.transition = 'opacity .8s cubic-bezier(.2,.8,.2,1) ' + delay + 's, ' +
                          'transform .8s cubic-bezier(.2,.8,.2,1) ' + delay + 's';
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px) rotate(' + baseRotate + 'deg)';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.opacity = '';
        el.style.transform = 'translateY(0) rotate(' + baseRotate + 'deg)';
      });
    });

    /* после входа — мягкое покачивание и параллакс */
    setTimeout(function () {
      gsap.to(el, {
        rotate: baseRotate + (i % 2 === 0 ? 1.6 : -1.6),
        duration: 3.4 + i * .5,
        repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
      gsap.to(el, {
        y: i % 2 === 0 ? -14 : -22, ease: 'none',
        scrollTrigger: {
          trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.1
        }
      });
    }, 1400 + i * 200);
  });

  /* 4. Карточки команды: наклон при появлении */
  gsap.utils.toArray('.card').forEach(function (card, i) {
    var shot = card.querySelector('.win--card');
    if (!shot) return;

    gsap.fromTo(shot,
      { rotate: i % 2 === 0 ? -3.2 : 3.2 },
      {
        rotate: 0,
        duration: .9, ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: { trigger: card, start: 'top 95%' },
        onComplete: function () { gsap.set(shot, { clearProps: 'all' }); }
      }
    );
  });

  /* 5. Галочки преимуществ — рисуем по очереди (CSS-анимация по классу) */
  gsap.utils.toArray('.adv__item').forEach(function (item, i) {
    item.style.setProperty('--delay', (i * 70) + 'ms');
    item.classList.add('is-in');
  });

  /* 6. Услуги — каскадный въезд через CSS-переменную задержки */
  var services = gsap.utils.toArray('.service');
  services.forEach(function (s, i) {
    s.style.setProperty('--delay', (i * 80) + 'ms');
    s.classList.add('is-in');
  });

  /* 7. Промо: карточка + счётчик скидки */
  var promo = document.querySelector('.promo__card');
  if (promo) {
    promo.classList.add('is-in');

    var valueEl = promo.querySelector('.promo__value');
    if (valueEl) {
      /* Значение в HTML уже верное (-20%). Анимируем счётчик один раз,
         а по завершении и при любой ошибке возвращаем точное значение. */
      var runCounter = function () {
        var counter = { v: 0 };
        valueEl.textContent = '-0%';
        gsap.to(counter, {
          v: 20,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: function () {
            valueEl.textContent = '-' + Math.round(counter.v) + '%';
          },
          onComplete: function () { valueEl.textContent = '-20%'; }
        });
      };

      if ('IntersectionObserver' in window) {
        var cio = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { cio.disconnect(); runCounter(); }
          });
        }, { threshold: 0.3 });
        cio.observe(promo);
      } else {
        valueEl.textContent = '-20%';
      }
    }
  }

  /* 8. Кнопка CTA — мягкое «дыхание» */
  var btn = document.querySelector('.btn');
  if (btn) {
    gsap.to(btn, {
      boxShadow: '0 16px 38px rgba(138,56,245,.5)',
      duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1
    });
  }

  /* 9. Пересчёт после загрузки картинок */
  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
  });
})();
