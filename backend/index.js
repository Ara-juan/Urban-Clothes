require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Configuración amplia de CORS para despliegues (Netlify, Vercel, Render)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("ERROR FATAL: JWT_SECRET no está definida en el archivo .env");
  process.exit(1);
}

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
    return res.status(403).json({ error: "Token inválido o expirado." });
  }
};

// REGISTRO DE USUARIOS
app.post('/api/usuarios/registro', async (req, res) => {
  const { nombre, email, contrasena, telefono, direccion } = req.body;

  if (!nombre || !email || !contrasena) {
    return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios." });
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: "El correo electrónico no tiene un formato válido." 
    });
  }

  if (contrasena.length < 8) {
    return res.status(400).json({ 
      error: "La contraseña debe tener como mínimo 8 caracteres." 
    });
  }

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
      mensaje: "Usuario registrado con éxito",
      usuario: nuevoUsuario.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: "El correo electrónico ya se encuentra registrado." 
      });
    }
    
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// INICIO DE SESIÓN
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
      mensaje: "Inicio de sesión exitoso.",
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

// OBTENER PERFIL
app.get('/api/usuarios/perfil', verificarToken, async (req, res) => {
  try {
    const usuario = await pool.query(
      'SELECT id_usuario, nombre, email, telefono, direccion, rol FROM usuarios WHERE id_usuario = $1',
      [req.usuario.id]
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json(usuario.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al consultar el perfil." });
  }
});

// ACTUALIZAR PERFIL
app.put('/api/usuarios/perfil', verificarToken, async (req, res) => {
  const userId = req.usuario.id;
  const { contrasenaActual, nuevaContrasena, telefono, direccion } = req.body;

  if (telefono && !/^\d+$/.test(telefono)) {
    return res.status(400).json({ error: "El teléfono solo debe contener dígitos numéricos." });
  }

  try {
    let nuevoPasswordHash = null;

    if (nuevaContrasena) {
      if (!contrasenaActual) {
        return res.status(400).json({ error: "Debes ingresar tu contraseña actual para establecer una nueva." });
      }

      if (nuevaContrasena.length < 8) {
        return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres." });
      }

      const consultaUsuario = await pool.query('SELECT contrasena FROM usuarios WHERE id_usuario = $1', [userId]);
      const passActualHash = consultaUsuario.rows[0].contrasena;

      const esValida = await bcrypt.compare(contrasenaActual, passActualHash);
      if (!esValida) {
        return res.status(401).json({ error: "La contraseña actual es incorrecta." });
      }

      nuevoPasswordHash = await bcrypt.hash(nuevaContrasena, SALT_ROUNDS);
    }

    const usuarioActualizado = await pool.query(
      `UPDATE usuarios 
       SET contrasena = COALESCE($1, contrasena), 
           telefono = COALESCE($2, telefono), 
           direccion = COALESCE($3, direccion) 
       WHERE id_usuario = $4 
       RETURNING id_usuario, nombre, email, telefono, direccion`,
      [nuevoPasswordHash, telefono !== undefined ? telefono : null, direccion !== undefined ? direccion : null, userId]
    );

    res.json({
      mensaje: "Datos actualizados correctamente.",
      usuario: usuarioActualizado.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: "Error interno al actualizar la información." });
  }
});

// ELIMINAR CUENTA
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
  console.log(`Servidor de Urban Clothes activo en el puerto ${PORT}`);
});