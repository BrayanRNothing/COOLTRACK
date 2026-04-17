import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './providers/useAuth'
import ProtectedRoute from './routes/ProtectedRoute'
import AppShell from './layouts/AppShell'
import LoginPage from '../features/auth/pages/LoginPage'
import ClientsPage from '../features/admin/pages/ClientsPage'
import ClientProfilePage from '../features/admin/pages/ClientProfilePage'
import ClientCondensersPage from '../features/admin/pages/ClientCondensersPage'
import CondenserProfilePage from '../features/admin/pages/CondenserProfilePage'
import TechniciansPage from '../features/admin/pages/TechniciansPage'
import AssignmentsPage from '../features/admin/pages/AssignmentsPage'
import TechnicianDashboardPage from '../features/technician/pages/TechnicianDashboardPage'
import TechnicianTaskClientProfilePage from '../features/technician/pages/TechnicianTaskClientProfilePage'
import TechnicianHistoryPage from '../features/technician/pages/TechnicianHistoryPage'
import MaintenanceRegisterPage from '../features/technician/pages/MaintenanceRegisterPage'
import NotFoundPage from '../features/common/pages/NotFoundPage'

function HomeRedirect() {
  const { currentUser, loading } = useAuth()
  if (loading) return null
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.rol === 'ADMIN') return <Navigate to="/admin/clientes" replace />
  return <Navigate to="/tecnico/dashboard" replace />
}

const adminOnly = ['admin']
const techOnly = ['technician']

export default function AppRouter() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin */}
        <Route path="/admin/clientes" element={<ProtectedRoute allowedRoles={adminOnly}><ClientsPage /></ProtectedRoute>} />
        <Route path="/admin/clientes/:clientId" element={<ProtectedRoute allowedRoles={adminOnly}><ClientProfilePage /></ProtectedRoute>} />
        <Route path="/admin/clientes/:clientId/condensadores" element={<ProtectedRoute allowedRoles={adminOnly}><ClientCondensersPage /></ProtectedRoute>} />
        <Route path="/admin/clientes/:clientId/condensadores/:condenserId" element={<ProtectedRoute allowedRoles={adminOnly}><CondenserProfilePage /></ProtectedRoute>} />
        <Route path="/admin/tecnicos" element={<ProtectedRoute allowedRoles={adminOnly}><TechniciansPage /></ProtectedRoute>} />
        <Route path="/admin/asignaciones" element={<ProtectedRoute allowedRoles={adminOnly}><AssignmentsPage /></ProtectedRoute>} />

        {/* Technician */}
        <Route path="/tecnico/dashboard" element={<ProtectedRoute allowedRoles={techOnly}><TechnicianDashboardPage /></ProtectedRoute>} />
        <Route path="/tecnico/dashboard/mision/:asignacionId" element={<ProtectedRoute allowedRoles={techOnly}><TechnicianTaskClientProfilePage /></ProtectedRoute>} />
        <Route path="/tecnico/mantenimientos/nuevo" element={<ProtectedRoute allowedRoles={techOnly}><MaintenanceRegisterPage /></ProtectedRoute>} />
        <Route path="/tecnico/historial" element={<ProtectedRoute allowedRoles={techOnly}><TechnicianHistoryPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}
