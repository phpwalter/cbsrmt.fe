import './styles.css';
import { renderSiteHeader } from './components/header.js';
import { renderSiteFooter } from './components/footer.js';

const activePage = document.body.dataset.page || 'home';
renderSiteHeader(document.querySelector('[data-site-header]'), { active: activePage });
renderSiteFooter(document.querySelector('[data-site-footer]'));

const preventPlaceholderNavigation = (event) => {
  const link = event.currentTarget;
  if (link.getAttribute('href') === '#') {
    event.preventDefault();
  }
};

document.querySelectorAll('.placeholder-link').forEach((link) => {
  link.addEventListener('click', preventPlaceholderNavigation);
});

document.querySelector('.search-placeholder')?.addEventListener('click', (event) => {
  event.preventDefault();
});

document.querySelector('[data-newsletter-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
});

const anniversaryDate = document.querySelector('[data-anniversary-date]');
if (anniversaryDate) {
  const today = new Date();
  const fiftyYearsAgo = new Date(today.getFullYear() - 50, today.getMonth(), today.getDate());
  anniversaryDate.textContent = fiftyYearsAgo.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const introAudio = document.querySelector('#rmt-intro');

if (introAudio) {
  const attemptPlayback = () => {
    introAudio.currentTime = 0;
    const playback = introAudio.play();

    if (playback?.catch) {
      playback.catch(() => {
        const resumeOnInteraction = () => {
          introAudio.play().catch(() => {});
          document.removeEventListener('pointerdown', resumeOnInteraction);
          document.removeEventListener('keydown', resumeOnInteraction);
        };

        document.addEventListener('pointerdown', resumeOnInteraction, { once: true });
        document.addEventListener('keydown', resumeOnInteraction, { once: true });
      });
    }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', attemptPlayback, { once: true });
  } else {
    attemptPlayback();
  }
}
