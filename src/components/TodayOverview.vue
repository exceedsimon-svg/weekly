<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import type { Todo, RepeatType } from '../types'
import TodoItem from './TodoItem.vue'
import { getDayName, getMonthName } from '../utils/date'
import { loadGoal, saveGoal as saveGoalApi } from '../utils/storage'

// 任务图标映射
const taskIcons: Record<string, string> = {
  '骑车': '🚴',
  '骑行': '🚴',
  '看书': '📖',
  '阅读': '📖',
  '读书': '📖',
  '单杠': '💪',
  '引体': '💪',
  '健身': '💪',
  '跑步': '🏃',
  '游泳': '🏊',
  '瑜伽': '🧘',
  '冥想': '🧘',
}

function getTaskIcon(text: string): string {
  for (const [key, icon] of Object.entries(taskIcons)) {
    if (text.includes(key)) {
      return icon
    }
  }
  return '📋'
}

interface Props {
  todos: Todo[]
  repeatingTodos: Todo[]
  completedCount: number
  totalCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addTodo: []
  toggleTodo: [id: string]
  updateTodo: [id: string, text: string]
  deleteTodo: [id: string]
  changeRepeat: [id: string, repeat: RepeatType]
  dragstart: [e: DragEvent, id: string]
  dropTodo: [id: string]
}>()

const today = new Date()
const dayName = getDayName(today)
const monthName = getMonthName(today)

const progress = computed(() => {
  if (props.totalCount === 0) return 0
  return Math.round((props.completedCount / props.totalCount) * 100)
})

const incompleteTodos = computed(() => 
  props.todos.filter(t => !t.completed)
)

const completedTodos = computed(() => 
  props.todos.filter(t => t.completed)
)

const dailyGoal = ref('')
const isEditingGoal = ref(false)
const goalInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

function startEditGoal() {
  isEditingGoal.value = true
  setTimeout(() => goalInputRef.value?.focus(), 0)
}

async function saveGoal() {
  isEditingGoal.value = false
  await saveGoalApi(dailyGoal.value)
}

onMounted(async () => {
  dailyGoal.value = await loadGoal()
})

watch(dailyGoal, async (newVal) => {
  if (!isEditingGoal.value) {
    await saveGoalApi(newVal)
  }
})

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
    :class="['today-overview', { 'drag-over': isDragOver }]"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="today-header">
      <div class="date-info">
        <span class="day-label">{{ dayName }}</span>
        <h2 class="date-title">
          {{ today.getDate() }} {{ monthName }}
        </h2>
      </div>
      
      <div class="progress-ring">
        <svg viewBox="0 0 60 60" class="ring">
          <circle class="ring-bg" cx="30" cy="30" r="26"></circle>
          <circle 
            class="ring-progress" 
            cx="30" cy="30" r="26"
            :style="{
              strokeDasharray: `${163.36}`,
              strokeDashoffset: `${163.36 - (163.36 * progress) / 100}`
            }"
          ></circle>
        </svg>
        <span class="progress-text">{{ progress }}%</span>
      </div>
    </div>
    
    <div class="goal-section">
      <div class="section-label">今日目标</div>
      <div v-if="isEditingGoal" class="goal-input-wrapper">
        <input
          ref="goalInputRef"
          v-model="dailyGoal"
          class="goal-input"
          placeholder="设定今天的目标..."
          @blur="saveGoal"
          @keydown.enter="saveGoal"
        />
      </div>
      <div v-else class="goal-display" @click="startEditGoal">
        <span v-if="dailyGoal" class="goal-text">{{ dailyGoal }}</span>
        <span v-else class="goal-placeholder">点击设定今日目标</span>
      </div>
    </div>
    
    <div class="todos-section">
      <div class="section-header">
        <span class="section-label">待办事项</span>
        <span class="task-count">{{ completedCount }}/{{ totalCount }}</span>
      </div>
      
      <div v-if="incompleteTodos.length > 0" class="todo-group">
        <TodoItem
          v-for="todo in incompleteTodos"
          :key="todo.id"
          :todo="todo"
          show-repeat
          @toggle="(id) => $emit('toggleTodo', id)"
          @update="(id, text) => $emit('updateTodo', id, text)"
          @delete="(id) => $emit('deleteTodo', id)"
          @changeRepeat="(id, repeat) => $emit('changeRepeat', id, repeat)"
          @dragstart="onDragStart"
        />
      </div>
      
      <button class="add-todo-btn" @click="$emit('addTodo')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>添加新任务</span>
      </button>
      
      <div v-if="completedTodos.length > 0" class="todo-group completed-group">
        <div class="completed-label">已完成</div>
        <TodoItem
          v-for="todo in completedTodos"
          :key="todo.id"
          :todo="todo"
          show-repeat
          @toggle="(id) => $emit('toggleTodo', id)"
          @update="(id, text) => $emit('updateTodo', id, text)"
          @delete="(id) => $emit('deleteTodo', id)"
          @changeRepeat="(id, repeat) => $emit('changeRepeat', id, repeat)"
          @dragstart="onDragStart"
        />
      </div>
    </div>
    
    <div v-if="repeatingTodos.length > 0" class="repeating-section">
      <div class="section-label">重复任务模板</div>
      <div class="repeating-list">
        <div v-for="todo in repeatingTodos" :key="todo.id" class="repeating-item">
          <span class="repeating-icon">{{ getTaskIcon(todo.text) }}</span>
          <span class="repeating-text">{{ todo.text }}</span>
          <div class="repeating-actions">
            <span :class="['repeating-badge', todo.repeat]">
              {{ todo.repeat === 'daily' ? '每天' : '每周' }}
            </span>
            <button class="repeating-delete" @click="$emit('deleteTodo', todo.id)">×</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.today-overview {
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 14px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.today-overview.drag-over {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.today-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-label {
  font-size: 14px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.date-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.progress-ring {
  position: relative;
  width: 42px;
  height: 42px;
}

.ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: var(--border-color);
  stroke-width: 4;
}

.ring-progress {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.goal-section {
  margin-bottom: 14px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.goal-input-wrapper {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 10px;
}

.goal-input {
  width: 100%;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
}

.goal-input::placeholder {
  color: var(--text-muted);
}

.goal-display {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 10px;
  cursor: text;
  transition: background 0.2s;
}

.goal-display:hover {
  background: var(--bg-hover);
}

.goal-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.goal-placeholder {
  font-size: 14px;
  color: var(--text-muted);
}

.todos-section {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.task-count {
  font-size: 13px;
  color: var(--text-secondary);
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

.add-todo-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
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

.repeating-section {
  flex-shrink: 0;
  max-height: 118px;
  overflow: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.repeating-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.repeating-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.repeating-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.repeating-text {
  font-size: 13px;
  color: var(--text-primary);
  flex: 1;
}

.repeating-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.repeating-badge {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.repeating-badge.daily {
  background: var(--primary-light);
  color: var(--primary-color);
}

.repeating-badge.weekly {
  background: var(--warning-light);
  color: var(--warning-color);
}

.repeating-delete {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.repeating-delete:hover {
  background: var(--bg-hover);
  color: var(--danger-color);
}
</style>
