// Import/Export and Excel download functionality

async function requestStoragePermission() {
  return new Promise((resolve, reject) => {
    if (window.cordova && cordova.platformId === 'android') {
      if (cordova.plugins && cordova.plugins.permissions) {
        cordova.plugins.permissions.requestPermission(
          cordova.plugins.permissions.WRITE_EXTERNAL_STORAGE,
          function(status) {
            if (status.hasPermission) {
              resolve(true);
            } else {
              showNotification('Izin penyimpanan ditolak. Export file mungkin tidak berfungsi.');
              resolve(false);
            }
          },
          function(error) {
            console.error('Error requesting permission:', error);
            reject(error);
          }
        );
      } else {
        resolve(true);
      }
    } else {
      resolve(true);
    }
  });
}

async function exportData() {
  try {
    const hasPermission = await requestStoragePermission();

    if (!hasPermission) {
      showNotification('Tidak dapat mengakses penyimpanan. Export dibatalkan.');
      return;
    }

    const allData = {
      products: await loadFromIndexedDB(STORE_NAMES.PRODUCTS),
      cart: await loadFromIndexedDB(STORE_NAMES.CART),
      sales: await loadFromIndexedDB(STORE_NAMES.SALES),
      categories: await loadFromIndexedDB(STORE_NAMES.CATEGORIES),
      preorders: await loadFromIndexedDB(STORE_NAMES.PREORDERS),
      paymentMethods: await loadFromIndexedDB(STORE_NAMES.PAYMENT_METHODS),
      transferMethods: await loadFromIndexedDB(STORE_NAMES.TRANSFER_METHODS),
      artists: await loadFromIndexedDB(STORE_NAMES.ARTISTS),
      promoRules: await loadFromIndexedDB(STORE_NAMES.PROMO_RULES),
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const fileName = `backup_penjualan_${new Date().toISOString().slice(0,10)}.json`;

    if (window.cordova && cordova.platformId !== 'browser') {
      await exportWithCordova(dataStr, fileName);
    } else {
      exportWithWeb(dataStr, fileName);
    }
  } catch (error) {
    console.error('Gagal export data:', error);
    showNotification('Gagal export data! ' + error.message);
  }
}

function exportWithWeb(dataStr, fileName) {
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);

  showNotification('Data berhasil di-export!');
}

