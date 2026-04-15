import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './providers/useAuth'
import ProtectedRoute from './routes/ProtectedRoute'
import AppShell from './layouts/AppShell'
import LoginPage from '../features/auth/pages/LoginPage'
import ClientsPage from '../features/admin/pages/ClientsPage'
import ClientCondensersPage from '../features/admin/pages/ClientCondensersPage'
import CondenserProfilePage from '../features/admin/pages/CondenserProfilePage'
import TechniciansPage from '../features/admin/pages/TechniciansPage'
import TechnicianProfilePage from '../features/admin/pages/TechnicianProfilePage'
import TechnicianDashboardPage from '../features/technician/pages/TechnicianDashboardPage'
import TechnicianClientCondensersPage from '../features/technician/pages/TechnicianClientCondensersPage'
import TechnicianCondenserCapturePage from '../features/technician/pages/TechnicianCondenserCapturePage'
import NotFoundPage from '../features/common/pages/NotFoundPage'

function HomeRedirect() {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (currentUser.role === 'admin') {
    return <Navigate to="/admin/clientes" replace />
  }

  return <Navigate to="/tecnico/dashboard" replace />
}

export default function AppRouter() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/clientes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/clientes/:clientId/condensadores"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClientCondensersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/clientes/:clientId/condensadores/:condenserId"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CondenserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tecnicos"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TechniciansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tecnicos/:technicianId"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TechnicianProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tecnico/dashboard"
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <TechnicianDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tecnico/clientes/:clientId/condensadores"
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <TechnicianClientCondensersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tecnico/clientes/:clientId/condensadores/:condenserId/captura"
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <TechnicianCondenserCapturePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tecnico/mantenimientos/nuevo"
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <Navigate to="/tecnico/dashboard" replace />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}
