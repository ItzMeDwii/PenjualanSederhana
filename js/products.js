// Product rendering, navbar, search, and CRUD operations

function updateNavbarCategories() {
  const navbar = document.querySelector('.navbar');
  const tabContainer = document.getElementById('dynamic-tabs');
  const categoryFilterBtns = document.getElementById('categoryFilterBtns');

  navbar.innerHTML = '';
  tabContainer.innerHTML = '';
  if (categoryFilterBtns) categoryFilterBtns.innerHTML = '';

  // Left: applied filters display
  const filtersDisplay = document.createElement('div');
  filtersDisplay.id = 'navbarFiltersDisplay';
  filtersDisplay.className = 'navbar-filters-display';
  navbar.appendChild(filtersDisplay);

  // Right: action buttons
  const actionsGroup = document.createElement('div');
  actionsGroup.className = 'navbar-actions';
  navbar.appendChild(actionsGroup);

  const manageBtn = document.createElement('button');
  manageBtn.className = 'manage-category';
  manageBtn.innerHTML = '<i class="fas fa-plus"></i> Jenis Barang';
  manageBtn.onclick = showCategoryModal;
  actionsGroup.appendChild(manageBtn);

  const bulkDeleteBtn = document.createElement('button');
  bulkDeleteBtn.className = 'navbar-bulk-btn navbar-bulk-delete-btn';
  bulkDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Hapus';
  bulkDeleteBtn.title = 'Bulk Delete';
  bulkDeleteBtn.onclick = () => {
    if (isDeleteMode && bulkActionMode === 'delete') exitDeleteMode();
    else activateBulkDeleteMode();
  };
  actionsGroup.appendChild(bulkDeleteBtn);

  const bulkEditBtn = document.createElement('button');
  bulkEditBtn.className = 'navbar-bulk-btn navbar-bulk-edit-btn';
  bulkEditBtn.innerHTML = '<i class="fas fa-pencil-alt"></i> Edit';
  bulkEditBtn.title = 'Bulk Edit';
  bulkEditBtn.onclick = () => {
    if (isDeleteMode && bulkActionMode === 'edit') exitDeleteMode();
    else activateBulkEditSelectionMode();
  };
  actionsGroup.appendChild(bulkEditBtn);

  if (categories.filter(c => c && typeof c === 'string').length > 0) {
    const allBtn = document.createElement('button');
    allBtn.textContent = 'Semua';
    allBtn.dataset.tab = '__all__';
    allBtn.onclick = () => showTab('__all__');
    if (categoryFilterBtns) categoryFilterBtns.appendChild(allBtn);

    if (!document.getElementById('__all__')) {
      const allTab = document.createElement('div');
      allTab.id = '__all__';
      allTab.className = 'tab-content';
      allTab.innerHTML = `<div class="product-list" id="__all__-list"></div>`;
      tabContainer.appendChild(allTab);
    }
  }

  categories.filter(cat => cat && typeof cat === 'string').forEach(category => {
    const button = document.createElement('button');
    button.textContent = capitalizeFirstLetter(category);
    button.dataset.tab = category;
    button.onclick = () => showTab(category);
    if (categoryFilterBtns) categoryFilterBtns.appendChild(button);

    if (!document.getElementById(category)) {
      const tabContent = document.createElement('div');
      tabContent.id = category;
      tabContent.className = 'tab-content';

      let artistOptions = '<option value="">Tanpa Artist</option>';
      artists.forEach(artist => {
        artistOptions += `<option value="${escapeHtml(artist)}">${escapeHtml(artist)}</option>`;
      });

      tabContent.innerHTML = `
        <div class="tag-filter-bar" id="${category}-tag-filter"></div>
        <div class="product-list" id="${category}-list"></div>
        <form class="add-form" onsubmit="addProduct(event, '${category}')">
          <b>Tambah barang (${capitalizeFirstLetter(category)}) </b>
          <p>Kode Barang</p>
          <input type="text" name="code" placeholder="Kode Barang" required />
          <label>Artist</label>
          <select name="artist">
            ${artistOptions}
          </select>
          <div class="image-input-container image-paste-area">
            <div class="image-source-buttons">
              <button type="button" class="image-source-btn" onclick="openCamera('${category}')"><i class="fas fa-camera"></i> Kamera</button>
              <button type="button" class="image-source-btn" onclick="openGallery('${category}')"><i class="fas fa-images"></i> Galeri</button>
            </div>
            <div class="paste-instruction">atau tempel gambar di sini</div>
            <input type="file" id="imageInput-${category}" name="imageFile" accept="image/*"
              onchange="previewImage(event, '${category}')" style="display: none">
            <img id="imagePreview-${category}" class="preview" style="display: none"/>
          </div>
          <p>Harga</p>
          <input type="text" name="price" placeholder="Harga (Rp)" required oninput="formatRupiahInput(this)" inputmode="numeric" pattern="[0-9.]*" />
          <p>Stok</p>
          <input type="number" name="stock" placeholder="Stok Barang" required min="0" />
          <label>Tags <span style="font-weight:normal;font-size:12px;color:#888;">(pisahkan koma, contoh: standard, mini)</span></label>
          <input type="text" name="tags" placeholder="Contoh: standard, mini, A5" autocomplete="off" />
          <button type="submit"><i class="fas fa-plus"></i> Tambah Barang</button>
          <button type="button" class="bulk-open-btn" onclick="openBulkAddModal('${category}')">
            <i class="fas fa-layer-group"></i> Tambah Massal
          </button>
        </form>
      `;
      tabContainer.appendChild(tabContent);
    }
  });
}

