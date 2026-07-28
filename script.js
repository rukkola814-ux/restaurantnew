/* ========================================
   Restaurant Over Ocean — Scroll-Driven Video
   ========================================
   Video scrubbed by scroll via lerp + rAF.
   GSAP ScrollTrigger drives text fade-in/out.
   ======================================== */

(function () {
  'use strict';

  // ── DOM ──────────────────────────────────────────
  const video     = document.getElementById('bg-video');
  const indicator = document.querySelector('.scroll-indicator');
  const sections  = document.querySelectorAll('.scroll-section');

  // ── State — параллакс видео через translate3d ─────
  const videoContainer = document.querySelector('.video-container');
  let rafId = null;
  let targetY = 0;       // целевая позиция (px)
  let currentY = 0;      // текущая (lerp)
  const LERP_FACTOR = 0.12; // плавность (меньше = ещё плавнее)
  let MAX_OFFSET = Math.max(window.innerHeight * 0.12, 80); // макс смещение

  // ── Helpers ──────────────────────────────────────
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  // ── Video Ready ──────────────────────────────────
  function onVideoReady() {
    // Попробуем запустить видео (mute + playsinline разрешают autoplay в большинстве браузеров)
    video.play().catch(() => {
      // В случае блокировки автоплей — оставляем видео паузой, параллакс по-прежнему работает
    });

    initScrollAnimations();
    startRafLoop();
  }

  video.addEventListener('loadedmetadata', onVideoReady);
  if (video.readyState >= 1) onVideoReady();

  // ── rAF Loop — Smooth Seek ───────────────────────
  function startRafLoop() {
    function tick() {
      // Лерпим текущее значение к целевому
      currentY = lerp(currentY, targetY, LERP_FACTOR);

      // Если близко — снэп
      if (Math.abs(currentY - targetY) < 0.1) currentY = targetY;

      // Применяем GPU-ускоренный трансформ
      if (videoContainer) {
        videoContainer.style.transform = `translate3d(0, ${currentY}px, 0)`;
      }

      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  // ── Scroll → Target Time ─────────────────────────
  function updateTargetY() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) {
      targetY = 0;
      return;
    }
    const progress = clamp(window.scrollY / scrollHeight, 0, 1);

    // Смещаем видео вверх по мере скролла (параллакс). От 0 до -MAX_OFFSET
    targetY = -progress * MAX_OFFSET;
  }

  window.addEventListener('scroll', updateTargetY, { passive: true });
  window.addEventListener('resize', () => {
    MAX_OFFSET = Math.max(window.innerHeight * 0.12, 80);
    updateTargetY();
  }, { passive: true });

  // ── GSAP ScrollTrigger — Text Animations ─────────
  function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    sections.forEach((section, index) => {
      const content = section.querySelector('.section-content');
      const isFirst = index === 0;
      const isLast  = index === sections.length - 1;

      if (isFirst) {
        gsap.set(content, { opacity: 1, y: 0 });
      } else {
        // Entrance animation
        gsap.fromTo(content,
          {
            opacity: 0,
            y: 60
          },
          {
            opacity: 1,
            y: 0,
            duration: 1.4,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 88%',
              end: 'top 28%',
              scrub: 1.2,
              onEnter: () => {
                // Hide scroll indicator after first section
                if (index === 0) {
                  indicator.classList.add('hidden');
                }
              },
              onLeaveBack: () => {
                if (index === 0) {
                  indicator.classList.remove('hidden');
                }
              }
            }
          }
        );
      }

      // Exit animation (all except last)
      if (!isLast) {
        gsap.to(content, {
          opacity: 0,
          y: -28,
          duration: 1.2,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: section,
            start: 'bottom 55%',
            end: 'bottom 20%',
            scrub: 0.9
          }
        });
      } else {
        // Last section: stays centered, gentle scale
        gsap.fromTo(content,
          {
            scale: 0.95,
            opacity: 0
          },
          {
            scale: 1,
            opacity: 1,
            duration: 1.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 72%',
              end: 'top 18%',
              scrub: 1.3
            }
          }
        );
      }
    });

    // Scroll indicator hide on scroll
    ScrollTrigger.create({
      trigger: sections[0],
      start: 'top top',
      onLeave: () => indicator.classList.add('hidden'),
      onEnterBack: () => indicator.classList.remove('hidden')
    });
  }

  // ── Cleanup ──────────────────────────────────────
  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
  });

})();