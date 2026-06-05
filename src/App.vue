<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RepeatType } from './types'
import { useTodos } from './composables/useTodos'
import { useDarkMode } from './composables/useDarkMode'
import WeekBlock from './components/WeekBlock.vue'
import TodayOverview from './components/TodayOverview.vue'
import TaskPanel from './components/TaskPanel.vue'
import ProjectPage from './components/ProjectPage.vue'
import MonthCalendar from './components/MonthCalendar.vue'
import DayPanel from './components/DayPanel.vue'
import WeekPanel from './components/WeekPanel.vue'
import AddTodoModal from './components/AddTodoModal.vue'
import { addDays, formatDate } from './utils/date'

const { isDark, toggle: toggleDarkMode } = useDarkMode()

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
  return '🔥'
}
const showModal = ref(false)
const modalDate = ref<string | undefined>(undefined)
const currentMonth = ref(new Date())
const currentPage = ref<'home' | 'calendar' | 'projects'>('home')
const draggedTodoId = ref<string | null>(null)
const draggedWeekTodoId = ref<string | null>(null)
const showWeekBacklogDrawer = ref(false)
const showTomorrowDrawer = ref(false)

// 周面板
const showWeekPanel = ref(false)
const panelWeekStart = ref('')
const panelWeekNumber = ref(0)
const panelYear = ref(new Date().getFullYear())

const {
  todos,
  todayTodos,
  tomorrowTodos,
  unscheduledWeekTodos,
  repeatingTodos,
  streakStats,
  completedCount,
  totalCount,
  getTodosForDate,
  getWeekTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
  moveTodo,
  addWeekTodo,
  addUnscheduledWeekTodo,
  updateWeekTodo,
  deleteWeekTodo,
  toggleWeekTodo,
  moveWeekTodoToWeek,
  moveWeekTodoToUnscheduled,
  ensureWeekCarryover,
  processRepeatingTasks
} = useTodos()

// 当前周的周任务
const currentWeekTodos = computed(() => getWeekTodos(currentWeekNumber.value, currentYear.value))

const isWeekModal = ref(false)
const isUnscheduledWeekModal = ref(false)

// 日面板弹窗
const showDayPanel = ref(false)
const panelDate = ref('')
const panelTodos = computed(() => {
  return getTodosForDate(panelDate.value)
})

function getWeekInfo(date: Date): { weekNumber: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return {
    weekNumber: Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7),
    year: d.getUTCFullYear()
  }
}

const todayDate = computed(() => formatDate(new Date()))
const tomorrowDate = computed(() => formatDate(addDays(new Date(), 1)))
const currentWeekInfo = computed(() => getWeekInfo(new Date()))
const currentWeekNumber = computed(() => currentWeekInfo.value.weekNumber)

const currentYear = computed(() => currentWeekInfo.value.year)

function handleAddTodo(date?: string) {
  modalDate.value = date
  isWeekModal.value = false
  isUnscheduledWeekModal.value = false
  showModal.value = true
}

function handleAddWeekTodo() {
  isWeekModal.value = true
  isUnscheduledWeekModal.value = false
  modalDate.value = undefined
  showModal.value = true
}

function handleWeekPanelAdd() {
  isWeekModal.value = true
  isUnscheduledWeekModal.value = false
  modalDate.value = undefined
  showModal.value = true
}

function handleAddUnscheduledWeekTodo() {
  isWeekModal.value = true
  isUnscheduledWeekModal.value = true
  modalDate.value = undefined
  showModal.value = true
}

function handleModalAdd(text: string, repeat: RepeatType) {
  if (isWeekModal.value) {
    if (isUnscheduledWeekModal.value) {
      addUnscheduledWeekTodo(text)
    } else {
      // 添加周任务时带上周号和年份
      const weekNum = showWeekPanel.value ? panelWeekNumber.value : currentWeekNumber.value
      const yr = showWeekPanel.value ? panelYear.value : currentYear.value
      addWeekTodo(text, weekNum, yr)
    }
  } else {
    const date = modalDate.value ?? todayDate.value
    addTodo(text, date, repeat)
  }
}

