// Artist management and artist sales reporting

function openArtistModal() {
  document.getElementById('artistModal').style.display = 'flex';
  document.body.classList.add('modal-open');
  renderArtistList();
}

function closeArtistModal() {
  document.getElementById('artistModal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

function renderArtistList() {
  const artistList = document.getElementById('artistList');
  artistList.innerHTML = '';

  if (artists.length === 0) {
    artistList.innerHTML = '<div class="empty-state">Belum ada artist.</div>';
    return;
  }

  artists.forEach((artist, index) => {
    const item = document.createElement('div');
    item.className = 'artist-item';
    item.setAttribute('data-artist-name', artist);

    item.innerHTML = `
      <span id="artistName-${index}">${artist}</span>
      <div class="artist-actions">
        <button class="btn-edit-artist" onclick="editArtistName('${artist}', ${index})"><i class="fas fa-pencil-alt"></i> Edit</button>
        <button class="btn-delete-artist" onclick="deleteArtist('${artist}', ${index})"><i class="fas fa-trash"></i> Hapus</button>
      </div>
    `;
    artistList.appendChild(item);
  });
}

async function addNewArtist(event) {
  event.preventDefault();
  const input = document.getElementById('newArtistName');
  const artistName = input.value.trim();

  if (!artistName) {
    showNotification('Nama artist tidak boleh kosong!');
    return;
  }
  if (artists.includes(artistName)) {
    showNotification('Artist dengan nama tersebut sudah ada!');
    return;
  }

  artists.push(artistName);
  artists.sort((a, b) => a.localeCompare(b));

  try {
    await saveToIndexedDB(STORE_NAMES.ARTISTS, artists.map(name => ({ name })));
    renderArtistList();
    populateArtistSelects();

    if (document.getElementById('dashboardModal').style.display === 'flex') {
      renderArtistSalesTable();
    }

    showNotification('Artist berhasil ditambahkan!');
    input.value = '';
  } catch (error) {
    console.error('Gagal menambahkan artist:', error);
    showNotification('Gagal menambahkan artist!');
  }
}

function editArtistName(oldArtistName, index) {
  const artistItem = document.querySelector(`.artist-item[data-artist-name="${oldArtistName}"]`);
  if (!artistItem) return;

  const artistNameSpan = artistItem.querySelector(`#artistName-${index}`);
  const artistActionsDiv = artistItem.querySelector('.artist-actions');

  const originalName = artistNameSpan.textContent;

  artistNameSpan.innerHTML = `
    <input type="text" id="editArtistInput-${index}" value="${originalName}" />
  `;

  artistActionsDiv.innerHTML = `
    <button class="btn-save-artist" onclick="saveArtistName('${oldArtistName}', ${index})"><i class="fas fa-save"></i> Simpan</button>
    <button class="btn-cancel-edit" onclick="cancelEditArtistName('${oldArtistName}', ${index}, '${originalName}')"><i class="fas fa-times"></i> Batal</button>
  `;

  document.getElementById(`editArtistInput-${index}`).focus();
}

async function saveArtistName(oldArtistName, index) {
  const newArtistInput = document.getElementById(`editArtistInput-${index}`);
  const newArtistName = newArtistInput.value.trim();

  if (!newArtistName) {
    showNotification('Nama artist tidak boleh kosong!');
    return;
  }
  if (newArtistName === oldArtistName) {
    cancelEditArtistName(oldArtistName, index, oldArtistName);
    return;
  }
  if (artists.includes(newArtistName)) {
    showNotification('Artist dengan nama tersebut sudah ada!');
    return;
  }

  if (!confirm(`Ubah nama artist dari "${oldArtistName}" menjadi "${newArtistName}"?`)) {
    cancelEditArtistName(oldArtistName, index, oldArtistName);
    return;
  }

  try {
    artists[index] = newArtistName;
    artists.sort((a, b) => a.localeCompare(b));

    for (const category in data) {
      data[category].forEach(product => {
        if (product.artist === oldArtistName) {
          product.artist = newArtistName;
        }
      });
    }

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.artist === oldArtistName) {
          item.artist = newArtistName;
        }
      });
    });

    await Promise.all([
      saveToIndexedDB(STORE_NAMES.ARTISTS, artists.map(name => ({ name }))),
      saveToIndexedDB(STORE_NAMES.PRODUCTS, data),
      saveToIndexedDB(STORE_NAMES.SALES, sales)
    ]);

    renderArtistList();
    populateArtistSelects();
    renderProducts();

    if (document.getElementById('dashboardModal').style.display === 'flex') {
      renderSalesTable();
      renderArtistSalesTable();
    }

    showNotification('Artist berhasil diubah!');
  } catch (error) {
    console.error('Gagal menyimpan perubahan artist:', error);
    showNotification('Gagal menyimpan perubahan artist!');
  }
}

