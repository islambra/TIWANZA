import { createContext, useContext, useMemo } from 'react'
import { useTiwanzaStore } from '../data/store.js'
import * as services from '../data/services.js'
import { getTrainerProfile } from '../data/selectors.js'

const AuthContext = createContext(null)

export const roleHome = {
  admin: '/admin',
  trainer: '/trainer',
  learner: '/learn',
}

export function AuthProvider({ children }) {
  const state = useTiwanzaStore()
  const user = state.session ? state.users.find((item) => item.id === state.session.userId) || null : null
  const profile = user?.role === 'trainer' ? getTrainerProfile(state, user.id) : null

  const value = useMemo(
    () => ({
      user,
      profile,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isTrainer: user?.role === 'trainer',
      isLearner: user?.role === 'learner',
      login: services.login,
      demoLogin: services.demoLogin,
      logout: services.logout,
      registerLearner: services.registerLearner,
      registerTrainer: services.registerTrainer,
      updateUser: services.updateUser,
      home: user ? roleHome[user.role] : '/login',
    }),
    [user, profile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
