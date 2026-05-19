<template>
  <div class="profesor-page">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">👨‍🏫 Panel del Profesor</h1>
        <p class="page-subtitle">Seguimiento y análisis del progreso de tus estudiantes</p>
      </div>
      <div class="header-stats">
        <div class="hstat">
          <span class="hstat-val">{{ students.length }}</span>
          <span class="hstat-lbl">Estudiantes</span>
        </div>
        <div class="hstat">
          <span class="hstat-val">{{ activeToday }}</span>
          <span class="hstat-lbl">Activos hoy</span>
        </div>
        <div class="hstat">
          <span class="hstat-val">{{ avgGlobal }}%</span>
          <span class="hstat-lbl">Avance prom.</span>
        </div>
        <div class="hstat">
          <span class="hstat-val">{{ totalCertificates }}</span>
          <span class="hstat-lbl">Certificados</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <p>Cargando estudiantes...</p>
    </div>

    <template v-else>
      <!-- Buscador y filtros -->
      <div class="toolbar">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por nombre o correo..."
            class="search-input"
          />
        </div>
        <select v-model="filterLevel" class="filter-select">
          <option value="">Todos los niveles</option>
          <option value="novato">🌱 Novato</option>
          <option value="aprendiz">📚 Aprendiz</option>
          <option value="practicante">⚙️ Practicante</option>
          <option value="experto">🎯 Experto</option>
          <option value="maestro">🏆 Maestro</option>
        </select>
        <select v-model="filterProgress" class="filter-select">
          <option value="">Cualquier avance</option>
          <option value="0">Sin iniciar (0%)</option>
          <option value="low">Bajo (&lt; 30%)</option>
          <option value="mid">Medio (30–70%)</option>
          <option value="high">Alto (&gt; 70%)</option>
        </select>
      </div>

      <!-- Tabla de estudiantes -->
      <div class="table-wrap">
        <table class="students-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Nivel / XP</th>
              <th>Avance global</th>
              <th>Etapas</th>
              <th>Racha</th>
              <th>Certificados</th>
              <th>Último acceso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredStudents.length === 0">
              <td colspan="8" class="empty-row">No se encontraron estudiantes</td>
            </tr>
            <tr
              v-for="s in filteredStudents"
              :key="s._id"
              class="student-row"
              @click="openStudent(s._id)"
            >
              <td>
                <div class="student-info">
                  <div class="avatar">{{ s.name.charAt(0).toUpperCase() }}</div>
                  <div>
                    <div class="student-name">{{ s.name }}</div>
                    <div class="student-email">{{ s.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="level-badge">{{ levelIcon(s.level) }} {{ s.level }}</span>
                <div class="xp-text">{{ s.xp }} XP</div>
              </td>
              <td>
                <div class="progress-cell">
                  <div class="mini-bar">
                    <div
                      class="mini-fill"
                      :style="{ width: `${progressOf(s._id)}%` }"
                      :class="progressClass(progressOf(s._id))"
                    />
                  </div>
                  <span class="pct-text">{{ progressOf(s._id) }}%</span>
                </div>
              </td>
              <td class="center">
                <span class="pill pill-blue">{{ completedOf(s._id) }} / {{ totalStages }}</span>
              </td>
              <td class="center">
                <span class="streak-val">🔥 {{ s.streak }}</span>
              </td>
              <td class="center">
                <span class="pill pill-green">🎓 {{ certsOf(s._id) }}</span>
              </td>
              <td class="muted-sm">{{ formatDate(s.lastActiveDate) }}</td>
              <td>
                <button class="btn-detail" @click.stop="openStudent(s._id)">
                  Ver →
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'profesor' })

const router = useRouter()
const { apiFetch } = useApi()

const loading = ref(true)
const search = ref('')
const filterLevel = ref('')
const filterProgress = ref('')

// Datos en bruto
const students = ref<any[]>([])
const progressMap = ref<Record<string, any>>({})  // userId → summary

// ── Carga de datos ────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [studs, allProg] = await Promise.all([
      apiFetch<any[]>('/users/students'),
      apiFetch<any[]>('/progress/admin/all'),
    ])
    students.value = studs

    // Construir mapa progreso por userId
    allProg.forEach((p: any) => {
      progressMap.value[String(p._id)] = p
    })
  } catch (e) {
    console.error('Error cargando datos', e)
  } finally {
    loading.value = false
  }
})

// ── Helpers de progreso ───────────────────────────────────────────────────────
const totalStages = 13

function progressOf(userId: string): number {
  return Math.round(progressMap.value[userId]?.globalPercent ?? 0)
}

function completedOf(userId: string): number {
  return progressMap.value[userId]?.completed ?? 0
}

function certsOf(userId: string): number {
  // globalPercent viene del aggregate; buscamos certificados contando completed
  return progressMap.value[userId]?.completed ?? 0
}

function progressClass(pct: number) {
  if (pct >= 70) return 'fill-high'
  if (pct >= 30) return 'fill-mid'
  return 'fill-low'
}

// ── KPIs del header ───────────────────────────────────────────────────────────
const activeToday = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return students.value.filter((s) => {
    if (!s.lastActiveDate) return false
    return new Date(s.lastActiveDate) >= today
  }).length
})

const avgGlobal = computed(() => {
  if (students.value.length === 0) return 0
  const total = students.value.reduce(
    (acc, s) => acc + progressOf(s._id), 0,
  )
  return Math.round(total / students.value.length)
})

const totalCertificates = computed(() =>
  students.value.reduce((acc, s) => acc + certsOf(s._id), 0),
)

