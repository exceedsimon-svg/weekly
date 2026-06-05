<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Todo, RepeatType } from '../types'
import TodoItem from './TodoItem.vue'

interface Props {
  title: string
  subtitle?: string
  emptyText: string
  addLabel: string
  todos: Todo[]
  showRepeat?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  showRepeat: false
})

const emit = defineEmits<{
  addTodo: []
  toggleTodo: [id: string]
  updateTodo: [id: string, text: string]
  deleteTodo: [id: string]
  changeRepeat: [id: string, repeat: RepeatType]
  dragstart: [e: DragEvent, id: string]
  dropTodo: [id: string]
}>()

const isDragOver = ref(false)

const incompleteTodos = computed(() =>
  props.todos.filter(t => !t.completed)
)

const completedTodos = computed(() =>
  props.todos.filter(t => t.completed)
)

const completedCount = computed(() =>
  props.todos.filter(t => t.completed).length
)

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
  <section
    :class="['task-panel', { 'drag-over': isDragOver }]"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="panel-header">
      <div>
        <h2 class="panel-title">{{ title }}</h2>
        <p v-if="subtitle" class="panel-subtitle">{{ subtitle }}</p>
      </div>
      <span class="task-count">{{ completedCount }}/{{ todos.length }}</span>
    </div>

    <div class="panel-body">
      <div v-if="incompleteTodos.length > 0" class="todo-group">
        <TodoItem
          v-for="todo in incompleteTodos"
          :key="todo.id"
          :todo="todo"
          :show-repeat="showRepeat"
          @toggle="(id) => $emit('toggleTodo', id)"
          @update="(id, text) => $emit('updateTodo', id, text)"
          @delete="(id) => $emit('deleteTodo', id)"
          @changeRepeat="(id, repeat) => $emit('changeRepeat', id, repeat)"
          @dragstart="onDragStart"
        />
      </div>

      <div v-if="todos.length === 0" class="empty-state">
        {{ emptyText }}
      </div>

      <button class="add-todo-btn" @click="$emit('addTodo')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>{{ addLabel }}</span>
      </button>

      <div v-if="completedTodos.length > 0" class="todo-group completed-group">
        <div class="completed-label">已完成</div>
        <TodoItem
          v-for="todo in completedTodos"
          :key="todo.id"
          :todo="todo"
          :show-repeat="showRepeat"
          @toggle="(id) => $emit('toggleTodo', id)"
          @update="(id, text) => $emit('updateTodo', id, text)"
          @delete="(id) => $emit('deleteTodo', id)"
          @changeRepeat="(id, repeat) => $emit('changeRepeat', id, repeat)"
          @dragstart="onDragStart"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.task-panel {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.task-panel.drag-over {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-size: 18px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.panel-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.task-count {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: 999px;
  padding: 4px 10px;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.todo-group {
  margin-bottom: 12px;
}

.completed-group {
  opacity: 0.7;
}

.completed-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
  padding-left: 4px;
}

.empty-state {
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
  padding: 20px 8px;
}

.add-todo-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.add-todo-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--bg-hover);
}

.add-todo-btn svg {
  width: 14px;
  height: 14px;
}
</style>
