import { create } from 'zustand'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export const useAuthStore = create((set) => ({
  admin: null,
  token: null,
  isAuthenticated: false,

  login: async (email, password) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (res.ok) {
        const data = await res.json()
        const admin = { 
          id: data.userId, 
          name: data.name, 
          email: data.email, 
          role: data.role 
        }
        const token = data.accessToken
        
        set({ admin, token, isAuthenticated: true })
        localStorage.setItem('admin_token', token)
        localStorage.setItem('admin_data', JSON.stringify(admin))
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_data')
    set({ admin: null, token: null, isAuthenticated: false })
  },
}))

// Rehydrate from localStorage on page reload
const storedToken = localStorage.getItem('admin_token')
const adminData = localStorage.getItem('admin_data')
if (storedToken && adminData) {
  useAuthStore.setState({ token: storedToken, admin: JSON.parse(adminData), isAuthenticated: true })
}
