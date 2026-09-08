import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getNotifications, readNotification, type AppNotification } from '../api/engagementService'
import { PageHeader } from '../components/PageHeader'
import { DesignIcon } from '../components/DesignIcon'
import { useLocale, useT } from '../context/LocaleContext'

export function NotificationsPage() {
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const t = useT()
  const { lang } = useLocale()
  const navigate = useNavigate()
  const client = useQueryClient()
  const inbox = useQuery({ queryKey: ['notifications', page], queryFn: () => getNotifications(page) })
  async function open(item: AppNotification) {
    setBusy(item.id); setError(false)
    try {
      await readNotification(item.id)
      await client.invalidateQueries({ queryKey: ['notifications'] })
      navigate(['/home','/tests','/profile','/chat'].includes(item.action_path) ? item.action_path : '/home')
    } catch { setError(true) } finally { setBusy(null) }
  }
  return <div className="flex h-full flex-col bg-background">
    <PageHeader title={t('home.notifications')} />
    <div className="learning-page flex-1 overflow-y-auto" style={{ paddingTop: 'calc(var(--safe-top) + 54px)' }}><div className="learning-content">
      {(inbox.isError || error) && <div className="learning-notice" role="alert"><p>{t('home.loadError')}</p><button onClick={() => void inbox.refetch()}>{t('home.retry')}</button></div>}
      {inbox.isPending && <p>{t('home.loading')}</p>}
      {inbox.data?.items.length === 0 && <div className="learning-empty"><DesignIcon name="bell" size={58} className="mx-auto mb-4" /><p>{t('home.noNotifications')}</p></div>}
      <div className="flex flex-col gap-3">{inbox.data?.items.map(item => <button key={item.id} disabled={busy!==null} onClick={() => void open(item)} className="design-card p-5 text-left" style={{borderColor: item.read_at ? undefined : 'var(--primary)'}}>
        <div className="flex items-start gap-3"><DesignIcon name="bell" size={27} /><div className="min-w-0 flex-1"><h2 className="break-words">{item.title}</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.body}</p><small className="mt-3 block text-muted-foreground">{new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeStyle:'short'}).format(new Date(item.created_at))}</small></div></div>
      </button>)}</div>
      {(inbox.data?.total ?? 0)>30 && <div className="mt-5 flex justify-between"><button disabled={page===1} onClick={()=>setPage(page-1)} aria-label="Previous page">←</button><span>{page}</span><button disabled={page*30>=(inbox.data?.total??0)} onClick={()=>setPage(page+1)} aria-label="Next page">→</button></div>}
    </div></div>
  </div>
}
