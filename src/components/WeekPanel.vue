<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { Todo } from '../types'

interface Props {
  show: boolean
  weekNumber: number
  year: number
  weekTodos: Todo[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  addTodo: []
  toggleTodo: [id: string]
  deleteTodo: [id: string]
  updateTodo: [id: string, text: string]
}>()

const incompleteTodos = computed(() =>
  props.weekTodos.filter(t => !t.completed)
)

const completedTodos = computed(() =>
  props.weekTodos.filter(t => t.completed)
)

const completedCount = computed(() =>
  props.weekTodos.filter(t => t.completed).length
)

const totalCount = computed(() => props.weekTodos.length)

const progress = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

// 编辑相关
const editingId = ref<string | null>(null)
const editText = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)
const isComposing = ref(false)

function startEdit(id: string, text: string) {
  editingId.value = id
  editText.value = text
  nextTick(() => {
    editInputRef.value?.focus()
    editInputRef.value?.select()
  })
}

function saveEdit(id: string) {
  // 防止重复触发（enter 和 blur 冲突）
  if (editingId.value !== id) return
  
  const trimmed = editText.value.trim()
  const todo = props.weekTodos.find(t => t.id === id)
  if (trimmed && todo && trimmed !== todo.text) {
    emit('updateTodo', id, trimmed)
  }
  editingId.value = null
}

function onEditKeydown(e: KeyboardEvent, id: string) {
  if (e.isComposing || isComposing.value || e.keyCode === 229) return

  if (e.key === 'Enter') {
    saveEdit(id)
  } else if (e.key === 'Escape') {
    cancelEdit()
  }
}

function cancelEdit() {
  editingId.value = null
}
</script>

<template>
  <div v-if="show" class="panel-overlay" @click.self="$emit('close')">
    <div class="week-panel">
      <div class="panel-header">
        <div class="panel-title">
          <span class="year">{{ year }}</span>
          <span class="separator">·</span>
          <span class="week-label">第{{ weekNumber }}周</span>
          <span class="week-badge" v-if="incompleteTodos.length > 0">{{ incompleteTodos.length }} 待办</span>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="panel-body">
        <div class="week-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <span class="progress-text">{{ completedCount }}/{{ totalCount }}</span>
        </div>

        <div class="week-todos">
          <div
            v-for="todo in incompleteTodos"
            :key="todo.id"
            class="todo-item"
          >
            <span class="todo-check" @click="$emit('toggleTodo', todo.id)">
              <svg v-if="todo.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <div v-if="editingId === todo.id" class="edit-wrapper">
              <input
                ref="editInputRef"
                v-model="editText"
                class="edit-input"
                @blur="saveEdit(todo.id)"
                @compositionstart="isComposing = true"
                @compositionend="isComposing = false"
                @keydown="onEditKeydown($event, todo.id)"
              />
            </div>
            <span
              v-else
              class="todo-text"
              @dblclick="startEdit(todo.id, todo.text)"
              title="双击编辑"
            >{{ todo.text }}</span>
            <button class="todo-delete" @click.stop="$emit('deleteTodo', todo.id)">×</button>
          </div>
          
          <div v-if="incompleteTodos.length === 0 && weekTodos.length > 0" class="all-done">
            ✓ 本周任务全部完成
          </div>
          <div v-if="weekTodos.length === 0" class="no-todos">
            暂无周任务
          </div>

          <div v-if="completedTodos.length > 0" class="completed-section">
            <div class="completed-label">已完成</div>
            <div
              v-for="todo in completedTodos"
              :key="todo.id"
              class="todo-item completed"
            >
              <span class="todo-check checked" @click="$emit('toggleTodo', todo.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <div v-if="editingId === todo.id" class="edit-wrapper">
                <input
                  ref="editInputRef"
                  v-model="editText"
                  class="edit-input"
                  @blur="saveEdit(todo.id)"
                  @compositionstart="isComposing = true"
                  @compositionend="isComposing = false"
                  @keydown="onEditKeydown($event, todo.id)"
                />
              </div>
              <span
                v-else
                class="todo-text"
                @dblclick="startEdit(todo.id, todo.text)"
                title="双击编辑"
              >{{ todo.text }}</span>
              <button class="todo-delete" @click.stop="$emit('deleteTodo', todo.id)">×</button>
            </div>
          </div>
        </div>

        <button class="week-add-btn" @click="$emit('addTodo')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加周任务
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.week-panel {
  background: var(--bg-primary);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  margin: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.year {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.separator {
  color: var(--text-muted);
}

.week-label {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
}

.week-badge {
  font-size: 12px;
  padding: 4px 10px;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 12px;
  font-weight: 500;
  margin-left: 8px;
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
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.panel-body {
  padding: 20px 24px;
  overflow: auto;
}

.week-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  min-width: 50px;
  text-align: right;
}

.week-todos {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  transition: all 0.2s;
}

.todo-item:hover {
  background: var(--bg-hover);
}

.todo-check {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.todo-check:hover {
  border-color: var(--primary-color);
}

.todo-check.checked {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.todo-check svg {
  width: 12px;
  height: 12px;
  color: white;
}

.todo-text {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
}

.todo-item.completed {
  opacity: 0.7;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.todo-delete {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.todo-delete:hover {
  background: var(--bg-hover);
  color: var(--danger-color);
}

.all-done {
  text-align: center;
  padding: 30px;
  color: var(--primary-color);
  font-size: 14px;
  font-weight: 500;
}

.no-todos {
  text-align: center;
  padding: 30px;
  color: var(--text-muted);
  font-size: 14px;
}

.completed-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.completed-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  padding-left: 4px;
}

.week-add-btn {
  width: 100%;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.week-add-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--bg-hover);
}

.week-add-btn svg {
  width: 16px;
  height: 16px;
}

.edit-wrapper {
  flex: 1;
  min-width: 0;
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
</style>
