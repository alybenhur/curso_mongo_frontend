<template>
  <div class="auth-layout">
    <div class="auth-sidebar">
      <div class="sidebar-content">
        <div class="sidebar-brand">
          <span class="brand-icon">🍃</span>
          <span class="brand-name">MongoTutor</span>
        </div>
        <h1 class="sidebar-title">Domina MongoDB desde cero</h1>
        <p class="sidebar-subtitle">
          Aprende bases de datos NoSQL con ejercicios reales, playground interactivo
          y seguimiento inteligente de tu progreso.
        </p>
        <ul class="sidebar-features">
          <li>✅ 13 etapas de aprendizaje</li>
          <li>✅ Playground con MongoDB real</li>
          <li>✅ Certificados por etapa</li>
          <li>✅ Análisis de tu progreso</li>
          <li>✅ Asistente IA opcional</li>
        </ul>
      </div>
    </div>

    <div class="auth-main">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.auth-sidebar {
  background: linear-gradient(135deg, var(--color-secondary) 0%, #023430 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.sidebar-content { max-width: 420px; color: white; }

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2.5rem;
}

.brand-icon { font-size: 2rem; }
.brand-name { font-size: 1.5rem; font-weight: 700; color: var(--color-primary-light); }

.sidebar-title {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: #ffffff;
}

.sidebar-subtitle {
  color: rgba(255,255,255,.75);
  line-height: 1.7;
  margin-bottom: 2rem;
}

.sidebar-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sidebar-features li {
  color: rgba(255,255,255,.85);
  font-size: 0.95rem;
}

.auth-main {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: var(--color-bg);
}

@media (max-width: 768px) {
  .auth-layout { grid-template-columns: 1fr; }
  .auth-sidebar { display: none; }
}
</style>
