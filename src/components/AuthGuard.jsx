import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#ff4f17] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading…</p>
      </div>
    </div>
  )
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

export function RequireSubscription({ children }) {
  const { user, loading, subLoading, isActive } = useAuth()
  const location = useLocation()

  // ✅ Dono loading states ka wait karo
  if (loading || subLoading) return <Spinner />

  // ✅ User nahi hai toh login
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  // ✅ Subscription nahi hai toh pricing
  if (!isActive()) return <Navigate to="/pricing" replace />

  return children
}

export function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}