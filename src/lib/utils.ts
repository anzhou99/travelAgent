import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化时间戳
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 计算执行时长
export function getExecutionDuration(startTime: number, endTime?: number): string {
  if (!endTime) return '执行中...'
  
  const duration = endTime - startTime
  if (duration < 1000) return `${duration}ms`
  if (duration < 60000) return `${Math.round(duration / 1000)}秒`
  return `${Math.round(duration / 60000)}分钟`
}

// 获取Agent状态颜色
export function getAgentStatusColor(status: 'running' | 'completed' | 'error'): string {
  switch (status) {
    case 'running':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'error':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// 获取Agent图标
export function getAgentIcon(agentName: string): string {
  switch (agentName) {
    case 'AnalyzerAgent':
      return '🔍'
    case 'PlannerAgent':
      return '📅'
    case 'WeatherAgent':
      return '🌤️'
    case 'FormatterAgent':
      return '📋'
    default:
      return '🤖'
  }
}

// 获取Agent中文名称
export function getAgentDisplayName(agentName: string): string {
  switch (agentName) {
    case 'AnalyzerAgent':
      return '需求分析'
    case 'PlannerAgent':
      return '行程规划'
    case 'WeatherAgent':
      return '天气信息'
    case 'FormatterAgent':
      return '格式整合'
    default:
      return agentName
  }
}

// 解析Markdown文本中的特殊格式
export function parseMarkdownText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// 生成唯一ID
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 格式化日期
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
} 