<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProjectStatus } from '../types'
import { useProjects } from '../composables/useProjects'

const { projects, addProject, updateProject, deleteProject, setProjectStatus } = useProjects()
const openInfoIds = ref<string[]>([])

const activeCount = computed(() => projects.value.filter(project => project.status === 'active').length)
const doneCount = computed(() => projects.value.filter(project => project.status === 'done').length)

const statusLabels: Record<ProjectStatus, string> = {
  active: '进行中',
  paused: '暂停',
  done: '完成'
}

function inputValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function statusValue(event: Event): ProjectStatus {
  return (event.target as HTMLSelectElement).value as ProjectStatus
}

function isInfoOpen(id: string): boolean {
  return openInfoIds.value.includes(id)
}

function toggleInfo(id: string) {
  openInfoIds.value = isInfoOpen(id)
    ? openInfoIds.value.filter(item => item !== id)
    : [...openInfoIds.value, id]
}
</script>

<template>
  <section class="projects-page">
    <header class="projects-toolbar">
      <div>
        <h2>项目</h2>
        <div class="project-stats">
          <span>{{ projects.length }} 个项目</span>
          <span>{{ activeCount }} 进行中</span>
          <span>{{ doneCount }} 完成</span>
        </div>
      </div>

      <button class="add-project-btn" @click="addProject">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        添加项目
      </button>
    </header>

    <div v-if="projects.length === 0" class="empty-projects">
      <button class="empty-add-btn" @click="addProject">添加第一个项目</button>
    </div>

    <div v-else class="projects-list">
      <article v-for="project in projects" :key="project.id" class="project-item">
        <div class="project-main-row">
          <input
            class="project-name-input"
            :value="project.name"
            placeholder="项目名称"
            @input="updateProject(project.id, { name: inputValue($event) })"
          >

          <select
            class="project-status"
            :class="`status-${project.status}`"
            :value="project.status"
            :aria-label="`${project.name || '项目'}状态`"
            @change="setProjectStatus(project.id, statusValue($event))"
          >
            <option value="active">{{ statusLabels.active }}</option>
            <option value="paused">{{ statusLabels.paused }}</option>
            <option value="done">{{ statusLabels.done }}</option>
          </select>

          <button class="project-icon-btn" @click="toggleInfo(project.id)" :title="isInfoOpen(project.id) ? '收起信息' : '展开信息'">
            <svg v-if="isInfoOpen(project.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <button class="project-icon-btn delete-project-btn" @click="deleteProject(project.id)" title="删除项目">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14H6L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M8 6V4h8v2"></path>
            </svg>
          </button>
        </div>

        <textarea
          class="project-progress-input"
          :value="project.progress"
          rows="2"
          placeholder="当前进度"
          @input="updateProject(project.id, { progress: inputValue($event) })"
        />

        <div v-if="isInfoOpen(project.id)" class="project-info-wrap">
          <textarea
            class="project-info-input"
            :value="project.info"
            rows="4"
            placeholder="信息、背景、链接、注意事项"
            @input="updateProject(project.id, { info: inputValue($event) })"
          />
        </div>
        <button
          v-else-if="project.info"
          class="project-info-preview"
          @click="toggleInfo(project.id)"
        >
          {{ project.info }}
        </button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.projects-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

.projects-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.projects-toolbar h2 {
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--text-primary);
}

.project-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 12px;
}

.add-project-btn,
.empty-add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 8px;
  background: var(--primary-color);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.add-project-btn {
  min-height: 36px;
  padding: 8px 14px;
  flex-shrink: 0;
}

.add-project-btn:hover,
.empty-add-btn:hover {
  background: var(--primary-hover);
}

.add-project-btn:active,
.empty-add-btn:active {
  transform: translateY(1px);
}

.add-project-btn svg {
  width: 16px;
  height: 16px;
}

.empty-projects {
  flex: 1;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
}

.empty-add-btn {
  min-height: 38px;
  padding: 9px 16px;
}

.projects-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 2px;
}

.project-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
}

.project-main-row {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) auto 32px 32px;
  gap: 8px;
  align-items: center;
}

.project-name-input,
.project-progress-input,
.project-info-input,
.project-status {
  width: 100%;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 8px;
  font: inherit;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.project-name-input {
  min-height: 34px;
  padding: 7px 10px;
  font-size: 15px;
  font-weight: 650;
}

.project-progress-input,
.project-info-input {
  resize: vertical;
  min-height: 56px;
  padding: 9px 10px;
  line-height: 1.5;
  font-size: 14px;
}

.project-info-input {
  min-height: 96px;
}

.project-name-input:focus,
.project-progress-input:focus,
.project-info-input:focus,
.project-status:focus {
  border-color: var(--primary-color);
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.project-status {
  min-width: 86px;
  min-height: 34px;
  padding: 0 28px 0 10px;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
}

.project-status.status-active {
  color: #047857;
  border-color: rgba(4, 120, 87, 0.28);
}

.project-status.status-paused {
  color: #b45309;
  border-color: rgba(180, 83, 9, 0.28);
}

.project-status.status-done {
  color: var(--text-muted);
  border-color: var(--border-color);
}

.project-icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.project-icon-btn:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
  background: var(--bg-hover);
}

.project-icon-btn svg {
  width: 16px;
  height: 16px;
}

.delete-project-btn:hover {
  color: var(--danger-color);
  border-color: var(--danger-color);
}

.project-info-wrap {
  min-height: 0;
}

.project-info-preview {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.project-info-preview:hover {
  color: var(--primary-color);
}

@media (max-width: 720px) {
  .projects-page {
    padding: 12px;
  }

  .projects-toolbar {
    align-items: flex-start;
  }

  .project-main-row {
    grid-template-columns: minmax(120px, 1fr) 86px 32px 32px;
  }
}
</style>
