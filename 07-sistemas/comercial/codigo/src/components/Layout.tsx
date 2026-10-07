/* Layout Component - header com a identidade da empresa ativa + botão "Trocar empresa".
   A empresa ativa vem do armazenamento local (empresasService.getAtiva()); sem empresa ativa,
   o conteúdo não renderiza (o guard de rota redireciona para a escolha). */

import { Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { empresasService } from '@/services/empresas'
import logoAgrospy from '@/assets/logo-agrospy.svg'

export default function Layout() {
  const navigate = useNavigate()
  const empresa = empresasService.getAtiva()

  const trocarEmpresa = () => {
    // RN-05: trocar limpa os dados da empresa anterior (tela e cache local)
    empresasService.setAtiva(null)
    navigate('/escolher-empresa')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2 min-w-0">
            <img src={logoAgrospy} alt="" aria-hidden="true" className="h-8 object-contain shrink-0" />
            {empresa && (
              <>
                <span className="text-muted-foreground" aria-hidden="true">
                  ·
                </span>
                <span
                  className="h-5 w-5 rounded shrink-0"
                  style={{ backgroundColor: empresa.cor_primaria }}
                  aria-hidden="true"
                />
                <span className="font-medium truncate">{empresa.nome}</span>
              </>
            )}
          </div>
          {empresa && (
            <Button variant="outline" size="sm" onClick={trocarEmpresa}>
              Trocar empresa
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}