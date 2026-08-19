import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthUser {
  name: string
  email: string
  role: string
}

interface AuthState {
  user: AuthUser | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const DUMMY_USER: AuthUser = {
  name: 'Admin',
  email: 'admin@hris.local',
  role: 'HR Administrator',
}

const STORAGE_KEY = 'hris.session'

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (sessionStorage.getItem(STORAGE_KEY) ? DUMMY_USER : null))

  const login = (email: string, password: string) => {
    if (!email.trim() || !password.trim()) return false
    sessionStorage.setItem(STORAGE_KEY, '1')
    setUser(DUMMY_USER)
    return true
  }

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
