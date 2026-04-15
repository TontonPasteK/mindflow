import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, getUser, getProfile } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authUser, setAuthUser]     = useState(null)  // Supabase auth user
  const [user, setUser]             = useState(null)  // public.users row
  const [profile, setProfile]       = useState(null)  // public.profiles row
  const [loading, setLoading]         = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const loadUserData = useCallback(async (authUid) => {
    // Retry once after 1s to handle async DB trigger on first signup
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
          // ← diagnostic log visible in browser console after every login
          console.log('[Auth] user chargé:', userData?.email, '| plan:', userData?.plan, '| isPremium:', userData?.plan === 'premium')
          if (profileResult.status === 'rejected') {
            console.warn('[Auth] getProfile failed (non-blocking):', profileResult.reason?.message, profileResult.reason?.code)
          }
          return
        }

        // getUser itself failed — retry
        throw userResult.reason
      } catch (err) {
        console.error(`[Auth] loadUserData attempt ${attempt + 1} failed — code:`, err.code, '| msg:', err.message)
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 1000))
        }
      }
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Supabase v2 canonical pattern: onAuthStateChange fires INITIAL_SESSION
    // on mount, replacing the need for a separate getSession() call.
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

    // Safety net: never stay stuck on loading more than 5s
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

  const value = {
    authUser,
    user,
    profile,
    loading,
    plan: user?.plan === 'premium' ? 'premium' : 'free',
    isPremium: user?.plan === 'premium',
    isParent: user?.role === 'parent',
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
