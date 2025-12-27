// Project page interactions: filtering, scroll reveals, modal info
window.addEventListener('DOMContentLoaded', () => {
  // filter projects by data-category
  const filterButtons = document.querySelectorAll('.projects-filters button');
  const projectCards = document.querySelectorAll('.project-card');

  function applyFilter(filter) {
    projectCards.forEach(card => {
      const category = card.dataset.category || '';
      const show = (filter === 'all' || category === filter);
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

  function setActiveButton(activeButton) {
    filterButtons.forEach(btn => {
      btn.classList.remove('active', 'btn-warning');
      btn.classList.add('btn-outline-warning');
    });
    activeButton.classList.add('active', 'btn-warning');
    activeButton.classList.remove('btn-outline-warning');
  }

  if (filterButtons.length) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveButton(btn);
        applyFilter(btn.dataset.filter);
      });
    });

    // show all projects by default
    const initialButton = document.querySelector('.projects-filters button.active') || filterButtons[0];
    initialButton?.click();
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
