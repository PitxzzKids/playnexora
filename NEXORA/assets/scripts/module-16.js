
(() => {
  'use strict';
  const startLenis = () => {
    if (!window.Lenis) {
      console.warn('NEXORA: Lenis CDN gagal dimuat; browser memakai native scrolling.');
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.nexoraLenis) return;

    const lenis = new window.Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.05,
      infinite: false,
      autoRaf: false
    });

    window.nexoraLenis = lenis;

    // Keep GSAP ScrollTrigger synchronized with Lenis.
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(time => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = time => {
        if (!window.nexoraLenis) return;
        lenis.raf(time);
        window.requestAnimationFrame(raf);
      };
      window.requestAnimationFrame(raf);
    }

    // Make in-page anchors use Lenis instead of native jump scrolling.
    document.addEventListener('click', event => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      let target;
      try { target = document.querySelector(href); } catch (_) { return; }
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -18, duration: 1.05 });
    });

    // Keep public scrollTo navigation compatible with the existing NEXORA menu.
    window.addEventListener('beforeunload', () => lenis.destroy(), { once: true });
    console.info('NEXORA: Lenis smooth scrolling aktif.');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLenis, { once: true });
  } else {
    startLenis();
  }
})();
