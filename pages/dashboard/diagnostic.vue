<template>
  <div class="diagnostic-page">
    <!-- Paso: bienvenida -->
    <div v-if="step === 'welcome'" class="welcome-card">
      <div class="welcome-icon">🍃</div>
      <h1>¡Bienvenido a MongoTutor!</h1>
      <p class="welcome-sub">
        Antes de comenzar, responde 5 preguntas rápidas para conocer tu nivel
        actual en MongoDB. Esto nos ayudará a personalizar tu experiencia.
      </p>
      <div class="welcome-features">
        <div class="feature">⏱ Solo toma 2 minutos</div>
        <div class="feature">📊 5 preguntas de diagnóstico</div>
        <div class="feature">🚀 Sin impacto en tu calificación</div>
      </div>
      <button class="btn btn-primary btn-lg" @click="step = 'quiz'">
        Comenzar diagnóstico →
      </button>
    </div>

    <!-- Paso: quiz -->
    <div v-else-if="step === 'quiz'" class="quiz-card">
      <!-- Barra de progreso -->
      <div class="quiz-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${((currentQ + 1) / questions.length) * 100}%` }"
          />
        </div>
        <span class="progress-text">
          {{ currentQ + 1 }} / {{ questions.length }}
        </span>
      </div>

      <!-- Pregunta actual -->
      <div class="question-area" :key="currentQ">
        <div class="q-category">{{ questions[currentQ].category }}</div>
        <h2 class="q-text">{{ questions[currentQ].text }}</h2>

        <div class="options">
          <button
            v-for="opt in questions[currentQ].options"
            :key="opt.key"
            class="option-btn"
            :class="{ selected: selected === opt.key }"
            @click="selected = opt.key"
          >
            <span class="opt-key">{{ opt.key.toUpperCase() }}</span>
            <span>{{ opt.text }}</span>
          </button>
        </div>

        <button
          class="btn btn-primary"
          :disabled="!selected"
          @click="nextQuestion"
        >
          {{ currentQ < questions.length - 1 ? 'Siguiente →' : 'Ver resultado' }}
        </button>
      </div>
    </div>

    <!-- Paso: resultado -->
    <div v-else-if="step === 'result'" class="result-card">
      <div class="result-icon">{{ levelIcon }}</div>
      <h2 class="result-title">Tu nivel: <span class="level-name">{{ levelLabel }}</span></h2>
      <p class="result-desc">{{ levelDesc }}</p>

      <div class="score-breakdown">
        <div v-for="(score, area) in scores" :key="area" class="score-row">
          <span class="score-area">{{ areaLabels[area] }}</span>
          <div class="score-bar-wrap">
            <div class="score-bar">
              <div class="score-fill" :style="{ width: score + '%' }" />
            </div>
            <span class="score-pct">{{ score }}%</span>
          </div>
        </div>
      </div>

      <button class="btn btn-primary btn-lg" :disabled="saving" @click="finish">
        {{ saving ? 'Iniciando tu camino...' : '🚀 Comenzar aprendizaje' }}
      </button>

      <div v-if="error" class="alert-error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const authStore = useAuthStore()
const router = useRouter()
const { apiFetch } = useApi()

// ── Preguntas de diagnóstico ──────────────────────────────────────────────────
const questions = [
  {
    area: 'crud',
    category: '📄 Operaciones CRUD',
    text: '¿Cuál método de MongoDB actualiza solo los campos especificados sin reemplazar el documento completo?',
    options: [
      { key: 'a', text: 'replaceOne()' },
      { key: 'b', text: 'updateOne() con $set' },
      { key: 'c', text: 'insertOne()' },
      { key: 'd', text: 'findOne()' },
    ],
    correct: 'b',
  },
  {
    area: 'aggregation',
    category: '🔗 Aggregation Pipeline',
    text: '¿Qué etapa del pipeline calcula valores acumulados como sumas o promedios agrupando documentos?',
    options: [
      { key: 'a', text: '$match' },
      { key: 'b', text: '$sort' },
      { key: 'c', text: '$group' },
      { key: 'd', text: '$project' },
    ],
    correct: 'c',
  },
  {
    area: 'indexes',
    category: '⚡ Índices',
    text: '¿Qué tipo de índice permite buscar texto completo en campos string?',
    options: [
      { key: 'a', text: 'Índice compuesto' },
      { key: 'b', text: 'Índice de texto (text index)' },
      { key: 'c', text: 'Índice único' },
      { key: 'd', text: 'Índice geoespacial' },
    ],
    correct: 'b',
  },
  {
    area: 'modeling',
    category: '🏗 Modelado de datos',
    text: '¿Cuándo es preferible EMBEBER un documento dentro de otro en MongoDB?',
    options: [
      { key: 'a', text: 'Cuando los datos relacionados se acceden siempre juntos' },
      { key: 'b', text: 'Cuando los datos tienen muchas actualizaciones independientes' },
      { key: 'c', text: 'Cuando hay miles de subdocumentos' },
      { key: 'd', text: 'Nunca, siempre se debe referenciar' },
    ],
    correct: 'a',
  },
  {
    area: 'security',
    category: '🔒 Seguridad',
    text: '¿Qué mecanismo usa MongoDB para controlar qué operaciones puede realizar cada usuario?',
    options: [
      { key: 'a', text: 'SSL/TLS únicamente' },
      { key: 'b', text: 'Roles y privilegios (RBAC)' },
      { key: 'c', text: 'Solo contraseñas de base de datos' },
      { key: 'd', text: 'Firewalls de red' },
    ],
    correct: 'b',
  },
]

