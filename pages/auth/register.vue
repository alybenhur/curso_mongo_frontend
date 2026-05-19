<template>
  <div class="auth-form-container">
    <div class="auth-card">
      <h2 class="auth-title">Crear cuenta</h2>
      <p class="auth-subtitle">Comienza tu aprendizaje de MongoDB hoy</p>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Nombre completo</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Tu nombre"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="tu@correo.com"
            required
            autocomplete="email"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mínimo 6 caracteres"
              required
              minlength="6"
              autocomplete="new-password"
              :disabled="loading"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="confirm">Confirmar contraseña</label>
          <input
            id="confirm"
            v-model="form.confirm"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Repite tu contraseña"
            required
            :disabled="loading"
          />
          <span v-if="passwordMismatch" class="field-error">Las contraseñas no coinciden</span>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="loading || passwordMismatch"
        >
          <span v-if="loading">Creando cuenta...</span>
          <span v-else>Crear cuenta</span>
        </button>
      </form>

      <p class="auth-footer">
        ¿Ya tienes cuenta?
        <NuxtLink to="/auth/login" class="auth-link">Inicia sesión</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const authStore = useAuthStore()

const form = reactive({ name: '', email: '', password: '', confirm: '' })
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const { redirectHome } = useRoleRedirect()

const passwordMismatch = computed(
  () => form.confirm.length > 0 && form.password !== form.confirm
)

const handleRegister = async () => {
  if (passwordMismatch.value) return
  error.value = ''
  loading.value = true
  try {
    await authStore.register(form.name, form.email, form.password)
    await redirectHome()   // → /profesor, /dashboard o /dashboard/diagnostic según rol
  } catch (err: any) {
    error.value = err?.data?.message || authStore.error || 'Error al registrarse'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-form-container { width: 100%; max-width: 420px; }

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: var(--shadow-lg);
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-secondary);
  margin-bottom: 0.25rem;
}

.auth-subtitle {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

.auth-form { display: flex; flex-direction: column; gap: 1.25rem; }

.form-group { display: flex; flex-direction: column; gap: 0.4rem; }

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-group input {
  padding: 0.65rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.95rem;
  transition: border-color .15s;
  outline: none;
  width: 100%;
}

.form-group input:focus { border-color: var(--color-primary); }
.form-group input:disabled { background: #f8fafc; cursor: not-allowed; }

.input-wrapper { position: relative; }
.input-wrapper input { padding-right: 3rem; }

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.field-error {
  font-size: 0.78rem;
  color: var(--color-danger);
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
}

.alert-error {
  background: #fef2f2;
  color: var(--color-danger);
  border: 1px solid #fecaca;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  border: none;
  transition: opacity .15s, transform .1s;
}

.btn:disabled { opacity: .65; cursor: not-allowed; }
.btn:not(:disabled):active { transform: scale(.98); }

.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover:not(:disabled) { background: #005a3e; }
.btn-block { width: 100%; }

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.auth-link { color: var(--color-primary); font-weight: 600; }
</style>
