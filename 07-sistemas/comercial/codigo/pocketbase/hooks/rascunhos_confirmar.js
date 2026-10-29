// FASE 2 — SPEC-2-001 (task 68c2ec27): rota de confirmação do rascunho.
// Confere empresa, id_local e status; copia a mídia para visitas.audio; grava
// confirmado, visita_criada, confirmado_por e confirmado_em.
// Idempotente: se já estiver confirmado, devolve a visita existente (CA-2-03).
// Só o autor ou Gestão/Administrador confirma (RN-30).
// Cópia da mídia: o arquivo do rascunho é transferido para o campo audio da visita
// por caminho físico (fileFromRecord não existe no runtime — confirmado em 29/10).
// API v0.36: handler recebe `e`; uma rota por arquivo.
routerAdd(
  'POST',
  '/backend/v1/rascunhos/{id}/confirmar',
  (e) => {
    const auth = e.auth
    if (!auth) throw e.unauthorizedError('Entre para confirmar.')
    const id = e.request.pathValue('id')
    let rascunho
    try {
      rascunho = $app.findRecordById('rascunhos', id)
    } catch (err) {
      throw e.notFoundError('Rascunho não encontrado.')
    }
    const empresa = rascunho.getString('empresa')
    const autor = rascunho.getString('autor')
    const ehAutor = autor === auth.id
    const ehGestor =
      auth.getStringSlice('acesso_gestao').indexOf(empresa) >= 0 ||
      auth.getStringSlice('acesso_admin').indexOf(empresa) >= 0
    if (!ehAutor && !ehGestor) {
      throw e.forbiddenError('Você não pode confirmar este rascunho.')
    }
    if (rascunho.getString('status') === 'confirmado') {
      return e.json(200, { visita: rascunho.getString('visita_criada'), ja_confirmado: true })
    }
    if (rascunho.getString('status') !== 'pronto_para_revisar') {
      throw e.badRequestError('Este rascunho não está pronto para confirmar.')
    }
    const info = e.requestInfo()
    const corpo = info && info.body ? info.body : {}
    const visitaId = corpo && corpo.visita ? String(corpo.visita) : ''
    if (!visitaId) throw e.badRequestError('Informe a visita criada.')

    let visita
    try {
      visita = $app.findRecordById('visitas', visitaId)
    } catch (err) {
      throw e.badRequestError('Visita não encontrada.')
    }
    if (visita.getString('empresa') !== empresa) {
      throw e.badRequestError('A visita é de outra empresa.')
    }
    if (visita.getString('id_local') !== 'rasc-' + rascunho.id) {
      throw e.badRequestError('A visita não corresponde a este rascunho.')
    }

    // Copia a mídia para visitas.audio. Sem engolir o erro: se falhar, a confirmação
    // não marca como confirmado — o áudio não se perde e o motivo fica registrado.
    const nomeArquivo = rascunho.getString('midia')
    if (nomeArquivo) {
      try {
        const caminho =
          $app.dataDir() +
          '/storage/' +
          rascunho.collection().id +
          '/' +
          rascunho.id +
          '/' +
          nomeArquivo
        const arquivo = $filesystem.fileFromPath(caminho)
        // Nome único para não colidir com áudios de outras visitas.
        arquivo.name = 'visita_' + visita.id + '_' + nomeArquivo.replace(/^[^.]*?(_|$)/, '')
        visita.set('audio', arquivo)
        $app.save(visita)
        // Confirma que o campo ficou preenchido de fato.
        const conferida = $app.findRecordById('visitas', visitaId)
        if (!conferida.getString('audio')) {
          throw new Error('campo audio ficou vazio apos salvar')
        }
      } catch (err) {
        $app.logger().error('rascunho confirmar: copia do audio falhou', 'erro', String(err))
        throw e.internalServerError(
          'Não consegui anexar o áudio à visita. O rascunho segue pronto para revisar; tente de novo.',
        )
      }
    }

    rascunho.set('status', 'confirmado')
    rascunho.set('visita_criada', visitaId)
    rascunho.set('confirmado_por', auth.id)
    rascunho.set('confirmado_em', new Date().toISOString())
    $app.save(rascunho)
    return e.json(200, { visita: visitaId, ja_confirmado: false })
  },
  $apis.requireAuth(),
)
