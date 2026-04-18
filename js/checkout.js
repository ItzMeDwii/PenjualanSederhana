// Checkout flow and payment processing

function showCheckoutModal(paymentTypeFromCart = null) {
  if (cart.length === 0) {
    showNotification('Keranjang kosong!');
    return;
  }

  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  document.getElementById('discountInput').value = 0;
  currentGrandTotalAfterDiscount = grandTotal;

  const checkoutSummary = document.getElementById('checkoutSummary');
  checkoutSummary.innerHTML = `
    <div class="checkout-header">
      <h4>Ringkasan Pembelian</h4>
      <p>Total Item: ${itemCount}</p>
      <p class="original-total-amount">Subtotal: Rp${formatRupiah(grandTotal)}</p>
    </div>

    <div class="payment-input-section">
      <h4>Jumlah Pembayaran (untuk Cash)</h4>
      <div class="quick-payment-buttons">
        <button onclick="appendToAmount('100000')">100.000</button>
        <button onclick="appendToAmount('50000')">50.000</button>
        <button onclick="appendToAmount('20000')">20.000</button>
        <button onclick="appendToAmount('10000')">10.000</button>
      </div>

      <div class="manual-input">
        <input type="text" id="manualAmount" placeholder="Masukkan jumlah" value="${currentAmountInput}" oninput="formatRupiahInput(this); calculateChange(parseInt(this.value.replace(/\\./g, '')))">
        <button class="calculator-btn" onclick="deleteLastDigit()">⌫</button>
      </div>
    </div>

    <div class="payment-summary" id="paymentSummary" style="display: none;">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>Rp${formatRupiah(grandTotal)}</span>
      </div>
      <div class="summary-row discount-row">
        <span>Diskon (<span id="discountPercentageDisplay">0</span>%):</span>
        <span id="discountAmountDisplay">Rp0</span>
      </div>
      <div class="summary-row final-total-row">
        <span>Total Akhir:</span>
        <span id="finalTotalAmount">Rp${formatRupiah(grandTotal)}</span>
      </div>
      <div class="summary-row">
        <span>Dibayar:</span>
        <span id="amountPaid">Rp0</span>
      </div>
      <div class="summary-row highlight">
        <span>Kembalian:</span>
        <span id="changeAmount">Rp0</span>
      </div>
    </div>
  `;

  const modalActions = document.querySelector('#checkoutModal .modal-actions');
  modalActions.innerHTML = `
    <button class="btn-cash" onclick="processCheckout('Cash')"> Cash</button>
    <button class="btn-transfer" onclick="processCheckout('Transfer')"> Transfer</button>
    <button class="btn-cancel" onclick="closeCheckoutModal()"><i class="fas fa-times"></i> Batal</button>
  `;

  if (paymentTypeFromCart) {
    modalActions.querySelector('.btn-cash').style.display = 'none';
    modalActions.querySelector('.btn-transfer').style.display = 'none';
    processCheckout(paymentTypeFromCart);
  }

  document.getElementById('checkoutModal').style.display = 'flex';
  document.body.classList.add('modal-open');
  currentAmountInput = '';
  applyDiscount();
}

