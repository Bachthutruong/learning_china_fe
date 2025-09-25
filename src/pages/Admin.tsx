import { AdminLayout } from '../layouts/AdminLayout'
import { AdminDashboard } from './admin/Dashboard'

export const Admin = () => {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  )
}