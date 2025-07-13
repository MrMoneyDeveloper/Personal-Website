window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('githubProjects');
  if (!container) return;

  const statusEl = container.querySelector('.repo-status');
  const listEl = container.querySelector('.repo-list');
  if (statusEl) statusEl.textContent = 'Loading repositories...';

  fetch('https://api.github.com/users/MrMoneyDeveloper/repos?sort=pushed&per_page=6')
    .then(res => {
      if (!res.ok) throw new Error(res.status.toString());
      return res.json();
    })
    .then(repos => {
      if (!Array.isArray(repos) || repos.length === 0) {
        if (statusEl) statusEl.textContent = 'No repositories found.';
        return;
      }
      if (statusEl) statusEl.style.display = 'none';
      repos.forEach(repo => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';

        const card = document.createElement('div');
        card.className = 'card bg-dark h-100 border-warning-subtle reveal-on-scroll hover-lift';
        card.setAttribute('data-tilt', '');

        const body = document.createElement('div');
        body.className = 'card-body d-flex flex-column';

        const title = document.createElement('h5');
        title.className = 'card-title';
        title.textContent = repo.name;

        const desc = document.createElement('p');
        desc.className = 'card-text small flex-grow-1';
        desc.textContent = repo.description || 'No description provided.';

        const link = document.createElement('a');
        link.href = repo.html_url;
        link.target = '_blank';
        link.className = 'btn btn-outline-warning btn-sm mt-auto';
        link.textContent = 'View on GitHub';

        body.appendChild(title);
        body.appendChild(desc);
        body.appendChild(link);
        card.appendChild(body);
        col.appendChild(card);
        listEl.appendChild(col);
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh(true);
    })
    .catch(err => {
      console.error('GitHub fetch error:', err);
      if (statusEl) {
        const msg = err.message === '403'
          ? 'GitHub API rate limit exceeded. Please try again later.'
          : 'Failed to load repositories.';
        statusEl.textContent = msg;
      }
    });
});