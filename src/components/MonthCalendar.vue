<script setup lang="ts">
import { computed } from 'vue'
import type { Todo } from '../types'
import { formatDate } from '../utils/date'

interface Props {
  todos: Todo[]
  currentMonth: Date
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectDate: [date: string]
  selectWeek: [weekStart: string, weekNumber: number]
  addTodo: [date: string]
}>()

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const calendarDays = computed(() => {
  const year = props.currentMonth.getFullYear()
  const month = props.currentMonth.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let firstDayOfWeek = firstDay.getDay()
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const days: Array<{
    date: string
    dayOfMonth: number
    isCurrentMonth: boolean
    isToday: boolean
    todos: Todo[]
  }> = []

  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const date = formatDate(new Date(year, month - 1, day))
    days.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: false,
      todos: props.todos.filter(t => t.date === date)
    })
  }

  const today = formatDate(new Date())
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = formatDate(new Date(year, month, day))
    days.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: true,
      isToday: date === today,
      todos: props.todos.filter(t => t.date === date)
    })
  }

  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    const date = formatDate(new Date(year, month + 1, day))
    days.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: false,
      todos: props.todos.filter(t => t.date === date)
    })
  }

  return days
})

const weeks = computed(() => {
  const days = calendarDays.value
  const weeks: Array<{
    startDate: string
    weekNumber: number
    days: typeof days
    todos: Todo[]
  }> = []

  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7)
    const weekTodos: Todo[] = []
    weekDays.forEach(d => weekTodos.push(...d.todos))

    const startDate = new Date(weekDays[0].date + 'T00:00:00')
    const weekNumber = getWeekNumber(startDate)

    weeks.push({
      startDate: weekDays[0].date,
      weekNumber,
      days: weekDays,
      todos: weekTodos
    })
  }

  return weeks
})

function onDayClick(date: string) {
  emit('selectDate', date)
}

function onWeekClick(weekStart: string, weekNumber: number) {
  emit('selectWeek', weekStart, weekNumber)
}

function onAddClick(date: string, e: Event) {
  e.stopPropagation()
  emit('addTodo', date)
}
</script>

<template>
  <div class="month-calendar">
    <div class="calendar-header">
      <slot name="header"></slot>
    </div>

    <div class="weekday-headers">
      <div class="weekday-spacer">周</div>
      <div class="weekday-header" v-for="day in weekDays" :key="day">
        {{ day }}
      </div>
    </div>

    <div class="calendar-weeks">
      <div v-for="(week, weekIndex) in weeks" :key="weekIndex" class="calendar-week">
        <!-- 周单元格 -->
        <div class="week-cell" @click="onWeekClick(week.startDate, week.weekNumber)">
          <div class="week-cell-number">{{ week.weekNumber }}</div>
          <div class="week-cell-count" v-if="week.todos.filter(t => !t.completed).length > 0">
            {{ week.todos.filter(t => !t.completed).length }}
          </div>
        </div>

        <!-- 日期块 -->
        <div
          v-for="day in week.days"
          :key="day.date"
          :class="['calendar-day', {
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'has-todos': day.todos.length > 0
          }]"
          @click="onDayClick(day.date)"
        >
          <div class="day-number">{{ day.dayOfMonth }}</div>
          <div class="day-todos">
            <div
              v-for="todo in day.todos.slice(0, 3)"
              :key="todo.id"
              :class="['day-todo-item', { completed: todo.completed }]"
            >
              {{ todo.text }}
            </div>
            <div v-if="day.todos.length > 3" class="more-todos">
              +{{ day.todos.length - 3 }}
            </div>
          </div>
          <button class="day-add-btn" @click="onAddClick(day.date, $event)">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.month-calendar {
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.calendar-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.weekday-headers {
  display: grid;
  grid-template-columns: 64px repeat(7, minmax(0, 1fr));
  gap: 8px;
  padding: 0 8px;
  flex-shrink: 0;
}

.weekday-header,
.weekday-spacer {
  padding: 8px 4px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.calendar-weeks {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-rows: repeat(6, minmax(0, 1fr));
  gap: 6px;
  padding: 0 8px 8px;
}

.calendar-week {
  display: grid;
  grid-template-columns: 64px repeat(7, minmax(0, 1fr));
  gap: 8px;
  min-height: 0;
}

/* 周单元格 - 和日格子一样大 */
.week-cell {
  background: var(--bg-secondary);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  min-height: 0;
  overflow: hidden;
}

.week-cell:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color);
}

.week-cell-number {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.week-cell-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 日期块 */
.calendar-day {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  border: 1px solid transparent;
  min-height: 0;
  overflow: hidden;
}

.calendar-day:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.calendar-day.other-month {
  opacity: 0.5;
}

.calendar-day.other-month .day-number {
  color: var(--text-muted);
}

.calendar-day.today {
  background: var(--primary-light);
  border-color: var(--primary-color);
}

.calendar-day.today .day-number {
  color: var(--primary-color);
  font-weight: 700;
}

.day-number {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.day-todos {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.day-todo-item {
  font-size: 11px;
  padding: 2px 5px;
  background: var(--bg-secondary);
  border-radius: 3px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-todo-item.completed {
  text-decoration: line-through;
  opacity: 0.5;
}

.more-todos {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.day-add-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: var(--primary-color);
  color: white;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-day:hover .day-add-btn {
  opacity: 1;
}

.day-add-btn:hover {
  background: var(--primary-hover);
}
</style>
