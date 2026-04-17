// App initialization

// Show active SW cache name in sidebar
if ("serviceWorker" in navigator) {
  function requestCacheName() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "GET_CACHE_NAME",
      });
    }
  }
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data && e.data.type === "CACHE_NAME") {
      const el = document.getElementById("swVersionLabel");
      if (el) el.textContent = `v: ${e.data.value}`;
    }
  });
  // On reload when SW is already controlling the page
  navigator.serviceWorker.ready.then(requestCacheName);
  // On first load: SW claims the page after installing (skipWaiting + clients.claim)
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    requestCacheName,
  );
}

window.addEventListener("load", () => {
  adjustContentMargin();
  loadFromDatabase();
});

window.addEventListener("resize", adjustContentMargin);

// Global handler: close any open edit/delete popup when clicking outside a product card
document.addEventListener('click', (e) => {
  if (!e.target.closest('.product-card')) {
    document.querySelectorAll('.button-group').forEach(g => {
      if (g.style.display === 'flex') {
        g.style.animation = 'fadeOutDown 0.2s forwards';
        setTimeout(() => { g.style.display = 'none'; }, 200);
      }
    });
  }
  // Close filter dropdown when clicking outside
  if (!e.target.closest('#filterDropdownPanel') && !e.target.closest('#filterDropdownBtn')) {
    const panel = document.getElementById('filterDropdownPanel');
    if (panel) panel.style.display = 'none';
  }
});

document.addEventListener("DOMContentLoaded", function () {
  loadFromDatabase()
    .then(() => {
      adjustContentMargin();

      document
        .getElementById("cartButton")
        .addEventListener("click", toggleCartModal);

      document
        .getElementById("clearSearchButton")
        .addEventListener("click", function () {
          document.getElementById("searchInput").value = "";
          this.style.display = "none";
          filterProducts("");
          const savedTab = localStorage.getItem("activeTab");
          if (savedTab && document.getElementById(savedTab)) {
            showTab(savedTab);
          } else if (categories.length > 0) {
            showTab(categories[0]);
          }
        });

      document
        .getElementById("searchInput")
        .addEventListener("input", function () {
          filterProducts(this.value);
        });

      document
        .getElementById("fullscreenButton")
        .addEventListener("click", toggleFullscreen);

      document.addEventListener("fullscreenchange", () => {
        const fullscreenButton = document.getElementById("fullscreenButton");
        if (document.fullscreenElement) {
          fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
          fullscreenButton.classList.add("fullscreen-active");
        } else {
          fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
          fullscreenButton.classList.remove("fullscreen-active");
        }
      });

      // checkWelcomeMessage();
      setupModalCloseOnOutsideClick();
      initializeImagePaste();

      const btnDeleteSelected = document.getElementById("btnDeleteSelected");
      const btnCancelDeleteMode = document.getElementById(
        "btnCancelDeleteMode",
      );
      const deleteModeOverlay = document.getElementById("deleteModeOverlay");

      if (btnDeleteSelected) {
        btnDeleteSelected.addEventListener("click", deleteSelectedProducts);
      }
      if (btnCancelDeleteMode) {
        btnCancelDeleteMode.addEventListener("click", exitDeleteMode);
      }
      if (deleteModeOverlay) {
        deleteModeOverlay.addEventListener("click", exitDeleteMode);
      }

      const btnBulkEditConfirm = document.getElementById("btnBulkEditConfirm");
      const btnCancelBulkEditMode = document.getElementById("btnCancelBulkEditMode");
      if (btnBulkEditConfirm) {
        btnBulkEditConfirm.addEventListener("click", confirmBulkEditSelection);
      }
      if (btnCancelBulkEditMode) {
        btnCancelBulkEditMode.addEventListener("click", exitDeleteMode);
      }
    })
    .catch((error) => {
      console.error("Error dalam inisialisasi DOMContentLoaded:", error);
    });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAllModals();
      if (isDeleteMode) {
        exitDeleteMode();
      }
    }
  });
});
