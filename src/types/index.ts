export type RepeatType = 'none' | 'daily' | 'weekly'

export interface Todo {
  id: string
  text: string
  completed: boolean
  date: string // YYYY-MM-DD；空字符串表示未排进日程
  repeat: RepeatType
  createdAt: number
  updatedAt: number
  isVirtual?: boolean // 是否为重复任务生成的虚拟实例
  skipped?: boolean // 是否删除/跳过某一天的重复任务实例
  weekNumber?: number // 周任务所属周号
  year?: number // 周任务所属年份
  parentId?: string // 重复任务实例指向原始任务的ID
  carriedFromId?: string // 周任务从上一周继承时记录来源任务ID
}

export type ViewMode = 'week' | 'day'

export type ProjectStatus = 'active' | 'paused' | 'done'

export interface Project {
  id: string
  name: string
  progress: string
  info: string
  status: ProjectStatus
  createdAt: number
  updatedAt: number
}

export interface DayInfo {
  date: string // YYYY-MM-DD
  dayOfMonth: number
  isToday: boolean
  dayName: string
  todos: Todo[]
}
