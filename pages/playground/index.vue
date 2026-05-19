<template>
  <div class="playground-page">

    <!-- ── Modal configuración Atlas ───────────────────────────────────────── -->
    <div v-if="showAtlasSetup" class="modal-overlay">
      <div class="modal atlas-modal">
        <div class="atlas-modal-header">
          <span class="atlas-icon">🍃</span>
          <div>
            <h3>Conecta tu MongoDB Atlas</h3>
            <p>El Playground ejecuta las queries en tu propia base de datos Atlas.</p>
          </div>
        </div>

        <div class="atlas-steps">
          <div class="atlas-step">
            <span class="step-num">1</span>
            <span>Ve a <strong>cloud.mongodb.com</strong> y crea una cuenta gratuita (M0 — 512 MB gratis)</span>
          </div>
          <div class="atlas-step">
            <span class="step-num">2</span>
            <span>Crea un cluster → en <strong>Connect</strong> elige <em>Drivers</em> → copia la URI</span>
          </div>
          <div class="atlas-step">
            <span class="step-num">3</span>
            <span>En <strong>Network Access</strong> añade <code>0.0.0.0/0</code> para permitir conexiones</span>
          </div>
        </div>

        <div class="form-group">
          <label>URI de conexión</label>
          <input
            v-model="atlasUri"
            type="text"
            placeholder="mongodb+srv://usuario:contraseña@cluster0.mongodb.net/mibd"
            class="atlas-input"
            :disabled="store.savingUri"
          />
          <span class="field-hint">
            Reemplaza &lt;password&gt; con tu contraseña real. La URI se guarda encriptada.
          </span>
        </div>

        <div v-if="atlasError" class="alert-error">{{ atlasError }}</div>

        <div class="modal-actions">
          <button
            class="btn btn-primary"
            :disabled="!atlasUri.trim() || store.savingUri"
            @click="connectAtlas"
          >
            <span v-if="store.savingUri">⏳ Verificando conexión...</span>
            <span v-else>✅ Conectar y guardar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="playground-header">
      <div>
        <h1 class="page-title">💻 Playground MongoDB</h1>
        <p class="page-subtitle" v-if="store.atlasStatus?.connected">
          <span class="conn-dot conn-ok" />
          Conectado a:
          <code class="sandbox-name">{{ store.atlasStatus.dbName }}</code>
          <button class="btn-change-uri" @click="showChangeUri = true">Cambiar</button>
        </p>
        <p class="page-subtitle conn-warn" v-else-if="store.atlasStatus?.configured">
          <span class="conn-dot conn-err" /> Sin conexión — revisa tu URI de Atlas
          <button class="btn-change-uri" @click="showChangeUri = true">Reconfigurar</button>
        </p>
      </div>
      <div class="header-actions">
        <select v-model="selectedStage" class="stage-select" @change="loadSnippets">
          <option v-for="n in 13" :key="n" :value="n">Etapa {{ n }}</option>
        </select>
        <button class="btn btn-danger-outline btn-sm" @click="confirmClear">
          🗑 Limpiar BD
        </button>
      </div>
    </div>

    <!-- Modal cambiar URI -->
    <div v-if="showChangeUri" class="modal-overlay" @click.self="showChangeUri = false">
      <div class="modal">
        <h3>🔗 Cambiar conexión Atlas</h3>
        <p>URI actual: <code>{{ store.atlasStatus?.dbName }}</code></p>
        <div class="form-group" style="margin-top:1rem">
          <label>Nueva URI</label>
          <input
            v-model="atlasUri"
            type="text"
            placeholder="mongodb+srv://..."
            class="atlas-input"
            :disabled="store.savingUri"
          />
        </div>
        <div v-if="atlasError" class="alert-error">{{ atlasError }}</div>
        <div class="modal-actions" style="margin-top:1rem">
          <button class="btn btn-outline" @click="showChangeUri = false">Cancelar</button>
          <button class="btn btn-danger" @click="removeAtlas">🗑 Desconectar</button>
          <button
            class="btn btn-primary"
            :disabled="!atlasUri.trim() || store.savingUri"
            @click="connectAtlas"
          >
            <span v-if="store.savingUri">Verificando...</span>
            <span v-else>Guardar nueva URI</span>
          </button>
        </div>
      </div>
    </div>

    <div class="playground-grid">

      <!-- Panel izquierdo: Editor + Snippets -->
      <div class="editor-panel">

        <!-- Snippets de la etapa -->
        <div class="snippets-bar">
          <span class="snippets-label">Snippets etapa {{ selectedStage }}:</span>
          <div class="snippets-list">
            <button
              v-for="snippet in store.snippets"
              :key="snippet.label"
              class="snippet-btn"
              @click="store.loadSnippet(snippet.code)"
            >
              {{ snippet.label }}
            </button>
          </div>
        </div>

        <!-- Barra del editor -->
        <div class="editor-topbar">
          <div class="editor-dots">
            <span class="dot dot-red" />
            <span class="dot dot-yellow" />
            <span class="dot dot-green" />
          </div>
          <span class="editor-label">MongoDB Shell</span>
          <div class="editor-hint">Ctrl+Enter para ejecutar</div>
        </div>

        <!-- Editor Monaco -->
        <PlaygroundMonacoEditor
          v-model="store.query"
          language="javascript"
          height="340px"
          @run="runQuery"
        />

        <!-- Botón ejecutar -->
        <div class="run-bar">
          <div class="run-info">
            <span v-if="store.result" class="run-time">
              ⏱ {{ store.result.executionTimeMs }}ms
            </span>
            <span v-if="store.result" class="run-type">
              {{ store.result.queryType }}
            </span>
          </div>
          <button
            class="btn btn-run"
            :disabled="store.executing"
            @click="runQuery"
          >
            <span v-if="store.executing">⏳ Ejecutando...</span>
            <span v-else>▶ Ejecutar</span>
          </button>
        </div>
      </div>

      <!-- Panel derecho: Resultados + Sidebar -->
      <div class="right-panel">

        <!-- Resultado -->
        <div class="result-panel">
          <div class="result-header">
            <span class="result-title">Resultado</span>
            <div class="result-meta" v-if="store.result">
              <span
                class="result-status"
                :class="store.result.success ? 'status-ok' : 'status-err'"
              >
                {{ store.result.success ? '✅ OK' : '❌ Error' }}
              </span>
              <span v-if="store.result.docsAffected" class="result-docs">
                {{ store.result.docsAffected }} doc(s)
              </span>
            </div>
            <button v-if="store.result" class="clear-btn" @click="store.clearResult()">✕</button>
          </div>

          <div class="result-body">
            <!-- Sin resultados -->
            <div v-if="!store.result && !store.executing" class="result-empty">
              <span>🍃</span>
              <p>Ejecuta una query para ver el resultado aquí</p>
            </div>

            <!-- Cargando -->
            <div v-else-if="store.executing" class="result-loading">
              <div class="spinner" />
              <p>Ejecutando...</p>
            </div>

            <!-- Error de ejecución -->
            <div v-else-if="store.result && !store.result.success" class="result-error">
              <div class="error-icon">⚠️</div>
              <pre class="error-msg">{{ store.result.error }}</pre>
            </div>

            <!-- Resultado exitoso -->
            <div v-else-if="store.result?.result !== undefined" class="result-content">
              <!-- Array de documentos -->
              <div v-if="Array.isArray(store.result.result)">
                <div class="result-count">
                  {{ store.result.result.length }} documento(s)
                </div>
                <div
                  v-for="(doc, idx) in store.result.result.slice(0, 50)"
                  :key="idx"
                  class="result-doc"
                >
                  <div class="doc-index">[{{ idx }}]</div>
                  <pre class="doc-json">{{ formatJson(doc) }}</pre>
                </div>
                <div v-if="store.result.result.length > 50" class="result-truncated">
                  ... y {{ store.result.result.length - 50 }} más
                </div>
              </div>

              <!-- Objeto simple -->
              <div v-else>
                <pre class="doc-json">{{ formatJson(store.result.result) }}</pre>
              </div>
            </div>

            <!-- Operación sin resultado (insert/update/delete) -->
            <div v-else-if="store.result?.success" class="result-op-ok">
              <span class="op-icon">✅</span>
              <div>
                <strong>Operación exitosa</strong>
                <p>{{ store.result.docsAffected }} documento(s) afectado(s) — {{ store.result.executionTimeMs }}ms</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Colecciones del sandbox -->
        <div class="collections-panel">
          <div class="panel-header">
            <span class="panel-title">📁 Colecciones</span>
            <button class="refresh-btn" @click="store.fetchCollections()">↻</button>
          </div>
          <div v-if="store.collections.length === 0" class="empty-cols">
            Sin colecciones aún
          </div>
          <div v-else class="collections-list">
            <button
              v-for="col in store.collections"
              :key="col"
              class="collection-item"
              @click="store.loadSnippet(`db.${col}.find().limit(10)`)"
            >
              🍃 {{ col }}
            </button>
          </div>
        </div>

        <!-- Historial -->
        <div class="history-panel">
          <div class="panel-header">
            <span class="panel-title">📜 Historial</span>
            <button class="refresh-btn" @click="store.fetchHistory()">↻</button>
          </div>
          <div v-if="store.history.length === 0" class="empty-cols">Sin historial</div>
          <div v-else class="history-list">
            <button
              v-for="item in store.history.slice(0, 15)"
              :key="item._id"
              class="history-item"
              :class="{ 'history-item--err': !item.success }"
              @click="store.loadFromHistory(item)"
            >
              <span class="history-status">{{ item.success ? '✅' : '❌' }}</span>
              <span class="history-query">{{ item.query.slice(0, 60) }}{{ item.query.length > 60 ? '…' : '' }}</span>
              <span class="history-time">{{ item.executionTimeMs }}ms</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal confirmación limpiar sandbox -->
    <div v-if="showClearModal" class="modal-overlay" @click.self="showClearModal = false">
      <div class="modal">
        <h3>🗑 Limpiar sandbox</h3>
        <p>Esto eliminará <strong>todas las colecciones</strong> de tu sandbox. Esta acción no se puede deshacer.</p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="showClearModal = false">Cancelar</button>
          <button class="btn btn-danger" @click="doClear">Sí, limpiar todo</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const store = usePlaygroundStore()
