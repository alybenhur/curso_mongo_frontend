<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-greeting">
          ¡Hola, {{ authStore.user?.name?.split(' ')[0] }}! 👋
        </h1>
        <p class="dashboard-subtitle">Continúa tu camino hacia dominar MongoDB</p>
      </div>
      <div class="dashboard-stats">
        <div class="stat-card">
          <span class="stat-icon">⭐</span>
          <div>
            <div class="stat-value">{{ authStore.user?.xp ?? 0 }}</div>
            <div class="stat-label">XP Total</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🔥</span>
          <div>
            <div class="stat-value">{{ authStore.user?.streak ?? 0 }}</div>
            <div class="stat-label">Días seguidos</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🏆</span>
          <div>
            <div class="stat-value">{{ authStore.user?.level }}</div>
            <div class="stat-label">Nivel</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Aviso diagnóstico pendiente (solo para estudiantes) -->
    <div v-if="authStore.isStudent && !authStore.user?.diagnosticCompleted" class="alert-banner">
      <span>🎯</span>
      <div>
        <strong>Completa tu diagnóstico inicial</strong>
        <p>Detectamos tu nivel actual para personalizar tu plan de aprendizaje.</p>
      </div>
      <NuxtLink to="/dashboard/diagnostic" class="btn btn-accent">
        Comenzar diagnóstico
      </NuxtLink>
    </div>

    <!-- Accesos rápidos -->
    <div class="quick-actions">
      <NuxtLink to="/curriculum" class="quick-card">
        <span class="quick-icon">📚</span>
        <span class="quick-label">Continuar curso</span>
      </NuxtLink>
      <NuxtLink to="/playground" class="quick-card">
        <span class="quick-icon">💻</span>
        <span class="quick-label">Playground</span>
      </NuxtLink>
      <NuxtLink to="/achievements" class="quick-card">
        <span class="quick-icon">🏅</span>
        <span class="quick-label">Mis logros</span>
      </NuxtLink>
      <NuxtLink to="/profile" class="quick-card">
        <span class="quick-icon">👤</span>
        <span class="quick-label">Mi perfil</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const authStore = useAuthStore()
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 2rem; }

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.dashboard-greeting {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.dashboard-subtitle { color: var(--color-text-muted); margin-top: 0.25rem; }

.dashboard-stats { display: flex; gap: 1rem; flex-wrap: wrap; }

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  min-width: 130px;
}

.stat-icon { font-size: 1.75rem; }
.stat-value { font-size: 1.25rem; font-weight: 700; color: var(--color-secondary); }
.stat-label { font-size: 0.78rem; color: var(--color-text-muted); margin-top: 2px; }

.alert-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fffbeb;
  border: 1.5px solid #fde68a;
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  font-size: 0.9rem;
}

.alert-banner span:first-child { font-size: 1.5rem; }
.alert-banner div { flex: 1; }
.alert-banner strong { display: block; margin-bottom: 0.2rem; }
.alert-banner p { color: var(--color-text-muted); margin: 0; font-size: 0.85rem; }

.btn {
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  text-decoration: none;
  display: inline-block;
  white-space: nowrap;
}

.btn-accent { background: var(--color-accent); color: var(--color-secondary); }

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: white;
  padding: 1.75rem 1rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  text-decoration: none;
  color: var(--color-text);
  font-weight: 600;
  transition: transform .15s, box-shadow .15s;
  border: 1.5px solid transparent;
}

.quick-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
  text-decoration: none;
}

.quick-icon { font-size: 2rem; }
.quick-label { font-size: 0.9rem; }
</style>
