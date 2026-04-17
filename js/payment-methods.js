// Payment methods (transfer methods) management

function openPaymentMethodModal() {
  document.getElementById('paymentMethodModal').style.display = 'flex';
  document.body.classList.add('modal-open');
  renderPaymentMethodList();
}

function closePaymentMethodModal() {
  document.getElementById('paymentMethodModal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

function renderPaymentMethodList() {
  const paymentMethodListDiv = document.getElementById('paymentMethodList');
  paymentMethodListDiv.innerHTML = '';

  if (transferMethods.length === 0) {
    paymentMethodListDiv.innerHTML = '<div class="empty-state">Belum ada metode transfer.</div>';
    return;
  }

  transferMethods.forEach((method, index) => {
    const item = document.createElement('div');
    item.className = 'payment-method-item';
    item.setAttribute('data-method-name', method);

    item.innerHTML = `
      <span id="methodName-${index}">${method}</span>
      <div class="payment-method-actions">
        <button class="btn-edit-method" onclick="editPaymentMethodName('${method}', ${index})"><i class="fas fa-pencil-alt"></i> Edit</button>
        <button class="btn-delete-method" onclick="deletePaymentMethod('${method}', ${index})"><i class="fas fa-trash"></i> Hapus</button>
      </div>
    `;
    paymentMethodListDiv.appendChild(item);
  });
}

async function addNewPaymentMethod(event) {
  event.preventDefault();
  const input = document.getElementById('newPaymentMethodName');
  const newMethodName = input.value.trim();

  if (!newMethodName) {
    showNotification('Nama metode pembayaran tidak boleh kosong!');
    return;
  }
  if (transferMethods.includes(newMethodName)) {
    showNotification('Metode pembayaran dengan nama tersebut sudah ada!');
    return;
  }

  transferMethods.push(newMethodName);
  transferMethods.sort((a, b) => a.localeCompare(b));

  try {
    await saveToIndexedDB(STORE_NAMES.TRANSFER_METHODS, transferMethods.map(name => ({ name })));
    renderPaymentMethodList();
    showNotification('Metode pembayaran berhasil ditambahkan!');
    input.value = '';
    populateProductSelect();
    renderDynamicTransferMethods();
  } catch (error) {
    console.error('Gagal menambahkan metode pembayaran:', error);
    showNotification('Gagal menambahkan metode pembayaran!');
  }
}

function editPaymentMethodName(oldMethodName, index) {
  const methodItem = document.querySelector(`.payment-method-item[data-method-name="${oldMethodName}"]`);
  if (!methodItem) return;

  const methodNameSpan = methodItem.querySelector(`#methodName-${index}`);
  const methodActionsDiv = methodItem.querySelector('.payment-method-actions');

  const originalName = methodNameSpan.textContent;

  methodNameSpan.innerHTML = `
    <input type="text" id="editMethodInput-${index}" value="${originalName}" />
  `;

  methodActionsDiv.innerHTML = `
    <button class="btn-save-method" onclick="savePaymentMethodName('${oldMethodName}', ${index})"><i class="fas fa-save"></i> Simpan</button>
    <button class="btn-cancel-edit" onclick="cancelEditPaymentMethodName('${oldMethodName}', ${index}, '${originalName}')"><i class="fas fa-times"></i> Batal</button>
  `;

  document.getElementById(`editMethodInput-${index}`).focus();
}

async function savePaymentMethodName(oldMethodName, index) {
  const newMethodInput = document.getElementById(`editMethodInput-${index}`);
  const newMethodName = newMethodInput.value.trim();

  if (!newMethodName) {
    showNotification('Nama metode pembayaran tidak boleh kosong!');
    return;
  }
  if (newMethodName === oldMethodName) {
    cancelEditPaymentMethodName(oldMethodName, index, oldMethodName);
    return;
  }
  if (transferMethods.includes(newMethodName)) {
    showNotification('Metode pembayaran dengan nama tersebut sudah ada!');
    return;
  }

  if (!confirm(`Ubah nama metode pembayaran dari "${oldMethodName}" menjadi "${newMethodName}"?`)) {
    cancelEditPaymentMethodName(oldMethodName, index, oldMethodName);
    return;
  }

  try {
    transferMethods[index] = newMethodName;
    transferMethods.sort((a, b) => a.localeCompare(b));

    await saveToIndexedDB(STORE_NAMES.TRANSFER_METHODS, transferMethods.map(name => ({ name })));
    renderPaymentMethodList();
    showNotification('Metode pembayaran berhasil diubah!');
    populateProductSelect();
    renderDynamicTransferMethods();
  } catch (error) {
    console.error('Gagal menyimpan perubahan metode pembayaran:', error);
    showNotification('Gagal menyimpan perubahan metode pembayaran!');
  }
}

function cancelEditPaymentMethodName(oldMethodName, index, originalDisplayName) {
  const methodItem = document.querySelector(`.payment-method-item[data-method-name="${oldMethodName}"]`);
  if (!methodItem) return;

  const methodNameSpan = methodItem.querySelector(`#methodName-${index}`);
  const methodActionsDiv = methodItem.querySelector('.payment-method-actions');

  methodNameSpan.textContent = originalDisplayName;

  methodActionsDiv.innerHTML = `
    <button class="btn-edit-method" onclick="editPaymentMethodName('${oldMethodName}', ${index})"><i class="fas fa-pencil-alt"></i> Edit</button>
    <button class="btn-delete-method" onclick="deletePaymentMethod('${oldMethodName}', ${index})"><i class="fas fa-trash"></i> Hapus</button>
  `;
}

async function deletePaymentMethod(methodName, index) {
  if (!confirm(`Apakah Anda yakin ingin menghapus metode pembayaran "${methodName}"?`)) {
    return;
  }

  try {
    transferMethods.splice(index, 1);
    await saveToIndexedDB(STORE_NAMES.TRANSFER_METHODS, transferMethods.map(name => ({ name })));
    renderPaymentMethodList();
    showNotification('Metode pembayaran berhasil dihapus!');
    populateProductSelect();
    renderDynamicTransferMethods();
  } catch (error) {
    console.error('Gagal menghapus metode pembayaran:', error);
    showNotification('Gagal menghapus metode pembayaran!');
  }
}
