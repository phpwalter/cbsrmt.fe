import './styles.css';
import { renderSiteHeader } from './components/header.js';
import { renderSiteFooter } from './components/footer.js';
import { initEpisodesPage } from './episodes.js';
import { initCastPage } from './cast.js';
import { initWritersPage } from './writers.js';

const currentPage = document.body.dataset.page || 'home';
renderSiteHeader(document.querySelector('[data-site-header]'), { active: currentPage });
renderSiteFooter(document.querySelector('[data-site-footer]'));

if (currentPage === 'episodes') {
  initEpisodesPage();
}

if (currentPage === 'cast') {
  initCastPage();
}

if (currentPage === 'writers') {
  initWritersPage();
}

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

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const EPISODE_IMAGE_FALLBACK = '/assets/images/cbsrmt4-wht.png';

const formatApiDate = (value) => {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const playEpisodeAudio = (streamUrl, button) => {
  if (!streamUrl) return;

  const audio = new Audio(streamUrl);
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');

  const restore = () => {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  };

  audio.addEventListener('ended', restore, { once: true });
  audio.addEventListener('error', restore, { once: true });
  audio.play().catch(restore);
};

const createEpisodeCard = (broadcast, multiple) => {
  const episode = broadcast.episode;
  const article = document.createElement('article');
  article.className = 'episode-card anniversary-episode-card';

  const episodeNumber = String(episode.episode_number).padStart(4, '0');
  const titleId = `anniversary-episode-${episodeNumber}-title`;
  article.setAttribute('aria-labelledby', titleId);

  const imageRegion = document.createElement('div');
  imageRegion.className = 'episode-card-image-region';

  const image = document.createElement('img');
  image.alt = episode.episode_name;
  image.addEventListener('error', () => {
    if (image.src.endsWith(EPISODE_IMAGE_FALLBACK)) return;
    image.classList.add('is-fallback-artwork');
    image.src = EPISODE_IMAGE_FALLBACK;
  });
  image.src = episode.thumbnail || `/assets/episodes/${episodeNumber}.png`;
  imageRegion.appendChild(image);

  const copy = document.createElement('div');
  copy.className = 'episode-card-copy';

  const titleRow = document.createElement('div');
  titleRow.className = 'episode-card-title-row';

  const titleBlock = document.createElement('div');

  const title = document.createElement('h3');
  title.id = titleId;
  title.className = 'episode-card-title';

  const titleLink = document.createElement('a');
  titleLink.href = `/episode.html?episode=${episode.episode_number}`;
  titleLink.textContent = episode.episode_name;
  title.appendChild(titleLink);

  const number = document.createElement('p');
  number.className = 'episode-card-number';
  number.textContent = `Episode ${episode.episode_number} · ${broadcast.broadcast_type}`;

  titleBlock.append(title, number);

  const play = document.createElement('button');
  play.className = 'episode-card-play';
  play.type = 'button';
  play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.5v9l7-4.5-7-4.5z"></path></svg>';

  const audioAvailable = Boolean(episode.audio?.available && episode.audio?.stream_url);
  if (audioAvailable) {
    play.setAttribute('aria-label', `Play ${episode.episode_name}`);
    play.addEventListener('click', () => playEpisodeAudio(episode.audio.stream_url, play));
  } else {
    play.disabled = true;
    play.classList.add('is-unavailable');
    play.setAttribute('aria-label', `Audio unavailable for ${episode.episode_name}`);
  }

  titleRow.append(titleBlock, play);
  copy.appendChild(titleRow);

  if (!multiple && episode.episode_plot) {
    const description = document.createElement('p');
    description.className = 'episode-card-description';
    description.textContent = episode.episode_plot;
    copy.appendChild(description);
  }

  article.append(imageRegion, copy);
  return article;
};

const loadAnniversaryEpisodes = async () => {
  const dateElement = document.querySelector('[data-anniversary-date]');
  const fallbackElement = document.querySelector('[data-anniversary-fallback]');
  const cardsElement = document.querySelector('[data-anniversary-cards]');
  const errorElement = document.querySelector('[data-anniversary-error]');

  if (!dateElement || !cardsElement) return;

  try {
    const response = await fetch(`${apiBaseUrl}/episode/today`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const payload = await response.json();
    const displayDate = payload.resolved_broadcast_date || payload.anniversary_date;

    dateElement.textContent = formatApiDate(displayDate);
    cardsElement.replaceChildren();
    errorElement.hidden = true;

    if (payload.fallback_used) {
      fallbackElement.textContent =
        `No broadcast aired on ${formatApiDate(payload.anniversary_date)}. Showing the most recent prior broadcast.`;
      fallbackElement.hidden = false;
    } else {
      fallbackElement.hidden = true;
    }

    if (!payload.broadcasts.length) {
      cardsElement.textContent = 'No historical broadcast is available.';
      return;
    }

    const multiple = payload.broadcasts.length > 1;
    cardsElement.classList.toggle('is-multiple', multiple);

    payload.broadcasts.forEach((broadcast) => {
      cardsElement.appendChild(createEpisodeCard(broadcast, multiple));
    });
  } catch (error) {
    console.error('Unable to load anniversary broadcast:', error);
    dateElement.textContent = '';
    fallbackElement.hidden = true;
    cardsElement.replaceChildren();
    errorElement.hidden = false;
  }
};

loadAnniversaryEpisodes();

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