function filterProducts(searchTerm) {
  searchTerm = searchTerm.toLowerCase().trim();
  const clearSearchButton = document.getElementById('clearSearchButton');
  const dynamicTabsContainer = document.getElementById('dynamic-tabs');
  let searchResultsTab = document.getElementById('searchResultsTab');

  if (searchTerm.length > 0) {
    clearSearchButton.style.display = 'block';
  } else {
    clearSearchButton.style.display = 'none';
  }

  if (!searchTerm) {
    if (searchResultsTab) {
      searchResultsTab.remove();
    }
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.style.display = 'none';
      tab.classList.remove('active');
    });
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab && document.getElementById(savedTab)) {
      showTab(savedTab);
    } else if (categories.length > 0) {
      showTab(categories[0]);
    }
    return;
  }

  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
    tab.classList.remove('active');
  });

  if (!searchResultsTab) {
    searchResultsTab = document.createElement('div');
    searchResultsTab.id = 'searchResultsTab';
    searchResultsTab.className = 'tab-content';
    dynamicTabsContainer.appendChild(searchResultsTab);
  }

  searchResultsTab.classList.add('active');
  searchResultsTab.style.display = 'block';

  let productsFoundInSearch = [];
  for (const categoryName in data) {
    if (data.hasOwnProperty(categoryName)) {
      data[categoryName].forEach(product => {
        const productCode = product.code ? product.code.toLowerCase() : '';
        if (productCode.includes(searchTerm)) {
          const originalIndex = data[categoryName].indexOf(product);
          productsFoundInSearch.push({ product, categoryName, originalIndex });
        }
      });
    }
  }

  let searchResultsHtml = '';
  if (productsFoundInSearch.length > 0) {
    searchResultsHtml += '<div class="product-list">';
    productsFoundInSearch.forEach(item => {
      const product = item.product;
      const category = item.categoryName;
      const originalIndex = item.originalIndex;

      const cartItem = cart.find(c => c.name === product.code || c.name === product.name);
      const cartQty = cartItem ? cartItem.qty : 0;
      const isOutOfStock = product.stock <= 0;
      const hasNoArtist = !product.artist || product.artist.trim() === '';

      const productId = `${category}|${originalIndex}`;

      searchResultsHtml += `
        <div class="product-card" data-category="${category}" data-index="${originalIndex}">
          <div class="product-img-container" data-product-id="${productId}">
            ${cartQty > 0 ? `<div class="product-badge">${cartQty}</div>` : ''}
            ${product.code ? `<div class="product-code-badge">${product.code}</div>` : ''}
            <img src="${product.image}" class="product-img" alt="${product.code}" loading="lazy">
          </div>
          <div class="product-info">
            <div>
              <h3 class="product-name">${product.code}</h3>
              ${hasNoArtist ?
                `<div class="product-artist no-artist">    Tanpa Artist</div>` :
                `<div class="product-artist has-artist">   ${escapeHtml(product.artist)}</div>`
              }
              <div class="product-price">Rp${formatRupiah(product.price)}</div>
              <div class="stock-info-container">
                <div class="stock-info">
                  <span class="stock-label">Stok: <span class="stock-value">${product.stock}</span></span>
                </div>
              </div>
            </div>
            <div class="quantity-controls">
              <button onclick="decreaseQuantity('${category}', ${originalIndex})" ${isOutOfStock ? 'disabled' : ''}>−</button>
              <input type="text" value="${cartQty}" id="qty-${category}-${originalIndex}" readonly />
              <button onclick="increaseQuantity('${category}', ${originalIndex})" ${isOutOfStock ? 'disabled' : ''}>+</button>
            </div>
            <div class="button-group">
              <button class="action-btn btn-edit" onclick="editProduct('${category}', ${originalIndex}); event.stopPropagation();"><i class="fas fa-pencil-alt"></i></button>
              <button class="action-btn btn-delete" onclick="deleteProduct('${category}', ${originalIndex}); event.stopPropagation();"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>
      `;
    });
    searchResultsHtml += '</div>';
  } else {
    searchResultsHtml = '<div class="empty-state search-message">Tidak ditemukan produk dengan kode tersebut</div>';
  }
  searchResultsTab.innerHTML = searchResultsHtml;

  setTimeout(() => {
    const searchCards = searchResultsTab.querySelectorAll('.product-card');
    searchCards.forEach((card) => {
      const imgContainer = card.querySelector('.product-img-container');
      if (imgContainer && imgContainer.dataset.productId) {
        const [category, index] = imgContainer.dataset.productId.split('|');
        setupLongPressOnProductCard(card, category, parseInt(index));
      }
    });
  }, 100);

  document.querySelectorAll('#categoryFilterBtns button').forEach(btn => {
    btn.classList.remove('active-category');
    btn.style.backgroundColor = '';
  });
  adjustContentMargin();
}


