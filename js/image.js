// Image handling: paste, preview, compression

function handlePasteOnArea(event, pasteArea) {
  event.preventDefault();
  const items = (event.clipboardData || window.clipboardData).items;
  let file = null;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      file = items[i].getAsFile();
      break;
    }
  }

  if (file) {
    const fileInput = pasteArea.querySelector('input[type="file"]');
    const preview = pasteArea.querySelector('img.preview');

    if (!fileInput || !preview) {
      console.error("Tidak dapat menemukan input file atau elemen preview di dalam area paste.", pasteArea);
      showNotification("Terjadi kesalahan internal (elemen tidak ditemukan).");
      return;
    }

    fileInput.pastedFile = file;

    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    showNotification('Gambar berhasil ditempel!');
  } else {
    showNotification('Tidak ada gambar yang ditemukan di clipboard.');
  }
}

function initializeImagePaste() {
  document.body.addEventListener('paste', function(event) {
    const pasteArea = event.target.closest('.image-paste-area');
    if (pasteArea) {
      handlePasteOnArea(event, pasteArea);
    }
  });
}

function previewImage(event, context) {
  const fileInput = event.target;

  if (fileInput.pastedFile) {
    delete fileInput.pastedFile;
  }

  const file = fileInput.files[0];
  if (!file) return;

  const previewId = context === 'edit' ? 'editPreview' : `imagePreview-${context}`;
  const preview = document.getElementById(previewId);
  const reader = new FileReader();

  reader.onload = function(e) {
    preview.src = e.target.result;
    preview.style.display = 'block';
  };

  reader.readAsDataURL(file);
}

async function compressImage(file, maxSizeKB = 50) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        let width = img.width;
        let height = img.height;
        const maxDimension = 800;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height *= maxDimension / width;
            width = maxDimension;
          } else {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.7;
        let compressedDataUrl;

        for (let i = 0; i < 5; i++) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const sizeKB = (compressedDataUrl.length * 0.75) / 1024;
          if (sizeKB <= maxSizeKB) break;
          quality -= 0.15;
          if (quality < 0.1) quality = 0.1;
        }
        resolve(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function openCamera(context) {
  const inputId = context === 'edit' ? 'editImageFile' : `imageInput-${context}`;
  const input = document.getElementById(inputId);
  if (input) {
    input.setAttribute('capture', 'environment');
    input.click();
  }
}

function openGallery(context) {
  const inputId = context === 'edit' ? 'editImageFile' : `imageInput-${context}`;
  const input = document.getElementById(inputId);
  if (input) {
    input.removeAttribute('capture');
    input.click();
  }
}
