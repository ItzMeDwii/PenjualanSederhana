// Category management

function showCategoryModal() {
  document.body.style.overflow = 'hidden';
  renderCategoryList();
  document.getElementById('categoryModal').style.display = 'flex';
}

function closeCategoryModal() {
  document.getElementById('categoryModal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

function renderCategoryList() {
  const categoryList = document.getElementById('categoryList');
  categoryList.innerHTML = '';

  if (categories.length === 0) {
    categoryList.innerHTML = '<div class="empty-state">Belum ada jenis barang</div>';
    return;
  }

  categories.forEach((category, index) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.setAttribute('data-category-name', category);

    item.innerHTML = `
      <span id="categoryName-${index}">${capitalizeFirstLetter(category)}</span>
      <div class="category-actions">
        <button class="btn-edit-category" onclick="editCategoryName('${category}', ${index})"><i class="fas fa-pencil-alt"></i> Edit</button>
        <button class="btn-delete-category" onclick="deleteCategory('${category}', ${index})"><i class="fas fa-trash"></i> Hapus</button>
      </div>
    `;
    categoryList.appendChild(item);
  });
}

function editCategoryName(oldCategoryName, index) {
  const categoryItem = document.querySelector(`.category-item[data-category-name="${oldCategoryName}"]`);
  if (!categoryItem) return;

  const categoryNameSpan = categoryItem.querySelector(`#categoryName-${index}`);
  const categoryActionsDiv = categoryItem.querySelector('.category-actions');

  const originalName = categoryNameSpan.textContent;

  categoryNameSpan.innerHTML = `
    <input type="text" id="editCategoryInput-${index}" value="${originalName}" />
  `;

  categoryActionsDiv.innerHTML = `
    <button class="btn-save-category" onclick="saveCategoryName('${oldCategoryName}', ${index})"><i class="fas fa-save"></i> Simpan</button>
    <button class="btn-cancel-edit" onclick="cancelEditCategoryName('${oldCategoryName}', ${index}, '${originalName}')"><i class="fas fa-times"></i> Batal</button>
  `;

  document.getElementById(`editCategoryInput-${index}`).focus();
}

async function saveCategoryName(oldCategoryName, index) {
  const newCategoryInput = document.getElementById(`editCategoryInput-${index}`);
  const newCategoryName = newCategoryInput.value.trim().toLowerCase();

  if (!newCategoryName) {
    showNotification('Nama jenis barang tidak boleh kosong!');
    return;
  }
  if (newCategoryName === oldCategoryName) {
    cancelEditCategoryName(oldCategoryName, index, capitalizeFirstLetter(oldCategoryName));
    return;
  }
  if (categories.includes(newCategoryName)) {
    showNotification('Jenis barang dengan nama tersebut sudah ada!');
    return;
  }

  if (!confirm(`Ubah nama jenis barang dari "${capitalizeFirstLetter(oldCategoryName)}" menjadi "${capitalizeFirstLetter(newCategoryName)}"?`)) {
    cancelEditCategoryName(oldCategoryName, index, capitalizeFirstLetter(oldCategoryName));
    return;
  }

  try {
    categories[index] = newCategoryName;
    categories.sort((a, b) => a.localeCompare(b));

    if (data[oldCategoryName]) {
      data[newCategoryName] = data[oldCategoryName];
      delete data[oldCategoryName];
      data[newCategoryName].forEach(product => {
        product.category = newCategoryName;
      });
    } else {
      data[newCategoryName] = [];
    }

    cart.forEach(item => {
      if (item.category === oldCategoryName) {
        item.category = newCategoryName;
      }
    });

    let salesUpdated = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.category === oldCategoryName) {
          item.category = newCategoryName;
          salesUpdated++;
        }
      });
    });

    let promoUpdated = 0;
    promoRules.forEach(rule => {
      if (rule.category === oldCategoryName) {
        rule.category = newCategoryName;
        promoUpdated++;
      }
    });

    const categoriesToSave = categories.map(name => ({ name }));
    await Promise.all([
      saveToIndexedDB(STORE_NAMES.CATEGORIES, categoriesToSave),
      saveToIndexedDB(STORE_NAMES.PRODUCTS, data),
      saveToIndexedDB(STORE_NAMES.CART, cart),
      saveToIndexedDB(STORE_NAMES.SALES, sales),
      saveToIndexedDB(STORE_NAMES.PROMO_RULES, promoRules)
    ]);

    updateNavbarCategories();
    renderCategoryList();
    renderProducts();
    updateCartBadge();
    showTab(newCategoryName);

    if (document.getElementById('dashboardModal').style.display === 'flex') {
      renderSalesTable();
      renderPromoRulesList();
    }

    let message = `Jenis barang berhasil diubah menjadi "${capitalizeFirstLetter(newCategoryName)}"!`;
    if (salesUpdated > 0) message += ` ${salesUpdated} data penjualan diperbarui.`;
    if (promoUpdated > 0) message += ` ${promoUpdated} aturan promo diperbarui.`;
    showNotification(message);
  } catch (error) {
    console.error("Gagal menyimpan perubahan kategori:", error);
    showNotification('Gagal menyimpan perubahan kategori!');
  }
}

