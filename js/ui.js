// UI: tab switching, modals, sidebar, fullscreen

function adjustContentMargin() {
  const menuBarHeight = document.querySelector('.menu-bar').offsetHeight;
  const navbarHeight = document.querySelector('.navbar').offsetHeight;
  const totalHeight = menuBarHeight + navbarHeight;
  document.body.style.marginTop = totalHeight + 'px';
  document.documentElement.style.setProperty('--total-header-height', `${totalHeight}px`);
}

function toggleFilterDropdown() {
  const panel = document.getElementById('filterDropdownPanel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function updateNavbarFiltersDisplay(tabName) {
  const display = document.getElementById('navbarFiltersDisplay');
  if (!display) return;

  const categoryLabel = tabName === '__all__' ? 'Semua' : (tabName ? capitalizeFirstLetter(tabName) : '');
  const activeTags = (activeTagFilters[tabName] && activeTagFilters[tabName].size > 0)
    ? [...activeTagFilters[tabName]]
    : [];

  let html = '';
  if (categoryLabel) {
    html += `<span class="applied-filter-chip applied-filter-category">${categoryLabel}</span>`;
  }
  activeTags.forEach(tag => {
    html += `<span class="applied-filter-chip applied-filter-tag" onclick="toggleTagFilter('${tabName}', '${escapeHtml(tag)}')">${escapeHtml(tag)} <i class='fas fa-times' style='font-size:9px;margin-left:3px;'></i></span>`;
  });
  display.innerHTML = html;
}

function showTab(tabName) {
  if (isDeleteMode) {
    exitDeleteMode();
  }

  document.querySelectorAll('.tab-content').forEach(tab => {
    if (tab.classList.contains('active')) {
      tab.style.opacity = '0';
      tab.style.transform = 'translateY(10px)';
      setTimeout(() => {
        tab.classList.remove('active');
        tab.style.display = 'none';
      }, 300);
    }
  });

  const activeTab = document.getElementById(tabName);
  if (activeTab) {
    setTimeout(() => {
      activeTab.classList.add('active');
      activeTab.style.display = 'block';
      setTimeout(() => {
        activeTab.style.opacity = '1';
        activeTab.style.transform = 'translateY(0)';
        adjustContentMargin();
        renderProducts();
      }, 10);
    }, 300);
  }

  document.querySelectorAll('#categoryFilterBtns button').forEach(b => b.classList.remove('active-category'));
  const activeButton = document.querySelector(`#categoryFilterBtns button[data-tab="${tabName}"]`);
  if (activeButton) {
    activeButton.classList.add('active-category');
  }

  localStorage.setItem('activeTab', tabName);

  const searchResultsTab = document.getElementById('searchResultsTab');
  if (searchResultsTab) {
    searchResultsTab.style.display = 'none';
    searchResultsTab.classList.remove('active');
  }

  renderTagFilterBar(tabName);
  updateNavbarFiltersDisplay(tabName);
  if (tabName === '__all__') {
    renderAllProductsTab();
  }

  document.getElementById('searchInput').value = '';
  document.getElementById('clearSearchButton').style.display = 'none';
}

function loadActiveTab() {
  const savedTab = localStorage.getItem('activeTab');
  if (savedTab) {
    const activeButton = document.querySelector(`#categoryFilterBtns button[data-tab="${savedTab}"]`);
    if (activeButton) {
      activeButton.classList.add('active-category');
    }
    showTab(savedTab);
  } else if (categories.length > 0) {
    showTab(categories[0]);
  }
}

function toggleBackupMenu(event) {
  event.preventDefault();
  event.stopPropagation();

  const submenu = document.getElementById('backupSubmenu');
  submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
}

function toggleSidebar() {
  closeAllModals();
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
  document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

function showHelp() {
  document.getElementById('welcomeModal').style.display = 'flex';
}

function closeWelcomeModal() {
  const welcomeModal = document.getElementById('welcomeModal');
  if (welcomeModal) {
    welcomeModal.style.display = 'none';
  }
  document.body.classList.remove('modal-open');
}

function checkWelcomeMessage() {
  const welcomeModal = document.getElementById('welcomeModal');
  if (welcomeModal) {
    welcomeModal.style.display = 'flex';
  }
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  document.body.classList.remove('modal-open');

  const fileInput = document.getElementById('editImageFile');
  if (fileInput.pastedFile) {
    delete fileInput.pastedFile;
  }
}

function closeDashboard() {
  document.getElementById('dashboardModal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

function closeAllModals() {
  const modalsToClose = [
    document.getElementById('sidebar'),
    document.getElementById('cartModal'),
    document.getElementById('welcomeModal'),
    document.getElementById('editModal'),
    document.getElementById('categoryModal'),
    document.getElementById('dashboardModal'),
    document.getElementById('checkoutModal'),
    document.getElementById('preOrderModal'),
    document.getElementById('checkoutConfirmationModal'),
    document.getElementById('paymentMethodModal'),
    document.getElementById('artistModal'),
    document.getElementById('promoRulesModal')
  ];

  modalsToClose.forEach(modal => {
    if (modal) {
      if (modal.classList && modal.classList.contains('sidebar')) {
        closeSidebar();
      } else if ((modal.classList && modal.classList.contains('open')) || modal.style.display === 'flex') {
        if (modal.id === 'cartModal') closeCartModal();
        else if (modal.id === 'welcomeModal') closeWelcomeModal();
        else if (modal.id === 'editModal') closeEditModal();
        else if (modal.id === 'categoryModal') closeCategoryModal();
        else if (modal.id === 'dashboardModal') closeDashboard();
        else if (modal.id === 'checkoutModal') closeCheckoutModal();
        else if (modal.id === 'preOrderModal') closePreOrderModal();
        else if (modal.id === 'checkoutConfirmationModal') closeCheckoutConfirmationModal();
        else if (modal.id === 'paymentMethodModal') closePaymentMethodModal();
        else if (modal.id === 'artistModal') closeArtistModal();
        else if (modal.id === 'promoRulesModal') closePromoRulesModal();
      }
    }
  });
}

function setupModalCloseOnOutsideClick() {
  const modals = [
    document.getElementById('sidebar'),
    document.getElementById('cartModal'),
    document.getElementById('welcomeModal'),
    document.getElementById('editModal'),
    document.getElementById('categoryModal'),
    document.getElementById('dashboardModal'),
    document.getElementById('checkoutModal'),
    document.getElementById('preOrderModal'),
    document.getElementById('checkoutConfirmationModal'),
    document.getElementById('paymentMethodModal'),
    document.getElementById('artistModal')
  ].filter(Boolean);

  document.addEventListener('click', function(event) {
    modals.forEach(element => {
      let isOpen = false;
      if (element.classList.contains('sidebar')) {
        isOpen = element.classList.contains('open');
      } else {
        isOpen = element.style.display === 'flex';
      }

      const isClickInsideModal = element.contains(event.target);
      const isClickOnOpenerButton =
        event.target.closest('.menu-button') ||
        event.target.closest('#cartButton') ||
        event.target.closest('.manage-category') ||
        event.target.closest('[onclick*="showDashboard"]') ||
        event.target.closest('[onclick*="showHelp"]') ||
        event.target.closest('[onclick*="showPreOrder"]') ||
        event.target.closest('.btn-checkout-cart') ||
        event.target.closest('.btn-manage-payment') ||
        event.target.closest('[onclick*="openArtistModal"]');

      if (isOpen && !isClickInsideModal && !isClickOnOpenerButton) {
        if (element.id === 'sidebar') {
          closeSidebar();
        } else if (element.id === 'cartModal') {
          closeCartModal();
        } else if (element.id === 'welcomeModal') {
          closeWelcomeModal();
        } else if (element.id === 'editModal') {
          closeEditModal();
        } else if (element.id === 'categoryModal') {
          closeCategoryModal();
        } else if (element.id === 'dashboardModal') {
          closeDashboard();
        } else if (element.id === 'checkoutModal') {
          closeCheckoutModal();
        } else if (element.id === 'preOrderModal') {
          closePreOrderModal();
        } else if (element.id === 'checkoutConfirmationModal') {
          closeCheckoutConfirmationModal();
        } else if (element.id === 'paymentMethodModal') {
          closePaymentMethodModal();
        } else if (element.id === 'artistModal') {
          closeArtistModal();
        }
      }
    });
  });
}

function toggleFullscreen() {
  const fullscreenButton = document.getElementById('fullscreenButton');

  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
      fullscreenButton.classList.add('fullscreen-active');
    }).catch(err => {
      console.error('Gagal masuk mode fullscreen:', err);
      showNotification('Gagal masuk mode fullscreen');
    });
  } else {
    document.exitFullscreen().then(() => {
      fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
      fullscreenButton.classList.remove('fullscreen-active');
    });
  }
}
