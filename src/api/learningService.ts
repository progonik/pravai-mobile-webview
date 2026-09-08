import { useQuery } from '@tanstack/react-query'
import request from './request'
import type { WeakTopic } from './examService'

export interface LearningResult {
  id: string
  title: string
  mode: string
  correct_count: number
  mistake_count: number
  passed: boolean | null
  finished_at: string
}
export interface LearningMistake {
  id: string
  question: string
  topic: string
  selected_answer: string
  correct_answer: string
  explanation: string
}
export interface LearningInsights {
  stats: { completed_count: number; correct_count: number; mistake_count: number; exams_passed: number; exams_failed: number }
  recent_results: LearningResult[]
  recent_mistakes: LearningMistake[]
  weak_topics: WeakTopic[]
}
export async function getLearningInsights(): Promise<LearningInsights> {
  return request.get('/api/v1/exam/learning-insights')
}
export function useLearningInsights() {
  return useQuery({ queryKey: ['exam', 'learning-insights'], queryFn: getLearningInsights })
}
export function learningAccuracy(stats: LearningInsights['stats']) {
  const total = stats.correct_count + stats.mistake_count
  return total ? Math.round(stats.correct_count / total * 100) : 0
}
