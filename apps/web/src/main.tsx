/**
 * Application entry point.
 *
 * Sets up the provider tree and client-side routes:
 *  /            — main chat (App)
 *  /login       — email + Google login
 *  /signup      — create account
 *  /onboarding  — post-signup wizard
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { QueryProvider } from './providers/QueryProvider'
import { App } from './App'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Onboarding } from './pages/Onboarding'
import './style.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <QueryProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<Onboarding />} />
          </Routes>
        </QueryProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
