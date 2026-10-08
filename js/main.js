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
     Variant2: коллаж сдвигается влево, справа сверху появляется текст.

     Клик по карточке РАСКРЫВАЕТ её; повторный клик — ВОЗВРАЩАЕТ
     в исходное положение. Открытие другой карточки закрывает прежнюю.
     Сдвиг и позиция текста берутся из CSS-переменных (значения из Figma). */
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));

  function setOpen(card, open) {
    card.classList.toggle('is-open', open);
    card.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function toggleCard(card) {
    var willOpen = !card.classList.contains('is-open');

    /* закрываем остальные — раскрыта всегда максимум одна */
    cards.forEach(function (c) {
      if (c !== card) setOpen(c, false);
    });

    setOpen(card, willOpen);
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () { toggleCard(card); });
    /* доступность: Enter и Space */
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
