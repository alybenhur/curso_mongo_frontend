<template>
  <div class="profile-page">

    <!-- Header perfil -->
    <div class="profile-header">
      <div class="avatar-big">
        <img v-if="authStore.user?.avatarUrl" :src="authStore.user.avatarUrl" alt="Avatar" />
        <span v-else class="avatar-initials-big">
          {{ authStore.user?.name?.charAt(0).toUpperCase() }}
        </span>
      </div>
      <div class="profile-info">
        <h1 class="profile-name">{{ authStore.user?.name }}</h1>
        <p class="profile-email">{{ authStore.user?.email }}</p>
        <div class="profile-badges">
          <span class="level-chip">{{ levelIcon }} {{ authStore.user?.level }}</span>
          <span class="xp-chip">⭐ {{ authStore.user?.xp ?? 0 }} XP</span>
          <span class="streak-chip">🔥 {{ authStore.user?.streak ?? 0 }} días</span>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="stats-grid">
      <div class="stat-block">
        <div class="stat-num">{{ completedStages }}</div>
        <div class="stat-desc">Etapas completadas</div>
      </div>
      <div class="stat-block">
        <div class="stat-num">{{ totalLessons }}</div>
        <div class="stat-desc">Lecciones completadas</div>
      </div>
      <div class="stat-block">
        <div class="stat-num">{{ totalTime }} min</div>
        <div class="stat-desc">Tiempo de estudio</div>
      </div>
      <div class="stat-block">
        <div class="stat-num">{{ certificates }}</div>
        <div class="stat-desc">Certificados</div>
      </div>
    </div>

    <!-- Progreso global -->
    <div class="card">
      <h2 class="card-title">📈 Progreso general</h2>
      <div class="progress-row">
        <div class="progress-bar-wrap">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: (progressStore.summary?.globalPercent ?? 0) + '%' }"
            />
          </div>
        </div>
        <span class="progress-pct">{{ progressStore.summary?.globalPercent ?? 0 }}%</span>
      </div>
      <p class="progress-sub">
        {{ progressStore.summary?.completed ?? 0 }} de
        {{ progressStore.summary?.totalStages ?? 13 }} etapas completadas
      </p>
    </div>

    <!-- Editar perfil -->
    <div class="card">
      <h2 class="card-title">✏️ Editar perfil</h2>
      <form class="edit-form" @submit.prevent="saveProfile">
        <div class="form-group">
          <label>Nombre</label>
          <input v-model="form.name" type="text" :disabled="saving" />
        </div>
        <div v-if="saveError" class="alert-error">{{ saveError }}</div>
        <div v-if="saveSuccess" class="alert-success">✅ Perfil actualizado</div>
        <button type="submit" class="btn btn-primary" :disabled="saving || !form.name">
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </form>
    </div>

    <!-- Zona peligrosa -->
    <div class="card danger-card">
      <h2 class="card-title danger-title">⚠️ Sesión</h2>
      <p class="danger-desc">Cierra tu sesión actual en este dispositivo.</p>
      <button class="btn btn-danger" @click="logout">Cerrar sesión</button>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const authStore = useAuthStore()
const progressStore = useProgressStore()
const router = useRouter()
const { apiFetch } = useApi()

const form = reactive({ name: authStore.user?.name ?? '' })
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

onMounted(async () => {
  await progressStore.fetchProgress()
})

const levelIcon = computed(() => {
  const level = authStore.user?.level
  const map: Record<string, string> = {
    novato: '🌱', aprendiz: '📚', practicante: '⚙️',
    desarrollador: '🔧', arquitecto: '🏗', experto: '🍃',
  }
  return map[level ?? ''] ?? '🌱'
})

const completedStages = computed(() =>
  progressStore.progress.filter(p => p.status === 'completed').length
)
const totalLessons = computed(() =>
  progressStore.progress.reduce((acc, p) => acc + (p.completedLessons?.length ?? 0), 0)
)
const totalTime = computed(() =>
  progressStore.summary?.totalTimeMinutes ?? 0
)
const certificates = computed(() =>
  progressStore.progress.filter(p => p.certificateIssued).length
)

