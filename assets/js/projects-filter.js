// Project page interactions: filtering, scroll reveals, modal info
window.addEventListener('DOMContentLoaded', () => {
  // filter projects by data-cat
    const filterButtons = document.querySelectorAll('.filter-pills button');
  function applyFilter(cat) {
    document.querySelectorAll('.project-card').forEach(card => {
      const show = (cat === 'all' || card.dataset.cat === cat);
      if (show) {
        card.style.display = '';
        if (window.anime) {
          anime({
            targets: card,
            opacity: [0, 1],
            scale: [0.95, 1],
            duration: 400,
            easing: 'easeOutQuad'
          });
        } else {
          card.style.opacity = '1';
        }
      } else {
        if (window.anime) {
          anime({
            targets: card,
            opacity: [1, 0],
            scale: [1, 0.95],
            duration: 400,
            easing: 'easeOutQuad',
            complete: () => { card.style.display = 'none'; }
          });
        } else {
          card.style.display = 'none';
        }
      }
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