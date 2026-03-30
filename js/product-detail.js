import { supabase } from "./supabase-client.js";
import { WHATSAPP_NUMBER } from "./config.js";
import {
  addToCart,
  clearCart,
  renderCartElements,
  sendCartToWhatsApp,
} from "./cart.js";

const loadingState = document.getElementById("loading-state");
const errorState = document.getElementById("error-state");
const productDetail = document.getElementById("product-detail");

const breadcrumbName = document.getElementById("breadcrumb-name");
const mainImage = document.getElementById("main-image");
const thumbnailGallery = document.getElementById("thumbnail-gallery");

const detailCategory = document.getElementById("detail-category");
const detailSubcategory = document.getElementById("detail-subcategory");
const detailBrand = document.getElementById("detail-brand");
const detailName = document.getElementById("detail-name");
const detailModel = document.getElementById("detail-model");
const detailSku = document.getElementById("detail-sku");
const detailPrice = document.getElementById("detail-price");
const detailStock = document.getElementById("detail-stock");
const detailDescription = document.getElementById("detail-description");
const detailSpecifications = document.getElementById("detail-specifications");
const detailWhatsappLink = document.getElementById("detail-whatsapp-link");
const addToCartBtn = document.getElementById("add-to-cart-btn");

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

const cartElements = {
  cartItemsContainer,
  cartTotal,
  cartCount,
  customerNameInput,
  customerPhoneInput,
};

let currentProduct = null;

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

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function getImages(product) {
  return [product.image_url_1, product.image_url_2, product.image_url_3].filter(
    Boolean,
  );
}

function getCategoryName(product) {
  return product.subcategories?.categories?.name || "";
}

function getSubcategoryName(product) {
  return product.subcategories?.name || "";
}

function getBrandName(product) {
  return product.brands?.name || "";
}

function renderGallery(product) {
  const images = getImages(product);

  if (!images.length) {
    mainImage.src = "";
    mainImage.alt = "Sin imagen";
    mainImage.classList.add("hidden");
    thumbnailGallery.innerHTML = "";
    return;
  }

  mainImage.classList.remove("hidden");
  mainImage.src = images[0];
  mainImage.alt = product.name;

  thumbnailGallery.innerHTML = images
    .map(
      (image, index) => `
        <button
          class="thumbnail-btn overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 transition hover:border-primary"
          data-image="${image}"
          aria-label="Imagen ${index + 1}"
        >
          <img
            src="${image}"
            alt="${product.name}"
            class="h-24 w-full object-cover"
            loading="lazy"
          />
        </button>
      `,
    )
    .join("");

  thumbnailGallery.querySelectorAll(".thumbnail-btn").forEach((button) => {
    button.addEventListener("click", () => {
      mainImage.src = button.dataset.image;
      mainImage.alt = product.name;
    });
  });
}

function renderSpecifications(specifications) {
  if (!specifications) {
    detailSpecifications.innerHTML = `
      <p class="text-gray-500">No hay especificaciones registradas para este producto.</p>
    `;
    return;
  }

  const lines = specifications
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    detailSpecifications.innerHTML = `
      <p class="text-gray-500">No hay especificaciones registradas para este producto.</p>
    `;
    return;
  }

  detailSpecifications.innerHTML = lines
    .map(
      (line) => `
        <div class="rounded-2xl bg-soft px-4 py-3">
          <p class="text-sm leading-7">${line}</p>
        </div>
      `,
    )
    .join("");
}

function renderProduct(product) {
  breadcrumbName.textContent = product.name;

  detailCategory.textContent = getCategoryName(product);
  detailSubcategory.textContent = getSubcategoryName(product);
  detailBrand.textContent = getBrandName(product);

  detailName.textContent = product.name || "";
  detailModel.textContent = product.model ? `Modelo: ${product.model}` : "";
  detailSku.textContent = product.sku ? `Número de parte: ${product.sku}` : "";
  detailPrice.textContent = formatPrice(product.price);

  detailStock.textContent =
    Number(product.stock || 0) > 0
      ? `En inventario: ${product.stock}`
      : "Consultar disponibilidad";

  detailDescription.textContent =
    product.description ||
    product.short_description ||
    "Sin descripción disponible.";

  renderSpecifications(product.specifications);
  renderGallery(product);

  detailWhatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, quiero información sobre este producto: ${product.name}`,
  )}`;

  addToCartBtn.addEventListener("click", () => {
    addToCart({
      id: product.id,
      name: product.name,
      category: getCategoryName(product) || "General",
      price: product.price,
    });

    renderCartElements(cartElements, WHATSAPP_NUMBER);
    openCart();
  });

  productDetail.classList.remove("hidden");
  loadingState.classList.add("hidden");
}

async function loadProductDetail() {
  const productId = getProductIdFromUrl();

  if (!productId) {
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
    return;
  }

  const { data, error } = await supabase
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
    .eq("id", productId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    console.error("Error loading detail:", error);
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
    return;
  }

  currentProduct = data;
  renderProduct(currentProduct);
}

function setupCartEvents() {
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

function init() {
  renderCartElements(cartElements, WHATSAPP_NUMBER);
  setupCartEvents();
  loadProductDetail();
}

init();
