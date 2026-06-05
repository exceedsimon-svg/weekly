<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Todo, RepeatType } from '../types'
import TodoItem from './TodoItem.vue'
import { getDayName, getMonthName } from '../utils/date'
import { loadGoal, saveGoal as saveGoalApi } from '../utils/storage'

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

function startEditGoal() {
  isEditingGoal.value = true
  setTimeout(() => goalInputRef.value?.focus(), 0)
}

async function saveGoal() {
  isEditingGoal.value = false
  await saveGoalApi(dailyGoal.value)
}

// 加载目标 - 在客户端挂载后执行
onMounted(async () => {
  dailyGoal.value = await loadGoal()
})

// 自动保存目标
watch(dailyGoal, async (newVal) => {
  if (!isEditingGoal.value) {
    await saveGoalApi(newVal)
  }
})
</script>

<template>
  <div class="day-view">
    <div class="day-header">
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
            cx="30" 
            cy="30" 
            r="26"
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
        />
      </div>
    </div>
    
    <div v-if="repeatingTodos.length > 0" class="repeating-section">
      <div class="section-label">重复任务模板</div>
      <div class="repeating-list">
        <div v-for="todo in repeatingTodos" :key="todo.id" class="repeating-item">
          <span class="repeating-text">{{ todo.text }}</span>
          <span :class="['repeating-badge', todo.repeat]">
            {{ todo.repeat === 'daily' ? '每天' : '每周' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.day-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
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
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.progress-ring {
  position: relative;
  width: 60px;
  height: 60px;
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
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.goal-section {
  margin-bottom: 32px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.goal-input-wrapper {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
}

.goal-input {
  width: 100%;
  font-size: 18px;
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
  border-radius: 12px;
  padding: 16px;
  cursor: text;
  transition: background 0.2s ease;
}

.goal-display:hover {
  background: var(--bg-hover);
}

.goal-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}

.goal-placeholder {
  font-size: 18px;
  color: var(--text-muted);
}

.todos-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.task-count {
  font-size: 14px;
  color: var(--text-secondary);
}

.todo-group {
  margin-bottom: 16px;
}

.completed-group {
  opacity: 0.7;
}

.completed-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  padding-left: 4px;
}

.add-todo-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}

.add-todo-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--bg-hover);
}

.add-todo-btn svg {
  width: 16px;
  height: 16px;
}

.repeating-section {
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.repeating-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.repeating-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.repeating-text {
  font-size: 14px;
  color: var(--text-primary);
}

.repeating-badge {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
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
</style>