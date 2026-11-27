
(() => {
  'use strict';

  const boot = () => {
    const main = document.getElementById('mainContent');
    if (!main) return;

    const gsapReady = !!(window.gsap && window.ScrollTrigger);
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (gsapReady) gsap.registerPlugin(ScrollTrigger);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prepared = new WeakSet();

    function splitWords(heading) {
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
      }

      nodes.forEach(node => {
        const frag = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const word = document.createElement('span');
            word.className = 'nexora-word';
            word.textContent = part;
            frag.appendChild(word);
          }
        });
        node.parentNode.replaceChild(frag, node);
      });
    }

    function animateHeading(heading) {
      if (prepared.has(heading) || heading.dataset.wordRevealReady === '1') return;
      prepared.add(heading);
      heading.dataset.wordRevealReady = '1';
      splitWords(heading);

      const words = heading.querySelectorAll('.nexora-word');
      if (!words.length || reduced) return;

      // Keep text visible at all times; animate position only.
      if (gsapReady) {
        gsap.set(words, {
          display: 'inline-block',
          opacity: 1,
          y: 0,
          transformOrigin: '50% 100%',
          willChange: 'transform'
        });

        ScrollTrigger.create({
          trigger: heading,
          start: 'top 88%',
          once: true,
          onEnter: () => gsap.fromTo(words,
            { y: 18, rotateX: -18 },
            {
              y: 0,
              rotateX: 0,
              duration: 0.62,
              stagger: 0.055,
              ease: 'power3.out',
              overwrite: 'auto',
              onComplete: () => gsap.set(words, { clearProps: 'willChange' })
            }
          )
        });
      } else if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll('.nexora-word').forEach((word, index) => {
              word.animate(
                [{ transform: 'translateY(18px) rotateX(-18deg)' },
                 { transform: 'translateY(0) rotateX(0)' }],
                { duration: 620, delay: index * 55, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }
              );
            });
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.12 });
        observer.observe(heading);
      }
    }

    function scan(scope) {
      if (!scope) return;
      scope.querySelectorAll('h1, h2, h3').forEach(animateHeading);
      if (gsapReady) requestAnimationFrame(() => ScrollTrigger.refresh());
    }

    function scanActive() {
      const active = main.querySelector('.view.on');
      if (active) scan(active);
    }

    scanActive();

    document.addEventListener('click', event => {
      if (!event.target.closest('[data-v]')) return;
      setTimeout(scanActive, 260);
      if (gsapReady) setTimeout(() => ScrollTrigger.refresh(), 420);
    }, true);

    const observer = new MutationObserver(() => {
      const active = main.querySelector('.view.on');
      if (!active) return;
      active.querySelectorAll('h1, h2, h3').forEach(animateHeading);
      if (gsapReady) requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    observer.observe(main, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class']
    });

    if (gsapReady) {
      window.addEventListener('load', () => {
        scanActive();
        ScrollTrigger.refresh();
      }, { once: true });
      window.addEventListener('resize', () => ScrollTrigger.refresh(), { passive: true });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