async function exportWithCordova(dataStr, fileName) {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([dataStr], { type: 'application/json' });
      window.resolveLocalFileSystemURL(
        cordova.file.externalDirectory || cordova.file.externalRootDirectory,
        function(directoryEntry) {
          directoryEntry.getFile(fileName, { create: true, exclusive: false },
            function(fileEntry) {
              fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function() {
                  showNotification(`Data berhasil di-export ke: ${fileName}`);
                  resolve();
                };
                fileWriter.onerror = function(e) {
                  showNotification('Gagal menyimpan file export!');
                  reject(e);
                };
                fileWriter.write(blob);
              }, reject);
            }, reject);
        }, reject);
    } catch (error) {
      console.error('Gagal export dengan Cordova:', error);
      reject(error);
    }
  });
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const importedData = JSON.parse(e.target.result);

      if (!importedData ||
          !(importedData.products || importedData.cart || importedData.sales || importedData.categories || importedData.preorders || importedData.paymentMethods || importedData.transferMethods)) {
        throw new Error("Format file tidak valid");
      }

      if (!confirm(`Gabungkan data dari ${new Date(importedData.timestamp || new Date()).toLocaleString()}? Data yang ada tidak akan dihapus. Lanjutkan?`)) {
        return;
      }

      const findProductByNameOrCode = (name, code) => {
        return Object.values(data).flat().find(p => p.name.toLowerCase() === name.toLowerCase() || (p.code && code && p.code.toLowerCase() === code.toLowerCase()));
      };

      if (importedData.categories && Array.isArray(importedData.categories)) {
        const importedCategoryNames = importedData.categories.map(c => c.name);
        const combinedCategories = new Set([...categories, ...importedCategoryNames]);
        categories = Array.from(combinedCategories).sort((a, b) => a.localeCompare(b));
      }

      const importedArtists = new Set();

      if (importedData.products && Array.isArray(importedData.products)) {
        importedData.products.forEach(product => {
          let newName = product.name;
          let newCode = product.code;
          const originalName = product.name;
          const originalCode = product.code;
          let counter = 1;

          if (product.artist && product.artist.trim() !== '') {
            importedArtists.add(product.artist);
          }

          while (findProductByNameOrCode(newName, newCode)) {
            newName = `${counter}_${originalName}`;
            newCode = originalCode ? `${counter}_${originalCode}` : `${counter}_${originalName}`;
            counter++;
          }

          product.name = newName;
          product.code = newCode;

          if (!data[product.category]) {
            data[product.category] = [];
          }
          data[product.category].push(product);
        });
      }

      if (importedArtists.size > 0) {
        const combinedArtists = new Set([...artists, ...importedArtists]);
        artists = Array.from(combinedArtists).sort((a, b) => a.localeCompare(b));
      }

      if (importedData.sales && Array.isArray(importedData.sales)) sales.push(...importedData.sales);
      if (importedData.cart && Array.isArray(importedData.cart)) cart.push(...importedData.cart);
      if (importedData.preorders && Array.isArray(importedData.preorders)) preOrders.push(...importedData.preorders);

      if (importedData.paymentMethods && Array.isArray(importedData.paymentMethods)) {
        const importedPaymentNames = importedData.paymentMethods.map(m => m.name);
        paymentMethods = Array.from(new Set([...paymentMethods, ...importedPaymentNames]));
      }
      if (importedData.transferMethods && Array.isArray(importedData.transferMethods)) {
        const importedTransferNames = importedData.transferMethods.map(m => m.name);
        transferMethods = Array.from(new Set([...transferMethods, ...importedTransferNames]));
      }

      if (importedData.promoRules) {
        let importedPromoRules = [];

        if (Array.isArray(importedData.promoRules)) {
          importedPromoRules = importedData.promoRules;
        } else if (typeof importedData.promoRules === 'object' && importedData.promoRules !== null) {
          if (importedData.promoRules.data && Array.isArray(importedData.promoRules.data)) {
            importedPromoRules = importedData.promoRules.data;
          } else {
            const values = Object.values(importedData.promoRules);
            if (values.length > 0 && Array.isArray(values[0])) {
              importedPromoRules = values.flat();
            } else if (values.length > 0 && typeof values[0] === 'object') {
              importedPromoRules = values;
            }
          }
        }

        if (Array.isArray(importedPromoRules) && importedPromoRules.length > 0) {
          const validRules = importedPromoRules.filter(rule =>
            rule &&
            rule.category &&
            rule.rules &&
            Array.isArray(rule.rules) &&
            rule.rules.length > 0
          );

          if (validRules.length > 0) {
            validRules.forEach(importedRule => {
              const existingRuleIndex = promoRules.findIndex(r => r.category === importedRule.category);
              if (existingRuleIndex !== -1) {
                const existingQtys = new Set(promoRules[existingRuleIndex].rules.map(r => r.qty));
                const newSubRules = importedRule.rules.filter(subRule => !existingQtys.has(subRule.qty));
                promoRules[existingRuleIndex].rules.push(...newSubRules);
                promoRules[existingRuleIndex].rules.sort((a, b) => a.qty - b.qty);
              } else {
                promoRules.push(importedRule);
              }
            });
          }
        }
      }

      if (importedData.sales && Array.isArray(importedData.sales)) {
        importedData.sales.forEach(sale => {
          sale.items.forEach(item => {
            if (item.artist && item.artist.trim() !== '') {
              importedArtists.add(item.artist);
            }
          });
        });

        if (importedArtists.size > 0) {
          const combinedArtists = new Set([...artists, ...importedArtists]);
          artists = Array.from(combinedArtists).sort((a, b) => a.localeCompare(b));
        }
      }

      if (importedData.artists && Array.isArray(importedData.artists)) {
        const importedArtistNames = importedData.artists.map(a => a.name);
        const combinedArtists = new Set([...artists, ...importedArtistNames]);
        artists = Array.from(combinedArtists).sort((a, b) => a.localeCompare(b));
      }

      await Promise.all([
        saveToIndexedDB(STORE_NAMES.PRODUCTS, data),
        saveToIndexedDB(STORE_NAMES.CART, cart),
        saveToIndexedDB(STORE_NAMES.SALES, sales),
        saveToIndexedDB(STORE_NAMES.CATEGORIES, categories.map(name => ({ name }))),
        saveToIndexedDB(STORE_NAMES.PREORDERS, preOrders),
        saveToIndexedDB(STORE_NAMES.PAYMENT_METHODS, paymentMethods.map(name => ({ name }))),
        saveToIndexedDB(STORE_NAMES.TRANSFER_METHODS, transferMethods.map(name => ({ name }))),
        saveToIndexedDB(STORE_NAMES.ARTISTS, artists.map(name => ({ name }))),
        saveToIndexedDB(STORE_NAMES.PROMO_RULES, promoRules)
      ]);

      await loadFromDatabase();

      showNotification(`Data berhasil digabungkan! ${promoRules.length} aturan promo berhasil diimport.`);
    } catch (error) {
      console.error('Gagal import dan gabungkan data:', error);
      showNotification('Gagal menggabungkan data! ' + error.message);
    }
  };

  reader.onerror = () => {
    showNotification('Gagal membaca file!');
  };

  reader.readAsText(file);
}

