<template>
  <!-- Botón flotante -->
  <div class="ai-fab-wrapper">
    <button
      class="ai-fab"
      :class="{ 'ai-fab--active': aiStore.hasKey, 'ai-fab--open': aiStore.isOpen }"
      :title="aiStore.hasKey ? 'Asistente IA' : 'Configura tu API key para usar el asistente'"
      @click="handleFabClick"
    >
      <span class="fab-icon">🤖</span>
      <span v-if="aiStore.hasKey && unread > 0" class="fab-badge">{{ unread }}</span>
    </button>

    <!-- Tooltip cuando no tiene key -->
    <div v-if="!aiStore.hasKey" class="fab-tooltip">
      Sin key — <button class="tooltip-link" @click="showKeyModal = true">Configurar</button>
    </div>
  </div>

  <!-- Panel de chat -->
  <Teleport to="body">
    <div v-if="aiStore.isOpen" class="chat-panel" :class="{ 'chat-panel--open': aiStore.isOpen }">
      <!-- Header del chat -->
      <div class="chat-header">
        <div class="chat-title">
          <span class="chat-avatar">🤖</span>
          <div>
            <div class="chat-name">MongoBot</div>
            <div class="chat-status">
              <span class="status-dot" :class="aiStore.hasKey ? 'dot-green' : 'dot-gray'" />
              {{ aiStore.hasKey ? 'En línea' : 'Sin API key' }}
            </div>
          </div>
        </div>
        <div class="chat-actions">
          <button
            class="chat-action-btn"
            title="Limpiar historial"
            @click="aiStore.clearMessages()"
          >🗑</button>
          <button
            class="chat-action-btn"
            title="Configurar API key"
            @click="showKeyModal = true"
          >⚙️</button>
          <button class="chat-action-btn" @click="aiStore.closeChat()">✕</button>
        </div>
      </div>

      <!-- Contexto activo -->
      <div v-if="aiStore.context.lessonTitle" class="chat-context">
        📖 Contexto: <strong>{{ aiStore.context.lessonTitle }}</strong>
      </div>

      <!-- Mensajes -->
      <div ref="messagesEl" class="chat-messages">
        <!-- Bienvenida -->
        <div v-if="aiStore.messages.length === 0" class="chat-welcome">
          <div class="welcome-icon">🍃</div>
          <p><strong>¡Hola! Soy MongoBot.</strong></p>
          <p>Pregúntame cualquier cosa sobre MongoDB y NoSQL. Estoy aquí para ayudarte con la lección que estás estudiando.</p>
          <div class="welcome-suggestions">
            <button
              v-for="s in suggestions"
              :key="s"
              class="suggestion-btn"
              @click="sendSuggestion(s)"
            >{{ s }}</button>
          </div>
        </div>

        <!-- Historial de mensajes -->
        <div
          v-for="(msg, idx) in aiStore.messages"
          :key="idx"
          class="message"
          :class="`message--${msg.role}`"
        >
          <div class="message-avatar">
            {{ msg.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-bubble">
            <div class="message-content" v-html="renderMarkdown(msg.content)" />
            <div class="message-meta">
              {{ formatTime(msg.timestamp) }}
              <span v-if="msg.tokens" class="message-tokens">
                · {{ msg.tokens.input + msg.tokens.output }} tokens
              </span>
            </div>
          </div>
        </div>

        <!-- Indicador de escritura -->
        <div v-if="aiStore.loading" class="message message--assistant">
          <div class="message-avatar">🤖</div>
          <div class="message-bubble">
            <div class="typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="chat-input-area">
        <div v-if="!aiStore.hasKey" class="no-key-banner">
          <span>El asistente IA requiere una API key de Anthropic.</span>
          <button class="btn-config" @click="showKeyModal = true">Configurar</button>
        </div>
        <div v-else class="input-row">
          <textarea
            ref="inputEl"
            v-model="input"
            class="chat-input"
            placeholder="Escribe tu pregunta... (Enter para enviar)"
            rows="1"
            :disabled="aiStore.loading"
            @keydown.enter.exact.prevent="send"
            @keydown.shift.enter="input += '\n'"
            @input="autoResize"
          />
          <button
            class="send-btn"
            :disabled="!input.trim() || aiStore.loading"
            @click="send"
          >
            {{ aiStore.loading ? '⏳' : '➤' }}
          </button>
        </div>
        <div class="input-hint">Shift+Enter para nueva línea</div>
      </div>
    </div>

    <!-- Modal de API key -->
    <UiAiKeyModal
      v-if="showKeyModal"
      @close="showKeyModal = false"
    />
  </Teleport>
</template>

<script setup lang="ts">
const aiStore = useAiStore()

const input = ref('')
const showKeyModal = ref(false)
const messagesEl = ref<HTMLDivElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)
const unread = ref(0)

const suggestions = computed(() => {
  if (aiStore.context.stageOrder === 1) return ['¿Qué diferencia hay entre SQL y NoSQL?', '¿Cuándo usar MongoDB?']
  if (aiStore.context.stageOrder === 3) return ['Explícame insertMany con un ejemplo', '¿Cómo funciona $set en updateOne?']
  if (aiStore.context.stageOrder === 6) return ['¿Qué hace $unwind?', 'Muéstrame un ejemplo de $lookup']
  return ['¿Puedes explicar este concepto con un ejemplo?', '¿Tengo algún error en mi query?']
})

const handleFabClick = () => {
  if (!aiStore.hasKey) {
    showKeyModal.value = true
    return
  }
  aiStore.toggleChat()
  if (aiStore.isOpen) unread.value = 0
}

const send = async () => {
  if (!input.value.trim() || aiStore.loading) return
  const msg = input.value.trim()
  input.value = ''
  nextTick(() => {
    if (inputEl.value) inputEl.value.style.height = 'auto'
  })
  await aiStore.sendMessage(msg)
  scrollToBottom()
}

const sendSuggestion = (s: string) => {
  input.value = s
  send()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

const autoResize = () => {
  if (!inputEl.value) return
  inputEl.value.style.height = 'auto'
  inputEl.value.style.height = Math.min(inputEl.value.scrollHeight, 120) + 'px'
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

const renderMarkdown = (text: string): string => {
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<[h|u|p|l|c|p])(.+)$/gm, (l) => l.trim() ? `<p>${l}</p>` : '')
}

// Contar mensajes nuevos cuando el chat está cerrado
watch(() => aiStore.messages.length, () => {
  if (!aiStore.isOpen) unread.value++
  else scrollToBottom()
})

onMounted(() => {
  aiStore.checkKeyStatus()
})
</script>

<style scoped>
/* ── FAB ── */
.ai-fab-wrapper {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 500;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

.ai-fab {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: #94a3b8;
  border: none;
  cursor: pointer;
  font-size: 1.6rem;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,.2);
  transition: transform .15s, background .15s;
  position: relative;
}
.ai-fab--active { background: var(--color-primary); }
.ai-fab--open { transform: scale(0.9); }
.ai-fab:hover { transform: scale(1.08); }
.ai-fab--open:hover { transform: scale(0.92); }

.fab-badge {
  position: absolute;
  top: -4px; right: -4px;
  background: var(--color-danger);
  color: white;
  border-radius: 50%;
  width: 18px; height: 18px;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.fab-tooltip {
  background: var(--color-secondary);
  color: rgba(255,255,255,.85);
  font-size: 0.75rem;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  white-space: nowrap;
}

.tooltip-link {
  background: none; border: none;
  color: var(--color-primary-light);
  cursor: pointer; font-weight: 700;
  font-size: 0.75rem;
}

/* ── Chat Panel ── */
.chat-panel {
  position: fixed;
  bottom: 6rem; right: 2rem;
  width: 380px; max-height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,.18);
  display: flex; flex-direction: column;
  overflow: hidden;
  z-index: 499;
  animation: slideUp .2s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.chat-header {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: var(--color-secondary);
  color: white;
  flex-shrink: 0;
}

.chat-title { display: flex; align-items: center; gap: 0.6rem; }
.chat-avatar { font-size: 1.4rem; }
.chat-name { font-weight: 700; font-size: 0.95rem; }
.chat-status {
  display: flex; align-items: center; gap: 0.35rem;
  font-size: 0.72rem; color: rgba(255,255,255,.7);
}

.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
}
.dot-green { background: var(--color-primary-light); }
.dot-gray  { background: #64748b; }

.chat-actions { display: flex; gap: 0.25rem; }
.chat-action-btn {
  background: rgba(255,255,255,.1);
  border: none; cursor: pointer;
  color: rgba(255,255,255,.8);
  width: 28px; height: 28px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem;
  transition: background .1s;
}
.chat-action-btn:hover { background: rgba(255,255,255,.2); }

.chat-context {
  padding: 0.4rem 1rem;
  background: #f0fdf8;
  border-bottom: 1px solid #d1fae5;
  font-size: 0.72rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  scroll-behavior: smooth;
}

.chat-welcome {
  text-align: center;
  color: var(--color-text-muted);
  padding: 1rem 0;
  font-size: 0.875rem;
}
.welcome-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.chat-welcome p { margin: 0.3rem 0; }
.chat-welcome strong { color: var(--color-secondary); }

.welcome-suggestions {
  display: flex; flex-direction: column; gap: 0.4rem;
  margin-top: 0.75rem;
}

.suggestion-btn {
  background: #f0fdf8;
  border: 1px solid #86efac;
  border-radius: var(--radius);
  padding: 0.4rem 0.75rem;
  font-size: 0.78rem;
  cursor: pointer;
  color: var(--color-primary);
  text-align: left;
  transition: background .1s;
}
.suggestion-btn:hover { background: #dcfce7; }

.message {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.message--user { flex-direction: row-reverse; }

.message-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.message--user .message-avatar { background: var(--color-primary); }

.message-bubble {
  max-width: 80%;
  background: #f8fafc;
  border-radius: 12px 12px 12px 3px;
  padding: 0.6rem 0.875rem;
  font-size: 0.85rem;
  line-height: 1.55;
}

.message--user .message-bubble {
  background: var(--color-primary);
  color: white;
  border-radius: 12px 12px 3px 12px;
}

.message-content :deep(code) {
  background: rgba(0,0,0,.08);
  padding: .1rem .35rem;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.8em;
}
.message--user .message-content :deep(code) {
  background: rgba(255,255,255,.2);
}

.message-content :deep(pre) {
  background: var(--color-secondary);
  color: #e2e8f0;
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.78em;
  margin: 0.5rem 0;
  white-space: pre-wrap;
}
.message-content :deep(pre code) { background: none; color: inherit; padding: 0; }

.message-content :deep(p) { margin: 0.3rem 0; }
.message-content :deep(ul) { padding-left: 1.2rem; margin: 0.4rem 0; }
.message-content :deep(li) { margin-bottom: 0.2rem; }
.message-content :deep(h3), .message-content :deep(h4) {
  font-size: 0.9rem; margin: 0.6rem 0 0.3rem; color: var(--color-secondary);
}

.message-meta {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  margin-top: 0.3rem;
  text-align: right;
}
.message--user .message-meta { color: rgba(255,255,255,.6); }
.message-tokens { opacity: .7; }

.typing-indicator {
  display: flex; gap: 4px; align-items: center; padding: 0.25rem 0;
}
.typing-indicator span {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--color-text-muted);
  animation: bounce 1.2s infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: .2s; }
.typing-indicator span:nth-child(3) { animation-delay: .4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* ── Input ── */
.chat-input-area {
  border-top: 1.5px solid var(--color-border);
  flex-shrink: 0;
}

.no-key-banner {
  display: flex; align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fef9c3;
  font-size: 0.82rem;
  color: #713f12;
}

.btn-config {
  background: var(--color-accent);
  border: none; cursor: pointer;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius);
  font-size: 0.78rem; font-weight: 700;
  color: var(--color-secondary);
}

.input-row {
  display: flex; gap: 0.5rem;
  padding: 0.75rem;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: none;
  outline: none;
  line-height: 1.4;
  transition: border-color .15s;
  max-height: 120px;
}
.chat-input:focus { border-color: var(--color-primary); }
.chat-input:disabled { background: #f8fafc; }

.send-btn {
  background: var(--color-primary);
  color: white; border: none;
  width: 36px; height: 36px;
  border-radius: 50%;
  cursor: pointer; font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background .15s;
}
.send-btn:hover:not(:disabled) { background: #005a3e; }
.send-btn:disabled { opacity: .5; cursor: not-allowed; }

.input-hint {
  font-size: 0.65rem; color: var(--color-text-muted);
  padding: 0 0.75rem 0.5rem;
}

@media (max-width: 480px) {
  .chat-panel { width: calc(100vw - 2rem); right: 1rem; }
  .ai-fab-wrapper { right: 1rem; bottom: 1rem; }
}
</style>
