// Project page interactions: filtering, scroll reveals, modal info
window.addEventListener('DOMContentLoaded', () => {
  // filter projects by data-cat
  document.querySelectorAll('.filter-pills button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pills button').forEach(b => b.classList.remove('active','btn-warning'));
      btn.classList.add('active','btn-warning');
      const cat = btn.dataset.filter;
      document.querySelectorAll('.project-card').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
      });
    });
  });

  // GSAP scroll-trigger reveal
  if (window.gsap) {
    gsap.utils.toArray('.reveal-on-scroll').forEach(el => {
      gsap.from(el, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%'
        }
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