<template>
  <div class="stage-page">
    <!-- Header de la etapa -->
    <div class="stage-header">
      <NuxtLink to="/curriculum" class="back-link">← Volver al currículo</NuxtLink>
      <div v-if="progressStore.currentStage" class="stage-hero">
        <div class="hero-icon">{{ progressStore.currentStage.icon }}</div>
        <div class="hero-info">
          <div class="hero-number">Etapa {{ progressStore.currentStage.order }}</div>
          <h1 class="hero-title">{{ progressStore.currentStage.title }}</h1>
          <p class="hero-desc">{{ progressStore.currentStage.description }}</p>
          <div class="hero-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${stageProgress?.completionPercent ?? 0}%` }"
              />
            </div>
            <span class="progress-text">{{ stageProgress?.completionPercent ?? 0 }}% completado</span>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="stat-val">{{ progressStore.currentLessons.length }}</div>
            <div class="stat-lbl">Lecciones</div>
          </div>
          <div class="hero-stat">
            <div class="stat-val">{{ stageProgress?.completedLessons?.length ?? 0 }}</div>
            <div class="stat-lbl">Completadas</div>
          </div>
          <div class="hero-stat">
            <div class="stat-val">⭐ {{ progressStore.currentStage.xpReward }}</div>
            <div class="stat-lbl">XP al completar</div>
          </div>
          <NuxtLink :to="`/curriculum/${order}/evaluation`" class="btn btn-eval">
            {{ stageProgress?.status === 'completed' ? '🏆 Ver certificado' : '📝 Evaluación final' }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-if="progressStore.loading" class="loading-state">
      <div class="spinner" />
      <p>Cargando lecciones...</p>
    </div>

    <div v-else class="stage-body">
      <!-- Lista de lecciones -->
      <aside class="lessons-sidebar">
        <h2 class="sidebar-title">Lecciones</h2>
        <div class="lessons-list">
          <CurriculumLessonItem
            v-for="lesson in progressStore.currentLessons"
            :key="lesson._id"
            :lesson="lesson"
            :is-completed="isLessonCompleted(lesson._id)"
            :is-active="activeLessonId === lesson._id"
            @select="selectLesson"
          />
        </div>
      </aside>

      <!-- Visor de lección -->
      <main class="lesson-viewer">
        <div v-if="!activeLesson" class="lesson-empty">
          <span class="empty-icon">{{ progressStore.currentStage?.icon }}</span>
          <h3>Selecciona una lección para comenzar</h3>
          <p>Las lecciones se desbloquean en orden. Empieza por la primera.</p>
          <button
            v-if="progressStore.currentLessons.length > 0"
            class="btn btn-primary"
            @click="selectLesson(progressStore.currentLessons[0])"
          >
            Comenzar primera lección
          </button>
        </div>

        <div v-else class="lesson-content">
          <div class="lesson-content-header">
            <div class="lesson-meta">
              <span class="lesson-type-badge">
                {{ typeLabelMap[activeLesson.type] }}
              </span>
              <h2 class="lesson-content-title">{{ activeLesson.title }}</h2>
            </div>
            <div class="lesson-actions">
              <span class="lesson-xp">+{{ activeLesson.xpReward }} XP</span>
              <button
                v-if="!isLessonCompleted(activeLesson._id)"
                class="btn btn-primary btn-sm"
                :disabled="completing"
                @click="markComplete"
              >
                {{ completing ? 'Guardando...' : 'Marcar como completada ✓' }}
              </button>
              <span v-else class="completed-badge">✅ Completada</span>
            </div>
          </div>

          <!-- Contenido en Markdown -->
          <div class="lesson-body" v-html="renderedContent" />

          <!-- Bloque de código ejemplo -->
          <div v-if="activeLesson.codeExample" class="code-block">
            <div class="code-block-header">
              <span>🍃 Ejemplo MongoDB</span>
              <button class="copy-btn" @click="copyCode(activeLesson.codeExample!)">
                {{ copied ? '✅ Copiado' : '📋 Copiar' }}
              </button>
            </div>
            <pre class="code-content"><code>{{ activeLesson.codeExample }}</code></pre>
          </div>

          <!-- Instrucciones de ejercicio -->
          <div v-if="activeLesson.exerciseInstructions" class="exercise-block">
            <h3 class="exercise-title">📝 Instrucciones del ejercicio</h3>
            <div class="exercise-instructions">{{ activeLesson.exerciseInstructions }}</div>
            <div v-if="showSolution" class="solution-block">
              <h4>✅ Solución</h4>
              <pre><code>{{ activeLesson.exerciseSolution }}</code></pre>
            </div>
            <button class="btn btn-outline btn-sm" @click="showSolution = !showSolution">
              {{ showSolution ? 'Ocultar solución' : 'Ver solución' }}
            </button>
          </div>

          <!-- Navegación entre lecciones -->
          <div class="lesson-navigation">
            <button
              v-if="prevLesson"
              class="btn btn-outline"
              @click="selectLesson(prevLesson!)"
            >← {{ prevLesson.title }}</button>
            <div />
            <button
              v-if="nextLesson"
              class="btn btn-primary"
              @click="selectLesson(nextLesson!)"
            >{{ nextLesson.title }} →</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Lesson } from '~/stores/progress'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const progressStore = useProgressStore()
