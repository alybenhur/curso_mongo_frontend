import { defineStore } from 'pinia'

export interface Stage {
  _id: string
  order: number
  title: string
  description: string
  icon: string
  topics: string[]
  xpReward: number
  prerequisiteOrder: number | null
}

export interface Lesson {
  _id: string
  stageId: string
  stageOrder: number
  order: number
  title: string
  type: 'reading' | 'example' | 'exercise' | 'quiz'
  content: string
  codeExample: string | null
  exerciseInstructions: string | null
  exerciseSolution: string | null
  xpReward: number
  topics: string[]
}

export interface StageProgress {
  _id: string
  userId: string
  stageOrder: number
  stageId: string
  status: 'locked' | 'in_progress' | 'completed'
  completedLessons: string[]
  completionPercent: number
  evaluationScore: number | null
  evaluationAttempts: number
  evaluationHistory: { score: number; date: string; passed: boolean }[]
  timeSpentMinutes: number
  startedAt: string | null
  completedAt: string | null
  certificateIssued: boolean
  certificateCode: string | null
}

export interface GlobalSummary {
  totalStages: number
  completed: number
  inProgress: number
  locked: number
  globalPercent: number
  totalTimeMinutes: number
}

export const useProgressStore = defineStore('progress', {
  state: () => ({
    stages: [] as Stage[],
    progress: [] as StageProgress[],
    summary: null as GlobalSummary | null,
    currentStage: null as Stage | null,
    currentLessons: [] as Lesson[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getStageProgress: (state) => (order: number) =>
      state.progress.find((p) => p.stageOrder === order),

    getStageWithProgress: (state) =>
      state.stages.map((stage) => ({
        ...stage,
        progress: state.progress.find((p) => p.stageOrder === stage.order),
      })),

    currentStageProgress: (state) =>
      state.progress.find((p) => p.stageOrder === state.currentStage?.order),
  },

  actions: {
    async fetchStages() {
      const { apiFetch } = useApi()
      this.loading = true
      try {
        this.stages = await apiFetch<Stage[]>('/curriculum/stages')
      } catch (err: any) {
        this.error = 'Error al cargar el currículo'
      } finally {
        this.loading = false
      }
    },

    async fetchProgress() {
      const { apiFetch } = useApi()
      try {
        this.progress = await apiFetch<StageProgress[]>('/progress/me')
        this.summary = await apiFetch<GlobalSummary>('/progress/me/summary')
      } catch {
        this.error = 'Error al cargar progreso'
      }
    },

    async initializeProgress() {
      const { apiFetch } = useApi()
      try {
        await apiFetch('/progress/initialize', { method: 'POST' })
        await this.fetchProgress()
      } catch { /* ya inicializado */ }
    },

    async resetProgress() {
      const { apiFetch } = useApi()
      try {
        await apiFetch('/progress/reset', { method: 'POST' })
        await this.fetchProgress()
      } catch { /* ignorar */ }
    },

    async fetchStageWithLessons(order: number) {
      const { apiFetch } = useApi()
      this.loading = true
      try {
        const [stage, lessons] = await Promise.all([
          apiFetch<Stage>(`/curriculum/stages/${order}`),
          apiFetch<Lesson[]>(`/curriculum/stages/${order}/lessons`),
        ])
        this.currentStage = stage
        this.currentLessons = lessons
      } catch {
        this.error = 'Error al cargar la etapa'
      } finally {
        this.loading = false
      }
    },

    async completeLesson(lessonId: string, stageOrder: number, timeSpent: number = 5) {
      const { apiFetch } = useApi()
      try {
        const updated = await apiFetch<StageProgress>('/progress/me/complete-lesson', {
          method: 'POST',
          body: { lessonId, stageOrder, timeSpentMinutes: timeSpent },
        })
        // Actualizar progreso en el store
        const idx = this.progress.findIndex((p) => p.stageOrder === stageOrder)
        if (idx !== -1) this.progress[idx] = updated
        await this.fetchProgress()
      } catch { /* silencioso */ }
    },
  },
})
