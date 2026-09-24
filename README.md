# Americanoshh - E-Commerce de Moda Urbana (Urban Clothes)

**Americanoshh** es una plataforma e-commerce web orientada a la venta de ropa de estilo streetwear y moda urbana. El proyecto incluye un catálogo interactivo con filtrado dinámico de productos, gestión de la sesión de usuarios con tokens JWT y persistencia de datos en PostgreSQL mediante Supabase.

---

## 🛠️ Tecnologías Utilizadas

### **Frontend**
* **HTML5 & CSS3:** Estructura semántica, diseño responsive mediante Flexbox, CSS Grid y Media Queries.
* **JavaScript ES6+:** Interactividad, manipulación del DOM, carruseles de productos, modales dinámicos y consumo de APIs con `fetch`.
* **Bootstrap 5.3.8:** Framework de estilos para utilidades y componentes del sistema.

### **Backend**
* **Node.js & Express.js:** Servidor HTTP RESTful para la autenticación y gestión de usuarios.
* **JSON Web Token (JWT):** Generación y verificación de tokens para la autenticación segura en las rutas protegidas.
* **Bcrypt:** Encriptación y hashing de contraseñas de usuarios.
* **CORS & Dotenv:** Configuración de origen cruzado para despliegues en la nube y manejo de variables de entorno.

### **Base de Datos**
* **PostgreSQL (vía Supabase):** Base de datos relacional para la persistencia de usuarios e información de compras.
* **`pg` (node-postgres):** Cliente de conexión para PostgreSQL.

---

## 📁 Estructura del Proyecto

```text
urban-clothes/
├── assets/                  # Imágenes, banners y recursos multimedia
│   ├── fondo.webp
│   ├── logo.png
│   ├── hombre/             # Catálogo de ropa masculina
│   ├── mujer/              # Catálogo de ropa femenina
│   └── unixets/            # Catálogo de ropa unisex
├── backend/                 # Código del servidor Node.js
│   ├── node_modules/
│   ├── .env                 # Variables de entorno (no subir a git)
│   ├── .env.example         # Plantilla de variables de entorno
│   ├── db.js                # Conexión a la base de datos PostgreSQL/Supabase
│   ├── index.js             # API REST, endpoints y middleware de autenticación
│   ├── package.json
│   └── package-lock.json
├── .gitignore               # Archivos excluidos del control de versiones
├── acerca de.html           # Página de información corporativa
├── acerca de.css
├── auth.js                  # Lógica JavaScript global para manejo de sesión
├── catalogo.html            # Vista general de todo el catálogo
├── colecciones.css          # Estilos para el carrusel de colecciones
├── hombre.html              # Sección de prendas para hombre
├── index.html               # Landing page principal de bienvenida
├── login.html               # Formulario modal de inicio de sesión y registro
├── login.css
├── login.js                 # Lógica de consumo de API para Auth
├── main.html                # Vista principal de colecciones por categoría
├── main.css                 # Estilos generales y del modal de productos
├── mujer.html               # Sección de prendas para mujer
├── perfil.html             # Vista de administración de perfil de usuario
├── perfil.css
├── perfil.js                # Lógica de consumo de API para el perfil
├── script.js                # Interacciones generales (modales, filtros, carruseles)
├── styles.css               # Estilos de la landing page
└── unisex.html              # Sección de prendas unisex
