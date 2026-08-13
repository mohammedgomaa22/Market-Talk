document.addEventListener('DOMContentLoaded', function () {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 700,
      once: true,
      offset: 60,
      easing: 'ease-out-cubic'
    });
  }

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  initModals();
  initFaq();
  initStickyBar();
  initCounters();
  initTestimonialsSwiper();
  initYear();
  initThemeToggle();
  initHeaderScroll();
});

/* ========== Sticky header shadow ========== */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = function () {
    if (window.scrollY > 12) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ========== Theme toggle ========== */
function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!btn) return;

  const applyTheme = function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('mt-theme', theme);
    } catch (e) {}

    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0a0a0f' : '#f7f9fc');
    }

    btn.setAttribute(
      'aria-label',
      theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'
    );

    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  btn.addEventListener('click', function () {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
}

/* ========== Modals ========== */
function initModals() {
  const overlays = document.querySelectorAll('[data-modal]');

  document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-open-modal');
      openModal(id);
    });
  });

  overlays.forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay.id);
    });

    const closeBtn = overlay.querySelector('[data-close-modal]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeModal(overlay.id);
      });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      overlays.forEach(function (overlay) {
        if (overlay.classList.contains('is-open')) closeModal(overlay.id);
      });
    }
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('is-open');
  document.body.classList.add('modal-open');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('is-open');
  if (!document.querySelector('.modal-overlay.is-open')) {
    document.body.classList.remove('modal-open');
  }
}

/* ========== FAQ Accordion ========== */
function initFaq() {
  document.querySelectorAll('.faq-item').forEach(function (item) {
    const btn = item.querySelector('.faq-btn');
    const panel = item.querySelector('.faq-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', function () {
      const isOpen = item.classList.contains('is-open');

      document.querySelectorAll('.faq-item.is-open').forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          const openBtn = openItem.querySelector('.faq-btn');
          if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
          const p = openItem.querySelector('.faq-panel');
          if (p) p.style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = null;
      } else {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

/* ========== Sticky bottom bar ========== */
function initStickyBar() {
  const bar = document.getElementById('stickyBar');
  const hero = document.getElementById('hero');
  if (!bar || !hero) return;

  const onScroll = function () {
    const threshold = hero.offsetHeight * 0.6;
    if (window.scrollY > threshold) {
      bar.classList.add('is-visible');
    } else {
      bar.classList.remove('is-visible');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ========== Counter animation ========== */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const animate = function (el) {
    const target = parseInt(el.getAttribute('data-counter'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1600;
    const start = performance.now();

    const tick = function (now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value.toLocaleString('ar-EG') + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) {
      io.observe(el);
    });
  } else {
    counters.forEach(animate);
  }
}

/* ========== Testimonials Swiper ========== */
function initTestimonialsSwiper() {
  if (typeof Swiper === 'undefined') return;
  const el = document.querySelector('.testimonials-swiper');
  if (!el) return;

  new Swiper('.testimonials-swiper', {
    slidesPerView: 1,
    spaceBetween: 16,
    loop: true,
    autoplay: {
      delay: 4500,
      disableOnInteraction: false
    },
    pagination: {
      el: '.testimonials-pagination',
      clickable: true
    },
    breakpoints: {
      768: { slidesPerView: 2 },
      1024: { slidesPerView: 3 }
    }
  });
}

function initYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