// ── Filtrado ──────────────────────────────────────────────────────────────────
const filteredStudents = computed(() => {
  let list = students.value

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    )
  }

  if (filterLevel.value) {
    list = list.filter((s) => s.level === filterLevel.value)
  }

  if (filterProgress.value) {
    list = list.filter((s) => {
      const pct = progressOf(s._id)
      if (filterProgress.value === '0') return pct === 0
      if (filterProgress.value === 'low') return pct > 0 && pct < 30
      if (filterProgress.value === 'mid') return pct >= 30 && pct <= 70
      if (filterProgress.value === 'high') return pct > 70
      return true
    })
  }

  return list
})

// ── Utilidades ────────────────────────────────────────────────────────────────
function levelIcon(level: string) {
  const icons: Record<string, string> = {
    novato: '🌱', aprendiz: '📚', practicante: '⚙️', experto: '🎯', maestro: '🏆',
  }
  return icons[level] ?? '👤'
}

function formatDate(date: string | null) {
  if (!date) return 'Nunca'
  const d = new Date(date)
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff < 7) return `Hace ${diff} días`
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function openStudent(id: string) {
  router.push(`/profesor/${id}`)
}
</script>

<style scoped>
.profesor-page { display: flex; flex-direction: column; gap: 1.5rem; }

/* ── Header ── */
.page-header {
  display: flex; justify-content: space-between;
  align-items: flex-start; flex-wrap: wrap; gap: 1.5rem;
}
.page-title { font-size: 1.75rem; font-weight: 800; color: var(--color-secondary); }
.page-subtitle { color: var(--color-text-muted); margin-top: .25rem; font-size: .9rem; }

.header-stats { display: flex; gap: 1rem; flex-wrap: wrap; }
.hstat {
  display: flex; flex-direction: column; align-items: center;
  background: white; padding: .85rem 1.4rem; border-radius: var(--radius);
  box-shadow: var(--shadow); min-width: 90px; text-align: center;
}
.hstat-val { font-size: 1.5rem; font-weight: 800; color: var(--color-primary); }
.hstat-lbl { font-size: .72rem; color: var(--color-text-muted); margin-top: .1rem; }

/* ── Toolbar ── */
.toolbar {
  display: flex; gap: .75rem; flex-wrap: wrap; align-items: center;
}
.search-wrap {
  display: flex; align-items: center; gap: .5rem;
  background: white; border: 1.5px solid var(--color-border);
  border-radius: var(--radius); padding: .5rem .9rem; flex: 1; min-width: 220px;
}
.search-icon { font-size: 1rem; }
.search-input {
  border: none; outline: none; width: 100%;
  font-size: .9rem; background: transparent; color: var(--color-text);
}
.filter-select {
  padding: .55rem .9rem; border: 1.5px solid var(--color-border);
  border-radius: var(--radius); font-size: .875rem;
  background: white; color: var(--color-text); cursor: pointer;
}

/* ── Tabla ── */
.table-wrap { background: white; border-radius: 12px; box-shadow: var(--shadow); overflow: auto; }

.students-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.students-table thead tr {
  background: #f8fafc; border-bottom: 1.5px solid var(--color-border);
}
.students-table th {
  padding: .85rem 1rem; text-align: left; font-size: .75rem;
  font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;
  letter-spacing: .4px; white-space: nowrap;
}
.student-row {
  border-bottom: 1px solid var(--color-border);
  cursor: pointer; transition: background .12s;
}
.student-row:last-child { border-bottom: none; }
.student-row:hover { background: #f0fdf4; }

.students-table td { padding: .9rem 1rem; vertical-align: middle; }
.center { text-align: center; }
.empty-row { text-align: center; color: var(--color-text-muted); padding: 3rem; }

/* ── Celdas ── */
.student-info { display: flex; align-items: center; gap: .75rem; }
.avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--color-primary); color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: .9rem; flex-shrink: 0;
}
.student-name { font-weight: 600; color: var(--color-secondary); }
.student-email { font-size: .78rem; color: var(--color-text-muted); }

.level-badge { font-size: .78rem; font-weight: 600; color: var(--color-secondary); }
.xp-text { font-size: .72rem; color: var(--color-primary); margin-top: .15rem; }

.progress-cell { display: flex; align-items: center; gap: .5rem; min-width: 100px; }
.mini-bar { flex: 1; height: 7px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
.mini-fill { height: 100%; border-radius: 99px; transition: width .4s; }
.fill-high { background: var(--color-success); }
.fill-mid  { background: var(--color-warning); }
.fill-low  { background: #e2e8f0; }
.pct-text  { font-size: .75rem; font-weight: 700; color: var(--color-text-muted); white-space: nowrap; }

.pill { font-size: .75rem; font-weight: 700; padding: .2rem .6rem; border-radius: 20px; }
.pill-blue  { background: #dbeafe; color: #1e40af; }
.pill-green { background: #d1fae5; color: #065f46; }

.streak-val { font-size: .82rem; font-weight: 600; color: #ea580c; }
.muted-sm { font-size: .78rem; color: var(--color-text-muted); white-space: nowrap; }

.btn-detail {
  padding: .35rem .8rem; border-radius: var(--radius);
  border: 1.5px solid var(--color-primary); background: transparent;
  color: var(--color-primary); font-size: .78rem; font-weight: 700;
  cursor: pointer; transition: all .15s; white-space: nowrap;
}
.btn-detail:hover { background: var(--color-primary); color: white; }

/* ── Loading ── */
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
</style>
