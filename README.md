# LasDosCaras

Aplicación web de una sola página que presenta las dos perspectivas de cualquier tema.
Proyecto Final del curso ISW-521 Programación en Ambiente Web I, II Cuatrimestre 2026,
Universidad Técnica Nacional.

## Integrantes

- Brandon Prado Mora
- Daniela Rojas Chaves
- Luis Carlos Jiménez Rodriguez

## Tecnologías

- Vue 3 (Composition API con <script setup>)
- TypeScript en modo estricto
- Vite
- Vue Router 4
- Pinia
- CSS con variables nativas

## Requisitos previos

- Node.js 18 o superior
- Docker Desktop (para levantar el API)

## Instalación

1. Clonar el repositorio:

   git clone https://github.com/dnrojas1012/lasdoscaras.git
   cd lasdoscaras

2. Instalar dependencias:

   npm install

3. Crear el archivo .env a partir del ejemplo:

   cp .env.example .env

   Y completar la variable:

   VITE_API_URL=http://localhost:3000/api

4. Levantar el API del curso (en otra carpeta):

   git clone https://github.com/barroyo/doscarasapi.git
   cd doscarasapi
   docker compose up -d --build

   Nota: el repositorio del API no incluye un archivo .env.example. 
   Es necesario crear manualmente un archivo .env en la raíz de doscarasapi
   con las variables JWT_SECRET, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD,
   SUPERADMIN_NAME y RUN_SEED. Además, en Windows hay que configurar
   git config --global core.autocrlf input antes de clonar, o el archivo
   docker-entrypoint.sh no se ejecuta dentro del contenedor.

5. Ejecutar la aplicación:

   npm run dev

   Disponible en http://localhost:5173

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| VITE_API_URL | Dirección base del API REST | http://localhost:3000/api |

## Datos que persiste la aplicación

Todo el acceso a `localStorage` pasa por `src/services/cacheService.ts`.
Ningún componente lo toca directamente.

Cada entrada se guarda con la estructura `{ value, timestamp }`. La marca de
tiempo es necesaria porque `localStorage` no tiene vencimiento propio: es la
única forma de calcular después si un dato sigue vigente.

| Clave | Contenido | Vencimiento |
|---|---|---|
| `lasdoscaras_auth` | Token JWT y datos del usuario autenticado | Permanente (se borra al cerrar sesión o al recibir un 401) |
| `lasdoscaras_categories` | Listado de categorías | 1 hora |
| `lasdoscaras_hashtags` | Hashtags disponibles | 30 minutos |
| `lasdoscaras_filters` | Últimos filtros aplicados en el tablero | Permanente |
| `lasdoscaras_favorites` | Publicaciones marcadas como favoritas | Permanente (se borra al cerrar sesión) |
| `lasdoscaras_draft` | Borrador del formulario de publicación | Permanente (se borra al publicar) |
| `lasdoscaras_theme` | Preferencia de tema claro u oscuro | Permanente |
| `lasdoscaras_history` | Últimas 20 publicaciones visitadas | Permanente (FIFO, máximo 20 entradas) |

El servicio expone `get()`, que respeta el vencimiento, y `getStale()`, que lo
ignora. El segundo se usa en modo sin conexión: mostrar información guardada
con un aviso es preferible a mostrar una pantalla en blanco.

## Decisiones técnicas

### Elección del framework

Se eligió Vue 3 con Composition API y `<script setup>`. El equipo no tenía
experiencia previa con ningún framework, y Vue ofrece la menor superficie
conceptual: la reactividad se resuelve con `ref` y `computed`, el template es
sintaxis HTML extendida, y trae decisiones ya tomadas (router oficial, Pinia
como store, CSS con `scoped`) que en otros frameworks habría que investigar
por separado.

### Documentación del API frente al código real

El `README.md` del repositorio del API documenta rutas bajo
`/api/political-views`, pero el código expone `/api/views`. La colección de
Postman incluida en ese mismo repositorio refleja las rutas reales, y es la
que se tomó como fuente. Los parámetros de paginación también difieren: son
`page` y `limit`, no `page` y `pageSize`.

### Distinción del código 401 según el contexto

El API devuelve 401 tanto para credenciales inválidas en el login como para
un token vencido en cualquier otra ruta. Tratarlos igual producía dos
problemas: se mostraba "Su sesión ha expirado" a quien nunca había iniciado
sesión, y se disparaba el cierre de sesión sin que hubiera sesión activa.

`apiClient.ts` distingue ambos casos por la ruta donde ocurre el error. En
`/auth/login` y `/auth/register` muestra "Correo o contraseña incorrectos" sin
tocar el estado de sesión. En cualquier otra ruta limpia la sesión y redirige
al login.

### Registro de cuentas en dos pasos

Las cuentas creadas nacen en estado `PENDING` y no pueden iniciar sesión hasta
activarse. El registro devuelve un `activationToken` que debe enviarse a
`GET /api/auth/activate/:token`. En un despliegue real ese token llegaría por
correo electrónico; en este entorno viene en la respuesta.

La pantalla de registro encadena las tres llamadas (registrar, activar,
iniciar sesión) de forma transparente para el usuario.

### Importación circular entre el cliente HTTP y el store de sesión

`auth.store.ts` importa `apiClient.ts` para realizar el login. Si `apiClient`
importara el store para cerrar la sesión ante un 401, ninguno de los dos
módulos podría cargar.

Se resolvió invirtiendo la dependencia: `apiClient` expone
`setUnauthorizedHandler()`, y `main.ts` le entrega la función de cierre de
sesión al arrancar la aplicación.

### Reintento automático limitado a peticiones GET

Ante un fallo de red, `apiClient` reintenta una vez tras 500 ms, pero solo en
peticiones GET. Un GET solo lee y repetirlo no tiene efectos secundarios;
repetir un POST podría crear dos publicaciones o dos cuentas.

### Aplicación del tema antes del primer renderizado

La preferencia de tema se aplica mediante un script en `index.html` que se
ejecuta antes de que Vue arranque. Si se aplicara desde un componente, la
página se mostraría un instante en tema claro antes de cambiar a oscuro. Ese
parpadeo se conoce como FOUC.

### Notas sobre el entorno del API

Dos ajustes necesarios para levantar el API del curso, documentados en la
sección de instalación:

- El repositorio no incluye `.env.example`, pese a que su README indica
  copiarlo. El archivo `.env` debe crearse manualmente.
- En Windows es necesario ejecutar `git config --global core.autocrlf input`
  antes de clonar. Sin eso, Git convierte los finales de línea de
  `docker-entrypoint.sh` y el contenedor no logra ejecutarlo.