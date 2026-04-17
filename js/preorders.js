// PreOrder management

function showPreOrder() {
  document.getElementById('preOrderModal').style.display = 'flex';
  document.body.classList.add('modal-open');
  populateProductSelect();
  showPreOrderTab('addPreOrder');
  renderPreOrderList();
}

function closePreOrderModal() {
  document.getElementById('preOrderModal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

function showPreOrderTab(tabId) {
  document.querySelectorAll('.preorder-tab-content').forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });
  document.querySelectorAll('.preorder-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  document.getElementById(tabId + 'Tab').classList.add('active');
  document.getElementById(tabId + 'Tab').style.display = 'block';
  document.querySelector(`.preorder-tab[onclick*="showPreOrderTab('${tabId}')"]`).classList.add('active');

  if (tabId === 'listPreOrder') {
    if (editingPreOrderIndex !== null) {
      cancelEditPreOrder();
    }
    renderPreOrderList();
  }

  if (tabId === 'addPreOrder' && editingPreOrderIndex === null) {
    const addTab = document.querySelector(".preorder-tab[onclick*=\"showPreOrderTab('addPreOrder')\"]");
    if (addTab) addTab.innerHTML = '<i class="fas fa-plus"></i> Tambah PreOrder';
    const title = document.getElementById('addPreOrderTitle');
    if (title) title.textContent = 'Tambah PreOrder Baru';
  }
}

function populateProductSelect() {
  const selectElement = document.getElementById('poProductSelect');
  selectElement.innerHTML = '';

  const allProducts = Object.values(data).flat();

  if (allProducts.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Tidak ada barang tersedia';
    option.disabled = true;
    selectElement.appendChild(option);
    return;
  }

  allProducts.forEach(product => {
    const option = document.createElement('option');
    option.value = product.name;
    option.textContent = `${product.name} (Stok: ${product.stock}, Rp${formatRupiah(product.price)})`;
    option.dataset.price = product.price;
    option.dataset.category = product.category;
    option.dataset.image = product.image;
    option.dataset.code = product.code;
    selectElement.appendChild(option);
  });

  if (!selectElement.choices) {
    selectElement.choices = new Choices(selectElement, {
      removeItemButton: true,
      searchEnabled: true,
      placeholder: true,
      placeholderValue: 'Pilih barang...',
      itemSelectText: 'Pilih',
      noResultsText: 'Tidak ditemukan',
      noChoicesText: 'Tidak ada pilihan',
      shouldSort: false
    });

    selectElement.choices.passedElement.element.addEventListener('change', function() {
      updateSelectedProductsDisplay();
    });
  } else {
    selectElement.choices.setChoices(allProducts.map(product => ({
      value: product.name,
      label: `${product.name} (Stok: ${product.stock}, Rp${formatRupiah(product.price)})`,
      customProperties: {
        price: product.price,
        category: product.category,
        image: product.image,
        code: product.code
      }
    })), 'value', 'label', true);
  }
  updateSelectedProductsDisplay();

  const poPaymentMethodSelect = document.getElementById('poPaymentMethod');
  poPaymentMethodSelect.innerHTML = '';
  const allPaymentOptions = [...paymentMethods, ...transferMethods];
  allPaymentOptions.forEach(method => {
    const option = document.createElement('option');
    option.value = method;
    option.textContent = method;
    poPaymentMethodSelect.appendChild(option);
  });
}

function updateSelectedProductsDisplay() {
  const selectElement = document.getElementById('poProductSelect');
  const displayDiv = document.getElementById('selectedPoProducts');
  displayDiv.innerHTML = '';
  let totalCalculatedPrice = 0;

  const selectedOptions = selectElement.choices
    ? selectElement.choices.getValue(true)
    : Array.from(selectElement.selectedOptions).map(opt => opt.value);

  if (selectedOptions.length === 0) {
    displayDiv.innerHTML = '<p>Belum ada barang yang dipilih.</p>';
    document.getElementById('poPrice').value = '';
    return;
  }

  selectedOptions.forEach(productName => {
    const product = Object.values(data).flat().find(p => p.name === productName);
    if (product) {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'selected-product-item';
      itemDiv.innerHTML = `
        <span>${product.name}</span>
        <input type="number" class="po-product-qty" data-product-name="${product.name}" value="1" min="1" oninput="updatePoProductQuantity(this)">
        <span>x Rp${formatRupiah(product.price)}</span>
        <button type="button" onclick="removePoProduct('${product.name}')">×</button>
      `;
      displayDiv.appendChild(itemDiv);
      totalCalculatedPrice += product.price * 1;
    }
  });
  document.getElementById('poPrice').value = formatRupiah(totalCalculatedPrice);
}

function updatePoProductQuantity(inputElement) {
  const productName = inputElement.dataset.productName;
  const newQty = parseInt(inputElement.value);
  if (isNaN(newQty) || newQty < 1) {
    inputElement.value = 1;
    return;
  }

  const product = Object.values(data).flat().find(p => p.name === productName);
  if (product && newQty > product.stock) {
    showNotification(`Stok untuk ${product.name} hanya ${product.stock}.`);
    inputElement.value = product.stock;
    return;
  }

  let total = 0;
  document.querySelectorAll('.selected-product-item').forEach(itemDiv => {
    const name = itemDiv.querySelector('.po-product-qty').dataset.productName;
    const qty = parseInt(itemDiv.querySelector('.po-product-qty').value);
    const prod = Object.values(data).flat().find(p => p.name === name);
    if (prod) {
      total += prod.price * qty;
    }
  });
  document.getElementById('poPrice').value = formatRupiah(total);
}

function removePoProduct(productName) {
  const selectElement = document.getElementById('poProductSelect');
  if (selectElement.choices) {
    selectElement.choices.removeItemsByValue(productName);
  }
  updateSelectedProductsDisplay();
}

function toggleTransferDetails() {
  const paymentMethod = document.getElementById('poPaymentMethod').value;
  const transferDetailsInput = document.getElementById('poTransferDetails');
  if (transferMethods.includes(paymentMethod)) {
    transferDetailsInput.style.display = 'block';
    transferDetailsInput.required = true;
  } else {
    transferDetailsInput.style.display = 'none';
    transferDetailsInput.required = false;
    transferDetailsInput.value = '';
  }
}

async function addPreOrder(event) {
  event.preventDefault();
  event.stopPropagation();
  const form = document.getElementById('addPreOrderForm');
  const customerName = document.getElementById('poCustomerName').value.trim();
  const selectedProductsRaw = document.getElementById('poProductSelect').choices.getValue();
  const paymentMethod = document.getElementById('poPaymentMethod').value;
  const transferDetails = document.getElementById('poTransferDetails').value.trim();
  const price = parseInt(document.getElementById('poPrice').value.replace(/\./g, ''));
  const address = document.getElementById('poAddress').value.trim();
  const contact = document.getElementById('poContact').value.trim();
  const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;

  if (!customerName || selectedProductsRaw.length === 0 || isNaN(price) || price <= 0 || !contact) {
    showNotification('Harap lengkapi semua data wajib!');
    return;
  }
  if (transferMethods.includes(paymentMethod) && !transferDetails) {
    showNotification('Detail pembayaran wajib diisi untuk metode transfer!');
    return;
  }

  const poItems = [];
  let totalCalculatedPrice = 0;
  for (const selectedOption of selectedProductsRaw) {
    const productName = selectedOption.value;
    const qtyInput = document.querySelector(`.po-product-qty[data-product-name="${productName}"]`);
    const qty = qtyInput ? parseInt(qtyInput.value) : 1;

    const product = Object.values(data).flat().find(p => p.name === productName);
    if (product) {
      if (qty > product.stock) {
        showNotification(`Stok untuk ${product.name} hanya ${product.stock}. PreOrder tidak dapat disimpan.`);
        return;
      }
      poItems.push({
        name: product.name,
        category: product.category,
        code: product.code,
        image: product.image,
        price: product.price,
        qty: qty
      });
      totalCalculatedPrice += product.price * qty;
    }
  }

  if (totalCalculatedPrice !== price) {
    if (!confirm(`Total harga yang dihitung (${formatRupiah(totalCalculatedPrice)}) berbeda dengan yang dimasukkan (${formatRupiah(price)}). Lanjutkan?`)) {
      return;
    }
  }

  const isEditing = editingPreOrderIndex !== null;

  const newPreOrder = {
    customerName,
    items: poItems,
    payment: {
      method: paymentMethod,
      details: transferMethods.includes(paymentMethod) ? transferDetails : ''
    },
    totalPrice: price,
    address,
    contact,
    deliveryMethod,
    status: 'Pending',
    orderDate: new Date().toLocaleString('id-ID')
  };

  if (isEditing) {
    const originalPo = preOrders[editingPreOrderIndex];
    preOrders[editingPreOrderIndex] = {
      ...newPreOrder,
      status: originalPo.status,
      orderDate: originalPo.orderDate,
      ...(originalPo.completionDate ? { completionDate: originalPo.completionDate } : {})
    };
    editingPreOrderIndex = null;

    const submitBtn = document.querySelector('#addPreOrderForm button[type="submit"]');
    submitBtn.innerHTML = '💾 Simpan PreOrder';
    const cancelBtn = document.getElementById('cancelEditPreOrderBtn');
    if (cancelBtn) cancelBtn.remove();
    const addTab = document.querySelector(".preorder-tab[onclick*=\"showPreOrderTab('addPreOrder')\"]");
    if (addTab) addTab.innerHTML = '<i class="fas fa-plus"></i> Tambah PreOrder';
    const title = document.getElementById('addPreOrderTitle');
    if (title) title.textContent = 'Tambah PreOrder Baru';
  } else {
    preOrders.push(newPreOrder);
  }

  try {
    await saveToIndexedDB(STORE_NAMES.PREORDERS, preOrders);
    showNotification(isEditing ? 'PreOrder berhasil diperbarui!' : 'PreOrder berhasil ditambahkan!');
    form.reset();

    document.getElementById('poProductSelect').choices.clearStore();
    document.getElementById('selectedPoProducts').innerHTML = '<p>Belum ada barang yang dipilih.</p>';
    populateProductSelect();

    document.getElementById('poTransferDetails').style.display = 'none';
    renderPreOrderList();
    showPreOrderTab('listPreOrder');
  } catch (error) {
    console.error('Gagal menyimpan PreOrder:', error);
    showNotification('Gagal menyimpan PreOrder!');
  }
}

function renderPreOrderList() {
  const preOrderListDiv = document.getElementById('preOrderList');
  preOrderListDiv.innerHTML = '';

  const searchInput = document.getElementById('preOrderSearch');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const filtered = preOrders
    .map((po, index) => ({ po, index }))
    .filter(({ po }) => {
      if (!query) return true;
      if (po.customerName.toLowerCase().includes(query)) return true;
      if (po.items.some(item => item.name.toLowerCase().includes(query))) return true;
      return false;
    });

  if (preOrders.length === 0) {
    preOrderListDiv.innerHTML = '<div class="empty-state">Belum ada data PreOrder.</div>';
    return;
  }

  if (filtered.length === 0) {
    preOrderListDiv.innerHTML = '<div class="empty-state">Tidak ada PreOrder yang cocok.</div>';
    return;
  }

  filtered.forEach(({ po, index }) => {
    const poCard = document.createElement('div');
    poCard.className = `preorder-card ${po.status === 'Completed' ? 'completed' : ''}`;
    poCard.innerHTML = `
      <div class="preorder-header">
        <h4>${po.customerName}</h4>
        <span class="preorder-status ${po.status.toLowerCase()}">${po.status}</span>
      </div>
      <div class="preorder-details">
        <p><strong>Tanggal Order:</strong> ${po.orderDate}</p>
        <p><strong>Barang:</strong></p>
        <ul>
          ${po.items.map(item => `<li>${item.qty}x ${item.name} (Rp${formatRupiah(item.price)})</li>`).join('')}
        </ul>
        <p><strong>Total Harga:</strong> Rp${formatRupiah(po.totalPrice)}</p>
        <p><strong>Pembayaran:</strong> ${po.payment.method} ${po.payment.details ? `(${po.payment.details})` : ''}</p>
        ${po.address ? `<p><strong>Alamat:</strong> ${po.address}</p>` : ''}
        <p><strong>Kontak:</strong> ${po.contact}</p>
        <p><strong>Pengambilan:</strong> ${po.deliveryMethod}</p>
      </div>
      <div class="preorder-actions">
        ${po.status === 'Pending' ? `<button class="btn-complete-po" onclick="completePreOrder(${index})"><i class="fas fa-check-circle"></i> Sudah Diambil</button>` : ''}
        ${po.status === 'Pending' ? `<button class="btn-edit-po" onclick="editPreOrder(${index})"><i class="fas fa-edit"></i> Edit</button>` : ''}
        <button class="btn-delete-po" onclick="deletePreOrder(${index})"><i class="fas fa-trash"></i> Hapus</button>
      </div>
    `;
    preOrderListDiv.appendChild(poCard);
  });
}

async function completePreOrder(index) {
  if (confirm('Konfirmasi bahwa PreOrder ini sudah diambil? Stok barang akan dikurangi.')) {
    const po = preOrders[index];

    let stockUpdateSuccess = true;
    for (const poItem of po.items) {
      const product = Object.values(data).flat().find(p => (p.code === poItem.name) || (p.name === poItem.name));
      if (product) {
        if (product.stock >= poItem.qty) {
          product.stock -= poItem.qty;
        } else {
          showNotification(`Stok ${product.name} tidak cukup (${product.stock} tersedia, ${poItem.qty} dibutuhkan). PreOrder tidak dapat diselesaikan.`);
          stockUpdateSuccess = false;
          break;
        }
      } else {
        showNotification(`Produk "${poItem.name}" tidak ditemukan dalam inventaris. PreOrder tidak dapat diselesaikan.`);
        stockUpdateSuccess = false;
        break;
      }
    }

    if (stockUpdateSuccess) {
      po.status = 'Completed';
      po.completionDate = new Date().toLocaleString('id-ID');

      const now = new Date().toLocaleString('id-ID');
      const saleItems = po.items.map(item => ({
        name: item.name,
        category: item.category,
        image: item.image,
        code: item.code,
        price: item.price,
        originalPrice: item.price,
        promoPrice: item.price,
        roundedPrice: item.price,
        discountApplied: 0,
        roundingDifference: 0,
        roundingTotal: 0,
        qty: item.qty,
        artist: item.artist || '',
        promoBundleQty: null,
        promoBundlePrice: null
      }));

      sales.push({
        time: now,
        items: saleItems,
        originalTotal: po.totalPrice,
        totalAfterPromo: po.totalPrice,
        total: po.totalPrice,
        totalRoundingSaved: 0,
        amountPaid: po.totalPrice,
        change: 0,
        paymentType: po.payment.method,
        paymentDetails: po.payment.details,
        promoApplied: false
      });

      await Promise.all([
        saveToIndexedDB(STORE_NAMES.PREORDERS, preOrders),
        saveToIndexedDB(STORE_NAMES.PRODUCTS, data),
        saveToIndexedDB(STORE_NAMES.SALES, sales)
      ]);

      showNotification('PreOrder berhasil diselesaikan dan stok diperbarui!');
      renderPreOrderList();
      renderProducts();
      if (document.getElementById('salesData') && document.getElementById('salesData').style.display === 'block') {
        renderSalesTable();
      }
      renderTopProducts();
    }
  }
}

function editPreOrder(index) {
  const po = preOrders[index];
  editingPreOrderIndex = index;

  showPreOrderTab('addPreOrder');
  document.querySelector(".preorder-tab[onclick*=\"showPreOrderTab('addPreOrder')\"]")
    .innerHTML = `<i class="fas fa-edit"></i> Ubah PreOrder: ${po.customerName}`;
  document.getElementById('addPreOrderTitle').textContent = `Ubah PreOrder: ${po.customerName}`;

  document.getElementById('poCustomerName').value = po.customerName;
  document.getElementById('poAddress').value = po.address || '';
  document.getElementById('poContact').value = po.contact;

  const paymentSelect = document.getElementById('poPaymentMethod');
  paymentSelect.value = po.payment.method;
  toggleTransferDetails();
  document.getElementById('poTransferDetails').value = po.payment.details || '';

  const deliveryRadio = document.querySelector(`input[name="deliveryMethod"][value="${po.deliveryMethod}"]`);
  if (deliveryRadio) deliveryRadio.checked = true;

  const selectElement = document.getElementById('poProductSelect');
  if (selectElement.choices) {
    selectElement.choices.setChoiceByValue(po.items.map(item => item.name));
    updateSelectedProductsDisplay();
    po.items.forEach(item => {
      const qtyInput = document.querySelector(`.po-product-qty[data-product-name="${item.name}"]`);
      if (qtyInput) {
        qtyInput.value = item.qty;
      }
    });
    document.getElementById('poPrice').value = formatRupiah(po.totalPrice);
  }

  const submitBtn = document.querySelector('#addPreOrderForm button[type="submit"]');
  submitBtn.innerHTML = '✏️ Simpan Perubahan PreOrder';

  if (!document.getElementById('cancelEditPreOrderBtn')) {
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'cancelEditPreOrderBtn';
    cancelBtn.className = 'btn-cancel-edit-preorder';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Batal Edit';
    cancelBtn.onclick = cancelEditPreOrder;
    submitBtn.insertAdjacentElement('afterend', cancelBtn);
  }
}

function cancelEditPreOrder() {
  editingPreOrderIndex = null;

  const form = document.getElementById('addPreOrderForm');
  form.reset();

  const selectElement = document.getElementById('poProductSelect');
  if (selectElement.choices) {
    selectElement.choices.removeActiveItems();
  }
  document.getElementById('selectedPoProducts').innerHTML = '<p>Belum ada barang yang dipilih.</p>';
  document.getElementById('poTransferDetails').style.display = 'none';

  const submitBtn = document.querySelector('#addPreOrderForm button[type="submit"]');
  submitBtn.innerHTML = '💾 Simpan PreOrder';

  const cancelBtn = document.getElementById('cancelEditPreOrderBtn');
  if (cancelBtn) cancelBtn.remove();

  const addTab = document.querySelector(".preorder-tab[onclick*=\"showPreOrderTab('addPreOrder')\"]");
  if (addTab) addTab.innerHTML = '<i class="fas fa-plus"></i> Tambah PreOrder';
  const title = document.getElementById('addPreOrderTitle');
  if (title) title.textContent = 'Tambah PreOrder Baru';
}

async function deletePreOrder(index) {
  if (confirm('Apakah Anda yakin ingin menghapus PreOrder ini?')) {
    preOrders.splice(index, 1);
    await saveToIndexedDB(STORE_NAMES.PREORDERS, preOrders);
    showNotification('PreOrder berhasil dihapus!');
    renderPreOrderList();
  }
}
