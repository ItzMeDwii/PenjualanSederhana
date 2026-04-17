// Sales data display and management

let currentSortColumn = '';
let sortDirection = 1;

function toggleSales() {
  const salesDiv = document.getElementById('salesData');
  const salesBtn = document.getElementById('salesTab');

  if (salesDiv.style.display === 'block') {
    salesDiv.style.display = 'none';
    salesBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Lihat Data Penjualan';
  } else {
    renderSalesTable();
    salesDiv.style.display = 'block';
    salesDiv.style.overflowY = 'auto';
    salesBtn.innerHTML = '<i class="fas fa-times"></i> Tutup Data Penjualan';
  }
}

function renderSalesTable() {
  const salesDiv = document.getElementById('salesData');

  if (sales.length === 0) {
    salesDiv.innerHTML = '<div class="empty-state">Belum ada data penjualan</div>';
    return;
  }

  let html = `
    <div class="sales-table-wrapper">
      <table class="sales-table">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Detail Barang</th>
            <th>Harga &amp; Item</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
  `;

  let grandTotalAfterPromo = 0;
  let grandTotalRounded = 0;
  let grandOriginalTotal = 0;
  let grandRoundingSaved = 0;
  let totalCash = 0;
  let totalTransfer = 0;

  sales.forEach((sale, saleIndex) => {
    const saleTotalAfterPromo = sale.totalAfterPromo || sale.total;
    grandTotalAfterPromo += saleTotalAfterPromo;
    grandTotalRounded += sale.total;
    grandOriginalTotal += sale.originalTotal || sale.total;

    if (sale.paymentType && sale.paymentType.toLowerCase() === 'cash') {
      totalCash += saleTotalAfterPromo;
    } else if (sale.paymentType && sale.paymentType.toLowerCase() !== 'cash') {
      totalTransfer += saleTotalAfterPromo;
    }

    const itemsByProduct = {};
    sale.items.forEach(item => {
      const key = `${item.name}-${item.category}`;
      if (!itemsByProduct[key]) {
        itemsByProduct[key] = {
          name: item.name,
          category: item.category,
          artist: item.artist || 'Tanpa Artist',
          image: item.image,
          qty: 0,
          originalPrice: item.price,
          promoPriceRaw: item.promoPrice || item.price,
          roundedPrice: item.roundedPrice || item.price,
          roundingDifference: item.roundingDifference || 0,
          roundingTotal: item.roundingTotal || 0,
          code: item.code,
          hasPromo: (item.promoPrice && item.promoPrice !== item.price) || (item.discountApplied && item.discountApplied > 0)
        };
      }
      itemsByProduct[key].qty += item.qty;
      grandRoundingSaved += (item.roundingTotal || 0);
    });

    Object.values(itemsByProduct).forEach(item => {
      const hasDiscount = item.promoPriceRaw !== item.originalPrice;
      const hasRounding = item.roundingDifference > 0;
      const totalPerItemRounded = item.roundedPrice * item.qty;
      const roundingTotalForItem = item.roundingTotal;

      html += `
        <tr class="sales-item-row ${hasDiscount ? 'has-promo' : ''}">
          <td class="sale-time">${sale.time}</td>
          <td class="sales-item-cell">
            <div class="sales-item">
              <img src="${item.image}" class="sales-item-img" alt="${item.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22%23eee%22/%3E%3C/svg%3E'">
              <div class="sales-item-info">
                <div class="sales-item-code"><strong>${escapeHtml(item.code || '-')}</strong></div>
                <div class="sales-item-category">${escapeHtml(item.category)}</div>
              </div>
            </div>
            ${hasDiscount ? `<div class="sales-item-discount-info">Promo: ${item.qty} barang → Rp${formatRupiah(item.promoPriceRaw)}/item</div>` : ''}
          </td>
          <td class="price-cell">
            <div class="price-container">
              <span class="final-price">Rp${formatRupiah(totalPerItemRounded)}</span>
              ${hasRounding ? `<span class="rounding-saved">(sisa pembulatan: Rp${formatRupiah(roundingTotalForItem)})</span>` : ''}
              <div class="item-qty-info">
                <span class="qty-label">Total item:</span>
                <span class="qty-value">${item.qty}x</span>
              </div>
            </div>
            <div class="payment-info">
              <small>${sale.paymentType || '-'} ${sale.paymentDetails ? ` - ${escapeHtml(sale.paymentDetails)}` : ''}</small>
            </div>
          </td>
          <td class="sales-actions-cell">
            <button class="btn-delete-sales" onclick="deleteSalesRecord(${saleIndex})" title="Hapus transaksi">
              Hapus
            </button>
          </td>
        </tr>
      `;
    });
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  html += `
    <div class="sales-summary">
      <div class="summary-card">
        <h4>Ringkasan Penjualan</h4>
        <div class="summary-row total-after-promo">
          <span> Total Penjualan (harga promo asli):</span>
          <span class="after-promo-amount">Rp${formatRupiah(grandTotalAfterPromo)}</span>
        </div>
        <div class="summary-row total-rounded">
          <span><i class="fas fa-money-bill-alt"></i> Total Setelah Pembulatan (pemasukan aktual):</span>
          <span class="rounded-amount">Rp${formatRupiah(grandTotalRounded)}</span>
        </div>
        <div class="summary-row rounding-saved">
          <span><i class="fas fa-file-alt"></i> Total Sisa Pembulatan:</span>
          <span class="rounding-saved-amount">Rp${formatRupiah(grandRoundingSaved)}</span>
        </div>
        <div class="summary-row total-discount">
          <span><i class="fas fa-tag"></i> Total Diskon (termasuk pembulatan):</span>
          <span class="discount-amount">Rp${formatRupiah(grandOriginalTotal - grandTotalRounded)}</span>
        </div>
      </div>

      <div class="summary-card">
        <h4><i class="fas fa-credit-card"></i> Metode Pembayaran</h4>
        <div class="summary-row cash">
          <span>Cash:</span>
          <span>Rp${formatRupiah(totalCash)}</span>
        </div>
        <div class="summary-row transfer">
          <span>Transfer:</span>
          <span>Rp${formatRupiah(totalTransfer)}</span>
        </div>
        <div class="summary-row total-payment">
          <span>Total Pendapatan (berdasarkan harga promo):</span>
          <span>Rp${formatRupiah(totalCash + totalTransfer)}</span>
        </div>
      </div>
    </div>
  `;

  html += `
    <div class="sales-actions-bottom">
      <button id="downloadExcelBtn" onclick="downloadExcel()" class="btn-download">
        <i class="fas fa-download"></i> Download Data Excel
      </button>
      <button id="deleteAllSalesBtn" onclick="deleteAllSalesRecords()" class="btn-delete-all">
        <i class="fas fa-trash"></i> Hapus Semua Data
      </button>
    </div>
  `;

  salesDiv.innerHTML = html;
}

function renderSortedSalesTable(sortedSales) {
  const salesDiv = document.getElementById('salesData');

  if (sortedSales.length === 0) {
    salesDiv.innerHTML = '<div class="empty-state">Belum ada data penjualan</div>';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Waktu</th>
          <th>Barang</th>
          <th>Total Item</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
  `;

  let grandTotal = 0;
  let totalCash = 0;
  let totalTransfer = 0;

  sortedSales.forEach((sale, saleIndex) => {
    grandTotal += sale.total;

    if (sale.paymentType && sale.paymentType.toLowerCase() === 'cash') {
      totalCash += sale.total;
    } else {
      totalTransfer += sale.total;
    }

    const itemsByProduct = {};
    sale.items.forEach(item => {
      const key = `${item.name}-${item.category}`;
      if (!itemsByProduct[key]) {
        itemsByProduct[key] = {
          name: item.name,
          category: item.category,
          image: item.image,
          qty: 0,
          price: item.price,
          code: item.code
        };
      }
      itemsByProduct[key].qty += item.qty;
    });

    Object.values(itemsByProduct).forEach(item => {
      html += `
        <tr class="sales-item-row">
          <td>${sale.time}</td>
          <td>
            <div class="sales-item">
              <img src="${item.image}" class="sales-item-img" alt="${item.name}">
              <div class="sales-item-info">
                <div class="sales-item-name">${item.name}</div>
                <div class="sales-item-category">${item.category}</div>
                <div class="sales-item-code">Kode: <strong>${item.code || '-'}</strong></div>
              </div>
            </div>
          </td>
          <td style="font-weight: bold; text-align: right;">
            <span class="sales-item-qty">${item.qty}x</span> Rp${formatRupiah(item.price * item.qty)}<br>
            <small>(${sale.paymentType || '-'})</small>
          </td>
          <td class="sales-actions">
            <button class="btn-delete-sales" onclick="deleteSalesRecord(${saleIndex})">Hapus</button>
          </td>
        </tr>
      `;
    });
  });

  html += `</tbody></table>`;
  html += `<div class="sales-total">Total Penjualan: Rp${formatRupiah(grandTotal)}</div>`;
  html += `
    <div class="sales-total" style="font-size:15px; margin-top:0;">
      <span style="color:#27ae60;">Total Cash: Rp${formatRupiah(totalCash)}</span><br>
      <span style="color:#2980b9;">Total Transfer: Rp${formatRupiah(totalTransfer)}</span>
    </div>
  `;
  html += `
    <div class="sales-actions-bottom">
      <button id="downloadExcelBtn" onclick="downloadExcel()">⬇️ Download Data</button>
      <button id="deleteAllSalesBtn" onclick="deleteAllSalesRecords()">🗑️ Hapus Semua Data</button>
    </div>
  `;
  salesDiv.innerHTML = html;

  const headers = salesDiv.querySelectorAll('th[onclick]');
  headers.forEach(header => {
    header.innerHTML = header.innerHTML.replace('▲▼', '').replace('▲', '').replace('▼', '');
    if (header.textContent.includes(currentSortColumn)) {
      header.innerHTML += sortDirection === 1 ? ' ▲' : ' ▼';
    } else {
      header.innerHTML += ' ▲▼';
    }
  });
}

async function deleteSalesItem(saleIndex, itemName, itemCategory) {
  if (confirm(`Apakah Anda yakin ingin menghapus item "${itemName}" dari record penjualan ini?`)) {
    const saleToModify = sales[saleIndex];

    if (saleToModify) {
      saleToModify.items = saleToModify.items.filter(item =>
        !(item.name === itemName && item.category === itemCategory)
      );

      if (saleToModify.items.length === 0) {
        sales.splice(saleIndex, 1);
        showNotification(`Transaksi penjualan berhasil dihapus sepenuhnya.`);
      } else {
        saleToModify.total = saleToModify.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        saleToModify.change = saleToModify.amountPaid - saleToModify.total;
        showNotification(`Item "${itemName}" berhasil dihapus dari transaksi.`);
      }

      await saveToIndexedDB(STORE_NAMES.SALES, sales);
      renderSalesTable();
      renderTopProducts();
    } else {
      showNotification('Transaksi penjualan tidak ditemukan.');
    }
  }
}

async function deleteSalesRecord(index) {
  if (confirm("Apakah Anda yakin ingin menghapus record penjualan ini?")) {
    sales.splice(index, 1);
    await saveToIndexedDB(STORE_NAMES.SALES, sales);
    renderSalesTable();
    renderTopProducts();
  }
}

async function deleteAllSalesRecords() {
  if (confirm("Apakah Anda yakin ingin menghapus SEMUA data penjualan?\nIni tidak dapat dibatalkan!")) {
    try {
      sales = [];
      await saveToIndexedDB(STORE_NAMES.SALES, sales);
      renderSalesTable();
      renderTopProducts();
      showNotification('Semua data penjualan berhasil dihapus!');
    } catch (error) {
      console.error("Gagal menghapus semua data penjualan:", error);
      showNotification('Gagal menghapus semua data penjualan!');
    }
  }
}

function filterSalesByDate() {
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');

  if (!startDateInput.value && !endDateInput.value) {
    renderSalesTable();
    return;
  }

  const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
  const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

  if (startDate && endDate && startDate > endDate) {
    showNotification('Tanggal mulai tidak boleh lebih besar dari tanggal akhir!');
    return;
  }

  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.time.split(',')[0].split('/').reverse().join('-'));

    if (startDate && endDate) {
      return saleDate >= startDate && saleDate <= endDate;
    } else if (startDate) {
      return saleDate >= startDate;
    } else if (endDate) {
      return saleDate <= endDate;
    }
    return true;
  });

  renderSortedSalesTable(filteredSales);
}

function resetSalesDateFilter() {
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  renderSalesTable();
}
