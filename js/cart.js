const CART_KEY = "triple_js_cart";

let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

function formatPrice(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function getCart() {
  return cart;
}

export function getCartTotal() {
  return cart.reduce((acc, item) => {
    return acc + Number(item.price) * item.quantity;
  }, 0);
}

export function getCartCount() {
  return cart.reduce((acc, item) => acc + item.quantity, 0);
}

export function addToCart(product) {
  const existing = cart.find((item) => String(item.id) === String(product.id));

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      quantity: 1,
    });
  }

  saveCart();
}

export function removeFromCart(productId) {
  cart = cart.filter((item) => String(item.id) !== String(productId));
  saveCart();
}

export function changeQuantity(productId, change) {
  const product = cart.find((item) => String(item.id) === String(productId));

  if (!product) return;

  product.quantity += change;

  if (product.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
}

export function clearCart() {
  cart = [];
  saveCart();
}

export function buildWhatsAppMessage(customerName, customerPhone) {
  const total = getCartTotal();

  const lines = cart.map(
    (item) =>
      `- Producto: ${item.name} | Cantidad: ${item.quantity} | Precio: ${formatPrice(item.price)}`,
  );

  return [
    "Hola, me interesa este pedido de Triple J & S:",
    "",
    ...lines,
    "",
    `Total estimado: ${formatPrice(total)}`,
    `Nombre: ${customerName || "No especificado"}`,
    `Teléfono: ${customerPhone || "No especificado"}`,
  ].join("\n");
}

export function renderCartElements(elements, whatsappNumber) {
  const {
    cartItemsContainer,
    cartTotal,
    cartCount,
    customerNameInput,
    customerPhoneInput,
  } = elements;

  if (cartCount) {
    cartCount.textContent = getCartCount();
  }

  if (!cartItemsContainer || !cartTotal) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML =
      '<p class=\"text-sm text-gray-500\">Tu carrito está vacío.</p>';
    cartTotal.textContent = "RD$ 0";
    return;
  }

  cartItemsContainer.innerHTML = cart
    .map(
      (item) => `
    <article class=\"rounded-2xl border border-gray-200 p-4\">
      <div class=\"flex items-start justify-between gap-4\">
        <div>
          <h3 class=\"font-bold text-primary\">${item.name}</h3>
          <p class=\"mt-1 text-sm text-gray-500\">${item.category}</p>
          <p class=\"mt-2 text-sm font-semibold text-accent\">${formatPrice(item.price)}</p>
        </div>
        <button
          class=\"text-sm font-semibold text-red-500 remove-item-btn\"
          data-id=\"${item.id}\">
          Eliminar
        </button>
      </div>

      <div class=\"mt-4 flex items-center gap-3\">
        <button
          class=\"rounded-full bg-soft px-3 py-1 font-bold text-primary quantity-btn\"
          data-id=\"${item.id}\"
          data-change=\"-1\">
          -
        </button>

        <span class=\"min-w-8 text-center font-semibold text-primary\">${item.quantity}</span>

        <button
          class=\"rounded-full bg-soft px-3 py-1 font-bold text-primary quantity-btn\"
          data-id=\"${item.id}\"
          data-change=\"1\">
          +
        </button>
      </div>
    </article>
  `,
    )
    .join("");

  cartTotal.textContent = formatPrice(getCartTotal());

  cartItemsContainer.querySelectorAll(".remove-item-btn").forEach((button) => {
    button.addEventListener("click", () => {
      removeFromCart(button.dataset.id);
      renderCartElements(elements, whatsappNumber);
    });
  });

  cartItemsContainer.querySelectorAll(".quantity-btn").forEach((button) => {
    button.addEventListener("click", () => {
      changeQuantity(button.dataset.id, Number(button.dataset.change));
      renderCartElements(elements, whatsappNumber);
    });
  });
}

export function sendCartToWhatsApp(
  whatsappNumber,
  customerName,
  customerPhone,
) {
  if (cart.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const message = buildWhatsAppMessage(customerName, customerPhone);
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
