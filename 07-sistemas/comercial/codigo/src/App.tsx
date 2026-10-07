/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import EscolherEmpresa from './pages/EscolherEmpresa'
import Layout from './components/Layout'
import { authService } from './services/auth'
import { empresasService } from './services/empresas'
import type { ReactNode } from 'react'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

/** Guard: exige sessão válida (isAuthenticated, nunca !!user). */
function RequireAuth({ children }: { children: ReactNode }) {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Guard: exige empresa ativa escolhida (CA-1-02). */
function RequireEmpresa({ children }: { children: ReactNode }) {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />
  if (!empresasService.getAtiva()) return <Navigate to="/escolher-empresa" replace />
  return <>{children}</>
}

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/escolher-empresa" element={<EscolherEmpresa />} />
        <Route
          element={
            <RequireEmpresa>
              <Layout />
            </RequireEmpresa>
          }
        >
          <Route path="/" element={<Index />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App