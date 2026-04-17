// Global state and constants shared across all modules

const DB_NAME = 'penjualan_barang_db';
const DB_VERSION = 6;
const STORE_NAMES = {
  PRODUCTS: 'products',
  CART: 'cart',
  ARTISTS: 'artists',
  SALES: 'sales',
  CATEGORIES: 'categories',
  PREORDERS: 'preorders',
  PAYMENT_METHODS: 'paymentMethods',
  TRANSFER_METHODS: 'transferMethods',
  PROMO_RULES: 'promoRules'
};

let db;
let data = {};
let categories = [];
let cart = [];
let artists = [];
let sales = [];
let preOrders = [];
let isCartModalOpen = false;
let promoRules = [];
let paymentMethods = [];
let transferMethods = [];
let isDeleteMode = false;
let bulkActionMode = null; // 'delete' | 'edit' | null
let selectedProductsForDelete = new Set();
let activeTagFilters = {};
let editingPreOrderIndex = null;
let longPressTimer = null;
let currentLongPressProduct = null;
let selectedPaymentMethod = '';
let selectedTransferMethod = '';
let currentAmountInput = '';
let currentGrandTotalAfterDiscount = 0;
