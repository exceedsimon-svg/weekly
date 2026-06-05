<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { RepeatType } from '../types'

interface Props {
  show: boolean
  defaultDate?: string
  showRepeatOptions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRepeatOptions: true
})

const emit = defineEmits<{
  close: []
  add: [text: string, repeat: RepeatType]
}>()

const text = ref('')
const repeat = ref<RepeatType>('none')
const inputRef = ref<HTMLInputElement | null>(null)
const isComposing = ref(false)

watch(() => props.show, (val) => {
  if (val) {
    text.value = ''
    repeat.value = 'none'
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

function onSubmit() {
  const trimmed = text.value.trim()
  if (trimmed) {
    emit('add', trimmed, repeat.value)
    emit('close')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.isComposing || isComposing.value || e.keyCode === 229) return

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    onSubmit()
  } else if (e.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>添加新任务</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <input
          ref="inputRef"
          v-model="text"
          class="todo-input"
          placeholder="输入任务内容..."
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
          @keydown="onKeydown"
        />
        
        <div v-if="showRepeatOptions" class="repeat-options">
          <label class="repeat-label">重复设置</label>
          <div class="repeat-buttons">
            <button
              :class="['repeat-btn', { active: repeat === 'none' }]"
              @click="repeat = 'none'"
            >
              不重复
            </button>
            <button
              :class="['repeat-btn', { active: repeat === 'daily' }]"
              @click="repeat = 'daily'"
            >
              每天
            </button>
            <button
              :class="['repeat-btn', { active: repeat === 'weekly' }]"
              @click="repeat = 'weekly'"
            >
              每周
            </button>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn-primary" @click="onSubmit" :disabled="!text.trim()">
          添加任务
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10020;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--bg-primary);
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  margin: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.modal-body {
  padding: 24px;
}

.todo-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 16px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s ease;
  margin-bottom: 20px;
}

.todo-input:focus {
  border-color: var(--primary-color);
}

.todo-input::placeholder {
  color: var(--text-muted);
}

.repeat-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.repeat-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.repeat-buttons {
  display: flex;
  gap: 8px;
}

.repeat-btn {
  flex: 1;
  padding: 10px 16px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.repeat-btn:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.repeat-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.btn-secondary {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-primary {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: var(--primary-color);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
