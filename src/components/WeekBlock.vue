<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { Todo } from '../types'

interface Props {
  weekNumber: number
  year: number
  todos: Todo[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addTodo: []
  toggleTodo: [id: string]
  deleteTodo: [id: string]
  updateTodo: [id: string, text: string]
  dragstart: [e: DragEvent, id: string]
  dropTodo: [id: string]
}>()

const incompleteTodos = computed(() =>
  props.todos.filter(t => !t.completed)
)

const completedTodos = computed(() =>
  props.todos.filter(t => t.completed)
)

const completedCount = computed(() =>
  props.todos.filter(t => t.completed).length
)

const totalCount = computed(() => props.todos.length)

const progress = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

// 编辑相关
const editingId = ref<string | null>(null)
const editText = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)
const isComposing = ref(false)
const isDragOver = ref(false)

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
  const todo = props.todos.find(t => t.id === id)
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

function onDragStart(e: DragEvent, id: string) {
  emit('dragstart', e, id)
}

function onDragOver() {
  isDragOver.value = true
}

function onDragLeave(e: DragEvent) {
  const target = e.relatedTarget as HTMLElement | null
  const currentTarget = e.currentTarget as HTMLElement
  if (!target || !currentTarget.contains(target)) {
    isDragOver.value = false
  }
}

function onDrop(e: DragEvent) {
  const todoId = e.dataTransfer?.getData('text/plain') || ''
  isDragOver.value = false
  emit('dropTodo', todoId)
}
</script>

<template>
  <div
    :class="['week-block', { 'drag-over': isDragOver }]"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="week-block-header">
      <div class="week-number">
        <span class="year">{{ year }}</span>
        <span class="separator">·</span>
        <span class="number">第{{ weekNumber }}周</span>
      </div>
      <div class="week-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-text">{{ completedCount }}/{{ totalCount }}</span>
      </div>
    </div>

    <div class="week-todos">
      <!-- 未完成任务 -->
      <div
        v-for="todo in incompleteTodos"
        :key="todo.id"
        class="week-todo-item"
        draggable="true"
        @dragstart="onDragStart($event, todo.id)"
      >
        <span class="todo-check" :class="{ checked: todo.completed }" @click="$emit('toggleTodo', todo.id)">
          <svg v-if="todo.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <span v-if="editingId === todo.id" class="edit-wrapper">
          <input
            ref="editInputRef"
            v-model="editText"
            class="edit-input"
            @blur="saveEdit(todo.id)"
            @compositionstart="isComposing = true"
            @compositionend="isComposing = false"
            @keydown="onEditKeydown($event, todo.id)"
          />
        </span>
        <span
          v-else
          class="todo-text"
          @dblclick="startEdit(todo.id, todo.text)"
          title="双击编辑"
        >{{ todo.text }}</span>
        <button class="todo-delete" @click.stop="$emit('deleteTodo', todo.id)">×</button>
      </div>
      
      <!-- 空状态 -->
      <div v-if="todos.length === 0" class="no-todos">
        暂无周任务
      </div>
      
      <!-- 已完成任务 -->
      <div v-if="completedTodos.length > 0" class="completed-section">
        <div class="completed-label">已完成</div>
        <div
          v-for="todo in completedTodos"
          :key="todo.id"
          class="week-todo-item completed"
          draggable="true"
          @dragstart="onDragStart($event, todo.id)"
        >
          <span class="todo-check checked" @click="$emit('toggleTodo', todo.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          <span v-if="editingId === todo.id" class="edit-wrapper">
            <input
              ref="editInputRef"
              v-model="editText"
              class="edit-input"
              @blur="saveEdit(todo.id)"
              @compositionstart="isComposing = true"
              @compositionend="isComposing = false"
              @keydown="onEditKeydown($event, todo.id)"
            />
          </span>
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
</template>

<style scoped>
.week-block {
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 14px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.week-block.drag-over {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.week-block-header {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.week-number {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 10px;
}

.year {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.separator {
  color: var(--text-muted);
}

.number {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.week-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.week-todos {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.week-todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 8px;
  transition: all 0.2s;
  cursor: grab;
}

.week-todo-item:hover {
  background: var(--bg-hover);
}

.week-todo-item:active {
  cursor: grabbing;
}

.todo-check {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  cursor: pointer;
}

.todo-check:hover {
  border-color: var(--primary-color);
}

.todo-check.checked {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.todo-check svg {
  width: 10px;
  height: 10px;
  color: white;
}

.todo-text {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.todo-delete {
  width: 22px;
  height: 22px;
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

.week-todo-item.completed {
  opacity: 0.7;
}

.week-todo-item.completed .todo-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.no-todos {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 14px;
}

.week-add-btn {
  flex-shrink: 0;
  margin-top: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.week-add-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--bg-hover);
}

.week-add-btn svg {
  width: 14px;
  height: 14px;
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