function handleChangeRepeat(id: string, repeat: RepeatType) {
  const todo = repeatingTodos.value.find(t => t.id === id) || todayTodos.value.find(t => t.id === id)
  if (todo) {
    updateTodo(id, { repeat })
  }
}

function handleUpdateTodo(id: string, text: string) {
  updateTodo(id, { text })
}

function handleUpdateWeekTodo(id: string, text: string) {
  updateWeekTodo(id, { text })
}

function onSelectDate(date: string) {
  panelDate.value = date
  showDayPanel.value = true
}

function onSelectWeek(weekStart: string, weekNumber: number) {
  panelWeekStart.value = weekStart
  panelWeekNumber.value = weekNumber
  panelYear.value = getWeekInfo(new Date(weekStart + 'T00:00:00')).year
  ensureWeekCarryover(weekNumber, panelYear.value)
  showWeekPanel.value = true
}

function prevMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

function goToToday() {
  currentMonth.value = new Date()
}

function switchPage(page: 'home' | 'calendar' | 'projects') {
  currentPage.value = page
}

function handleDragStart(e: DragEvent, id: string) {
  draggedTodoId.value = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}

function handleDropTodo(id: string, targetDate: string) {
  const todoId = id || draggedTodoId.value
  if (todoId) {
    moveTodo(todoId, targetDate)
  }
  draggedTodoId.value = null
}

function handleWeekDragStart(e: DragEvent, id: string) {
  draggedWeekTodoId.value = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
}

