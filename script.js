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

  // --- LÓGICA DE BÚSQUEDA LOCAL EN TIEMPO REAL ---
  const searchInput = document.querySelector(".search-bar input");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();

      // Recorremos cada sección del catálogo
      document.querySelectorAll(".catalog").forEach((section) => {
        let hasVisibleCards = false;

        // Recorremos las tarjetas dentro de esta sección
        section.querySelectorAll(".card").forEach((card) => {
          const title = card.querySelector("h3") ? card.querySelector("h3").innerText.toLowerCase() : "";
          const price = card.querySelector(".price") ? card.querySelector(".price").innerText.toLowerCase() : "";
          const desc = card.getAttribute("data-desc") ? card.getAttribute("data-desc").toLowerCase() : "";

          // Verificamos si la búsqueda coincide con el título, precio o descripción
          const matches = title.includes(query) || price.includes(query) || desc.includes(query);

          if (matches) {
            card.style.display = ""; // Muestra la tarjeta
            hasVisibleCards = true;
          } else {
            card.style.display = "none"; // Oculta la tarjeta
          }
        });

        // Oculta la sección completa si ninguna tarjeta coincide con el filtro
        section.style.display = hasVisibleCards ? "" : "none";
      });
    });
  }
});