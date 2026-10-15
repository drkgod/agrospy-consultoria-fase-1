/* Layout Component - header com a identidade da empresa ativa + botão "Trocar empresa".
   A empresa ativa vem do armazenamento local (empresasService.getAtiva()); sem empresa ativa,
   o conteúdo não renderiza (o guard de rota redireciona para a escolha). */

import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { empresasService } from '@/services/empresas'
import { vinculosService } from '@/services/vinculos'
import { authService } from '@/services/auth'
import { filaOffline } from '@/services/fila-offline'
import IndicadorConexao from '@/components/IndicadorConexao'
import logoAgrospy from '@/assets/logo-agrospy.svg'

export default function Layout() {
  const navigate = useNavigate()
  const empresa = empresasService.getAtiva()
  const [ehAdmin, setEhAdmin] = useState(false)
  const [perfil, setPerfil] = useState('')
  // Deps estáveis por id (getAtiva() devolve objeto novo a cada render).
  const empresaId = empresa?.id ?? ''

  // Itens por perfil (CA-1-05; carteira SPEC-1-005 — Operador não tem carteira).
  useEffect(() => {
    if (!empresaId) return
    let vivo = true
    vinculosService
      .listarDoUsuario()
      .then((vinculos) => {
        if (!vivo) return
        const meu = vinculos.find((v) => v.empresa === empresaId)
        setEhAdmin(meu?.perfil === 'administrador')
        setPerfil(meu?.perfil ?? '')
      })
      .catch(() => {
        if (vivo) setEhAdmin(false)
      })
    return () => {
      vivo = false
    }
  }, [empresaId])

  const trocarEmpresa = () => {
    // RN-05: trocar limpa os dados da empresa anterior (tela e cache local)
    empresasService.setAtiva(null)
    navigate('/escolher-empresa')
  }

  const sair = async () => {
    // RN-24: sair com pendências exige confirmação (a fila continua guardada para o mesmo usuário).
    const usuarioId = (await import('@/lib/pocketbase/client')).default.authStore.record?.id
    if (usuarioId) {
      const n = await filaOffline.contarPendentes(usuarioId)
      if (
        n > 0 &&
        !window.confirm(
          `Há ${n} registro(s) não enviado(s). Sair assim mesmo? A fila continua guardada para este usuário.`,
        )
      ) {
        return
      }
      await filaOffline.cacheLimpar()
    }
    authService.signOut()
    empresasService.setAtiva(null)
    navigate('/login')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={(empresa && empresasService.logoUrl(empresa)) || logoAgrospy}
              alt=""
              aria-hidden="true"
              className="h-8 object-contain shrink-0"
            />
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
            <div className="flex items-center gap-2">
              {perfil !== 'operador' && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  Carteira
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate('/produtores')}>
                Produtores
              </Button>
              {ehAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/linhas-negocio')}>
                  Linhas de negócio
                </Button>
              )}
              {ehAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/usuarios')}>
                  Usuários
                </Button>
              )}
              {(perfil === 'gestao' || perfil === 'administrador') && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/visao-gestor')}>
                  Visão do gestor
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={trocarEmpresa}>
                Trocar empresa
              </Button>
              <Button variant="outline" size="sm" onClick={sair}>
                Sair
              </Button>
            </div>
          )}
        </div>
      </header>
      <IndicadorConexao />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
