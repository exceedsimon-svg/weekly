import type { Project, Todo } from '../types'

const API_URL = '/todo-api'

export interface StorageData {
  todos: Todo[]
  version: number
}

export async function loadTodos(): Promise<Todo[]> {
  try {
    const res = await fetch(`${API_URL}/todos`)
    return await res.json()
  } catch {
    return []
  }
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  try {
    await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todos)
    })
  } catch {
    console.error('Failed to save todos')
  }
}

export async function loadGoal(): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/goal`)
    const data = await res.json()
    return data.goal || ''
  } catch {
    return ''
  }
}

export async function saveGoal(goal: string): Promise<void> {
  try {
    await fetch(`${API_URL}/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal })
    })
  } catch {
    console.error('Failed to save goal')
  }
}

// 周计划独立存储
export async function loadWeekTodos(): Promise<Todo[]> {
  try {
    const res = await fetch(`${API_URL}/week-todos`)
    return await res.json()
  } catch {
    return []
  }
}

export async function saveWeekTodos(todos: Todo[]): Promise<void> {
  try {
    await fetch(`${API_URL}/week-todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todos)
    })
  } catch {
    console.error('Failed to save week todos')
  }
}

// 项目页独立存储
export async function loadProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_URL}/projects`)
    return await res.json()
  } catch {
    return []
  }
}

export async function saveProjects(projects: Project[]): Promise<void> {
  try {
    await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projects)
    })
  } catch {
    console.error('Failed to save projects')
  }
}
