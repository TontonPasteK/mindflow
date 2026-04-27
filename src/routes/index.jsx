import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import PublicRoute from './PublicRoute'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../context/AuthContext'

import Landing         from '../pages/Landing'
import Auth            from '../pages/Auth'
import Choice          from '../pages/Choice'
import Onboarding      from '../pages/Onboarding'
import DrMind          from '../pages/DrMind'
import AvatarTransition from '../pages/AvatarTransition'
import Session         from '../pages/Session'
import ParentDashboard from '../pages/ParentDashboard'
import ParentOnboarding from '../pages/ParentOnboarding'
import Pricing         from '../pages/Pricing'
import Settings        from '../pages/Settings'
import ResetPassword   from '../pages/ResetPassword'
import Legal           from '../pages/Legal'
import Privacy         from '../pages/Privacy'
import HowItWorks      from '../pages/HowItWorks'
import NotFound        from '../pages/NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/legal" element={<Legal />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/how-it-works" element={<HowItWorks />} />

      {/* Protected */}
      <Route path="/choice"            element={<ProtectedRoute><Choice /></ProtectedRoute>} />
      <Route path="/onboarding"        element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/drMind"            element={<ProtectedRoute><DrMind /></ProtectedRoute>} />
      <Route path="/avatar-transition" element={<ProtectedRoute><AvatarTransition /></ProtectedRoute>} />
      <Route path="/session"           element={<ProtectedRoute><Session /></ProtectedRoute>} />
      <Route path="/parent"            element={<ProtectedRoute><ParentDashboard /></ProtectedRoute>} />
      <Route path="/parent-onboarding" element={<ProtectedRoute><ParentOnboarding /></ProtectedRoute>} />
      <Route path="/settings"          element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Stripe return */}
      <Route path="/success" element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function SuccessPage() {
  const { isPremium, refreshProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isPremium) return
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      await refreshProfile()
      if (attempts >= 10) clearInterval(interval)
    }, 3000)
    return () => clearInterval(interval)
  }, [isPremium, refreshProfile])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '24px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '64px' }}>🎉</span>
      <h1 style={{ fontFamily: 'var(--f-title)', fontSize: '28px' }}>
        Bienvenue dans Premium !
      </h1>
      <p style={{ color: 'var(--text-2)', maxWidth: '380px' }}>
        Dr Mind va d'abord découvrir comment tu penses. Ça prend 20 minutes et ça change tout.
      </p>
      {!isPremium && (
        <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>
          Activation en cours...
        </p>
      )}
      <button
        onClick={() => navigate('/drMind?seance=1')}
        style={{
          padding: '14px 32px',
          background: '#6C63FF',
          color: 'white',
          borderRadius: '14px',
          fontWeight: '700',
          fontSize: '15px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Rencontrer Dr Mind →
      </button>
    </div>
  )
}
