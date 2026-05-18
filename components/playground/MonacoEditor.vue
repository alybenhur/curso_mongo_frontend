<template>
  <div ref="editorContainer" class="monaco-container" />
</template>

<script setup lang="ts">
import type * as Monaco from 'monaco-editor'

const props = defineProps<{
  modelValue: string
  language?: string
  readOnly?: boolean
  height?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  run: []
}>()

const editorContainer = ref<HTMLDivElement | null>(null)
let editor: Monaco.editor.IStandaloneCodeEditor | null = null
let monaco: typeof Monaco | null = null

onMounted(async () => {
  if (!editorContainer.value) return

  // Cargar Monaco de forma dinámica
  const monacoLoader = await import('@monaco-editor/loader')
  monaco = await monacoLoader.default.init()

  // Definir tema MongoDB
  monaco.editor.defineTheme('mongo-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a9955' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'keyword', foreground: '569cd6' },
      { token: 'number', foreground: 'b5cea8' },
    ],
    colors: {
      'editor.background': '#001e2b',
      'editor.foreground': '#e2e8f0',
      'editorLineNumber.foreground': '#4a6375',
      'editor.selectionBackground': '#00684a44',
      'editor.lineHighlightBackground': '#00684a18',
      'editorCursor.foreground': '#00ed64',
    },
  })

  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language ?? 'javascript',
    theme: 'mongo-dark',
    readOnly: props.readOnly ?? false,
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
    fontLigatures: true,
    lineNumbers: 'on',
    wordWrap: 'on',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
  })

  // Emitir cambios al padre
  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor!.getValue())
  })

  // Ctrl+Enter para ejecutar
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
    () => emit('run'),
  )
})

// Actualizar valor cuando el padre cambia
watch(() => props.modelValue, (val) => {
  if (editor && editor.getValue() !== val) {
    editor.setValue(val)
  }
})

onUnmounted(() => {
  editor?.dispose()
})
</script>

<style scoped>
.monaco-container {
  width: 100%;
  height: v-bind('props.height ?? "300px"');
  border-radius: 0 0 var(--radius) var(--radius);
  overflow: hidden;
}
</style>
