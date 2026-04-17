// Cart sidebar/modal management

function toggleCartModal() {
  const cartModal = document.getElementById('cartModal');
  if (cartModal.classList.contains('open')) {
    cartModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    document.body.classList.remove('cart-sidebar-open');
    isCartModalOpen = false;
  } else {
    cartModal.classList.add('open');
    document.body.classList.add('modal-open');
    document.body.classList.add('cart-sidebar-open');
    renderCartModalContent();
    isCartModalOpen = true;
  }
}

function closeCartModal() {
  document.getElementById('cartModal').classList.remove('open');
  document.body.classList.remove('modal-open');
  document.body.classList.remove('cart-sidebar-open');
  isCartModalOpen = false;
}

function updateCartBadge() {
  const cartBadge = document.getElementById('cartBadge');
  if (!cartBadge) {
    console.error('Elemen cartBadge tidak ditemukan');
    return;
  }
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  cartBadge.textContent = itemCount;
}

function renderCartModalContent() {
  const cartContent = document.getElementById('cartModalContent');
  const cartTotal = document.getElementById('cartTotal');
  const cartModalFooter = document.querySelector('.cart-modal-footer');

  if (cart.length === 0) {
    cartContent.innerHTML = '<div style="text-align: center; padding: 20px;">Keranjang kosong</div>';
    cartTotal.textContent = '0';
    const quickCountSection = cartModalFooter.querySelector('.quick-count-section');
    if (quickCountSection) quickCountSection.remove();
    const checkoutBtn = cartModalFooter.querySelector('.btn-checkout-cart');
    if (checkoutBtn) checkoutBtn.remove();
    return;
  }

  const cartWithPromo = recalculateCartPrices();
  let html = '<div class="cart-items-list">';
  let total = 0;
  let totalOriginal = 0;

  cartWithPromo.forEach((item, index) => {
    const displayPrice = item.displayPrice || item.price;
    const originalPrice = item.originalPrice || item.price;
    const hasDiscount = Math.abs(displayPrice - originalPrice) > 1;
    const itemTotal = item.totalPriceForItem || (displayPrice * item.qty);
    const originalTotalItem = originalPrice * item.qty;
    total += itemTotal;
    totalOriginal += originalTotalItem;

    const product = Object.values(data).flat().find(p => (p.code === item.name) || (p.name === item.name));
    const artistName = (product && product.artist) ? product.artist : (item.artist || '');
    const hasNoArtist = !artistName || artistName.trim() === '';

    html += `
      <div class="cart-item ${hasDiscount ? 'has-promo' : ''}">
        <div class="cart-item-info">
          <strong>${escapeHtml(item.code || item.name)}</strong>
          ${item.code ? `<span class="cart-item-code">(${escapeHtml(item.code)})</span>` : ''}
          ${hasNoArtist ?
            `<div class="product-artist no-artist" style="font-size: 11px; margin-top: 4px;">Tanpa Artist</div>` :
            `<div class="product-artist has-artist" style="font-size: 11px; margin-top: 4px;">${escapeHtml(artistName)}</div>`
          }
        </div>
        <div class="cart-item-actions">
          <div class="cart-item-total">
            ${hasDiscount ?
              `<span class="original-total-cart strikethrough">Rp${formatRupiah(originalTotalItem)}</span>
               <span class="total-arrow">→</span>
               <span class="final-total-cart">Rp${formatRupiah(itemTotal)}</span>` :
              `<span class="final-total-cart">Rp${formatRupiah(itemTotal)}</span>`
            }
          </div>
          <div class="cart-item-controls">
            <button onclick="decreaseCartItem(${index})" class="cart-btn-minus">−</button>
            <span class="cart-qty-display">${item.qty}</span>
            <button onclick="increaseCartItem(${index})" class="cart-btn-plus">+</button>
            <button onclick="removeCartItem(${index})" class="cart-btn-delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  cartContent.innerHTML = html;

  const totalDiscount = totalOriginal - total;
  let totalHtml = `<div class="cart-total-final">Total: Rp${formatRupiah(Math.floor(total))}</div>`;
  if (totalDiscount > 0) {
    totalHtml += `<div class="cart-savings">  Hemat: Rp${formatRupiah(totalDiscount)}</div>`;
  }
  cartTotal.innerHTML = totalHtml;

  let quickCountSection = cartModalFooter.querySelector('.quick-count-section');
  if (!quickCountSection) {
    quickCountSection = document.createElement('div');
    quickCountSection.className = 'quick-count-section';
    quickCountSection.innerHTML = `
      <div class="quick-count-title">Hitung Kembalian:</div>
      <div class="quick-count-buttons">
        <button onclick="calculateQuickChange(10000)" class="quick-count-btn">10.000</button>
        <button onclick="calculateQuickChange(20000)" class="quick-count-btn">20.000</button>
        <button onclick="calculateQuickChange(50000)" class="quick-count-btn">50.000</button>
        <button onclick="calculateQuickChange(100000)" class="quick-count-btn">100.000</button>
      </div>
      <div class="quick-count-result" id="quickCountResult">
        Kembalian: Rp0
      </div>
    `;
    cartModalFooter.appendChild(quickCountSection);
  } else {
    const totalForQuickCount = Math.floor(total);
    const manualAmountInput = document.getElementById('manualAmountInput');
    if (manualAmountInput && manualAmountInput.value) {
      const amount = parseInt(manualAmountInput.value.replace(/\./g, ''));
      const change = amount - totalForQuickCount;
      document.getElementById('quickCountResult').innerHTML = change >= 0 ?
        `Kembalian: Rp${formatRupiah(change)}` :
        `Kembalian: <span style="color:red;">Kurang Rp${formatRupiah(Math.abs(change))}</span>`;
    }
  }

  let checkoutBtn = cartModalFooter.querySelector('.btn-checkout-cart');
  if (!checkoutBtn) {
    checkoutBtn = document.createElement('button');
    checkoutBtn.className = 'btn-checkout-cart';
    checkoutBtn.innerHTML = '<i class="fas fa-check-circle"></i> Checkout Sekarang';
    checkoutBtn.onclick = showCheckoutConfirmationModal;
    cartModalFooter.appendChild(checkoutBtn);
  }
}

function calculateQuickChange(amountPaid) {
  const { total } = calculateCartTotalWithPromo();
  const change = amountPaid - total;
  const quickCountResultElement = document.getElementById('quickCountResult');

  if (!quickCountResultElement) return;

  if (change < 0) {
    quickCountResultElement.innerHTML = `Kembalian: <span style="color: #e53935;">Kurang Rp${formatRupiah(Math.abs(change))}</span>`;
  } else {
    quickCountResultElement.innerHTML = `Kembalian: <span style="color: #2e7d32;">Rp${formatRupiah(change)}</span>`;
  }

  currentAmountInput = amountPaid.toString();
}

async function decreaseCartItem(index) {
  if (cart[index].qty > 1) {
    cart[index].qty -= 1;
  } else {
    cart.splice(index, 1);
  }
  await saveToIndexedDB(STORE_NAMES.CART, cart);

  if (isCartModalOpen) {
    renderCartModalContent();
  }
  updateCartBadge();
  renderProducts();
}

async function removeCartItem(index) {
  if (confirm(`Hapus "${cart[index].name}" dari keranjang?`)) {
    cart.splice(index, 1);
    await saveToIndexedDB(STORE_NAMES.CART, cart);

    if (isCartModalOpen) {
      renderCartModalContent();
    }
    updateCartBadge();
    renderProducts();
    showNotification('Item dihapus dari keranjang');
  }
}

async function increaseCartItem(index) {
  const cartItem = cart[index];
  if (!cartItem) return;

  const productName = cartItem.name;
  const productCategory = cartItem.category;

  let stockAvailable = Infinity;
  if (productCategory && data[productCategory]) {
    const product = data[productCategory].find(p => p.code === productName || p.name === productName);
    if (product) {
      stockAvailable = product.stock;
    }
  } else {
    for (const category in data) {
      const product = data[category].find(p => p.code === productName || p.name === productName);
      if (product) {
        stockAvailable = product.stock;
        break;
      }
    }
  }

  if (cartItem.qty >= stockAvailable) {
    showNotification(`Stok tidak cukup! Hanya tersedia ${stockAvailable} item.`);
    return;
  }

  cart[index].qty += 1;
  await saveToIndexedDB(STORE_NAMES.CART, cart);

  if (isCartModalOpen) {
    renderCartModalContent();
  }
  updateCartBadge();
  renderProducts();
}
