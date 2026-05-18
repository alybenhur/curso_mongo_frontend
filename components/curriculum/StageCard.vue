<template>
  <NuxtLink
    :to="isAccessible ? `/curriculum/${stage.order}` : '#'"
    class="stage-card"
    :class="{
      'stage-card--completed': status === 'completed',
      'stage-card--active': status === 'in_progress',
      'stage-card--locked': status === 'locked',
    }"
  >
    <div class="stage-header">
      <div class="stage-icon">{{ stage.icon }}</div>
      <div class="stage-badge" :class="`badge--${status}`">
        <span v-if="status === 'completed'">✅ Completada</span>
        <span v-else-if="status === 'in_progress'">📖 En progreso</span>
        <span v-else>🔒 Bloqueada</span>
      </div>
    </div>

    <div class="stage-info">
      <div class="stage-number">Etapa {{ stage.order }}</div>
      <h3 class="stage-title">{{ stage.title }}</h3>
      <p class="stage-desc">{{ stage.description }}</p>
    </div>

    <div class="stage-footer">
      <div class="stage-progress-bar">
        <div
          class="stage-progress-fill"
          :style="{ width: `${progress?.completionPercent ?? 0}%` }"
        />
      </div>
      <div class="stage-meta">
        <span>{{ progress?.completionPercent ?? 0 }}%</span>
        <span class="stage-xp">⭐ {{ stage.xpReward }} XP</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Stage, StageProgress } from '~/stores/progress'

const props = defineProps<{
  stage: Stage
  progress?: StageProgress
}>()

const status = computed(() => props.progress?.status ?? 'locked')
const isAccessible = computed(() => status.value !== 'locked')
</script>

<style scoped>
.stage-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 2px solid transparent;
  text-decoration: none;
  color: var(--color-text);
  transition: transform .15s, box-shadow .15s, border-color .15s;
  position: relative;
  overflow: hidden;
}

.stage-card:hover:not(.stage-card--locked) {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  text-decoration: none;
}

.stage-card--completed { border-color: var(--color-success); }
.stage-card--active    { border-color: var(--color-primary); }
.stage-card--locked    { opacity: .6; cursor: not-allowed; }

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.stage-icon { font-size: 2rem; }

.stage-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
}

.badge--completed { background: #d1fae5; color: #065f46; }
.badge--in_progress { background: #dbeafe; color: #1e40af; }
.badge--locked { background: #f1f5f9; color: #64748b; }

.stage-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: .5px;
}

.stage-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-secondary);
  margin: 0.25rem 0;
  line-height: 1.3;
}

.stage-desc {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stage-progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
}

.stage-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 99px;
  transition: width .4s ease;
}

.stage-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  margin-top: 0.4rem;
}

.stage-xp { color: var(--color-primary); font-weight: 600; }
</style>
