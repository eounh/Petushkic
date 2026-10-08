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

  /* ---------- Раскрытие карточек команды ----------
     Default: коллаж по центру, текста нет.
     Variant2: коллаж сдвигается влево, справа появляется текст.

     Клик раскрывает карточку; повторный клик ВОЗВРАЩАЕТ её в исходное.
     Состояние каждой карточки независимо: раскрытие одной НЕ закрывает
     остальные — они остаются на месте, как и просили.

     Плавность — через requestAnimationFrame, а НЕ CSS-transition:
     transition на transform в ряде окружений застревает в начальной
     точке, и сдвиг не применяется совсем. */
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));

  /* Длительность и кривая анимации: медленный разгон, мягкое торможение */
  var DURATION = 900;

  function easeInOutQuart(p) {
    return p < 0.5
      ? 8 * p * p * p * p
      : 1 - Math.pow(-2 * p + 2, 4) / 2;
  }

  /* Плавный сдвиг коллажа.
     ВАЖНО: конечное значение выставляем СРАЗУ, до анимации.
     requestAnimationFrame может не сработать (фоновая вкладка, throttling,
     headless) — в этом случае карточка всё равно останется раскрытой,
     просто без плавности. Анимация здесь — только улучшение. */
  function animateShift(img, from, to, duration) {
    /* 1. Гарантированный результат */
    img.style.transform = 'translateX(' + to + 'px)';

    /* 2. Плавность поверх него — если rAF доступен */
    if (reduce || duration <= 0 || typeof requestAnimationFrame !== 'function') return;

    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = (ts - start) / duration;
      if (p >= 1) return;                 /* финальное значение уже стоит */
      var e = easeInOutQuart(p);
      img.style.transform = 'translateX(' + (from + (to - from) * e) + 'px)';
      requestAnimationFrame(step);
    }
    /* стартуем с начального положения и едем к цели */
    img.style.transform = 'translateX(' + from + 'px)';
    requestAnimationFrame(step);
  }

  function setOpen(card, open) {
    var shot = card.querySelector('.card__shot');
    card.classList.toggle('is-open', open);
    card.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (!shot) return;
    /* Сдвиг группы слоёв: в макете видно 53-75% окна с фото,
       значит сдвигаем на 22-62% ширины карточки (значения из Figma). */
    var shiftPct = parseFloat(
      getComputedStyle(card).getPropertyValue('--shift')
    ) || -25;
    var cardW = card.getBoundingClientRect().width;
    var target = cardW * shiftPct / 100;

    animateShift(shot, open ? 0 : target, open ? target : 0, DURATION);
  }

  function toggleCard(card) {
    setOpen(card, !card.classList.contains('is-open'));
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () { toggleCard(card); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggleCard(card);
      }
    });
  });

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

  /* Промо: анимацию -20% делаем через CSS-класс.
     GSAP здесь НЕ используем: gsap.from({opacity:0}) может не доиграть
     и оставить элемент прозрачным (проверено — именно это и происходило). */
  var promoBig = document.querySelector('.promo__big');
  if (promoBig) {
    promoBig.classList.add('promo-in');
  }

  /* Параллакс карточек команды УБРАН намеренно:
     он писал yPercent в inline-transform той же картинки .card__img,
     что и механика раскрытия, и перебивал сдвиг коллажа —
     из-за этого карточка визуально не раскрывалась. */

  if (hasST) {
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
})();
