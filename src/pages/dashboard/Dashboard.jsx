import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/dashboard',          end: true,  icon: '📊', label: 'Analytics' },
  { to: '/dashboard/store',    end: false, icon: '🛍️', label: 'My Store' },
  { to: '/dashboard/products', end: false, icon: '📦', label: 'Products' },
  { to: '/dashboard/settings', end: false, icon: '⚙️', label: 'Settings' },
]

export default function Dashboard() {
  const { profile, signOut, user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out.')
    navigate('/')
  }

  const storeUsername = profile?.stores?.[0]?.username

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-[#ff4f17] rounded-lg flex items-center justify-center text-white font-bold">S</span>
            <span className="font-display font-bold text-gray-900">Stan</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, end, icon, label }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="text-base leading-none">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4 space-y-1 border-t border-gray-100 pt-3">
          {storeUsername && (
            <a href={`/store/${storeUsername}`} target="_blank" rel="noreferrer"
              className="sidebar-link text-[#ff4f17]">
              <span className="text-base leading-none">🔗</span>View store
            </a>
          )}
          <button onClick={handleSignOut}
            className="sidebar-link w-full text-left text-red-400 hover:text-red-600 hover:bg-red-50">
            <span className="text-base leading-none">👋</span>Sign out
          </button>
        </div>
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4f17] to-[#ff3b9a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{profile?.full_name || 'Creator'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto"><Outlet /></main>
    </div>
  )
}