function handleDropWeekTodo(id: string, target: 'scheduled' | 'unscheduled') {
  const todoId = id || draggedWeekTodoId.value
  if (todoId && target === 'scheduled') {
    moveWeekTodoToWeek(todoId, currentWeekNumber.value, currentYear.value)
  } else if (todoId) {
    moveWeekTodoToUnscheduled(todoId)
  }
  draggedWeekTodoId.value = null
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <h1 class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          待办日历
        </h1>
      </div>

      <div class="header-center">
        <button 
          :class="['tab-btn', { active: currentPage === 'home' }]" 
          @click="switchPage('home')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          首页
        </button>
        <button 
          :class="['tab-btn', { active: currentPage === 'calendar' }]" 
          @click="switchPage('calendar')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          日历
        </button>
        <button
          :class="['tab-btn', { active: currentPage === 'projects' }]"
          @click="switchPage('projects')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7h7l2 2h9v10H3z"></path>
            <path d="M3 7V5h7l2 2"></path>
          </svg>
          项目
        </button>
      </div>

      <div class="header-right">
        <button class="icon-btn refresh-btn" @click="processRepeatingTasks" title="刷新重复任务">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>

        <button class="icon-btn theme-btn" @click="toggleDarkMode"
          :title="isDark ? '切换到亮色模式' : '切换到暗色模式'">
          <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
      </div>
    </header>

    <!-- 坚持天数 Banner -->
    <div v-if="streakStats.length > 0" class="streak-banner">
      <div class="streak-items">
        <div v-for="stat in streakStats" :key="stat.text" class="streak-item">
          <span class="streak-icon">{{ getTaskIcon(stat.text) }}</span>
          <span class="streak-text">{{ stat.text }}</span>
          <span class="streak-count">累计 {{ stat.streak }}天</span>
        </div>
      </div>
    </div>

    <main class="app-main">
      <!-- 首页：本周 + 今天；左右抽屉承载周未排期和明天 -->
      <div v-if="currentPage === 'home'" class="home-page">
        <button
          :class="['drawer-handle', 'drawer-handle-left', { open: showWeekBacklogDrawer }]"
          @click="showWeekBacklogDrawer = !showWeekBacklogDrawer"
          :title="showWeekBacklogDrawer ? '收起周未排期' : '展开周未排期'"
        >
          <span>{{ showWeekBacklogDrawer ? '收起' : '周未排期' }}</span>
        </button>

        <button
          :class="['drawer-handle', 'drawer-handle-right', { open: showTomorrowDrawer }]"
          @click="showTomorrowDrawer = !showTomorrowDrawer"
          :title="showTomorrowDrawer ? '收起明天待办' : '展开明天待办'"
        >
          <span>{{ showTomorrowDrawer ? '收起' : '明天' }}</span>
        </button>

        <aside :class="['side-drawer', 'side-drawer-left', { open: showWeekBacklogDrawer }]">
          <TaskPanel
            title="周未排期"
            subtitle="拖到本周即可排入周计划"
            empty-text="暂无周未排期任务"
            add-label="添加周未排期"
            :todos="unscheduledWeekTodos"
            @add-todo="handleAddUnscheduledWeekTodo"
            @toggle-todo="toggleWeekTodo"
            @update-todo="handleUpdateWeekTodo"
            @delete-todo="deleteWeekTodo"
            @dragstart="handleWeekDragStart"
            @drop-todo="(id) => handleDropWeekTodo(id, 'unscheduled')"
          />
        </aside>

        <aside :class="['side-drawer', 'side-drawer-right', { open: showTomorrowDrawer }]">
          <TaskPanel
            title="明天待办"
            :subtitle="tomorrowDate"
            empty-text="明天还没有安排任务"
            add-label="添加明天任务"
            :todos="tomorrowTodos"
            show-repeat
            @add-todo="handleAddTodo(tomorrowDate)"
            @toggle-todo="toggleTodo"
            @update-todo="handleUpdateTodo"
            @delete-todo="deleteTodo"
            @change-repeat="handleChangeRepeat"
            @dragstart="handleDragStart"
            @drop-todo="(id) => handleDropTodo(id, tomorrowDate)"
          />
        </aside>

        <div class="home-grid">
          <WeekBlock
            :week-number="currentWeekNumber"
            :year="currentYear"
            :todos="currentWeekTodos"
            @add-todo="handleAddWeekTodo"
            @toggle-todo="toggleWeekTodo"
            @delete-todo="deleteWeekTodo"
            @update-todo="handleUpdateWeekTodo"
            @dragstart="handleWeekDragStart"
            @drop-todo="(id) => handleDropWeekTodo(id, 'scheduled')"
          />
          <TodayOverview
            :todos="todayTodos"
            :repeating-todos="repeatingTodos"
            :completed-count="completedCount"
            :total-count="totalCount"
            @add-todo="handleAddTodo"
            @toggle-todo="toggleTodo"
            @update-todo="handleUpdateTodo"
            @delete-todo="deleteTodo"
            @change-repeat="handleChangeRepeat"
            @dragstart="handleDragStart"
            @drop-todo="(id) => handleDropTodo(id, todayDate)"
          />
        </div>
      </div>

      <!-- 日历页：月历 -->
      <div v-else-if="currentPage === 'calendar'" class="calendar-page">
        <MonthCalendar
          :todos="todos"
          :current-month="currentMonth"
          @select-date="onSelectDate"
          @select-week="onSelectWeek"
          @add-todo="handleAddTodo"
        >
          <template #header>
            <div class="month-nav">
              <button class="nav-btn" @click="prevMonth">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span class="month-title">{{ currentMonth.getFullYear() }}年
                {{ ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][currentMonth.getMonth()] }}</span>
              <button class="nav-btn" @click="nextMonth">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              <button class="today-btn" @click="goToToday">今天</button>
            </div>
          </template>
        </MonthCalendar>
      </div>

      <ProjectPage v-else />
    </main>

    <AddTodoModal
      :show="showModal"
      :default-date="modalDate"
      :show-repeat-options="!isWeekModal"
      @close="showModal = false"
      @add="handleModalAdd"
    />

    <DayPanel
      :show="showDayPanel"
      :date="panelDate"
      :todos="panelTodos"
      @close="showDayPanel = false"
      @add-todo="handleAddTodo(panelDate); showDayPanel = false"
      @toggle-todo="toggleTodo"
      @delete-todo="deleteTodo"
    />

    <WeekPanel
      :show="showWeekPanel"
      :week-number="panelWeekNumber"
      :year="panelYear"
      :week-todos="getWeekTodos(panelWeekNumber, panelYear)"
      @close="showWeekPanel = false"
      @add-todo="handleWeekPanelAdd"
      @toggle-todo="toggleWeekTodo"
      @delete-todo="deleteWeekTodo"
      @update-todo="handleUpdateWeekTodo"
    />
  </div>
