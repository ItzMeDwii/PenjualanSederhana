// Long-press delete mode for product cards

function startLongPress(productCard, category, index) {
  longPressTimer = setTimeout(() => {
    activateDeleteMode(productCard, category, index);
  }, 800);
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  currentLongPressProduct = null;
}

function activateBulkDeleteMode() {
  if (isDeleteMode) return;
  bulkActionMode = 'delete';
  isDeleteMode = true;

  const deleteBar = document.getElementById('deleteModeBar');
  if (deleteBar) deleteBar.style.display = 'flex';
  document.body.classList.add('modal-open');

  document.querySelectorAll('.product-card').forEach(card => {
    card.classList.add('delete-mode');
  });

  selectedProductsForDelete.clear();
  updateProductCheckboxes();
  updateSelectedCount();

  document.querySelectorAll('.product-card .button-group').forEach(group => {
    group.style.display = 'none';
    group.style.pointerEvents = 'none';
  });

  document.removeEventListener('click', preventClickDuringDeleteMode, true);
  document.addEventListener('click', preventClickDuringDeleteMode, true);
}

function activateBulkEditSelectionMode() {
  if (isDeleteMode) return;
  bulkActionMode = 'edit';
  isDeleteMode = true;

  const editBar = document.getElementById('bulkEditModeBar');
  if (editBar) editBar.style.display = 'flex';
  document.body.classList.add('modal-open');

  document.querySelectorAll('.product-card').forEach(card => {
    card.classList.add('delete-mode');
  });

  selectedProductsForDelete.clear();
  updateProductCheckboxes();
  updateSelectedCount();

  document.querySelectorAll('.product-card .button-group').forEach(group => {
    group.style.display = 'none';
    group.style.pointerEvents = 'none';
  });

  document.removeEventListener('click', preventClickDuringDeleteMode, true);
  document.addEventListener('click', preventClickDuringDeleteMode, true);
}

function activateDeleteMode(clickedCard, category, index) {
  if (isDeleteMode) return;

  isDeleteMode = true;

  const deleteBar = document.getElementById('deleteModeBar');
  if (deleteBar) {
    deleteBar.style.display = 'flex';
  }
  document.body.classList.add('modal-open');

  document.querySelectorAll('.product-card').forEach(card => {
    card.classList.add('delete-mode');
  });

  selectedProductsForDelete.clear();

  const imgContainer = clickedCard.querySelector('.product-img-container');
  if (imgContainer && imgContainer.dataset.productId) {
    const productIdentifier = imgContainer.dataset.productId;
    selectedProductsForDelete.add(productIdentifier);
  }

  updateProductCheckboxes();
  updateSelectedCount();

  document.querySelectorAll('.product-card .button-group').forEach(group => {
    group.style.display = 'none';
    group.style.pointerEvents = 'none';
  });

  document.querySelectorAll('.product-card').forEach(card => {
    card.dataset.longPressJustTriggered = 'true';
  });

  setTimeout(() => {
    document.querySelectorAll('.product-card').forEach(card => {
      delete card.dataset.longPressJustTriggered;
    });
  }, 500);

  document.removeEventListener('click', preventClickDuringDeleteMode, true);
  document.addEventListener('click', preventClickDuringDeleteMode, true);
}

function preventClickDuringDeleteMode(e) {
  if (!isDeleteMode) {
    document.removeEventListener('click', preventClickDuringDeleteMode, true);
    return;
  }

  if (e.target.closest('.product-checkbox')) {
    return;
  }

  if (e.target.closest('.delete-mode-bar')) {
    return;
  }

  const card = e.target.closest('.product-card');
  if (card && (card.dataset.longPressJustTriggered === 'true' || card.dataset.longPressTriggered === 'true')) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function updateProductCheckboxes() {
  document.querySelectorAll('.product-card').forEach((card) => {
    let checkbox = card.querySelector('.product-checkbox');
    const imgContainer = card.querySelector('.product-img-container');

    if (!checkbox) {
      checkbox = document.createElement('div');
      checkbox.className = 'product-checkbox';
      card.appendChild(checkbox);
    }

    const newCheckbox = checkbox.cloneNode(true);
    checkbox.parentNode.replaceChild(newCheckbox, checkbox);
    checkbox = newCheckbox;

    if (imgContainer && imgContainer.dataset.productId) {
      const identifier = imgContainer.dataset.productId;
      if (selectedProductsForDelete.has(identifier)) {
        checkbox.classList.add('checked');
      } else {
        checkbox.classList.remove('checked');
      }

      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();

        delete card.dataset.longPressTriggered;
        delete card.dataset.longPressJustTriggered;

        if (selectedProductsForDelete.has(identifier)) {
          selectedProductsForDelete.delete(identifier);
          checkbox.classList.remove('checked');
        } else {
          selectedProductsForDelete.add(identifier);
          checkbox.classList.add('checked');
        }

        updateSelectedCount();

        if (selectedProductsForDelete.size === 0) {
          setTimeout(() => {
            exitDeleteMode();
          }, 300);
        }
      });
    }
  });

  document.querySelectorAll('.product-card.delete-mode').forEach((card) => {
    if (card._deleteModeClickListener) {
      card.removeEventListener('click', card._deleteModeClickListener);
      delete card._deleteModeClickListener;
    }

    const deleteClickListener = (e) => {
      if (e.target.closest('.product-checkbox')) {
        return;
      }

      if (card.dataset.longPressJustTriggered === 'true' || card.dataset.longPressTriggered === 'true') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const imgContainer = card.querySelector('.product-img-container');
      if (imgContainer && imgContainer.dataset.productId) {
        const identifier = imgContainer.dataset.productId;
        const checkbox = card.querySelector('.product-checkbox');

        if (selectedProductsForDelete.has(identifier)) {
          selectedProductsForDelete.delete(identifier);
          if (checkbox) checkbox.classList.remove('checked');
        } else {
          selectedProductsForDelete.add(identifier);
          if (checkbox) checkbox.classList.add('checked');
        }

        updateSelectedCount();

        if (selectedProductsForDelete.size === 0) {
          setTimeout(() => {
            exitDeleteMode();
          }, 300);
        }
      }
    };

    card._deleteModeClickListener = deleteClickListener;
    card.addEventListener('click', deleteClickListener);
  });
}

