import { ref, computed, watch, onMounted } from 'vue'
import type { Todo, RepeatType } from '../types'
import { formatDate, parseDate, getWeekDays, isSameDay, getDayOfWeek, addDays } from '../utils/date'
import { loadTodos, saveTodos, loadWeekTodos, saveWeekTodos } from '../utils/storage'

export function useTodos() {
  const todos = ref<Todo[]>([])
  const weekTodos = ref<Todo[]>([])
  const currentDate = ref(new Date())
  const isLoaded = ref(false)
  const isWeekLoaded = ref(false)

  // 异步加载日计划数据
  onMounted(async () => {
    todos.value = await loadTodos()
    weekTodos.value = await loadWeekTodos()
    isLoaded.value = true
    isWeekLoaded.value = true
    cleanupOldRepeatInstances()
    processRepeatingTasks()
    const currentWeek = getWeekInfo(new Date())
    ensureWeekCarryover(currentWeek.weekNumber, currentWeek.year)
  })

  // 清理旧的重复任务实例（没有parentId的）
  function cleanupOldRepeatInstances() {
    const repeatTexts = new Set(
      todos.value.filter(t => t.repeat === 'daily' || t.repeat === 'weekly').map(t => t.text)
    )
    
    const toDelete: string[] = []
    
    todos.value.forEach(t => {
      if (t.repeat === 'none' && !t.parentId && repeatTexts.has(t.text)) {
        toDelete.push(t.id)
      }
    })
    
    if (toDelete.length > 0) {
      todos.value = todos.value.filter(t => !toDelete.includes(t.id))
    }
  }

  // 自动处理重复任务
  function processRepeatingTasks() {
    const today = formatDate(new Date())
    const newTodos: Todo[] = []

    // 处理每日重复任务
    todos.value
      .filter(t => t.repeat === 'daily')
      .forEach(t => {
        const existingToday = todos.value.find(
          todo => todo.parentId === t.id && todo.date === today
        )
        if (!existingToday) {
          newTodos.push({
            id: generateId(),
            text: t.text,
            completed: false,
            date: today,
            repeat: 'none',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            parentId: t.id
          })
        }
      })

    // 处理每周重复任务
    const todayDate = new Date()
    const todayDayOfWeek = getDayOfWeek(todayDate)

    todos.value
      .filter(t => t.repeat === 'weekly')
      .forEach(t => {
        const taskDate = parseDate(t.date)
        const taskDayOfWeek = getDayOfWeek(taskDate)

        if (taskDayOfWeek === todayDayOfWeek) {
          const existingToday = todos.value.find(
            todo => todo.parentId === t.id && todo.date === today
          )
          if (!existingToday) {
            newTodos.push({
              id: generateId(),
              text: t.text,
              completed: false,
              date: today,
              repeat: 'none',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              parentId: t.id
            })
          }
        }
      })

    if (newTodos.length > 0) {
      todos.value.push(...newTodos)
    }
  }

  // 监听变化自动保存
  watch(todos, () => {
    if (isLoaded.value) {
      saveTodos(todos.value)
    }
  }, { deep: true })

  watch(weekTodos, () => {
    if (isWeekLoaded.value) {
      saveWeekTodos(weekTodos.value)
    }
  }, { deep: true })

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  function getWeekInfo(date: Date): { weekNumber: number; year: number } {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return { weekNumber, year: d.getUTCFullYear() }
  }

  function getMondayOfWeek(weekNum: number, year: number): Date {
    const simple = new Date(Date.UTC(year, 0, 1 + (weekNum - 1) * 7))
    const dayOfWeek = simple.getUTCDay() || 7
    if (dayOfWeek <= 4) {
      simple.setUTCDate(simple.getUTCDate() - dayOfWeek + 1)
    } else {
      simple.setUTCDate(simple.getUTCDate() + 8 - dayOfWeek)
    }
    return new Date(simple.getUTCFullYear(), simple.getUTCMonth(), simple.getUTCDate())
  }

  function getPreviousWeekInfo(weekNum: number, year: number): { weekNumber: number; year: number } {
    const monday = getMondayOfWeek(weekNum, year)
    monday.setDate(monday.getDate() - 7)
    return getWeekInfo(monday)
  }

  function parseVirtualId(id: string): { templateId: string; date: string } | null {
    const marker = '-virtual-'
    const markerIndex = id.lastIndexOf(marker)
    if (markerIndex === -1) return null

    const templateId = id.slice(0, markerIndex)
    const date = id.slice(markerIndex + marker.length)
    return templateId && /^\d{4}-\d{2}-\d{2}$/.test(date) ? { templateId, date } : null
  }

  function createRepeatInstance(template: Todo, date: string, updates: Partial<Todo> = {}): Todo {
    const now = Date.now()
    const todo: Todo = {
      id: generateId(),
      text: template.text,
      completed: false,
      date,
      repeat: 'none',
      createdAt: now,
      updatedAt: now,
      parentId: template.id,
      ...updates
    }
    todos.value.push(todo)
    return todo
  }

  function getRepeatInstance(templateId: string, date: string): Todo | undefined {
    const instances = todos.value.filter(todo => todo.parentId === templateId && todo.date === date)
    const visibleInstances = instances.filter(todo => !todo.skipped)
    return visibleInstances[visibleInstances.length - 1] ?? instances[instances.length - 1]
  }

  // 日计划操作
  function addTodo(text: string, date: string, repeat: RepeatType = 'none'): Todo {
    const todo: Todo = {
      id: generateId(),
      text,
      completed: false,
      date,
      repeat,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    todos.value.push(todo)
    return todo
  }

  function updateTodo(id: string, updates: Partial<Todo>) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      Object.assign(todo, { ...updates, updatedAt: Date.now() })
    }
  }

  function deleteTodo(id: string) {
    const virtual = parseVirtualId(id)
    if (virtual) {
      const template = todos.value.find(t => t.id === virtual.templateId && t.repeat !== 'none')
      if (!template) return

      const existing = todos.value.find(t => t.parentId === template.id && t.date === virtual.date)
      if (existing) {
        Object.assign(existing, { completed: false, skipped: true, updatedAt: Date.now() })
      } else {
        createRepeatInstance(template, virtual.date, { skipped: true })
      }
      return
    }

    const todo = todos.value.find(t => t.id === id)
    if (todo?.parentId) {
      Object.assign(todo, { completed: false, skipped: true, updatedAt: Date.now() })
      return
    }

    const index = todos.value.findIndex(t => t.id === id)
    if (index > -1) {
      todos.value.splice(index, 1)
    }
  }

  function toggleTodo(id: string) {
    const virtual = parseVirtualId(id)
    if (virtual) {
      const template = todos.value.find(t => t.id === virtual.templateId && t.repeat !== 'none')
      if (!template) return

      const existing = todos.value.find(t => t.parentId === template.id && t.date === virtual.date)
      if (existing) {
        Object.assign(existing, {
          completed: !existing.completed,
          skipped: false,
          updatedAt: Date.now()
        })
      } else {
        createRepeatInstance(template, virtual.date, { completed: true })
      }
      return
    }

    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
      todo.skipped = false
      todo.updatedAt = Date.now()
    }
  }

  function moveTodo(id: string, newDate: string) {
    const virtual = parseVirtualId(id)
    if (virtual) {
      const template = todos.value.find(t => t.id === virtual.templateId && t.repeat !== 'none')
      if (!template) return

      const targetInstance = newDate ? getRepeatInstance(template.id, newDate) : undefined
      if (targetInstance) {
        Object.assign(targetInstance, { skipped: false, updatedAt: Date.now() })
      } else {
        createRepeatInstance(template, newDate, {
          parentId: newDate ? template.id : undefined,
          skipped: false
        })
      }
      return
    }

    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.date = newDate
      todo.skipped = false
      todo.updatedAt = Date.now()
    }
  }

  // 计算当前周号
  function getCurrentWeekNumber(): number {
    return getWeekInfo(new Date()).weekNumber
  }

  // 周计划操作（独立，按周分开）
  function addWeekTodo(text: string, weekNum?: number, yr?: number): Todo {
    const todo: Todo = {
      id: generateId(),
      text,
      completed: false,
      date: formatDate(new Date()),
      repeat: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      weekNumber: weekNum ?? getCurrentWeekNumber(),
      year: yr ?? getWeekInfo(new Date()).year
    }
    weekTodos.value.push(todo)
    return todo
  }

  function addUnscheduledWeekTodo(text: string): Todo {
    const todo: Todo = {
      id: generateId(),
      text,
      completed: false,
      date: '',
      repeat: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    weekTodos.value.push(todo)
    return todo
  }

  function ensureWeekCarryover(weekNum: number, yr: number) {
    if (!weekNum || !yr) return

    const previousWeek = getPreviousWeekInfo(weekNum, yr)
    const unfinishedPreviousTodos = weekTodos.value.filter(t =>
      t.weekNumber === previousWeek.weekNumber &&
      t.year === previousWeek.year &&
      !t.completed
    )

    if (unfinishedPreviousTodos.length === 0) return

    const now = Date.now()
    const nextMonday = getMondayOfWeek(weekNum, yr)
    const inheritedTodos = unfinishedPreviousTodos
      .filter(todo => {
        return !weekTodos.value.some(existing =>
          existing.weekNumber === weekNum &&
          existing.year === yr &&
          (existing.carriedFromId === todo.id || (!existing.carriedFromId && existing.text === todo.text))
        )
      })
      .map(todo => ({
        id: generateId(),
        text: todo.text,
        completed: false,
        date: formatDate(nextMonday),
        repeat: 'none' as const,
        createdAt: now,
        updatedAt: now,
        weekNumber: weekNum,
        year: yr,
        carriedFromId: todo.id
      }))

    if (inheritedTodos.length > 0) {
      weekTodos.value.push(...inheritedTodos)
    }
  }

  // 获取指定周的周任务
  function getWeekTodos(weekNum: number, yr: number): Todo[] {
    if (!weekNum || !yr) return []

    ensureWeekCarryover(weekNum, yr)
    return weekTodos.value.filter(t => t.weekNumber === weekNum && t.year === yr)
  }

  function updateWeekTodo(id: string, updates: Partial<Todo>) {
    const todo = weekTodos.value.find(t => t.id === id)
    if (todo) {
      Object.assign(todo, { ...updates, updatedAt: Date.now() })
    }
  }

  function deleteWeekTodo(id: string) {
    const index = weekTodos.value.findIndex(t => t.id === id)
    if (index > -1) {
      weekTodos.value.splice(index, 1)
    }
  }

  function toggleWeekTodo(id: string) {
    const todo = weekTodos.value.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
      todo.updatedAt = Date.now()
    }
  }

  function moveWeekTodoToWeek(id: string, weekNum: number, yr: number) {
    const todo = weekTodos.value.find(t => t.id === id)
    if (todo) {
      Object.assign(todo, {
        date: todo.date || formatDate(new Date()),
        weekNumber: weekNum,
        year: yr,
        updatedAt: Date.now()
      })
    }
  }

  function moveWeekTodoToUnscheduled(id: string) {
    const todo = weekTodos.value.find(t => t.id === id)
    if (todo) {
      Object.assign(todo, {
        date: '',
        weekNumber: undefined,
        year: undefined,
        updatedAt: Date.now()
      })
    }
  }

  const weekDays = computed(() => {
    const days = getWeekDays(currentDate.value)
    const today = new Date()

    return days.map(date => {
      const dateStr = formatDate(date)
      return {
        date: dateStr,
        dayOfMonth: date.getDate(),
        isToday: isSameDay(date, today),
        dayName: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][date.getDay() === 0 ? 6 : date.getDay() - 1],
        todos: todos.value.filter(t => t.date === dateStr)
      }
    })
  })

  const todayTodos = computed(() => {
    const today = formatDate(new Date())
    return todos.value.filter(t => t.date === today && t.repeat === 'none' && !t.skipped)
  })

  const tomorrowTodos = computed(() => {
    const tomorrow = formatDate(addDays(new Date(), 1))
    return getTodosForDate(tomorrow)
  })

  const unscheduledTodos = computed(() => {
    return todos.value.filter(t => !t.date && t.repeat === 'none' && !t.parentId && !t.skipped)
  })

  const unscheduledWeekTodos = computed(() => {
    return weekTodos.value.filter(t => t.weekNumber == null || t.year == null)
  })

  const repeatingTodos = computed(() => {
    return todos.value.filter(t => t.repeat !== 'none')
  })

  // 计算每个重复任务的累计完成天数
  const streakStats = computed(() => {
    const stats: Array<{ text: string; streak: number; repeat: RepeatType }> = []

    todos.value.filter(t => t.repeat !== 'none').forEach(template => {
      const completedDates = new Set(
        todos.value
          .filter(t => t.parentId === template.id && t.completed && !t.skipped)
          .map(t => t.date)
      )

      stats.push({
        text: template.text,
        streak: completedDates.size,
        repeat: template.repeat
      })
    })

    return stats
  })

  const completedCount = computed(() => {
    return todayTodos.value.filter(t => t.completed).length
  })

  const totalCount = computed(() => {
    return todayTodos.value.length
  })

  // 获取某一天的待办（包含重复任务的虚拟实例）
  function getTodosForDate(dateStr: string): Todo[] {
    const result: Todo[] = []
    const date = parseDate(dateStr)

    todos.value.forEach(t => {
      // 非重复任务：直接匹配日期
      if (t.repeat === 'none') {
        if (t.date === dateStr && !t.parentId && !t.skipped) {
          result.push(t)
        }
        return
      }

      // 重复任务：检查该日期是否应该显示
      const taskDate = parseDate(t.date)

      if (t.repeat === 'daily') {
        // 每天重复：从创建日期开始每天都显示
        if (date.getTime() >= taskDate.getTime()) {
          const instance = getRepeatInstance(t.id, dateStr)
          if (instance?.skipped) return
          result.push(instance || {
            ...t,
            id: `${t.id}-virtual-${dateStr}`,
            date: dateStr,
            completed: false,
            isVirtual: true
          })
        }
      } else if (t.repeat === 'weekly') {
        // 每周重复：同一星期几显示
        const taskDayOfWeek = getDayOfWeek(taskDate)
        const dateDayOfWeek = getDayOfWeek(date)
        if (taskDayOfWeek === dateDayOfWeek && date.getTime() >= taskDate.getTime()) {
          const instance = getRepeatInstance(t.id, dateStr)
          if (instance?.skipped) return
          result.push(instance || {
            ...t,
            id: `${t.id}-virtual-${dateStr}`,
            date: dateStr,
            completed: false,
            isVirtual: true
          })
        }
      }
    })

    return result
  }

  return {
    todos,
    weekTodos,
    currentDate,
    weekDays,
    todayTodos,
    tomorrowTodos,
    unscheduledTodos,
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
    ensureWeekCarryover,
    addWeekTodo,
    addUnscheduledWeekTodo,
    updateWeekTodo,
    deleteWeekTodo,
    toggleWeekTodo,
    moveWeekTodoToWeek,
    moveWeekTodoToUnscheduled,
    processRepeatingTasks
  }
}
