import { ref, watch, onMounted } from 'vue'
import type { Project, ProjectStatus } from '../types'
import { loadProjects, saveProjects } from '../utils/storage'

export function useProjects() {
  const projects = ref<Project[]>([])
  const isLoaded = ref(false)

  onMounted(async () => {
    projects.value = await loadProjects()
    isLoaded.value = true
  })

  watch(projects, () => {
    if (isLoaded.value) {
      saveProjects(projects.value)
    }
  }, { deep: true })

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  function addProject() {
    const now = Date.now()
    projects.value.unshift({
      id: generateId(),
      name: '新项目',
      progress: '',
      info: '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    })
  }

  function updateProject(id: string, updates: Partial<Project>) {
    const project = projects.value.find(item => item.id === id)
    if (project) {
      Object.assign(project, { ...updates, updatedAt: Date.now() })
    }
  }

  function deleteProject(id: string) {
    const index = projects.value.findIndex(item => item.id === id)
    if (index > -1) {
      projects.value.splice(index, 1)
    }
  }

  function setProjectStatus(id: string, status: ProjectStatus) {
    updateProject(id, { status })
  }

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
    setProjectStatus
  }
}
