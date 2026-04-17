// Utility / helper functions

function showNotification(message) {
  let notification = document.getElementById('notification');

  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    document.body.appendChild(notification);
  }

  notification.textContent = message;
  notification.style.display = 'flex';

  void notification.offsetWidth;

  notification.style.animation = 'fadeInUp 0.3s ease-out, fadeOutDown 0.5s ease 2.5s forwards';

  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

function handleEditSuccess(data) {
  showNotification(`Produk "${data.name}" berhasil diperbarui!`);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', { style: 'decimal' }).format(number);
}

function formatRupiahInput(input) {
  let value = input.value.replace(/[^0-9]/g, '');

  if (value === '') {
    input.value = '';
    return;
  }

  const numberValue = parseInt(value);

  input.value = new Intl.NumberFormat('id-ID').format(numberValue);

  setTimeout(() => {
    input.setSelectionRange(input.value.length, input.value.length);
  }, 0);
}

function isProductCodeDuplicate(code, currentProductCode = null) {
  for (const category in data) {
    if (data.hasOwnProperty(category)) {
      for (const product of data[category]) {
        if (product.code === code && product.code !== currentProductCode) {
          return true;
        }
      }
    }
  }
  return false;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function naturalCompare(a, b) {
  const codeA = a.code || '';
  const codeB = b.code || '';

  const re = /(\D*)(\d+)/;
  const matchA = codeA.match(re);
  const matchB = codeB.match(re);

  if (!matchA || !matchB) {
    return codeA.localeCompare(codeB);
  }

  const textA = matchA[1];
  const numA = parseInt(matchA[2], 10);
  const textB = matchB[1];
  const numB = parseInt(matchB[2], 10);

  const textComparison = textA.localeCompare(textB);
  if (textComparison !== 0) {
    return textComparison;
  }

  return numA - numB;
}

function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
  return buf;
}

function findProductByNameAndCategory(productName, category) {
  if (data[category]) {
    return data[category].find(product => (product.code === productName) || (product.name === productName));
  }
  return null;
}
