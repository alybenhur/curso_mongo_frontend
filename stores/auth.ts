import { defineStore } from 'pinia'

interface User {
  _id: string
  name: string
  email: string
  role: 'student' | 'admin'
  level: string
  xp: number
  streak: number
  diagnosticCompleted: boolean
  avatarUrl: string | null
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isStudent: (state) => state.user?.role === 'student',
    needsDiagnostic: (state) => state.user && !state.user.diagnosticCompleted,
  },

  actions: {
    setAuth(data: { user: User; accessToken: string; refreshToken: string }) {
      this.user = data.user
      this.accessToken = data.accessToken
      this.refreshToken = data.refreshToken
      // Persistir en localStorage
      if (process.client) {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    },

    loadFromStorage() {
      if (process.client) {
        const token = localStorage.getItem('accessToken')
        const refresh = localStorage.getItem('refreshToken')
        const user = localStorage.getItem('user')
        if (token && user) {
          this.accessToken = token
          this.refreshToken = refresh
          this.user = JSON.parse(user)
        }
      }
    },

    async login(email: string, password: string) {
      const config = useRuntimeConfig()
      this.loading = true
      this.error = null
      try {
        const data = await $fetch<{ user: User; accessToken: string; refreshToken: string }>(
          `${config.public.apiBase}/auth/login`,
          { method: 'POST', body: { email, password } }
        )
        this.setAuth(data)
        return data
      } catch (err: any) {
        this.error = err?.data?.message || 'Error al iniciar sesión'
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(name: string, email: string, password: string) {
      const config = useRuntimeConfig()
      this.loading = true
      this.error = null
      try {
        const data = await $fetch<{ user: User; accessToken: string; refreshToken: string }>(
          `${config.public.apiBase}/auth/register`,
          { method: 'POST', body: { name, email, password } }
        )
        this.setAuth(data)
        return data
      } catch (err: any) {
        this.error = err?.data?.message || 'Error al registrarse'
        throw err
      } finally {
        this.loading = false
      }
    },

    async refreshTokens() {
      const config = useRuntimeConfig()
      if (!this.refreshToken) return false
      try {
        const data = await $fetch<{ accessToken: string; refreshToken: string }>(
          `${config.public.apiBase}/auth/refresh`,
          { method: 'POST', body: { refreshToken: this.refreshToken } }
        )
        this.accessToken = data.accessToken
        this.refreshToken = data.refreshToken
        if (process.client) {
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
        }
        return true
      } catch {
        this.logout()
        return false
      }
    },

    logout() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.error = null
      if (process.client) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
    },
  },
})
