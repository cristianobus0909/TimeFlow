# ⚡ TimeFlow — Enterprise-Grade Smart Time Tracker

[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/frontend-React%20%7C%20TS%20%7C%20Tailwind-blueviolet.svg)](https://react.dev/)
[![Database](https://img.shields.io/badge/database-MongoDB-brightgreen.svg)](https://www.mongodb.com/)

**TimeFlow** es una plataforma premium de control de tiempo y planificación de proyectos de grado empresarial. Diseñada bajo un enfoque centrado en la productividad diaria, la aplicación combina planificación de proyectos con estimaciones ponderadas, ejecución secuencial de tareas con cuentas regresivas automatizadas y un widget flotante siempre al frente utilizando la API nativa de **Document Picture-in-Picture** del navegador.

---

## 🏗️ Arquitectura del Sistema

El siguiente diagrama muestra la interacción de flujo de datos y la arquitectura técnica de TimeFlow:

```mermaid
graph TD
    subgraph Frontend (React Client)
        UI[PWA / React Interface] <--> Store[Zustand Stores]
        UI -->|Portals| PiP[Document Picture-in-Picture Window]
    end

    subgraph Backend (Express & Node.js)
        API[Express API Gateway] --> Auth[Auth Middleware / JWT Validator]
        API --> Billing[Stripe Billing Manager]
        API --> DB_Layer[Mongoose ODM]
    end

    subgraph Database & Services
        MongoDB[(MongoDB Database)]
        StripeAPI[Stripe Gateway]
    end

    UI <-->|HTTPS API / sameSite: lax Cookie| API
    DB_Layer <--> MongoDB
    Billing <--> StripeAPI
```

---

## 🌟 Características de Nivel Profesional

### 1. Planificación Avanzada de Proyectos
* **Estimaciones Ponderadas:** Cálculo de tiempos de entrega en base a promedios ponderados por tarea.
* **Ordenamiento Dinámico (Drag & Drop):** Reorganización interactiva del orden de ejecución de tareas con recálculo automático de tiempos restantes en tiempo real.
* **Multiplicador de Tareas:** Clonación masiva inteligente de tareas al estructurar proyectos repetitivos.

### 2. Micro-Reproductor de Escritorio (Document PiP)
* **Always-on-Top Nativo:** Transición a una ventana flotante ultra-compacta (`380x64`) que se superpone a cualquier programa en ejecución en el sistema operativo.
* **Sincronización de Temas:** El fondo de la píldora flotante se adapta de forma inmediata a los cambios del selector de tema claro u oscuro.

### 3. Automatización de Flujos de Trabajo
* **Transiciones en Cadena:** Al detener una tarea, el backend actualiza su estado a `completed` y localiza la siguiente tarea pendiente del proyecto.
* **Autostart con Cuenta Regresiva SVG:** Una animación circular de 5 segundos se ejecuta en la píldora para dar inicio automático a la siguiente tarea sin intervención manual.

### 4. Seguridad de Sesión Persistente (JWT + Cookie)
* **Acceso y Renovación Silenciosa:** Implementación de `accessToken` (15m de expiración en memoria) y `refreshToken` (7d en base de datos y cookie HTTP-only).
* **Mapeo de Orígenes:** Cookie configurada con `sameSite: 'lax'` para posibilitar llamadas seguras entre puertos (`localhost:5173` y `localhost:5000`) en desarrollo y producción.

---

## ⌨️ Atajos de Teclado (Hotkeys)

| Modo | Teclas | Acción |
| :--- | :--- | :--- |
| **Completo** | <kbd>Ctrl/⌘</kbd> + <kbd>K</kbd> | Abrir paleta de comandos rápida. |
| **Completo** | <kbd>Alt</kbd> + <kbd>M</kbd> | Entrar en Modo Compacto (Píldora flotante). |
| **Compacto (PiP)** | <kbd>Espacio</kbd> | Pausar / Reanudar temporizador. |
| **Compacto (PiP)** | <kbd>S</kbd> | Finalizar y guardar sesión actual. |
| **Compacto (PiP)** | <kbd>Esc</kbd> / <kbd>Alt</kbd> + <kbd>M</kbd> | Salir de Modo Compacto y volver a la pantalla principal. |

---

## 📈 Modelado de Datos (Esquemas Clave)

* **ITask:** Define las especificaciones de la tarea (título, descripción, color, estadísticas de duración mínima/máxima/promedio).
* **IProjectTask:** Almacena la relación entre tareas y proyectos, gestionando el orden (`order`), la duración acumulada, y su estado (`pending`, `completed`).
* **ITimeSession:** Registra la sesión de trabajo (inicio, fin, pausas registradas, duración total y dispositivo de ejecución).

---

## 🚀 Guía de Despliegue y Desarrollo

### Requisitos del Sistema
* Node.js v20.0.0 o superior.
* Instancia de MongoDB v6.0 o superior.

### Paso 1: Configuración de Variables de Entorno
Crea un archivo `.env` dentro de la carpeta `/backend` con la siguiente estructura:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/timeflow
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### Paso 2: Instalación de Dependencias
```bash
# Instalar dependencias del servidor
cd backend
npm install

# Instalar dependencias del cliente
cd ../frontend
npm install
```

### Paso 3: Inicialización en Desarrollo
* **Backend Server:** `npm run dev` (ejecuta el compilador TypeScript en segundo plano y arranca con nodemon en el puerto 5000).
* **Frontend Client:** `npm run dev` (inicia el servidor Vite en el puerto 5173).

### Paso 4: Construcción de Producción
Para compilar la aplicación para entornos de producción:
```bash
# Compilar frontend
cd frontend
npm run build

# Compilar backend
cd ../backend
npm run build
```
Los archivos de salida se ubicarán en sus respectivas carpetas `/dist` listos para ser servidos.