function toggleProductSelection(card) {
  if (card.classList.contains('delete-mode-transition')) {
    return;
  }

  if (!isDeleteMode) return;

  const imgContainer = card.querySelector('.product-img-container');
  if (!imgContainer || !imgContainer.dataset.productId) return;

  const identifier = imgContainer.dataset.productId;
  const checkbox = card.querySelector('.product-checkbox');

  delete card.dataset.longPressTriggered;
  delete card.dataset.longPressJustTriggered;

  if (selectedProductsForDelete.has(identifier)) {
    selectedProductsForDelete.delete(identifier);
    if (checkbox) checkbox.classList.remove('checked');
    showNotification(`Produk ${selectedProductsForDelete.size === 0 ? 'terakhir ' : ''}dihapus dari pilihan`);
  } else {
    selectedProductsForDelete.add(identifier);
    if (checkbox) checkbox.classList.add('checked');
    showNotification(`Produk ditambahkan ke pilihan (${selectedProductsForDelete.size} produk)`);
  }

  updateSelectedCount();

  if (selectedProductsForDelete.size === 0 && bulkActionMode === null) {
    setTimeout(() => {
      exitDeleteMode();
    }, 300);
  }
}

function updateSelectedCount() {
  const count = selectedProductsForDelete.size;

  const deleteCountSpan = document.getElementById('selectedCount');
  if (deleteCountSpan) deleteCountSpan.textContent = `${count} produk dipilih`;

  const editCountSpan = document.getElementById('bulkEditModeCount');
  if (editCountSpan) editCountSpan.textContent = `${count} produk dipilih`;

  if (count === 0 && isDeleteMode && bulkActionMode === null) {
    exitDeleteMode();
  }
}

async function deleteSelectedProducts() {
  if (selectedProductsForDelete.size === 0) {
    showNotification('Tidak ada produk yang dipilih!');
    if (isDeleteMode) {
      exitDeleteMode();
    }
    return;
  }

  const productCount = selectedProductsForDelete.size;
  if (!confirm(`Hapus ${productCount} produk yang dipilih?`)) {
    return;
  }

  const productsToDelete = [];
  for (const identifier of selectedProductsForDelete) {
    const [category, index] = identifier.split('|');
    const idx = parseInt(index);
    if (data[category] && data[category][idx]) {
      productsToDelete.push({
        category,
        index: idx,
        product: data[category][idx]
      });
    }
  }

  if (productsToDelete.length === 0) {
    showNotification('Tidak ada produk valid yang dipilih!');
    exitDeleteMode();
    return;
  }

  productsToDelete.sort((a, b) => b.index - a.index);
  for (const item of productsToDelete) {
    const productCode = item.product.code || item.product.name;
    data[item.category].splice(item.index, 1);

    for (let i = cart.length - 1; i >= 0; i--) {
      if (cart[i].name === productCode) {
        cart.splice(i, 1);
      }
    }
  }

  await Promise.all([
    saveToIndexedDB(STORE_NAMES.PRODUCTS, data),
    saveToIndexedDB(STORE_NAMES.CART, cart)
  ]);

  exitDeleteMode();

  renderProducts();
  updateCartBadge();

  showNotification(`${productsToDelete.length} produk berhasil dihapus!`);
}

