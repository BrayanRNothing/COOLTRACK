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
R2_ACCOUNT_ID="tu_account_id_de_cloudflare"
R2_ACCESS_KEY_ID="tu_access_key_id"
R2_SECRET_ACCESS_KEY="tu_secret_access_key"
R2_BUCKET_NAME="nombre_del_bucket"
R2_PUBLIC_URL="https://tu-dominio-publico-o-bucket.r2.dev"

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
7. Define R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME y R2_PUBLIC_URL.
8. Start Command sugerido: npm run start.

### Bloque listo para Railway

```env
PORT=4000
DATABASE_URL=postgresql://...
JWT_SECRET=una_clave_larga_y_unica
R2_ACCOUNT_ID=tu_account_id
R2_ACCESS_KEY_ID=tu_access_key_id
R2_SECRET_ACCESS_KEY=tu_secret_access_key
R2_BUCKET_NAME=tu_bucket
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev
```

### URL pública de R2

Usa una de estas formas:

```text
https://pub-<bucket-id>.r2.dev
https://cdn.tudominio.com  (si conectas un dominio propio al bucket)
```

Si usas el dominio `r2.dev`, las imágenes se verán directo con la URL que devuelve el backend. Si conectas un dominio propio o subdominio, pon ese dominio en `R2_PUBLIC_URL`.

## PostgreSQL y fotos

La tabla `mantenimientos` ya guarda solo URLs en los campos `foto1Url`, `foto2Url` y `foto3Url`.
No se guardan blobs en la base de datos; el backend sube el archivo directo a Cloudflare R2 y persiste únicamente la URL pública devuelta por el bucket.

Para frontend, puedes desplegarlo en Vercel/Netlify o tambien en Railway como servicio estatico.