function cancelEditArtistName(oldArtistName, index, originalDisplayName) {
  const artistItem = document.querySelector(`.artist-item[data-artist-name="${oldArtistName}"]`);
  if (!artistItem) return;

  const artistNameSpan = artistItem.querySelector(`#artistName-${index}`);
  const artistActionsDiv = artistItem.querySelector('.artist-actions');

  artistNameSpan.textContent = originalDisplayName;

  artistActionsDiv.innerHTML = `
    <button class="btn-edit-artist" onclick="editArtistName('${oldArtistName}', ${index})"><i class="fas fa-pencil-alt"></i> Edit</button>
    <button class="btn-delete-artist" onclick="deleteArtist('${oldArtistName}', ${index})"><i class="fas fa-trash"></i> Hapus</button>
  `;
}

async function deleteArtist(artistName, index) {
  if (!confirm(`Hapus artist "${artistName}"?`)) {
    return;
  }

  try {
    artists.splice(index, 1);

    for (const category in data) {
      data[category].forEach(product => {
        if (product.artist === artistName) {
          product.artist = '';
        }
      });
    }

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.artist === artistName) {
          item.artist = '';
        }
      });
    });

    await Promise.all([
      saveToIndexedDB(STORE_NAMES.ARTISTS, artists.map(name => ({ name }))),
      saveToIndexedDB(STORE_NAMES.PRODUCTS, data),
      saveToIndexedDB(STORE_NAMES.SALES, sales)
    ]);

    renderArtistList();
    populateArtistSelects();
    renderProducts();

    if (document.getElementById('dashboardModal').style.display === 'flex') {
      renderSalesTable();
      renderArtistSalesTable();
    }

    showNotification('Artist berhasil dihapus!');
  } catch (error) {
    console.error('Gagal menghapus artist:', error);
    showNotification('Gagal menghapus artist!');
  }
}

function populateArtistSelects() {
  document.querySelectorAll('select[name="artist"]').forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">Tanpa Artist</option>';

    artists.forEach(artist => {
      const option = document.createElement('option');
      option.value = artist;
      option.textContent = artist;
      select.appendChild(option);
    });

    if (currentValue && artists.includes(currentValue)) {
      select.value = currentValue;
    } else {
      select.value = '';
    }
  });

  const artistFilter = document.getElementById('artistFilter');
  if (artistFilter) {
    const currentValue = artistFilter.value;
    artistFilter.innerHTML = '<option value="">Semua Artist</option>';

    artists.forEach(artist => {
      const option = document.createElement('option');
      option.value = artist;
      option.textContent = artist;
      artistFilter.appendChild(option);
    });

    if (currentValue && artists.includes(currentValue)) {
      artistFilter.value = currentValue;
    } else {
      artistFilter.value = '';
    }
  }

  const editArtistSelect = document.getElementById('artistSelect-edit');
  if (editArtistSelect) {
    const currentValue = editArtistSelect.value;
    editArtistSelect.innerHTML = '<option value="">Tanpa Artist</option>';

    artists.forEach(artist => {
      const option = document.createElement('option');
      option.value = artist;
      option.textContent = artist;
      editArtistSelect.appendChild(option);
    });

    if (currentValue && artists.includes(currentValue)) {
      editArtistSelect.value = currentValue;
    } else {
      editArtistSelect.value = '';
    }
  }
}

