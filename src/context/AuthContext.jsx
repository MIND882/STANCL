import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [profile, setProfile]         = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading]         = useState(true)

  // ── Fetch profile + subscription after user is set ──
  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*, stores(*), subscriptions(*)')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data)
      setSubscription(data.subscriptions?.[0] ?? null)
    }
  }

  // ── Boot: check existing session ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setSubscription(null)
        }
      }
    )

    return () => authSub.unsubscribe()
  }, [])

  // ── Auth actions ──
  const signUp = async ({ email, password, username, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    return { data, error }
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // ── Check plan access ──
  const isPro = () => {
    return subscription?.plan === 'pro' && subscription?.status === 'active'
  }

  const isActive = () => {
    return subscription?.status === 'active' || subscription?.status === 'trialing'
  }

  return (
    <AuthContext.Provider value={{
      user, profile, subscription, loading,
      signUp, signIn, signInWithGoogle, signOut,
      isPro, isActive, refreshProfile: () => user && fetchProfile(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
