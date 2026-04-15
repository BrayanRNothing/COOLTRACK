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
    <div className="grid min-h-[calc(100vh-8rem)] place-items-center">
      <section className="w-full max-w-xl rounded-2xl border border-base-300 bg-base-100 p-6 shadow-md sm:p-8">
        <p className="badge badge-primary mb-3">COOLTRACK</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Ingreso rapido por rol</h1>
        <p className="mt-2 text-base-content/70">
          Base inicial para continuar con autenticacion real cuando conectemos backend.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button className="w-full" onClick={() => handleRoleLogin('admin')}>
            Entrar como Admin
          </Button>
          <Button className="w-full" variant="outline" onClick={() => handleRoleLogin('technician')}>
            Entrar como Tecnico
          </Button>
        </div>
      </section>
    </div>
  )
}
