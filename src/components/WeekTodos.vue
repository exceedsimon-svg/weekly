<script setup lang="ts">
import { computed } from 'vue'
import type { Todo } from '../types'
import { formatDate, getDayName } from '../utils/date'

interface Props {
  todos: Todo[]
  weekStart: Date
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggleTodo: [id: string]
  updateTodo: [id: string, text: string]
  deleteTodo: [id: string]
  addTodo: [date: string]
}>()

const weekDays = computed(() => {
  const days: Array<{
    date: string
    dayName: string
    dayOfMonth: number
    isToday: boolean
    todos: Todo[]
  }> = []
  
  const today = formatDate(new Date())
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(props.weekStart)
    date.setDate(date.getDate() + i)
    const dateStr = formatDate(date)
    
    days.push({
      date: dateStr,
      dayName: getDayName(date),
      dayOfMonth: date.getDate(),
      isToday: dateStr === today,
      todos: props.todos.filter(t => t.date === dateStr && t.repeat === 'none')
    })
  }
  
  return days
})

const weekRange = computed(() => {
  const start = weekDays.value[0]
  const end = weekDays.value[6]
  return `${start.dayOfMonth}日 - ${end.dayOfMonth}日`
})

function onToggle(todoId: string) {
  emit('toggleTodo', todoId)
}

function onDelete(todoId: string) {
  emit('deleteTodo', todoId)
}

function onAdd(date: string) {
  emit('addTodo', date)
}
</script>

<template>
  <div class="week-todos">
    <div class="week-header">
      <h3 class="week-title">本周待办</h3>
      <span class="week-range">{{ weekRange }}</span>
    </div>
    
    <div class="week-days">
      <div
        v-for="day in weekDays"
        :key="day.date"
        :class="['week-day', { today: day.isToday }]"
      >
        <div class="day-header-small">
          <span class="day-name">{{ day.dayName }}</span>
          <span class="day-number-small">{{ day.dayOfMonth }}</span>
        </div>
        
        <div class="day-todos-list">
          <div
            v-for="todo in day.todos"
            :key="todo.id"
            :class="['week-todo-item', { completed: todo.completed }]"
            @click="onToggle(todo.id)"
          >
            <span class="todo-checkbox">
              <svg v-if="todo.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span class="todo-text">{{ todo.text }}</span>
            <button class="todo-delete" @click.stop="onDelete(todo.id)">×</button>
          </div>
          
          <button class="add-todo-small" @click="onAdd(day.date)">
            + 添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.week-todos {
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 16px;
}

.week-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.week-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.week-range {
  font-size: 13px;
  color: var(--text-secondary);
}

.week-days {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.week-day {
  padding: 10px;
  border-radius: 8px;
  background: var(--bg-secondary);
}

.week-day.today {
  border: 1px solid var(--primary-color);
  background: var(--primary-light);
}

.day-header-small {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.day-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.day-number-small {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.day-todos-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.week-todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.week-todo-item:hover {
  background: var(--bg-hover);
}

.week-todo-item.completed .todo-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.todo-checkbox {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.week-todo-item.completed .todo-checkbox {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.todo-checkbox svg {
  width: 10px;
  height: 10px;
  color: white;
}

.todo-text {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}

.todo-delete {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 16px;
  line-height: 1;
}

.week-todo-item:hover .todo-delete {
  opacity: 1;
}

.todo-delete:hover {
  color: var(--danger-color);
}

.add-todo-small {
  padding: 6px 10px;
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.add-todo-small:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
</style>
