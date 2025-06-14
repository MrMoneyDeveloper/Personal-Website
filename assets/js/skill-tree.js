document.addEventListener('DOMContentLoaded', function () {
  const data = {
    name: 'All Skills',
    children: [
      {
        name: 'Web Development',
        badge: 'web',
        children: [
          { name: '.NET / C#', badge: 'dotnet' },
          { name: 'Node.js', badge: 'node' },
          { name: 'JavaScript / ES6+', badge: 'js' },
          { name: 'HTML5' },
          { name: 'CSS / Flexbox / Bootstrap' },
          { name: 'React / React 18' },
          { name: 'Razor Pages' },
          { name: 'AJAX / JSON' }
        ]
      },
      {
        name: 'Databases',
        badge: 'db',
        children: [
          { name: 'MSSQL', badge: 'mssql' },
          { name: 'PostgreSQL', badge: 'postgres' },
          { name: 'SQL Server Management Studio' },
          { name: 'Database Design / Testing' },
          { name: 'pgAdmin' },
          { name: 'Dapper ORM' }
        ]
      },
      {
        name: 'Backend & APIs',
        children: [
          { name: 'ASP.NET MVC' },
          { name: 'Express.js' },
          { name: 'Flask / Dash' },
          { name: 'API Integration' },
          { name: 'Postman' }
        ]
      },
      {
        name: 'DevOps & Cloud',
        children: [
          { name: 'Microsoft Azure (basic)' },
          { name: 'AWS (S3, Glue, Redshift - research)' },
          { name: 'Git / GitHub' },
          { name: 'CI/CD Pipelines' },
          { name: 'Docker (basic)' }
        ]
      },
      {
        name: 'Testing & QA',
        children: [
          { name: 'Unit / Integration Testing' },
          { name: 'System / Acceptance Testing' },
          { name: 'Black Box / White Box Testing' },
          { name: 'ETL Testing' },
          { name: 'A/B Testing' }
        ]
      },
      {
        name: 'Infrastructure & Networking',
        children: [
          { name: 'cPanel' },
          { name: 'Synology NAS' },
          { name: 'MikroTik RouterOS' },
          { name: 'RAID Configuration' },
          { name: 'Active Directory ' },
          { name: 'Firewall Config / Spam Filtering' },
          { name: 'Packet Tracer' }
        ]
      },
      {
        name: 'Data & Visualisation',
        children: [
          { name: 'Power BI' },
          { name: 'Google Sheets' },
          { name: 'Excel / Pivot Tables' },
          { name: 'Google Forms / Scripts' },
          { name: 'Data Analysis / Interpretation' }
        ]
      },
      {
        name: 'Project & Business Tools',
        children: [
          { name: 'Odoo ERP' },
          { name: 'CRM Functional Specs' },
          { name: 'UML / FRS / Wireframing' },
          { name: 'Requirements Elicitation' },
          { name: 'Agile / Scrum', badge: 'agile' },
          { name: 'Team Leadership & Training' }
        ]
      },
      {
        name: 'IDE & Collaboration',
        children: [
          { name: 'Visual Studio / VS Code' },
          { name: 'Microsoft Teams' },
          { name: 'Miro / Lucidchart' },
        ]
      }
    ]
  };

  const ICONS = {
    web: 'assets/icons/web.svg',
    node: 'assets/icons/node.svg',
    js: 'assets/icons/js.svg',
    dotnet: 'assets/icons/dotnet.svg',
    db: 'assets/icons/db.svg',
    mssql: 'assets/icons/sql.svg',
    postgres: 'assets/icons/pg.svg',
    agile: 'assets/icons/agile.svg'
  };

  const container = document.getElementById('skills-tree');
  if (!container || !window.d3) return;

  const dx = 36;
  const dy = 220;
  const margin = { top: 40, right: 40, bottom: 40, left: 40 };

  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .style('overflow', 'visible');

  const g = svg.append('g');

  const zoom = d3.zoom()
    .scaleExtent([0.6, 2.2])
    .on('zoom', event => g.attr('transform', event.transform));
  svg.call(zoom);

  const tree = d3.tree().nodeSize([dx, dy]);
  const root = d3.hierarchy(data);
  root.x0 = 0;
  root.y0 = 0;

  update(root);

  requestAnimationFrame(() => {
    const initialScale = 1;
    const xCenter = container.clientWidth / 2 - root.x0 * initialScale;
    const yCenter = 60;
    svg.call(zoom.transform, d3.zoomIdentity.translate(xCenter, yCenter).scale(initialScale));
  });

  function update(source) {
    tree(root);

    let x0 = Infinity, x1 = -Infinity;
    root.each(d => {
      if (d.x < x0) x0 = d.x;
      if (d.x > x1) x1 = d.x;
    });

    const width = root.height * dy + margin.left + margin.right;
    const height = x1 - x0 + margin.top + margin.bottom;
    svg.attr('viewBox', [x0 - margin.left, -margin.top, width, height]);

    const link = g.selectAll('path.link')
      .data(root.links(), d => d.target.data.name);

    link.join(
      enter => enter.append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#ffc107')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', function () {
          const length = this.getTotalLength();
          return `${length} ${length}`;
        })
        .attr('stroke-dashoffset', function () {
          return this.getTotalLength();
        })
        .transition()
        .duration(800)
        .attr('stroke-dashoffset', 0),
      update => update,
      exit => exit.remove()
    ).attr('d', d3.linkVertical().x(d => d.x).y(d => d.y));

    const node = g.selectAll('g.node')
      .data(root.descendants(), d => d.data.name);

    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .on('click', (event, d) => {
        toggle(d);
        update(d);
        focusOn(d);
      })
      .on('mouseover', function (event, d) {
        const tooltip = d3.select(container)
          .append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', '#222')
          .style('color', '#ffc107')
          .style('padding', '6px 10px')
          .style('border-radius', '6px')
          .style('font-size', '13px')
          .style('pointer-events', 'none')
          .text(d.data.name);

        d3.select(this).on('mousemove', (event) => {
          tooltip.style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 20}px`);
        });

        d3.select(this).on('mouseleave', () => tooltip.remove());
      });

    nodeEnter.append('circle')
      .attr('r', 14)
      .attr('fill', '#161b22')
      .attr('stroke', '#343a40');

    nodeEnter.append('text')
      .attr('dy', '0.35em')
      .attr('fill', '#f8f9fa')
      .attr('font-size', '14px');

    nodeEnter.filter(d => d.data.badge).append('image')
      .attr('xlink:href', d => ICONS[d.data.badge])
      .attr('x', -12)
      .attr('y', -36)
      .attr('width', 24)
      .attr('height', 24);

    node.merge(nodeEnter)
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .select('text')
      .attr('x', d => (d.children || d._children) ? -18 : 18)
      .attr('text-anchor', d => (d.children || d._children) ? 'end' : 'start')
      .text(d => d.data.name);

    node.exit().remove();

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.from(nodeEnter.nodes(), {
        opacity: 0,
        y: -20,
        stagger: 0.1,
        duration: 0.6,
        ease: 'back.out(1.5)',
        scrollTrigger: { trigger: container, start: 'top 80%' }
      });
    }
  }

  function toggle(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
  }

  function focusOn(d) {
    const scale = 1.2;
    const x = container.clientWidth / 2 - d.x * scale;
    const y = 80 - d.y * scale;
    svg.transition().duration(500)
      .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(scale));
  }
});
