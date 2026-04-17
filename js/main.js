// App initialization

// PWA install prompt
let _deferredInstallPrompt = null;

// Show active SW cache name in sidebar
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    reg.active.postMessage({ type: 'GET_CACHE_NAME' });
  });
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'CACHE_NAME') {
      const el = document.getElementById('swVersionLabel');
      if (el) el.textContent = `v: ${e.data.value}`;
    }
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;
  const banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'flex';
});

window.addEventListener('appinstalled', () => {
  _deferredInstallPrompt = null;
  const banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'none';
});

window.addEventListener('load', () => {
  adjustContentMargin();
  loadFromDatabase();
});

window.addEventListener('resize', adjustContentMargin);

document.addEventListener('DOMContentLoaded', function() {
  loadFromDatabase().then(() => {
    adjustContentMargin();

    document.getElementById('cartButton').addEventListener('click', toggleCartModal);

    document.getElementById('clearSearchButton').addEventListener('click', function() {
      document.getElementById('searchInput').value = '';
      this.style.display = 'none';
      filterProducts('');
      const savedTab = localStorage.getItem('activeTab');
      if (savedTab && document.getElementById(savedTab)) {
        showTab(savedTab);
      } else if (categories.length > 0) {
        showTab(categories[0]);
      }
    });

    document.getElementById('searchInput').addEventListener('input', function() {
      filterProducts(this.value);
    });

    document.getElementById('fullscreenButton').addEventListener('click', toggleFullscreen);

    document.addEventListener('fullscreenchange', () => {
      const fullscreenButton = document.getElementById('fullscreenButton');
      if (document.fullscreenElement) {
        fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
        fullscreenButton.classList.add('fullscreen-active');
      } else {
        fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenButton.classList.remove('fullscreen-active');
      }
    });

    // checkWelcomeMessage();
    setupModalCloseOnOutsideClick();
    initializeImagePaste();

    const installBannerAccept = document.getElementById('installBannerAccept');
    const installBannerDismiss = document.getElementById('installBannerDismiss');
    const installBanner = document.getElementById('installBanner');

    if (installBannerAccept) {
      installBannerAccept.addEventListener('click', async () => {
        if (!_deferredInstallPrompt) return;
        _deferredInstallPrompt.prompt();
        const { outcome } = await _deferredInstallPrompt.userChoice;
        _deferredInstallPrompt = null;
        if (installBanner) installBanner.style.display = 'none';
      });
    }

    if (installBannerDismiss) {
      installBannerDismiss.addEventListener('click', () => {
        if (installBanner) installBanner.style.display = 'none';
      });
    }

    const btnDeleteSelected = document.getElementById('btnDeleteSelected');
    const btnCancelDeleteMode = document.getElementById('btnCancelDeleteMode');
    const deleteModeOverlay = document.getElementById('deleteModeOverlay');

    if (btnDeleteSelected) {
      btnDeleteSelected.addEventListener('click', deleteSelectedProducts);
    }
    if (btnCancelDeleteMode) {
      btnCancelDeleteMode.addEventListener('click', exitDeleteMode);
    }
    if (deleteModeOverlay) {
      deleteModeOverlay.addEventListener('click', exitDeleteMode);
    }
  }).catch(error => {
    console.error("Error dalam inisialisasi DOMContentLoaded:", error);
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeAllModals();
      if (isDeleteMode) {
        exitDeleteMode();
      }
    }
  });
});
