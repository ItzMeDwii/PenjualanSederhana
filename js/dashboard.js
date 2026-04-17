// Dashboard: top products and sales overview

function showDashboard() {
  document.getElementById('dashboardModal').style.display = 'flex';
  showDashboardTab('salesReport');
  renderSalesTable();
  renderTopProducts();
}

function showDashboardTab(tabId) {
  document.querySelectorAll('.dashboard-tab-content').forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });

  document.querySelectorAll('.dashboard-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  document.getElementById(tabId + 'Tab').classList.add('active');
  document.getElementById(tabId + 'Tab').style.display = 'block';
  document.querySelector(`.dashboard-tab[onclick*="showDashboardTab('${tabId}')"]`).classList.add('active');

  if (tabId === 'salesReport') {
    renderSalesTable();
  } else if (tabId === 'topProducts') {
    renderTopProducts();
  } else if (tabId === 'artistSales') {
    populateArtistSalesFilter();
    renderArtistSalesTable();
  }
}

function renderTopProducts() {
  const productSales = {};

  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.name]) {
        productSales[item.name] = {
          name: item.name,
          image: item.image,
          category: item.category,
          code: item.code,
          totalQty: 0,
          totalRevenue: 0,
          originalRevenue: 0
        };
      }
      productSales[item.name].totalQty += item.qty;
      const priceUsed = item.roundedPrice || item.discountedPrice || item.price;
      productSales[item.name].totalRevenue += priceUsed * item.qty;
      productSales[item.name].originalRevenue += item.price * item.qty;
    });
  });

  const sortedProducts = Object.values(productSales).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const container = document.getElementById('topProductsList');
  container.innerHTML = '';

  if (sortedProducts.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada data penjualan</div>';
    return;
  }

  sortedProducts.forEach((product, index) => {
    const hasDiscount = product.totalRevenue !== product.originalRevenue;
    const discountAmount = product.originalRevenue - product.totalRevenue;

    const item = document.createElement('div');
    item.className = 'top-product-item';
    item.innerHTML = `
      <div class="top-product-info">
        <span class="rank-number">${index + 1}</span>
        <img src="${product.image}" class="top-product-img" alt="${product.name}">
        <div>
          <div class="product-name">${product.name}</div>
          <small>${product.category} - <strong>${product.code || '-'}</strong></small>
          ${hasDiscount ? `<small class="discount-info">Diskon: Rp${formatRupiah(discountAmount)}</small>` : ''}
        </div>
      </div>
      <div>
        <div class="total-qty-display">
          <span class="total-qty-badge">${product.totalQty}</span> terjual
        </div>
        <div class="revenue-display">
          ${hasDiscount ? `<span class="strikethrough">Rp${formatRupiah(product.originalRevenue)}</span><br>` : ''}
          <strong class="revenue-amount">Rp${formatRupiah(product.totalRevenue)}</strong>
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

function showSalesTab() {
  showDashboard();
  showDashboardTab('salesReport');
  renderSalesTable();
}