const selectedStage = ref(1)
const showClearModal = ref(false)
const showChangeUri = ref(false)
const atlasUri = ref('')
const atlasError = ref('')

/** Muestra el modal de setup si Atlas no está configurado */
const showAtlasSetup = computed(
  () => store.atlasStatus !== null && !store.atlasStatus.configured,
)

const runQuery = () => store.execute(selectedStage.value)
const loadSnippets = () => store.fetchSnippets(selectedStage.value)

const formatJson = (obj: any): string => {
  try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
}

const confirmClear = () => { showClearModal.value = true }
const doClear = async () => {
  await store.clearSandbox()
  showClearModal.value = false
}

const connectAtlas = async () => {
  atlasError.value = ''
  try {
    await store.saveAtlasUri(atlasUri.value.trim())
    atlasUri.value = ''
    showChangeUri.value = false
    // Recargar colecciones con la nueva conexión
    await Promise.all([store.fetchCollections(), store.fetchHistory()])
  } catch (err: any) {
    atlasError.value = err?.data?.message || store.error || 'Error al conectar'
  }
}

const removeAtlas = async () => {
  await store.removeAtlasUri()
  showChangeUri.value = false
  atlasUri.value = ''
}

onMounted(async () => {
  await store.checkAtlasStatus()

  // Solo cargar datos del playground si Atlas está configurado
  if (store.atlasStatus?.configured) {
    await Promise.all([
      store.fetchCollections(),
      store.fetchHistory(),
      store.fetchSnippets(selectedStage.value),
    ])
  } else {
    // Cargar snippets siempre (no requieren conexión)
    await store.fetchSnippets(selectedStage.value)
  }
})
</script>