const aiStore = useAiStore()
const order = Number(route.params.order)

const activeLessonId = ref<string | null>(null)
const showSolution = ref(false)
const completing = ref(false)
const copied = ref(false)

const typeLabelMap: Record<string, string> = {
  reading: '📖 Lectura',
  example: '💡 Ejemplo',
  exercise: '✏️ Ejercicio',
  quiz: '📝 Evaluación',
}

const stageProgress = computed(() => progressStore.getStageProgress(order))
const activeLesson = computed(() =>
  progressStore.currentLessons.find((l) => l._id === activeLessonId.value) ?? null
)
const prevLesson = computed(() => {
  if (!activeLesson.value) return null
  return progressStore.currentLessons.find((l) => l.order === activeLesson.value!.order - 1) ?? null
})
const nextLesson = computed(() => {
  if (!activeLesson.value) return null
  return progressStore.currentLessons.find((l) => l.order === activeLesson.value!.order + 1) ?? null
})

const renderedContent = computed(() => {
  if (!activeLesson.value) return ''
  return simpleMarkdown(activeLesson.value.content)
})

function simpleMarkdown(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/\| (.+) \|/g, (m) => {
      const cells = m.split('|').filter(Boolean).map((c) => `<td>${c.trim()}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
    .replace(/(<tr>.*<\/tr>\n?)+/gs, (t) => `<table>${t}</table>`)
    .replace(/✅|❌|🔍|⚡/g, (e) => `<span>${e}</span>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<[h|t|p|u|o])(.+)$/gm, (l) => l ? `<p>${l}</p>` : '')
}

function isLessonCompleted(lessonId: string): boolean {
  return stageProgress.value?.completedLessons?.includes(lessonId) ?? false
}

function selectLesson(lesson: Lesson) {
  activeLessonId.value = lesson._id
  showSolution.value = false
  aiStore.setContext({
    lessonTitle: lesson.title,
    lessonContent: lesson.content,
    stageOrder: order,
    stageName: progressStore.currentStage?.title ?? '',
  })
}

async function markComplete() {
  if (!activeLesson.value || completing.value) return
  completing.value = true
  await progressStore.completeLesson(activeLesson.value._id, order, 5)
  completing.value = false
}

async function copyCode(code: string) {
  await navigator.clipboard.writeText(code)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

onMounted(async () => {
  await progressStore.fetchStageWithLessons(order)
  await progressStore.fetchProgress()
  const first = progressStore.currentLessons.find((l) => !isLessonCompleted(l._id))
    ?? progressStore.currentLessons[0]
  if (first) selectLesson(first)
})
</script>

<style scoped>
.stage-page { display: flex; flex-direction: column; gap: 1.5rem; }

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-decoration: none;
  margin-bottom: 0.75rem;
}
.back-link:hover { color: var(--color-primary); }

.stage-hero {
  display: flex;
  gap: 1.5rem;
  background: white;
  padding: 1.75rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  align-items: flex-start;
  flex-wrap: wrap;
}

.hero-icon { font-size: 3rem; }
.hero-info { flex: 1; min-width: 240px; }

.hero-number {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: .5px;
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-secondary);
  margin: 0.25rem 0;
}

