import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/auth'
import { empresasService } from '@/services/empresas'
import { vinculosService } from '@/services/vinculos'
import logoAgrospy from '@/assets/logo-agrospy.svg'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.')
      return
    }
    setCarregando(true)
    const result = await authService.signIn(email.trim(), senha)
    setCarregando(false)
    if (result.error) {
      setErro(result.error)
      return
    }
    if (result.destino === 'escolher') {
      navigate('/escolher-empresa')
      return
    }
    // Uma empresa só: entra direto
    const vinculos = await vinculosService.listarDoUsuario()
    const empresa = vinculos[0]?.expand?.empresa
    if (empresa) {
      empresasService.setAtiva({
        id: empresa.id,
        nome: empresa.nome,
        slug: empresa.slug,
        cor_primaria: empresa.cor_primaria,
        logo: empresa.logo,
        ativa: empresa.ativa,
      })
      navigate('/')
    } else {
      navigate('/escolher-empresa')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src={logoAgrospy} alt="Agrospy Consultoria Agronômica" className="h-16 mx-auto mb-2 object-contain" />
          <CardTitle>Entrar no sistema</CardTitle>
          <CardDescription>Use o e-mail e a senha da sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={entrar} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            {erro && (
              <p className="text-sm text-destructive" role="alert">
                {erro}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}