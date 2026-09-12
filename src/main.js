import './styles.css';

const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const fallbackEpisodes = [
  {
    title: 'The Hitchhiker',
    showNumber: 1,
    airDate: 'Classic suspense',
    description: 'A routine journey bends toward the unknown, where every mile makes the ordinary feel less certain.',
    image: '/assets/images/cbsrmt-studio.jpg',
  },
  {
    title: 'The 13th Floor',
    showNumber: 2,
    airDate: 'Psychological mystery',
    description: 'Some doors should remain closed — especially the ones nobody remembers building.',
    image: '/assets/images/images (1).jpg',
  },
  {
    title: 'Murder on the Midnight Express',
    showNumber: 3,
    airDate: 'Crime & suspense',
    description: 'A journey, a crime, and a compartment full of people who all seem to know too much.',
    image: '/assets/images/hyman-brown-agnes-moorhead.jpg',
  },
  {
    title: 'The Tell-Tale Call',
    showNumber: 4,
    airDate: 'Supernatural mystery',
    description: 'A telephone rings at the wrong hour, carrying a warning that refuses to stay in the past.',
    image: '/assets/images/41cEFADlVRL._AC_UF1000,1000_QL80_.jpg',
  },
];

const episodeImages = fallbackEpisodes.map((episode) => episode.image);
let searchableEpisodes = [...fallbackEpisodes];

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const normalizeApiEpisode = (episode, index) => ({
  title: episode.title || 'Untitled episode',
  showNumber:
    episode.canonicalNumber ??
    episode.canonical_number ??
    episode.showNumber ??
    episode.show_number ??
    episode.number ??
    index + 1,
  airDate: episode.originalAirDate || episode.original_air_date || episode.airDate || 'Archive episode',
  description: episode.synopsis || episode.description || 'A restored chapter from the CBS Radio Mystery Theater archive.',
  image: episodeImages[index % episodeImages.length],
});

const extractEpisodeArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  for (const key of ['items', 'episodes', 'data', 'results']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const renderEpisodes = (episodes) => {
  const grid = document.querySelector('[data-episode-grid]');
  if (!grid) return;

  grid.innerHTML = episodes
    .slice(0, 4)
    .map(
      (episode) => `
        <article class="episode-card">
          <div class="episode-art">
            <img src="${escapeHtml(episode.image)}" alt="" loading="lazy" />
          </div>
          <div class="episode-body">
            <h3>${escapeHtml(episode.title)}</h3>
            <p class="episode-meta">SHOW ${escapeHtml(episode.showNumber)} · ${escapeHtml(episode.airDate)}</p>
            <p class="episode-description">${escapeHtml(episode.description)}</p>
            <button class="episode-play" type="button" aria-label="Listen to ${escapeHtml(episode.title)}" data-play-title="${escapeHtml(episode.title)}">▶</button>
          </div>
        </article>
      `,
    )
    .join('');
};

const loadEpisodes = async () => {
  if (!apiBase) {
    renderEpisodes(fallbackEpisodes);
    return;
  }

  try {
    const response = await fetch(`${apiBase}/episodes?limit=24`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const payload = await response.json();
    const episodes = extractEpisodeArray(payload).map(normalizeApiEpisode);
    if (!episodes.length) throw new Error('API returned no episodes');

    searchableEpisodes = episodes;
    renderEpisodes(episodes);
  } catch (error) {
    console.info('CBSRMT API unavailable; using curated landing-page content.', error);
    renderEpisodes(fallbackEpisodes);
  }
};

const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('.primary-nav');

navToggle?.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!open));
  primaryNav?.classList.toggle('open', !open);
});

primaryNav?.addEventListener('click', (event) => {
  if (!(event.target instanceof HTMLAnchorElement)) return;
  primaryNav.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
});

const searchDialog = document.querySelector('[data-search-dialog]');
const searchInput = document.querySelector('[data-search-input]');
const searchResults = document.querySelector('[data-search-results]');

const openSearch = () => {
  if (!(searchDialog instanceof HTMLDialogElement)) return;
  searchDialog.showModal();
  requestAnimationFrame(() => searchInput?.focus());
};

document.querySelector('[data-search-open]')?.addEventListener('click', openSearch);

const performSearch = () => {
  const term = searchInput?.value.trim().toLowerCase() || '';
  if (!searchResults) return;

  if (!term) {
    searchResults.innerHTML = '<p>Enter a title, keyword, or show number.</p>';
    return;
  }

  const matches = searchableEpisodes.filter((episode) =>
    [episode.title, episode.description, episode.showNumber, episode.airDate]
      .join(' ')
      .toLowerCase()
      .includes(term),
  );

  searchResults.innerHTML = matches.length
    ? matches
        .slice(0, 8)
        .map(
          (episode) => `
            <div class="search-result">
              <strong>${escapeHtml(episode.title)}</strong>
              <small>Show ${escapeHtml(episode.showNumber)} · ${escapeHtml(episode.airDate)}</small>
            </div>
          `,
        )
        .join('')
    : '<p>No matching episodes were found in the currently loaded catalog.</p>';
};

document.querySelector('[data-search-submit]')?.addEventListener('click', performSearch);
searchInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    performSearch();
  }
});

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.getAttribute('data-filter');
    if (searchInput && filter && filter !== 'all') searchInput.value = filter;
    openSearch();
    if (filter === 'all') {
      searchResults.innerHTML = searchableEpisodes
        .slice(0, 8)
        .map(
          (episode) => `
            <div class="search-result">
              <strong>${escapeHtml(episode.title)}</strong>
              <small>Show ${escapeHtml(episode.showNumber)} · ${escapeHtml(episode.airDate)}</small>
            </div>
          `,
        )
        .join('');
    } else {
      performSearch();
    }
  });
});

document.querySelector('[data-episode-grid]')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-play-title]');
  if (!button) return;
  const title = button.getAttribute('data-play-title');
  button.textContent = '■';
  button.setAttribute('aria-label', `Audio player placeholder for ${title}`);
  window.setTimeout(() => {
    button.textContent = '▶';
    button.setAttribute('aria-label', `Listen to ${title}`);
  }, 1100);
});

const signupForm = document.querySelector('[data-signup-form]');
const formMessage = document.querySelector('[data-form-message]');

signupForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(signupForm);
  const email = String(form.get('email') || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    formMessage.textContent = 'Please enter a valid email address.';
    return;
  }

  formMessage.textContent = 'Thank you. The archive will be waiting in the dark.';
  signupForm.reset();
});

loadEpisodes();
