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

export interface AtlasStatus {
  configured: boolean
  connected: boolean
  dbName: string | null
}

export const usePlaygroundStore = defineStore('playground', {
  state: () => ({
    query: '// Escribe tu query MongoDB aquí\n// Ctrl+Enter para ejecutar\n\ndb.miColeccion.find()',
    result: null as QueryResult | null,
    history: [] as QueryHistoryItem[],
    collections: [] as string[],
    snippets: [] as Snippet[],
    sandboxInfo: null as { dbName: string; message: string } | null,
    atlasStatus: null as AtlasStatus | null,
    executing: false,
    savingUri: false,
    error: null as string | null,
    activeStage: 1,
  }),

  getters: {
    /** true cuando el estudiante no tiene Atlas configurado */
    needsAtlasSetup: (state): boolean =>
      state.atlasStatus !== null && !state.atlasStatus.configured,
  },

  actions: {
    // ── Atlas URI ──────────────────────────────────────────────────────────

    async checkAtlasStatus() {
      const { apiFetch } = useApi()
      try {
        this.atlasStatus = await apiFetch<AtlasStatus>('/users/me/atlas-uri/status')
      } catch {
        this.atlasStatus = { configured: false, connected: false, dbName: null }
      }
    },

    async saveAtlasUri(uri: string): Promise<{ dbName: string }> {
      const { apiFetch } = useApi()
      this.savingUri = true
      this.error = null
      try {
        const res = await apiFetch<{ dbName: string }>('/users/me/atlas-uri', {
          method: 'POST',
          body: { uri },
        })
        // Invalidar cache de conexión anterior y refrescar estado
        this.atlasStatus = { configured: true, connected: true, dbName: res.dbName }
        this.sandboxInfo = { dbName: res.dbName, message: 'Conectado a tu MongoDB Atlas' }
        return res
      } catch (err: any) {
        this.error = err?.data?.message || 'No se pudo conectar a Atlas'
        throw err
      } finally {
        this.savingUri = false
      }
    },

    async removeAtlasUri() {
      const { apiFetch } = useApi()
      try {
        await apiFetch('/users/me/atlas-uri', { method: 'DELETE' })
        this.atlasStatus = { configured: false, connected: false, dbName: null }
        this.sandboxInfo = null
        this.collections = []
        this.result = null
      } catch { /* silencioso */ }
    },

    // ── Playground ─────────────────────────────────────────────────────────

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

    loadSnippet(code: string) { this.query = code },
    loadFromHistory(item: QueryHistoryItem) { this.query = item.query },
    clearResult() { this.result = null },
  },
})
