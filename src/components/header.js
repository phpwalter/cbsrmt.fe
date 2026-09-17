export const renderSiteHeader = (target, { active = 'home' } = {}) => {
  if (!target) return;

  const links = {
    home: '/index.html',
    episodes: '/index.html#archive-heading',
    about: '/about.html',
  };

  const navItem = (key, label) =>
    `<a class="${active === key ? 'active' : ''}" href="${links[key]}">${label}</a>`;

  target.innerHTML = `
    <header class="site-header">
      <a class="header-brand" href="/index.html" aria-label="CBS Radio Mystery Theater home">
        <img src="/assets/images/cbsrmt2-wht.png" alt="CBS Radio Mystery Theater" />
      </a>
      <nav class="primary-nav" aria-label="Primary navigation">
        ${navItem('home', 'Home')}
        ${navItem('episodes', 'Episodes')}
        ${navItem('about', 'About')}
      </nav>
      <button class="header-search" type="button" aria-label="Search placeholder">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25"></circle><path d="m15.25 15.25 4.75 4.75"></path></svg>
      </button>
    </header>`;
};
