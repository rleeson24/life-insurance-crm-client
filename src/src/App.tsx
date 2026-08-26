import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AdminTenantsPage } from '@/pages/AdminTenantsPage'
import { AdminUsersPage } from '@/pages/AdminUsersPage'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EditClientPage } from '@/pages/EditClientPage'
import { NewClientPage } from '@/pages/NewClientPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<NewClientPage />} />
        <Route path="clients/:id/edit" element={<EditClientPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/tenants" element={<AdminTenantsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
