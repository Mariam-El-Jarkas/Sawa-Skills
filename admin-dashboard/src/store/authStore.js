import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  admin: null,
  token: null,
  isAuthenticated: false,

  login: async (email, password) => {
    // Mock login — replace with real API call
    await new Promise(r => setTimeout(r, 800))
    if (email === 'admin@sawa.com' && password === 'admin123') {
      const admin = { id: 'A001', name: 'Platform Admin', email, role: 'super_admin' }
      const token = 'mock-jwt-token-' + Date.now()
      set({ admin, token, isAuthenticated: true })
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_data', JSON.stringify(admin))
      return true
    }
    return false
  },

  logout: () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_data')
    set({ admin: null, token: null, isAuthenticated: false })
  },
}))

// Rehydrate from localStorage on page reload
const token = localStorage.getItem('admin_token')
const adminData = localStorage.getItem('admin_data')
if (token && adminData) {
  useAuthStore.setState({ token, admin: JSON.parse(adminData), isAuthenticated: true })
}
