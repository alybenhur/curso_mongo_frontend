<template>
  <div class="admin-page">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">⚙️ Panel de Administración</h1>
        <p class="page-subtitle">Herramientas de mantenimiento y configuración del sistema</p>
      </div>
    </div>

    <!-- Sección: Currículo -->
    <section class="admin-section">
      <h2 class="section-title">📚 Currículo</h2>
      <div class="cards-grid">

        <!-- Sembrar lecciones -->
        <div class="admin-card">
          <div class="card-icon">🌱</div>
          <div class="card-body">
            <h3 class="card-title">Sembrar lecciones faltantes</h3>
            <p class="card-desc">
              Detecta etapas del currículo que no tienen lecciones en la base de datos
              y las siembra automáticamente desde el seed oficial. Seguro de ejecutar
              varias veces (sólo inserta si la etapa tiene 0 lecciones).
            </p>
            <div v-if="seedResult" class="result-msg" :class="seedOk ? 'result-ok' : 'result-err'">
              {{ seedOk ? '✅' : '❌' }} {{ seedResult }}
            </div>
          </div>
          <div class="card-footer">
            <button class="btn-action" :disabled="seeding" @click="seedLessons">
              <span v-if="seeding" class="spinner-sm" />
              <span v-else>🌱</span>
              {{ seeding ? 'Sembrando...' : 'Ejecutar seed' }}
            </button>
          </div>
        </div>

        <!-- Sembrar preguntas de evaluación -->
        <div class="admin-card">
          <div class="card-icon">📝</div>
          <div class="card-body">
            <h3 class="card-title">Sembrar evaluaciones faltantes</h3>
            <p class="card-desc">
              Detecta etapas que no tienen preguntas de evaluación y las siembra
              desde el banco oficial. Seguro de ejecutar varias veces (solo inserta
              si la etapa tiene 0 preguntas).
            </p>
            <div v-if="seedEvalResult" class="result-msg" :class="seedEvalOk ? 'result-ok' : 'result-err'">
              {{ seedEvalOk ? '✅' : '❌' }} {{ seedEvalResult }}
            </div>
          </div>
          <div class="card-footer">
            <button class="btn-action" :disabled="seedingEval" @click="seedEvaluations">
              <span v-if="seedingEval" class="spinner-sm" />
              <span v-else>📝</span>
              {{ seedingEval ? 'Sembrando...' : 'Ejecutar seed' }}
            </button>
          </div>
        </div>

        <!-- Estadísticas del currículo -->
        <div class="admin-card">
          <div class="card-icon">📊</div>
          <div class="card-body">
            <h3 class="card-title">Estado del currículo</h3>
            <p class="card-desc">
              Resumen de etapas y lecciones actualmente cargadas en la base de datos.
            </p>
            <div v-if="curriculumStats" class="stats-list">
              <div class="stat-row">
                <span class="stat-lbl">Etapas activas</span>
                <span class="stat-val">{{ curriculumStats.stages }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-lbl">Lecciones totales</span>
                <span class="stat-val">{{ curriculumStats.lessons }}</span>
              </div>
            </div>
            <div v-else-if="loadingStats" class="muted">Cargando...</div>
          </div>
          <div class="card-footer">
            <button class="btn-action btn-secondary" @click="loadStats">
              🔄 Actualizar
            </button>
          </div>
        </div>

      </div>
    </section>

    <!-- Sección: Usuarios -->
    <section class="admin-section">
      <h2 class="section-title">👥 Usuarios</h2>
      <div class="cards-grid">
        <div class="admin-card">
          <div class="card-icon">👨‍🏫</div>
          <div class="card-body">
            <h3 class="card-title">Panel del profesor</h3>
            <p class="card-desc">
              Ver el progreso detallado de todos los estudiantes, métricas y certificados.
            </p>
          </div>
          <div class="card-footer">
            <NuxtLink to="/profesor" class="btn-action">
              👨‍🏫 Ir al panel
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'admin' })

const { apiFetch } = useApi()

const seeding    = ref(false)
const seedResult = ref('')
const seedOk     = ref(true)

const seedingEval    = ref(false)
const seedEvalResult = ref('')
const seedEvalOk     = ref(true)

const loadingStats   = ref(false)
const curriculumStats = ref<{ stages: number; lessons: number } | null>(null)

