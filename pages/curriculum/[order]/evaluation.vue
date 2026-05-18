<template>
  <div class="eval-page">
    <!-- Header -->
    <div class="eval-header">
      <NuxtLink :to="`/curriculum/${order}`" class="back-link">← Volver a la etapa</NuxtLink>
      <div class="eval-hero">
        <div class="hero-left">
          <span class="eval-tag">📝 Evaluación</span>
          <h1>Etapa {{ order }} — Evaluación Final</h1>
          <p v-if="stage">{{ stage.title }}</p>
        </div>
        <div class="hero-right" v-if="!evalStore.result && !evalStore.loading">
          <div class="counter">
            <span class="counter-val">{{ evalStore.answeredCount }}</span>
            <span class="counter-total"> / {{ evalStore.questions.length }}</span>
          </div>
          <div class="counter-label">respondidas</div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="evalStore.loading" class="center-state">
      <div class="spinner" />
      <p>Cargando preguntas...</p>
    </div>

    <!-- Error -->
    <div v-else-if="evalStore.error && !evalStore.result" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ evalStore.error }}</p>
      <NuxtLink :to="`/curriculum/${order}`" class="btn btn-outline">Volver a la etapa</NuxtLink>
    </div>

    <!-- Resultado -->
    <div v-else-if="evalStore.result" class="result-panel">
      <div class="result-card" :class="evalStore.result.passed ? 'result-pass' : 'result-fail'">
        <div class="result-icon">{{ evalStore.result.passed ? '🏆' : '😔' }}</div>
        <h2 class="result-title">
          {{ evalStore.result.passed ? '¡Aprobado!' : 'No aprobado' }}
        </h2>
        <div class="result-score">{{ evalStore.result.score }}<span class="score-suffix">%</span></div>
        <p class="result-subtitle">
          {{ evalStore.result.earnedPoints }} / {{ evalStore.result.totalPoints }} puntos
        </p>
        <p v-if="evalStore.result.passed" class="result-msg pass">
          ✅ Has superado la etapa {{ order }}. ¡La siguiente etapa está desbloqueada!
        </p>
        <p v-else class="result-msg fail">
          Necesitas al menos 70% para aprobar. Puedes intentarlo de nuevo.
        </p>

        <!-- Certificado -->
        <div v-if="evalStore.result.certificateCode" class="cert-box">
          <div class="cert-icon">🎓</div>
          <div>
            <strong>Certificado generado</strong>
            <div class="cert-code">Código: {{ evalStore.result.certificateCode }}</div>
          </div>
          <button
            class="btn btn-primary btn-sm"
            :disabled="downloading"
            @click="downloadCertificate"
          >
            {{ downloading ? '⏳ Generando...' : '📄 Descargar PDF' }}
          </button>
        </div>
      </div>

      <!-- Revisión de respuestas -->
      <div class="answers-review">
        <h3 class="review-title">Revisión de respuestas</h3>
        <div
          v-for="(q, idx) in evalStore.questions"
          :key="q._id"
          class="review-item"
        >
          <div class="review-header">
            <span class="q-num">{{ idx + 1 }}</span>
            <span class="q-text">{{ q.text }}</span>
            <span class="q-result" :class="getAnswerDetail(q._id)?.correct ? 'correct' : 'wrong'">
              {{ getAnswerDetail(q._id)?.correct ? '✅' : '❌' }}
            </span>
          </div>

          <div class="review-options">
            <div
              v-for="opt in q.options"
              :key="opt.key"
              class="review-opt"
              :class="{
                'opt-selected': evalStore.selectedAnswers[q._id] === opt.key,
                'opt-correct': getAnswerDetail(q._id)?.correctKey === opt.key,
                'opt-wrong': evalStore.selectedAnswers[q._id] === opt.key && !getAnswerDetail(q._id)?.correct,
              }"
            >
              <span class="opt-key">{{ opt.key.toUpperCase() }}</span>
              {{ opt.text }}
            </div>
          </div>

          <div class="review-explanation" v-if="getAnswerDetail(q._id)?.explanation">
            💡 {{ getAnswerDetail(q._id)?.explanation }}
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="result-actions">
        <button v-if="!evalStore.result.passed" class="btn btn-primary" @click="retake">
          🔄 Reintentar
        </button>
        <NuxtLink :to="`/curriculum/${order}`" class="btn btn-outline">
          ← Volver a la etapa
        </NuxtLink>
        <NuxtLink v-if="evalStore.result.passed" to="/curriculum" class="btn btn-primary">
          Siguiente etapa →
        </NuxtLink>
      </div>
    </div>

    <!-- Cuestionario -->
    <div v-else class="quiz-panel">
      <!-- Barra de progreso -->
      <div class="quiz-progress-bar">
        <div
          class="quiz-progress-fill"
          :style="{ width: `${(evalStore.answeredCount / evalStore.questions.length) * 100}%` }"
        />
      </div>

      <div class="questions-list">
        <div
          v-for="(q, idx) in evalStore.questions"
          :key="q._id"
          class="question-card"
          :class="{ 'question-answered': evalStore.selectedAnswers[q._id] }"
        >
          <div class="question-header">
            <span class="q-badge">{{ idx + 1 }} / {{ evalStore.questions.length }}</span>
            <span class="q-points">{{ q.points }} pt{{ q.points > 1 ? 's' : '' }}</span>
          </div>
          <p class="question-text">{{ q.text }}</p>

          <div class="options-grid">
            <button
              v-for="opt in q.options"
              :key="opt.key"
              class="option-btn"
              :class="{ 'option-selected': evalStore.selectedAnswers[q._id] === opt.key }"
              @click="evalStore.selectAnswer(q._id, opt.key)"
            >
              <span class="option-key">{{ opt.key.toUpperCase() }}</span>
              <span class="option-text">{{ opt.text }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Botón enviar -->
      <div class="submit-bar">
        <div class="submit-info">
          <span>{{ evalStore.answeredCount }} de {{ evalStore.questions.length }} preguntas respondidas</span>
          <span v-if="!evalStore.allAnswered" class="hint">Responde todas las preguntas para enviar</span>
        </div>
        <button
          class="btn btn-primary btn-lg"
          :disabled="!evalStore.allAnswered || evalStore.submitting"
          @click="submit"
        >
          {{ evalStore.submitting ? 'Enviando...' : '📤 Enviar evaluación' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const evalStore = useEvaluationStore()
const progressStore = useProgressStore()
const authStore = useAuthStore()
const config = useRuntimeConfig()
const order = Number(route.params.order)

const stage = computed(() => progressStore.currentStage)
const downloading = ref(false)

function getAnswerDetail(questionId: string) {
  return evalStore.result?.answers.find((a) => a.questionId === questionId)
}

async function submit() {
  await evalStore.submitEvaluation(order)
  await progressStore.fetchProgress()
}

function retake() {
  evalStore.resetEvaluation()
  evalStore.fetchQuestions(order)
}

// Descarga el PDF con el token JWT en el header Authorization
async function downloadCertificate() {
  downloading.value = true
  try {
    const response = await fetch(
      `${config.public.apiBase}/evaluation/${order}/certificate`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      },
    )

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || `Error ${response.status}`)
    }

    // Crear Blob y forzar descarga en el navegador
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `certificado-etapa-${order}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    alert(`No se pudo descargar el certificado: ${err.message}`)
  } finally {
    downloading.value = false
  }
}

onMounted(async () => {
  if (!progressStore.currentStage || progressStore.currentStage.order !== order) {
    await progressStore.fetchStageWithLessons(order)
  }
  await evalStore.fetchQuestions(order)
})

onUnmounted(() => {
  evalStore.resetEvaluation()
})
</script>

<style scoped>
.eval-page { display: flex; flex-direction: column; gap: 1.5rem; }

.back-link {
  display: inline-flex; align-items: center; gap: .3rem;
  color: var(--color-text-muted); font-size: .875rem;
  text-decoration: none; margin-bottom: .75rem;
}
.back-link:hover { color: var(--color-primary); }

.eval-hero {
  display: flex; justify-content: space-between; align-items: flex-start;
  background: white; padding: 1.5rem; border-radius: 12px;
  box-shadow: var(--shadow);
}

.eval-tag {
  font-size: .72rem; font-weight: 700; color: var(--color-primary);
  background: #d1fae5; padding: .2rem .6rem; border-radius: 20px;
  display: inline-block; margin-bottom: .5rem;
}

.eval-hero h1 { font-size: 1.4rem; font-weight: 800; color: var(--color-secondary); margin: .25rem 0; }
.eval-hero p { color: var(--color-text-muted); font-size: .9rem; margin: 0; }

.hero-right { text-align: center; }
.counter { font-size: 2.5rem; font-weight: 800; color: var(--color-secondary); line-height: 1; }
.counter-total { font-size: 1.5rem; color: var(--color-text-muted); font-weight: 400; }
.counter-label { font-size: .75rem; color: var(--color-text-muted); margin-top: .25rem; }

/* ── Estado central ── */
.center-state, .error-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 1rem; padding: 4rem; color: var(--color-text-muted); text-align: center;
}
.error-icon { font-size: 2.5rem; }
.spinner {
  width: 36px; height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Resultado ── */
.result-panel { display: flex; flex-direction: column; gap: 1.5rem; }

.result-card {
  background: white; border-radius: 16px; padding: 2.5rem;
  text-align: center; box-shadow: var(--shadow);
  border-top: 6px solid;
}
.result-pass { border-color: var(--color-success); }
.result-fail { border-color: var(--color-danger); }

.result-icon { font-size: 3.5rem; }
.result-title { font-size: 2rem; font-weight: 800; margin: .5rem 0; }
.result-pass .result-title { color: var(--color-success); }
.result-fail .result-title { color: var(--color-danger); }

.result-score {
  font-size: 4rem; font-weight: 900;
  color: var(--color-secondary); line-height: 1;
}
.score-suffix { font-size: 2rem; }
.result-subtitle { color: var(--color-text-muted); font-size: .9rem; margin: .5rem 0; }
.result-msg { font-size: .95rem; font-weight: 500; margin-top: 1rem; }
.result-msg.pass { color: var(--color-success); }
.result-msg.fail { color: var(--color-danger); }

.cert-box {
  display: flex; align-items: center; gap: 1rem;
  background: #d1fae5; border: 1.5px solid #86efac;
  border-radius: var(--radius); padding: 1rem 1.25rem;
  margin-top: 1.5rem; text-align: left;
}
.cert-icon { font-size: 2rem; }
.cert-code { font-size: .8rem; font-family: var(--font-mono); color: var(--color-text-muted); margin-top: .2rem; }

/* ── Revisión ── */
.answers-review { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: var(--shadow); }
.review-title { font-size: 1.1rem; font-weight: 700; color: var(--color-secondary); margin-bottom: 1.25rem; }

.review-item {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--color-border);
}
.review-item:last-child { border-bottom: none; }

.review-header {
  display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .75rem;
}
.q-num {
  background: var(--color-secondary); color: white;
  border-radius: 50%; width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  font-size: .78rem; font-weight: 700; flex-shrink: 0;
}
.q-text { flex: 1; font-weight: 600; font-size: .9rem; }
.q-result { font-size: 1.1rem; flex-shrink: 0; }

.review-options { display: flex; flex-direction: column; gap: .4rem; margin-left: 2rem; }

.review-opt {
  display: flex; align-items: center; gap: .6rem;
  padding: .5rem .75rem; border-radius: var(--radius);
  font-size: .85rem; border: 1.5px solid transparent;
}
.opt-correct { background: #d1fae5; border-color: #86efac; color: #065f46; }
.opt-wrong { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
.opt-selected:not(.opt-correct):not(.opt-wrong) { background: #f1f5f9; }
.opt-key {
  font-weight: 700; font-size: .75rem;
  min-width: 20px; text-align: center;
}

.review-explanation {
  margin-top: .75rem; margin-left: 2rem;
  font-size: .82rem; color: var(--color-text-muted);
  background: #fffbeb; border: 1px solid #fde68a;
  border-radius: var(--radius); padding: .6rem .875rem;
}

/* ── Acciones resultado ── */
.result-actions {
  display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap;
  padding: 1rem 0;
}

/* ── Quiz ── */
.quiz-panel { display: flex; flex-direction: column; gap: 1.25rem; }

.quiz-progress-bar {
  height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;
}
.quiz-progress-fill {
  height: 100%; background: var(--color-primary);
  border-radius: 99px; transition: width .3s;
}

.questions-list { display: flex; flex-direction: column; gap: 1rem; }

.question-card {
  background: white; border-radius: 12px; padding: 1.5rem;
  box-shadow: var(--shadow); border-left: 4px solid #e2e8f0;
  transition: border-color .2s;
}
.question-answered { border-left-color: var(--color-primary); }

.question-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: .75rem;
}
.q-badge {
  font-size: .72rem; font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: .5px;
}
.q-points {
  font-size: .72rem; font-weight: 700; color: var(--color-primary);
  background: #d1fae5; padding: .15rem .5rem; border-radius: 20px;
}

.question-text {
  font-size: .95rem; font-weight: 600; color: var(--color-secondary);
  margin: 0 0 1rem; line-height: 1.5;
}

.options-grid { display: flex; flex-direction: column; gap: .5rem; }

.option-btn {
  display: flex; align-items: center; gap: .75rem;
  padding: .7rem 1rem; border-radius: var(--radius);
  border: 1.5px solid var(--color-border);
  background: white; cursor: pointer; text-align: left;
  font-size: .875rem; transition: border-color .15s, background .15s;
  width: 100%;
}
.option-btn:hover { border-color: var(--color-primary); background: #f0fdf4; }
.option-selected {
  border-color: var(--color-primary);
  background: #d1fae5; color: #065f46;
}
.option-key {
  background: var(--color-secondary); color: white;
  border-radius: 4px; width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  font-size: .72rem; font-weight: 700; flex-shrink: 0;
}
.option-selected .option-key { background: var(--color-primary); }

/* ── Submit bar ── */
.submit-bar {
  display: flex; justify-content: space-between; align-items: center;
  background: white; border-radius: 12px; padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow); flex-wrap: wrap; gap: 1rem;
}
.submit-info { display: flex; flex-direction: column; gap: .25rem; font-size: .875rem; color: var(--color-text-muted); }
.hint { font-size: .78rem; color: var(--color-danger); }

/* ── Botones ── */
.btn {
  padding: .6rem 1.25rem; border-radius: var(--radius);
  font-weight: 600; font-size: .875rem; cursor: pointer;
  border: none; transition: opacity .15s;
  text-decoration: none; display: inline-flex; align-items: center; gap: .4rem;
}
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover:not(:disabled) { background: #005a3e; }
.btn-outline { background: white; border: 1.5px solid var(--color-border); color: var(--color-text); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-lg { padding: .75rem 2rem; font-size: 1rem; }
.btn-sm { padding: .4rem .9rem; font-size: .8rem; }
</style>