function showCheckoutConfirmationModal() {
  if (cart.length === 0) {
    showNotification('Keranjang kosong!');
    return;
  }

  closeCartModal();

  const checkoutConfirmationModal = document.getElementById('checkoutConfirmationModal');
  const checkoutConfirmationContent = document.getElementById('checkoutConfirmationContent');
  const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  document.getElementById('checkoutGrandTotal').textContent = formatRupiah(grandTotal);

  const amountPaidForConfirm = parseFloat(currentAmountInput) || 0;
  const changeForConfirm = amountPaidForConfirm - grandTotal;
  const kembalianHtml = amountPaidForConfirm > 0 ? `
    <div class="checkout-kembalian-row">
      <span>Dibayar:</span>
      <span>Rp${formatRupiah(amountPaidForConfirm)}</span>
    </div>
    <div class="checkout-kembalian-row ${changeForConfirm < 0 ? 'kembalian-kurang' : 'kembalian-lebih'}">
      <span>Kembalian:</span>
      <span>${changeForConfirm >= 0 ? 'Rp' + formatRupiah(changeForConfirm) : '<span style="color:#e53935;">Kurang Rp' + formatRupiah(Math.abs(changeForConfirm)) + '</span>'}</span>
    </div>` : '';

  checkoutConfirmationContent.innerHTML = `
    <div class="checkout-confirmation-header">
      <h4>Pilih Metode Pembayaran</h4>
      <p>Total Belanja: <strong>Rp<span id="checkoutGrandTotal">${formatRupiah(grandTotal)}</span></strong></p>
      ${kembalianHtml}
    </div>
    <div class="payment-method-options" id="mainPaymentMethodButtons">
    </div>

    <div id="dynamicTransferMethodContainer" style="display: none;">
      <label for="transferMethodInput">Pilih Metode Transfer:</label>
      <div class="payment-method-options" id="dynamicTransferMethodButtons">
      </div>
      <input type="text" id="transferDetailsInput" placeholder="No. Rekening/ID E-Wallet/Keterangan" style="display: none;">
    </div>

    <button class="btn-confirm-payment" id="confirmPaymentButton" style="display:none;">Konfirmasi Pembayaran</button>
    <button class="btn-cancel-confirmation" onclick="closeCheckoutConfirmationModal()">Batal</button>
    <button class="btn-manage-payment" onclick="openPaymentMethodModal()">Kelola Metode Pembayaran</button>
  `;

  renderMainPaymentMethodButtons();

  checkoutConfirmationModal.style.display = 'flex';
  document.body.classList.add('modal-open');

  selectedPaymentMethod = '';
  selectedTransferMethod = '';
  document.getElementById('confirmPaymentButton').style.display = 'none';
  document.getElementById('transferDetailsInput').style.display = 'none';
  document.getElementById('dynamicTransferMethodContainer').style.display = 'none';
}

function renderMainPaymentMethodButtons() {
  const container = document.getElementById('mainPaymentMethodButtons');
  container.innerHTML = '';

  ['Cash', 'Transfer'].forEach(method => {
    const button = document.createElement('button');
    button.className = `btn-payment-option btn-${method.toLowerCase().replace(/\s/g, '-')}`;
    button.textContent = method;
    button.onclick = () => selectPaymentMethod(method);
    container.appendChild(button);
  });
}

function renderDynamicTransferMethods() {
  const container = document.getElementById('dynamicTransferMethodButtons');
  container.innerHTML = '';

  if (transferMethods.length === 0) {
    container.innerHTML = '<p style="text-align: center; font-size: 14px; color: #777;">Belum ada metode transfer. Tambahkan di "Kelola Metode Pembayaran".</p>';
    return;
  }

  transferMethods.forEach(method => {
    const button = document.createElement('button');
    button.className = `btn-payment-option btn-transfer-dynamic`;
    button.textContent = method;
    button.onclick = (event) => selectTransferMethod(method, event.target);
    container.appendChild(button);
  });
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  selectedTransferMethod = '';

  const dynamicTransferMethodContainer = document.getElementById('dynamicTransferMethodContainer');
  const transferDetailsInput = document.getElementById('transferDetailsInput');
  const confirmPaymentButton = document.getElementById('confirmPaymentButton');

  document.querySelectorAll('#mainPaymentMethodButtons .btn-payment-option').forEach(btn => {
    btn.classList.remove('active');
  });
  const selectedMainButton = document.querySelector(`#mainPaymentMethodButtons .btn-${method.toLowerCase().replace(/\s/g, '-')}`);
  if (selectedMainButton) {
    selectedMainButton.classList.add('active');
  }

  document.querySelectorAll('#dynamicTransferMethodButtons .btn-transfer-dynamic').forEach(btn => {
    btn.classList.remove('active');
  });

  if (method.toLowerCase() === 'cash') {
    dynamicTransferMethodContainer.style.display = 'none';
    transferDetailsInput.style.display = 'none';
    transferDetailsInput.required = false;
    confirmPaymentButton.style.display = 'block';
    confirmPaymentButton.onclick = () => processCheckout('Cash', '');
  } else if (method.toLowerCase() === 'transfer') {
    dynamicTransferMethodContainer.style.display = 'block';
    renderDynamicTransferMethods();
    transferDetailsInput.style.display = 'none';
    transferDetailsInput.required = false;
    confirmPaymentButton.style.display = 'none';
  }
}

