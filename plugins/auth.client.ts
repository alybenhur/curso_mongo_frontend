/**
 * Plugin CLIENT-ONLY:
 * Carga el usuario/tokens desde localStorage antes de que cualquier
 * componente se monte. Así las directivas v-if que dependen de
 * authStore.user (como el enlace "👨‍🏫 Profesor") funcionan correctamente
 * desde el primer render en el cliente y no quedan ocultas por un
 * desajuste de hidratación SSR.
 */
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  authStore.loadFromStorage()
})
