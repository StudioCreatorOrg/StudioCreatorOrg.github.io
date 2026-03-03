document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.menu-btn');
  const menu = document.querySelector('.menu');

  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('is-open');
  });

  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) menu.classList.remove('is-open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu') && !e.target.closest('.menu-btn')) {
      menu.classList.remove('is-open');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 761) menu.classList.remove('is-open');
  });
});