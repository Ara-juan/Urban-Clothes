require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("ERROR FATAL: JWT_SECRET no está definida en el archivo .env");
  process.exit(1);
} //como medida porque la primera vez no habia descargado eso

// MIDDLEWARE DE AUTENTICACIÓN
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Acceso denegado. No se proporcionó un token." });
  }

  try {
    const verificado = jwt.verify(token, JWT_SECRET);
    req.usuario = verificado;
    next();
  } catch (error) {
    res.status(403).json({ error: "Token inválido o expirado." });
  }
};

// 1. REGISTRO DE USUARIOS
app.post('/api/usuarios/registro', async (req, res) => {
  const { nombre, email, contrasena, telefono, direccion } = req.body;

  // Validación 1: Campos obligatorios
  if (!nombre || !email || !contrasena) {
    return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios." });
  }

  // Validación 2: Formato de correo electrónico
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: "El correo electrónico no tiene un formato válido (ejemplo: usuario@dominio.com)." 
    });
  }

  // Validación 3: Longitud mínima de la contraseña (Mínimo 8 caracteres)
  if (contrasena.length < 8) {
    return res.status(400).json({ 
      error: "La contraseña debe tener como mínimo 8 caracteres." 
    });
  }

  // Validación 4: Teléfono únicamente numérico (si es proporcionado)
  if (telefono && !/^\d+$/.test(telefono)) {
    return res.status(400).json({ 
      error: "El campo teléfono solo debe contener números." 
    });
  }

  try {
    const passwordHash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    const nuevoUsuario = await pool.query(
      `INSERT INTO usuarios (nombre, email, contrasena, telefono, direccion) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id_usuario, nombre, email, rol, fecha_registro`,
      [nombre, email, passwordHash, telefono, direccion]
    );

    res.status(201).json({
      mensaje: "Usuario registrado con éxito en Urban Clothes",
      usuario: nuevoUsuario.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: "El nombre de usuario o el correo electrónico ya se encuentran en uso." 
      });
    }
    
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// 2. INICIO DE SESIÓN
app.post('/api/usuarios/login', async (req, res) => {
  const { email, contrasena } = req.body;

  if (!email || !contrasena) {
    return res.status(400).json({ error: "Por favor ingresa email y contraseña." });
  }

  try {
    const usuario = await pool.query(
      'SELECT id_usuario, nombre, email, contrasena, rol FROM usuarios WHERE email = $1',
      [email]
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({ error: "El correo electrónico no existe en el sistema." });
    }

    const usuarioEncontrado = usuario.rows[0];

    const esPasswordValida = await bcrypt.compare(contrasena, usuarioEncontrado.contrasena);
    if (!esPasswordValida) {
      return res.status(401).json({ error: "Contraseña incorrecta." });
    }

    const token = jwt.sign(
      { 
        id: usuarioEncontrado.id_usuario, 
        email: usuarioEncontrado.email, 
        rol: usuarioEncontrado.rol 
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: "Inicio de sesión exitoso. Bienvenido a Urban Clothes",
      token,
      usuario: {
        id: usuarioEncontrado.id_usuario,
        nombre: usuarioEncontrado.nombre,
        email: usuarioEncontrado.email,
        rol: usuarioEncontrado.rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor al intentar iniciar sesión." });
  }
});

// 3. ACTUALIZAR PERFIL
app.put('/api/usuarios/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, direccion } = req.body;

  if (req.usuario.id !== parseInt(id, 10) && req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: "No tienes permiso para modificar este perfil." });
  }

  try {
    const usuarioActualizado = await pool.query(
      `UPDATE usuarios 
       SET nombre = COALESCE($1, nombre), 
           telefono = COALESCE($2, telefono), 
           direccion = COALESCE($3, direccion) 
       WHERE id_usuario = $4 
       RETURNING id_usuario, nombre, email, telefono, direccion`,
      [nombre, telefono, direccion, id]
    );

    if (usuarioActualizado.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado para actualizar." });
    }

    res.json({
      mensaje: "Perfil actualizado correctamente",
      usuario: usuarioActualizado.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar los datos." });
  }
});

// 4. ELIMINAR CUENTA
app.delete('/api/usuarios/:id', verificarToken, async (req, res) => {
  const { id } = req.params;

  if (req.usuario.id !== parseInt(id, 10) && req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: "No tienes permiso para eliminar esta cuenta." });
  }

  try {
    const resultado = await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [id]);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado para eliminar." });
    }

    res.json({ mensaje: "Usuario eliminado correctamente del sistema." });
  } catch (error) {
    res.status(500).json({ error: "Error al intentar eliminar el usuario." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Urban Clothes activo en http://localhost:${PORT}`);
});