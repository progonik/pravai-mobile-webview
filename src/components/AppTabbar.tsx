import { useLocation, useNavigate } from 'react-router-dom'
import { DesignIcon } from './DesignIcon'
import { useT } from '../context/LocaleContext'

const tabs = [
  { path: '/home', label: 'tab.home', icon: 'home' },
  { path: '/tests', label: 'tab.tests', icon: 'checklist' },
  { path: '/profile', label: 'tab.profile', icon: 'profile' },
  { path: '/chat', label: 'tab.chat', icon: 'chat' },
] as const

export function AppTabbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const t = useT()
  return <nav className="design-tabbar" aria-label={t('home.navigation')}>
    {tabs.map(tab => {
      const exact = pathname === tab.path || (pathname === '/' && tab.path === '/home')
      const active = exact || pathname.startsWith(tab.path + '/')
      return <button key={tab.path} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} aria-label={t(tab.label)} onClick={() => exact ? document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' }) : navigate(tab.path, { replace: true })}>
        <DesignIcon name={tab.icon} size={30} /><span>{t(tab.label)}</span>
      </button>
    })}
  </nav>
}
