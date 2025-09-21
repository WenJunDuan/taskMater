<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectStatus } from '@/data/projects'
import { projectSummaries } from '@/data/projects'

const statusConfigs: { status: ProjectStatus; label: string; tone: string }[] = [
  { status: 'active', label: '进行中', tone: 'status-pill status-pill--active' },
  { status: 'planning', label: '规划中', tone: 'status-pill status-pill--planning' },
  { status: 'on-hold', label: '暂缓', tone: 'status-pill status-pill--hold' },
]

const statusSections = computed(() =>
  statusConfigs
    .map((config) => ({
      ...config,
      projects: projectSummaries.filter((project) => project.status === config.status),
    }))
    .filter((section) => section.projects.length > 0),
)

const formatDate = (input: string) => {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return input
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date)
}

const formatProgress = (value: number) => `${value}%`
</script>

<template>
  <div class="projects-view">
    <header class="projects-header">
      <div class="projects-header__text">
        <h1>项目空间</h1>
        <p>查看团队关键项目的实时进展，随时转入待办列表处理任务。</p>
      </div>
    </header>

    <section v-for="section in statusSections" :key="section.status" class="project-section">
      <header class="project-section__header">
        <h2>{{ section.label }}</h2>
        <span class="status-count">{{ section.projects.length }}</span>
      </header>

      <div class="project-grid">
        <article v-for="project in section.projects" :key="project.id" class="project-card">
          <div class="project-card__head">
            <div>
              <h3>{{ project.name }}</h3>
              <p>{{ project.description }}</p>
            </div>
            <span :class="section.tone">{{ section.label }}</span>
          </div>

          <dl class="project-card__meta">
            <div>
              <dt>负责人</dt>
              <dd>{{ project.owner }}</dd>
            </div>
            <div>
              <dt>截止</dt>
              <dd>{{ formatDate(project.dueDate) }}</dd>
            </div>
            <div>
              <dt>冲刺数</dt>
              <dd>{{ project.sprintCount }}</dd>
            </div>
            <div>
              <dt>待办</dt>
              <dd>{{ project.backlogCount }}</dd>
            </div>
          </dl>

          <div class="project-card__progress">
            <div class="project-card__progress-label">
              <span>整体进度</span>
              <strong>{{ formatProgress(project.progress) }}</strong>
            </div>
            <div class="progress-bar">
              <span class="progress-bar__value" :style="{ width: formatProgress(project.progress) }" />
            </div>
          </div>

          <ul class="project-card__tags">
            <li v-for="tag in project.tags" :key="tag">{{ tag }}</li>
          </ul>
          <footer class="project-card__footer">
            <RouterLink
              :to="{ name: 'todos', query: { projectId: project.id } }"
              class="project-card__link"
            >
              查看待办
            </RouterLink>
          </footer>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.projects-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2rem;
}

.projects-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.projects-header__text h1 {
  font-size: 1.9rem;
  font-weight: 700;
  color: #0f172a;
}

.projects-header__text p {
  color: #64748b;
  font-size: 0.95rem;
}

.project-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.project-section__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.project-section__header h2 {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0f172a;
}

.status-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6rem;
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.2);
  color: #475569;
  font-size: 0.72rem;
  font-weight: 600;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.project-card {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow: 0 12px 40px -24px rgba(15, 23, 42, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.project-card__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.project-card__head h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0f172a;
}

.project-card__head p {
  margin-top: 0.4rem;
  color: #64748b;
  font-size: 0.85rem;
}

.project-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  font-size: 0.82rem;
  color: #475569;
}

.project-card__meta dt {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 0.2rem;
}

.project-card__meta dd {
  margin: 0;
  font-weight: 600;
}

.project-card__progress {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.project-card__progress-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #475569;
}

.project-card__progress-label strong {
  font-size: 0.92rem;
  color: #1d4ed8;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.2);
  overflow: hidden;
}

.progress-bar__value {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb 0%, #60a5fa 100%);
  transition: width 0.3s ease;
}

.project-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.project-card__tags li {
  padding: 0.18rem 0.6rem;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.18);
  color: #475569;
  font-size: 0.75rem;
}

.project-card__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.project-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border-radius: 0.75rem;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.2s ease;
}

.project-card__link:hover {
  background: rgba(37, 99, 235, 0.18);
  transform: translateY(-1px);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.status-pill--active {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}

.status-pill--planning {
  background: rgba(37, 99, 235, 0.15);
  color: #1d4ed8;
}

.status-pill--hold {
  background: rgba(148, 163, 184, 0.18);
  color: #475569;
}

@media (max-width: 768px) {
  .project-card {
    padding: 1.1rem;
  }

  .project-card__head {
    flex-direction: column;
  }
}
</style>
