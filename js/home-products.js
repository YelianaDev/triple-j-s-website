import { supabase } from "./supabase-client.js";

function formatPrice(value) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function createHomeProductCard(product) {
  const categoryName = product.subcategories?.categories?.name || "Producto";
  const image =
    product.image_url_1 || product.image_url_2 || product.image_url_3;

  return `
    <article class="overflow-hidden rounded-3xl bg-white shadow-soft">
      <div class="flex h-52 items-center justify-center bg-gray-100 overflow-hidden">
        ${
          image
            ? `<img src="${image}" alt="${product.name}" class="h-full w-full object-cover" loading="lazy" />`
            : `<span class="text-sm text-gray-400">Sin imagen</span>`
        }
      </div>
      <div class="p-6">
        <p class="text-sm text-gray-500">${categoryName}</p>
        <h3 class="mt-1 text-lg font-bold text-primary">${product.name}</h3>
        <p class="mt-2 text-sm leading-7 text-gray-600">
          ${product.short_description || product.description || "Sin descripción disponible."}
        </p>
        <div class="mt-5 flex items-center justify-between">
          <span class="text-lg font-bold text-accent">${formatPrice(product.price)}</span>
          <a
            href="product-detail.html?id=${product.id}"
            class="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Ver producto
          </a>
        </div>
      </div>
    </article>
  `;
}

async function loadHomeProducts() {
  const grid = document.getElementById("home-products-grid");
  if (!grid) return;

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      short_description,
      description,
      price,
      image_url_1,
      image_url_2,
      image_url_3,
      subcategories:subcategory_id (
        id,
        name,
        categories:category_id (
          id,
          name
        )
      )
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return;

  // Un producto por categoría, máximo 4
  const seen = new Set();
  const featured = [];

  for (const product of data) {
    const categoryId = product.subcategories?.categories?.id;
    if (categoryId && !seen.has(categoryId)) {
      seen.add(categoryId);
      featured.push(product);
    }
    if (featured.length === 4) break;
  }

  grid.innerHTML = featured.map(createHomeProductCard).join("");
}

loadHomeProducts();
