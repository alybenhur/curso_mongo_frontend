<template>
  <div class="app-layout">
    <header class="navbar">
      <div class="navbar-brand">
        <NuxtLink to="/dashboard" class="brand-link">
          <span class="brand-icon">🍃</span>
          <span class="brand-name">MongoTutor</span>
        </NuxtLink>
      </div>

      <nav class="navbar-nav">
        <NuxtLink to="/dashboard" class="nav-link">Dashboard</NuxtLink>
        <NuxtLink to="/curriculum" class="nav-link">Currículo</NuxtLink>
        <NuxtLink to="/playground" class="nav-link">Playground</NuxtLink>
        <NuxtLink to="/achievements" class="nav-link">Logros</NuxtLink>
        <NuxtLink v-if="authStore.isAdmin" to="/admin" class="nav-link nav-link--admin">
          Admin
        </NuxtLink>
      </nav>

      <div class="navbar-user">
        <div class="user-xp">
          <span class="xp-icon">⭐</span>
          <span>{{ authStore.user?.xp ?? 0 }} XP</span>
        </div>
        <div class="user-streak">
          <span class="streak-icon">🔥</span>
          <span>{{ authStore.user?.streak ?? 0 }}</span>
        </div>
        <div class="user-menu">
          <NuxtLink to="/profile" class="user-avatar">
            <img
              v-if="authStore.user?.avatarUrl"
              :src="authStore.user.avatarUrl"
              :alt="authStore.user.name"
            />
            <span v-else class="avatar-initials">
              {{ authStore.user?.name?.charAt(0).toUpperCase() }}
            </span>
          </NuxtLink>
          <button class="btn-logout" @click="logout">Salir</button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <slot />
    </main>

    <!-- Asistente IA flotante -->
    <UiAiChat />
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const aiStore = useAiStore()
const router = useRouter()

const logout = async () => {
  authStore.logout()
  await router.push('/auth/login')
}

onMounted(() => {
  aiStore.checkKeyStatus()
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 64px;
  background: var(--color-secondary);
  color: white;
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  text-decoration: none;
}

.brand-icon { font-size: 1.5rem; }

.navbar-nav {
  display: flex;
  gap: 0.5rem;
}

.nav-link {
  color: rgba(255,255,255,.75);
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: background .15s, color .15s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255,255,255,.12);
  color: white;
  text-decoration: none;
}

.nav-link--admin {
  color: var(--color-accent);
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-xp, .user-streak {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: rgba(255,255,255,.85);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  border: 2px solid rgba(255,255,255,.3);
}

.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

.btn-logout {
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.2);
  color: rgba(255,255,255,.8);
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 0.8rem;
  transition: background .15s;
}

.btn-logout:hover {
  background: rgba(255,255,255,.2);
  color: white;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
}
</style>
