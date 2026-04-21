# COOLTRACK

Monorepo base con:

- Frontend: React + Vite + React Router + Tailwind CSS v4 + DaisyUI
- Backend: Node.js + Express + Prisma
- Base de datos: PostgreSQL (pensado para Railway)

## Estructura

- frontend
- backend

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL local (opcional para desarrollo)
- Cuenta en Railway para despliegue

## Variables de entorno

Frontend en frontend/.env:

VITE_API_URL="http://localhost:4000/api"

Backend en backend/.env:

PORT=4000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public"
JWT_SECRET="cambia_esto_en_produccion"
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"

## Comandos

Desde la raiz del proyecto:

- npm run dev: levanta frontend y backend al mismo tiempo
- npm run dev:frontend: levanta solo frontend
- npm run dev:backend: levanta solo backend
- npm run build: compila el frontend
- npm run start: inicia backend en modo produccion

## Prisma

Dentro de backend:

- npm run prisma:generate
- npm run prisma:migrate
- npm run prisma:studio

Nota: cuando me pases tu esquema, lo integro en backend/prisma/schema.prisma y dejo migraciones listas.

## Railway (resumen rapido)

1. Crea proyecto en Railway.
2. Agrega servicio PostgreSQL.
3. Agrega servicio para backend apuntando a carpeta backend.
4. Define variable DATABASE_URL con la que provee Railway.
5. Define variable PORT (Railway normalmente la inyecta; el backend ya la lee).
6. Define JWT_SECRET.
7. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.
8. Start Command sugerido: npm run start.

## PostgreSQL y fotos

La tabla `mantenimientos` ya guarda solo URLs en los campos `foto1Url`, `foto2Url` y `foto3Url`.
No se guardan blobs en la base de datos; el backend sube el archivo directo a Cloudinary y persiste únicamente la URL pública devuelta por el servicio.

Para frontend, puedes desplegarlo en Vercel/Netlify o tambien en Railway como servicio estatico.
