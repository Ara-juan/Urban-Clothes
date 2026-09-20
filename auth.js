// auth.js - Manejo de sesión (Con soporte para invitados)

document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
});

function verificarSesion() {
  const token = localStorage.getItem('urban_token');
  const usuarioRaw = localStorage.getItem('urban_user');

  const contenedorUser = document.getElementById('userMenuNav');

  // SI HAY SESIÓN ACTIVA (Usuario registrado)
  if (token && usuarioRaw) {
    try {
      const usuario = JSON.parse(usuarioRaw);
      
      if (contenedorUser) {
        contenedorUser.innerHTML = `
          <span class="text-white small me-2">Hola, <strong>${usuario.nombre || usuario.email}</strong></span>
          <button type="button" class="btn btn-outline-light btn-sm" onclick="cerrarSesion()">Salir</button>
        `;
      }
      return;
    } catch (error) {
      console.error('Error al leer datos de sesión:', error);
      cerrarSesion();
      return;
    }
  }

  // SI NO HAY SESIÓN (Invitado)
  if (contenedorUser) {
    contenedorUser.innerHTML = `
      <a href="login.html" class="btn btn-primary btn-sm">Iniciar Sesión / Registrarse</a>
    `;
  }
}

function cerrarSesion() {
  localStorage.removeItem('urban_token');
  localStorage.removeItem('urban_user');
  window.location.href = 'login.html';
}