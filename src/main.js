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
