import { defineStore } from 'pinia'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  tokens?: { input: number; output: number }
}

export const useAiStore = defineStore('ai', {
  state: () => ({
    hasKey: false,
    messages: [] as ChatMessage[],
    loading: false,
    error: null as string | null,
    isOpen: false,
    // Contexto de la lección activa
    context: {
      lessonTitle: '',
      lessonContent: '',
      stageOrder: 0,
      stageName: '',
    },
  }),

  actions: {
    // ── Gestión de API key ────────────────────────────────────────────────

    async checkKeyStatus() {
      const { apiFetch } = useApi()
      try {
        const { hasKey } = await apiFetch<{ hasKey: boolean }>('/ai/key/status')
        this.hasKey = hasKey
      } catch {
        this.hasKey = false
      }
    },

    async setKey(apiKey: string) {
      const { apiFetch } = useApi()
      this.error = null
      try {
        await apiFetch('/ai/key', {
          method: 'POST',
          body: { apiKey },
        })
        this.hasKey = true
        this.messages = []
      } catch (err: any) {
        this.error = err?.data?.message || 'Error al configurar la API key'
        throw err
      }
    },

    async clearKey() {
      const { apiFetch } = useApi()
      try {
        await apiFetch('/ai/key', { method: 'DELETE' })
      } catch { /* silencioso */ }
      this.hasKey = false
      this.messages = []
    },

    // ── Chat ──────────────────────────────────────────────────────────────

    async sendMessage(message: string) {
      if (!this.hasKey || !message.trim()) return
      const { apiFetch } = useApi()

      // Agregar mensaje del usuario al historial
      this.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
      })

      this.loading = true
      this.error = null

      try {
        // Construir historial para enviar al backend (sin timestamps)
        const history = this.messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const { reply, inputTokens, outputTokens } = await apiFetch<{
          reply: string
          inputTokens: number
          outputTokens: number
        }>('/ai/chat', {
          method: 'POST',
          body: {
            message,
            ...this.context,
            history: history.slice(0, -1), // excluir el mensaje actual
          },
        })

        this.messages.push({
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
          tokens: { input: inputTokens, output: outputTokens },
        })
      } catch (err: any) {
        const errMsg = err?.data?.message || 'Error al contactar el asistente'
        this.error = errMsg
        // Si la key es inválida, marcarla como inactiva
        if (err?.status === 401) {
          this.hasKey = false
        }
        this.messages.push({
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
          timestamp: new Date(),
        })
      } finally {
        this.loading = false
      }
    },

    // ── Revisión de modelado ──────────────────────────────────────────────

    async reviewModeling(requirements: string, schema: string): Promise<string> {
      const { apiFetch } = useApi()
      this.loading = true
      this.error = null
      try {
        const { reply } = await apiFetch<{ reply: string; inputTokens: number; outputTokens: number }>(
          '/ai/review-modeling',
          { method: 'POST', body: { requirements, schema } },
        )
        return reply
      } catch (err: any) {
        this.error = err?.data?.message || 'Error al revisar el modelado'
        if (err?.status === 401) this.hasKey = false
        throw err
      } finally {
        this.loading = false
      }
    },

    // ── Contexto y UI ─────────────────────────────────────────────────────

    setContext(ctx: {
      lessonTitle?: string
      lessonContent?: string
      stageOrder?: number
      stageName?: string
    }) {
      if (ctx.lessonTitle !== undefined) this.context.lessonTitle = ctx.lessonTitle
      if (ctx.lessonContent !== undefined) this.context.lessonContent = ctx.lessonContent
      if (ctx.stageOrder !== undefined) this.context.stageOrder = ctx.stageOrder
      if (ctx.stageName !== undefined) this.context.stageName = ctx.stageName
    },

    openChat() { this.isOpen = true },
    closeChat() { this.isOpen = false },
    toggleChat() { this.isOpen = !this.isOpen },
    clearMessages() { this.messages = [] },
  },
})