async function saveProfile() {
  if (!form.name.trim()) return
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    const updated = await apiFetch<any>('/users/me', {
      method: 'PATCH',
      body: { name: form.name },
    })
    authStore.user = { ...authStore.user!, name: updated.name }
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (err: any) {
    saveError.value = err?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

async function logout() {
  authStore.logout()
  await router.push('/auth/login')
}
</script>

<style scoped>
.profile-page { display: flex; flex-direction: column; gap: 1.5rem; max-width: 700px; }

/* ── Header ── */
.profile-header {
  display: flex; align-items: center; gap: 1.5rem;
  background: white; border-radius: var(--radius-lg);
  padding: 2rem; box-shadow: var(--shadow);
  flex-wrap: wrap;
}

.avatar-big {
  width: 80px; height: 80px; border-radius: 50%;
  background: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; flex-shrink: 0;
  border: 3px solid var(--color-accent);
}
.avatar-big img { width: 100%; height: 100%; object-fit: cover; }
.avatar-initials-big {
  color: white; font-size: 2rem; font-weight: 800;
}

.profile-name { font-size: 1.5rem; font-weight: 800; color: var(--color-secondary); }
.profile-email { color: var(--color-text-muted); font-size: 0.875rem; margin: 0.2rem 0 0.75rem; }

.profile-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.level-chip, .xp-chip, .streak-chip {
  font-size: 0.78rem; font-weight: 700;
  padding: 0.25rem 0.7rem; border-radius: 20px;
}
.level-chip  { background: #d1fae5; color: var(--color-primary); }
.xp-chip     { background: #fef9c3; color: #a16207; }
.streak-chip { background: #fef2f2; color: #dc2626; }

/* ── Stats ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.stat-block {
  background: white; border-radius: var(--radius-lg);
  padding: 1.25rem; text-align: center; box-shadow: var(--shadow);
}
.stat-num  { font-size: 1.75rem; font-weight: 800; color: var(--color-secondary); }
.stat-desc { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.2rem; }

/* ── Card ── */
.card {
  background: white; border-radius: var(--radius-lg);
  padding: 1.5rem; box-shadow: var(--shadow);
  display: flex; flex-direction: column; gap: 1rem;
}
.card-title { font-size: 1rem; font-weight: 700; color: var(--color-secondary); }

/* ── Progress ── */
.progress-row { display: flex; align-items: center; gap: 1rem; }
.progress-bar-wrap { flex: 1; }
.progress-bar {
  height: 12px; background: #e2e8f0;
  border-radius: 99px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: var(--color-primary);
  border-radius: 99px; transition: width 0.5s ease;
}
.progress-pct { font-size: 0.9rem; font-weight: 700; color: var(--color-primary); }
.progress-sub { font-size: 0.82rem; color: var(--color-text-muted); }

/* ── Form ── */
.edit-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
.form-group input {
  padding: 0.65rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.9rem; outline: none;
  transition: border-color .15s;
}
.form-group input:focus { border-color: var(--color-primary); }
.form-group input:disabled { background: #f8fafc; }

.alert-error {
  background: #fef2f2; color: var(--color-danger);
  border: 1px solid #fecaca;
  border-radius: var(--radius); padding: 0.6rem 0.875rem; font-size: 0.82rem;
}
.alert-success {
  background: #f0fdf4; color: var(--color-success);
  border: 1px solid #86efac;
  border-radius: var(--radius); padding: 0.6rem 0.875rem; font-size: 0.82rem;
}

/* ── Danger ── */
.danger-card { border: 1.5px solid #fecaca; }
.danger-title { color: var(--color-danger); }
.danger-desc  { font-size: 0.875rem; color: var(--color-text-muted); }

/* ── Buttons ── */
.btn {
  padding: 0.6rem 1.25rem; border-radius: var(--radius);
  font-weight: 600; font-size: 0.875rem;
  cursor: pointer; border: none; transition: opacity .15s;
  display: inline-block; text-align: center;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover:not(:disabled) { background: #005a3e; }
.btn-danger  { background: var(--color-danger); color: white; }
.btn-danger:hover { opacity: 0.85; }
</style>