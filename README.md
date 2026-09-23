# CloudShop · Frontend

SPA en **React JavaScript + Vite**. Incluye pantallas para usuarios, catálogo, órdenes, ventas/reseñas y analítica. El backend se mantiene en el repositorio [CloudComputing-Project](https://github.com/rvcuba-utec/CloudComputing-Project).

## Ejecutar

Requiere Node.js 22 o superior y npm.

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Abre la URL que indique Vite. Para compilar: `npm run build`. Para revisar la compilación: `npm run preview`.

## Páginas

| Ruta | Alcance |
|---|---|
| `/productos` | Catálogo, búsqueda, categorías, orden por precio y filtro de stock |
| `/productos/:id` | Detalle, especificaciones, precio y unidades disponibles |
| `/login` | Inicio de sesión |
| `/registro` | Registro con confirmación de contraseña |
| `/perfil` | Consulta y edición de nombre, listado y alta de direcciones |
| `/admin` | Productos, categorías, usuarios, órdenes y seis consultas de analítica; requiere rol `admin` |

El flujo de compra llama al microservicio de órdenes, que coordina inventario y ventas. Las reseñas se muestran en el detalle del producto. La pestaña de analítica consume seis endpoints `/analitica/*` del microservicio analítico; el backend exige un JWT con rol `admin`.

## Modo demo

Activo por defecto (`VITE_USE_MOCKS=true`). Cuenta de usuario: **demo@cloudshop.pe** / **CloudShop123**. Cuenta administradora para revisar `/admin`: **admin@cloudshop.pe** / **AdminPass123**.
Permite probar registro, login, edición de nombre, direcciones, compra, reseñas y administración. Los datos viven en memoria y desaparecen al recargar; no se guarda nada en una base de datos. La pestaña Analítica muestra que Athena no está conectado en este modo y no inventa resultados. No usar datos personales reales ni estas credenciales en producción.

## Conectar el API Gateway

Configura en `.env` local o en las variables de compilación de Amplify:

```dotenv
VITE_USE_MOCKS=false
VITE_API_BASE_URL=https://TU_GATEWAY.execute-api.REGION.amazonaws.com/STAGE
```

La URL debe incluir el stage cuando corresponda, sin agregar `/api` al final: el frontend ya agrega los prefijos `/api/catalogo`, `/usuarios`, `/ordenes`, `/ventas`, `/productos` y `/analitica`. Cambiar variables requiere recompilar. Las variables `VITE_*` son públicas: nunca colocar secretos AWS. El navegador solo accede al API Gateway HTTPS; no accede al balanceador, EC2 ni bases privadas. No se usa Amplify Auth/Cognito: la identidad pertenece al microservicio FastAPI.

Los servicios del frontend usan las rutas implementadas en el repositorio de backend. Antes de desactivar la demo, confirma la URL pública HTTPS de API Gateway, sus reglas de enrutamiento y CORS.

| Método | Ruta relativa a base URL | Entrada / respuesta |
|---|---|---|
| POST | `/usuarios/auth/login` | `{email,password}` → `{user,access_token}` |
| POST | `/usuarios/auth/register` | `{nombre,email,password}` → `{user,access_token}` |
| GET | `/usuarios/{id}` | Perfil `{id,nombre,email}` |
| PATCH | `/usuarios/{id}` | `{nombre}` → perfil actualizado |
| GET | `/usuarios/{id}/direcciones` | Array de direcciones |
| POST | `/usuarios/{id}/direcciones` | `{direccion,distrito,ciudad,pais}` → dirección con `id` |
| GET | `/api/catalogo/productos` | `{data,total,page,limit,pages}` |
| GET | `/api/catalogo/productos/{id}` | `{data:{...producto}}`; 404 si no existe |
| POST | `/ordenes/confirmar` | Confirma compra y devuelve la orden |
| GET | `/usuarios/{id}/ventas` | Historial de compras |
| GET/POST | `/productos/{id}/resenas` | Consultar o crear reseñas |
| GET | `/analitica/{consulta}` | `{data:[...]}`; seis consultas disponibles, solo admin |

`productService.js` adapta los campos del catálogo para la interfaz: `categoria_nombre` pasa a `categoria` y `stock_disponible` a `stock`. Las propiedades `tipo` y `color` solo apoyan las ilustraciones de la demo.

El login envía JSON. El frontend envía el token como `Authorization: Bearer`; lo conserva solo en memoria y solicita iniciar sesión nuevamente al recargar. El backend valida la autorización en cada operación, incluida analítica para rol `admin`. Habilitar CORS para el origen Amplify y local, los métodos GET/POST/PATCH/DELETE/OPTIONS y los headers Content-Type/Authorization. Los errores del backend se muestran en la interfaz; no hay fallback silencioso a demo si falla la API.

## Desplegar en AWS Amplify Hosting

### Desde Git (recomendado)

1. Sube este repositorio a tu proveedor Git.
2. En Amplify Hosting crea una app, conecta repositorio y rama. Selecciona monorepo y carpeta raíz **frontend**; la variable `AMPLIFY_MONOREPO_APP_ROOT` debe ser `frontend`.
3. Usa el `amplify.yml` de la raíz: `npm ci`, `npm run build`, artefactos `dist` dentro de frontend. Usa Node.js 22 o superior.
4. Para demo configura `VITE_USE_MOCKS=true`. Para APIs reales, configura las variables del apartado anterior.
5. Compila y despliega. En **Hosting → Rewrites and redirects**, importa el contenido de `frontend/amplify-rewrites.json`. Es una reescritura HTTP **200** a `/index.html` para navegación SPA. Este JSON es una referencia para la consola, **Amplify no lo aplica automáticamente**.
6. Comprueba la URL pública y recarga directamente `/productos/1`, `/login` y `/perfil`. Esta última redirigirá al login si no hay sesión en memoria.

### Carga manual

Ejecuta `npm run build` dentro de frontend. Comprime **el contenido** de `frontend/dist` (index.html debe estar en la raíz del ZIP) y cárgalo mediante la opción de despliegue sin proveedor Git de Amplify. Aplica también la reescritura SPA anterior. La carpeta `artifacts` puede contener un ZIP ya preparado para la demo.

Fuentes oficiales: [Vite en Amplify](https://docs.amplify.aws/gen1/javascript/deploy-and-host/frameworks/deploy-vite-site/), [reescrituras SPA](https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html), [carga manual](https://docs.aws.amazon.com/amplify/latest/userguide/manual-deploys.html).

## Estructura

`frontend/src/` contiene `components/`, `pages/`, `hooks/`, `services/`, `contexts/`, `utils/`, `assets/`, `App.jsx` y `main.jsx`; `frontend/public/` admite archivos estáticos. Se usa JSX/JS para seguir React JavaScript de la arquitectura; la captura TSX se tomó como guía de carpetas.

## Diseño y verificación pendiente

Dirección: sencilla, sobria y cercana. Catálogo de densidad equilibrada, navegación superior, tipografía DM Sans con respaldo Arial, fondo cálido, acento verde, bordes discretos y cuadrícula de productos. Se priorizan precio, disponibilidad y búsqueda. La alternativa de una portada promocional se descartó porque esta entrega necesita catálogo y cuenta. No se agregan métricas, promociones, testimonios ni promesas comerciales inventadas.

La aplicación está desplegada en AWS Amplify, pero permanece en modo demo hasta configurar la URL del API Gateway y `VITE_USE_MOCKS=false`. Queda por verificar con el backend desplegado el acceso con JWT de administrador, las seis consultas de Athena, CORS y los flujos de compra y reseñas con datos persistentes.
