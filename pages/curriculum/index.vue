<template>
  <div class="curriculum-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Currículo del curso</h1>
        <p class="page-subtitle">13 etapas para dominar MongoDB y NoSQL</p>
      </div>
      <div v-if="progressStore.summary" class="global-progress">
        <div class="global-percent">{{ progressStore.summary.globalPercent }}%</div>
        <div class="global-bar">
          <div
            class="global-bar-fill"
            :style="{ width: `${progressStore.summary.globalPercent}%` }"
          />
        </div>
        <div class="global-stats">
          <span>✅ {{ progressStore.summary.completed }} completadas</span>
          <span>📖 {{ progressStore.summary.inProgress }} en progreso</span>
          <span>⏱ {{ Math.round(progressStore.summary.totalTimeMinutes / 60) }}h</span>
        </div>
      </div>
    </div>

    <div v-if="progressStore.loading" class="loading-grid">
      <div v-for="i in 13" :key="i" class="skeleton-card" />
    </div>

    <!-- Banner de reparación: cuando el diagnóstico está completo pero todo sigue bloqueado -->
    <div
      v-else-if="authStore.user?.diagnosticCompleted && allStagesLocked && !fixing"
      class="repair-banner"
    >
      <span>⚠️</span>
      <div>
        <strong>Se detectó un problema con tu progreso</strong>
        <p>Tu diagnóstico está completo pero las etapas aparecen bloqueadas. Haz clic para repararlas.</p>
      </div>
      <button class="btn btn-primary" @click="repairProgress">
        🔧 Reparar progreso
      </button>
    </div>

    <div v-else class="stages-grid">
      <CurriculumStageCard
        v-for="stage in progressStore.getStageWithProgress"
        :key="stage._id"
        :stage="stage"
        :progress="stage.progress"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const progressStore = useProgressStore()
const authStore = useAuthStore()
const fixing = ref(false)

// Detecta si TODOS los registros están bloqueados (o no existen aún)
const allStagesLocked = computed(() =>
  progressStore.progress.length === 0 ||
  progressStore.progress.every((p) => p.status === 'locked')
)

async function repairProgress() {
  fixing.value = true
  await progressStore.resetProgress()   // borra y recrea con etapa 1 activa
  fixing.value = false
}

onMounted(async () => {
  await Promise.all([
    progressStore.fetchStages(),
    progressStore.fetchProgress(),
  ])

  // Si el diagnóstico está completo, intentar inicializar/reparar automáticamente
  if (authStore.user?.diagnosticCompleted) {
    await progressStore.initializeProgress()
  } else if (progressStore.progress.length === 0) {
    await progressStore.initializeProgress()
  }
})
</script>

<style scoped>
.curriculum-page { display: flex; flex-direction: column; gap: 2rem; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.page-subtitle { color: var(--color-text-muted); margin-top: 0.25rem; }

.global-progress {
  background: white;
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  min-width: 260px;
}

.global-percent {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.global-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.global-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 99px;
  transition: width .4s ease;
}

.global-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  flex-wrap: wrap;
}

.stages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.skeleton-card {
  height: 220px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.repair-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fffbeb;
  border: 1.5px solid #fde68a;
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  font-size: 0.9rem;
}
.repair-banner span:first-child { font-size: 1.5rem; }
.repair-banner div { flex: 1; }
.repair-banner strong { display: block; margin-bottom: 0.2rem; }
.repair-banner p { color: var(--color-text-muted); margin: 0; font-size: 0.85rem; }
.btn { padding: 0.6rem 1.25rem; border-radius: var(--radius); font-weight: 600;
  font-size: 0.875rem; cursor: pointer; border: none; }
.btn-primary { background: var(--color-primary); color: white; }
</style>
