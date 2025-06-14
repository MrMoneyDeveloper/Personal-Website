document.addEventListener('DOMContentLoaded', () => {
  const CONFIG = {
    radius: 550,
    minScale: 0.6,
    maxScale: 3,
    bgImage: 'assets/images/skill-bg-placeholder.png',
    iconSize: 24,
    nodeRadius: 16,
    linkColor: '#ffc107',
    textColor: '#f8f9fa',
    nodeFill:  '#161b22',
    nodeStroke:'#343a40'
  };

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
          { name: 'Active Directory' },
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
          { name: 'Miro / Lucidchart' }
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

  // Create SVG and background
  const svg = d3.select(container).append('svg')
    .attr('width', '100%')
    .style('overflow', 'visible');
  svg.append('image')
    .attr('xlink:href', CONFIG.bgImage)
    .attr('x', -CONFIG.radius)
    .attr('y', -CONFIG.radius)
    .attr('width', CONFIG.radius * 2)
    .attr('height', CONFIG.radius * 2)
    .attr('preserveAspectRatio', 'xMidYMid slice')
    .attr('opacity', 0.08);

  // Main group centered at origin (will be moved via zoom transform)
  const g = svg.append('g')
    .attr('transform', `translate(${CONFIG.radius}, ${CONFIG.radius})`);

  // Zoom/pan setup
  const zoom = d3.zoom()
    .scaleExtent([CONFIG.minScale, CONFIG.maxScale])
    .on('zoom', event => g.attr('transform', event.transform));
  svg.call(zoom);

  const root = d3.hierarchy(data);
  const cluster = d3.cluster().size([360, CONFIG.radius]);

  // Optionally, collapse certain nodes initially:
  // root.children.forEach(collapse); // (If you want all categories collapsed at start)

  let initialRender = true;
  update(root);

  function update(source) {
    // Compute new layout positions
    cluster(root);

    // LINKS – join data
    const links = g.selectAll('path.link')
      .data(root.links(), d => d.target.data.name);

    // Enter any new links
    const linkEnter = links.enter().append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', CONFIG.linkColor)
      .attr('stroke-width', 2)
      // Set up path for radial link (from source to target)
      .attr('d', d3.linkRadial()
                    .angle(d => (d.x - 90) * Math.PI/180)
                    .radius(d => d.y))
      // Animate draw-in with stroke-dasharray
      .attr('stroke-dasharray', function() {
        const length = this.getTotalLength();
        return `${length} ${length}`;
      })
      .attr('stroke-dashoffset', function() {
        return this.getTotalLength();
      })
      .call(enter => enter.transition().duration(900)
                           .attr('stroke-dashoffset', 0));

    // Update + merge links (for new and existing)
    links.merge(linkEnter)
      .attr('d', d3.linkRadial()
                    .angle(d => (d.x - 90) * Math.PI/180)
                    .radius(d => d.y));

    // Remove any exiting links
    links.exit().remove();

    // NODES – join data
    const nodes = g.selectAll('g.node')
      .data(root.descendants(), d => d.data.name);

    // Enter any new nodes
    const nodeEnter = nodes.enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => {
        const [x, y] = radialPoint(d.x, d.y);
        return `translate(${x}, ${y})`;
      })
      .on('click', (event, d) => {
        // Toggle children on click and refocus view
        toggle(d);
        update(d);
        focusOn(d);
      })
      .on('mouseover', function(event, d) {
        // Show tooltip on hover
        const tooltip = d3.select(container).append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', '#222')
          .style('color', '#ffc107')
          .style('padding', '6px 10px')
          .style('border-radius', '6px')
          .style('font-size', '13px')
          .style('pointer-events', 'none')
          .text(d.data.name);
        d3.select(this).on('mousemove', event => {
          tooltip.style('left', (event.pageX + 10) + 'px')
                 .style('top',  (event.pageY - 20) + 'px');
        });
        d3.select(this).on('mouseleave', () => tooltip.remove());
      });

    // Node appearance (circle, text, icons)
    nodeEnter.append('circle')
      .attr('r', CONFIG.nodeRadius)
      .attr('fill', CONFIG.nodeFill)
      .attr('stroke', CONFIG.nodeStroke);

    nodeEnter.append('text')
      .attr('dy', '0.35em')
      .attr('x', d => d.x < 180 ? (CONFIG.nodeRadius + 6) : -(CONFIG.nodeRadius + 6))
      .attr('text-anchor', d => d.x < 180 ? 'start' : 'end')
      .attr('transform', d => d.x >= 180 ? 'rotate(180)' : null)
      .style('fill', CONFIG.textColor)
      .style('font-size', '14px')
      .text(d => d.data.name);

    nodeEnter.filter(d => d.data.badge).append('image')
      .attr('xlink:href', d => ICONS[d.data.badge] || '')
      .attr('x', -CONFIG.iconSize / 2)
      .attr('y', -(CONFIG.nodeRadius + CONFIG.iconSize + 4))
      .attr('width', CONFIG.iconSize)
      .attr('height', CONFIG.iconSize);

    ['icon1', 'icon2', 'icon3'].forEach((key, idx) => {
      nodeEnter.filter(d => d.data[key]).append('image')
        .attr('xlink:href', d => d.data[key])
        .attr('x', -CONFIG.iconSize/2 + (idx - 1) * (CONFIG.iconSize + 4))
        .attr('y', CONFIG.nodeRadius + 6)
        .attr('width', CONFIG.iconSize)
        .attr('height', CONFIG.iconSize);
    });

    // Update positions of all nodes (new and existing)
    const nodeUpdate = nodes.merge(nodeEnter);
    nodeUpdate.attr('transform', d => {
      const [x, y] = radialPoint(d.x, d.y);
      return `translate(${x}, ${y})`;
    });
    // Update text orientation on every layout (in case angle changed)
    nodeUpdate.select('text')
      .attr('x', d => d.x < 180 ? (CONFIG.nodeRadius + 6) : -(CONFIG.nodeRadius + 6))
      .attr('text-anchor', d => d.x < 180 ? 'start' : 'end')
      .attr('transform', d => d.x >= 180 ? 'rotate(180)' : null);

    // Remove any exiting nodes
    nodes.exit().remove();

    // Optional: fade-in animation for new nodes if GSAP is available
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

    // On first render, fit the SVG viewBox to the content
    if (initialRender) {
      const bbox = g.node().getBBox();
      svg.attr('viewBox', [
        bbox.x - 40, bbox.y - 40,
        bbox.width + 80, bbox.height + 80
      ]);
      initialRender = false;
    }
  }

  // Convert polar coordinates (angle in degrees, radius) to Cartesian (x,y)
  function radialPoint(x, y) {
    const angle = (x - 90) * (Math.PI / 180);
    return [y * Math.cos(angle), y * Math.sin(angle)];
  }

  // Collapse node (store children in _children)
  function toggle(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
  }

  // Smoothly zoom and center the view on the specified node
  function focusOn(d) {
    const [x, y] = radialPoint(d.x, d.y);
    const scale = 1.4;
    const translateX = container.clientWidth / 2 - x * scale;
    const translateY = container.clientHeight / 2 - y * scale;
    svg.transition().duration(600)
       .call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
  }

  // Helper to collapse all children of a node (for optional initial collapse)
  function collapse(node) {
    if (node.children) {
      node._children = node.children;
      node._children.forEach(collapse);
      node.children = null;
    }
  }
});
