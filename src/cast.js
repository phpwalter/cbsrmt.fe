const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const CAST_FALLBACK = '/assets/images/cast-silhouette.svg';
const PAGE_SIZE = 10;

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatDate = (value) => {
  if (!value) return 'Unknown';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const personName = (person) =>
  person?.display_name ||
  [person?.first_name, person?.last_name].filter(Boolean).join(' ') ||
  'Unknown cast member';

const applyPortraitFallback = (image) => {
  image.addEventListener('error', () => {
    if (image.src.endsWith(CAST_FALLBACK)) return;
    image.src = CAST_FALLBACK;
    image.classList.add('is-fallback');
  });
};

export const initCastPage = () => {
  const page = document.querySelector('.cast-page-main');
  if (!page) return;

  const searchInput = document.querySelector('[data-cast-search]');
  const sortSelect = document.querySelector('[data-cast-sort]');
  const alpha = document.querySelector('[data-cast-alpha]');
  const grid = document.querySelector('[data-cast-grid]');
  const pagination = document.querySelector('[data-cast-pagination]');
  const total = document.querySelector('[data-cast-total]');
  const status = document.querySelector('[data-cast-status]');
  const detail = document.querySelector('[data-cast-detail]');

  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.initial = letter;
    button.textContent = letter;
    alpha.insertBefore(button, alpha.querySelector('[data-initial=""]'));
  });

  const params = new URLSearchParams(window.location.search);
  const sortParts = (params.get('sort') || 'appearances:desc').split(':');
  const state = {
    search: params.get('search') || '',
    initial: params.get('initial') || '',
    sort: ['appearances', 'name'].includes(sortParts[0]) ? sortParts[0] : 'appearances',
    order: ['asc', 'desc'].includes(sortParts[1]) ? sortParts[1] : 'desc',
    page: Math.max(parseInt(params.get('page') || '1', 10) || 1, 1),
    selected: parseInt(params.get('cast') || '', 10) || null,
    pages: 0,
  };

  searchInput.value = state.search;
  sortSelect.value = `${state.sort}:${state.order}`;

  const syncUrl = ({ replace = false } = {}) => {
    const next = new URLSearchParams();
    if (state.search) next.set('search', state.search);
    if (state.initial) next.set('initial', state.initial);
    if (state.sort !== 'appearances' || state.order !== 'desc') next.set('sort', `${state.sort}:${state.order}`);
    if (state.page !== 1) next.set('page', String(state.page));
    if (state.selected) next.set('cast', String(state.selected));
    const url = `${window.location.pathname}${next.toString() ? `?${next}` : ''}`;
    history[replace ? 'replaceState' : 'pushState']({}, '', url);
  };

  const fetchJson = async (path) => {
    const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return response.json();
  };

  const updateAlpha = () => {
    alpha.querySelectorAll('button').forEach((button) => {
      button.classList.toggle('active', button.dataset.initial === state.initial);
    });
  };

  const updateSelectedCard = () => {
    grid.querySelectorAll('.cast-card').forEach((card) => {
      const selected = Number(card.dataset.castId) === state.selected;
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-current', selected ? 'true' : 'false');
    });
  };

  const renderDetail = (person, episodesPayload) => {
    const episodes = episodesPayload.data || [];
    const count = person.appearance_count ?? episodesPayload.pagination?.total ?? 0;
    const name = personName(person);

    detail.innerHTML = `
      <div class="cast-detail-top">
        <img class="cast-detail-image" src="${person.portrait || `/assets/cast/${person.id}.png`}" alt="${escapeHtml(name)}">
        <div class="cast-detail-copy">
          <p class="cast-detail-label">Featured cast member</p>
          <h2>${escapeHtml(name)}</h2>
          <p class="cast-detail-meta">${count} appearance${count === 1 ? '' : 's'} <span>|</span> Actor</p>
          <div class="cast-detail-rule"></div>
          <p class="cast-detail-summary">This catalog record is credited in ${count} CBS Radio Mystery Theater episode${count === 1 ? '' : 's'}.</p>
        </div>
      </div>
      <section class="cast-episode-section">
        <div class="cast-episode-heading">
          <h3>Select Episodes</h3>
          <a href="/episodes.html?cast=${encodeURIComponent(name)}">View all episodes →</a>
        </div>
        <div class="cast-episode-list">
          ${episodes.length ? episodes.map((episode) => `
            <a class="cast-episode-row" href="/episodes.html?episode=${episode.episode_number}">
              <span class="cast-episode-play" aria-hidden="true">▶</span>
              <span class="cast-episode-title">${escapeHtml(episode.episode_name)}</span>
              <span class="cast-episode-date">${formatDate(episode.broadcast_date)}</span>
            </a>
          `).join('') : '<p class="cast-detail-empty">No episode history is available.</p>'}
        </div>
      </section>
    `;

    applyPortraitFallback(detail.querySelector('.cast-detail-image'));
  };

  const loadDetail = async (id) => {
    if (!id) return;
    detail.setAttribute('aria-busy', 'true');
    try {
      const [person, episodes] = await Promise.all([
        fetchJson(`/cast/${id}`),
        fetchJson(`/cast/${id}/episodes?page=1&limit=5&sort=broadcast_date&order=asc`),
      ]);
      renderDetail(person, episodes);
    } catch (error) {
      console.error('Unable to load cast member:', error);
      detail.innerHTML = '<div class="cast-detail-empty">Cast details are temporarily unavailable.</div>';
    } finally {
      detail.removeAttribute('aria-busy');
    }
  };

  const selectCast = (id, { updateUrl = true } = {}) => {
    state.selected = id;
    updateSelectedCard();
    if (updateUrl) syncUrl();
    loadDetail(id);
  };

  const renderGrid = (people) => {
    grid.replaceChildren();
    people.forEach((person) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'cast-card';
      card.dataset.castId = String(person.id);
      const name = personName(person);
      const count = person.appearance_count ?? 0;
      card.innerHTML = `
        <img src="${person.portrait || `/assets/cast/${person.id}.png`}" alt="${escapeHtml(name)}">
        <span class="cast-card-name">${escapeHtml(name)}</span>
        <span class="cast-card-count">${count} appearance${count === 1 ? '' : 's'}</span>
      `;
      applyPortraitFallback(card.querySelector('img'));
      card.addEventListener('click', () => selectCast(person.id));
      grid.appendChild(card);
    });
    updateSelectedCard();
  };

  const renderPagination = () => {
    pagination.replaceChildren();
    if (state.pages <= 1) return;

    const values = new Set([1, state.pages, state.page - 1, state.page, state.page + 1]);
    const pages = [...values].filter((value) => value >= 1 && value <= state.pages).sort((a, b) => a - b);
    let prior = 0;
    pages.forEach((value) => {
      if (prior && value - prior > 1) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '…';
        pagination.appendChild(ellipsis);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(value);
      button.classList.toggle('active', value === state.page);
      if (value === state.page) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => {
        if (value === state.page) return;
        state.page = value;
        state.selected = null;
        syncUrl();
        loadCast();
      });
      pagination.appendChild(button);
      prior = value;
    });
  };

  const loadCast = async () => {
    status.hidden = false;
    status.textContent = 'Loading cast…';

    const query = new URLSearchParams({
      page: String(state.page),
      limit: String(PAGE_SIZE),
      sort: state.sort,
      order: state.order,
    });
    if (state.search) query.set('search', state.search);
    if (state.initial) query.set('initial', state.initial);

    try {
      const payload = await fetchJson(`/cast?${query}`);
      const people = payload.data || [];
      state.page = payload.pagination.page;
      state.pages = payload.pagination.pages;
      total.textContent = `${payload.pagination.total.toLocaleString('en-US')} cast members`;

      if (!people.length) {
        grid.replaceChildren();
        pagination.replaceChildren();
        state.selected = null;
        detail.innerHTML = '<div class="cast-detail-empty">No cast member matches the current filters.</div>';
        status.textContent = 'No cast members found.';
        syncUrl({ replace: true });
        return;
      }

      if (!people.some((person) => person.id === state.selected)) {
        state.selected = people[0].id;
      }

      renderGrid(people);
      renderPagination();
      updateAlpha();
      status.hidden = true;
      syncUrl({ replace: true });
      loadDetail(state.selected);
    } catch (error) {
      console.error('Unable to load cast:', error);
      status.hidden = false;
      status.textContent = 'Cast data is temporarily unavailable.';
    }
  };

  alpha.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-initial]');
    if (!button) return;
    state.initial = button.dataset.initial;
    state.page = 1;
    state.selected = null;
    updateAlpha();
    syncUrl();
    loadCast();
  });

  searchInput.addEventListener('input', debounce(() => {
    state.search = searchInput.value.trim();
    state.page = 1;
    state.selected = null;
    syncUrl();
    loadCast();
  }, 300));

  sortSelect.addEventListener('change', () => {
    [state.sort, state.order] = sortSelect.value.split(':');
    state.page = 1;
    state.selected = null;
    syncUrl();
    loadCast();
  });

  window.addEventListener('popstate', () => window.location.reload());

  updateAlpha();
  loadCast();
};
