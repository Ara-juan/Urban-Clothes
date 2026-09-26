const API_PRODUCTOS_URL = 'https://urban-clothes-slc0.onrender.com/api/productos';

/**
 * Desplaza horizontalmente los productos de un carrusel
 * @param {HTMLElement} button - El botón que disparó la función
 * @param {number} direction - Dirección del scroll (1 para derecha, -1 para izquierda)
 */
function scrollCarousel(button, direction) {
  const container = button.parentElement.querySelector('.products');

  if (container) {
    const containerWidth = container.offsetWidth;
    const scrollAmount = containerWidth * direction;

    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // --- CARGA DINÁMICA DE PRODUCTOS SEGÚN LA PÁGINA ---
  if (document.getElementById('contenedorProductosHombre')) {
    cargarProductosPorCategoria('hombre', 'contenedorProductosHombre');
  } else if (document.getElementById('contenedorProductosMujer')) {
    cargarProductosPorCategoria('mujer', 'contenedorProductosMujer');
  } else if (document.getElementById('contenedorProductosUnisex')) {
    cargarProductosPorCategoria('unisex', 'contenedorProductosUnisex');
  } else if (document.getElementById('contenedorProductosCatalogo')) {
    cargarProductosPorCategoria('', 'contenedorProductosCatalogo');
  } else {
    // Si la página contiene tarjetas estáticas (ej. Colecciones/main.html)
    activarEventosModal();
  }

  // --- LÓGICA DE BÚSQUEDA Y FILTRO POR PRECIO ---
  const searchInput = document.querySelector(".search-bar input");
  const priceFilter = document.getElementById("priceFilter");

  function filtrarProductos() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const maxPrice = priceFilter ? priceFilter.value : "all";

    document.querySelectorAll(".catalog").forEach((section) => {
      let hasVisibleCards = false;

      if (query.length > 0 || maxPrice !== "all") {
        section.classList.add("is-searching");
      } else {
        section.classList.remove("is-searching");
      }

      section.querySelectorAll(".card").forEach((card) => {
        const title = card.querySelector("h3") ? card.querySelector("h3").innerText.toLowerCase() : "";
        const desc = card.getAttribute("data-desc") ? card.getAttribute("data-desc").toLowerCase() : "";
        
        const priceText = card.querySelector(".price") ? card.querySelector(".price").innerText : "0";
        const priceValue = parseInt(priceText.replace(/[^0-9]/g, ""), 10) || 0;

        const matchesText = title.includes(query) || desc.includes(query);
        const matchesPrice = maxPrice === "all" || priceValue <= parseInt(maxPrice, 10);

        if (matchesText && matchesPrice) {
          card.style.display = "";
          hasVisibleCards = true;
        } else {
          card.style.display = "none";
        }
      });

      section.style.display = hasVisibleCards ? "" : "none";
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", filtrarProductos);
  }

  if (priceFilter) {
    priceFilter.addEventListener("change", filtrarProductos);
  }

  // Configuración de cierre de modal
  const modal = document.getElementById("product-modal");
  const closeModal = document.querySelector(".close-modal");

  if (closeModal && modal) {
    closeModal.addEventListener("click", () => {
      modal.classList.remove("show");
    });
  }

  if (modal) {
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("show");
      }
    });
  }
});

/**
 * Consulta la API y renderiza los productos dinámicos manteniendo la estructura visual
 */
async function cargarProductosPorCategoria(categoria, idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  try {
    const url = categoria 
      ? `${API_PRODUCTOS_URL}?categoria=${categoria}` 
      : API_PRODUCTOS_URL;

    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error('Error al consultar los productos');

    const productos = await respuesta.json();

    if (productos.length === 0) {
      contenedor.innerHTML = '<p class="text-center w-100 text-muted py-4">No hay prendas disponibles en esta categoría por el momento.</p>';
      return;
    }

    // Estructura idéntica de tarjetas HTML
    contenedor.innerHTML = productos.map(prod => {
      const precioFormateado = `$${parseInt(prod.precio, 10).toLocaleString('es-CO')}`;
      const descripcion = prod.descripcion || 'Sin descripción disponible.';

      return `
        <div class="card" data-desc="${descripcion.replace(/"/g, '&quot;')}">
          <img src="${prod.imagen_url}" alt="${prod.titulo}">
          <h3>${prod.titulo}</h3>
          <p class="price">${precioFormateado}</p>
          <p class="desc"></p>
        </div>
      `;
    }).join('');

    // Reactivar eventos del modal tras insertar elementos en el DOM
    activarEventosModal();

  } catch (error) {
    console.error('Error cargando el catálogo:', error);
    contenedor.innerHTML = '<p class="text-center w-100 text-warning py-4">Error al conectar con el servidor de productos.</p>';
  }
}

/**
 * Vincula el evento de clic a las tarjetas para desplegar la información en el modal
 */
function activarEventosModal() {
  const cards = document.querySelectorAll(".card");
  const modal = document.getElementById("product-modal");
  const modalImg = document.getElementById("modal-img");
  const modalTitle = document.getElementById("modal-title");
  const modalPrice = document.getElementById("modal-price");
  const modalDesc = document.getElementById("modal-desc");

  if (modal && modalImg && modalTitle && modalPrice && modalDesc) {
    cards.forEach(card => {
      card.onclick = () => {
        const imgElement = card.querySelector("img");
        const titleElement = card.querySelector("h3");
        const priceElement = card.querySelector(".price");

        modalImg.src = imgElement ? imgElement.src : "";
        modalTitle.innerText = titleElement ? titleElement.innerText : "Producto";
        modalPrice.innerText = priceElement ? priceElement.innerText : "";
        modalDesc.innerText = card.getAttribute("data-desc") || "Sin descripción.";

        modal.classList.add("show");
      };
    });
  }
}