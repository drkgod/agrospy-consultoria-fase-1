import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { empresasService } from '@/services/empresas'
import { produtoresService, ORIGENS, type Produtor } from '@/services/produtores'

const VAZIO = {
  nome: '',
  documento: '',
  telefone: '',
  email: '',
  municipio: '',
  regional: '',
  origem: '',
  indicado_por: '',
  relacionamento: '',
  observacoes: '',
  nivel_tecnologia: '',
  tecnologias: '',
}

const NIVEIS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'muito_alta', label: 'Muito alta' },
]

function CampoOrigem({
  valor,
  onTrocar,
  id,
}: {
  valor: string
  onTrocar: (v: string) => void
  id?: string
}) {
  return (
    <select
      id={id}
      value={valor}
      onChange={(e) => onTrocar(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="">Escolha a origem</option>
      {ORIGENS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export default function Produtores() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const empresa = empresasService.getAtiva()
  const empresaId = empresa?.id ?? ''
  const [lista, setLista] = useState<Produtor[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState<string | null>(null)
  const [form, setForm] = useState(VAZIO)

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setCarregando(true)
    try {
      setLista(await produtoresService.listarDaEmpresa(empresaId, busca))
    } catch {
      toast({ title: 'Não foi possível carregar os produtores.', variant: 'destructive' })
    } finally {
      setCarregando(false)
    }
  }, [empresaId, busca, toast])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (!empresa) return null

  const abrirNovo = () => {
    setEditandoId(null)
    setForm(VAZIO)
    setErroForm(null)
    setDialogoAberto(true)
  }

  const abrirEdicao = (p: Produtor) => {
    setEditandoId(p.id)
    setForm({
      nome: p.nome,
      documento: p.documento,
      telefone: p.telefone,
      email: p.email,
      municipio: p.municipio,
      regional: p.regional,
      origem: p.origem,
      indicado_por: p.indicado_por,
      relacionamento: p.relacionamento,
      observacoes: p.observacoes,
      nivel_tecnologia: p.nivel_tecnologia,
      tecnologias: p.tecnologias,
    })
    setErroForm(null)
    setDialogoAberto(true)
  }

  const salvar = async () => {
    setErroForm(null)
    if (!form.nome.trim() || !form.municipio.trim() || !form.origem) {
      setErroForm('Preencha nome, município e origem.')
      return
    }
    if (
      (form.origem === 'indicacao_cliente' || form.origem === 'indicacao_socio_parceiro') &&
      !form.indicado_por.trim()
    ) {
      setErroForm('Quando a origem é indicação, informe quem indicou.')
      return
    }
    setSalvando(true)
    try {
      const dados = { ...form, documento: form.documento.replace(/\D/g, '') }
      if (editandoId) {
        await produtoresService.atualizar(editandoId, dados)
        toast({ title: 'Produtor atualizado' })
      } else {
        await produtoresService.criar(dados, empresa.id)
        toast({ title: 'Produtor cadastrado' })
      }
      setDialogoAberto(false)
      await carregar()
    } catch (e: unknown) {
      const msg = String((e as { response?: { message?: string } })?.response?.message ?? '')
      setErroForm(
        msg.includes('Já cadastrado') ? msg : 'Não foi possível salvar. Confira os campos.',
      )
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Produtores</h1>
          <p className="text-sm text-muted-foreground">{empresa.nome}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nome, município ou CPF/CNPJ"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-64"
          />
          <Button onClick={abrirNovo}>Novo produtor</Button>
        </div>
      </div>

      {carregando && <p className="text-muted-foreground">Carregando…</p>}
      {!carregando && lista.length === 0 && (
        <p className="text-muted-foreground">Nenhum produtor encontrado.</p>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((p) => (
          <Card key={p.id} className={p.arquivado ? 'opacity-70' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <span className="truncate">{p.nome}</span>
                {p.arquivado ? <Badge variant="secondary">Arquivado</Badge> : null}
              </CardTitle>
              <CardDescription className="truncate">
                {p.municipio}
                {p.documento ? ` · ${p.documento}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground truncate">
                {ORIGENS.find((o) => o.value === p.origem)?.label ?? p.origem}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => abrirEdicao(p)}>
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/produtores/${p.id}`)}>
                  Ficha
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? 'Editar produtor' : 'Novo produtor'}</DialogTitle>
            <DialogDescription>
              {editandoId
                ? 'Corrija as informações cadastradas.'
                : `Cadastro com origem, indicação e carteira em ${empresa.nome}.`}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              salvar()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="documento">CPF/CNPJ</Label>
                <Input
                  id="documento"
                  value={form.documento}
                  onChange={(e) => setForm({ ...form, documento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="municipio">Município *</Label>
                <Input
                  id="municipio"
                  value={form.municipio}
                  onChange={(e) => setForm({ ...form, municipio: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="regional">Regional</Label>
              <Input
                id="regional"
                value={form.regional}
                onChange={(e) => setForm({ ...form, regional: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origem">Origem *</Label>
              <CampoOrigem
                id="origem"
                valor={form.origem}
                onTrocar={(v) => setForm({ ...form, origem: v })}
              />
            </div>
            {(form.origem === 'indicacao_cliente' ||
              form.origem === 'indicacao_socio_parceiro') && (
              <div className="space-y-2">
                <Label htmlFor="indicado_por">Quem indicou *</Label>
                <Input
                  id="indicado_por"
                  value={form.indicado_por}
                  onChange={(e) => setForm({ ...form, indicado_por: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="relacionamento">Próximo de quem</Label>
              <Input
                id="relacionamento"
                value={form.relacionamento}
                onChange={(e) => setForm({ ...form, relacionamento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nivel_tecnologia">Nível de tecnologia</Label>
              <select
                id="nivel_tecnologia"
                value={form.nivel_tecnologia}
                onChange={(e) => setForm({ ...form, nivel_tecnologia: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Não informado</option>
                {NIVEIS.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tecnologias">
                Tecnologias (automação, agricultura de precisão, implementos)
              </Label>
              <textarea
                id="tecnologias"
                value={form.tecnologias}
                onChange={(e) => setForm({ ...form, tecnologias: e.target.value })}
                rows={4}
                placeholder="Ex.: piloto automático; plantadeira com desligamento linha a linha e taxa variável de semente/fertilizante; distribuidor de sólidos com/sem taxa variável; automações com projetos; AP já faz ou já fez."
                className="w-full min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
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
                {salvando ? 'Salvando…' : editandoId ? 'Salvar alterações' : 'Salvar produtor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