function showImportDialog() {
  if (window.cordova && cordova.platformId !== 'browser') {
    showCordovaImportOptions();
  } else {
    document.getElementById('importFile').click();
  }
}

function importFromWebMethod() {
  document.querySelector('.modal-overlay')?.remove();
  document.getElementById('importFile').click();
}

function showCordovaImportOptions() {
  const importModal = document.createElement('div');
  importModal.className = 'modal-overlay';
  importModal.style.display = 'flex';
  importModal.innerHTML = `
    <div class="modal-content">
      <h3>Import Data</h3>
      <p>Pilih metode import:</p>
      <button onclick="importFromFilePicker()" class="btn-primary">Pilih File dari Perangkat</button>
      <button onclick="importFromWebMethod()" class="btn-secondary">Gunakan Input File Web</button>
      <button onclick="this.parentElement.parentElement.remove()" class="btn-cancel">Batal</button>
    </div>
  `;
  document.body.appendChild(importModal);
}

function importFromFilePicker() {
  if (window.cordova && cordova.plugins.filePicker) {
    cordova.plugins.filePicker.pickFile(
      function(uri) {
        readCordovaFile(uri);
      },
      function(error) {
        console.log('Error picking file:', error);
        showNotification('Gagal memilih file');
        document.getElementById('importFile').click();
      },
      { mimeType: 'application/json' }
    );
  } else {
    showNotification('File picker tidak tersedia, gunakan metode web');
    document.getElementById('importFile').click();
  }
}

async function readCordovaFile(uri) {
  try {
    window.resolveLocalFileSystemURL(uri, function(fileEntry) {
      fileEntry.file(function(file) {
        const reader = new FileReader();
        reader.onloadend = function(e) {
          try {
            const importedData = JSON.parse(this.result);
            processImportedData(importedData);
            document.querySelector('.modal-overlay')?.remove();
            showNotification('Data berhasil diimport!');
          } catch (error) {
            showNotification('Format file tidak valid');
          }
        };
        reader.onerror = function() {
          showNotification('Gagal membaca file');
        };
        reader.readAsText(file);
      }, function(error) {
        showNotification('Gagal membaca file: ' + error.message);
      });
    }, function(error) {
      showNotification('Gagal mengakses file: ' + error.message);
    });
  } catch (error) {
    showNotification('Error: ' + error.message);
  }
}

