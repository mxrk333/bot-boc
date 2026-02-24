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
import { App } from './App'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Onboarding } from './pages/Onboarding'
import './style.css'
import { trpc, trpcClient } from './lib/trpc'
import { queryClient } from './lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'

import { ThemeProvider } from './hooks/useTheme'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    {/* 1. tRPC must be at the very top */}
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="app-ui-theme">
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/onboarding" element={<Onboarding />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>
)
