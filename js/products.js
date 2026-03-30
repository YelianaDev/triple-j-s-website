import { supabase } from "./supabase-client.js";
import { WHATSAPP_NUMBER } from "./config.js";
import {
  addToCart,
  clearCart,
  renderCartElements,
  sendCartToWhatsApp,
} from "./cart.js";

const productsGrid = document.getElementById("products-grid");
const loadingState = document.getElementById("loading-state");
const errorState = document.getElementById("error-state");
const emptyState = document.getElementById("empty-state");
const resultsCount = document.getElementById("results-count");

const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const subcategoryFilter = document.getElementById("subcategory-filter");
const brandFilter = document.getElementById("brand-filter");
const clearFiltersBtn = document.getElementById("clear-filters");

const cartToggle = document.getElementById("cart-toggle");
const cartClose = document.getElementById("cart-close");
const cartPanel = document.getElementById("cart-panel");
const cartOverlay = document.getElementById("cart-overlay");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const clearCartBtn = document.getElementById("clear-cart");
const sendWhatsappBtn = document.getElementById("send-whatsapp");
const customerNameInput = document.getElementById("customer-name");
const customerPhoneInput = document.getElementById("customer-phone");

let allProducts = [];
let allCategories = [];
let allSubcategories = [];
let allBrands = [];
let allSubcategoryBrands = [];

const cartElements = {
  cartItemsContainer,
  cartTotal,
  cartCount,
  customerNameInput,
  customerPhoneInput,
};

function formatPrice(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function openCart() {
  cartPanel.classList.remove("translate-x-full");
  cartOverlay.classList.remove("pointer-events-none", "opacity-0");
  cartOverlay.classList.add("opacity-100");
}

function closeCart() {
  cartPanel.classList.add("translate-x-full");
  cartOverlay.classList.add("pointer-events-none", "opacity-0");
  cartOverlay.classList.remove("opacity-100");
}

function populateSelect(selectElement, items, firstLabel = "Todas") {
  const currentValue = selectElement.value;
  selectElement.innerHTML = `<option value="all">${firstLabel}</option>`;

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    selectElement.appendChild(option);
  });

  if ([...selectElement.options].some((opt) => opt.value === currentValue)) {
    selectElement.value = currentValue;
  } else {
    selectElement.value = "all";
  }
}

function getPrimaryImage(product) {
  return (
    product.image_url_1 || product.image_url_2 || product.image_url_3 || ""
  );
}

function getCategoryName(product) {
  return product.subcategories?.categories?.name || "";
}

function getCategoryId(product) {
  return product.subcategories?.categories?.id || "";
}

function getSubcategoryName(product) {
  return product.subcategories?.name || "";
}

function getBrandName(product) {
  return product.brands?.name || "";
}

