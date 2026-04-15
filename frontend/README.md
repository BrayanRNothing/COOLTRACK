# COOLTRACK Frontend

Arquitectura inicial enfocada en:

- Separacion clara por responsabilidades.
- Reutilizacion de componentes UI.
- Escalabilidad por modulos (features).
- Soporte de dos roles: Admin y Tecnico Contratista.

## Estructura

```text
src/
	app/
		AppRouter.jsx                 # Rutas principales
		layouts/
			AppShell.jsx                # Layout comun (header + nav)
		providers/
			AuthProvider.jsx            # Estado de sesion temporal por rol
		routes/
			ProtectedRoute.jsx          # Guard de rutas por autenticacion/rol

	features/
		admin/
			pages/
				AdminDashboardPage.jsx
				ClientsPage.jsx
				CondensersPage.jsx
		auth/
			pages/
				LoginPage.jsx
		common/
			pages/
				NotFoundPage.jsx
		technician/
			pages/
				TechnicianDashboardPage.jsx

	shared/
		mocks/
			workData.js                 # Datos de prueba iniciales
		ui/
			Button.jsx                  # Boton reutilizable
			DataTable.jsx               # Tabla reutilizable
			PageHeader.jsx              # Encabezado reutilizable

	App.jsx
	main.jsx
```

## Convenciones

- `app`: composicion global (rutas, providers, layout).
- `features`: logica y pantallas por modulo de negocio.
- `shared`: piezas reutilizables entre features.
- `pages`: vistas de ruta.

## Flujo actual

- Login rapido por rol (temporal, sin backend de auth).
- Admin:
	- Dashboard
	- Clientes
	- Condensadores (con regla visible de 3 mantenimientos por ano)
- Tecnico:
	- Dashboard de trabajos asignados

## Proximo paso recomendado

1. Conectar `AuthProvider` con autenticacion real del backend.
2. Reemplazar `shared/mocks/workData.js` por llamadas API (servicios por feature).
3. Agregar formularios en `features/admin` para crear clientes y condensadores.

## Comandos

```bash
npm install
npm run dev
npm run build
```
