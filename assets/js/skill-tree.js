/* ──────────────────────────────────────────────────────────
   Gold-Cyber Skill Tiles – Mohammed Farhaan Buckas
   Sidebar → category | Panel → gold tiles (years / cert)
   ──────────────────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {
  /* === PALETTE & ICONS === */
  const C = { gold: '#ffc107', text: '#f8f9fa', bg: '#161b22', stroke: '#343a40' };
  const ICON = {            /* (optional) per-category icons */
    code: 'assets/icons/code.svg',
    db:   'assets/icons/db.svg',
    cloud:'assets/icons/cloud.svg',
    test: 'assets/icons/test.svg',
    infra:'assets/icons/infra.svg',
    tool: 'assets/icons/tool.svg',
    cert: 'assets/icons/cert.svg'
  };

 /* === MASTER DATA (years & certs) === */
const data = [
  /* ───────── LANGUAGES ───────── */
  { id: 'lang', name: 'Languages', icon: 'code', skills: [
      { s: 'C# / .NET',            y: 3 },
      { s: 'JavaScript (ES6+)',    y: 3 },
      { s: 'HTML / CSS',           y: 3 },
      { s: 'Python',               y: 3 },
      { s: 'SQL (T-SQL)',          y: 2 },
      { s: 'Java (academic)',      y: 0.5 },
      { s: 'VBA',                  y: 2 }
  ]},

  /* ───────── FRAMEWORKS / LIBS ───────── */
  { id: 'fw', name: 'Frameworks & Libs', icon: 'code', skills: [
      { s: 'ASP.NET MVC / Core / Razor', y: 3 },
      { s: 'Entity Framework',           y: 1.5 },
      { s: 'LINQ',                       y: 1.5 },
      { s: 'React 18',                   y: 1 },
      { s: 'React Native',               y: 0.8 },
      { s: 'Node.js & Express',          y: 1 },
      { s: 'jQuery',                     y: 1 },
      { s: 'AJAX',                       y: 2 },
      { s: 'Bootstrap',                  y: 2 },
      { s: 'Flask / Dash',               y: 0.8 },
      { s: 'Dapper ORM',                 y: 0.7 },
      { s: 'NumPy / Pandas / Plotly',    y: 0.5 },
      { s: 'D3.js',                      y: 0.5 },
      { s: 'Webpack / Babel',            y: 0.3 }
  ]},

  /* ───────── DATABASES ───────── */
  { id: 'db', name: 'Databases', icon: 'db', skills: [
      { s: 'PostgreSQL',                 y: 2 },
      { s: 'MSSQL',                      y: 2 },
      { s: 'MySQL',                      y: 0.5 },
      { s: 'SQL Server Mgmt Studio',     y: 2 },
      { s: 'Database Architecture Design', y: 1 },
      { s: 'pgAdmin',                    y: 1 }
  ]},

  /* ───────── DEVOPS & CLOUD ───────── */
  { id: 'cloud', name: 'Dev-Ops & Cloud', icon: 'cloud', skills: [
      { s: 'Git / GitHub',               y: 3 },
      { s: 'GitLab',                     y: 1 },
      { s: 'GitHub Actions',             y: 3 },
      { s: 'Azure',                      y: 2 },
      { s: 'AWS (S3 / Glue / Redshift)', y: 0.5 },
      { s: 'Docker (learning)',          y: 0 }
  ]},

  /* ───────── TESTING / QA ───────── */
  { id: 'test', name: 'Testing & QA', icon: 'test', skills: [
      { s: 'xUnit / NUnit',              y: 2 },
      { s: 'pytest',                     y: 0.8 },
      { s: 'Black- / White-Box',         y: 3 },
      { s: 'ETL Testing',                y: 1 },
      { s: 'A/B Testing',                y: 3 }
  ]},

  /* ───────── SDLC / METHODOLOGIES ───────── */
  { id: 'method', name: 'Methodologies', icon: 'tool', skills: [
      { s: 'Scrum (Agile)',              y: 1 },
      { s: 'Kanban',                     y: 1 },
      { s: 'Waterfall',                  y: 3 },
      { s: 'Incremental Model',          y: 3 },
      { s: 'RAD',                        y: 3 },
      { s: 'Iterative Prototyping / Pretotyping', y: 2 }
  ]},

  /* ───────── DATA & BI ───────── */
  { id: 'bi', name: 'Data & BI', icon: 'db', skills: [
      { s: 'Power BI',                   y: 0.5 },
      { s: 'Entity-Relationship Diagrams (ERD)', y: 2 },
      { s: 'UML',                        y: 2 },
      { s: 'Excel (data cleansing)',     y: 3 },
      { s: 'Google Sheets / Forms',      y: 1 },
      { s: 'Data Analysis',              y: 2 }
  ]},

  /* ───────── INFRASTRUCTURE ───────── */
  { id: 'infra', name: 'Infrastructure', icon: 'infra', skills: [
      { s: 'MikroTik RouterOS',          y: 1 },
      { s: 'cPanel Email',               y: 1 },
      { s: 'Synology NAS + RAID',        y: 1 },
      { s: 'Active Directory',           y: 1 },
      { s: 'Firewall / Spam Filtering',  y: 1 }
  ]},

  /* ───────── PROJECT / DEV TOOLS ───────── */
  { id: 'pm', name: 'Proj & Dev Tools', icon: 'tool', skills: [
      { s: 'JIRA',                       y: 1 },
      { s: 'Microsoft Visual Studio',    y: 3 },
      { s: 'Visual Studio Code',         y: 3 },
      { s: 'Android Studio',             y: 0.5 },
      { s: 'Wireframing (Miro / ERD / UML)', y: 3 },
      { s: 'Figma',                      y: 0.5 },
      { s: 'Miro (flows / PM)',          y: 3 },
      { s: 'User-Manual Design',         y: 1 }
  ]},

  /* ───────── CERTIFICATIONS ───────── */
  { id: 'cert', name: 'Certifications', icon: 'cert', skills: [
      { s: 'Linux Essentials (NDG) — 2021',                          cert: true },
      { s: 'Linux Unhatched (NDG) — 2020',                           cert: true },
      { s: 'Intro to Packet Tracer — 2020',                          cert: true },
      { s: 'Intro to PostgreSQL — 2024',                             cert: true },
      { s: 'Intro to Data Science — 2024',                           cert: true },
      { s: 'Intro to Cybersecurity — 2021',                          cert: true },
      { s: 'Cybersecurity Essentials — 2021',                        cert: true },
      { s: 'ChatGPT Templates – 2024',                               cert: true },
      { s: 'Networking Foundations – LANs — 2024',                   cert: true },
      { s: 'Business Dev Foundations – Market & Customer — 2024',    cert: true },
      { s: 'Learning SOLID Programming Principles — 2024',           cert: true },
      { s: 'Nano Tips – Speak Up in Meetings — 2024',                cert: true },
      { s: 'Get Connected — 2020',                                   cert: true },
      { s: 'Introduction to IoT — 2020',                             cert: true }
  ]}
];

  /* === BUILD HTML SKELETON === */
  const host = document.getElementById('skills-tree');
  host.innerHTML =
    `<aside id="skill-side"></aside><section id="skill-panel"></section>`;
  const side = document.getElementById('skill-side');
  const panel = document.getElementById('skill-panel');

  /* === SIDEBAR BUTTONS === */
  data.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.innerHTML = `<span>${cat.name}</span>`;
    btn.onclick = () => render(cat);
    side.appendChild(btn);
  });

  /* === RENDER TILES === */
  function render(cat) {
    panel.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'tile-wrap';
    cat.skills.forEach(sk => {
      const tile = document.createElement('div');
      tile.className = 'skill-tile';
      tile.innerHTML =
        `<span class="skill-name">${sk.s}</span>` +
        (sk.cert
          ? `<span class="badge badge-cert">CERT</span>`
          : `<span class="badge">${sk.y} yr${sk.y === 1 ? '' : 's'}</span>`);
      wrap.appendChild(tile);
    });
    panel.appendChild(wrap);
  }
  render(data[0]); // load first category
});
