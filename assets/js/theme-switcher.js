(function() {
  const params = new URLSearchParams(window.location.search);
  const queryTheme = params.get('theme') || params.get('company');
  const pageTheme = (window.siteCompany || '').trim();
  const pathTheme = themeFromPath(window.location.pathname);
  const theme = normalizeTheme(pageTheme || queryTheme || pathTheme || 'default');
  const root = document.documentElement;
  const themes = {
    cx: { bg: 'var(--theme-cx-bg)', accent: 'var(--theme-cx-accent)' },
    atg: { bg: 'var(--theme-atg-bg)', accent: 'var(--theme-atg-accent)' },
    personal: { bg: 'var(--theme-personal-bg)', accent: 'var(--theme-personal-accent)' }
  };

  if (themes[theme]) {
    root.style.setProperty('--bg-dark', themes[theme].bg);
    root.style.setProperty('--rpg-gold', themes[theme].accent);
  }

  function normalizeTheme(value) {
    const key = String(value || '').toLowerCase().trim();
    if (!key) return '';
    const aliases = {
      'cx-experts': 'cx',
      cxexperts: 'cx',
      cx: 'cx',
      atg: 'atg',
      'automation-techniques-group': 'atg',
      personal: 'personal'
    };
    return aliases[key] || key;
  }

  function themeFromPath(pathname) {
    const path = String(pathname || '').toLowerCase();
    if (!path.includes('/company/')) return '';
    if (path.includes('cx-experts') || path.includes('/cx/')) return 'cx';
    if (path.includes('atg')) return 'atg';
    if (path.includes('personal')) return 'personal';
    return '';
  }
})();
