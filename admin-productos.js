const API_BASE_URL = 'https://urban-clothes-slc0.onrender.com/api/productos';

// Configuración de Supabase para subida de archivos
const SUPABASE_URL = 'https://duuuqlbabwmidigdeybd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1dXVxbGJhYndtaWRpZ2RleWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzk2MTUsImV4cCI6MjA1NjzgMTYxNX0.gY-Qv_A-s8lE2-w5K_G2k0vB8K0vB8K0vB8K0vB8K0v'; // Tu clave pública anon
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  verificarPermisoAdmin();
  cargarListaProductos();

  // Escuchar cuando el cliente seleccione un archivo local
  const fileInput = document.getElementById('fileImagen');
  if (fileInput) {
    fileInput.addEventListener('change', manejarSeleccionImagen);
  }
});

function verificarPermisoAdmin() {
  const token = localStorage.getItem('urban_token');
  const usuarioRaw = localStorage.getItem('urban_user');

  if (!token || !usuarioRaw) {
    alert('Acceso restringido. Por favor inicia sesión.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const usuario = JSON.parse(usuarioRaw);
    const esAdmin = usuario.rol === 'ADMINISTRADOR' || usuario.rol === 'admin';
    if (!esAdmin) {
      alert('Acceso denegado. Esta sección es exclusiva para administradores.');
      window.location.href = 'main.html';
    }
  } catch (e) {
    window.location.href = 'login.html';
  }
}

/**
 * Muestra una vista previa local de la imagen seleccionada por el cliente
 */
function manejarSeleccionImagen(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const previewContainer = document.getElementById('previewContainer');
    const imgPreview = document.getElementById('imgPreview');
    imgPreview.src = event.target.result;
    previewContainer.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

/**
 * Suba el archivo adjunto al bucket 'productos' de Supabase Storage
 */
async function subirImagenASupabase(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const filePath = `prendas/${fileName}`;

  const { data, error } = await supabaseClient
    .storage
    .from('productos')
    .upload(filePath, file);

  if (error) {
    throw new Error('Error al subir la imagen: ' + error.message);
  }

  // Obtener la URL pública del archivo subido
  const { data: publicUrlData } = supabaseClient
    .storage
    .from('productos')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Obtiene todos los productos desde la base de datos
 */
async function cargarListaProductos() {
  const tbody = document.getElementById('tablaProductosBody');

  try {
    const respuesta = await fetch(API_BASE_URL);
    if (!respuesta.ok) throw new Error('Error al consultar productos');

    const productos = await respuesta.json();

    if (productos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay prendas registradas aún en la base de datos. ¡Sube la primera arriba!</td></tr>`;
      return;
    }

    tbody.innerHTML = productos.map(prod => `
      <tr>
        <td>
          <img src="${prod.imagen_url}" alt="${prod.titulo}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px;">
        </td>
        <td class="fw-bold">${prod.titulo}</td>
        <td class="text-capitalize">${prod.categoria}</td>
        <td>$${parseInt(prod.precio, 10).toLocaleString('es-CO')}</td>
        <td>
          <span class="badge ${prod.estado === 'activo' ? 'bg-success' : 'bg-danger'}">
            ${prod.estado.toUpperCase()}
          </span>
        </td>
        <td>
          <button type="button" class="btn btn-sm btn-outline-info me-1" onclick="prepararEdicion(${JSON.stringify(prod).replace(/"/g, '&quot;')})">Editar</button>
          <button type="button" class="btn btn-sm ${prod.estado === 'activo' ? 'btn-outline-warning' : 'btn-outline-success'} me-1" onclick="alternarEstado(${prod.id_producto}, '${prod.estado}')">
            ${prod.estado === 'activo' ? 'Desactivar' : 'Activar'}
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${prod.id_producto})">Borrar</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error al cargar la tabla:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-warning">
          El servidor está conectando...
          <button class="btn btn-sm btn-outline-light ms-2" onclick="cargarListaProductos()">Reintentar</button>
        </td>
      </tr>
    `;
  }
}

/**
 * Procesa el envío del formulario
 */
async function guardarProducto(event) {
  event.preventDefault();
  ocultarMensajeAdmin();

  const token = localStorage.getItem('urban_token');
  const prodId = document.getElementById('prodId').value;
  const fileInput = document.getElementById('fileImagen');
  let imagenUrl = document.getElementById('prodImagenUrl').value;

  const btnGuardar = document.getElementById('btnGuardar');
  btnGuardar.disabled = true;
  btnGuardar.textContent = 'Procesando...';

  try {
    // Si el usuario seleccionó una imagen nueva desde su equipo, la subimos a Supabase Storage primero
    if (fileInput && fileInput.files.length > 0) {
      mostrarMensajeAdmin('Subiendo imagen a la nube...', false);
      imagenUrl = await subirImagenASupabase(fileInput.files[0]);
    }

    if (!imagenUrl) {
      mostrarMensajeAdmin('Por favor selecciona una imagen para la prenda.', true);
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Publicar Prenda';
      return;
    }

    const tallasTexto = document.getElementById('prodTallas').value;
    const tallasArray = tallasTexto.split(',').map(t => t.trim()).filter(t => t.length > 0);

    const datos = {
      titulo: document.getElementById('prodTitulo').value,
      descripcion: document.getElementById('prodDesc').value || null,
      precio: parseFloat(document.getElementById('prodPrecio').value),
      imagen_url: imagenUrl,
      categoria: document.getElementById('prodCategoria').value,
      estado: document.getElementById('prodEstado').value,
      tallas: tallasArray.length > 0 ? tallasArray : ['XS', 'S', 'M', 'L', 'XL']
    };

    const esEdicion = Boolean(prodId);
    const endpoint = esEdicion ? `${API_BASE_URL}/${prodId}` : API_BASE_URL;
    const metodo = esEdicion ? 'PUT' : 'POST';

    const respuesta = await fetch(endpoint, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (respuesta.ok) {
      mostrarMensajeAdmin(resultado.mensaje || 'Operación realizada con éxito', false);
      resetearFormulario();
      cargarListaProductos();
    } else {
      mostrarMensajeAdmin(resultado.error || 'Ocurrió un error al guardar', true);
    }
  } catch (error) {
    console.error('Error al guardar producto:', error);
    mostrarMensajeAdmin(error.message || 'Error de conexión con el servidor.', true);
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = prodId ? 'Guardar Cambios' : 'Publicar Prenda';
  }
}

function prepararEdicion(prod) {
  document.getElementById('formTitulo').textContent = 'Editar Prenda';
  document.getElementById('prodId').value = prod.id_producto;
  document.getElementById('prodTitulo').value = prod.titulo;
  document.getElementById('prodPrecio').value = prod.precio;
  document.getElementById('prodImagenUrl').value = prod.imagen_url;
  document.getElementById('prodCategoria').value = prod.categoria;
  document.getElementById('prodEstado').value = prod.estado;
  document.getElementById('prodTallas').value = Array.isArray(prod.tallas) ? prod.tallas.join(', ') : '';
  document.getElementById('prodDesc').value = prod.descripcion || '';

  // Vista previa de la foto existente
  const previewContainer = document.getElementById('previewContainer');
  const imgPreview = document.getElementById('imgPreview');
  imgPreview.src = prod.imagen_url;
  previewContainer.style.display = 'block';

  document.getElementById('btnGuardar').textContent = 'Guardar Cambios';
  document.getElementById('btnCancelar').style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function alternarEstado(id, estadoActual) {
  const token = localStorage.getItem('urban_token');
  const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';

  try {
    const respuesta = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (respuesta.ok) {
      cargarListaProductos();
    } else {
      alert('Error al cambiar el estado del producto.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function eliminarProducto(id) {
  if (!confirm('¿Estás seguro de que deseas borrar definitivamente esta prenda?')) return;

  const token = localStorage.getItem('urban_token');

  try {
    const respuesta = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (respuesta.ok) {
      cargarListaProductos();
    } else {
      const res = await respuesta.json();
      alert(res.error || 'No se pudo eliminar el producto.');
    }
  } catch (error) {
    console.error('Error al eliminar:', error);
  }
}

function resetearFormulario() {
  document.getElementById('formTitulo').textContent = 'Agregar Nuevo Producto';
  document.getElementById('productoForm').reset();
  document.getElementById('prodId').value = '';
  document.getElementById('prodImagenUrl').value = '';
  document.getElementById('previewContainer').style.display = 'none';
  document.getElementById('btnGuardar').textContent = 'Publicar Prenda';
  document.getElementById('btnCancelar').style.display = 'none';
}

function mostrarMensajeAdmin(texto, esError = false) {
  const msgDiv = document.getElementById('mensajeAdmin');
  if (!msgDiv) return;

  msgDiv.style.display = 'block';
  msgDiv.className = `mt-3 text-center fw-bold ${esError ? 'text-danger' : 'text-success'}`;
  msgDiv.textContent = texto;
}

function ocultarMensajeAdmin() {
  const msgDiv = document.getElementById('mensajeAdmin');
  if (msgDiv) msgDiv.style.display = 'none';
}