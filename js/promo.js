// Promo rules management and price calculation

function openPromoRulesModal() {
  document.getElementById('promoRulesModal').style.display = 'flex';
  document.body.classList.add('modal-open');
  renderPromoRulesList();
  renderCategoryCheckboxesForPromo();
}

function closePromoRulesModal() {
  document.getElementById('promoRulesModal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

function renderCategoryCheckboxesForPromo() {
  const container = document.getElementById('promoCategoryList');
  if (!container) return;

  container.innerHTML = '';

  const sortedCategories = [...categories].sort((a, b) => a.localeCompare(b));

  sortedCategories.forEach(category => {
    const label = document.createElement('label');
    label.className = 'promo-category-checkbox';
    label.innerHTML = `
      <input type="checkbox" value="${category}" class="promo-category-item">
      <span>${capitalizeFirstLetter(category)}</span>
    `;
    container.appendChild(label);
  });
}

function renderPromoRulesList() {
  const container = document.getElementById('promoRulesList');
  if (!container) return;

  container.innerHTML = '';

  if (promoRules.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada aturan promo. Tambahkan aturan baru.</div>';
    return;
  }

  const sortedRules = [...promoRules].sort((a, b) => a.category.localeCompare(b.category));

  sortedRules.forEach((rule, ruleIndex) => {
    const ruleCard = document.createElement('div');
    ruleCard.className = 'promo-rule-card';

    let rulesHtml = '';
    const sortedSubRules = [...rule.rules].sort((a, b) => a.qty - b.qty);
    sortedSubRules.forEach((subRule, subIndex) => {
      rulesHtml += `
        <div class="promo-subrule-item">
          <span class="promo-qty">${subRule.qty} barang</span>
          <span class="promo-arrow">→</span>
          <span class="promo-price">Rp${formatRupiah(subRule.price)}</span>
          <button class="btn-remove-subrule" onclick="removePromoSubRule(${ruleIndex}, ${subIndex})"><i class="fas fa-times"></i></button>
        </div>
      `;
    });

    ruleCard.innerHTML = `
      <div class="promo-rule-header">
        <h4>Kategori: ${capitalizeFirstLetter(rule.category)}</h4>
        <button class="btn-delete-rule" onclick="deletePromoRule(${ruleIndex})"><i class="fas fa-trash"></i> Hapus</button>
      </div>
      <div class="promo-subrules-container">
        ${rulesHtml}
      </div>
      <div class="promo-add-subrule">
        <input type="number" id="newSubQty-${ruleIndex}" placeholder="Jumlah barang" min="1">
        <input type="text" id="newSubPrice-${ruleIndex}" placeholder="Harga promo" oninput="formatRupiahInput(this)">
        <button onclick="addPromoSubRule(${ruleIndex})">+ Tambah</button>
      </div>
    `;
    container.appendChild(ruleCard);
  });
}

async function addNewPromoRule() {
  const selectedCategories = Array.from(document.querySelectorAll('#promoCategoryList input:checked'))
    .map(cb => cb.value);

  if (selectedCategories.length === 0) {
    showNotification('Pilih minimal satu kategori untuk promo ini!');
    return;
  }

  const invalidCategories = selectedCategories.filter(cat => !categories.includes(cat));
  if (invalidCategories.length > 0) {
    showNotification(`Kategori ${invalidCategories.join(', ')} sudah tidak tersedia!`);
    renderCategoryCheckboxesForPromo();
    return;
  }

  const promoQty = parseInt(document.getElementById('newPromoQty').value);
  const promoPriceRaw = document.getElementById('newPromoPrice').value.replace(/\./g, '');
  const promoPrice = parseInt(promoPriceRaw);

  if (isNaN(promoQty) || promoQty <= 0) {
    showNotification('Jumlah barang harus diisi dengan benar!');
    return;
  }
  if (isNaN(promoPrice) || promoPrice <= 0) {
    showNotification('Harga promo harus diisi dengan benar!');
    return;
  }

  for (const category of selectedCategories) {
    let existingRule = promoRules.find(r => r.category === category);

    if (existingRule) {
      const existingSubRule = existingRule.rules.find(r => r.qty === promoQty);
      if (existingSubRule) {
        showNotification(`Kategori ${category} sudah memiliki aturan untuk ${promoQty} barang!`);
        continue;
      }
      existingRule.rules.push({ qty: promoQty, price: promoPrice });
      existingRule.rules.sort((a, b) => a.qty - b.qty);
    } else {
      promoRules.push({
        category: category,
        rules: [{ qty: promoQty, price: promoPrice }]
      });
    }
  }

  await saveToIndexedDB(STORE_NAMES.PROMO_RULES, promoRules);

  document.getElementById('newPromoQty').value = '';
  document.getElementById('newPromoPrice').value = '';
  document.querySelectorAll('#promoCategoryList input:checked').forEach(cb => cb.checked = false);

  renderPromoRulesList();
  showNotification('Aturan promo berhasil ditambahkan!');
}

async function addPromoSubRule(ruleIndex) {
  const promoQty = parseInt(document.getElementById(`newSubQty-${ruleIndex}`).value);
  const promoPriceRaw = document.getElementById(`newSubPrice-${ruleIndex}`).value.replace(/\./g, '');
  const promoPrice = parseInt(promoPriceRaw);

  if (isNaN(promoQty) || promoQty <= 0) {
    showNotification('Jumlah barang harus diisi dengan benar!');
    return;
  }
  if (isNaN(promoPrice) || promoPrice <= 0) {
    showNotification('Harga promo harus diisi dengan benar!');
    return;
  }

  const existingSubRule = promoRules[ruleIndex].rules.find(r => r.qty === promoQty);
  if (existingSubRule) {
    showNotification(`Aturan untuk ${promoQty} barang sudah ada!`);
    return;
  }

  promoRules[ruleIndex].rules.push({ qty: promoQty, price: promoPrice });
  promoRules[ruleIndex].rules.sort((a, b) => a.qty - b.qty);

  await saveToIndexedDB('promoRules', promoRules);

  document.getElementById(`newSubQty-${ruleIndex}`).value = '';
  document.getElementById(`newSubPrice-${ruleIndex}`).value = '';

  renderPromoRulesList();
  showNotification('Aturan promo berhasil ditambahkan!');
}

async function removePromoSubRule(ruleIndex, subRuleIndex) {
  if (!confirm('Hapus aturan promo ini?')) return;

  promoRules[ruleIndex].rules.splice(subRuleIndex, 1);

  if (promoRules[ruleIndex].rules.length === 0) {
    promoRules.splice(ruleIndex, 1);
  }

  await saveToIndexedDB('promoRules', promoRules);
  renderPromoRulesList();
  showNotification('Aturan promo dihapus!');
}

async function deletePromoRule(ruleIndex) {
  if (!confirm(`Hapus semua aturan promo untuk kategori "${promoRules[ruleIndex].category}"?`)) return;

  promoRules.splice(ruleIndex, 1);
  await saveToIndexedDB('promoRules', promoRules);
  renderPromoRulesList();
  showNotification('Aturan promo dihapus!');
}

function recalculateCartPrices() {
  const updatedCart = cart.map(item => ({ ...item }));
  const itemsByCategory = {};

  updatedCart.forEach(item => {
    if (!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
    itemsByCategory[item.category].push(item);
  });

  for (const [category, items] of Object.entries(itemsByCategory)) {
    const promoRule = promoRules.find(rule => rule.category === category);

    if (promoRule && promoRule.rules && promoRule.rules.length > 0) {
      const sortedRules = [...promoRule.rules].sort((a, b) => b.qty - a.qty);

      let totalQty = items.reduce((sum, item) => sum + item.qty, 0);
      let remainingQty = totalQty;
      let totalPromoPrice = 0;
      let usedRules = [];
      let normalPrice = items[0].price;

      for (const rule of sortedRules) {
        if (remainingQty >= rule.qty) {
          const bundleCount = Math.floor(remainingQty / rule.qty);
          const bundleTotal = bundleCount * rule.price;
          totalPromoPrice += bundleTotal;
          remainingQty = remainingQty % rule.qty;
          usedRules.push({ rule, bundleCount, bundleTotal });
        }
      }

      if (remainingQty > 0) {
        totalPromoPrice += remainingQty * normalPrice;
      }

      if (totalQty > 0 && totalPromoPrice > 0) {
        items.forEach(item => {
          const itemQty = item.qty;
          const itemProportion = itemQty / totalQty;
          const itemTotalPrice = totalPromoPrice * itemProportion;
          const pricePerItem = itemTotalPrice / itemQty;

          item.discountedPrice = pricePerItem;
          item.displayPrice = pricePerItem;
          item.originalPrice = item.price;
          item.discountApplied = item.price - pricePerItem;
          item.promoPriceRaw = pricePerItem;
          item.roundedPrice = null;
          item.roundingDifference = 0;
          item.roundingTotal = 0;
          item.totalPriceForItem = itemTotalPrice;

          if (usedRules.length > 0) {
            const bestRule = usedRules[0].rule;
            item.promoBundleQty = bestRule.qty;
            item.promoBundlePrice = bestRule.price;
          } else {
            item.promoBundleQty = null;
            item.promoBundlePrice = null;
          }
        });
      } else {
        items.forEach(item => {
          setNormalPrice(item);
        });
      }
    } else {
      items.forEach(item => {
        setNormalPrice(item);
      });
    }
  }

  return updatedCart;
}

function setNormalPrice(item) {
  item.originalPrice = item.price;
  item.promoPriceRaw = item.price;
  item.displayPrice = item.price;
  item.discountApplied = 0;
  item.roundedPrice = item.price;
  item.roundingDifference = 0;
  item.roundingTotal = 0;
  item.totalPriceForItem = item.price * item.qty;
  item.promoBundleQty = null;
  item.promoBundlePrice = null;
}

function calculateCartTotalWithPromo() {
  const cartWithPromo = recalculateCartPrices();
  const total = cartWithPromo.reduce((sum, item) => sum + (item.totalPriceForItem || (item.displayPrice * item.qty)), 0);
  const originalTotal = cartWithPromo.reduce((sum, item) => sum + (item.originalPrice * item.qty), 0);
  const totalDiscount = originalTotal - total;

  return {
    total: total,
    originalTotal: originalTotal,
    totalDiscount: totalDiscount,
    roundingTotal: 0,
    items: cartWithPromo
  };
}

function getPromoInfoForCategory(category, totalQty) {
  const promoRule = promoRules.find(rule => rule.category === category);
  if (!promoRule || !promoRule.rules || promoRule.rules.length === 0) {
    return null;
  }

  const sortedRules = [...promoRule.rules].sort((a, b) => b.qty - a.qty);

  let normalPrice = 0;
  for (const cat in data) {
    if (cat === category && data[cat].length > 0) {
      normalPrice = data[cat][0].price;
      break;
    }
  }

  let remainingQty = totalQty;
  let totalPromoPrice = 0;
  let bestPromoQty = 0;
  let bestPromoPrice = 0;
  let bundleCount_total = 0;

  for (const rule of sortedRules) {
    if (remainingQty >= rule.qty) {
      const bundleCount = Math.floor(remainingQty / rule.qty);
      totalPromoPrice += bundleCount * rule.price;
      remainingQty = remainingQty % rule.qty;
      bestPromoQty = rule.qty;
      bestPromoPrice = rule.price;
      bundleCount_total = bundleCount;
    }
  }

  if (remainingQty > 0) {
    totalPromoPrice += remainingQty * normalPrice;
  }

  if (totalQty > 0 && totalPromoPrice > 0) {
    const pricePerItemRaw = totalPromoPrice / totalQty;
    const roundedPricePerItem = Math.floor(pricePerItemRaw / 1000) * 1000;
    const roundingSaved = pricePerItemRaw - roundedPricePerItem;

    return {
      promoQty: bestPromoQty,
      promoPrice: bestPromoPrice,
      pricePerItem: roundedPricePerItem,
      pricePerItemRaw: pricePerItemRaw,
      roundingSaved: roundingSaved,
      discountPerItem: normalPrice - roundedPricePerItem,
      totalPromoPrice: totalPromoPrice,
      totalRoundedPrice: roundedPricePerItem * totalQty,
      totalRoundingSaved: totalPromoPrice - (roundedPricePerItem * totalQty),
      remainingQty: remainingQty,
      bundleCount: bundleCount_total,
      originalTotalPrice: totalQty * normalPrice,
      totalDiscount: (totalQty * normalPrice) - totalPromoPrice
    };
  }

  return null;
}