async function resetAllData() {
  if (confirm("Apakah Anda yakin ingin mereset SEMUA data?\nIni akan menghapus semua produk, penjualan, dan keranjang belanja.")) {
    try {
      data = {};
      cart = [];
      sales = [];
      categories = [];
      preOrders = [];
      artists = [];
      paymentMethods = ['Cash', 'Transfer'];
      transferMethods = ['Bank BCA', 'Bank Mandiri', 'OVO', 'GoPay'];
      promoRules = [];
      await saveToIndexedDB(STORE_NAMES.PROMO_RULES, promoRules);

      await Promise.all([
        saveToIndexedDB(STORE_NAMES.PRODUCTS, data),
        saveToIndexedDB(STORE_NAMES.CART, cart),
        saveToIndexedDB(STORE_NAMES.SALES, sales),
        saveToIndexedDB(STORE_NAMES.CATEGORIES, []),
        saveToIndexedDB(STORE_NAMES.PREORDERS, []),
        saveToIndexedDB(STORE_NAMES.ARTISTS, []),
        saveToIndexedDB(STORE_NAMES.PAYMENT_METHODS, paymentMethods.map(name => ({ name }))),
        saveToIndexedDB(STORE_NAMES.TRANSFER_METHODS, transferMethods.map(name => ({ name }))),
        saveToIndexedDB(STORE_NAMES.PROMO_RULES, promoRules)
      ]);

      renderProducts();
      updateCartBadge();
      renderCategoryList();
      updateNavbarCategories();
      renderPreOrderList();
      renderDynamicTransferMethods();
      populateProductSelect();
      populateArtistSelects();

      showNotification('Semua data telah direset!');
    } catch (error) {
      console.error("Gagal mereset data:", error);
      showNotification('Gagal mereset data!');
    }
  }
}

async function downloadExcel() {
  try {
    if (sales.length === 0) {
      showNotification("Belum ada data penjualan untuk diunduh!");
      return;
    }

    if (window.cordova && cordova.platformId !== 'browser') {
      await downloadExcelCordova();
    } else {
      await downloadExcelWeb();
    }
  } catch (error) {
    console.error("Gagal mengunduh data Excel:", error);
    showNotification("Gagal mengunduh data Excel! " + error.message);
  }
}

