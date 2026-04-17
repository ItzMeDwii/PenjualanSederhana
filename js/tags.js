// Tag filter bar rendering and management

function renderTagFilterBar(category) {
  const tagFilterSection = document.getElementById('tagFilterSection');
  const tagFilterBtns = document.getElementById('tagFilterBtns');
  if (!tagFilterSection || !tagFilterBtns) return;

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
    tagFilterSection.style.display = 'none';
    tagFilterBtns.innerHTML = '';
    return;
  }

  const activeTags = activeTagFilters[category] || new Set();

  let html = `<button class="tag-filter-btn ${activeTags.size === 0 ? 'active' : ''}" onclick="resetTagFilter('${category}')">Semua</button>`;
  [...allTags].sort().forEach(tag => {
    const isActive = activeTags.has(tag);
    html += `<button class="tag-filter-btn ${isActive ? 'active' : ''}" onclick="toggleTagFilter('${category}', '${escapeHtml(tag)}')">${escapeHtml(tag)}</button>`;
  });

  tagFilterBtns.innerHTML = html;
  tagFilterSection.style.display = 'block';
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
  renderTagFilterBar(category);
  updateNavbarFiltersDisplay(category);
  renderProducts();
}

function resetTagFilter(category) {
  activeTagFilters[category] = new Set();
  renderTagFilterBar(category);
  updateNavbarFiltersDisplay(category);
  renderProducts();
}
