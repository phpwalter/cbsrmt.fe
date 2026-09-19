const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const PAGE_SIZE = 5;
const EPISODE_IMAGE_FALLBACK = '/assets/images/cbsrmt4-wht.png';

const formatDate = (value) => {
  if (!value) return 'Unknown';
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return value;
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const episodeNumber = (value) => String(value).padStart(4, '0');

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const useEpisodeImageFallback = (image) => {
  if (!image) return;
  image.addEventListener('error', () => {
    if (image.src.endsWith(EPISODE_IMAGE_FALLBACK)) return;
    image.classList.add('is-fallback-artwork');
    image.src = EPISODE_IMAGE_FALLBACK;
  });
};

const textName = (person) =>
  person?.display_name ||
  [person?.first_name, person?.last_name].filter(Boolean).join(' ') ||
  'Unknown';

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
};

export const initEpisodesPage = () => {
  const root = document.querySelector('.episodes-page-main');
  if (!root) return;

  const searchInput = document.querySelector('[data-episodes-search]');
  const genresContainer = document.querySelector('[data-episodes-genres]');
  const yearSelect = document.querySelector('[data-episodes-year]');
  const sortSelect = document.querySelector('[data-episodes-sort]');
  const clearButton = document.querySelector('[data-episodes-clear]');
  const totalElement = document.querySelector('[data-episodes-total]');
  const pageCountElement = document.querySelector('[data-episodes-page-count]');
  const prevButton = document.querySelector('[data-episodes-prev]');
  const nextButton = document.querySelector('[data-episodes-next]');
  const listElement = document.querySelector('[data-episodes-list]');
  const paginationElement = document.querySelector('[data-episodes-pagination]');
  const statusElement = document.querySelector('[data-episodes-status]');
  const previewElement = document.querySelector('[data-episodes-preview]');

  const params = new URLSearchParams(window.location.search);
  const initialSort = params.get('sort') || 'episode_number';
  const initialOrder = params.get('order') || 'asc';

  const state = {
    search: params.get('search') || '',
    year: params.get('year') || '',
    cast: params.get('cast') || '',
    genres: params.getAll('genre'),
    sort: ['episode_number', 'episode_name', 'broadcast_date'].includes(initialSort)
      ? initialSort
      : 'episode_number',
    order: ['asc', 'desc'].includes(initialOrder) ? initialOrder : 'asc',
    page: Math.max(Number.parseInt(params.get('page') || '1', 10) || 1, 1),
    selectedEpisode: Number.parseInt(params.get('episode') || '', 10) || null,
    focusEpisode: Number.parseInt(params.get('episode') || '', 10) || null,
    pages: 0,
  };

  let requestSequence = 0;

  const setStatus = (message = '') => {
    statusElement.textContent = message;
    statusElement.hidden = !message;
  };

  const syncUrl = ({ replace = false } = {}) => {
    const next = new URLSearchParams();
    if (state.search) next.set('search', state.search);
    if (state.year) next.set('year', state.year);
    if (state.cast) next.set('cast', state.cast);
    state.genres.forEach((genre) => next.append('genre', genre));
    if (state.sort !== 'episode_number') next.set('sort', state.sort);
    if (state.order !== 'asc') next.set('order', state.order);
    if (state.page !== 1) next.set('page', String(state.page));
    if (state.selectedEpisode) next.set('episode', String(state.selectedEpisode));

    const url = `${window.location.pathname}${next.toString() ? `?${next}` : ''}`;
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
  };

  const fetchJson = async (path) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    return response.json();
  };

  const updateSelectedRow = () => {
    listElement.querySelectorAll('.episodes-list-item').forEach((row) => {
      const selected = Number(row.dataset.episodeNumber) === state.selectedEpisode;
      row.classList.toggle('is-selected', selected);
      row.setAttribute('aria-current', selected ? 'true' : 'false');
    });
  };

  const renderPreview = (episode) => {
    const genres = (episode.genres || []).map((genre) => escapeHtml(genre.name)).join(', ') || '—';
    const writers = (episode.writers || []).map((person) => escapeHtml(textName(person))).join(', ') || '—';
    const cast = (episode.cast || []).map((person) => escapeHtml(textName(person))).join('<br>') || '—';
    const number = episodeNumber(episode.episode_number);
    const audioAvailable = Boolean(episode.audio?.available && episode.audio?.stream_url);

    previewElement.innerHTML = `
      <img class="episodes-preview-image" src="${episode.thumbnail || `/assets/episodes/${number}.png`}" alt="${escapeHtml(episode.episode_name)}">
      <div class="episodes-preview-header">
        <div>
          <h2>${escapeHtml(episode.episode_name)}</h2>
          <p>Episode ${number} <span>|</span> ${formatDate(episode.broadcast_date)}</p>
        </div>
        <button class="episodes-preview-play${audioAvailable ? '' : ' is-unavailable'}"
          type="button"
          aria-label="${audioAvailable ? `Play ${escapeHtml(episode.episode_name)}` : `Audio unavailable for ${escapeHtml(episode.episode_name)}`}"
          ${audioAvailable ? '' : 'disabled'}>▶</button>
      </div>
      <p class="episodes-preview-description">${escapeHtml(episode.episode_plot || 'No episode description is available.')}</p>
      <div class="episodes-preview-rule" aria-hidden="true"></div>
      <div class="episodes-preview-lower episodes-preview-lower-single">
        <dl class="episodes-details">
          <div><dt>Episode Number</dt><dd>${number}</dd></div>
          <div><dt>Original Air Date</dt><dd>${formatDate(episode.broadcast_date)}</dd></div>
          <div><dt>Category</dt><dd>${genres}</dd></div>
          <div><dt>Writer</dt><dd>${writers}</dd></div>
          <div><dt>Starring</dt><dd>${cast}</dd></div>
        </dl>
      </div>
    `;

    useEpisodeImageFallback(previewElement.querySelector('.episodes-preview-image'));

    if (audioAvailable) {
      previewElement.querySelector('.episodes-preview-play').addEventListener('click', (event) => {
        const button = event.currentTarget;
        const audio = new Audio(episode.audio.stream_url);
        button.disabled = true;
        const restore = () => { button.disabled = false; };
        audio.addEventListener('ended', restore, { once: true });
        audio.addEventListener('error', restore, { once: true });
        audio.play().catch(restore);
      });
    }
  };

  const loadDetail = async (number) => {
    if (!number) {
      previewElement.innerHTML = '<div class="episodes-preview-empty">Select an episode to view details.</div>';
      return;
    }
    previewElement.setAttribute('aria-busy', 'true');
    try {
      const episode = await fetchJson(`/episodes/${number}`);
      renderPreview(episode);
    } catch (error) {
      console.error('Unable to load episode details:', error);
      previewElement.innerHTML = '<div class="episodes-preview-empty">Episode details are temporarily unavailable.</div>';
    } finally {
      previewElement.removeAttribute('aria-busy');
    }
  };

  const selectEpisode = async (number, { updateUrl = true } = {}) => {
    state.selectedEpisode = number;
    updateSelectedRow();
    if (updateUrl) syncUrl();
    await loadDetail(number);
  };

  const renderList = (episodes) => {
    listElement.replaceChildren();

    episodes.forEach((episode) => {
      const number = episodeNumber(episode.episode_number);
      const row = document.createElement('article');
      row.className = 'episodes-list-item';
      row.dataset.episodeNumber = String(episode.episode_number);
      row.tabIndex = 0;
      row.innerHTML = `
        <span class="episodes-current-indicator" aria-hidden="true"></span>
        <img src="${episode.thumbnail || `/assets/episodes/${number}.png`}" alt="${escapeHtml(episode.episode_name)}">
        <div class="episodes-list-copy">
          <h3>${escapeHtml(episode.episode_name)}</h3>
          <p class="episodes-meta">Episode ${number} <span>|</span> ${formatDate(episode.broadcast_date)}</p>
          <p>${escapeHtml(episode.episode_plot || 'No episode description is available.')}</p>
        </div>
      `;
      useEpisodeImageFallback(row.querySelector('img'));

      const activate = () => selectEpisode(episode.episode_number);
      row.addEventListener('click', activate);
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
      listElement.appendChild(row);
    });

    updateSelectedRow();
  };

  const paginationWindow = (page, pages) => {
    if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
    const values = new Set([1, pages, page - 1, page, page + 1]);
    const sorted = [...values].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b);
    const output = [];
    sorted.forEach((value, index) => {
      if (index && value - sorted[index - 1] > 1) output.push('ellipsis');
      output.push(value);
    });
    return output;
  };

  const renderPagination = () => {
    paginationElement.replaceChildren();
    paginationWindow(state.page, state.pages).forEach((value) => {
      if (value === 'ellipsis') {
        const span = document.createElement('span');
        span.textContent = '…';
        paginationElement.appendChild(span);
        return;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(value);
      button.classList.toggle('active', value === state.page);
      button.setAttribute('aria-label', `Page ${value}`);
      if (value === state.page) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => {
        if (value === state.page) return;
        state.page = value;
        state.selectedEpisode = null;
        syncUrl();
        loadEpisodes();
      });
      paginationElement.appendChild(button);
    });

    prevButton.disabled = state.page <= 1;
    nextButton.disabled = state.pages === 0 || state.page >= state.pages;
  };

  const loadEpisodes = async ({ replaceUrl = false } = {}) => {
    const sequence = ++requestSequence;
    setStatus('Loading episodes…');

    const query = new URLSearchParams({
      page: String(state.page),
      limit: String(PAGE_SIZE),
      sort: state.sort,
      order: state.order,
    });
    if (state.search) query.set('search', state.search);
    if (state.year) query.set('year', state.year);
    if (state.cast) query.set('cast', state.cast);
    if (state.focusEpisode) query.set('episode', String(state.focusEpisode));
    state.genres.forEach((genre) => query.append('genre', genre));

    try {
      const payload = await fetchJson(`/episodes?${query}`);
      if (sequence !== requestSequence) return;

      state.page = payload.pagination.page;
      state.pages = payload.pagination.pages;
      const episodes = payload.data || [];
      const requestedFocusEpisode = state.focusEpisode;
      state.focusEpisode = null;

      totalElement.textContent = `${payload.pagination.total.toLocaleString('en-US')} Episodes`;
      pageCountElement.textContent = state.pages
        ? `Page ${state.page} of ${state.pages}`
        : 'No pages';

      if (!episodes.length) {
        listElement.replaceChildren();
        paginationElement.replaceChildren();
        state.selectedEpisode = null;
        previewElement.innerHTML = '<div class="episodes-preview-empty">No episode matches the current filters.</div>';
        setStatus('No episodes found.');
        syncUrl({ replace: true });
        renderPagination();
        return;
      }

      const selectedOnPage = episodes.some((episode) => episode.episode_number === state.selectedEpisode);
      if (requestedFocusEpisode && episodes.some((episode) => episode.episode_number === requestedFocusEpisode)) {
        state.selectedEpisode = requestedFocusEpisode;
      } else if (!selectedOnPage) {
        state.selectedEpisode = episodes[0].episode_number;
      }

      renderList(episodes);
      renderPagination();
      setStatus('');
      syncUrl({ replace: true });
      await loadDetail(state.selectedEpisode);
    } catch (error) {
      console.error('Unable to load episodes:', error);
      listElement.replaceChildren();
      paginationElement.replaceChildren();
      setStatus('Episodes are temporarily unavailable.');
    }
  };

  const loadGenres = async () => {
    genresContainer.textContent = 'Loading categories…';
    try {
      const payload = await fetchJson('/genres');
      genresContainer.replaceChildren();
      (payload.data || []).forEach((genre) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = genre.name;
        checkbox.checked = state.genres.includes(genre.name);
        checkbox.addEventListener('change', () => {
          state.genres = [...genresContainer.querySelectorAll('input:checked')].map((input) => input.value);
          state.page = 1;
          state.selectedEpisode = null;
          syncUrl();
          loadEpisodes();
        });
        label.append(checkbox, document.createTextNode(` ${genre.name}`));
        genresContainer.appendChild(label);
      });
    } catch (error) {
      console.error('Unable to load genres:', error);
      genresContainer.textContent = 'Categories unavailable.';
    }
  };

  const resetAndLoad = () => {
    state.page = 1;
    state.selectedEpisode = null;
    state.focusEpisode = null;
    syncUrl();
    loadEpisodes();
  };

  searchInput.value = state.search;
  yearSelect.value = state.year;
  sortSelect.value = `${state.sort}:${state.order}`;

  searchInput.addEventListener('input', debounce(() => {
    state.search = searchInput.value.trim();
    resetAndLoad();
  }, 300));

  yearSelect.addEventListener('change', () => {
    state.year = yearSelect.value;
    resetAndLoad();
  });

  sortSelect.addEventListener('change', () => {
    [state.sort, state.order] = sortSelect.value.split(':');
    resetAndLoad();
  });

  clearButton.addEventListener('click', () => {
    state.search = '';
    state.year = '';
    state.cast = '';
    state.genres = [];
    state.sort = 'episode_number';
    state.order = 'asc';
    state.page = 1;
    state.selectedEpisode = null;

    searchInput.value = '';
    yearSelect.value = '';
    sortSelect.value = 'episode_number:asc';
    genresContainer.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = false;
    });

    syncUrl();
    loadEpisodes();
  });

  prevButton.addEventListener('click', () => {
    if (state.page <= 1) return;
    state.page -= 1;
    state.selectedEpisode = null;
    state.focusEpisode = null;
    syncUrl();
    loadEpisodes();
  });

  nextButton.addEventListener('click', () => {
    if (!state.pages || state.page >= state.pages) return;
    state.page += 1;
    state.selectedEpisode = null;
    state.focusEpisode = null;
    syncUrl();
    loadEpisodes();
  });

  window.addEventListener('popstate', () => window.location.reload());

  loadGenres();
  loadEpisodes({ replaceUrl: true });
};
