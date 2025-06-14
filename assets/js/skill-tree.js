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

  const dx = 40;
  const dy = 160;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };

  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .style('overflow', 'visible');

  const g = svg.append('g');

  const zoom = d3.zoom()
    .scaleExtent([0.5, 2])
    .on('zoom', event => g.attr('transform', event.transform));
  svg.call(zoom);

  const tree = d3.tree().nodeSize([dx, dy]);
  const root = d3.hierarchy(data);
  root.x0 = 0;
  root.y0 = 0;

  update(root);

 function update(source) {
    tree(root);

    let x0 = Infinity;
    let x1 = -Infinity;
    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
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
        .attr('stroke-width', 2),
      update => update,
      exit => exit.remove()
    ).attr('d', d3.linkVertical().x(d => d.x).y(d => d.y));

    const node = g.selectAll('g.node')
      .data(root.descendants(), d => d.data.name);

    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .on('click', (event, d) => { toggle(d); update(d); focusOn(d); });

    nodeEnter.append('circle')
      .attr('r', 14)
      .attr('fill', '#161b22')
      .attr('stroke', '#343a40');

  nodeEnter.append('text')
      .attr('dy', '0.32em')
      .attr('fill', '#f8f9fa');

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
    const x = -d.x * scale + container.clientWidth / 2;
    const y = -d.y * scale + margin.top;
    svg.transition().duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(scale));
  }
});