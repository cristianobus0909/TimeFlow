# ⚡ TimeFlow — Enterprise Time Tracker & Planner

[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/frontend-React%20%7C%20TS%20%7C%20Tailwind-blueviolet.svg)](https://react.dev/)
[![Database](https://img.shields.io/badge/database-MongoDB-brightgreen.svg)](https://www.mongodb.com/)

**TimeFlow** es una solución de nivel empresarial para el control y planificación del tiempo, desarrollada con estándares de arquitectura limpia y escalable. Integra la estimación ponderada de proyectos, transiciones secuenciales automatizadas de tareas y el uso de la API nativa de **Document Picture-in-Picture** para proporcionar una píldora flotante persistente sobre el escritorio del sistema operativo.

---

## 👨‍💻 Autor y Dirección de Ingeniería

Este proyecto fue diseñado, estructurado e implementado bajo los estándares de desarrollo de software limpio de:

* **Cristian Bus (cristianobus0909)**
  * **GitHub:** [github.com/cristianobus0909](https://github.com/cristianobus0909)
  * **Proyecto Principal:** [TimeFlow Repository](https://github.com/cristianobus0909/TimeFlow)

---

## 🏗️ Arquitectura del Sistema y Flujos de Datos

El siguiente diagrama modela la comunicación entre las capas cliente, estado global, pasarelas de pago y persistencia de datos:

```mermaid
graph TD
    subgraph Frontend (React Client)
        UI[PWA / React View Components] <--> Store[Zustand Stores]
        UI -->|Portals| PiP[Document Picture-in-Picture Window]
    end

    subgraph Backend (Express & Node.js Server)
        API[Express API Gateway] --> Auth[Auth Middleware / JWT Validator]
        API --> Billing[Stripe Billing SDK]
        API --> DB_Layer[Mongoose ODM]
    end

    subgraph Database & Gateway Services
        MongoDB[(MongoDB Database)]
        StripeAPI[Stripe Gateway]
    end

    UI <-->|HTTPS API / sameSite: lax Cookie| API
    DB_Layer <--> MongoDB
    Billing <--> StripeAPI
```

---

## 📂 Estructura del Directorio del Proyecto

El monorepo está organizado siguiendo principios de diseño modular y separación de responsabilidades:

```text
├── backend/                       # Servidor de API y Persistencia Mongoose
│   ├── src/
│   │   ├── config/                # Configuraciones de Base de Datos y Stripe
│   │   ├── controllers/           # Controladores de lógica de negocio (Auth, Projects, Sessions)
│   │   ├── middlewares/           # Capa de Filtros (JWT Auth, Control de Cuotas Pro)
│   │   ├── models/                # Esquemas y Modelos Mongoose (User, Task, Project, Session)
│   │   ├── routes/                # Definición de Rutas de la API REST
│   │   ├── utils/                 # Herramientas Auxiliares (Generador JWT, Cálculos de duraciones)
│   │   └── index.ts               # Punto de Entrada del Servidor Express
│   ├── tsconfig.json              # Configuración de compilación TypeScript
│   └── package.json               # Dependencias del Servidor
│
├── frontend/                      # Cliente de Interfaz SPA & PWA
│   ├── public/                    # Recursos Estáticos (Favicon, Manifest PWA, Service Worker)
│   ├── src/
│   │   ├── components/            # Componentes genéricos de UI (Modal, Button, Input, Card)
│   │   ├── features/              # Módulos Funcionales (Dashboard, Projects, Analytics, Layout)
│   │   ├── services/              # Cliente HTTP Centralizado con Axios/Fetch
│   │   ├── store/                 # Almacenamiento Global Zustand (Timer, Theme, Auth)
│   │   ├── utils/                 # Mapeo de Idiomas y Traductores
│   │   ├── App.tsx                # Rutas y Componente Raíz
│   │   ├── index.css              # Sistema de Diseño CSS Vanilla e Importación Tailwind
│   │   └── main.tsx               # Montaje en el DOM
│   ├── vite.config.ts             # Configuración del empaquetador Vite
│   └── package.json               # Dependencias del Frontend
└── README.md                      # Documentación del Repositorio
```

---

## 🛠️ Estándares de Ingeniería y Buenas Prácticas

### 💡 Principios de Diseño Aplicados (SOLID)
* **Single Responsibility (SRP):** Cada controlador y ruta del backend se enfoca en una sola entidad. Las tareas del temporizador están completamente desacopladas de las vistas e integradas en `timerStore.ts`.
* **Seguridad de Tipado Extremo:** Configuración estricta de TypeScript en ambos entornos para garantizar la detección de errores de tipo en tiempo de compilación.
* **Mapeo de Índices en MongoDB:** El modelo `TaskSchema` y `ProjectSchema` incorporan índices compuestos (`userId: 1, favorite: -1`) para acelerar las búsquedas relacionales en la base de datos.
* **SameSite Cookie lax Policy:** Implementación de cookies seguras `httpOnly` con política `'lax'` para posibilitar el paso de tokens de renovación cruzada entre puertos en desarrollo local.

---

## 📡 Especificación de la API RESTful (Endpoints Clave)

| Método | Endpoint | Middleware | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | *Ninguno* | Inicia sesión y retorna token corto junto con cookie de renovación (7d). |
| `POST` | `/api/v1/auth/refresh` | *Cookie Parser* | Evalúa el `refreshToken` en cookie y genera un nuevo token corto de acceso. |
| `GET` | `/api/v1/projects/:id` | `authRequire` | Retorna los detalles del proyecto y sus tareas asociadas populadas. |
| `PUT` | `/api/v1/projects/:id/tasks/:projectTaskId/status` | `authRequire` | Actualiza el estado (`pending`/`completed`) de una tarea de proyecto. |
| `POST` | `/api/v1/sessions` | `authRequire`, `quotaLimit` | Registra una sesión de tiempo cronometrada (con soporte para pausas). |

---

## ⌨️ Atajos de Teclado (Hotkeys)

| Pantalla | Combinación | Acción |
| :--- | :--- | :--- |
| **Global Completa** | <kbd>Ctrl / ⌘</kbd> + <kbd>K</kbd> | Lanzar Paleta de Comandos rápida. |
| **Global Completa** | <kbd>Alt</kbd> + <kbd>M</kbd> | Entrar a Modo Compacto (Píldora flotante de escritorio). |
| **Modo Compacto (PiP)** | <kbd>Espacio</kbd> | Pausar / Reanudar temporizador. |
| **Modo Compacto (PiP)** | <kbd>S</kbd> | Guardar sesión actual en base de datos. |
| **Modo Compacto (PiP)** | <kbd>Esc</kbd> / <kbd>Alt</kbd> + <kbd>M</kbd> | Salir de Modo Compacto y maximizar aplicación. |

---

## 🚀 Instalación y Despliegue

### Variables de Entorno

#### Servidor Backend (Fichero `/backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://...  # URI de MongoDB Atlas para producción o local
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
FRONTEND_URL=http://localhost:5173  # URL de producción en Vercel
STRIPE_SECRET_KEY=your_stripe_secret_key
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com  # Credencial Google OAuth2
```

#### Cliente Frontend (Fichero `/frontend/.env`)
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com  # Credencial Google OAuth2
```

### Inicialización en Modo Desarrollo
```bash
# Ejecutar Servidor Backend
cd backend
npm install
npm run dev

# Ejecutar Cliente Frontend (en una nueva terminal)
cd frontend
npm install
npm run dev
```

### Despliegue en Producción
El proyecto está estructurado y optimizado para un despliegue híbrido:

1. **Frontend (Vercel):**
   * Configura la carpeta raíz como `frontend/`.
   * El archivo [vercel.json](file:///c:/Users/ADMIN/BACKUP/Desktop/Antora/TimeFlow/frontend/vercel.json) redirige automáticamente todas las rutas al `index.html` para permitir el correcto funcionamiento de `BrowserRouter`.
   * Agrega la variable `VITE_GOOGLE_CLIENT_ID` y la URL de la API en `VITE_API_URL`.

2. **Backend (Render / Railway):**
   * Configura la carpeta raíz como `backend/`.
   * Comando de construcción: `npm install && npm run build` (compila TypeScript a `dist/`).
   * Comando de inicio: `npm run start` (ejecuta `node dist/index.js`).
   * Las cookies de sesión (`refreshToken`) están configuradas con `sameSite: 'none'` y `secure: true` para habilitar el refresco automático de tokens entre dominios de forma segura.
   * Agrega la variable `FRONTEND_URL` (URL de Vercel) para permitir las solicitudes de CORS.