.hero-desc { color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1rem; }

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 0.3rem;
}
.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 99px;
  transition: width .4s;
}
.progress-text { font-size: 0.78rem; color: var(--color-text-muted); }

.hero-stats {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.hero-stat { text-align: center; }
.stat-val { font-size: 1.2rem; font-weight: 700; color: var(--color-secondary); }
.stat-lbl { font-size: 0.72rem; color: var(--color-text-muted); }

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  color: var(--color-text-muted);
}

.spinner {
  width: 36px; height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.stage-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.lessons-sidebar { display: flex; flex-direction: column; gap: 0.75rem; }

.sidebar-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: .5px;
}

.lessons-list { display: flex; flex-direction: column; gap: 0.5rem; }

.lesson-viewer {
  background: white;
  border-radius: 12px;
  box-shadow: var(--shadow);
  overflow: hidden;
  min-height: 400px;
}

.lesson-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.empty-icon { font-size: 3rem; }
.lesson-content { padding: 2rem; }

.lesson-content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1.5px solid var(--color-border);
  flex-wrap: wrap;
}

.lesson-type-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  background: #d1fae5;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  display: block;
  margin-bottom: 0.3rem;
}

.lesson-content-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.lesson-actions { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
.lesson-xp { font-size: 0.85rem; color: var(--color-primary); font-weight: 600; }
.completed-badge { color: var(--color-success); font-weight: 600; font-size: 0.875rem; }

.lesson-body {
  line-height: 1.75;
  color: var(--color-text);
  font-size: 0.95rem;
}

.lesson-body :deep(h2) { font-size: 1.3rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: var(--color-secondary); }
.lesson-body :deep(h3) { font-size: 1.1rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
.lesson-body :deep(code) { background: #f1f5f9; padding: .1rem .4rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.87em; }
.lesson-body :deep(pre) { background: var(--color-secondary); color: #e2e8f0; padding: 1.25rem; border-radius: var(--radius); overflow-x: auto; margin: 1rem 0; }
.lesson-body :deep(pre code) { background: none; color: inherit; padding: 0; }
.lesson-body :deep(table) { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.875rem; }
.lesson-body :deep(td) { border: 1px solid var(--color-border); padding: 0.5rem 0.75rem; }
.lesson-body :deep(tr:first-child td) { background: #f8fafc; font-weight: 600; }
.lesson-body :deep(p) { margin: 0.75rem 0; }

.code-block {
  margin-top: 1.5rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background: #f8fafc;
  border-bottom: 1.5px solid var(--color-border);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.copy-btn {
  background: none; border: none; cursor: pointer;
  font-size: 0.78rem; color: var(--color-primary); font-weight: 600;
}

.code-content {
  background: var(--color-secondary);
  color: #e2e8f0;
  padding: 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  line-height: 1.6;
  overflow-x: auto;
  margin: 0;
  white-space: pre-wrap;
}

.exercise-block {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: #fffbeb;
  border: 1.5px solid #fde68a;
  border-radius: var(--radius);
}

.exercise-title { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; }
.exercise-instructions { white-space: pre-wrap; font-size: 0.875rem; line-height: 1.6; margin-bottom: 1rem; }

.solution-block {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: var(--radius);
  padding: 1rem;
  margin-bottom: 1rem;
}
.solution-block pre { margin: 0.5rem 0 0; background: var(--color-secondary); color: #e2e8f0; padding: 1rem; border-radius: 6px; font-size: 0.83rem; overflow-x: auto; }

.lesson-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1.5px solid var(--color-border);
}

.btn {
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  transition: opacity .15s;
  text-decoration: none;
  display: inline-block;
}
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover:not(:disabled) { background: #005a3e; }
.btn-outline { background: white; border: 1.5px solid var(--color-border); color: var(--color-text); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-sm { padding: 0.4rem 0.9rem; font-size: 0.8rem; }

.btn-eval {
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-weight: 700; font-size: 0.8rem;
  background: var(--color-accent);
  color: var(--color-secondary);
  border: none; cursor: pointer;
  text-decoration: none;
  display: inline-flex; align-items: center; gap: .3rem;
  transition: opacity .15s;
  white-space: nowrap;
}
.btn-eval:hover { opacity: .85; }

@media (max-width: 900px) {
  .stage-body { grid-template-columns: 1fr; }
}
</style>
