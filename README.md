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
   cp .env.example .env
   docker compose up -d --build

5. Ejecutar la aplicación:

   npm run dev

   Disponible en http://localhost:5173

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| VITE_API_URL | Dirección base del API REST | http://localhost:3000/api |

## Datos que persiste la aplicación

(Se completa en Fase 0-B con la tabla de las 8 claves de localStorage.)

## Decisiones técnicas

(Se completa durante el desarrollo.)