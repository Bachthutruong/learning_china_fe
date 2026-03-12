import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
  requireReviewer?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false, requireReviewer = false }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const userRole = user.role?.toString().toLowerCase()
  const isAdmin = userRole === 'admin'
  const isReviewer = !!user.isReviewer || isAdmin

  // If page requires Admin, only 'admin' role allowed
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  // If page requires Reviewer, either 'admin' or 'isReviewer' flag allowed
  if (requireReviewer && !isReviewer) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}


