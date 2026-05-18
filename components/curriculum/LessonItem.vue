<template>
  <button
    class="lesson-item"
    :class="{
      'lesson-item--completed': isCompleted,
      'lesson-item--active': isActive,
    }"
    @click="$emit('select', lesson)"
  >
    <div class="lesson-type-icon">
      <span v-if="lesson.type === 'reading'">📖</span>
      <span v-else-if="lesson.type === 'example'">💡</span>
      <span v-else-if="lesson.type === 'exercise'">✏️</span>
      <span v-else-if="lesson.type === 'quiz'">📝</span>
    </div>
    <div class="lesson-info">
      <div class="lesson-number">Lección {{ lesson.order }}</div>
      <div class="lesson-title">{{ lesson.title }}</div>
      <div class="lesson-tags">
        <span class="tag tag--type">{{ typeLabel }}</span>
        <span class="tag tag--xp">+{{ lesson.xpReward }} XP</span>
      </div>
    </div>
    <div class="lesson-status">
      <span v-if="isCompleted" class="status-icon status-icon--done">✅</span>
      <span v-else-if="isActive" class="status-icon status-icon--active">▶</span>
      <span v-else class="status-icon status-icon--pending">○</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { Lesson } from '~/stores/progress'

const props = defineProps<{
  lesson: Lesson
  isCompleted: boolean
  isActive: boolean
}>()

defineEmits<{ select: [lesson: Lesson] }>()

const typeLabel = computed(() => ({
  reading: 'Lectura',
  example: 'Ejemplo',
  exercise: 'Ejercicio',
  quiz: 'Evaluación',
}[props.lesson.type]))
</script>

<style scoped>
.lesson-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: white;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  transition: border-color .15s, background .15s;
}

.lesson-item:hover { border-color: var(--color-primary); background: #f0fdf8; }
.lesson-item--completed { border-color: var(--color-success); background: #f0fdf4; }
.lesson-item--active { border-color: var(--color-primary); background: #f0fdf8; }

.lesson-type-icon { font-size: 1.4rem; min-width: 2rem; text-align: center; }

.lesson-info { flex: 1; }

.lesson-number {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-weight: 600;
  text-transform: uppercase;
}

.lesson-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-secondary);
  margin: 0.15rem 0;
}

.lesson-tags { display: flex; gap: 0.4rem; margin-top: 0.3rem; }

.tag {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.1rem 0.5rem;
  border-radius: 20px;
}

.tag--type { background: #e0f2fe; color: #075985; }
.tag--xp   { background: #fef9c3; color: #713f12; }

.lesson-status { min-width: 1.5rem; text-align: center; }

.status-icon { font-size: 1rem; }
.status-icon--active { color: var(--color-primary); font-weight: 700; }
.status-icon--pending { color: var(--color-text-muted); }
</style>
