import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { empresasService, type Empresa } from '@/services/empresas'
import { authService } from '@/services/auth'

export default function EscolherEmpresa() {
  const navigate = useNavigate()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login')
      return
    }
    empresasService
      .listarDoUsuario()
      .then((lista) => {
        if (lista.length === 0) {
          // Sem vínculo ativo: volta ao login com a mensagem
          authService.signOut()
          navigate('/login')
          return
        }
        setEmpresas(lista)
      })
      .catch(() => setErro('Não foi possível carregar as empresas. Tente novamente.'))
      .finally(() => setCarregando(false))
  }, [navigate])

  const escolher = (empresa: Empresa) => {
    empresasService.setAtiva(empresa)
    navigate('/')
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Em qual empresa você vai trabalhar?</CardTitle>
          <CardDescription>Escolha a empresa ativa para esta sessão</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {erro && (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          )}
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              type="button"
              onClick={() => escolher(empresa)}
              className="w-full flex items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label={`Trabalhar na empresa ${empresa.nome}`}
            >
              <span
                className="h-10 w-10 rounded-md flex items-center justify-center text-white font-semibold shrink-0"
                style={{ backgroundColor: empresa.cor_primaria }}
                aria-hidden="true"
              >
                {empresa.nome.charAt(0)}
              </span>
              <span className="font-medium">{empresa.nome}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}