// ── Sembrar lecciones ─────────────────────────────────────────────────────────
async function seedLessons() {
  seeding.value    = true
  seedResult.value = ''
  try {
    const res = await apiFetch<{ message: string }>('/curriculum/admin/seed-lessons', { method: 'POST' })
    seedResult.value = res.message
    seedOk.value     = true
    await loadStats()          // refrescar contadores
  } catch (e: any) {
    seedResult.value = e?.data?.message || 'No se pudo ejecutar el seed'
    seedOk.value     = false
  } finally {
    seeding.value = false
  }
}

// ── Sembrar preguntas de evaluación ──────────────────────────────────────────
async function seedEvaluations() {
  seedingEval.value    = true
  seedEvalResult.value = ''
  try {
    const res = await apiFetch<{ message: string }>('/evaluation/admin/seed-questions', { method: 'POST' })
    seedEvalResult.value = res.message
    seedEvalOk.value     = true
  } catch (e: any) {
    seedEvalResult.value = e?.data?.message || 'No se pudo ejecutar el seed'
    seedEvalOk.value     = false
  } finally {
    seedingEval.value = false
  }
}

// ── Stats del currículo ───────────────────────────────────────────────────────
async function loadStats() {
  loadingStats.value = true
  try {
    const [stages, lessons] = await Promise.all([
      apiFetch<any[]>('/curriculum/stages'),
      apiFetch<any[]>('/curriculum/admin/stats').catch(() => null),
    ])
    // Si el endpoint de stats no existe aún, contamos desde stages
    curriculumStats.value = {
      stages: stages.length,
      lessons: (lessons as any)?.totalLessons ?? null,
    }
  } catch {
    // silencioso
  } finally {
    loadingStats.value = false
  }
}

onMounted(loadStats)
</script>

<style scoped>
.admin-page { display: flex; flex-direction: column; gap: 2rem; }

/* ── Header ── */
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title  { font-size: 1.75rem; font-weight: 800; color: var(--color-secondary); }
.page-subtitle { color: var(--color-text-muted); margin-top: .25rem; font-size: .9rem; }

/* ── Secciones ── */
.admin-section { display: flex; flex-direction: column; gap: 1rem; }
.section-title {
  font-size: 1.1rem; font-weight: 700; color: var(--color-secondary);
  padding-bottom: .5rem; border-bottom: 1.5px solid var(--color-border);
}

/* ── Grid de cards ── */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }

.admin-card {
  background: white; border-radius: 12px; box-shadow: var(--shadow);
  display: flex; flex-direction: column; overflow: hidden;
}

.card-icon {
  font-size: 2rem; padding: 1.25rem 1.5rem .75rem;
}

.card-body {
  flex: 1; padding: 0 1.5rem 1rem;
  display: flex; flex-direction: column; gap: .5rem;
}

.card-title { font-size: 1rem; font-weight: 700; color: var(--color-secondary); }
.card-desc  { font-size: .875rem; color: var(--color-text-muted); line-height: 1.6; }

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: #f8fafc;
}

/* ── Botones ── */
.btn-action {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .5rem 1.1rem; border-radius: var(--radius);
  background: var(--color-primary); color: white;
  font-size: .875rem; font-weight: 600; cursor: pointer;
  border: none; text-decoration: none; transition: opacity .15s;
}
.btn-action:hover:not(:disabled) { opacity: .87; }
.btn-action:disabled { opacity: .55; cursor: not-allowed; }
.btn-action.btn-secondary {
  background: white; color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
}
.btn-action.btn-secondary:hover { background: #f0fdf4; }

/* ── Resultado seed ── */
.result-msg {
  font-size: .82rem; font-weight: 600; padding: .4rem .75rem;
  border-radius: var(--radius); margin-top: .25rem;
}
.result-ok  { background: #d1fae5; color: #065f46; }
.result-err { background: #fee2e2; color: #991b1b; }

/* ── Stats ── */
.stats-list { display: flex; flex-direction: column; gap: .35rem; margin-top: .25rem; }
.stat-row   { display: flex; justify-content: space-between; font-size: .875rem; }
.stat-lbl   { color: var(--color-text-muted); }
.stat-val   { font-weight: 700; color: var(--color-secondary); }

.muted { font-size: .85rem; color: var(--color-text-muted); }

/* ── Spinner pequeño ── */
.spinner-sm {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4);
  border-top-color: white; border-radius: 50%;
  animation: spin .7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