function renderAllProductsTab() {
  const container = document.getElementById('__all__-list');
  if (!container) return;
  container.innerHTML = '';

  const activeTags = activeTagFilters['__all__'] || new Set();

  const allItems = [];
  categories.filter(c => c && typeof c === 'string').forEach(category => {
    if (data[category] && Array.isArray(data[category])) {
      data[category].forEach((item, index) => {
        if (activeTags.size > 0) {
          const itemTags = item.tags || [];
          if (![...activeTags].every(tag => itemTags.includes(tag))) return;
        }
        allItems.push({ item, category, index });
      });
    }
  });

  allItems.sort((a, b) => naturalCompare(a.item, b.item));

  allItems.forEach(({ item, category, index }) => {
    const isOutOfStock = item.stock <= 0;
    const hasNoArtist = !item.artist || item.artist.trim() === '';
    const cartItem = cart.find(c => c.name === item.code || c.name === item.name);
    const cartQty = cartItem ? cartItem.qty : 0;
    const productId = `${category}|${index}`;
    const tagsHtml = (item.tags && item.tags.length > 0)
      ? `<div class="product-tags">${item.tags.map(t => `<span class="product-tag">${escapeHtml(t)}</span>`).join('')}</div>`
      : '';

    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-category', category);
    card.setAttribute('data-index', index);
    card.innerHTML = `
      <div class="product-img-container" data-product-id="${productId}">
        ${cartQty > 0 ? `<div class="product-badge">${cartQty}</div>` : ''}
        ${item.code ? `<div class="product-code-badge">${item.code}</div>` : ''}
        <img src="${item.image}" class="product-img" alt="${item.name}" loading="lazy">
      </div>
      <div class="product-info">
        <div>
          ${hasNoArtist ?
            `<div class="product-artist no-artist" style="font-size: 14px;">    Tanpa Artist</div>` :
            `<div class="product-artist has-artist" style="font-size: 14px;">   ${escapeHtml(item.artist)}</div>`
          }
          <div class="product-price">Rp${formatRupiah(item.price)}</div>
          <div class="stock-info-container">
            <div class="stock-info">
              <span class="stock-label">Stok: <span class="stock-value">${item.stock}</span></span>
            </div>
          </div>
          ${tagsHtml}
        </div>
        <div class="quantity-controls">
          <button onclick="decreaseQuantity('${category}', ${index})" ${isOutOfStock ? 'disabled' : ''}>−</button>
          <input type="text" value="${cartQty}" id="qty-${category}-${index}" readonly />
          <button onclick="increaseQuantity('${category}', ${index})" ${isOutOfStock ? 'disabled' : ''}>+</button>
        </div>
        <div class="button-group">
          <button class="action-btn btn-edit" onclick="editProduct('${category}', ${index}); event.stopPropagation();"><i class="fas fa-pencil-alt"></i></button>
          <button class="action-btn btn-delete" onclick="deleteProduct('${category}', ${index}); event.stopPropagation();"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;

    setupLongPressOnProductCard(card, category, index);
    container.appendChild(card);
  });
}

function renderProducts() {
  const validCategories = categories.filter(cat => cat && typeof cat === 'string');

  const activeCategory = localStorage.getItem('activeTab');
  if (activeCategory && activeCategory !== '__all__') {
    renderTagFilterBar(activeCategory);
  } else if (activeCategory === '__all__') {
    renderTagFilterBar('__all__');
  }

  if (document.getElementById('__all__-list')) {
    renderAllProductsTab();
  }

  validCategories.forEach(category => {
    const container = document.getElementById(`${category}-list`);
    if (!container) {
      console.warn(`Kontainer produk untuk kategori "${category}" tidak ditemukan.`);
      return;
    }

    container.innerHTML = '';

    if (data[category] && Array.isArray(data[category])) {
      data[category].sort(naturalCompare);

      const activeTags = activeTagFilters[category] || new Set();

      data[category].forEach((item, index) => {
        if (activeTags.size > 0) {
          const itemTags = item.tags || [];
          const hasTag = [...activeTags].every(tag => itemTags.includes(tag));
          if (!hasTag) return;
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-category', category);
        card.setAttribute('data-index', index);

        const isOutOfStock = item.stock <= 0;
        const hasNoArtist = !item.artist || item.artist.trim() === '';
        const cartItem = cart.find(c => c.name === item.code || c.name === item.name);
        const cartQty = cartItem ? cartItem.qty : 0;
        const productId = `${category}|${index}`;
        const tagsHtml = (item.tags && item.tags.length > 0)
          ? `<div class="product-tags">${item.tags.map(t => `<span class="product-tag">${escapeHtml(t)}</span>`).join('')}</div>`
          : '';

        card.innerHTML = `
          <div class="product-img-container" data-product-id="${productId}">
            ${cartQty > 0 ? `<div class="product-badge">${cartQty}</div>` : ''}
            ${item.code ? `<div class="product-code-badge">${item.code}</div>` : ''}
            <img src="${item.image}" class="product-img" alt="${item.name}" loading="lazy">
          </div>
          <div class="product-info">
            <div>
              ${hasNoArtist ?
                `<div class="product-artist no-artist" style="font-size: 14px;">    Tanpa Artist</div>` :
                `<div class="product-artist has-artist" style="font-size: 14px;">   ${escapeHtml(item.artist)}</div>`
              }
              <div class="product-price">Rp${formatRupiah(item.price)}</div>
              <div class="stock-info-container">
                <div class="stock-info">
                  <span class="stock-label">Stok: <span class="stock-value">${item.stock}</span></span>
                </div>
              </div>
              ${tagsHtml}
            </div>
            <div class="quantity-controls">
              <button onclick="decreaseQuantity('${category}', ${index})" ${isOutOfStock ? 'disabled' : ''}>−</button>
              <input type="text" value="${cartQty}" id="qty-${category}-${index}" readonly />
              <button onclick="increaseQuantity('${category}', ${index})" ${isOutOfStock ? 'disabled' : ''}>+</button>
            </div>
            <div class="button-group">
              <button class="action-btn btn-edit" onclick="editProduct('${category}', ${index}); event.stopPropagation();"><i class="fas fa-pencil-alt"></i></button>
              <button class="action-btn btn-delete" onclick="deleteProduct('${category}', ${index}); event.stopPropagation();"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        `;

        setupLongPressOnProductCard(card, category, index);
        container.appendChild(card);
      });
    } else {
      console.warn(`Tidak ada data produk untuk kategori "${category}".`);
    }
  });
}

async function deleteProduct(category, index) {
  const product = data[category][index];
  const productCode = product.code || product.name;
  if (confirm(`Hapus barang "${productCode}"?`)) {
    data[category].splice(index, 1);

    for (let i = cart.length - 1; i >= 0; i--) {
      if (cart[i].name === productCode) {
        cart.splice(i, 1);
      }
    }

    await saveToIndexedDB(STORE_NAMES.PRODUCTS, data);
    await saveToIndexedDB(STORE_NAMES.CART, cart);

    renderProducts();
    updateCartBadge();
  }
}

function editProduct(category, index) {
  const product = data[category][index];
  document.getElementById('editCategory').value = category;
  document.getElementById('editIndex').value = index;
  document.getElementById('editName').value = product.code;
  document.getElementById('editCode').value = product.code || '';

  window.currentEditingProductCode = product.code;

  const artistSelect = document.getElementById('artistSelect-edit');
  if (artistSelect) {
    const currentArtist = product.artist || '';
    artistSelect.value = currentArtist;
  }

  document.getElementById('editPrice').value = formatRupiah(product.price);
  document.getElementById('editStock').value = product.stock;
  document.getElementById('editTags').value = (product.tags && product.tags.length > 0) ? product.tags.join(', ') : '';
  document.getElementById('editPreview').src = product.image;
  document.getElementById('editPreview').style.display = 'block';
  document.getElementById('editImageFile').value = '';

  document.getElementById('editModal').style.display = 'flex';
}

async function saveEditedProduct(event) {
  event.preventDefault();
  const form = event.target;
  const code = form.code.value.trim();
  const name = code;
  const artist = form.artist ? form.artist.value : '';
  const price = parseInt(form.price.value.replace(/[^0-9]/g, '')) || 0;
  const stock = parseInt(form.stock.value);
  const tagsValue = form.tags ? form.tags.value : '';
  const tags = tagsValue.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);

  if (!name || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
    showNotification("Harap isi semua data dengan benar!");
    return;
  }

  const category = document.getElementById('editCategory').value;
  const index = document.getElementById('editIndex').value;
  const oldProductName = data[category][index].name;
  const oldArtist = data[category][index].artist || '';
  const currentProductCode = window.currentEditingProductCode;

  if (isProductCodeDuplicate(code, currentProductCode)) {
    showNotification(`Kode barang "${code}" sudah ada. Harap gunakan kode lain!`);
    return;
  }

  const fileInput = form.imageFile;
  const file = fileInput.pastedFile || (fileInput.files.length > 0 ? fileInput.files[0] : null);

  if (file) {
    try {
      const compressedImage = await compressImage(file);
      data[category][index].image = compressedImage;
    } catch (error) {
      console.error("Gagal mengompres gambar yang diedit:", error);
      showNotification("Gagal memproses gambar baru!");
      return;
    }
  }

  data[category][index].name = name;
  data[category][index].code = code;
  data[category][index].artist = artist;
  data[category][index].price = price;
  data[category][index].stock = stock;
  data[category][index].tags = tags;

  if (artist && artist.trim() !== '' && !artists.includes(artist)) {
    artists.push(artist);
    artists.sort((a, b) => a.localeCompare(b));
    await saveToIndexedDB(STORE_NAMES.ARTISTS, artists.map(a => ({ name: a })));
    populateArtistSelects();
  }

  let salesUpdated = false;
  if (oldProductName !== name || oldArtist !== artist) {
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.name === oldProductName && item.category === category) {
          item.name = name;
          item.artist = artist;
          salesUpdated = true;
        }
      });
    });
  }

  await Promise.all([
    saveToIndexedDB(STORE_NAMES.PRODUCTS, data),
    saveToIndexedDB(STORE_NAMES.SALES, sales)
  ]);

  renderProducts();
  closeEditModal();

  if (document.getElementById('dashboardModal').style.display === 'flex') {
    renderSalesTable();
    renderArtistSalesTable();
  }

  if (salesUpdated) {
    showNotification(`Produk "${name}" berhasil diperbarui! Data penjualan juga telah disinkronkan.`);
  } else {
    showNotification(`Produk "${name}" berhasil diperbarui!`);
  }

  window.currentEditingProductCode = null;
}

async function addProduct(event, category) {
  event.preventDefault();
  const form = event.target;
  const code = form.code.value.trim();
  const name = code;

  const priceString = form.price.value.replace(/\./g, '').replace(',', '.');
  const price = parseFloat(priceString);

  const stock = parseInt(form.stock.value);
  const artist = form.artist ? form.artist.value : '';
  const tagsInput = form.tags ? form.tags.value : '';
  const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);

  const fileInput = form.imageFile;
  const file = fileInput.pastedFile || (fileInput.files.length > 0 ? fileInput.files[0] : null);

  if (!code) {
    showNotification("Kode barang harus diisi!");
    return;
  }
  if (isProductCodeDuplicate(code, null)) {
    showNotification(`Kode barang "${code}" sudah ada. Harap gunakan kode lain!`);
    return;
  }
  if (isNaN(price) || price < 100) {
    showNotification("Harga harus diisi (minimal Rp100)!");
    return;
  }
  if (isNaN(stock) || stock < 0) {
    showNotification("Stok harus diisi (tidak boleh negatif)!");
    return;
  }
  if (!file) {
    showNotification("Gambar produk wajib diupload atau ditempel!");
    return;
  }

  try {
    const compressedImage = await compressImage(file);

    const newProduct = {
      name,
      code,
      artist: artist || '',
      image: compressedImage,
      price,
      stock,
      tags,
      category
    };

    if (!data[category]) data[category] = [];
    data[category].push(newProduct);

    if (artist && artist.trim() !== '' && !artists.includes(artist)) {
      artists.push(artist);
      artists.sort((a, b) => a.localeCompare(b));
      await saveToIndexedDB(STORE_NAMES.ARTISTS, artists.map(a => ({ name: a })));
      populateArtistSelects();
    }

    await saveToIndexedDB(STORE_NAMES.PRODUCTS, data);

    form.reset();
    if (fileInput.pastedFile) {
      delete fileInput.pastedFile;
    }
    const preview = form.querySelector('img.preview');
    if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }

    const artistSelect = form.querySelector('select[name="artist"]');
    if (artistSelect) {
      artistSelect.value = '';
    }

    renderProducts();
    showNotification(`Produk "${name}" ditambahkan!`);
  } catch (error) {
    console.error("Gagal menambahkan produk:", error);
    showNotification("Gagal menambahkan produk! " + error.message);
  }
}

// ── Bulk Edit ─────────────────────────────────────────────────────────────────

let bulkEditSelectedProducts = new Set(); // identifiers "category|index"
let isBulkEditMode = false;

function openBulkEditModal(preSelectedIds) {
  const modal = document.getElementById('bulkEditModal');
  const list  = document.getElementById('bulkEditProductList');
  list.innerHTML = '';

  // Determine which IDs are pre-selected
  const preSelected = preSelectedIds instanceof Set ? preSelectedIds : new Set();
  bulkEditSelectedProducts = new Set(preSelected);

  categories.filter(c => c && typeof c === 'string').forEach(category => {
    if (!data[category] || !data[category].length) return;
    data[category].forEach((item, index) => {
      const id = `${category}|${index}`;
      // If pre-selected, only show those; else show all
      if (preSelected.size > 0 && !preSelected.has(id)) return;
      const row = document.createElement('div');
      row.className = 'bulk-edit-product-row';
      row.dataset.id = id;
      const checked = preSelected.has(id) ? 'checked' : '';
      row.innerHTML = `
        <label class="bulk-edit-check-label">
          <input type="checkbox" class="bulk-edit-checkbox" value="${id}" ${checked} onchange="toggleBulkEditSelection('${id}', this.checked)">
          <img src="${item.image}" class="bulk-edit-thumb">
          <span>${escapeHtml(item.code)} <small style="color:#888">(${escapeHtml(category)})</small></span>
        </label>
      `;
      list.appendChild(row);
    });
  });

  document.getElementById('bulkEditSelectedCount').textContent = `${bulkEditSelectedProducts.size} produk dipilih`;

  // Reset shared fields
  document.getElementById('bulkEditPrice').value = '';
  document.getElementById('bulkEditTags').value = '';
  document.getElementById('bulkEditStock').value = '';
  const artSelect = document.getElementById('bulkEditArtist');
  artSelect.innerHTML = '<option value="__keep__">(Tetap)</option><option value="">Tanpa Artist</option>';
  artists.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    artSelect.appendChild(opt);
  });

  ['Price','Tags','Stock','Artist'].forEach(f => {
    const cb = document.getElementById(`bulkEditApply${f}`);
    if (cb) cb.checked = false;
  });

  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
}

function confirmBulkEditSelection() {
  if (selectedProductsForDelete.size === 0) {
    showNotification('Pilih minimal 1 produk!');
    return;
  }
  const selectedIds = new Set(selectedProductsForDelete);
  exitDeleteMode();
  openBulkEditModal(selectedIds);
}

function closeBulkEditModal() {
  document.getElementById('bulkEditModal').style.display = 'none';
  document.body.classList.remove('modal-open');
  bulkEditSelectedProducts.clear();
}

function toggleBulkEditSelection(id, checked) {
  if (checked) bulkEditSelectedProducts.add(id);
  else bulkEditSelectedProducts.delete(id);
  document.getElementById('bulkEditSelectedCount').textContent = `${bulkEditSelectedProducts.size} produk dipilih`;
}

function selectAllBulkEdit(checked) {
  document.querySelectorAll('#bulkEditProductList .bulk-edit-checkbox').forEach(cb => {
    cb.checked = checked;
    toggleBulkEditSelection(cb.value, checked);
  });
}

async function submitBulkEdit() {
  if (bulkEditSelectedProducts.size === 0) {
    showNotification('Pilih minimal 1 produk!');
    return;
  }

  const applyPrice  = document.getElementById('bulkEditApplyPrice').checked;
  const applyTags   = document.getElementById('bulkEditApplyTags').checked;
  const applyStock  = document.getElementById('bulkEditApplyStock').checked;
  const applyArtist = document.getElementById('bulkEditApplyArtist').checked;

  if (!applyPrice && !applyTags && !applyStock && !applyArtist) {
    showNotification('Centang minimal 1 field yang ingin diubah!');
    return;
  }

  const priceStr = document.getElementById('bulkEditPrice').value.replace(/\./g, '').replace(',', '.');
  const price    = applyPrice ? parseFloat(priceStr) : null;
  const tagsInput = document.getElementById('bulkEditTags').value;
  const tags      = applyTags ? tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0) : null;
  const stock     = applyStock ? parseInt(document.getElementById('bulkEditStock').value) : null;
  const artist    = applyArtist ? document.getElementById('bulkEditArtist').value : null;

  if (applyPrice && (isNaN(price) || price < 100)) {
    showNotification('Harga harus diisi (minimal Rp100)!');
    return;
  }
  if (applyStock && (isNaN(stock) || stock < 0)) {
    showNotification('Stok tidak valid!');
    return;
  }

  for (const id of bulkEditSelectedProducts) {
    const [category, idxStr] = id.split('|');
    const idx = parseInt(idxStr);
    if (!data[category] || !data[category][idx]) continue;
    const product = data[category][idx];
    if (applyPrice)  product.price  = price;
    if (applyTags)   product.tags   = tags;
    if (applyStock)  product.stock  = stock;
    if (applyArtist && artist !== '__keep__') product.artist = artist;
  }

  // Save any new artists
  if (applyArtist && artist && artist !== '__keep__' && artist !== '' && !artists.includes(artist)) {
    artists.push(artist);
    artists.sort((a, b) => a.localeCompare(b));
    await saveToIndexedDB(STORE_NAMES.ARTISTS, artists.map(a => ({ name: a })));
    populateArtistSelects();
  }

  await saveToIndexedDB(STORE_NAMES.PRODUCTS, data);
  renderProducts();
  closeBulkEditModal();
  showNotification(`${bulkEditSelectedProducts.size} produk berhasil diperbarui!`);
}

// ── End Bulk Edit ──────────────────────────────────────────────────────────────

// ── Bulk Add ─────────────────────────────────────────────────────────────────

let bulkRowCounter = 0;

function openBulkAddModal(category) {
  const modal = document.getElementById('bulkAddModal');

  // populate category select
  const catSelect = document.getElementById('bulkCategory');
  catSelect.innerHTML = '';
  categories.filter(c => c && typeof c === 'string').forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = capitalizeFirstLetter(c);
    if (c === category) opt.selected = true;
    catSelect.appendChild(opt);
  });

  // populate shared artist select
  const artSelect = document.getElementById('bulkArtist');
  artSelect.innerHTML = '<option value="">Tanpa Artist</option>';
  artists.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    artSelect.appendChild(opt);
  });

  // reset shared fields and checkboxes to "shared" state
  document.getElementById('bulkPrice').value = '';
  document.getElementById('bulkTags').value = '';
  document.getElementById('bulkStock').value = '';
  document.getElementById('bulkArtist').style.display = '';
  document.getElementById('bulkPrice').style.display = '';
  document.getElementById('bulkTags').style.display = '';
  document.getElementById('bulkStock').style.display = '';
  document.getElementById('bulkArtistShared').checked = true;
  document.getElementById('bulkPriceShared').checked = true;
  document.getElementById('bulkTagsShared').checked = true;
  document.getElementById('bulkStockShared').checked = true;

  // reset rows — start with one
  const rowsContainer = document.getElementById('bulkItemRows');
  rowsContainer.innerHTML = '';
  bulkRowCounter = 0;
  addBulkRow();

  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
}

function closeBulkAddModal() {
  document.getElementById('bulkAddModal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

// Returns the HTML snippet to inject into a row for an individual field
function getBulkIndividualFieldHtml(field) {
  if (field === 'artist') {
    const opts = artists.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('');
    return `<div class="bulk-row-individual-field" data-bulk-field="artist">
      <label>Artist (individual)</label>
      <select name="bulk_artist"><option value="">Tanpa Artist</option>${opts}</select>
    </div>`;
  }
  if (field === 'price') {
    return `<div class="bulk-row-individual-field" data-bulk-field="price">
      <label>Harga (individual)</label>
      <input type="text" name="bulk_price" placeholder="Harga (Rp)" required
        oninput="formatRupiahInput(this)" inputmode="numeric" pattern="[0-9.]*" />
    </div>`;
  }
  if (field === 'tags') {
    return `<div class="bulk-row-individual-field" data-bulk-field="tags">
      <label>Tags (individual) <span style="font-weight:normal;font-size:11px;color:#888">(pisahkan koma)</span></label>
      <input type="text" name="bulk_tags" placeholder="Contoh: standard, mini, A5" autocomplete="off" />
    </div>`;
  }
  if (field === 'stock') {
    return `<div class="bulk-row-individual-field" data-bulk-field="stock">
      <label>Stok (individual)</label>
      <input type="number" name="bulk_stock" placeholder="Stok" required min="0" />
    </div>`;
  }
  return '';
}

function toggleBulkShared(field) {
  const capField = field.charAt(0).toUpperCase() + field.slice(1);
  const isShared = document.getElementById(`bulk${capField}Shared`).checked;

  // Show/hide the shared input (the element right after the label-row inside the section)
  const sharedInputId = field === 'artist' ? 'bulkArtist' :
                        field === 'price'  ? 'bulkPrice'  :
                        field === 'stock'  ? 'bulkStock'  : 'bulkTags';
  document.getElementById(sharedInputId).style.display = isShared ? '' : 'none';

  // Add or remove individual field from all existing rows
  document.querySelectorAll('#bulkItemRows .bulk-item-row').forEach(row => {
    const existing = row.querySelector(`.bulk-row-individual-field[data-bulk-field="${field}"]`);
    if (!isShared && !existing) {
      const optionalSection = row.querySelector('.bulk-row-optional-fields');
      optionalSection.insertAdjacentHTML('beforeend', getBulkIndividualFieldHtml(field));
    } else if (isShared && existing) {
      existing.remove();
    }
  });
}

function addBulkRow() {
  bulkRowCounter++;
  const n = bulkRowCounter;
  const rowsContainer = document.getElementById('bulkItemRows');

  const artistIndividual = !document.getElementById('bulkArtistShared').checked;
  const priceIndividual  = !document.getElementById('bulkPriceShared').checked;
  const tagsIndividual   = !document.getElementById('bulkTagsShared').checked;
  const stockIndividual  = !document.getElementById('bulkStockShared').checked;

  const row = document.createElement('div');
  row.className = 'bulk-item-row';
  row.dataset.rowId = n;

  row.innerHTML = `
    <div class="bulk-row-header">
      <span class="bulk-row-label">Item #${n}</span>
      <button type="button" class="bulk-remove-row-btn" onclick="removeBulkRow(this)" title="Hapus item ini">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <label>Kode Barang</label>
    <input type="text" name="bulk_code" placeholder="Kode Barang" required />
    <div class="bulk-row-optional-fields">
      ${stockIndividual  ? getBulkIndividualFieldHtml('stock')  : ''}
      ${artistIndividual ? getBulkIndividualFieldHtml('artist') : ''}
      ${priceIndividual  ? getBulkIndividualFieldHtml('price')  : ''}
      ${tagsIndividual   ? getBulkIndividualFieldHtml('tags')   : ''}
    </div>
    <label>Gambar</label>
    <div class="image-input-container image-paste-area">
      <div class="image-source-buttons">
        <button type="button" class="image-source-btn" onclick="openBulkCamera(this)">
          <i class="fas fa-camera"></i> Kamera
        </button>
        <button type="button" class="image-source-btn" onclick="openBulkGallery(this)">
          <i class="fas fa-images"></i> Galeri
        </button>
      </div>
      <div class="paste-instruction">atau tempel gambar di sini</div>
      <input type="file" name="bulk_imageFile" accept="image/*" style="display:none"
        onchange="previewBulkImage(event, this)" />
      <img class="preview" style="display:none" />
    </div>
  `;

  rowsContainer.appendChild(row);
}

function removeBulkRow(btn) {
  const row = btn.closest('.bulk-item-row');
  if (document.querySelectorAll('.bulk-item-row').length <= 1) {
    showNotification('Minimal harus ada 1 item!');
    return;
  }
  row.remove();
}

function openBulkCamera(btn) {
  const input = btn.closest('.image-input-container').querySelector('input[type="file"]');
  if (input) {
    input.setAttribute('capture', 'environment');
    input.click();
  }
}

function openBulkGallery(btn) {
  const input = btn.closest('.image-input-container').querySelector('input[type="file"]');
  if (input) {
    input.removeAttribute('capture');
    input.click();
  }
}

function previewBulkImage(event, input) {
  if (input.pastedFile) delete input.pastedFile;
  const file = input.files[0];
  if (!file) return;
  const preview = input.closest('.image-input-container').querySelector('img.preview');
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function submitBulkAdd(event) {
  event.preventDefault();

  const category = document.getElementById('bulkCategory').value;

  // Determine which fields are shared vs individual
  const artistShared = document.getElementById('bulkArtistShared').checked;
  const priceShared  = document.getElementById('bulkPriceShared').checked;
  const tagsShared   = document.getElementById('bulkTagsShared').checked;
  const stockShared  = document.getElementById('bulkStockShared').checked;

  // Read shared values
  const sharedArtist = artistShared ? document.getElementById('bulkArtist').value : null;
  const sharedPriceStr = priceShared ? document.getElementById('bulkPrice').value : null;
  const sharedPrice = priceShared ? parseFloat((sharedPriceStr || '').replace(/\./g, '').replace(',', '.')) : null;
  const sharedTagsInput = tagsShared ? document.getElementById('bulkTags').value : '';
  const sharedTags = tagsShared ? sharedTagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0) : null;
  const sharedStock = stockShared ? parseInt(document.getElementById('bulkStock').value) : null;

  if (priceShared && (isNaN(sharedPrice) || sharedPrice < 100)) {
    showNotification('Harga harus diisi (minimal Rp100)!');
    return;
  }
  if (stockShared && (isNaN(sharedStock) || sharedStock < 0)) {
    showNotification('Stok harus diisi (tidak boleh negatif)!');
    return;
  }

  const rows = document.querySelectorAll('#bulkItemRows .bulk-item-row');
  if (rows.length === 0) {
    showNotification('Tambahkan minimal 1 item!');
    return;
  }

  // Validate all rows first
  const itemsToAdd = [];
  for (const row of rows) {
    const code = row.querySelector('input[name="bulk_code"]').value.trim();
    const fileInput = row.querySelector('input[name="bulk_imageFile"]');
    const file = fileInput.pastedFile || (fileInput.files.length > 0 ? fileInput.files[0] : null);

    // Individual field values
    const stockEl  = row.querySelector('[data-bulk-field="stock"] input');
    const artistEl = row.querySelector('[data-bulk-field="artist"] select');
    const priceEl  = row.querySelector('[data-bulk-field="price"] input');
    const tagsEl   = row.querySelector('[data-bulk-field="tags"] input');

    const stock  = stockShared  ? sharedStock  : parseInt(stockEl ? stockEl.value : '');
    const artist = artistShared ? sharedArtist : (artistEl ? artistEl.value : '');

    const rowPriceStr = !priceShared && priceEl ? priceEl.value.replace(/\./g, '').replace(',', '.') : null;
    const price = priceShared ? sharedPrice : parseFloat(rowPriceStr || '');

    const rowTagsInput = !tagsShared && tagsEl ? tagsEl.value : '';
    const tags = tagsShared ? sharedTags : rowTagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);

    if (!code) {
      showNotification('Kode barang harus diisi untuk semua item!');
      return;
    }
    if (isProductCodeDuplicate(code, null)) {
      showNotification(`Kode barang "${code}" sudah ada. Harap gunakan kode lain!`);
      return;
    }
    if (itemsToAdd.some(i => i.code.toLowerCase() === code.toLowerCase())) {
      showNotification(`Kode barang "${code}" duplikat dalam satu batch!`);
      return;
    }
    if (!stockShared && (isNaN(stock) || stock < 0)) {
      showNotification(`Stok untuk kode "${code}" harus diisi (tidak boleh negatif)!`);
      return;
    }
    if (!priceShared && (isNaN(price) || price < 100)) {
      showNotification(`Harga untuk kode "${code}" harus diisi (minimal Rp100)!`);
      return;
    }
    if (!file) {
      showNotification(`Gambar untuk kode "${code}" wajib diupload atau ditempel!`);
      return;
    }

    itemsToAdd.push({ code, stock, file, artist, price, tags });
  }

  try {
    if (!data[category]) data[category] = [];

    const newArtists = [];
    for (const item of itemsToAdd) {
      const compressedImage = await compressImage(item.file);
      data[category].push({
        name: item.code,
        code: item.code,
        artist: item.artist || '',
        image: compressedImage,
        price: item.price,
        stock: item.stock,
        tags: item.tags,
        category
      });
      if (item.artist && item.artist.trim() !== '' && !artists.includes(item.artist) && !newArtists.includes(item.artist)) {
        newArtists.push(item.artist);
      }
    }

    if (newArtists.length > 0) {
      artists.push(...newArtists);
      artists.sort((a, b) => a.localeCompare(b));
      await saveToIndexedDB(STORE_NAMES.ARTISTS, artists.map(a => ({ name: a })));
      populateArtistSelects();
    }

    await saveToIndexedDB(STORE_NAMES.PRODUCTS, data);
    renderProducts();
    closeBulkAddModal();
    showNotification(`${itemsToAdd.length} produk berhasil ditambahkan ke ${capitalizeFirstLetter(category)}!`);
  } catch (error) {
    console.error('Gagal menyimpan produk massal:', error);
    showNotification('Gagal menyimpan produk! ' + error.message);
  }
}

// ── End Bulk Add ──────────────────────────────────────────────────────────────

function increaseQuantity(category, index) {
  const item = data[category][index];
  if (item.stock <= 0) return;

  const qtyInput = document.getElementById(`qty-${category}-${index}`);
  const currentQty = parseInt(qtyInput.value);

  if (currentQty >= item.stock) {
    showNotification(`Stok tidak cukup! Hanya tersedia ${item.stock} item.`);
    return;
  }

  qtyInput.value = currentQty + 1;
  updateCart(category, index, parseInt(qtyInput.value));

  const productCode = item.code || item.name;
  showNotification(`Ditambahkan: ${productCode} (${qtyInput.value}x)`);
}

function decreaseQuantity(category, index) {
  const qtyInput = document.getElementById(`qty-${category}-${index}`);
  const currentValue = parseInt(qtyInput.value);

  if (currentValue > 0) {
    qtyInput.value = currentValue - 1;
    updateCart(category, index, parseInt(qtyInput.value));

    const productCode = data[category][index].code || data[category][index].name;
    showNotification(`Dikurangi: ${productCode} (${qtyInput.value}x)`);
  }
}

async function updateCart(category, index, qty) {
  try {
    const product = data[category]?.[index];
    if (!product) {
      throw new Error('Produk tidak ditemukan');
    }

    const productIdentifier = product.code || product.name;
    const cartIndex = cart.findIndex(item => item.name === productIdentifier);

    if (qty > 0) {
      const cartItem = {
        name: productIdentifier,
        price: product.price,
        qty: qty,
        category: product.category,
        image: product.image,
        code: product.code,
        artist: product.artist || ''
      };

      if (cartIndex >= 0) {
        cart[cartIndex] = cartItem;
      } else {
        cart.push(cartItem);
      }
    } else if (cartIndex >= 0) {
      cart.splice(cartIndex, 1);
    }

    await saveToIndexedDB(STORE_NAMES.CART, cart);

    renderProducts();
    updateCartBadge();

    if (isCartModalOpen) {
      renderCartModalContent();
    }

    const { items } = calculateCartTotalWithPromo();
    const updatedItem = items.find(i => i.name === productIdentifier);
    if (updatedItem && updatedItem.discountApplied > 0 && qty > 0) {
      showNotification(` Promo bundle! Harga ${productIdentifier}: Rp${formatRupiah(updatedItem.discountedPrice)}/item (hemat Rp${formatRupiah(updatedItem.discountApplied)}/item)`);
    }
  } catch (error) {
    console.error('Gagal memperbarui keranjang:', error);
    showNotification('Gagal memperbarui keranjang');
  }
}

async function syncArtistForExistingSales() {
  try {
    let updatedCount = 0;

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = findProductByNameAndCategory(item.name, item.category);
        if (product && product.artist) {
          if (item.artist !== product.artist) {
            item.artist = product.artist;
            updatedCount++;
          }
        }
      });
    });

    if (updatedCount > 0) {
      await saveToIndexedDB(STORE_NAMES.SALES, sales);
      showNotification(`Berhasil menyinkronkan ${updatedCount} item penjualan dengan data artist terbaru!`);

      if (document.getElementById('dashboardModal').style.display === 'flex') {
        renderSalesTable();
        renderArtistSalesTable();
      }
    } else {
      showNotification('Semua data penjualan sudah sinkron dengan artist terbaru.');
    }

    return updatedCount;
  } catch (error) {
    console.error('Gagal menyinkronkan artist untuk penjualan:', error);
    showNotification('Gagal menyinkronkan artist untuk data penjualan!');
    return 0;
  }
}
