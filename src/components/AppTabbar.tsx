import { useLocation, useNavigate } from 'react-router-dom'
import { DesignIcon } from './DesignIcon'
import { useT } from '../context/LocaleContext'

const tabs = [
  { path: '/home', label: 'tab.home', icon: 'home' },
  { path: '/tests', label: 'tab.tests', icon: 'checklist' },
  { path: '/profile', label: 'tab.profile', icon: 'profile' },
] as const

export function AppTabbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const t = useT()
  const chatActive = pathname === '/chat' || pathname.startsWith('/chat/')
  return <nav className="design-tabbar" aria-label={t('home.navigation')}>
    <div className="design-tabbar-pill">
    {tabs.map(tab => {
      const exact = pathname === tab.path || (pathname === '/' && tab.path === '/home')
      const active = exact || pathname.startsWith(tab.path + '/')
      return <button key={tab.path} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} aria-label={t(tab.label)} onClick={() => exact ? document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' }) : navigate(tab.path, { replace: true })}>
        <DesignIcon name={tab.icon} size={30} /><span>{t(tab.label)}</span>
      </button>
    })}
    </div>
    <button className={`design-chat-button${chatActive ? ' active' : ''}`} aria-label={t('tab.chat')} aria-current={chatActive ? 'page' : undefined} onClick={() => navigate('/chat', { replace: true })}>
      <DesignIcon name="chat" size={32} />
    </button>
  </nav>
}
