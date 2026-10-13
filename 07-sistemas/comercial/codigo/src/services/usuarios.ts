import pb from '@/lib/pocketbase/client'
import type { Perfil } from '@/services/vinculos'

export interface UsuarioDaEmpresa {
  vinculoId: string
  usuarioId: string
  nome: string
  email: string
  perfil: Perfil
  ativo: boolean
}

export interface CriarUsuarioInput {
  nome: string
  email: string
  senhaTemporaria: string
  perfil: Perfil
}

export const usuariosService = {
  /** Equipe da empresa ativa (todos os vínculos, ativos e desativados). */
  async listarDaEmpresa(empresaId: string): Promise<UsuarioDaEmpresa[]> {
    // Sem expand de usuario: users só permite ver o próprio usuário; o vínculo
    // carrega nome_exibicao e email denormalizados (SPEC-1-001).
    const vinculos = await pb.collection('vinculos').getFullList({
      filter: `empresa = "${empresaId}"`,
      sort: '-created',
    })
    return vinculos.map((v) => ({
      vinculoId: v.id,
      usuarioId: v.usuario,
      nome: v.nome_exibicao || v.email,
      email: v.email,
      perfil: v.perfil,
      ativo: v.ativo,
    }))
  },

  /** Cria o usuário e o vínculo (perfil) na empresa — CA-1-05. Senha comunicada por fora. */
  async criar(input: CriarUsuarioInput, empresaId: string, nomeExibicao: string): Promise<void> {
    const user = await pb.collection('users').create({
      name: input.nome,
      email: input.email,
      password: input.senhaTemporaria,
      passwordConfirm: input.senhaTemporaria,
    })
    await pb.collection('vinculos').create({
      usuario: user.id,
      empresa: empresaId,
      perfil: input.perfil,
      ativo: true,
      nome_exibicao: nomeExibicao,
      email: input.email,
    })
  },

  async alterarPerfil(vinculoId: string, perfil: Perfil): Promise<void> {
    await pb.collection('vinculos').update(vinculoId, { perfil })
  },

  /** Desativar não apaga (deleteRule = null): a pessoa perde o acesso na requisição seguinte. */
  async desativar(vinculoId: string): Promise<void> {
    await pb.collection('vinculos').update(vinculoId, { ativo: false })
  },

  async reativar(vinculoId: string): Promise<void> {
    await pb.collection('vinculos').update(vinculoId, { ativo: true })
  },
}
