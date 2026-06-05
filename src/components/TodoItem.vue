<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Todo, RepeatType } from '../types'

interface Props {
  todo: Todo
  showRepeat?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRepeat: false
})

const emit = defineEmits<{
  toggle: [id: string]
  update: [id: string, text: string]
  delete: [id: string]
  changeRepeat: [id: string, repeat: RepeatType]
  dragstart: [e: DragEvent, id: string]
}>()

function onDragStart(e: DragEvent) {
  emit('dragstart', e, props.todo.id)
}

const isEditing = ref(false)
const editText = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const isComposing = ref(false)

function startEdit() {
  editText.value = props.todo.text
  isEditing.value = true
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function saveEdit() {
  const trimmed = editText.value.trim()
  if (trimmed && trimmed !== props.todo.text) {
    emit('update', props.todo.id, trimmed)
  }
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.isComposing || isComposing.value || e.keyCode === 229) return

  if (e.key === 'Enter') {
    saveEdit()
  } else if (e.key === 'Escape') {
    cancelEdit()
  }
}

function toggleRepeat() {
  const cycles: RepeatType[] = ['none', 'daily', 'weekly']
  const currentIndex = cycles.indexOf(props.todo.repeat)
  const nextRepeat = cycles[(currentIndex + 1) % cycles.length]
  emit('changeRepeat', props.todo.id, nextRepeat)
}

function getRepeatIcon(repeat: RepeatType): string {
  switch (repeat) {
    case 'daily': return '↻ 每天'
    case 'weekly': return '↻ 每周'
    default: return ''
  }
}
</script>

<template>
  <div
    :class="['todo-item', { completed: todo.completed }]"
    draggable="true"
    @dragstart="onDragStart"
  >
    <div class="todo-content">
      <button
        :class="['checkbox', { checked: todo.completed }]"
        @click="$emit('toggle', todo.id)"
      >
        <svg v-if="todo.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
      
      <div v-if="isEditing" class="edit-wrapper">
        <input
          ref="inputRef"
          v-model="editText"
          class="edit-input"
          @blur="saveEdit"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
          @keydown="onKeydown"
        />
      </div>
      
      <span
        v-else
        class="todo-text"
        @dblclick="startEdit"
        :title="todo.repeat !== 'none' ? '双击编辑' : '双击编辑，拖拽移动日期'"
      >
        {{ todo.text }}
      </span>
      
      <button
        v-if="showRepeat && todo.repeat !== 'none'"
        class="repeat-badge"
        @click="toggleRepeat"
        :title="todo.repeat === 'daily' ? '每天重复，点击切换' : '每周重复，点击切换'"
      >
        {{ getRepeatIcon(todo.repeat) }}
      </button>
    </div>
    
    <button class="delete-btn" @click="$emit('delete', todo.id)" title="删除">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: var(--bg-secondary);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.todo-item:hover {
  border-color: var(--border-hover);
}

.todo-item:active {
  cursor: grabbing;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.todo-content {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 10px;
  min-width: 0;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox:hover {
  border-color: var(--primary-color);
}

.checkbox.checked {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.checkbox svg {
  width: 12px;
  height: 12px;
  color: white;
}

.todo-text {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  cursor: text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-wrapper {
  flex: 1;
}

.edit-input {
  width: 100%;
  padding: 4px 8px;
  border: 2px solid var(--primary-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
}

.repeat-badge {
  padding: 2px 8px;
  font-size: 11px;
  color: var(--primary-color);
  background: var(--primary-light);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.delete-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  color: var(--text-muted);
  border-radius: 4px;
}

.todo-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: var(--bg-hover);
  color: var(--danger-color);
}

.delete-btn svg {
  width: 14px;
  height: 14px;
}
</style>
