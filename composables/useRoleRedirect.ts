/**
 * Devuelve la ruta de inicio correcta según el rol del usuario.
 * Úsalo después de login / register para redirigir correctamente.
 */
export function useRoleRedirect() {
  const authStore = useAuthStore()

  function getHomeRoute(): string {
    const role = authStore.user?.role

    if (role === 'professor' || role === 'admin') {
      return '/profesor'
    }

    // Estudiante: si no completó diagnóstico, mandarlo ahí primero
    if (!authStore.user?.diagnosticCompleted) {
      return '/dashboard/diagnostic'
    }

    return '/dashboard'
  }

  async function redirectHome() {
    const router = useRouter()
    await router.push(getHomeRoute())
  }

  return { getHomeRoute, redirectHome }
}
