document.addEventListener('DOMContentLoaded', function() {
  const data = {
    name: 'All Skills',
    children: [
      {
        name: 'Web Development',
        children: [
          { name: '.NET / C#' },
          { name: 'Node.js' },
          { name: 'JavaScript / ES6+' }
        ]
      },
      {
        name: 'Databases',
        children: [
          { name: 'MSSQL' },
          { name: 'PostgreSQL' }
        ]
      },
      { name: 'Agile / Scrum' }
    ]
  };

  const container = document.getElementById('skills-tree');
  if (!container || !window.d3) return;

  const width = container.clientWidth || 600;
  const dx = 40;
  const dy = 160;

  const tree = d3.tree().nodeSize([dx, dy]);
  const root = d3.hierarchy(data);
  tree(root);

  const height = root.height * dx + 80;

  const svg = d3.select(container)
    .append('svg')
      .attr('viewBox', [ -dy/2, -dx/2, width, height ])
      .attr('width', '100%')
      .attr('height', height)
      .style('overflow', 'visible');

  const gLinks = svg.append('g')
    .attr('fill', 'none')
    .attr('stroke', '#ffc107')
    .attr('stroke-width', 2);

  gLinks.selectAll('path')
    .data(root.links())
    .join('path')
    .attr('d', d3.linkVertical().x(d => d.x).y(d => d.y));

  const node = svg.append('g')
    .selectAll('g')
    .data(root.descendants())
    .join('g')
      .attr('transform', d => `translate(${d.x},${d.y})`);

  node.append('circle')
      .attr('r', 14)
      .attr('fill', '#161b22')
      .attr('stroke', '#343a40');

  node.append('text')
      .attr('dy', '0.32em')
      .attr('x', d => d.children ? -18 : 18)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .attr('fill', '#f8f9fa')
      .text(d => d.data.name);

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from(node.nodes(), {
      opacity: 0,
      y: -20,
      stagger: 0.1,
      duration: 0.6,
      ease: 'back.out(1.5)',
      scrollTrigger: { trigger: container, start: 'top 80%' }
    });
  }
});