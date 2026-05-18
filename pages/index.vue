<script setup lang="ts">
// Redirigir a login o dashboard según autenticación
const authStore = useAuthStore()
authStore.loadFromStorage()

if (authStore.isAuthenticated) {
  await navigateTo('/dashboard')
} else {
  await navigateTo('/auth/login')
}
</script>
