import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import Button from '../../../shared/ui/Button'

export default function LoginPage() {
  const { loginAs } = useAuth()
  const navigate = useNavigate()

  const handleRoleLogin = (role) => {
    loginAs(role)
    if (role === 'admin') {
      navigate('/admin/clientes')
      return
    }

    navigate('/tecnico/dashboard')
  }

  return (
    <section className="relative isolate min-h-[calc(100vh-7rem)] overflow-hidden rounded-3xl bg-gradient-to-br from-base-200 via-base-100 to-base-200 px-4 py-8 sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />

      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-6 rounded-3xl border border-base-300/70 bg-base-100/90 p-5 shadow-xl backdrop-blur sm:p-8 lg:grid-cols-[1.2fr_1fr]">
          <article className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-semibold tracking-wide">
              <span className="h-2 w-2 rounded-full bg-success" />
              COOLTRACK ACCESS
            </div>

            <div>
              <h1 className="text-3xl font-black leading-tight sm:text-5xl">
                Control de recubrimientos
                <span className="block text-primary">con ingreso por rol</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm text-base-content/70 sm:text-base">
                Selecciona el perfil de trabajo para entrar directo a tus modulos. La interfaz esta
                optimizada para operacion administrativa y ejecucion tecnica en campo.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-base-300 bg-base-100 p-3">
                <p className="text-xs text-base-content/60">Flujo admin</p>
                <p className="mt-1 text-lg font-semibold">Clientes y tecnicos</p>
              </div>
              <div className="rounded-2xl border border-base-300 bg-base-100 p-3">
                <p className="text-xs text-base-content/60">Flujo tecnico</p>
                <p className="mt-1 text-lg font-semibold">Recubrimientos y evidencia</p>
              </div>
              <div className="rounded-2xl border border-base-300 bg-base-100 p-3">
                <p className="text-xs text-base-content/60">Seguimiento</p>
                <p className="mt-1 text-lg font-semibold">Trazabilidad por cliente</p>
              </div>
            </div>
          </article>

          <aside className="grid gap-4">
            <article className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Perfil 01</p>
              <h2 className="mt-1 text-xl font-bold">Administrador</h2>
              <p className="mt-2 text-sm text-base-content/70">
                Gestion de clientes, carga de condensadores, asignaciones masivas y control operativo.
              </p>
              <Button className="mt-4 w-full" onClick={() => handleRoleLogin('admin')}>
                Entrar como Admin
              </Button>
            </article>

            <article className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Perfil 02</p>
              <h2 className="mt-1 text-xl font-bold">Tecnico contratista</h2>
              <p className="mt-2 text-sm text-base-content/70">
                Atencion de trabajos asignados por cliente, registro de geolocalizacion, fecha y fotos.
              </p>
              <Button className="mt-4 w-full" variant="outline" onClick={() => handleRoleLogin('technician')}>
                Entrar como Tecnico
              </Button>
            </article>
          </aside>
        </div>
      </div>
    </section>
  )
}