function setupLongPressOnProductCard(card, category, index) {
  let pressTimer;
  let isLongPressTriggered = false;
  let startX = 0;
  let startY = 0;

  const startPress = (e) => {
    if (isDeleteMode) return;

    if (e.target.closest('.product-checkbox')) return;
    if (e.target.closest('.button-group')) return;
    if (e.target.closest('.action-btn')) return;
    if (e.target.closest('.quantity-controls')) return;
    if (e.target.closest('button')) return;

    isLongPressTriggered = false;

    delete card.dataset.longPressTriggered;
    delete card.dataset.longPressJustTriggered;

    if (e.touches) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else {
      startX = e.clientX;
      startY = e.clientY;
    }

    pressTimer = setTimeout(() => {
      if (!isDeleteMode) {
        isLongPressTriggered = true;
        card.dataset.longPressTriggered = 'true';
        card.dataset.longPressJustTriggered = 'true';

        if (e.target.closest('.product-img-container')) {
          // Long press on image → show edit/delete popup
          const buttonGroup = card.querySelector('.button-group');
          if (buttonGroup) {
            document.querySelectorAll('.button-group').forEach(g => {
              if (g !== buttonGroup && g.style.display === 'flex') {
                g.style.animation = 'fadeOutDown 0.2s forwards';
                setTimeout(() => { g.style.display = 'none'; }, 200);
              }
            });
            if (buttonGroup.style.display === 'flex') {
              buttonGroup.style.animation = 'fadeOutDown 0.2s forwards';
              setTimeout(() => { buttonGroup.style.display = 'none'; }, 200);
            } else {
              buttonGroup.style.display = 'flex';
              buttonGroup.style.animation = 'fadeInUp 0.2s forwards';
            }
          }
        } else {
          // Long press elsewhere → enter delete mode
          card.classList.add('delete-mode-transition');
          activateDeleteMode(card, category, index);
          setTimeout(() => {
            if (card) card.classList.remove('delete-mode-transition');
          }, 300);
        }
      }
    }, 500);
  };

  const cancelPress = (e) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }

    if (isLongPressTriggered) {
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();

      setTimeout(() => {
        if (card) {
          delete card.dataset.longPressTriggered;
          delete card.dataset.longPressJustTriggered;
        }
      }, 200);
    }
  };

  const onMove = (e) => {
    if (pressTimer && !isLongPressTriggered) {
      let currentX, currentY;
      if (e.touches) {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      } else {
        currentX = e.clientX;
        currentY = e.clientY;
      }

      const moveDistance = Math.hypot(currentX - startX, currentY - startY);
      if (moveDistance > 10) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }
  };

  card.removeEventListener('touchstart', startPress);
  card.removeEventListener('touchend', cancelPress);
  card.removeEventListener('touchmove', onMove);
  card.removeEventListener('touchcancel', cancelPress);
  card.removeEventListener('mousedown', startPress);
  card.removeEventListener('mouseup', cancelPress);
  card.removeEventListener('mouseleave', cancelPress);

  card.addEventListener('touchstart', startPress, { passive: false });
  card.addEventListener('touchend', cancelPress);
  card.addEventListener('touchmove', onMove);
  card.addEventListener('touchcancel', cancelPress);
  card.addEventListener('mousedown', startPress);
  card.addEventListener('mouseup', cancelPress);
  card.addEventListener('mouseleave', cancelPress);
}

function autoExitDeleteModeIfNeeded() {
  if (isDeleteMode) {
    if (selectedProductsForDelete.size === 0) {
      exitDeleteMode();
      return true;
    }

    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && activeTab.id) {
      const activeCategory = activeTab.id;
      let hasValidSelection = false;

      for (const identifier of selectedProductsForDelete) {
        const [category, index] = identifier.split('|');
        if (category === activeCategory) {
          if (data[category] && data[category][parseInt(index)]) {
            hasValidSelection = true;
            break;
          }
        }
      }

      if (!hasValidSelection && selectedProductsForDelete.size > 0) {
        exitDeleteMode();
        return true;
      }
    }
  }
  return false;
}

function exitDeleteMode() {
  if (!isDeleteMode) return;

  isDeleteMode = false;
  bulkActionMode = null;
  selectedProductsForDelete.clear();

  document.removeEventListener('click', preventClickDuringDeleteMode, true);

  const deleteBar = document.getElementById('deleteModeBar');
  if (deleteBar) deleteBar.style.display = 'none';

  const editBar = document.getElementById('bulkEditModeBar');
  if (editBar) editBar.style.display = 'none';

  document.body.classList.remove('modal-open');

  const overlay = document.getElementById('deleteModeOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }

  document.querySelectorAll('.product-card').forEach(card => {
    card.classList.remove('delete-mode');
    card.classList.remove('delete-mode-transition');
    if (card._deleteModeClickListener) {
      card.removeEventListener('click', card._deleteModeClickListener);
      delete card._deleteModeClickListener;
    }
    const checkbox = card.querySelector('.product-checkbox');
    if (checkbox) {
      checkbox.remove();
    }
    delete card.dataset.longPressTriggered;
    delete card.dataset.longPressJustTriggered;
  });

  document.querySelectorAll('.product-card .button-group').forEach(group => {
    group.style.pointerEvents = 'auto';
  });
}

function clearAllLongPressFlags() {
  document.querySelectorAll('.product-card').forEach(card => {
    delete card.dataset.longPressTriggered;
    delete card.dataset.longPressJustTriggered;
    card.classList.remove('delete-mode-transition');
  });
}
