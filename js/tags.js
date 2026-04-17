// Tag filter bar rendering and management

function renderTagFilterBar(category) {
  const globalBar = document.getElementById('globalTagFilterBar');
  if (!globalBar) return;

  // Collect all unique tags — for __all__, scan every category
  const allTags = new Set();
  if (category === '__all__') {
    categories.filter(c => c && typeof c === 'string').forEach(cat => {
      if (data[cat]) {
        data[cat].forEach(item => {
          if (item.tags && Array.isArray(item.tags)) item.tags.forEach(t => allTags.add(t));
        });
      }
    });
  } else if (data[category]) {
    data[category].forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(t => allTags.add(t));
      }
    });
  }

  if (allTags.size === 0) {
    globalBar.innerHTML = '';
    globalBar.style.display = 'none';
    document.documentElement.style.setProperty('--tag-filter-height', '0px');
    adjustContentMargin();
    return;
  }

  const activeTags = activeTagFilters[category] || new Set();

  let html = `<button class="tag-filter-btn ${activeTags.size === 0 ? 'active' : ''}" onclick="resetTagFilter('${category}')">Semua</button>`;
  [...allTags].sort().forEach(tag => {
    const isActive = activeTags.has(tag);
    html += `<button class="tag-filter-btn ${isActive ? 'active' : ''}" onclick="toggleTagFilter('${category}', '${escapeHtml(tag)}')">${escapeHtml(tag)}</button>`;
  });

  globalBar.innerHTML = html;
  globalBar.style.display = 'flex';

  // Let the browser paint, then measure and adjust margin
  requestAnimationFrame(() => {
    const h = globalBar.offsetHeight;
    document.documentElement.style.setProperty('--tag-filter-height', `${h}px`);
    adjustContentMargin();
  });
}

function toggleTagFilter(category, tag) {
  if (!activeTagFilters[category]) {
    activeTagFilters[category] = new Set();
  }
  if (activeTagFilters[category].has(tag)) {
    activeTagFilters[category].delete(tag);
  } else {
    activeTagFilters[category].add(tag);
  }
  renderProducts();
}

function resetTagFilter(category) {
  activeTagFilters[category] = new Set();
  renderProducts();
}
