import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const USERNAME_RE = /^[a-z0-9_]{3,30}$/

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]             = useState({ email: '', password: '', username: '', fullName: '' })
  const [loading, setLoading]       = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [usernameState, setUsernameState] = useState('idle') // idle | checking | taken | available

  // ── Debounce username availability check ──
  useEffect(() => {
    if (!form.username || !USERNAME_RE.test(form.username)) {
      setUsernameState('idle')
      return
    }
    setUsernameState('checking')
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('stores')
        .select('username')
        .eq('username', form.username)
        .maybeSingle()

      setUsernameState(data ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(timer)
  }, [form.username])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (usernameState === 'taken') return toast.error('That username is already taken.')
    if (!USERNAME_RE.test(form.username)) return toast.error('Username must be 3–30 chars: a-z, 0-9, underscore.')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters.')

    setLoading(true)
    const { error } = await signUp(form)
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Account created! Check your email to confirm.')
    navigate('/pricing')
  }

  const handleGoogle = async () => {
    setGoogleLoad(true)
    const { error } = await signInWithGoogle()
    if (error) { toast.error(error.message); setGoogleLoad(false) }
  }

  const usernameHelp = () => {
    if (!form.username) return null
    if (!USERNAME_RE.test(form.username)) return <span className="text-xs text-gray-400">3–30 chars: letters, numbers, underscore</span>
    if (usernameState === 'checking')  return <span className="text-xs text-gray-400">Checking…</span>
    if (usernameState === 'taken')     return <span className="text-xs text-red-500">⚠ Username taken</span>
    if (usernameState === 'available') return <span className="text-xs text-green-600">✓ Available</span>
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="w-9 h-9 bg-[#ff4f17] rounded-xl flex items-center justify-center text-white font-bold text-lg">S</span>
          <span className="text-2xl font-display font-bold text-gray-900">Stan</span>
        </Link>
        <h1 className="mt-6 text-3xl font-display font-bold text-gray-900">Create your store</h1>
        <p className="mt-2 text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#ff4f17] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoad}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-150 disabled:opacity-50 mb-6"
          >
            {googleLoad ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 font-medium uppercase tracking-wide">or</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" required value={form.fullName}
                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Alex Johnson" className="input" />
            </div>
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input type="text" required value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))}
                  placeholder="alexcreates" className="input pl-7" />
              </div>
              <div className="mt-1">{usernameHelp()}</div>
              {form.username && USERNAME_RE.test(form.username) && usernameState === 'available' && (
                <p className="text-xs text-gray-400 mt-1">
                  Your store: <span className="font-medium text-gray-600">yourapp.vercel.app/store/{form.username}</span>
                </p>
              )}
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" required autoComplete="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com" className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required autoComplete="new-password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min. 8 characters" className="input" />
            </div>
            <button type="submit" disabled={loading || usernameState === 'taken'} className="btn-accent w-full mt-2">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating your store…
                </span>
              ) : 'Create free account →'}
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">
              By signing up you agree to our{' '}
              <Link to="/terms" className="underline">Terms</Link> and{' '}
              <Link to="/privacy" className="underline">Privacy Policy</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