function populateArtistSalesFilter() {
  const artistFilter = document.getElementById('artistSalesFilter');
  if (artistFilter) {
    const currentValue = artistFilter.value;
    artistFilter.innerHTML = '<option value="">Semua Artist</option><option value="Tanpa Artist">   Tanpa Artist</option>';

    const allArtists = new Set();

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.artist && item.artist.trim() !== '') {
          allArtists.add(item.artist);
        }
      });
    });

    artists.forEach(artist => {
      if (artist && artist.trim() !== '') {
        allArtists.add(artist);
      }
    });

    Array.from(allArtists).sort().forEach(artist => {
      const option = document.createElement('option');
      option.value = artist;
      option.textContent = `  ${artist}`;
      artistFilter.appendChild(option);
    });

    if (currentValue === 'Tanpa Artist') {
      artistFilter.value = 'Tanpa Artist';
    } else if (currentValue && allArtists.has(currentValue)) {
      artistFilter.value = currentValue;
    } else {
      artistFilter.value = '';
    }
  }
}

function filterSalesByArtist() {
  const selectedArtist = document.getElementById('artistSalesFilter').value;
  renderArtistSalesTable(selectedArtist);
}

function renderArtistSalesTable(selectedArtist = '') {
  const artistSalesData = document.getElementById('artistSalesData');

  if (!artistSalesData) {
    console.error('Element artistSalesData tidak ditemukan');
    return;
  }

  const artistStats = {};

  sales.forEach(sale => {
    sale.items.forEach(item => {
      let artistName = item.artist || 'Tanpa Artist';
      if (!artistName || artistName.trim() === '') {
        artistName = 'Tanpa Artist';
      }

      const priceUsed = item.roundedPrice || item.discountedPrice || item.price;
      const itemTotal = priceUsed * item.qty;
      const originalTotal = item.price * item.qty;

      if (!artistStats[artistName]) {
        artistStats[artistName] = {
          totalSales: 0,
          originalSales: 0,
          totalDiscount: 0,
          totalItems: 0,
          transactionCount: new Set()
        };
      }

      artistStats[artistName].totalSales += itemTotal;
      artistStats[artistName].originalSales += originalTotal;
      artistStats[artistName].totalDiscount += (originalTotal - itemTotal);
      artistStats[artistName].totalItems += item.qty;
      artistStats[artistName].transactionCount.add(sale.time);
    });
  });

  Object.keys(artistStats).forEach(artistName => {
    artistStats[artistName].transactionCount = artistStats[artistName].transactionCount.size;
  });

  let displayStats = artistStats;
  if (selectedArtist && selectedArtist !== '' && selectedArtist !== 'Tanpa Artist') {
    displayStats = {};
    if (artistStats[selectedArtist]) {
      displayStats[selectedArtist] = artistStats[selectedArtist];
    }
  } else if (selectedArtist === 'Tanpa Artist') {
    displayStats = {};
    if (artistStats['Tanpa Artist']) {
      displayStats['Tanpa Artist'] = artistStats['Tanpa Artist'];
    }
  }

  const sortedArtists = Object.entries(displayStats)
    .map(([artistName, stats]) => ({
      artistName,
      ...stats
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  if (sortedArtists.length === 0) {
    artistSalesData.innerHTML = '<div class="empty-state">Belum ada data penjualan untuk artist' +
      (selectedArtist ? ` "${selectedArtist}"` : '') + '</div>';
    return;
  }

  let html = `
    <div class="artist-ranking-header">
      <h4>Peringkat Artist Berdasarkan </h4>
      <br>
    </div>
    <div class="artist-ranking-list">
  `;

  sortedArtists.forEach((artist, index) => {
    const rankClass = index === 0 ? 'rank-first' :
                     index === 1 ? 'rank-second' :
                     index === 2 ? 'rank-third' : 'rank-other';
    const hasDiscount = artist.totalDiscount > 0;
    const isTanpaArtist = artist.artistName === 'Tanpa Artist';

    html += `
      <div class="artist-rank-item ${rankClass} ${isTanpaArtist ? 'tanpa-artist-rank' : ''}">
        <div class="artist-rank-info">
          <div class="artist-rank-number">${index + 1}</div>
          <div class="artist-rank-details">
            <div class="artist-rank-name ${isTanpaArtist ? 'tanpa-artist-name' : ''}">
              ${isTanpaArtist ? '   ' : '  '}${artist.artistName}
            </div>
            <div class="artist-rank-stats">
              ${hasDiscount ? `<span class="stat-item strikethrough">Rp${formatRupiah(artist.originalSales)}</span>` : ''}
              <span class="stat-item highlight"> Rp${formatRupiah(artist.totalSales)}</span>
              <span class="stat-item">Terjual ${artist.totalItems} item</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  html += `
    <div class="artist-sales-details">
      <h4>Detail Penjualan per Artist</h4>
      <div class="artist-sales-table-container">
        <table class="artist-sales-table">
          <thead>
            <tr>
              <th>Artist</th>
              <th>Original</th>
              <th>Setelah Promo</th>
              <th>Diskon</th>
              <th>Barang Terjual</th>
              <th>Transaksi</th>
            </tr>
          </thead>
          <tbody>
  `;

  sortedArtists.forEach(artist => {
    const isTanpaArtist = artist.artistName === 'Tanpa Artist';
    html += `
      <tr>
        <td><span class="artist-badge ${isTanpaArtist ? 'tanpa-artist-badge' : ''}">${isTanpaArtist ? '   ' : '  '}${artist.artistName}</span></td>
        <td class="original-cell">Rp${formatRupiah(artist.originalSales)}</td>
        <td class="final-cell"><strong>Rp${formatRupiah(artist.totalSales)}</strong></td>
        <td class="discount-cell">${artist.totalDiscount > 0 ? `-Rp${formatRupiah(artist.totalDiscount)}` : '-'}</td>
        <td>${artist.totalItems} item</td>
        <td>${artist.transactionCount}</td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>

    <div class="sales-actions-bottom">
      <button id="downloadArtistExcelBtn" onclick="downloadArtistExcel()">⬇️ Download Data Artist</button>
    </div>
  `;

  artistSalesData.innerHTML = html;
}

function calculateArtistStats(artistName, salesData) {
  let totalSales = 0;
  let totalItems = 0;
  let transactionCount = 0;

  salesData.forEach(sale => {
    const artistItems = sale.items.filter(item => {
      if (artistName === 'Tanpa Artist') {
        return !item.artist || item.artist.trim() === '';
      } else {
        return item.artist === artistName;
      }
    });

    if (artistItems.length > 0) {
      transactionCount++;
      artistItems.forEach(item => {
        totalSales += item.price * item.qty;
        totalItems += item.qty;
      });
    }
  });

  return { totalSales, totalItems, transactionCount };
}

function filterArtistSalesByDate() {
  const startDateInput = document.getElementById('artistStartDate');
  const endDateInput = document.getElementById('artistEndDate');
  const selectedArtist = document.getElementById('artistSalesFilter').value;

  if (!startDateInput.value && !endDateInput.value) {
    renderArtistSalesTable(selectedArtist);
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

  renderArtistSalesTableWithData(selectedArtist, filteredSales);
}

function resetArtistSalesDateFilter() {
  document.getElementById('artistStartDate').value = '';
  document.getElementById('artistEndDate').value = '';
  const selectedArtist = document.getElementById('artistSalesFilter').value;
  renderArtistSalesTable(selectedArtist);
}

function renderArtistSalesTableWithData(selectedArtist, filteredSales) {
  const artistSalesData = document.getElementById('artistSalesData');

  let displaySales = filteredSales;
  if (selectedArtist) {
    displaySales = filteredSales.filter(sale => {
      return sale.items.some(item => item.artist === selectedArtist);
    });
  }

  if (displaySales.length === 0) {
    artistSalesData.innerHTML = '<div class="empty-state">Belum ada data penjualan' +
      (selectedArtist ? ` untuk artist "${selectedArtist}"` : '') + ' pada periode tanggal yang dipilih</div>';
    return;
  }

  let grandTotal = 0;
  let totalCash = 0;
  let totalTransfer = 0;

  let html = `<table><thead><tr>
    <th>Waktu</th><th>Barang</th><th>Artist</th><th>Total Item</th><th>Aksi</th>
  </tr></thead><tbody>`;

  displaySales.forEach((sale, saleIndex) => {
    grandTotal += sale.total;
    if (sale.paymentType && sale.paymentType.toLowerCase() === 'cash') {
      totalCash += sale.total;
    } else {
      totalTransfer += sale.total;
    }

    const itemsByProduct = {};
    sale.items.forEach(item => {
      const key = `${item.name}-${item.category}-${item.artist || 'No Artist'}`;
      if (!itemsByProduct[key]) {
        itemsByProduct[key] = {
          name: item.name,
          category: item.category,
          artist: item.artist || 'Tanpa Artist',
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
          <td><span class="artist-badge">${item.artist}</span></td>
          <td style="font-weight: bold; text-align: right;">
            <span class="sales-item-qty">${item.qty}x</span> Rp${formatRupiah(item.price * item.qty)}<br>
            <small>(${sale.paymentType || '-'} ${sale.paymentDetails ? ` - ${sale.paymentDetails}` : ''})</small>
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

  if (selectedArtist) {
    const artistStats = calculateArtistStats(selectedArtist, displaySales);
    html += `
      <div class="artist-stats" style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <h5>Statistik Artist: ${selectedArtist}</h5>
        <p>Total Penjualan: <strong>Rp${formatRupiah(artistStats.totalSales)}</strong></p>
        <p>Total Item Terjual: <strong>${artistStats.totalItems}</strong></p>
        <p>Jumlah Transaksi: <strong>${artistStats.transactionCount}</strong></p>
      </div>
    `;
  }

  html += `
    <div class="sales-actions-bottom">
      <button id="downloadArtistExcelBtn" onclick="downloadArtistExcel()">⬇️ Download Data</button>
    </div>
  `;

  artistSalesData.innerHTML = html;
}

function downloadArtistExcel() {
  try {
    const artistStats = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const artistName = item.artist || 'Tanpa Artist';
        const itemTotal = item.price * item.qty;

        if (!artistStats[artistName]) {
          artistStats[artistName] = {
            totalSales: 0,
            totalItems: 0,
            transactionCount: new Set()
          };
        }

        artistStats[artistName].totalSales += itemTotal;
        artistStats[artistName].totalItems += item.qty;
        artistStats[artistName].transactionCount.add(sale.time);
      });
    });

    const sortedArtists = Object.entries(artistStats)
      .map(([artistName, stats]) => ({
        artistName,
        totalSales: stats.totalSales,
        totalItems: stats.totalItems,
        transactionCount: stats.transactionCount.size
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    if (sortedArtists.length === 0) {
      showNotification("Belum ada data penjualan untuk artist!");
      return;
    }

    const reportDate = new Date().toLocaleString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const ws_data = [
      ["Laporan Peringkat Artist Berdasarkan Pendapatan - Data Diambil Pada: " + reportDate],
      [],
      ["Peringkat", "Nama Artist", "Total Pendapatan", "Jumlah Item Terjual", "Jumlah Transaksi"]
    ];

    sortedArtists.forEach((artist, index) => {
      ws_data.push([index + 1, artist.artistName, artist.totalSales, artist.totalItems, artist.transactionCount]);
    });

    const grandTotalSales = sortedArtists.reduce((sum, a) => sum + a.totalSales, 0);
    const grandTotalItems = sortedArtists.reduce((sum, a) => sum + a.totalItems, 0);
    const grandTotalTransactions = sortedArtists.reduce((sum, a) => sum + a.transactionCount, 0);

    ws_data.push([]);
    ws_data.push(["TOTAL KESELURUHAN", "", grandTotalSales, grandTotalItems, grandTotalTransactions]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{wch: 10}, {wch: 30}, {wch: 20}, {wch: 20}, {wch: 15}];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Peringkat_Artist");

    XLSX.writeFile(wb, `Peringkat_Artist_${new Date().toISOString().slice(0,10)}.xlsx`);
    showNotification("Data peringkat artist berhasil diunduh dalam format Excel!");
  } catch (error) {
    console.error("Gagal mengunduh data Excel:", error);
    showNotification("Gagal mengunduh data Excel! " + error.message);
  }
}

async function syncArtistsFromProducts() {
  const productArtists = new Set();

  for (const category in data) {
    data[category].forEach(product => {
      if (product.artist && product.artist.trim() !== '') {
        productArtists.add(product.artist.trim());
      }
    });
  }

  let newArtistsAdded = 0;
  productArtists.forEach(artistName => {
    if (!artists.includes(artistName)) {
      artists.push(artistName);
      newArtistsAdded++;
    }
  });

  if (newArtistsAdded > 0) {
    artists.sort((a, b) => a.localeCompare(b));
    await saveToIndexedDB(STORE_NAMES.ARTISTS, artists.map(name => ({ name })));
    populateArtistSelects();
    renderArtistList();
    showNotification(`${newArtistsAdded} artist baru ditemukan dan ditambahkan!`);
  } else {
    showNotification('Semua artist dari produk sudah terdaftar.');
  }

  return newArtistsAdded;
}
