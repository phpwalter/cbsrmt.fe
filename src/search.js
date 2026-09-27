const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const displayName = (person) =>
  person?.display_name ||
  [person?.first_name, person?.last_name].filter(Boolean).join(' ') ||
  'Unknown';

const fetchJson = async (path) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return response.json();
};

const resultLink = (item) => {
  if (item.type === 'episode') {
    return `/episodes.html?episode=${encodeURIComponent(item.id)}`;
  }
  if (item.type === 'cast') {
    return `/cast.html?cast=${encodeURIComponent(item.id)}`;
  }
  return `/writers.html?writer=${encodeURIComponent(item.id)}`;
};

const resultLabel = (type) => {
  if (type === 'episode') return 'EPISODE';
  if (type === 'cast') return 'CAST';
  return 'WRITER';
};

const resultImage = (item) => {
  if (item.type === 'episode') {
    return item.image || `/assets/episodes/${String(Number(item.id)).padStart(4, '0')}.png`;
  }
  return item.image || `/assets/cast/${item.id}.png`;
};

export const initSearchPage = () => {
  const page = document.querySelector('.search-page-main');
  if (!page) return;

  const form = document.querySelector('[data-site-search-form]');
  const input = document.querySelector('[data-site-search-input]');
  const filters = [...document.querySelectorAll('[data-search-type]')];
  const summary = document.querySelector('[data-search-summary]');
  const results = document.querySelector('[data-search-results]');

  const params = new URLSearchParams(window.location.search);
  const state = {
    query: params.get('q') || '',
    type: ['all', 'episodes', 'cast', 'writers'].includes(params.get('type'))
      ? params.get('type')
      : 'all',
  };

  const setActiveFilter = () => {
    filters.forEach((button) => {
      const active = button.dataset.searchType === state.type;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  const syncUrl = () => {
    const next = new URLSearchParams();
    if (state.query) next.set('q', state.query);
    if (state.type !== 'all') next.set('type', state.type);
    const url = `${window.location.pathname}${next.toString() ? `?${next}` : ''}`;
    window.history.replaceState({}, '', url);
  };

  const renderResults = (items) => {
    if (!items.length) {
      results.innerHTML = '<p class="search-empty">No matches were found.</p>';
      return;
    }

    results.innerHTML = items.map((item) => `
      <a class="search-result-card" href="${resultLink(item)}">
        <img src="${escapeHtml(resultImage(item))}" alt="" loading="lazy">
        <div class="search-result-copy">
          <div class="search-result-title-row">
            <h2>${escapeHtml(item.title)}</h2>
            <span>${resultLabel(item.type)}</span>
          </div>
          ${item.meta ? `<p class="search-result-meta">${escapeHtml(item.meta)}</p>` : ''}
          ${item.description ? `<p class="search-result-description">${escapeHtml(item.description)}</p>` : ''}
        </div>
      </a>
    `).join('');

    results.querySelectorAll('img').forEach((image) => {
      image.addEventListener('error', () => {
        image.src = '/assets/images/cbsrmt4-wht.png';
        image.classList.add('is-fallback');
      }, { once: true });
    });
  };

  const search = async () => {
    const query = state.query.trim();

    if (!query) {
      summary.textContent = 'Enter a title, episode number, actor, or writer to search the archive.';
      results.replaceChildren();
      syncUrl();
      return;
    }

    summary.textContent = `Searching for “${query}”…`;
    results.innerHTML = '<p class="search-loading">Searching the archive…</p>';
    syncUrl();

    try {
      const requests = [];

      if (state.type === 'all' || state.type === 'episodes') {
        const episodeQuery = new URLSearchParams({
          page: '1',
          limit: state.type === 'episodes' ? '12' : '5',
          sort: 'episode_number',
          order: 'asc',
          search: query,
        });

        requests.push(
          fetchJson(`/episodes?${episodeQuery}`).then((payload) =>
            (payload.data || []).map((episode) => ({
              type: 'episode',
              id: episode.episode_number,
              title: episode.episode_name,
              meta: `Episode ${Number(episode.episode_number)}${episode.broadcast_date ? ` · ${episode.broadcast_date}` : ''}`,
              description: episode.episode_plot || '',
              image: episode.thumbnail || '',
            }))
          )
        );
      }

      if (state.type === 'all' || state.type === 'cast') {
        const castQuery = new URLSearchParams({
          page: '1',
          limit: state.type === 'cast' ? '12' : '5',
          sort: 'appearances',
          order: 'desc',
          search: query,
        });

        requests.push(
          fetchJson(`/cast?${castQuery}`).then((payload) =>
            (payload.data || []).map((person) => ({
              type: 'cast',
              id: person.id,
              title: displayName(person),
              meta: `${person.appearance_count ?? 0} episode${person.appearance_count === 1 ? '' : 's'}`,
              description: 'Cast member',
              image: person.portrait || '',
            }))
          )
        );
      }

      if (state.type === 'all' || state.type === 'writers') {
        const writerQuery = new URLSearchParams({
          page: '1',
          limit: state.type === 'writers' ? '12' : '5',
          sort: 'appearances',
          order: 'desc',
          search: query,
        });

        requests.push(
          fetchJson(`/writers?${writerQuery}`).then((payload) =>
            (payload.data || []).map((person) => ({
              type: 'writer',
              id: person.id,
              title: displayName(person),
              meta: `${person.appearance_count ?? 0} episode${person.appearance_count === 1 ? '' : 's'}`,
              description: 'Writer',
              image: person.portrait || '',
            }))
          )
        );
      }

      const groups = await Promise.all(requests);
      const items = groups.flat();

      summary.textContent = items.length
        ? `${items.length} result${items.length === 1 ? '' : 's'} for “${query}”`
        : `No results for “${query}”`;

      renderResults(items);
    } catch (error) {
      console.error('Unable to search archive:', error);
      summary.textContent = 'Search is temporarily unavailable.';
      results.innerHTML = '<p class="search-empty">The archive search could not be completed. Please try again.</p>';
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    state.query = input.value.trim();
    search();
  });

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      state.type = button.dataset.searchType;
      setActiveFilter();
      if (state.query) search();
      else syncUrl();
    });
  });

  input.value = state.query;
  setActiveFilter();

  if (state.query) {
    search();
  } else {
    input.focus();
  }
};
