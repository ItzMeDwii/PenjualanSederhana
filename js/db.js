// IndexedDB setup and data persistence

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Gagal membuka database:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAMES.PRODUCTS)) {
        db.createObjectStore(STORE_NAMES.PRODUCTS, { keyPath: ['category', 'name'] });
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.CART)) {
        db.createObjectStore(STORE_NAMES.CART, { keyPath: 'name' });
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.SALES)) {
        db.createObjectStore(STORE_NAMES.SALES, { keyPath: 'time' });
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.CATEGORIES)) {
        db.createObjectStore(STORE_NAMES.CATEGORIES, { keyPath: 'name' });
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.PREORDERS)) {
        db.createObjectStore(STORE_NAMES.PREORDERS, { keyPath: 'id', autoIncrement: true });
        console.log(`Object store '${STORE_NAMES.PREORDERS}' dibuat.`);
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.PAYMENT_METHODS)) {
        db.createObjectStore(STORE_NAMES.PAYMENT_METHODS, { keyPath: 'name' });
        console.log(`Object store '${STORE_NAMES.PAYMENT_METHODS}' dibuat.`);
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.TRANSFER_METHODS)) {
        db.createObjectStore(STORE_NAMES.TRANSFER_METHODS, { keyPath: 'name' });
        console.log(`Object store '${STORE_NAMES.TRANSFER_METHODS}' dibuat.`);
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.ARTISTS)) {
        db.createObjectStore(STORE_NAMES.ARTISTS, { keyPath: 'name' });
        console.log(`Object store '${STORE_NAMES.ARTISTS}' dibuat.`);
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.PROMO_RULES)) {
        db.createObjectStore(STORE_NAMES.PROMO_RULES, { keyPath: 'id', autoIncrement: true });
        console.log(`Object store '${STORE_NAMES.PROMO_RULES}' dibuat.`);
      }
    };
  });
}

function saveToIndexedDB(storeName, dataToSave) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database belum diinisialisasi."));
      return;
    }

    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`Store ${storeName} tidak ditemukan, melewati penyimpanan`);
      resolve();
      return;
    }

    const transaction = db.transaction([storeName], 'readwrite');
    transaction.onerror = (event) => {
      console.error(`Transaksi gagal untuk store ${storeName}:`, event.target.error);
      reject(event.target.error);
    };
    transaction.oncomplete = () => {
      resolve();
    };

    const store = transaction.objectStore(storeName);
    const clearRequest = store.clear();

    clearRequest.onerror = (event) => {
      console.error(`Gagal menghapus data lama dari store ${storeName}:`, event.target.error);
      reject(event.target.error);
    };

    clearRequest.onsuccess = () => {
      let items = [];

      if (Array.isArray(dataToSave)) {
        items = dataToSave;
      } else if (typeof dataToSave === 'object' && dataToSave !== null) {
        items = Object.values(dataToSave).flat().filter(item => {
          if (storeName === STORE_NAMES.PRODUCTS) {
            return item.category && item.name;
          }
          return true;
        });
      }

      if (items.length === 0) {
        resolve();
        return;
      }

      items.forEach(item => {
        const addRequest = store.add(item);
        addRequest.onerror = (e) => {
          console.error(`Gagal menyimpan item ke store ${storeName}:`, item, e.target.error);
        };
      });
    };
  });
}

function loadFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database belum diinisialisasi"));
      return;
    }

    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`Store ${storeName} tidak ditemukan, mengembalikan array kosong`);
      resolve([]);
      return;
    }

    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = (event) => {
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

async function loadFromDatabase() {
  try {
    localStorage.removeItem('hasSeenWelcome');

    console.log("Membuka database...");
    await openDatabase();
    console.log("Database terbuka.");

    console.log("Memuat kategori...");
    const loadedCategories = await loadFromIndexedDB(STORE_NAMES.CATEGORIES);
    categories = Array.isArray(loadedCategories) && loadedCategories.length > 0 ?
      loadedCategories.map(c => c.name) :
      [];
    console.log("Kategori dimuat dan diproses:", categories);

    const loadedProducts = await loadFromIndexedDB(STORE_NAMES.PRODUCTS);
    data = {};
    if (Array.isArray(loadedProducts) && loadedProducts.length > 0) {
      loadedProducts.forEach(product => {
        if (product && product.category) {
          if (!data[product.category]) data[product.category] = [];
          data[product.category].push(product);
        } else {
          console.warn("Produk tidak valid saat dimuat:", product);
        }
      });
    }
    console.log("Produk dimuat dan diproses:", data);

    cart = Array.isArray(await loadFromIndexedDB(STORE_NAMES.CART)) ? await loadFromIndexedDB(STORE_NAMES.CART) : [];
    sales = Array.isArray(await loadFromIndexedDB(STORE_NAMES.SALES)) ? await loadFromIndexedDB(STORE_NAMES.SALES) : [];
    preOrders = Array.isArray(await loadFromIndexedDB(STORE_NAMES.PREORDERS)) ? await loadFromIndexedDB(STORE_NAMES.PREORDERS) : [];

    const loadedPaymentMethods = await loadFromIndexedDB(STORE_NAMES.PAYMENT_METHODS);
    paymentMethods = Array.isArray(loadedPaymentMethods) && loadedPaymentMethods.length > 0 ?
      loadedPaymentMethods.map(m => m.name) :
      ['Cash', 'Transfer'];

    const loadedTransferMethods = await loadFromIndexedDB(STORE_NAMES.TRANSFER_METHODS);
    transferMethods = Array.isArray(loadedTransferMethods) && loadedTransferMethods.length > 0 ?
      loadedTransferMethods.map(m => m.name) :
      ['Bank BCA', 'Bank Mandiri', 'OVO', 'GoPay'];

    try {
      const loadedArtists = await loadFromIndexedDB(STORE_NAMES.ARTISTS);
      artists = Array.isArray(loadedArtists) && loadedArtists.length > 0 ?
        loadedArtists.map(a => a.name) :
        [];
      console.log("Artists dimuat:", artists);
    } catch (error) {
      console.warn("Gagal memuat artists, menggunakan array kosong:", error);
      artists = [];
    }

    try {
      const loadedPromoRules = await loadFromIndexedDB(STORE_NAMES.PROMO_RULES);

      if (Array.isArray(loadedPromoRules) && loadedPromoRules.length > 0) {
        promoRules = loadedPromoRules;
        console.log("Promo rules dimuat:", promoRules.length, "aturan");

        promoRules.forEach((rule, index) => {
          if (!rule.id) {
            console.warn(`Rule promo ke-${index} tidak memiliki id, akan ditambahkan id sementara`);
            rule.id = Date.now() + index;
          }
          if (!rule.rules || !Array.isArray(rule.rules)) {
            console.warn(`Rule promo ke-${index} untuk kategori ${rule.category} memiliki rules yang tidak valid`);
            rule.rules = [];
          }
        });
      } else if (Array.isArray(loadedPromoRules) && loadedPromoRules.length === 0) {
        promoRules = [];
        console.log("Promo rules kosong (array kosong)");
      } else if (loadedPromoRules && typeof loadedPromoRules === 'object' && !Array.isArray(loadedPromoRules)) {
        console.warn("Promo rules dimuat dalam format objek, mencoba konversi ke array");
        const rulesArray = Object.values(loadedPromoRules).flat();
        if (rulesArray.length > 0 && rulesArray[0] && typeof rulesArray[0] === 'object') {
          promoRules = rulesArray;
          console.log("Berhasil konversi promo rules dari objek ke array:", promoRules.length, "aturan");
        } else {
          promoRules = [];
          console.log("Tidak dapat konversi promo rules, menggunakan array kosong");
        }
      } else {
        promoRules = [];
        console.log("Promo rules tidak tersedia atau format tidak dikenali, menggunakan array kosong");
      }

      if (promoRules.length > 0) {
        console.log("Ringkasan promo rules yang dimuat:");
        promoRules.forEach(rule => {
          console.log(`  - Kategori: ${rule.category}, Jumlah aturan: ${rule.rules ? rule.rules.length : 0}`);
          if (rule.rules && rule.rules.length > 0) {
            rule.rules.forEach(subRule => {
              console.log(`      * ${subRule.qty} barang → Rp${subRule.price}`);
            });
          }
        });
      }
    } catch (error) {
      console.warn("Gagal memuat promo rules, menggunakan array kosong:", error);
      promoRules = [];
    }

    console.log("Keranjang, penjualan, pre-order, metode pembayaran, artists, dan promo rules dimuat.");

    console.log("Data berhasil dimuat. Memperbarui UI...");
    updateNavbarCategories();
    renderProducts();
    updateCartBadge();

    setTimeout(() => {
      populateArtistSelects();
    }, 100);

    if (categories.length > 0) {
      const savedTab = localStorage.getItem('activeTab');
      if (savedTab && document.getElementById(savedTab)) {
        showTab(savedTab);
      } else {
        showTab(categories[0]);
      }
    } else {
      document.getElementById('dynamic-tabs').innerHTML = '<div class="empty-state">Tidak ada jenis barang. Tambahkan jenis barang baru untuk memulai.</div>';
      const navbar = document.querySelector('.navbar');
      navbar.innerHTML = '';
      const manageBtn = document.createElement('button');
      manageBtn.className = 'manage-category';
      manageBtn.innerHTML = '<i class="fas fa-plus"></i> Jenis Barang';
      manageBtn.onclick = showCategoryModal;
      navbar.appendChild(manageBtn);
    }
    console.log("UI diperbarui.");
  } catch (error) {
    console.error("Gagal memuat data (detail):", error);
    showNotification('Gagal memuat data! Silakan coba muat ulang halaman atau reset data.');
    document.getElementById('dynamic-tabs').innerHTML = '<div class="empty-state" style="color: red;">Gagal memuat data. Mohon periksa konsol browser untuk detail kesalahan.</div>';
  }
}

async function saveAllData() {
  try {
    await saveToIndexedDB(STORE_NAMES.PRODUCTS, data);
    await saveToIndexedDB(STORE_NAMES.CART, cart);
    await saveToIndexedDB(STORE_NAMES.SALES, sales);
    const categoriesToSave = categories.map(name => ({ name }));
    await saveToIndexedDB(STORE_NAMES.CATEGORIES, categoriesToSave);
    await saveToIndexedDB(STORE_NAMES.PREORDERS, preOrders);
    await saveToIndexedDB(STORE_NAMES.PROMO_RULES, promoRules);

    const artistsToSave = artists.map(name => ({ name }));
    await saveToIndexedDB(STORE_NAMES.ARTISTS, artistsToSave);

    const paymentMethodsToSave = paymentMethods.map(name => ({ name }));
    await saveToIndexedDB(STORE_NAMES.PAYMENT_METHODS, paymentMethodsToSave);
    const transferMethodsToSave = transferMethods.map(name => ({ name }));
    await saveToIndexedDB(STORE_NAMES.TRANSFER_METHODS, transferMethodsToSave);
  } catch (error) {
    console.error("Gagal menyimpan data ke database:", error);
  }
}
