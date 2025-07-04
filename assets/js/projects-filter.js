// Project page interactions: filtering, scroll reveals, modal info
window.addEventListener('DOMContentLoaded', () => {
  // filter projects by data-cat
    const filterButtons = document.querySelectorAll('.filter-pills button');
  function applyFilter(cat) {
    document.querySelectorAll('.project-card').forEach(card => {
      card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
       filterButtons.forEach(b => b.classList.remove('active','btn-warning'));
      btn.classList.add('active','btn-warning');
      applyFilter(btn.dataset.filter);
    });
  });
// show all projects by default
  document.querySelector('.filter-pills button.active')?.click();

  // GSAP scroll-trigger reveal without hiding elements before animation
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.reveal-on-scroll').forEach(el => {
      gsap.from(el, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%'
        },
        immediateRender: false
      });
    });
  }

  // Info modal for cards without links
  const infoModalEl = document.getElementById('projectInfoModal');
  if (infoModalEl) {
    const infoModal = new bootstrap.Modal(infoModalEl);
    document.querySelectorAll('.project-card .card').forEach(card => {
      if (!card.querySelector('a.stretched-link')) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          infoModalEl.querySelector('.modal-title').textContent = card.querySelector('.card-title').textContent;
          infoModalEl.querySelector('#projectInfoStack').textContent = card.querySelector('.small.mb-2').textContent;
          infoModalEl.querySelector('#projectInfoDesc').textContent = card.querySelector('.card-text').textContent;
          infoModal.show();
        });
      }
    });
  }
});