function createProductCard(product) {
  const stockLabel =
    Number(product.stock || 0) > 0
      ? `En inventario: ${product.stock}`
      : "Consultar disponibilidad";

  const categoryName = getCategoryName(product);
  const subcategoryName = getSubcategoryName(product);
  const brandName = getBrandName(product);

  return `
    <article class="overflow-hidden rounded-3xl bg-white shadow-soft transition hover:-translate-y-1">
      <a href="product-detail.html?id=${product.id}" class="block">
        <div class="flex h-60 items-center justify-center bg-gray-100">
          ${
            getPrimaryImage(product)
              ? `<img src="${getPrimaryImage(product)}" alt="${product.name}" loading="lazy" class="h-full w-full object-cover" />`
              : `<span class="text-sm text-gray-400">Sin imagen</span>`
          }
        </div>
      </a>

      <div class="p-6">
        <div class="mb-3 flex flex-wrap gap-2">
          ${
            categoryName
              ? `<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">${categoryName}</span>`
              : ""
          }
          ${
            subcategoryName
              ? `<span class="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-primary">${subcategoryName}</span>`
              : ""
          }
          ${
            brandName
              ? `<span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">${brandName}</span>`
              : ""
          }
        </div>

        <a href="product-detail.html?id=${product.id}">
          <h3 class="text-lg font-bold text-primary transition hover:text-accent">
            ${product.name}
          </h3>
        </a>

        ${product.model ? `<p class="mt-1 text-sm text-gray-500">Modelo: ${product.model}</p>` : ""}
        ${product.sku ? `<p class="mt-1 text-sm text-gray-500">SKU: ${product.sku}</p>` : ""}

        <p class="mt-3 text-sm leading-7 text-gray-600">
          ${product.short_description || product.description || "Sin descripción disponible."}
        </p>

        <div class="mt-4 flex items-center justify-between gap-4">
          <span class="text-lg font-bold text-accent">${formatPrice(product.price)}</span>
          <span class="text-xs font-medium text-gray-500">${stockLabel}</span>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <a
            href="product-detail.html?id=${product.id}"
            class="rounded-full border border-primary px-4 py-3 text-center text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            Ver detalles
          </a>

          <button
            class="add-to-cart-btn rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            data-id="${product.id}"
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  `;
}

function attachAddToCartEvents() {
  document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.dataset.id;
      const product = allProducts.find(
        (item) => String(item.id) === String(productId),
      );

      if (!product) return;

      addToCart({
        id: product.id,
        name: product.name,
        category: getCategoryName(product) || "General",
        price: product.price,
      });

      renderCartElements(cartElements, WHATSAPP_NUMBER);
      openCart();
    });
  });
}

function renderProducts(products) {
  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");

  if (!products.length) {
    productsGrid.classList.add("hidden");
    emptyState.classList.remove("hidden");
    resultsCount.textContent = "0 productos encontrados";
    return;
  }

  emptyState.classList.add("hidden");
  productsGrid.classList.remove("hidden");
  resultsCount.textContent = `${products.length} producto(s) encontrados`;
  productsGrid.innerHTML = products.map(createProductCard).join("");
  attachAddToCartEvents();
}

function updateSubcategoriesByCategory() {
  const selectedCategoryId = categoryFilter.value;

  let filteredSubcategories = allSubcategories;

  if (selectedCategoryId !== "all") {
    filteredSubcategories = allSubcategories.filter(
      (subcategory) =>
        String(subcategory.category_id) === String(selectedCategoryId),
    );
  }

  populateSelect(subcategoryFilter, filteredSubcategories, "Todas");
  subcategoryFilter.value = "all";
}

function updateBrandsBySubcategory() {
  const selectedCategoryId = categoryFilter.value;
  const selectedSubcategoryId = subcategoryFilter.value;

  let allowedSubcategories = allSubcategories;

  if (selectedCategoryId !== "all") {
    allowedSubcategories = allowedSubcategories.filter(
      (subcategory) =>
        String(subcategory.category_id) === String(selectedCategoryId),
    );
  }

  if (selectedSubcategoryId !== "all") {
    allowedSubcategories = allowedSubcategories.filter(
      (subcategory) => String(subcategory.id) === String(selectedSubcategoryId),
    );
  }

  const allowedSubcategoryIds = allowedSubcategories.map((subcategory) =>
    String(subcategory.id),
  );

  const relatedBrandIds = allSubcategoryBrands
    .filter((item) =>
      allowedSubcategoryIds.includes(String(item.subcategory_id)),
    )
    .map((item) => String(item.brand_id));

  const uniqueBrandIds = [...new Set(relatedBrandIds)];

  const filteredBrands =
    selectedCategoryId === "all" && selectedSubcategoryId === "all"
      ? allBrands
      : allBrands.filter((brand) => uniqueBrandIds.includes(String(brand.id)));

  populateSelect(brandFilter, filteredBrands, "Todas");
  brandFilter.value = "all";
}

function applyFilters() {
  const search = searchInput.value.trim().toLowerCase();
  const selectedCategoryId = categoryFilter.value;
  const selectedSubcategoryId = subcategoryFilter.value;
  const selectedBrandId = brandFilter.value;

  const filteredProducts = allProducts.filter((product) => {
    const categoryName = getCategoryName(product);
    const categoryId = getCategoryId(product);
    const subcategoryName = getSubcategoryName(product);
    const brandName = getBrandName(product);

    const matchesSearch =
      (product.name || "").toLowerCase().includes(search) ||
      (product.model || "").toLowerCase().includes(search) ||
      (product.sku || "").toLowerCase().includes(search) ||
      (product.description || "").toLowerCase().includes(search) ||
      (product.short_description || "").toLowerCase().includes(search) ||
      categoryName.toLowerCase().includes(search) ||
      subcategoryName.toLowerCase().includes(search) ||
      brandName.toLowerCase().includes(search);

    const matchesCategory =
      selectedCategoryId === "all" ||
      String(categoryId) === String(selectedCategoryId);

    const matchesSubcategory =
      selectedSubcategoryId === "all" ||
      String(product.subcategory_id) === String(selectedSubcategoryId);

    const matchesBrand =
      selectedBrandId === "all" ||
      String(product.brand_id) === String(selectedBrandId);

    return (
      matchesSearch && matchesCategory && matchesSubcategory && matchesBrand
    );
  });

  renderProducts(filteredProducts);
}

async function loadInitialData() {
  loadingState.classList.remove("hidden");
  errorState.classList.add("hidden");
  emptyState.classList.add("hidden");
  productsGrid.classList.add("hidden");

  const [
    categoriesResponse,
    subcategoriesResponse,
    brandsResponse,
    subcategoryBrandsResponse,
    productsResponse,
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),

    supabase
      .from("subcategories")
      .select("id, name, category_id")
      .eq("is_active", true)
      .order("name", { ascending: true }),

    supabase
      .from("brands")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),

    supabase.from("subcategory_brands").select("id, subcategory_id, brand_id"),

    supabase
      .from("products")
      .select(
        `
        id,
        subcategory_id,
        brand_id,
        name,
        model,
        sku,
        short_description,
        description,
        specifications,
        price,
        stock,
        image_url_1,
        image_url_2,
        image_url_3,
        is_active,
        created_at,
        subcategories:subcategory_id (
          id,
          name,
          category_id,
          categories:category_id (
            id,
            name
          )
        ),
        brands:brand_id (
          id,
          name
        )
      `,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  if (
    categoriesResponse.error ||
    subcategoriesResponse.error ||
    brandsResponse.error ||
    subcategoryBrandsResponse.error ||
    productsResponse.error
  ) {
    console.error("Error loading initial data:", {
      categories: categoriesResponse.error,
      subcategories: subcategoriesResponse.error,
      brands: brandsResponse.error,
      subcategoryBrands: subcategoryBrandsResponse.error,
      products: productsResponse.error,
    });

    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
    resultsCount.textContent = "Error al cargar productos";
    return false;
  }

  allCategories = categoriesResponse.data || [];
  allSubcategories = subcategoriesResponse.data || [];
  allBrands = brandsResponse.data || [];
  allSubcategoryBrands = subcategoryBrandsResponse.data || [];
  allProducts = productsResponse.data || [];

  populateSelect(categoryFilter, allCategories, "Todas");
  updateSubcategoriesByCategory();
  updateBrandsBySubcategory();
  renderProducts(allProducts);

  return true;
}

function setupEvents() {
  searchInput.addEventListener("input", applyFilters);

  categoryFilter.addEventListener("change", () => {
    updateSubcategoriesByCategory();
    updateBrandsBySubcategory();
    applyFilters();
  });

  subcategoryFilter.addEventListener("change", () => {
    updateBrandsBySubcategory();
    applyFilters();
  });

  brandFilter.addEventListener("change", applyFilters);

  clearFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    categoryFilter.value = "all";
    updateSubcategoriesByCategory();
    updateBrandsBySubcategory();
    applyFilters();
  });

  cartToggle.addEventListener("click", openCart);
  cartClose.addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);

  clearCartBtn.addEventListener("click", () => {
    clearCart();
    renderCartElements(cartElements, WHATSAPP_NUMBER);
  });

  sendWhatsappBtn.addEventListener("click", () => {
    sendCartToWhatsApp(
      WHATSAPP_NUMBER,
      customerNameInput.value.trim(),
      customerPhoneInput.value.trim(),
    );
  });
}

async function init() {
  renderCartElements(cartElements, WHATSAPP_NUMBER);
  setupEvents();
  await loadInitialData();
}

init();
