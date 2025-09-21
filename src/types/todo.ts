export type TodoStatus = 'planned' | 'in-progress' | 'done'

export interface TodoItem {
  id: string
  title: string
  description?: string
  status: TodoStatus
  projectId: string
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
  tags?: string[]
}