// ── Estado ────────────────────────────────────────────────────────────────────
const step = ref<'welcome' | 'quiz' | 'result'>('welcome')
const currentQ = ref(0)
const selected = ref<string | null>(null)
const answers = ref<Record<string, string>>({})
const saving = ref(false)
const error = ref('')

// ── Puntuaciones por área ─────────────────────────────────────────────────────
const scores = ref<Record<string, number>>({
  crud: 0,
  aggregation: 0,
  indexes: 0,
  modeling: 0,
  security: 0,
})

const areaLabels: Record<string, string> = {
  crud: '📄 CRUD',
  aggregation: '🔗 Aggregation',
  indexes: '⚡ Índices',
  modeling: '🏗 Modelado',
  security: '🔒 Seguridad',
}

// ── Nivel calculado ───────────────────────────────────────────────────────────
const avgScore = computed(() =>
  Math.round(Object.values(scores.value).reduce((a, b) => a + b, 0) / 5)
)

const levelIcon = computed(() => {
  if (avgScore.value >= 80) return '🏆'
  if (avgScore.value >= 50) return '📈'
  return '🌱'
})

const levelLabel = computed(() => {
  if (avgScore.value >= 80) return 'Avanzado'
  if (avgScore.value >= 50) return 'Intermedio'
  return 'Principiante'
})

const levelDesc = computed(() => {
  if (avgScore.value >= 80)
    return 'Tienes una sólida base en MongoDB. Podrás avanzar rápidamente por el currículo y enfocarte en los temas más desafiantes.'
  if (avgScore.value >= 50)
    return 'Conoces los conceptos básicos. El currículo reforzará tus fundamentos y te llevará a dominar temas avanzados.'
  return 'Estás comenzando tu viaje con MongoDB. El currículo te guiará paso a paso desde los fundamentos hasta los conceptos avanzados.'
})

// ── Lógica del quiz ───────────────────────────────────────────────────────────
function nextQuestion() {
  if (!selected.value) return

  const q = questions[currentQ.value]
  answers.value[q.area] = selected.value
  scores.value[q.area] = selected.value === q.correct ? 100 : 0

  if (currentQ.value < questions.length - 1) {
    currentQ.value++
    selected.value = null
  } else {
    step.value = 'result'
  }
}

async function finish() {
  saving.value = true
  error.value = ''
  try {
    // 1. Guardar scores del diagnóstico
    await apiFetch('/users/me/diagnostic', {
      method: 'POST',
      body: scores.value,
    })

    // 2. Resetear y recrear progreso de etapas desde cero
    //    (garantiza que no queden datos corruptos de intentos anteriores)
    await apiFetch('/progress/reset', { method: 'POST' })

    // 3. Actualizar el usuario en el store
    authStore.user = { ...authStore.user!, diagnosticCompleted: true }
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }

    // 4. Ir al dashboard
    await router.push('/dashboard')
  } catch (err: any) {
    error.value = err?.data?.message || 'Error al guardar el diagnóstico. Intenta de nuevo.'
  } finally {
    saving.value = false
  }
}

// Si ya completó el diagnóstico, redirigir al dashboard
onMounted(() => {
  if (authStore.user?.diagnosticCompleted) {
    router.push('/dashboard')
  }
})
</script>

<style scoped>
.diagnostic-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

/* ── Welcome ── */
.welcome-card,
.quiz-card,
.result-card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.welcome-icon { font-size: 4rem; margin-bottom: 1rem; }

.welcome-card h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-secondary);
  margin-bottom: 1rem;
}

.welcome-sub {
  color: var(--color-text-muted);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.welcome-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.feature {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
}

/* ── Quiz ── */
.quiz-card { text-align: left; }

.quiz-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 99px;
  transition: width 0.4s ease;
}

.progress-text {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.question-area {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}

.q-category {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.q-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.4;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
  width: 100%;
}

.option-btn:hover {
  border-color: var(--color-primary);
  background: #f0fdf4;
}

.option-btn.selected {
  border-color: var(--color-primary);
  background: #d1fae5;
  color: #065f46;
  font-weight: 600;
}

.opt-key {
  background: var(--color-secondary);
  color: white;
  border-radius: 4px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.option-btn.selected .opt-key {
  background: var(--color-primary);
}

/* ── Result ── */
.result-card { text-align: center; }

.result-icon { font-size: 4rem; margin-bottom: 1rem; }

.result-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-secondary);
  margin-bottom: 0.75rem;
}

.level-name { color: var(--color-primary); }

.result-desc {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  text-align: left;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.score-area {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text);
  width: 130px;
  flex-shrink: 0;
}

.score-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.score-bar {
  flex: 1;
  height: 10px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 99px;
  transition: width 0.6s ease;
}

.score-pct {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-text-muted);
  width: 36px;
  text-align: right;
}

/* ── Botones ── */
.btn {
  padding: 0.65rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}

.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover:not(:disabled) { background: #005a3e; }
.btn-lg { padding: 0.85rem 2rem; font-size: 1rem; }

.alert-error {
  background: #fef2f2;
  color: var(--color-danger);
  border: 1px solid #fecaca;
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  margin-top: 1rem;
}
</style>