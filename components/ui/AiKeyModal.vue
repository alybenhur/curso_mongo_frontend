<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>🤖 Configurar Asistente IA</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="info-banner">
          <span class="info-icon">🔒</span>
          <div>
            <strong>Tu clave es segura</strong>
            <p>
              La API key se almacena <strong>únicamente en memoria del servidor</strong>
              durante tu sesión. Nunca se guarda en base de datos y se elimina
              automáticamente al cerrar sesión.
            </p>
          </div>
        </div>

        <div class="steps">
          <div class="step">
            <span class="step-num">1</span>
            <div>
              Ve a <a href="https://console.anthropic.com" target="_blank" class="link">
                console.anthropic.com
              </a> → API Keys → Create Key
            </div>
          </div>
          <div class="step">
            <span class="step-num">2</span>
            <div>Copia tu clave (comienza con <code>sk-ant-</code>)</div>
          </div>
          <div class="step">
            <span class="step-num">3</span>
            <div>Pégala aquí y guarda</div>
          </div>
        </div>

        <form @submit.prevent="handleSave" class="key-form">
          <div class="form-group">
            <label for="apiKey">API Key de Anthropic</label>
            <div class="input-wrapper">
              <input
                id="apiKey"
                v-model="apiKey"
                :type="show ? 'text' : 'password'"
                placeholder="sk-ant-api03-..."
                autocomplete="off"
                :disabled="saving"
                class="key-input"
              />
              <button type="button" class="toggle-btn" @click="show = !show">
                {{ show ? '🙈' : '👁️' }}
              </button>
            </div>
            <span class="field-hint">La clave debe comenzar con sk-ant-</span>
          </div>

          <div v-if="error" class="alert-error">{{ error }}</div>

          <div class="modal-actions">
            <button
              v-if="aiStore.hasKey"
              type="button"
              class="btn btn-danger-outline"
              :disabled="saving"
              @click="handleRemove"
            >
              🗑 Eliminar key
            </button>
            <div class="spacer" />
            <button type="button" class="btn btn-outline" @click="$emit('close')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!apiKey || saving">
              {{ saving ? 'Guardando...' : '✅ Guardar' }}
            </button>
          </div>
        </form>

        <!-- Estado actual -->
        <div class="status-row">
          <span class="status-label">Estado del asistente:</span>
          <span class="status-badge" :class="aiStore.hasKey ? 'badge-active' : 'badge-inactive'">
            {{ aiStore.hasKey ? '🟢 Activo' : '🔴 Inactivo' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ close: [] }>()

const aiStore = useAiStore()

const apiKey = ref('')
const show = ref(false)
const saving = ref(false)
const error = ref('')

const handleSave = async () => {
  if (!apiKey.value) return
  saving.value = true
  error.value = ''
  try {
    await aiStore.setKey(apiKey.value)
    apiKey.value = ''
    useNuxtApp().$emit?.('close')
  } catch (err: any) {
    error.value = err?.data?.message || aiStore.error || 'Error al guardar la clave'
  } finally {
    saving.value = false
  }
}

const handleRemove = async () => {
  await aiStore.clearKey()
  apiKey.value = ''
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 14px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1.5px solid var(--color-border);
}

.modal-header h3 { font-size: 1.15rem; font-weight: 700; color: var(--color-secondary); }

.close-btn {
  background: none; border: none;
  color: var(--color-text-muted); cursor: pointer;
  font-size: 1rem; padding: 0.25rem;
}

.modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

.info-banner {
  display: flex;
  gap: 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius);
  padding: 0.875rem;
  font-size: 0.85rem;
}

.info-icon { font-size: 1.25rem; flex-shrink: 0; }
.info-banner strong { display: block; margin-bottom: 0.25rem; }
.info-banner p { margin: 0; color: var(--color-text-muted); line-height: 1.5; }

.steps { display: flex; flex-direction: column; gap: 0.6rem; }

.step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text);
}

.step-num {
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700;
  flex-shrink: 0;
}

.link { color: var(--color-primary); font-weight: 600; }

.key-form { display: flex; flex-direction: column; gap: 1rem; }

.form-group { display: flex; flex-direction: column; gap: 0.3rem; }

.form-group label {
  font-size: 0.875rem; font-weight: 600; color: var(--color-text);
}

.input-wrapper { position: relative; }

.key-input {
  width: 100%;
  padding: 0.65rem 3rem 0.65rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-family: var(--font-mono);
  outline: none;
  transition: border-color .15s;
}
.key-input:focus { border-color: var(--color-primary); }

.toggle-btn {
  position: absolute; right: 0.75rem; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; cursor: pointer; font-size: 1rem;
}

.field-hint { font-size: 0.72rem; color: var(--color-text-muted); }

.alert-error {
  background: #fef2f2; color: var(--color-danger);
  border: 1px solid #fecaca;
  padding: 0.6rem 0.875rem;
  border-radius: var(--radius); font-size: 0.825rem;
}

.modal-actions {
  display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
}
.spacer { flex: 1; }

.btn {
  padding: 0.55rem 1.1rem;
  border-radius: var(--radius);
  font-weight: 600; font-size: 0.875rem;
  cursor: pointer; border: none;
  transition: opacity .15s;
}
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover:not(:disabled) { background: #005a3e; }
.btn-outline { background: white; border: 1.5px solid var(--color-border); color: var(--color-text); }
.btn-danger-outline { background: white; border: 1.5px solid #fca5a5; color: var(--color-danger); }

.status-row {
  display: flex; align-items: center; gap: 0.75rem;
  font-size: 0.82rem; padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}
.status-label { color: var(--color-text-muted); }
.status-badge { font-weight: 700; font-size: 0.82rem; }
.badge-active { color: var(--color-success); }
.badge-inactive { color: var(--color-danger); }
</style>
