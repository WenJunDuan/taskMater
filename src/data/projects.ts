export type ProjectStatus = "active" | "planning" | "on-hold"

export interface ProjectSummary {
  id: string
  name: string
  status: ProjectStatus
  description: string
  owner: string
  dueDate: string
  progress: number
  sprintCount: number
  backlogCount: number
  tags: string[]
  lastUpdate: string
}

export const projectSummaries: ProjectSummary[] = [
  {
    id: "proj-001",
    name: "任务大师重构",
    status: "active",
    description: "重构仪表盘与核心任务流，提升可视化体验。",
    owner: "王敏",
    dueDate: "2025-10-06",
    progress: 72,
    sprintCount: 3,
    backlogCount: 18,
    tags: ["高优先", "体验"],
    lastUpdate: "2025-09-16",
  },
  {
    id: "proj-002",
    name: "AI 协作跟踪",
    status: "active",
    description: "构建 AI 协作任务的持续追踪与质量看板。",
    owner: "李晨",
    dueDate: "2025-10-20",
    progress: 58,
    sprintCount: 4,
    backlogCount: 25,
    tags: ["AI", "自动化"],
    lastUpdate: "2025-09-18",
  },
  {
    id: "proj-003",
    name: "用户调研计划",
    status: "planning",
    description: "梳理用户访谈与问卷，验证需求假设。",
    owner: "赵越",
    dueDate: "2025-11-02",
    progress: 36,
    sprintCount: 2,
    backlogCount: 12,
    tags: ["研究", "洞察"],
    lastUpdate: "2025-09-15",
  },
  {
    id: "proj-004",
    name: "增长实验计划",
    status: "planning",
    description: "搭建 A/B 流水线，验证新手引导的增长实验。",
    owner: "陈曦",
    dueDate: "2025-10-28",
    progress: 24,
    sprintCount: 1,
    backlogCount: 15,
    tags: ["增长", "实验"],
    lastUpdate: "2025-09-12",
  },
  {
    id: "proj-005",
    name: "移动端适配",
    status: "active",
    description: "适配移动端仪表盘布局，保证核心场景可用。",
    owner: "周倩",
    dueDate: "2025-10-15",
    progress: 43,
    sprintCount: 3,
    backlogCount: 20,
    tags: ["移动端", "优化"],
    lastUpdate: "2025-09-17",
  },
  {
    id: "proj-006",
    name: "数据可观测平台",
    status: "on-hold",
    description: "整合日志与埋点，搭建统一可观测平台。",
    owner: "杜航",
    dueDate: "2025-12-05",
    progress: 18,
    sprintCount: 1,
    backlogCount: 28,
    tags: ["平台", "数据"],
    lastUpdate: "2025-09-10",
  },
  {
    id: "proj-007",
    name: "知识库体系化",
    status: "planning",
    description: "重组内部知识库结构与检索体验。",
    owner: "何婷",
    dueDate: "2025-11-12",
    progress: 12,
    sprintCount: 0,
    backlogCount: 33,
    tags: ["知识", "结构化"],
    lastUpdate: "2025-09-08",
  },
]
