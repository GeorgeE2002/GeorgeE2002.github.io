document.documentElement.classList.add('js-ready');

// Start with the device preference; an explicit visitor choice is remembered.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionToggle = document.querySelector('.motion-toggle');
const entranceAnimations = new Set();
const revealedElements = new WeakSet();
let entranceObserver = null;
let motionChoice = null;

try {
  const savedChoice = window.localStorage.getItem('portfolio-motion');
  if (savedChoice === 'on' || savedChoice === 'off') motionChoice = savedChoice;
} catch {
  // The switch still works when the browser blocks local storage.
}

function motionEnabled() {
  return motionChoice === null ? !reducedMotion.matches : motionChoice === 'on';
}

// Content stays visible by default. Animate each section once as it enters view.
function startEntrances() {
  if (!('IntersectionObserver' in window) || !('animate' in Element.prototype)) return;

  const heroDelays = new WeakMap();

  document.querySelectorAll('.hero').forEach((hero) => {
    [...hero.children].forEach((element, index) => {
      heroDelays.set(element, Math.min(index * 55, 220));
    });
  });

  entranceObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        entranceObserver.unobserve(element);
        revealedElements.add(element);

        if (!motionEnabled() || element.contains(document.activeElement)) return;

        const animation = element.animate(
          [
            { opacity: 0, transform: 'translateY(16px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          {
            duration: 580,
            delay: heroDelays.get(element) || 0,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'backwards',
          },
        );

        entranceAnimations.add(animation);
        animation.finished.catch(() => {}).finally(() => entranceAnimations.delete(animation));
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
  );

  document
    .querySelectorAll(
      '.hero > *, .project, .category, .about > div, .case-gallery > figure, .case-copy > section, .lab, .footer-top',
    )
    .forEach((element) => {
      if (!revealedElements.has(element)) entranceObserver.observe(element);
    });
}

function updateMotion() {
  entranceObserver?.disconnect();
  entranceAnimations.forEach((animation) => animation.cancel());
  entranceAnimations.clear();

  const enabled = motionEnabled();
  document.documentElement.classList.toggle('motion-enabled', enabled);

  if (motionToggle) {
    motionToggle.hidden = false;
    motionToggle.setAttribute('aria-pressed', String(enabled));
    motionToggle.textContent = `Animationer: ${enabled ? 'på' : 'av'}`;
    motionToggle.title = enabled ? 'Stäng av animationer' : 'Slå på animationer';
  }

  if (enabled) startEntrances();
}

motionToggle?.addEventListener('click', () => {
  motionChoice = motionEnabled() ? 'off' : 'on';

  try {
    window.localStorage.setItem('portfolio-motion', motionChoice);
  } catch {
    // Keep the choice for this page even if persistence is unavailable.
  }

  updateMotion();
});

reducedMotion.addEventListener('change', () => {
  if (motionChoice === null) updateMotion();
});

updateMotion();

const menu = document.querySelector('.menu-toggle');

const nav = document.querySelector('#main-nav');

if (menu && nav) {
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      menu.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      menu.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      menu.focus();
    }
  });
}

const dialog = document.querySelector('.image-viewer');

if (dialog) {
  const image = dialog.querySelector('img'),
    caption = dialog.querySelector('p'),
    close = dialog.querySelector('.image-close');
  let trigger = null;
  document.querySelectorAll('[data-image]').forEach((button) =>
    button.addEventListener('click', () => {
      trigger = button;
      image.src = button.dataset.image;
      image.alt = button.querySelector('img')?.alt || '';
      caption.textContent = button.dataset.caption || '';
      dialog.showModal();
    }),
  );
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    trigger?.focus();
  });
}
