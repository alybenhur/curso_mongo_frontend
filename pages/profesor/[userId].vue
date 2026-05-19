<template>
  <div class="detail-page">
    <NuxtLink to="/profesor" class="back-link">← Volver al panel</NuxtLink>

    <div v-if="loading" class="loading-state">
      <div class="spinner" /><p>Cargando estudiante...</p>
    </div>

    <template v-else-if="student">
      <!-- Header del estudiante -->
      <div class="student-header">
        <div class="avatar-lg">{{ student.name.charAt(0).toUpperCase() }}</div>
        <div class="student-meta">
          <h1 class="student-name">{{ student.name }}</h1>
          <p class="student-email">{{ student.email }}</p>
          <div class="chips">
            <span class="chip chip-green">{{ levelIcon(student.level) }} {{ student.level }}</span>
            <span class="chip chip-blue">⭐ {{ student.xp }} XP</span>
            <span class="chip chip-orange">🔥 {{ student.streak }} días</span>
            <span class="chip" :class="student.diagnosticCompleted ? 'chip-green' : 'chip-gray'">
              {{ student.diagnosticCompleted ? '✅ Diagnóstico completo' : '⏳ Sin diagnóstico' }}
            </span>
          </div>
        </div>
        <!-- KPIs rápidos -->
        <div class="kpi-row">
          <div class="kpi">
            <div class="kpi-val">{{ summary?.globalPercent ?? 0 }}%</div>
            <div class="kpi-lbl">Avance global</div>
          </div>
          <div class="kpi">
            <div class="kpi-val">{{ summary?.completed ?? 0 }}</div>
            <div class="kpi-lbl">Etapas completadas</div>
          </div>
          <div class="kpi">
            <div class="kpi-val">{{ summary?.inProgress ?? 0 }}</div>
            <div class="kpi-lbl">En progreso</div>
          </div>
          <div class="kpi">
            <div class="kpi-val">{{ Math.round((summary?.totalTimeMinutes ?? 0) / 60) }}h</div>
            <div class="kpi-lbl">Tiempo invertido</div>
          </div>
          <div class="kpi">
            <div class="kpi-val">{{ certCount }}</div>
            <div class="kpi-lbl">Certificados</div>
          </div>
        </div>
      </div>

      <!-- Barra de progreso global -->
      <div class="global-bar-card">
        <div class="bar-label">
          <span>Progreso general del currículo</span>
          <strong>{{ summary?.globalPercent ?? 0 }}%</strong>
        </div>
        <div class="global-bar">
          <div
            class="global-fill"
            :style="{ width: `${summary?.globalPercent ?? 0}%` }"
          />
        </div>
      </div>

      <!-- Etapas -->
      <div class="section-title">📚 Progreso por etapa</div>
      <div class="stages-grid">
        <div
          v-for="stage in stagesProgress"
          :key="stage.stageOrder"
          class="stage-card"
          :class="`stage--${stage.status}`"
        >
          <div class="stage-top">
            <span class="stage-num">Etapa {{ stage.stageOrder }}</span>
            <span class="status-badge" :class="`badge--${stage.status}`">
              <span v-if="stage.status === 'completed'">✅ Completada</span>
              <span v-else-if="stage.status === 'in_progress'">📖 En progreso</span>
              <span v-else>🔒 Bloqueada</span>
            </span>
          </div>
          <div class="stage-bar">
            <div
              class="stage-fill"
              :style="{ width: `${stage.completionPercent}%` }"
            />
          </div>
          <div class="stage-meta">
            <span>{{ stage.completionPercent }}% lecciones</span>
            <span v-if="stage.evaluationScore !== null">
              📝 Eval: {{ stage.evaluationScore }}%
            </span>
          </div>
          <div v-if="stage.certificateCode" class="cert-row">
            🎓 {{ stage.certificateCode }}
          </div>
        </div>
      </div>

      <!-- Diagnóstico -->
      <div v-if="student.diagnosticScores" class="section">
        <div class="section-title">🎯 Diagnóstico inicial</div>
        <div class="radar-grid">
          <div
            v-for="(val, area) in student.diagnosticScores"
            :key="area"
            class="radar-item"
          >
            <div class="radar-label">{{ areaLabel(String(area)) }}</div>
            <div class="radar-bar">
              <div class="radar-fill" :style="{ width: `${val}%` }" />
            </div>
            <div class="radar-pct">{{ val }}%</div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="error-state">
      <p>No se encontró el estudiante.</p>
      <NuxtLink to="/profesor" class="btn-back">← Volver</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'profesor' })

const route = useRoute()
const { apiFetch } = useApi()
const userId = route.params.userId as string

const loading = ref(true)
const student = ref<any>(null)
const stagesProgress = ref<any[]>([])
const summary = ref<any>(null)