</template>

<style>
:root {
  --primary-color: #6366f1;
  --primary-hover: #4f46e5;
  --primary-light: rgba(99, 102, 241, 0.1);
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --warning-light: rgba(245, 158, 11, 0.1);

  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-hover: #f1f5f9;

  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;

  --border-color: #e2e8f0;
  --border-hover: #cbd5e1;
}

:root.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-hover: #334155;

  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  --border-color: #334155;
  --border-hover: #475569;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  height: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.header-left,
.header-center,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  gap: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--primary-color);
  background: var(--primary-light);
  border-color: var(--primary-color);
}

.tab-btn svg {
  width: 16px;
  height: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.logo svg {
  width: 22px;
  height: 22px;
  color: var(--primary-color);
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 首页 */
.home-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.side-drawer {
  position: absolute;
  top: 12px;
  bottom: 12px;
  width: min(340px, calc(100% - 72px));
  z-index: 30;
  transition: transform 0.24s ease;
}

.side-drawer-left {
  left: 12px;
  transform: translateX(calc(-100% - 16px));
}

.side-drawer-right {
  right: 12px;
  transform: translateX(calc(100% + 16px));
}

.side-drawer.open {
  transform: translateX(0);
}

.side-drawer > .task-panel {
  height: 100%;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
}

.drawer-handle {
  position: absolute;
  top: 26px;
  z-index: 35;
  width: 34px;
  min-height: 108px;
  padding: 10px 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition: left 0.24s ease, right 0.24s ease, color 0.2s ease, border-color 0.2s ease;
}

.drawer-handle:hover,
.drawer-handle.open {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.drawer-handle span {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
}

.drawer-handle-left {
  left: 0;
}

.drawer-handle-left.open {
  left: min(352px, calc(100% - 54px));
}

.drawer-handle-right {
  right: 0;
}

.drawer-handle-right.open {
  right: min(352px, calc(100% - 54px));
}

/* 日历页 */
.calendar-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  min-height: 0;
  overflow: hidden;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.nav-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-btn svg {
  width: 14px;
  height: 14px;
}

.month-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 140px;
  text-align: center;
}

.today-btn {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary-color);
  background: var(--primary-light);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 8px;
}

.today-btn:hover {
  background: var(--primary-color);
  color: white;
}

.streak-banner {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  padding: 10px 20px;
  flex-shrink: 0;
}

.streak-items {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scrollbar-width: none;
}

.streak-items::-webkit-scrollbar {
  display: none;
}

.streak-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: white;
  font-size: 14px;
  white-space: nowrap;
}

.streak-icon {
  font-size: 16px;
}

.streak-count {
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .home-grid {
    grid-template-columns: repeat(2, minmax(260px, 1fr));
  }
}

@media (max-width: 900px) {
  .home-grid {
    grid-template-columns: repeat(2, minmax(240px, 1fr));
  }
  
  .header-center {
    position: static;
    transform: none;
    order: 3;
    width: 100%;
    justify-content: center;
    margin-top: 8px;
  }
  
  .app-header {
    flex-wrap: wrap;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-hover);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>
