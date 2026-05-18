import { defineStore } from 'pinia'

export interface QueryResult {
  success: boolean
  result?: any
  error?: string
  executionTimeMs: number
  docsAffected: number
  queryType: string
}

export interface QueryHistoryItem {
  _id: string
  query: string
  success: boolean
  errorMessage: string | null
  executionTimeMs: number
  docsAffected: number
  stageOrder: number | null
  createdAt: string
}

export interface Snippet {
  label: string
  code: string
}

export const usePlaygroundStore = defineStore('playground', {
  state: () => ({
    query: '// Escribe tu query MongoDB aquí\n// Ctrl+Enter para ejecutar\n\ndb.miColeccion.find()',
    result: null as QueryResult | null,
    history: [] as QueryHistoryItem[],
    collections: [] as string[],
    snippets: [] as Snippet[],
    sandboxInfo: null as { sandboxDb: string; message: string } | null,
    executing: false,
    error: null as string | null,
    activeStage: 1,
  }),

  actions: {
    async execute(stageOrder?: number) {
      const { apiFetch } = useApi()
      if (!this.query.trim()) return
      this.executing = true
      this.error = null
      try {
        this.result = await apiFetch<QueryResult>('/playground/execute', {
          method: 'POST',
          body: { query: this.query, stageOrder: stageOrder ?? this.activeStage },
        })
        // Refrescar colecciones y historial
        await Promise.all([this.fetchCollections(), this.fetchHistory()])
      } catch (err: any) {
        this.error = err?.data?.message || 'Error al ejecutar la query'
      } finally {
        this.executing = false
      }
    },

    async fetchHistory() {
      const { apiFetch } = useApi()
      try {
        this.history = await apiFetch<QueryHistoryItem[]>('/playground/history?limit=30')
      } catch { /* silencioso */ }
    },

    async fetchCollections() {
      const { apiFetch } = useApi()
      try {
        this.collections = await apiFetch<string[]>('/playground/collections')
      } catch { /* silencioso */ }
    },

    async fetchSnippets(stage: number) {
      const { apiFetch } = useApi()
      try {
        this.snippets = await apiFetch<Snippet[]>(`/playground/snippets?stage=${stage}`)
        this.activeStage = stage
      } catch { /* silencioso */ }
    },

    async fetchSandboxInfo() {
      const { apiFetch } = useApi()
      try {
        this.sandboxInfo = await apiFetch('/playground/sandbox-info')
      } catch { /* silencioso */ }
    },

    async clearSandbox() {
      const { apiFetch } = useApi()
      try {
        await apiFetch('/playground/sandbox', { method: 'DELETE' })
        this.collections = []
        this.result = null
      } catch { /* silencioso */ }
    },

    loadSnippet(code: string) {
      this.query = code
    },

    loadFromHistory(item: QueryHistoryItem) {
      this.query = item.query
    },

    clearResult() {
      this.result = null
    },
  },
})
