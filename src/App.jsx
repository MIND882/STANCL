import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { RequireAuth, RequireSubscription, RedirectIfAuth } from '@/components/AuthGuard'

// Pages
import Landing    from '@/pages/Landing'
import Login      from '@/pages/Login'
import Signup     from '@/pages/Signup'
import Pricing    from '@/pages/Pricing'
import Dashboard  from '@/pages/dashboard/Dashboard'
import StoreSetup from '@/pages/dashboard/StoreSetup'
import Products   from '@/pages/dashboard/Products'
import Analytics  from '@/pages/dashboard/Analytics'
import Settings   from '@/pages/dashboard/Settings'
import Store      from '@/pages/Store'
import NotFound   from '@/pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"        element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* ── Auth (redirect if already logged in) ── */}
        <Route path="/login"  element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
        <Route path="/signup" element={<RedirectIfAuth><Signup /></RedirectIfAuth>} />

        {/* ── Dashboard (requires auth + active subscription) ── */}
        <Route path="/dashboard" element={
          <RequireAuth>
            <RequireSubscription>
              <Dashboard />
            </RequireSubscription>
          </RequireAuth>
        }>
          {/* Nested dashboard routes render inside <Dashboard>'s <Outlet /> */}
          <Route index             element={<Analytics />} />
          <Route path="store"      element={<StoreSetup />} />
          <Route path="products"   element={<Products />} />
          <Route path="settings"   element={<Settings />} />
        </Route>

        {/* ── Public creator storefront ── */}
        {/* Path-based now → /store/username */}
        {/* When you add a domain, Vercel wildcard rewrites will hit this too */}
        <Route path="/store/:username" element={<Store />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
