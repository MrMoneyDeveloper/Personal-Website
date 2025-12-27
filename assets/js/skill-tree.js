document.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('skill-garden');
  if (!host || !window.d3) return;

  const dataUrl = host.getAttribute('data-skills-src') || 'assets/data/skills.json';

  fetch(dataUrl)
    .then(res => res.json())
    .then(data => renderGarden(data))
    .catch(err => {
      console.warn('Skill garden failed to load.', err);
    });

  function renderGarden(data) {
    const entries = Object.entries(data || {});
    if (!entries.length) return;

    const width = 960;
    const height = 560;
    const center = { x: width / 2, y: height / 2 };
    const radius = Math.min(width, height) * 0.33;
    const leafOrbit = Math.min(width, height) * 0.16;
    const leafSpacing = 0.35;
    const leafBase = 10;
    const leafActiveBoost = 6;

    host.innerHTML = '';

    const svg = d3.select(host)
      .append('svg')
      .attr('class', 'garden-svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('role', 'img')
      .attr('aria-label', 'Digital garden of skill categories and leaves');

    svg.append('circle')
      .attr('class', 'garden-root')
      .attr('cx', center.x)
      .attr('cy', center.y)
      .attr('r', Math.min(width, height) * 0.08);

    const stemLayer = svg.append('g').attr('class', 'garden-stems');
    const plantLayer = svg.append('g').attr('class', 'garden-plants');
    const leafLayer = svg.append('g').attr('class', 'garden-leaves');

    let active = null;

    entries.forEach(([category, skills], i) => {
      const angle = (i / entries.length) * Math.PI * 2 - Math.PI / 2;
      const cx = center.x + radius * Math.cos(angle);
      const cy = center.y + radius * Math.sin(angle);

      stemLayer.append('line')
        .attr('class', 'garden-stem')
        .attr('x1', center.x)
        .attr('y1', center.y)
        .attr('x2', cx)
        .attr('y2', cy);

      const plantGroup = plantLayer.append('g')
        .attr('class', 'garden-plant')
        .attr('transform', `translate(${cx},${cy})`);

      plantGroup.append('circle')
        .attr('r', 26);

      plantGroup.append('text')
        .attr('class', 'garden-plant-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .text(category);

      const normalizedSkills = (Array.isArray(skills) ? skills : []).map(normalizeSkill);
      const startOffset = -((normalizedSkills.length - 1) / 2) * leafSpacing;

      normalizedSkills.forEach((skill, j) => {
        const leafAngle = angle + startOffset + j * leafSpacing;
        const lx = cx + leafOrbit * Math.cos(leafAngle);
        const ly = cy + leafOrbit * Math.sin(leafAngle);
        const sizeBoost = skill.cert ? 1.5 : Math.max(0, skill.years || 0);
        const radiusBase = leafBase + Math.min(6, sizeBoost * 2);

        const leafGroup = leafLayer.append('g')
          .attr('class', `garden-leaf${skill.cert ? ' is-cert' : ''}`)
          .attr('transform', `translate(${lx},${ly})`)
          .datum(skill);

        leafGroup.append('title').text(formatLabel(skill));

        leafGroup.append('circle')
          .attr('r', radiusBase)
          .attr('data-base-radius', radiusBase);

        const labelGroup = leafGroup.append('g')
          .attr('class', 'garden-leaf-label')
          .attr('transform', 'translate(18,-18)')
          .style('opacity', 0);

        const labelText = labelGroup.append('text')
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'hanging');

        labelText.append('tspan')
          .attr('x', 6)
          .attr('dy', 0)
          .text(skill.name);

        if (skill.detail) {
          labelText.append('tspan')
            .attr('x', 6)
            .attr('dy', '1.2em')
            .attr('class', 'garden-leaf-detail')
            .text(skill.detail);
        }

        const bbox = labelText.node().getBBox();
        labelGroup.insert('rect', 'text')
          .attr('x', bbox.x - 6)
          .attr('y', bbox.y - 4)
          .attr('width', bbox.width + 12)
          .attr('height', bbox.height + 8)
          .attr('rx', 6)
          .attr('ry', 6);

        leafGroup.on('click', event => {
          event.stopPropagation();
          if (active === leafGroup.node()) {
            clearActive();
            return;
          }
          setActive(leafGroup);
        });
      });
    });

    svg.on('click', clearActive);

    function setActive(leafGroup) {
      clearActive();
      active = leafGroup.node();
      leafGroup.classed('is-active', true);
      leafGroup.select('.garden-leaf-label').style('opacity', 1);
      const circle = leafGroup.select('circle');
      const base = +circle.attr('data-base-radius') || leafBase;
      circle.transition().duration(200).attr('r', base + leafActiveBoost);
    }

    function clearActive() {
      if (!active) return;
      const leafGroup = d3.select(active);
      leafGroup.classed('is-active', false);
      leafGroup.select('.garden-leaf-label').style('opacity', 0);
      const circle = leafGroup.select('circle');
      const base = +circle.attr('data-base-radius') || leafBase;
      circle.transition().duration(200).attr('r', base);
      active = null;
    }
  }

  function normalizeSkill(skill) {
    if (typeof skill === 'string') {
      return { name: skill, detail: '' };
    }
    const years = typeof skill.years === 'number' ? skill.years : null;
    const detail = skill.detail || (skill.cert ? 'Certification' : formatYears(years));
    return {
      name: skill.name || 'Skill',
      years: years,
      cert: Boolean(skill.cert),
      detail: detail
    };
  }

  function formatYears(years) {
    if (years === null || typeof years !== 'number') return '';
    if (years === 0) return 'Learning';
    if (years === 1) return '1 yr';
    return `${years} yrs`;
  }

  function formatLabel(skill) {
    return skill.detail ? `${skill.name} - ${skill.detail}` : skill.name;
  }
});
