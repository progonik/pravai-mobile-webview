import request from './request'
import type { DesignIconName } from '../components/DesignIcon'
export interface Award { id: string; title: string; description: string; icon: DesignIconName; earned: boolean; progress: number; threshold: number }
export interface AppNotification { id: string; title: string; body: string; action_path: string; read_at: string | null; created_at: string }
export interface NotificationInbox { items: AppNotification[]; unread_count: number; total: number; page: number }
export async function getAwards(): Promise<Award[]> { return request.get('/api/v1/awards') }
export async function getNotifications(page = 1): Promise<NotificationInbox> { return request.get(`/api/v1/notifications?page=${page}`) }
export async function readNotification(id: string): Promise<void> { return request.post(`/api/v1/notifications/${id}/read`) }
