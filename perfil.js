const API_URL = 'https://urban-clothes-slc0.onrender.com/api/usuarios';

document.addEventListener('DOMContentLoaded', () => {
  cargarDatosPerfil();
});

/**
 * Obtiene los datos del usuario desde el backend y llena el formulario
 */
async function cargarDatosPerfil() {
  const token = localStorage.getItem('urban_token');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/perfil`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (respuesta.ok) {
      const usuario = await respuesta.json();
      document.getElementById('perfilNombre').value = usuario.nombre || '';
      document.getElementById('perfilEmail').value = usuario.email || '';
      document.getElementById('perfilTelefono').value = usuario.telefono || '';
      document.getElementById('perfilDireccion').value = usuario.direccion || '';
    } else {
      mostrarMensajePerfil('No se pudieron cargar los datos del perfil.', true);
    }
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    mostrarMensajePerfil('Error de conexión al cargar la información.', true);
  }
}

/**
 * Envia la actualización de datos opcionales y/o contraseña
 */
async function actualizarPerfil(event) {
  event.preventDefault();
  ocultarMensajePerfil();

  const token = localStorage.getItem('urban_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const contrasenaActual = document.getElementById('contrasenaActual').value;
  const nuevaContrasena = document.getElementById('nuevaContrasena').value;
  const telefono = document.getElementById('perfilTelefono').value;
  const direccion = document.getElementById('perfilDireccion').value;

  // Validación de contraseña
  if (nuevaContrasena && !contrasenaActual) {
    mostrarMensajePerfil('Debes ingresar tu contraseña actual para cambiarla.', true);
    return;
  }

  const datos = {
    contrasenaActual: contrasenaActual || null,
    nuevaContrasena: nuevaContrasena || null,
    telefono: telefono || null,
    direccion: direccion || null
  };

  try {
    const respuesta = await fetch(`${API_URL}/perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (respuesta.ok) {
      mostrarMensajePerfil(resultado.mensaje, false);
      
      // Limpiar campos de contraseña
      document.getElementById('contrasenaActual').value = '';
      document.getElementById('nuevaContrasena').value = '';

      // Actualizar localStorage si hubo cambios
      if (resultado.usuario) {
        const usuarioLocal = JSON.parse(localStorage.getItem('urban_user') || '{}');
        usuarioLocal.telefono = resultado.usuario.telefono;
        usuarioLocal.direccion = resultado.usuario.direccion;
        localStorage.setItem('urban_user', JSON.stringify(usuarioLocal));
      }
    } else {
      mostrarMensajePerfil(resultado.error || 'Error al actualizar el perfil', true);
    }
  } catch (error) {
    console.error('Error al actualizar datos:', error);
    mostrarMensajePerfil('Error de conexión con el servidor.', true);
  }
}

function mostrarMensajePerfil(texto, esError = false) {
  const msgDiv = document.getElementById('mensajePerfil');
  if (!msgDiv) return;

  msgDiv.style.display = 'block';
  msgDiv.className = `mt-3 text-center fw-bold ${esError ? 'text-danger' : 'text-success'}`;
  msgDiv.textContent = texto;
}

function ocultarMensajePerfil() {
  const msgDiv = document.getElementById('mensajePerfil');
  if (msgDiv) {
    msgDiv.style.display = 'none';
  }
}