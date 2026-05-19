export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  authStore.loadFromStorage()

  if (!authStore.isAuthenticated) {
    return navigateTo('/auth/login')
  }

  const role = authStore.user?.role
  if (role !== 'professor' && role !== 'admin') {
    return navigateTo('/dashboard')
  }
})