function selectTransferMethod(method, clickedButton) {
  selectedTransferMethod = method;
  const confirmPaymentButton = document.getElementById('confirmPaymentButton');

  document.querySelectorAll('#dynamicTransferMethodButtons .btn-transfer-dynamic').forEach(btn => {
    btn.classList.remove('active');
  });
  if (clickedButton) {
    clickedButton.classList.add('active');
  }

  confirmPaymentButton.style.display = 'block';
  confirmPaymentButton.onclick = () => {
    processCheckout(selectedTransferMethod, '');
  };
}

function closeCheckoutConfirmationModal() {
  document.getElementById('checkoutConfirmationModal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

function appendToAmount(number) {
  currentAmountInput += number;
  document.getElementById('manualAmount').value = formatRupiah(parseInt(currentAmountInput.replace(/\./g, '')));
  calculateChange(parseInt(currentAmountInput.replace(/\./g, '')));
}

function deleteLastDigit() {
  currentAmountInput = currentAmountInput.slice(0, -1);
  if (currentAmountInput === '') {
    document.getElementById('manualAmount').value = '';
    document.getElementById('paymentSummary').style.display = 'none';
  } else {
    document.getElementById('manualAmount').value = formatRupiah(parseInt(currentAmountInput.replace(/\./g, '')));
    calculateChange(parseInt(currentAmountInput.replace(/\./g, '')));
  }
}

function closeCheckoutModal() {
  document.body.style.overflow = '';
  document.getElementById('checkoutModal').style.display = 'none';
  currentAmountInput = '';
  document.body.classList.remove('modal-open');
}

async function processCheckout(paymentType, paymentDetails = '') {
  const cartWithPromo = recalculateCartPrices();

  const roundedCart = cartWithPromo.map(item => {
    const pricePerItemRaw = item.displayPrice;
    const roundedPricePerItem = Math.floor(pricePerItemRaw / 1000) * 1000;
    const roundingDifference = pricePerItemRaw - roundedPricePerItem;
    const itemTotalRounded = roundedPricePerItem * item.qty;
    const roundingTotal = roundingDifference * item.qty;

    return {
      ...item,
      roundedPrice: roundedPricePerItem,
      roundingDifference: roundingDifference,
      roundingTotal: roundingTotal,
      totalPriceForItem: itemTotalRounded
    };
  });

  const grandTotalRounded = roundedCart.reduce((sum, item) => sum + item.totalPriceForItem, 0);
  const originalTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalAfterPromo = cartWithPromo.reduce((sum, item) => sum + (item.displayPrice * item.qty), 0);
  const totalRoundingSaved = totalAfterPromo - grandTotalRounded;

  const confirmMessage = `Apakah Anda ingin membeli item ini?\n\n` +
    `Harga Normal: Rp${formatRupiah(originalTotal)}\n` +
    `Harga Promo: Rp${formatRupiah(totalAfterPromo)}\n` +
    `Setelah Pembulatan: Rp${formatRupiah(grandTotalRounded)}\n` +
    `Sisa Pembulatan: Rp${formatRupiah(totalRoundingSaved)}\n` +
    `Metode: ${paymentType}?\n\nKlik OK untuk konfirmasi.`;

  if (!confirm(confirmMessage)) {
    return;
  }

  const now = new Date().toLocaleString('id-ID');

  cart.forEach(item => {
    const product = Object.values(data).flat().find(p => (p.code === item.name) || (p.name === item.name));
    if (product) {
      product.stock -= item.qty;
    }
  });

  const saleItems = roundedCart.map(item => ({
    name: item.name,
    category: item.category,
    image: item.image,
    code: item.code,
    price: item.price,
    originalPrice: item.price,
    promoPrice: item.displayPrice,
    roundedPrice: item.roundedPrice,
    discountApplied: item.discountApplied,
    roundingDifference: item.roundingDifference,
    roundingTotal: item.roundingTotal,
    qty: item.qty,
    artist: item.artist,
    promoBundleQty: item.promoBundleQty,
    promoBundlePrice: item.promoBundlePrice
  }));

  sales.push({
    time: now,
    items: saleItems,
    originalTotal: originalTotal,
    totalAfterPromo: totalAfterPromo,
    total: grandTotalRounded,
    totalRoundingSaved: totalRoundingSaved,
    amountPaid: grandTotalRounded,
    change: 0,
    paymentType: paymentType,
    paymentDetails: paymentDetails,
    promoApplied: totalAfterPromo < originalTotal
  });

  cart = [];

  await Promise.all([
    saveToIndexedDB(STORE_NAMES.PRODUCTS, data),
    saveToIndexedDB(STORE_NAMES.CART, cart),
    saveToIndexedDB(STORE_NAMES.SALES, sales)
  ]);

  closeCartModal();
  closeCheckoutModal();
  closeCheckoutConfirmationModal();
  updateCartBadge();
  renderProducts();

  if (document.getElementById('salesData') && document.getElementById('salesData').style.display === 'block') {
    renderSalesTable();
  }

  if (document.getElementById('dashboardModal').style.display === 'flex') {
    renderTopProducts();
    renderArtistSalesTable();
  }

  showNotification(`Pembelian berhasil! Total: Rp${formatRupiah(grandTotalRounded)} (${paymentType})`);
}

function applyDiscount() {
  const discountInput = document.getElementById('discountInput');
  let discountPercentage = parseFloat(discountInput.value);

  if (isNaN(discountPercentage) || discountPercentage < 0) {
    discountPercentage = 0;
    discountInput.value = 0;
  } else if (discountPercentage > 100) {
    discountPercentage = 100;
    discountInput.value = 100;
  }

  const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = grandTotal * (discountPercentage / 100);
  currentGrandTotalAfterDiscount = grandTotal - discountAmount;

  document.getElementById('discountPercentageDisplay').textContent = discountPercentage;
  document.getElementById('discountAmountDisplay').textContent = `Rp${formatRupiah(discountAmount)}`;
  document.getElementById('finalTotalAmount').textContent = `Rp${formatRupiah(currentGrandTotalAfterDiscount)}`;

  const manualAmountInput = document.getElementById('manualAmount');
  if (manualAmountInput && manualAmountInput.value) {
    calculateChange(parseInt(manualAmountInput.value.replace(/\./g, '')));
  } else {
    document.getElementById('amountPaid').textContent = `Rp0`;
    document.getElementById('changeAmount').textContent = `Rp0`;
    document.getElementById('paymentSummary').style.display = 'block';
  }
}

function calculateChange(amount) {
  const total = currentGrandTotalAfterDiscount;
  const change = amount - total;

  document.getElementById('amountPaid').textContent = `Rp${formatRupiah(amount)}`;
  document.getElementById('changeAmount').textContent = `Rp${formatRupiah(change > 0 ? change : 0)}`;
  document.getElementById('paymentSummary').style.display = 'block';

  const checkoutSummary = document.getElementById('checkoutSummary');
  checkoutSummary.scrollTop = checkoutSummary.scrollHeight;
}
