import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { empresasService } from '@/services/empresas'
import pb from '@/lib/pocketbase/client'
import { usuariosService, type UsuarioDaEmpresa } from '@/services/usuarios'
import type { Perfil } from '@/services/vinculos'
import { vinculosService } from '@/services/vinculos'

const PERFIS: { value: Perfil; label: string }[] = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'gestao', label: 'Gestão' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'operador', label: 'Operador' },
]

const labelPerfil = (p: Perfil) => PERFIS.find((x) => x.value === p)?.label ?? p

// Select NATIVO (elemento <select> do navegador): o componente popover do Radix
// quebrava no Safari do iPhone (página caía ao escolher o perfil — teste 12/10).
// Nativo funciona em qualquer navegador e mantém a mesma lógica.
function SeletorPerfil({
  valor,
  onTrocar,
  ariaLabel,
  id,
}: {
  valor: Perfil
  onTrocar: (v: Perfil) => void
  ariaLabel: string
  id?: string
}) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={valor}
      onChange={(e) => onTrocar(e.target.value as Perfil)}
      className="h-9 w-40 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {PERFIS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  )
}

export default function Usuarios() {
  const { toast } = useToast()
  const empresa = empresasService.getAtiva()
  // Deps estáveis: getAtiva() devolve objeto novo a cada render — depender do objeto
  // re-dispara o efeito em loop. Depender do id (string) não.
  const empresaId = empresa?.id ?? ''
  const [ehAdmin, setEhAdmin] = useState<boolean | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioDaEmpresa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [novo, setNovo] = useState({ nome: '', email: '', senha: '', perfil: '' })
  const [erroForm, setErroForm] = useState<string | null>(null)
  const [desativar, setDesativar] = useState<UsuarioDaEmpresa | null>(null)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    setErro(null)
    try {
      setUsuarios(await usuariosService.listarDaEmpresa(empresaId))
    } catch {
      setErro('Não foi possível carregar os usuários. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [empresaId])

  useEffect(() => {
    if (!empresaId) return
    // Perfil do próprio usuário na empresa ATIVA decide o menu e a rota (CA-1-05).
    let vivo = true
    vinculosService
      .listarDoUsuario()
      .then((vinculos) => {
        if (!vivo) return
        const meu = vinculos.find((v) => v.empresa === empresaId)
        setEhAdmin(meu?.perfil === 'administrador')
      })
      .catch(() => {
        if (vivo) setEhAdmin(false)
      })
    carregar()
    return () => {
      vivo = false
    }
  }, [empresaId, carregar])

  if (!empresa) return <Navigate to="/escolher-empresa" replace />
  if (ehAdmin === false) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Você não tem permissão para acessar esta tela.</p>
      </div>
    )
  }

  const criar = async () => {
    setErroForm(null)
    if (!novo.nome.trim() || !novo.email.trim() || !novo.senha || !novo.perfil) {
      setErroForm('Preencha nome, e-mail, senha temporária e perfil.')
      return
    }
    if (novo.senha.length < 8) {
      setErroForm('A senha temporária precisa ter pelo menos 8 caracteres.')
      return
    }
    setSalvando(true)
    try {
      await usuariosService.criar(
        {
          nome: novo.nome.trim(),
          email: novo.email.trim(),
          senhaTemporaria: novo.senha,
          perfil: novo.perfil as Perfil,
        },
        empresa.id,
        novo.nome.trim(),
      )
      setDialogoAberto(false)
      setNovo({ nome: '', email: '', senha: '', perfil: '' })
      toast({
        title: 'Usuário criado',
        description: 'Passe a senha temporária para a pessoa por fora do sistema.',
      })
      await carregar()
    } catch (e: unknown) {
      const msg = String((e as { response?: { message?: string } })?.response?.message ?? '')
      if (msg.toLowerCase().includes('email')) {
        setErroForm('E-mail já cadastrado. Use outro e-mail.')
      } else {
        setErroForm('Não foi possível criar o usuário. Tente novamente.')
      }
    } finally {
      setSalvando(false)
    }
  }

  const trocarPerfil = async (u: UsuarioDaEmpresa, perfil: Perfil) => {
    // Proteção: o último administrador ativo da empresa não pode rebaixar/desativar a si
    // mesmo (ficaria sem admin e a própria tela fecha — bug reproduzido no teste 12/10).
    const souEu = u.usuarioId === pb.authStore.record?.id
    if (souEu && u.perfil === 'administrador' && perfil !== 'administrador') {
      toast({
        title: 'Ação não permitida',
        description:
          'Você é o último administrador desta empresa. Promova outro administrador antes de mudar o seu perfil.',
        variant: 'destructive',
      })
      return
    }
    if (perfil === u.perfil) return
    try {
      await usuariosService.alterarPerfil(u.vinculoId, perfil)
      toast({
        title: 'Perfil alterado',
        description: `${u.nome || u.email} agora é ${labelPerfil(perfil)}.`,
      })
      await carregar()
    } catch {
      toast({
        title: 'Não foi possível alterar o perfil',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
      await carregar()
    }
  }

  const confirmarDesativar = async () => {
    if (!desativar) return
    // Proteção: o próprio último administrador não pode desativar o próprio acesso.
    if (desativar.usuarioId === pb.authStore.record?.id && desativar.perfil === 'administrador') {
      const outros = usuarios.some(
        (x) => x.usuarioId !== desativar.usuarioId && x.ativo && x.perfil === 'administrador',
      )
      if (!outros) {
        toast({
          title: 'Ação não permitida',
          description: 'Promova outro administrador antes de desativar o seu próprio acesso.',
          variant: 'destructive',
        })
        setDesativar(null)
        return
      }
    }
    try {
      await usuariosService.desativar(desativar.vinculoId)
      toast({
        title: 'Acesso desativado',
        description: `${desativar.nome || desativar.email} perde o acesso na próxima requisição.`,
      })
    } catch {
      toast({
        title: 'Não foi possível desativar',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setDesativar(null)
      await carregar()
    }
  }

  const reativar = async (u: UsuarioDaEmpresa) => {
    try {
      await usuariosService.reativar(u.vinculoId)
      toast({ title: 'Acesso reativado', description: `${u.nome || u.email} volta a ter acesso.` })
      await carregar()
    } catch {
      toast({
        title: 'Não foi possível reativar',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Equipe da empresa {empresa.nome}</p>
        </div>
        <Button onClick={() => setDialogoAberto(true)}>Novo usuário</Button>
      </div>

      {carregando && <p className="text-muted-foreground">Carregando…</p>}
      {erro && (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      )}
      {!carregando && !erro && usuarios.length === 0 && (
        <p className="text-muted-foreground">
          Nenhum usuário cadastrado ainda — crie o primeiro acesso da equipe.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {usuarios.map((u) => (
          <Card key={u.vinculoId} className={u.ativo ? '' : 'opacity-70'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <span className="truncate">{u.nome || '(sem nome)'}</span>
                {u.ativo ? <Badge>Ativo</Badge> : <Badge variant="secondary">Desativado</Badge>}
              </CardTitle>
              <CardDescription className="truncate">{u.email}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2 flex-wrap">
              <SeletorPerfil
                valor={u.perfil}
                onTrocar={(v) => trocarPerfil(u, v)}
                ariaLabel={`Perfil de ${u.nome || u.email}`}
              />
              {u.ativo ? (
                <Button variant="outline" size="sm" onClick={() => setDesativar(u)}>
                  Desativar acesso
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => reativar(u)}>
                  Reativar acesso
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>
              Crie o acesso e escolha o perfil na empresa {empresa.nome}.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              criar()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={novo.nome}
                onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                value={novo.email}
                onChange={(e) => setNovo({ ...novo, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha temporária</Label>
              <Input
                id="senha"
                type="text"
                autoComplete="off"
                value={novo.senha}
                onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 8 caracteres. A pessoa troca no primeiro acesso.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil</Label>
              {novo.perfil ? (
                <SeletorPerfil
                  id="perfil"
                  valor={novo.perfil as Perfil}
                  onTrocar={(v) => setNovo({ ...novo, perfil: v })}
                  ariaLabel="Perfil do novo usuário"
                />
              ) : (
                <select
                  id="perfil"
                  aria-label="Perfil do novo usuário"
                  value=""
                  onChange={(e) => setNovo({ ...novo, perfil: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Escolha o perfil</option>
                  {PERFIS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {erroForm && (
              <p className="text-sm text-destructive" role="alert">
                {erroForm}
              </p>
            )}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogoAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Criando…' : 'Criar usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!desativar} onOpenChange={(aberto) => !aberto && setDesativar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              {desativar?.nome || desativar?.email} perde o acesso a {empresa.nome} na próxima
              requisição. O histórico fica guardado e dá para reativar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarDesativar}>Desativar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
