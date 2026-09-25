export const renderSiteHeader = (target, { active = 'home' } = {}) => {
  if (!target) return;

  const items = [
    ['home', 'Home', '/index.html'],
    ['episodes', 'Episodes', '/episodes.html'],
    ['cast', 'Cast', '/cast.html'],
    ['writers', 'Writers', '/writers.html'],
    ['about', 'About', '/about.html'],
    ['contact', 'Contact', '/contact.html'],
  ];

  const navItem = ([key, label, href]) =>
    `<a class="${active === key ? 'active' : ''}" href="${href}">${label}</a>`;

  target.innerHTML = `
    <header class="site-header">
      <a class="header-brand" href="/index.html" aria-label="CBS Radio Mystery Theater home">
        <img src="/assets/images/cbsrmt2-wht.png" alt="CBS Radio Mystery Theater" />
      </a>
      <nav class="primary-nav" aria-label="Primary navigation">
        ${items.map(navItem).join('')}
      </nav>
      <button class="header-search" type="button" aria-label="Search placeholder">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25"></circle><path d="m15.25 15.25 4.75 4.75"></path></svg>
      </button>
    </header>`;
};
