import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, getUser, getProfile } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authUser, setAuthUser]     = useState(null)
  const [user, setUser]             = useState(null)
  const [profile, setProfile]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const loadUserData = useCallback(async (authUid) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const [userResult, profileResult] = await Promise.allSettled([
          getUser(authUid),
          getProfile(authUid),
        ])

        if (userResult.status === 'fulfilled') {
          const userData = userResult.value
          setUser(userData)
          setProfile(profileResult.status === 'fulfilled' ? profileResult.value : null)
          console.log('[Auth] user chargé:', userData?.email, '| plan:', userData?.plan, '| isPremium:', userData?.plan === 'premium')
          console.log('[Auth] profile:', profileResult.status === 'fulfilled' ? JSON.stringify(profileResult.value) : 'FAILED - ' + profileResult.reason?.message)
          if (profileResult.status === 'rejected') {
            console.warn('[Auth] getProfile failed:', profileResult.reason?.message, profileResult.reason?.code)
          }
          return
        }

        throw userResult.reason
      } catch (err) {
        console.error(`[Auth] loadUserData attempt ${attempt + 1} failed:`, err.code, err.message)
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 1000))
        }
      }
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        setAuthUser(session?.user ?? null)
        if (session?.user) {
          await loadUserData(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setIsLoggingOut(false)
        }
        setLoading(false)
      }
    )

    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 5000)

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [loadUserData])

  const refreshProfile = useCallback(async () => {
    if (!authUser) return
    const [userResult, profileResult] = await Promise.allSettled([
      getUser(authUser.id),
      getProfile(authUser.id),
    ])
    if (userResult.status === 'fulfilled') setUser(userResult.value)
    if (profileResult.status === 'fulfilled') setProfile(profileResult.value)
  }, [authUser])

  // Détection rôle depuis profil Supabase (BLOC 10)
  const role = profile?.role || 'eleve'

  const value = {
    authUser,
    user,
    profile,
    loading,
    plan: user?.plan === 'premium' ? 'premium' : 'free',
    isPremium: user?.plan === 'premium',
    isParent: role === 'parent',
    isEleve: role === 'eleve',
    role,
    isLoggingOut,
    setIsLoggingOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
