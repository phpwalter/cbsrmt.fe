import './styles.css';

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
