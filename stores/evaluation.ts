import { defineStore } from 'pinia'

export interface QuestionOption {
  key: string
  text: string
}

export interface Question {
  _id: string
  stageOrder: number
  text: string
  options: QuestionOption[]
  points: number
}

export interface AnswerDetail {
  questionId: string
  correct: boolean
  correctKey: string
  explanation: string
}

export interface EvaluationResult {
  score: number
  totalPoints: number
  earnedPoints: number
  passed: boolean
  answers: AnswerDetail[]
  certificateCode?: string
}

export const useEvaluationStore = defineStore('evaluation', {
  state: () => ({
    questions: [] as Question[],
    result: null as EvaluationResult | null,
    loading: false,
    submitting: false,
    error: null as string | null,
    selectedAnswers: {} as Record<string, string>, // questionId -> selectedKey
  }),

  getters: {
    allAnswered: (state) =>
      state.questions.length > 0 &&
      state.questions.every((q) => state.selectedAnswers[q._id]),

    answeredCount: (state) =>
      Object.keys(state.selectedAnswers).length,
  },

  actions: {
    async fetchQuestions(stageOrder: number) {
      const { apiFetch } = useApi()
      this.loading = true
      this.error = null
      this.questions = []
      this.result = null
      this.selectedAnswers = {}
      try {
        const data = await apiFetch<Question[]>(`/evaluation/${stageOrder}`)
        this.questions = data
      } catch (err: any) {
        this.error = err?.data?.message || 'No hay evaluación disponible para esta etapa'
      } finally {
        this.loading = false
      }
    },

    selectAnswer(questionId: string, key: string) {
      this.selectedAnswers[questionId] = key
    },

    async submitEvaluation(stageOrder: number) {
      const { apiFetch } = useApi()
      this.submitting = true
      this.error = null
      try {
        const answers = Object.entries(this.selectedAnswers).map(([questionId, selectedKey]) => ({
          questionId,
          selectedKey,
        }))
        const result = await apiFetch<EvaluationResult>('/evaluation/submit', {
          method: 'POST',
          body: { stageOrder, answers },
        })
        this.result = result
        return result
      } catch (err: any) {
        this.error = err?.data?.message || 'Error al enviar la evaluación'
        throw err
      } finally {
        this.submitting = false
      }
    },

    resetEvaluation() {
      this.questions = []
      this.result = null
      this.selectedAnswers = {}
      this.error = null
    },
  },
})
