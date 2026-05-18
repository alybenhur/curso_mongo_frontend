<template>
  <div class="achievements-page">

    <div class="page-header">
      <h1>🏅 Mis Logros</h1>
      <p class="page-subtitle">Tu historial de certificados y progreso en MongoTutor</p>
    </div>

    <!-- Resumen rápido -->
    <div class="summary-cards">
      <div class="sum-card">
        <div class="sum-icon">⭐</div>
        <div class="sum-val">{{ authStore.user?.xp ?? 0 }}</div>
        <div class="sum-lbl">XP Total</div>
      </div>
      <div class="sum-card">
        <div class="sum-icon">🔥</div>
        <div class="sum-val">{{ authStore.user?.streak ?? 0 }}</div>
        <div class="sum-lbl">Días seguidos</div>
      </div>
      <div class="sum-card">
        <div class="sum-icon">🏆</div>
        <div class="sum-val">{{ completedCount }}</div>
        <div class="sum-lbl">Etapas completadas</div>
      </div>
      <div class="sum-card">
        <div class="sum-icon">🎓</div>
        <div class="sum-val">{{ certificatesCount }}</div>
        <div class="sum-lbl">Certificados</div>
      </div>
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="center-state">
      <div class="spinner" />
      <p>Cargando logros...</p>
    </div>

    <template v-else>
      <!-- Certificados obtenidos -->
      <section class="section">
        <h2 class="section-title">🎓 Certificados obtenidos</h2>
        <div v-if="certificates.length === 0" class="empty-state">
          <span class="empty-icon">🎯</span>
          <p>Aún no tienes certificados. Completa la evaluación de cada etapa para obtenerlos.</p>
          <NuxtLink to="/curriculum" class="btn btn-primary">Ir al currículo</NuxtLink>
        </div>
        <div v-else class="certificates-grid">
          <div
            v-for="cert in certificates"
            :key="cert.stageOrder"
            class="cert-card"
          >
            <div class="cert-badge">🏆</div>
            <div class="cert-info">
              <div class="cert-stage">Etapa {{ cert.stageOrder }}</div>
              <div class="cert-title">{{ cert.stageTitle }}</div>
              <div class="cert-code">{{ cert.certificateCode }}</div>
              <div class="cert-date">{{ formatDate(cert.completedAt) }}</div>
            </div>
            <button
              class="btn btn-sm btn-primary"
              :disabled="downloadingOrder === cert.stageOrder"
              @click="downloadCertificate(cert.stageOrder)"
            >
              {{ downloadingOrder === cert.stageOrder ? '⏳' : '📄 PDF' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Progreso por etapa -->
      <section class="section">
        <h2 class="section-title">📊 Progreso por etapa</h2>
        <div class="stages-grid">
          <div
            v-for="item in stagesWithProgress"
            :key="item.order"
            class="stage-badge"
            :class="statusClass(item.progress?.status)"
          >
            <div class="badge-icon">{{ item.icon }}</div>
            <div class="badge-info">
              <div class="badge-name">{{ item.title }}</div>
              <div class="badge-status">{{ statusLabel(item.progress?.status) }}</div>
              <div v-if="item.progress?.status !== 'locked'" class="badge-bar">
                <div
                  class="badge-fill"
                  :style="{ width: (item.progress?.completionPercent ?? 0) + '%' }"
                />
              </div>
            </div>
            <div class="badge-pct" v-if="item.progress?.status !== 'locked'">
              {{ item.progress?.completionPercent ?? 0 }}%
            </div>
            <div class="badge-lock" v-else>🔒</div>
          </div>
        </div>
      </section>

      <!-- Insignias de nivel -->
      <section class="section">
        <h2 class="section-title">🌟 Insignias de nivel</h2>
        <div class="badges-row">
          <div
            v-for="badge in levelBadges"
            :key="badge.name"
            class="level-badge"
            :class="{ 'badge-earned': badge.earned }"
          >
            <div class="lbadge-icon">{{ badge.icon }}</div>
            <div class="lbadge-name">{{ badge.name }}</div>
            <div class="lbadge-req">{{ badge.requirement }}</div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const authStore = useAuthStore()
const progressStore = useProgressStore()
const config = useRuntimeConfig()

const loading = ref(true)
const downloadingOrder = ref<number | null>(null)
const stageNames = ref<Record<number, string>>({})

onMounted(async () => {
  await Promise.all([
    progressStore.fetchStages(),
    progressStore.fetchProgress(),
  ])
  progressStore.stages.forEach(s => { stageNames.value[s.order] = s.title })
  loading.value = false
})

async function downloadCertificate(stageOrder: number) {
  downloadingOrder.value = stageOrder
  try {
    const response = await fetch(
      `${config.public.apiBase}/evaluation/${stageOrder}/certificate`,
      { headers: { Authorization: `Bearer ${authStore.accessToken}` } },
    )
    if (!response.ok) throw new Error(`Error ${response.status}`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `certificado-etapa-${stageOrder}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    alert(`No se pudo descargar el certificado: ${err.message}`)
  } finally {
    downloadingOrder.value = null
  }
}

const stagesWithProgress = computed(() =>
  progressStore.stages.map(stage => ({
    ...stage,
    progress: progressStore.progress.find(p => p.stageOrder === stage.order),
  }))
)

const completedCount = computed(() =>
  progressStore.progress.filter(p => p.status === 'completed').length
)

const certificates = computed(() =>
  progressStore.progress
    .filter(p => p.certificateIssued && p.certificateCode)
    .map(p => ({
      stageOrder: p.stageOrder,
      stageTitle: stageNames.value[p.stageOrder] ?? `Etapa ${p.stageOrder}`,
      certificateCode: p.certificateCode,
      completedAt: p.completedAt,
    }))
)

const certificatesCount = computed(() => certificates.value.length)

const levelBadges = computed(() => {
  const xp = authStore.user?.xp ?? 0
  return [
    { icon: '🌱', name: 'Novato',      requirement: '0 XP',    earned: true },
    { icon: '📚', name: 'Aprendiz',    requirement: '100 XP',  earned: xp >= 100 },
    { icon: '⚙️', name: 'Practicante', requirement: '300 XP',  earned: xp >= 300 },
    { icon: '🔧', name: 'Desarrollador', requirement: '600 XP', earned: xp >= 600 },
    { icon: '🏗',  name: 'Arquitecto', requirement: '1000 XP', earned: xp >= 1000 },
    { icon: '🍃', name: 'Experto MongoDB', requirement: '2000 XP', earned: xp >= 2000 },
  ]
})

function statusClass(status?: string) {
  if (status === 'completed') return 'stage-completed'
  if (status === 'in_progress') return 'stage-active'
  return 'stage-locked'
}

function statusLabel(status?: string) {
  if (status === 'completed') return '✅ Completada'
  if (status === 'in_progress') return '▶️ En progreso'
  return '🔒 Bloqueada'
}

function formatDate(date?: string | null) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
</script>

<style scoped>
.achievements-page { display: flex; flex-direction: column; gap: 2rem; }

.page-header h1 { font-size: 1.75rem; font-weight: 800; color: var(--color-secondary); }
.page-subtitle { color: var(--color-text-muted); margin-top: 0.25rem; }

/* ── Summary ── */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.sum-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  text-align: center;
  box-shadow: var(--shadow);
}

.sum-icon { font-size: 1.75rem; margin-bottom: 0.5rem; }
.sum-val { font-size: 1.5rem; font-weight: 800; color: var(--color-secondary); }
.sum-lbl { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.2rem; }

/* ── Section ── */
.section { display: flex; flex-direction: column; gap: 1rem; }
.section-title {
  font-size: 1.1rem; font-weight: 700;
  color: var(--color-secondary);
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-border);
}

/* ── Empty ── */
.center-state, .empty-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 1rem;
  padding: 3rem; text-align: center;
  color: var(--color-text-muted);
  background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow);
}
.empty-icon { font-size: 2.5rem; }
.spinner {
  width: 36px; height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Certificates ── */
.certificates-grid { display: flex; flex-direction: column; gap: 0.75rem; }

.cert-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow);
  border-left: 4px solid var(--color-accent);
}

.cert-badge { font-size: 2rem; flex-shrink: 0; }
.cert-info { flex: 1; }
.cert-stage { font-size: 0.72rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; }
.cert-title { font-size: 1rem; font-weight: 700; color: var(--color-secondary); }
.cert-code { font-size: 0.75rem; font-family: var(--font-mono); color: var(--color-text-muted); margin-top: 0.2rem; }
.cert-date { font-size: 0.75rem; color: var(--color-text-muted); }

/* ── Stage badges ── */
.stages-grid { display: flex; flex-direction: column; gap: 0.6rem; }

.stage-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: var(--radius);
  padding: 0.875rem 1.25rem;
  box-shadow: var(--shadow);
  border-left: 4px solid transparent;
}

.stage-completed { border-left-color: var(--color-success); }
.stage-active    { border-left-color: var(--color-primary); }
.stage-locked    { border-left-color: #e2e8f0; opacity: 0.65; }

.badge-icon { font-size: 1.5rem; flex-shrink: 0; width: 32px; text-align: center; }
.badge-info { flex: 1; }
.badge-name { font-size: 0.875rem; font-weight: 600; color: var(--color-secondary); }
.badge-status { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.1rem; }

.badge-bar {
  height: 4px; background: #e2e8f0;
  border-radius: 99px; overflow: hidden;
  margin-top: 0.4rem; width: 100%; max-width: 200px;
}
.badge-fill { height: 100%; background: var(--color-primary); border-radius: 99px; }
.badge-pct { font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); flex-shrink: 0; }
.badge-lock { font-size: 1rem; flex-shrink: 0; }

/* ── Level badges ── */
.badges-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.level-badge {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.25rem 1rem;
  text-align: center;
  box-shadow: var(--shadow);
  border: 2px solid #e2e8f0;
  opacity: 0.45;
  transition: opacity .2s, border-color .2s;
}

.badge-earned {
  opacity: 1;
  border-color: var(--color-accent);
}

.lbadge-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.lbadge-name { font-size: 0.875rem; font-weight: 700; color: var(--color-secondary); }
.lbadge-req  { font-size: 0.72rem; color: var(--color-text-muted); margin-top: 0.2rem; }

/* ── Buttons ── */
.btn {
  padding: 0.55rem 1.1rem;
  border-radius: var(--radius);
  font-weight: 600; font-size: 0.875rem;
  cursor: pointer; border: none;
  text-decoration: none; display: inline-block;
  transition: opacity .15s;
}
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: #005a3e; }
.btn-sm { padding: 0.4rem 0.8rem; font-size: 0.78rem; }
</style>