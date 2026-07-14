# ⚡ TimeFlow — Smart Time Tracker & Planner

**TimeFlow** es un gestor de tiempo inteligente y planificador de tareas premium diseñado para optimizar tu flujo de trabajo. Permite estimar tareas, arrastrarlas para ordenarlas, registrar sesiones de tiempo en vivo y controlar tu actividad de manera discreta mediante widgets flotantes de escritorio.

---

## ✨ Características Destacadas

* 🎨 **Estética Visual Premium:** Interfaz ultra moderna con soporte de temas claro y oscuro dinámicos y armonía en toda la paleta de colores.
* 📦 **Aplicación Web Progresiva (PWA):** Instala la aplicación directamente en tu navegador y accede a ella como si fuera un programa nativo de Windows.
* 🖼️ **Píldora Flotante "Siempre al Frente" (Document Picture-in-Picture):** Al activar el Modo Compacto, la aplicación abre una pequeña ventana flotante nativa del sistema operativo que permanece por delante de cualquier programa (VS Code, Excel, etc.), manteniéndose visible mientras trabajas.
* 🔄 **Transición entre Tareas Automática con Cuenta Regresiva:** Al finalizar una tarea del proyecto, el sistema calcula de forma secuencial la siguiente tarea pendiente y activa una cuenta regresiva animada de 5 segundos antes de iniciar el siguiente temporizador automáticamente.
* 🔢 **Multiplicador de Tareas:** Permite duplicar o multiplicar tareas en cantidad al asignarlas a un proyecto, ideal para estructurar flujos repetitivos.
* ⌨️ **Teclas de Acceso Rápido (Hotkeys):** Controla tu temporizador sin tocar el ratón.

---

## 🛠️ Tecnologías Utilizadas

### Frontend
* **Core:** React, TypeScript, React Router.
* **Estilos:** TailwindCSS v4 & Vanilla CSS Variables.
* **Compilador:** Vite.
* **Gestión de Estado:** Zustand (Timer, Auth, Theme, Settings).
* **Consumo API:** React Query & Fetch.

### Backend
* **Entorno:** Node.js, Express.
* **Base de Datos:** MongoDB & Mongoose.
* **Autenticación:** JWT (JSON Web Tokens) con renovación de token silenciosa (`sameSite: 'lax'` en cookies).
* **Pasarela de Pago:** Stripe (Suscripciones Pro integradas).

---

## ⌨️ Combinaciones de Teclas (Hotkeys)

### En Modo Completo:
* <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> : Abre la paleta de comandos rápida.
* <kbd>Alt</kbd> + <kbd>M</kbd> : Minimiza el reproductor a **Modo Compacto / Píldora Flotante**.

### En la Píldora Flotante (Modo Compacto):
* <kbd>Espacio</kbd> : Pausar / Reanudar el contador.
* <kbd>S</kbd> : Guardar y finalizar la sesión actual.
* <kbd>Esc</kbd> : Maximizar la ventana y volver a Modo Completo.
* <kbd>Alt</kbd> + <kbd>M</kbd> : Maximizar la ventana y volver a Modo Completo.

---

## 🚀 Guía de Inicio Rápido

### Requisitos Previos
* [Node.js](https://nodejs.org/) (versión 20 o superior)
* [MongoDB](https://www.mongodb.com/) corriendo de forma local o una URI de MongoDB Atlas.

### 1. Configuración del Servidor (Backend)
1. Ve al directorio del servidor:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura tus variables de entorno en un archivo `.env` (guíate del archivo de muestra si existe):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/timeflow
   JWT_SECRET=tu_clave_secreta_jwt
   JWT_REFRESH_SECRET=tu_clave_secreta_refresh_jwt
   FRONTEND_URL=http://localhost:5173
   STRIPE_SECRET_KEY=tu_clave_secreta_stripe
   ```
4. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

### 2. Configuración del Cliente (Frontend)
1. Ve al directorio del cliente:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:5173](http://localhost:5173) en tu navegador preferido.
