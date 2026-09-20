const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // Requerido para conectar con Supabase
  }
});

// Verificación rápida de conexión en consola
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error conectando a Supabase:', err.message);
  }
  console.log('¡Conexión exitosa a Supabase!');
  release();
});

module.exports = pool;