async function downloadExcelWeb() {
  const reportDate = new Date().toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const ws_data = [
    ["Laporan Penjualan - Data Diambil Pada: " + reportDate],
    [],
    ["Waktu", "Nama Barang", "Kategori", "Kode Barang", "Artist", "Jumlah", "Harga Satuan", "Total Item", "Total Pembayaran", "Jenis Pembayaran"]
  ];

  sales.forEach(sale => {
    sale.items.forEach(item => {
      const time = sale.time || '';
      const itemName = item.name || '';
      const itemCategory = item.category || '';
      const itemCode = item.code || '';
      const itemArtist = item.artist || 'Tanpa Artist';
      const itemQty = item.qty || 0;
      const itemPrice = item.price || 0;
      const itemTotal = itemQty * itemPrice;
      const amountPaid = sale.amountPaid || 0;
      const paymentType = sale.paymentType || '-';

      ws_data.push([
        time,
        itemName,
        itemCategory,
        itemCode,
        itemArtist,
        itemQty,
        `Rp${formatRupiah(itemPrice)}`,
        `Rp${formatRupiah(itemTotal)}`,
        `Rp${formatRupiah(amountPaid)}`,
        paymentType
      ]);
    });
  });

  const grandTotalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  ws_data.push([]);
  ws_data.push(["TOTAL PENJUALAN KESELURUHAN", "", "", "", "", "", "", "", "", `Rp${formatRupiah(grandTotalSales)}`]);

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wscols = [
    {wch: 20}, {wch: 30}, {wch: 15}, {wch: 15}, {wch: 20},
    {wch: 10}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 20}
  ];
  ws['!cols'] = wscols;
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");

  const fileName = `Data_Penjualan_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  showNotification("Data penjualan berhasil diunduh!");
}

async function downloadExcelCordova() {
  return new Promise(async (resolve, reject) => {
    try {
      if (window.cordova && cordova.platformId === 'android') {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          showNotification('Izin penyimpanan diperlukan untuk download file');
          reject(new Error('No storage permission'));
          return;
        }
      }

      const reportDate = new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const ws_data = [
        ["Laporan Penjualan - Data Diambil Pada: " + reportDate],
        [],
        ["Waktu", "Nama Barang", "Kategori", "Kode Barang", "Artist", "Jumlah", "Harga Satuan", "Total Item", "Total Pembayaran", "Jenis Pembayaran"]
      ];

      sales.forEach(sale => {
        sale.items.forEach(item => {
          const time = sale.time || '';
          const itemName = item.name || '';
          const itemCategory = item.category || '';
          const itemCode = item.code || '';
          const itemArtist = item.artist || 'Tanpa Artist';
          const itemQty = item.qty || 0;
          const itemPrice = item.price || 0;
          const itemTotal = itemQty * itemPrice;
          const amountPaid = sale.amountPaid || 0;
          const paymentType = sale.paymentType || '-';

          ws_data.push([
            time,
            itemName,
            itemCategory,
            itemCode,
            itemArtist,
            itemQty,
            `Rp${formatRupiah(itemPrice)}`,
            `Rp${formatRupiah(itemTotal)}`,
            `Rp${formatRupiah(amountPaid)}`,
            paymentType
          ]);
        });
      });

      const grandTotalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
      ws_data.push([]);
      ws_data.push(["TOTAL PENJUALAN KESELURUHAN", "", "", "", "", "", "", "", "", `Rp${formatRupiah(grandTotalSales)}`]);

      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wscols = [
        {wch: 20}, {wch: 30}, {wch: 15}, {wch: 15}, {wch: 20},
        {wch: 10}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 20}
      ];
      ws['!cols'] = wscols;
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const fileName = `Data_Penjualan_${new Date().toISOString().slice(0,10)}.xlsx`;

      window.resolveLocalFileSystemURL(cordova.file.externalDirectory ||
                                       cordova.file.externalRootDirectory,
      function(directoryEntry) {
        directoryEntry.getFile(fileName, { create: true, exclusive: false },
        function(fileEntry) {
          fileEntry.createWriter(function(fileWriter) {
            fileWriter.onwriteend = function() {
              showNotification(`File Excel berhasil disimpan di: ${fileEntry.nativeURL}`);
              if (cordova.plugins.fileOpener2) {
                cordova.plugins.fileOpener2.open(
                  fileEntry.toURL(),
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  {
                    error: function(e) {
                      console.log('File opened in background');
                    },
                    success: function() {
                      console.log('File opened successfully');
                    }
                  }
                );
              }
              resolve();
            };
            fileWriter.onerror = function(e) {
              console.log('Write failed: ' + e.toString());
              showNotification('Gagal menyimpan file Excel!');
              reject(e);
            };
            const buffer = new ArrayBuffer(wbout.length);
            const view = new Uint8Array(buffer);
            for (let i = 0; i < wbout.length; i++) {
              view[i] = wbout.charCodeAt(i) & 0xFF;
            }
            const blob = new Blob([buffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            fileWriter.write(blob);
          }, reject);
        }, reject);
      }, reject);
    } catch (error) {
      console.error("Gagal mengunduh data Excel di Cordova:", error);
      reject(error);
    }
  });
}

async function downloadExcelWithCordova(wb) {
  try {
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    const blob = new Blob([s2ab(excelBuffer)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory ||
                                     cordova.file.externalRootDirectory,
    function(directoryEntry) {
      const fileName = `Data_Penjualan_${new Date().toISOString().slice(0,10)}.xlsx`;

      directoryEntry.getFile(fileName, { create: true, exclusive: false },
      function(fileEntry) {
        fileEntry.createWriter(function(fileWriter) {
          fileWriter.onwriteend = function() {
            showNotification(`File Excel berhasil disimpan: ${fileName}`);
            if (cordova.plugins.fileOpener2) {
              cordova.plugins.fileOpener2.open(
                fileEntry.toURL(),
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                {
                  error: function(e) {
                    console.log('Error opening Excel file: ' + JSON.stringify(e));
                  },
                  success: function() {
                    console.log('Excel file opened successfully');
                  }
                }
              );
            }
          };

          fileWriter.onerror = function(e) {
            console.log('Write failed: ' + e.toString());
            showNotification('Gagal menyimpan file Excel!');
          };

          fileWriter.write(blob);
        });
      });
    });
  } catch (error) {
    console.error("Gagal menyimpan Excel dengan Cordova:", error);
    showNotification("Gagal menyimpan file Excel!");
  }
}
