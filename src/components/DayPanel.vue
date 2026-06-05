<script setup lang="ts">
import { computed } from 'vue'
import type { Todo } from '../types'
import { getDayName } from '../utils/date'

interface Props {
  show: boolean
  date: string
  todos: Todo[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  addTodo: []
  toggleTodo: [id: string]
  deleteTodo: [id: string]
}>()

const dateObj = computed(() => new Date(props.date + 'T00:00:00'))
const dayName = computed(() => getDayName(dateObj.value))
const dayOfMonth = computed(() => dateObj.value.getDate())

const incompleteTodos = computed(() =>
  props.todos.filter(t => !t.completed)
)

const completedTodos = computed(() =>
  props.todos.filter(t => t.completed)
)
</script>

<template>
  <div v-if="show" class="panel-overlay" @click.self="$emit('close')">
    <div class="day-panel">
      <div class="panel-header">
        <div class="panel-title">
          <span class="day-name">{{ dayName }}</span>
          <span class="day-number">{{ dayOfMonth }}日</span>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="panel-body">
        <div v-if="incompleteTodos.length > 0" class="todo-group">
          <div class="group-label">待办</div>
          <div
            v-for="todo in incompleteTodos"
            :key="todo.id"
            class="panel-todo-item"
          >
            <span class="todo-check" @click="$emit('toggleTodo', todo.id)">
              <svg v-if="todo.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span class="todo-text" @click="$emit('toggleTodo', todo.id)">{{ todo.text }}</span>
            <button class="todo-delete" @click.stop="$emit('deleteTodo', todo.id)">×</button>
          </div>
        </div>

        <button class="panel-add-btn" @click="$emit('addTodo')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加任务
        </button>

        <div v-if="completedTodos.length > 0" class="todo-group completed">
          <div class="group-label">已完成</div>
          <div
            v-for="todo in completedTodos"
            :key="todo.id"
            class="panel-todo-item completed"
          >
            <span class="todo-check checked" @click="$emit('toggleTodo', todo.id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span class="todo-text" @click="$emit('toggleTodo', todo.id)">{{ todo.text }}</span>
            <button class="todo-delete" @click.stop="$emit('deleteTodo', todo.id)">×</button>
          </div>
        </div>

        <div v-if="todos.length === 0" class="empty-state">
          这一天还没有任务
        </div>
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
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.day-panel {
  background: var(--bg-primary);
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
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
  gap: 10px;
}

.day-name {
  font-size: 14px;
  color: var(--text-secondary);
}

.day-number {
  font-size: 22px;
  font-weight: 700;
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

.todo-group {
  margin-bottom: 16px;
}

.todo-group.completed {
  opacity: 0.7;
}

.group-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.panel-todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 6px;
  transition: all 0.2s;
}

.panel-todo-item:hover {
  background: var(--bg-hover);
}

.panel-todo-item.completed .todo-text {
  text-decoration: line-through;
  color: var(--text-muted);
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

.panel-add-btn {
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
  margin-bottom: 16px;
}

.panel-add-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--bg-hover);
}

.panel-add-btn svg {
  width: 16px;
  height: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  font-size: 14px;
}
</style>
