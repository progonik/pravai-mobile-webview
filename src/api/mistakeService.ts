import { useQuery } from '@tanstack/react-query'
import request from './request'
import type { StartAttemptResult, SubmitAnswerResult } from './examService'

export interface MistakeTopic { topic_id: string; topic_name: string; remaining_count: number; available_count: number; review_id: string | null }
export function listMistakeTopics(): Promise<MistakeTopic[]> { return request.get('/api/v1/exam/mistakes') }
export function useMistakeTopics(enabled = true) { return useQuery({ queryKey: ['exam', 'mistakes'], queryFn: listMistakeTopics, enabled }) }
export function startMistakeReview(topicId: string): Promise<StartAttemptResult> { return request.post(`/api/v1/exam/mistakes/topics/${topicId}/start`) }
export function submitMistakeReview(id: string, questionId: string, optionId: string | null): Promise<SubmitAnswerResult> { return request.post(`/api/v1/exam/mistakes/reviews/${id}/answer`, { question_id: questionId, option_id: optionId }) }
