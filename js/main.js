// App initialization

// Show active SW cache name in sidebar
if ("caches" in window) {
  caches.keys().then((keys) => {
    console.log("SW cache keys:", keys);
    const el = document.getElementById("swVersionLabel");
    const version = keys.length > 0 ? `v: ${keys[0]}` : "v: None";
    if (el) {
      el.textContent = version;
      console.log("Set version label to:", version);
    } else {
      console.warn("swVersionLabel element not found in DOM.");
    }
    const appLabel = document.getElementById("appVersionLabel");
    if (appLabel) appLabel.textContent = version;
  });
} else {
  console.warn("Cache API not available in this context.");
}

if ("serviceWorker" in navigator) {
  console.log("SW controller:", navigator.serviceWorker.controller);
  navigator.serviceWorker.ready.then((reg) => {
    console.log("SW ready, active:", reg.active?.state, "scope:", reg.scope);
  });
} else {
  console.warn("Service workers not supported.");
}

// SW update detection — show banner when a new version is waiting
let swWaitingWorker = null;

function applySwUpdate() {
  document.getElementById("swUpdateBanner").style.display = "none";
  if (swWaitingWorker) {
    swWaitingWorker.postMessage({ type: "SKIP_WAITING" });
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          swWaitingWorker = newWorker;
          document.getElementById("swUpdateBanner").style.display = "flex";
        }
      });
    });
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    setTimeout(() => window.location.reload(), 3000);
  });
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

      document
        .getElementById("refreshButton")
        .addEventListener("click", () => window.location.reload());

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