function cancelEditCategoryName(oldCategoryName, index, originalDisplayName) {
  const categoryItem = document.querySelector(`.category-item[data-category-name="${oldCategoryName}"]`);
  if (!categoryItem) return;

  const categoryNameSpan = categoryItem.querySelector(`#categoryName-${index}`);
  const categoryActionsDiv = categoryItem.querySelector('.category-actions');

  categoryNameSpan.textContent = originalDisplayName;

  categoryActionsDiv.innerHTML = `
    <button class="btn-edit-category" onclick="editCategoryName('${oldCategoryName}', ${index})"><i class="fas fa-pencil-alt"></i> Edit</button>
    <button class="btn-delete-category" onclick="deleteCategory('${oldCategoryName}', ${index})"><i class="fas fa-trash"></i> Hapus</button>
  `;
}

async function deleteCategory(category, index) {
  if (!confirm(`Hapus jenis barang "${capitalizeFirstLetter(category)}"? Semua produk dalam kategori ini juga akan dihapus.`)) {
    return;
  }

  try {
    const removedCategory = categories.splice(index, 1)[0];
    delete data[removedCategory];
    cart = cart.filter(item => item.category !== removedCategory);

    let salesRemoved = 0;
    sales.forEach(sale => {
      const originalLength = sale.items.length;
      sale.items = sale.items.filter(item => item.category !== removedCategory);
      salesRemoved += (originalLength - sale.items.length);
    });
    sales = sales.filter(sale => sale.items.length > 0);

    const promoRemoved = promoRules.filter(rule => rule.category === removedCategory).length;
    promoRules = promoRules.filter(rule => rule.category !== removedCategory);

    const categoriesToSave = categories.map(name => ({ name }));
    await Promise.all([
      saveToIndexedDB(STORE_NAMES.CATEGORIES, categoriesToSave),
      saveToIndexedDB(STORE_NAMES.PRODUCTS, data),
      saveToIndexedDB(STORE_NAMES.CART, cart),
      saveToIndexedDB(STORE_NAMES.SALES, sales),
      saveToIndexedDB(STORE_NAMES.PROMO_RULES, promoRules)
    ]);

    const tabContent = document.getElementById(removedCategory);
    if (tabContent) tabContent.remove();
    const categoryFilterBtns = document.getElementById('categoryFilterBtns');
    const buttonToRemove = categoryFilterBtns
      ? Array.from(categoryFilterBtns.querySelectorAll('button')).find(button =>
          button.textContent.trim().toLowerCase() === removedCategory.toLowerCase()
        )
      : null;
    if (buttonToRemove) buttonToRemove.remove();

    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab || activeTab.id === removedCategory) {
      if (categories.length > 0) {
        showTab(categories[0]);
      } else {
        document.getElementById('dynamic-tabs').innerHTML = '<div class="empty-state">Tidak ada jenis barang. Tambahkan jenis barang baru untuk memulai.</div>';
        if (categoryFilterBtns) categoryFilterBtns.innerHTML = '';
      }
    }

    renderProducts();
    updateCartBadge();
    renderCategoryList();

    if (document.getElementById('dashboardModal').style.display === 'flex') {
      renderSalesTable();
      renderPromoRulesList();
    }

    let message = `Jenis barang "${capitalizeFirstLetter(removedCategory)}" dihapus!`;
    if (salesRemoved > 0) message += ` ${salesRemoved} item penjualan dihapus.`;
    if (promoRemoved > 0) message += ` ${promoRemoved} aturan promo dihapus.`;
    showNotification(message);
  } catch (error) {
    console.error("Gagal menghapus kategori:", error);
    showNotification("Gagal menghapus kategori!");
  }
}

function addNewCategory(event) {
  event.preventDefault();
  const input = document.getElementById('newCategoryName');
  const categoryName = input.value.trim().toLowerCase();

  if (!categoryName) {
    showNotification('Nama jenis barang tidak boleh kosong!');
    return;
  }
  if (categories.includes(categoryName)) {
    showNotification('Jenis barang sudah ada!');
    return;
  }

  categories.push(categoryName);
  categories.sort((a, b) => a.localeCompare(b));

  const categoriesToSave = categories.map(name => ({ name }));
  saveToIndexedDB(STORE_NAMES.CATEGORIES, categoriesToSave)
    .then(() => {
      updateNavbarCategories();
      renderCategoryList();
      showNotification('Jenis barang berhasil ditambahkan!');
      input.value = '';
      showTab(categoryName);
    })
    .catch(err => {
      console.error('Gagal menambahkan kategori:', err);
      showNotification('Gagal menambahkan jenis barang!');
    });
}
