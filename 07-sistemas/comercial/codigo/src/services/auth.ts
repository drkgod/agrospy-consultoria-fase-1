import pb from '@/lib/pocketbase/client'
import { vinculosService } from './vinculos'

export interface AuthResult {
  error: string | null
  /** 'escolher' = múltiplas empresas; 'direto' = uma empresa; 'sem_acesso' = nenhum vínculo ativo */
  destino?: 'escolher' | 'direto' | 'sem_acesso'
}

export const authService = {
  async signIn(email: string, senha: string): Promise<AuthResult> {
    try {
      await pb.collection('users').authWithPassword(email, senha)
    } catch {
      // Não revelar se o e-mail existe (SPEC: mensagem genérica)
      return { error: 'E-mail ou senha incorretos.' }
    }
    const tem = await vinculosService.temVinculoAtivo()
    if (!tem) {
      pb.authStore.clear()
      return { error: 'Você ainda não tem acesso a nenhuma empresa. Fale com o administrador.', destino: 'sem_acesso' }
    }
    const vinculos = await vinculosService.listarDoUsuario()
    return { error: null, destino: vinculos.length > 1 ? 'escolher' : 'direto' }
  },

  signOut() {
    pb.authStore.clear()
  },

  isAuthenticated(): boolean {
    return pb.authStore.isValid
  },
}