<style scoped>
.playground-page { display: flex; flex-direction: column; gap: 1.25rem; }

.playground-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title { font-size: 1.6rem; font-weight: 700; color: var(--color-secondary); }
.page-subtitle { color: var(--color-text-muted); font-size: 0.875rem; margin-top: 0.25rem; }
.sandbox-name {
  background: var(--color-secondary);
  color: var(--color-primary-light);
  padding: .1rem .5rem;
  border-radius: 4px;
  font-size: 0.82rem;
}

.header-actions { display: flex; gap: 0.75rem; align-items: center; }

.stage-select {
  padding: 0.4rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.playground-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.25rem;
  align-items: start;
}

/* ── Editor panel ── */
.editor-panel {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1.5px solid #1e3a4a;
}

.snippets-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  flex-wrap: wrap;
}

.snippets-label { font-size: 0.72rem; font-weight: 600; color: var(--color-text-muted); white-space: nowrap; }

.snippets-list { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.snippet-btn {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 0.2rem 0.65rem;
  font-size: 0.72rem;
  cursor: pointer;
  color: var(--color-secondary);
  font-weight: 500;
  white-space: nowrap;
  transition: background .1s, border-color .1s;
}
.snippet-btn:hover { background: #f0fdf8; border-color: var(--color-primary); }

.editor-topbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: #001624;
}

.editor-dots { display: flex; gap: .4rem; }
.dot { width: 12px; height: 12px; border-radius: 50%; }
.dot-red    { background: #ff5f56; }
.dot-yellow { background: #ffbd2e; }
.dot-green  { background: #27c93f; }

.editor-label { font-size: 0.78rem; color: #6a9955; font-weight: 600; flex: 1; }
.editor-hint { font-size: 0.7rem; color: #4a6375; }

.run-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #001624;
  border-top: 1px solid #1e3a4a;
}

.run-info { display: flex; gap: 0.75rem; align-items: center; }

.run-time {
  font-size: 0.75rem;
  color: #6a9955;
  font-family: var(--font-mono);
}

.run-type {
  font-size: 0.7rem;
  background: #00684a33;
  color: var(--color-primary-light);
  padding: .1rem .5rem;
  border-radius: 20px;
  font-weight: 600;
}

.btn-run {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background .15s;
}
.btn-run:hover:not(:disabled) { background: #00ed64; color: var(--color-secondary); }
.btn-run:disabled { opacity: .5; cursor: not-allowed; }

/* ── Right panel ── */
.right-panel { display: flex; flex-direction: column; gap: 1rem; }

.result-panel, .collections-panel, .history-panel {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.result-header, .panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  background: #f8fafc;
  border-bottom: 1.5px solid var(--color-border);
}

.result-title, .panel-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: .5px;
  flex: 1;
}

.result-meta { display: flex; align-items: center; gap: 0.5rem; }
.result-status { font-size: 0.75rem; font-weight: 700; }
.status-ok { color: var(--color-success); }
.status-err { color: var(--color-danger); }
.result-docs { font-size: 0.72rem; color: var(--color-text-muted); }
.clear-btn {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-muted); font-size: 0.8rem;
}
.refresh-btn {
  background: none; border: none; cursor: pointer;
  color: var(--color-primary); font-size: 1rem; font-weight: 700;
}

.result-body { padding: 0.75rem; max-height: 320px; overflow-y: auto; }

.result-empty, .result-loading {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 2rem; color: var(--color-text-muted);
  text-align: center; font-size: 0.875rem;
}
.result-empty span { font-size: 2rem; }

.spinner {
  width: 28px; height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.result-error { padding: 0.75rem; }
.error-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
.error-msg {
  background: #fef2f2;
  color: var(--color-danger);
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.82rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.result-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.result-doc {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.doc-index {
  background: #f1f5f9;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.5rem;
  min-width: 2rem;
  text-align: center;
  font-family: var(--font-mono);
}

.doc-json {
  font-size: 0.78rem;
  font-family: var(--font-mono);
  padding: 0.5rem;
  margin: 0;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-all;
  flex: 1;
  overflow-x: auto;
}

.result-truncated {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  padding: 0.5rem;
}

.result-op-ok {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f0fdf4;
  border-radius: 6px;
}
.op-icon { font-size: 1.5rem; }
.result-op-ok strong { display: block; margin-bottom: 0.2rem; }
.result-op-ok p { margin: 0; font-size: 0.82rem; color: var(--color-text-muted); }

.empty-cols {
  padding: 0.75rem 1rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.collections-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.4rem;
}

.collection-item {
  text-align: left;
  background: none;
  border: none;
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  font-size: 0.82rem;
  color: var(--color-secondary);
  cursor: pointer;
  font-family: var(--font-mono);
  transition: background .1s;
}
.collection-item:hover { background: #f0fdf8; }

.history-list {
  display: flex;
  flex-direction: column;
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: none;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  text-align: left;
  transition: background .1s;
}
.history-item:hover { background: #f8fafc; }
.history-item--err { opacity: .7; }

.history-status { font-size: 0.75rem; min-width: 1.2rem; }

.history-query {
  flex: 1;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* ── Botones ── */
.btn {
  padding: 0.5rem 1.1rem;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  transition: opacity .15s;
}
.btn-sm { padding: 0.35rem 0.75rem; font-size: 0.78rem; }
.btn-outline { background: white; border: 1.5px solid var(--color-border); color: var(--color-text); }
.btn-danger { background: var(--color-danger); color: white; }
.btn-danger-outline { background: white; border: 1.5px solid #fca5a5; color: var(--color-danger); }
.btn-danger-outline:hover { background: #fef2f2; }

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-lg);
}
.modal h3 { margin-bottom: 0.75rem; font-size: 1.2rem; }
.modal p { color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

@media (max-width: 1100px) {
  .playground-grid { grid-template-columns: 1fr; }
}

/* ── Indicador de conexión ── */
.conn-dot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  margin-right: 0.3rem;
  vertical-align: middle;
}
.conn-ok  { background: var(--color-success); }
.conn-err { background: var(--color-danger); }
.conn-warn { color: var(--color-danger); }

.btn-change-uri {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  margin-left: 0.5rem;
  padding: 0;
  text-decoration: underline;
}

/* ── Modal Atlas setup ── */
.atlas-modal {
  max-width: 540px;
}

.atlas-modal-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.atlas-icon { font-size: 2.5rem; }

.atlas-modal-header h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-secondary);
  margin-bottom: 0.25rem;
}

.atlas-modal-header p {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.atlas-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  background: #f8fafc;
  border-radius: var(--radius);
  padding: 1rem;
}

.atlas-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text);
}

.step-num {
  background: var(--color-primary);
  color: white;
  width: 22px; height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
}

.atlas-step code {
  background: #e2e8f0;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.82rem;
}

.atlas-input {
  width: 100%;
  padding: 0.65rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-family: var(--font-mono);
  outline: none;
  transition: border-color .15s;
}
.atlas-input:focus { border-color: var(--color-primary); }
.atlas-input:disabled { background: #f8fafc; }

.field-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
  display: block;
}

.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.alert-error {
  background: #fef2f2;
  color: var(--color-danger);
  border: 1px solid #fecaca;
  border-radius: var(--radius);
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  margin-top: 0.75rem;
}
</style>
