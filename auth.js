// auth.js - Manejo global de la sesión de usuario

document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
});

function verificarSesion() {
  const token = localStorage.getItem('urban_token');
  const usuarioRaw = localStorage.getItem('urban_user');

  const contenedorUser = document.getElementById('userMenuNav');

  // SI HAY SESIÓN ACTIVA
  if (token && usuarioRaw) {
    try {
      const usuario = JSON.parse(usuarioRaw);
      
      if (contenedorUser) {
        contenedorUser.innerHTML = `
          <span class="text-white small me-2">Hola, <strong>${usuario.nombre || usuario.email}</strong></span>
          <a href="perfil.html" class="btn btn-outline-info btn-sm me-2">Perfil</a>
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

  // SI ES UN INVITADO (NO LOGUEADO)
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