import { Navigate, Route, Routes, HashRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/queryClient'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LocaleProvider } from './context/LocaleContext'
import { OverlayProvider } from './context/OverlayContext'
import { ToastProvider } from './context/ToastContext'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'

function AuthGate() {
  const { isAuthorized } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthorized ? <Navigate to="/home" replace /> : <LoginPage />}
      />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <LocaleProvider>
          <AuthProvider>
            <OverlayProvider>
              <ToastProvider>
                <AuthGate />
              </ToastProvider>
            </OverlayProvider>
          </AuthProvider>
        </LocaleProvider>
      </HashRouter>
    </QueryClientProvider>
  )
}

export default App
