// Product rendering, navbar, search, and CRUD operations

function updateNavbarCategories() {
  const navbar = document.querySelector('.navbar');
  const tabContainer = document.getElementById('dynamic-tabs');

  navbar.innerHTML = '';
  tabContainer.innerHTML = '';

  const manageBtn = document.createElement('button');
  manageBtn.className = 'manage-category';
  manageBtn.innerHTML = '<i class="fas fa-plus"></i> Jenis Barang';
  manageBtn.onclick = showCategoryModal;
  navbar.appendChild(manageBtn);

  if (categories.filter(c => c && typeof c === 'string').length > 0) {
    const allBtn = document.createElement('button');
    allBtn.textContent = 'Semua';
    allBtn.onclick = () => showTab('__all__');
    navbar.insertBefore(allBtn, manageBtn);

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
    button.onclick = () => showTab(category);
    navbar.insertBefore(button, manageBtn);

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

  document.querySelectorAll('.navbar button:not(.manage-category)').forEach(btn => {
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

    const imgContainer = card.querySelector('.product-img-container');
    const buttonGroup = card.querySelector('.button-group');

    imgContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      if (card.dataset.longPressJustTriggered === 'true') { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (card.dataset.longPressTriggered === 'true') { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (isDeleteMode) { toggleProductSelection(card); return; }
      document.querySelectorAll('.button-group').forEach(group => {
        if (group !== buttonGroup && group.style.display === 'flex') {
          group.style.animation = 'fadeOutDown 0.2s forwards';
          setTimeout(() => { group.style.display = 'none'; }, 200);
        }
      });
      if (buttonGroup.style.display === 'flex') {
        buttonGroup.style.animation = 'fadeOutDown 0.2s forwards';
        setTimeout(() => { buttonGroup.style.display = 'none'; }, 200);
      } else {
        buttonGroup.style.display = 'flex';
        buttonGroup.style.animation = 'fadeInUp 0.2s forwards';
      }
    });

    document.addEventListener('click', (e) => {
      if (buttonGroup.style.display === 'flex' && !card.contains(e.target)) {
        buttonGroup.style.animation = 'fadeOutDown 0.2s forwards';
        setTimeout(() => { buttonGroup.style.display = 'none'; }, 200);
      }
    });

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

        const imgContainer = card.querySelector('.product-img-container');
        const buttonGroup = card.querySelector('.button-group');

        imgContainer.addEventListener('click', (e) => {
          e.stopPropagation();
          if (card.dataset.longPressJustTriggered === 'true') {
            e.preventDefault(); e.stopImmediatePropagation(); return;
          }
          if (card.dataset.longPressTriggered === 'true') {
            e.preventDefault(); e.stopImmediatePropagation(); return;
          }
          if (isDeleteMode) {
            toggleProductSelection(card); return;
          }
          document.querySelectorAll('.button-group').forEach(group => {
            if (group !== buttonGroup && group.style.display === 'flex') {
              group.style.animation = 'fadeOutDown 0.2s forwards';
              setTimeout(() => { group.style.display = 'none'; }, 200);
            }
          });
          if (buttonGroup.style.display === 'flex') {
            buttonGroup.style.animation = 'fadeOutDown 0.2s forwards';
            setTimeout(() => { buttonGroup.style.display = 'none'; }, 200);
          } else {
            buttonGroup.style.display = 'flex';
            buttonGroup.style.animation = 'fadeInUp 0.2s forwards';
          }
        });

        buttonGroup.addEventListener('click', (e) => {
          if (e.target === buttonGroup) {
            e.stopPropagation();
            buttonGroup.style.animation = 'fadeOutDown 0.2s forwards';
            setTimeout(() => { buttonGroup.style.display = 'none'; }, 200);
          }
        });

        document.addEventListener('click', (e) => {
          if (buttonGroup.style.display === 'flex' && !card.contains(e.target)) {
            buttonGroup.style.animation = 'fadeOutDown 0.2s forwards';
            setTimeout(() => { buttonGroup.style.display = 'none'; }, 200);
          }
        });

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
