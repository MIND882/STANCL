import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]                 = useState(null)
  const [profile, setProfile]           = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading]           = useState(true)
  const [subLoading, setSubLoading]     = useState(true)

  const fetchProfile = async (userId) => {
  // Dono queries parallel chalao — double fast!
  const [profileRes, subRes] = await Promise.all([
    supabase.from('profiles').select('*, stores(*)').eq('id', userId).single(),
    supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle()
  ])

  if (profileRes.data) setProfile(profileRes.data)
  setSubscription(subRes.data ?? null)
  setSubLoading(false)
}

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setSubLoading(false)
      }
      setLoading(false)
    }
    init()

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setSubscription(null)
          setSubLoading(false)
        }
      }
    )

    return () => authSub.unsubscribe()
  }, [])

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

  const isPro = () => {
    return subscription?.plan === 'pro' && subscription?.status === 'active'
  }

  const isActive = () => {
    return subscription?.status === 'active' || subscription?.status === 'trialing'
  }

  return (
    <AuthContext.Provider value={{
      user, profile, subscription, loading, subLoading,
      signUp, signIn, signInWithGoogle, signOut,
      isPro, isActive,
      refreshProfile: () => user && fetchProfile(user.id),
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