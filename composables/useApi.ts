export const useApi = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const apiFetch = async <T>(
    endpoint: string,
    options: Parameters<typeof $fetch>[1] = {}
  ): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (authStore.accessToken) {
      headers['Authorization'] = `Bearer ${authStore.accessToken}`
    }

    try {
      return await $fetch<T>(`${config.public.apiBase}${endpoint}`, {
        ...options,
        headers,
      })
    } catch (err: any) {
      // Si el token expiró, intenta renovar y reintentar
      if (err?.status === 401 && authStore.refreshToken) {
        const renewed = await authStore.refreshTokens()
        if (renewed) {
          headers['Authorization'] = `Bearer ${authStore.accessToken}`
          return await $fetch<T>(`${config.public.apiBase}${endpoint}`, {
            ...options,
            headers,
          })
        }
      }
      throw err
    }
  }

  return { apiFetch }
}
