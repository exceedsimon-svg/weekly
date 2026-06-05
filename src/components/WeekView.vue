<script setup lang="ts">
import { ref } from 'vue'
import type { DayInfo, RepeatType } from '../types'
import TodoItem from './TodoItem.vue'

interface Props {
  days: DayInfo[]
}

defineProps<Props>()

const emit = defineEmits<{
  addTodo: [date: string]
  toggleTodo: [id: string]
  updateTodo: [id: string, text: string]
  deleteTodo: [id: string]
  moveTodo: [id: string, date: string]
  changeRepeat: [id: string, repeat: RepeatType]
}>()

const draggedTodoId = ref<string | null>(null)
const dragOverDate = ref<string | null>(null)

function onDragStart(e: DragEvent, todoId: string) {
  draggedTodoId.value = todoId
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', todoId)
  }
}

function onDragOver(e: DragEvent, date: string) {
  e.preventDefault()
  dragOverDate.value = date
}

function onDragLeave(e: DragEvent) {
  const target = e.relatedTarget as HTMLElement
  if (!target?.closest('.day-column')) {
    dragOverDate.value = null
  }
}

function onDrop(e: DragEvent, date: string) {
  e.preventDefault()
  const todoId = e.dataTransfer?.getData('text/plain') || draggedTodoId.value
  if (todoId) {
    emit('moveTodo', todoId, date)
  }
  draggedTodoId.value = null
  dragOverDate.value = null
}

function onAddClick(date: string) {
  emit('addTodo', date)
}
</script>

<template>
  <div class="week-view">
    <div v-for="day in days" :key="day.date" 
         :class="['day-column', { 
           today: day.isToday,
           'drag-over': dragOverDate === day.date 
         }]"
         @dragover="onDragOver($event, day.date)"
         @dragleave="onDragLeave"
         @drop="onDrop($event, day.date)">
      
      <div class="day-header">
        <span class="day-name">{{ day.dayName }}</span>
        <span :class="['day-number', { 'today-badge': day.isToday }]">
          {{ day.dayOfMonth }}
        </span>
      </div>
      
      <div class="todo-list">
        <TodoItem
          v-for="todo in day.todos"
          :key="todo.id"
          :todo="todo"
          @toggle="(id) => $emit('toggleTodo', id)"
          @update="(id, text) => $emit('updateTodo', id, text)"
          @delete="(id) => $emit('deleteTodo', id)"
          @changeRepeat="(id, repeat) => $emit('changeRepeat', id, repeat)"
          @dragstart="onDragStart"
        />
      </div>
      
      <button class="add-btn" @click="onAddClick(day.date)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>添加</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.week-view {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  height: 100%;
  overflow-x: auto;
}

.day-column {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px 12px;
  min-width: 160px;
  transition: all 0.2s ease;
}

.day-column.today {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.day-column.drag-over {
  border-color: var(--primary-color);
  background: var(--bg-hover);
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.day-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.day-number {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.day-number.today-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-size: 14px;
}

.todo-list {
  flex: 1;
  overflow-y: auto;
  min-height: 100px;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  padding: 10px;
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--bg-hover);
}

.add-btn svg {
  width: 14px;
  height: 14px;
}

@media (max-width: 1024px) {
  .week-view {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  
  .day-column {
    min-width: auto;
    padding: 12px 10px;
  }
}

@media (max-width: 640px) {
  .week-view {
    grid-template-columns: 1fr;
  }
}
</style>