/* ───────────────────────────────────────────────────────────
   Cyber‑Punk Menu Skill Tree – Mohammed Farhaan Buckas
   Lightweight sidebar + panel version for GitHub Pages
   ───────────────────────────────────────────────────────────*/

document.addEventListener('DOMContentLoaded', ()=>{
  /* === CONFIG === */
  const COLORS = { neon:'#00e0ff', text:'#e4e8fa', bg:'#161b22', stroke:'#343a40' };
  const ICONS  = {
    web:'assets/icons/web.svg', node:'assets/icons/node.svg', js:'assets/icons/js.svg',
    dotnet:'assets/icons/dotnet.svg', db:'assets/icons/db.svg', mssql:'assets/icons/sql.svg',
    postgres:'assets/icons/pg.svg', agile:'assets/icons/agile.svg'
  };

  /* === DATA === */
  const data = { name:'All Skills', children:[
    { name:'Web Development', badge:'web', id:'webDev', children:[
      {name:'.NET / C#',badge:'dotnet'}, {name:'Node.js',badge:'node'},
      {name:'JavaScript / ES6+',badge:'js'}, {name:'HTML5'},
      {name:'CSS / Flexbox / Bootstrap'}, {name:'React / React 18'},
      {name:'Razor Pages'}, {name:'AJAX / JSON'}]},
    { name:'Databases', badge:'db', id:'db', children:[
      {name:'MSSQL',badge:'mssql'},{name:'PostgreSQL',badge:'postgres'},
      {name:'SQL Server Management Studio'}, {name:'Database Design / Testing'},
      {name:'pgAdmin'},{name:'Dapper ORM'}]},
    { name:'Backend & APIs', id:'backend', children:[
      {name:'ASP.NET MVC'},{name:'Express.js'},{name:'Flask / Dash'},
      {name:'API Integration'},{name:'Postman'}]},
    { name:'DevOps & Cloud', id:'devops', children:[
      {name:'Microsoft Azure (basic)'},{name:'AWS (S3/Glue/Redshift)'},
      {name:'Git / GitHub'},{name:'CI/CD Pipelines'},{name:'Docker (basic)'}]},
    { name:'Testing & QA', id:'testing', children:[
      {name:'Unit / Integration Testing'},{name:'System / Acceptance Testing'},
      {name:'Black Box / White Box Testing'},{name:'ETL Testing'},
      {name:'A/B Testing'}]},
    { name:'Infrastructure & Networking', id:'infra', children:[
      {name:'cPanel'},{name:'Synology NAS'},{name:'MikroTik RouterOS'},
      {name:'RAID Configuration'},{name:'Active Directory'},
      {name:'Firewall Config / Spam Filtering'},{name:'Packet Tracer'}]},
    { name:'Data & Visualisation', id:'dataViz', children:[
      {name:'Power BI'},{name:'Google Sheets'},{name:'Excel / Pivot Tables'},
      {name:'Google Forms / Scripts'},{name:'Data Analysis / Interpretation'}]},
    { name:'Project & Business Tools', id:'biz', children:[
      {name:'Odoo ERP'},{name:'CRM Functional Specs'},{name:'UML / FRS / Wireframing'},
      {name:'Requirements Elicitation'},{name:'Agile / Scrum',badge:'agile'},
      {name:'Team Leadership & Training'}]},
    { name:'IDE & Collaboration', id:'ide', children:[
      {name:'Visual Studio / VS Code'},{name:'Microsoft Teams'},{name:'Miro / Lucidchart'}]}
  ]};

  /* === BUILD LAYOUT === */
  const rootContainer = document.getElementById('skills-tree');
  rootContainer.innerHTML = `<aside id="skills-menu"></aside><section id="skills-panel"><svg></svg></section>`;
  const menu   = document.getElementById('skills-menu');
  const svg    = d3.select('#skills-panel svg')
                   .attr('width','100%').attr('height','100%');

  // Sidebar buttons
  data.children.forEach(cat=>{
    const btn=document.createElement('button');
    btn.className='menu-item';
    btn.textContent=cat.name;
    btn.onclick=()=>renderBranch(cat);
    menu.appendChild(btn);
  });

  // D3 tree layout for right panel
  const tree = d3.tree().nodeSize([28,160]);

  function renderBranch(branch){
    svg.selectAll('*').remove();
    const root=d3.hierarchy(branch);
    tree(root);
    const g=svg.append('g').attr('transform','translate(40,40)');

    // links
    g.selectAll('path')
      .data(root.links())
      .enter().append('path')
        .attr('d',d3.linkHorizontal().x(d=>d.y).y(d=>d.x))
        .attr('fill','none').attr('stroke',COLORS.neon).attr('stroke-width',2)
        .attr('filter','url(#neon)');

    // nodes
    const node=g.selectAll('g').data(root.descendants()).enter().append('g')
                .attr('transform',d=>`translate(${d.y},${d.x})`)  
                .on('click',(e,d)=>{toggle(d);renderBranch(branch)});

    node.append('circle').attr('r',12).attr('fill',COLORS.bg).attr('stroke',COLORS.stroke);
    node.append('text')
        .attr('dy','0.35em').attr('x',d=>d.children||d._children?-16:16)
        .attr('text-anchor',d=>d.children||d._children?'end':'start')
        .style('fill',COLORS.text).text(d=>d.data.name);
    node.filter(d=>d.data.badge).append('image')
        .attr('xlink:href',d=>ICONS[d.data.badge]||'')
        .attr('x',-12).attr('y',-36).attr('width',24).attr('height',24);
  }

  function toggle(d){
    if(d.children){d._children=d.children;d.children=null;}else{d.children=d._children;d._children=null;}
  }

  // Initial Render
  renderBranch(data.children[0]);

  /* === CYBER STYLES === */
  const style=document.createElement('style');
  style.textContent=`
    #skills-tree{display:flex;min-height:600px}
    #skills-menu{width:220px;background:#090c15;border-right:2px solid ${COLORS.neon};
      display:flex;flex-direction:column;gap:.5rem;padding:1rem}
    .menu-item{background:transparent;color:${COLORS.neon};border:1px solid ${COLORS.neon};
      padding:.6rem 1rem;font-family:'Cinzel',serif;cursor:pointer;border-radius:4px;text-align:left;transition:.25s}
    .menu-item:hover{background:${COLORS.neon};color:#0d1117}
    #skills-panel{flex:1;overflow:auto;padding:1rem}
    svg .link{filter:drop-shadow(0 0 4px ${COLORS.neon}80)}
  `;
  document.head.appendChild(style);

  /* SVG filter for glow */
  svg.append('defs').html(`<filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${COLORS.neon}"/>
    </filter>`);
});
