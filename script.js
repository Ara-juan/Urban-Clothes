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
  // --- LÓGICA DE MODAL DE PRODUCTO ---
  const cards = document.querySelectorAll(".card");
  const modal = document.getElementById("product-modal");
  const closeModal = document.querySelector(".close-modal");

  const modalImg = document.getElementById("modal-img");
  const modalTitle = document.getElementById("modal-title");
  const modalPrice = document.getElementById("modal-price");
  const modalDesc = document.getElementById("modal-desc");

  // Abrir modal solo si el modal y sus elementos existen en el HTML
  if (modal && modalImg && modalTitle && modalPrice && modalDesc) {
    cards.forEach(card => {
      card.addEventListener("click", () => {
        const imgElement = card.querySelector("img");
        const titleElement = card.querySelector("h3");
        const priceElement = card.querySelector(".price");

        const imgUrl = imgElement ? imgElement.src : "";
        const title = titleElement ? titleElement.innerText : "Producto";
        const price = priceElement ? priceElement.innerText : "";
        const descPersonalizada = card.getAttribute("data-desc") || "Este producto no cuenta con una descripción detallada todavía.";

        // Asignación de datos al modal
        modalImg.src = imgUrl;
        modalTitle.innerText = title;
        modalPrice.innerText = price;
        modalDesc.innerText = descPersonalizada;

        // Mostrar el modal
        modal.classList.add("show");
      });
    });

    // Cerrar modal al presionar el botón de cierre (X)
    if (closeModal) {
      closeModal.addEventListener("click", () => {
        modal.classList.remove("show");
      });
    }

    // Cerrar modal al hacer clic en el fondo oscuro exterior
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("show");
      }
    });
  }

// --- LÓGICA DE BÚSQUEDA Y FILTRO POR PRECIO ---
  const searchInput = document.querySelector(".search-bar input");
  const priceFilter = document.getElementById("priceFilter");

  function filtrarProductos() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const maxPrice = priceFilter ? priceFilter.value : "all";

    document.querySelectorAll(".catalog").forEach((section) => {
      let hasVisibleCards = false;

      // Si hay un filtro activo (texto o precio), aplicamos el modo fluido
      if (query.length > 0 || maxPrice !== "all") {
        section.classList.add("is-searching");
      } else {
        section.classList.remove("is-searching");
      }

      section.querySelectorAll(".card").forEach((card) => {
        const title = card.querySelector("h3") ? card.querySelector("h3").innerText.toLowerCase() : "";
        const desc = card.getAttribute("data-desc") ? card.getAttribute("data-desc").toLowerCase() : "";
        
        // Extraemos solo los dígitos del precio (ejemplo: "$50.000" -> 50000)
        const priceText = card.querySelector(".price") ? card.querySelector(".price").innerText : "0";
        const priceValue = parseInt(priceText.replace(/[^0-9]/g, ""), 10) || 0;

        // Validaciones
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
});