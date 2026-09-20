const API_URL = 'https://urban-clothes-slc0.onrender.com/api/usuarios';

/**
 * Alterna la visibilidad entre los formularios de Login y Registro
 * @param {string} formId - ID del formulario a mostrar ('login' o 'register')
 */
function showForm(formId) {
  const forms = document.querySelectorAll('.form');
  const tabs = document.querySelectorAll('.tab');

  // Ocultar todos los formularios y desactivar pestañas
  forms.forEach(form => form.classList.remove('active'));
  tabs.forEach(tab => tab.classList.remove('active'));

  // Activar el formulario seleccionado
  const selectedForm = document.getElementById(formId);
  if (selectedForm) {
    selectedForm.classList.add('active');
  }

  // Activar la pestaña correspondiente
  tabs.forEach(tab => {
    if (tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(formId)) {
      tab.classList.add('active');
    }
  });

  ocultarMensaje();
}

/**
 * Muestra un mensaje en pantalla según la respuesta del backend
 */
function mostrarMensaje(texto, esError = false) {
  const msgDiv = document.getElementById('mensajeApi');
  if (!msgDiv) return;

  msgDiv.style.display = 'block';
  msgDiv.className = `mt-3 text-center fw-bold ${esError ? 'text-danger' : 'text-success'}`;
  msgDiv.textContent = texto;
}

/**
 * Oculta el mensaje dinámico
 */
function ocultarMensaje() {
  const msgDiv = document.getElementById('mensajeApi');
  if (msgDiv) {
    msgDiv.style.display = 'none';
  }
}

/**
 * Procesa el registro de un nuevo usuario enviando datos a la API
 * @param {Event} event - Evento del formulario
 */
async function manejarRegistro(event) {
  event.preventDefault();
  ocultarMensaje();

  const datos = {
    nombre: document.getElementById('regNombre').value,
    email: document.getElementById('regEmail').value,
    contrasena: document.getElementById('regContrasena').value,
    telefono: document.getElementById('regTelefono').value || null,
    direccion: document.getElementById('regDireccion').value || null
  };

  try {
    const respuesta = await fetch(`${API_URL}/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (respuesta.ok) {
      mostrarMensaje(resultado.mensaje, false);
      
      const registerForm = document.getElementById('register');
      if (registerForm) registerForm.reset();

      // Transición al login tras registro exitoso
      setTimeout(() => showForm('login'), 1500);
    } else {
      mostrarMensaje(resultado.error || 'Error en el registro', true);
    }
  } catch (error) {
    console.error('Error al intentar registrar usuario:', error);
    mostrarMensaje('Error de conexión con el servidor.', true);
  }
}

/**
 * Procesa el inicio de sesión del usuario contra la API
 * @param {Event} event - Evento del formulario
 */
async function manejarLogin(event) {
  event.preventDefault();
  ocultarMensaje();

  const datos = {
    email: document.getElementById('loginEmail').value,
    contrasena: document.getElementById('loginContrasena').value
  };

  try {
    const respuesta = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (respuesta.ok) {
      // Guardar token e información del usuario en el navegador
      localStorage.setItem('urban_token', resultado.token);
      localStorage.setItem('urban_user', JSON.stringify(resultado.usuario));

      mostrarMensaje(resultado.mensaje, false);

      // Redirigir al catálogo principal tras 1 segundo
      setTimeout(() => {
        window.location.href = 'main.html';
      }, 1000);
    } else {
      mostrarMensaje(resultado.error || 'Credenciales incorrectas', true);
    }
  } catch (error) {
    console.error('Error al intentar iniciar sesión:', error);
    mostrarMensaje('Error de conexión con el servidor.', true);
  }
}