onMounted(async () => {
  try {
    const [stu, prog] = await Promise.all([
      apiFetch<any>(`/users/students/${userId}`),
      apiFetch<any>(`/progress/admin/user/${userId}`),
    ])
    student.value = stu
    stagesProgress.value = prog.stages ?? []
    summary.value = prog.summary ?? null
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

const certCount = computed(() =>
  stagesProgress.value.filter((s) => s.certificateIssued).length,
)

function levelIcon(level: string) {
  const icons: Record<string, string> = {
    novato: '🌱', aprendiz: '📚', practicante: '⚙️', experto: '🎯', maestro: '🏆',
  }
  return icons[level] ?? '👤'
}

function areaLabel(area: string) {
  const labels: Record<string, string> = {
    crud: '📄 CRUD', aggregation: '🔗 Aggregation',
    indexes: '⚡ Índices', modeling: '🏗 Modelado', security: '🔒 Seguridad',
  }
  return labels[area] ?? area
}
</script>

<style scoped>
.detail-page { display: flex; flex-direction: column; gap: 1.5rem; }

.back-link {
  display: inline-flex; align-items: center; gap: .3rem;
  color: var(--color-text-muted); font-size: .875rem; text-decoration: none;
}
.back-link:hover { color: var(--color-primary); }

/* ── Header estudiante ── */
.student-header {
  background: white; border-radius: 12px; padding: 1.75rem;
  box-shadow: var(--shadow); display: flex; gap: 1.5rem;
  align-items: flex-start; flex-wrap: wrap;
}
.avatar-lg {
  width: 64px; height: 64px; border-radius: 50%;
  background: var(--color-primary); color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.75rem; font-weight: 800; flex-shrink: 0;
}
.student-meta { flex: 1; min-width: 200px; }
.student-name { font-size: 1.4rem; font-weight: 800; color: var(--color-secondary); margin-bottom: .25rem; }
.student-email { color: var(--color-text-muted); font-size: .875rem; margin-bottom: .75rem; }

.chips { display: flex; flex-wrap: wrap; gap: .5rem; }
.chip {
  font-size: .75rem; font-weight: 600; padding: .2rem .7rem;
  border-radius: 20px;
}
.chip-green  { background: #d1fae5; color: #065f46; }
.chip-blue   { background: #dbeafe; color: #1e40af; }
.chip-orange { background: #ffedd5; color: #9a3412; }
.chip-gray   { background: #f1f5f9; color: #64748b; }

.kpi-row {
  display: flex; gap: 1rem; flex-wrap: wrap;
  width: 100%;
}
.kpi {
  flex: 1; min-width: 80px; text-align: center;
  background: #f8fafc; border-radius: var(--radius); padding: .85rem .5rem;
}
.kpi-val { font-size: 1.5rem; font-weight: 800; color: var(--color-primary); }
.kpi-lbl { font-size: .7rem; color: var(--color-text-muted); margin-top: .1rem; }

/* ── Barra global ── */
.global-bar-card {
  background: white; border-radius: var(--radius);
  padding: 1.25rem 1.5rem; box-shadow: var(--shadow);
}
.bar-label {
  display: flex; justify-content: space-between;
  font-size: .875rem; margin-bottom: .5rem; color: var(--color-text);
}
.global-bar { height: 10px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
.global-fill { height: 100%; background: var(--color-primary); border-radius: 99px; transition: width .5s; }

/* ── Etapas ── */
.section-title {
  font-size: 1rem; font-weight: 700; color: var(--color-secondary);
}
.stages-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;
}
.stage-card {
  background: white; border-radius: var(--radius); padding: 1rem;
  box-shadow: var(--shadow); border: 2px solid transparent;
}
.stage--completed { border-color: var(--color-success); }
.stage--in_progress { border-color: var(--color-primary); }
.stage--locked { opacity: .6; }

.stage-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: .6rem; }
.stage-num { font-size: .75rem; font-weight: 700; color: var(--color-text-muted); }
.status-badge { font-size: .7rem; font-weight: 700; padding: .15rem .5rem; border-radius: 20px; }
.badge--completed  { background: #d1fae5; color: #065f46; }
.badge--in_progress{ background: #dbeafe; color: #1e40af; }
.badge--locked     { background: #f1f5f9; color: #64748b; }

.stage-bar { height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; margin-bottom: .4rem; }
.stage-fill { height: 100%; background: var(--color-primary); border-radius: 99px; }
.stage-meta { display: flex; justify-content: space-between; font-size: .72rem; color: var(--color-text-muted); }
.cert-row { margin-top: .4rem; font-size: .72rem; color: var(--color-primary); font-weight: 600; }

/* ── Radar diagnóstico ── */
.section { display: flex; flex-direction: column; gap: .75rem; }
.radar-grid { display: flex; flex-direction: column; gap: .6rem; background: white; padding: 1.25rem; border-radius: var(--radius); box-shadow: var(--shadow); }
.radar-item { display: flex; align-items: center; gap: .75rem; }
.radar-label { font-size: .82rem; font-weight: 600; color: var(--color-text); width: 140px; flex-shrink: 0; }
.radar-bar { flex: 1; height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
.radar-fill { height: 100%; background: var(--color-primary); border-radius: 99px; }
.radar-pct { font-size: .75rem; font-weight: 700; color: var(--color-text-muted); width: 36px; text-align: right; }

/* ── Estados ── */
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 1rem; padding: 4rem; color: var(--color-text-muted);
}
.spinner {
  width: 36px; height: 36px; border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary); border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-state { text-align: center; padding: 4rem; color: var(--color-text-muted); }
.btn-back { color: var(--color-primary); font-weight: 600; }
</style>
