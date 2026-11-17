// FASE 2 — SPEC-2-004 (task a9653f03): envio de gravação/transcrição pelo app.
//
// POST /backend/v1/gravacoes/texto  { empresa, nome_arquivo, base64?, texto? , hash }
//   -> { ok, rascunho, link }
//
// POR QUE ESTA ROTA EXISTE: o Plaud exporta a transcrição pronta em txt, docx e pdf.
// docx e pdf não são legíveis no navegador; o Skip tem o extrator nativo
// `$documents.toMarkdown({ file })` (documentado no hooks_guide). Então o arquivo
// chega aqui e sai como texto para o rascunho da SPEC-2-001.
//
// REGRAS DA SPEC:
//  - texto pronto NÃO é transcrito de novo: vai direto para a proposta da IA;
//  - 422 do extrator -> rascunho em `falhou` com "arquivo sem texto legível";
//  - mais de 200 mil caracteres é recusado com "envie em partes";
//  - o mesmo arquivo na mesma empresa vira UM rascunho (hash_conteudo).
//
// O áudio NÃO passa por aqui: a tela cria o rascunho direto pelo SDK, como a
// SPEC-2-001 já faz (campo `midia`), e chama /rascunhos/{id}/processar.
routerAdd('POST', '/backend/v1/gravacoes/texto', (e) => {
  const auth = e.auth
  if (!auth) throw e.unauthorizedError('Entre para enviar.')

  const corpo = e.requestInfo().body || {}
  const empresa = String(corpo.empresa || '')
  const nomeArquivo = String(corpo.nome_arquivo || 'transcricao')
  const textoDireto = String(corpo.texto || '')
  const hash = String(corpo.hash || '')
  const idLocal = String(corpo.id_local || '')

  if (!empresa) return e.json(400, { ok: false, erro: 'Informe a empresa ativa.' })

  // Vínculo ativo (mesma checagem das outras rotas da fase 2).
  let vinculo = null
  try {
    vinculo = $app.findFirstRecordByFilter(
      'vinculos',
      'usuario = {:u} && empresa = {:e} && ativo = true',
      { u: auth.id, e: empresa },
    )
  } catch (err) {
    vinculo = null
  }
  if (!vinculo) return e.json(403, { ok: false, erro: 'Você não tem acesso a esta empresa.' })
  const perfil = vinculo.getString('perfil')
  if (perfil === 'operador') {
    return e.json(200, {
      ok: false,
      erro: 'Seu perfil não registra visitas.',
    })
  }

  // ---- 1. repetição: mesmo conteúdo na empresa -> devolve o existente ----
  if (hash) {
    try {
      const igual = $app.findFirstRecordByFilter(
        'rascunhos',
        'empresa = {:e} && hash_conteudo = {:h}',
        { e: empresa, h: hash },
      )
      if (igual && igual.id) {
        const meu = igual.getString('autor') === auth.id
        return e.json(200, {
          ok: true,
          ja_existia: true,
          rascunho: meu ? igual.id : '',
          link: meu ? '/rascunhos/' + igual.id : '',
          resposta: meu
            ? 'Esse arquivo já estava na fila. Confira e confirme.'
            : 'Esse arquivo já foi enviado por outra pessoa da empresa.',
        })
      }
    } catch (err) {
      /* sem registro: segue */
    }
  }

  // ---- 2. extrai o texto ----
  let texto = textoDireto

  if (!texto) {
    // O arquivo vem no multipart, campo "arquivo".
    let arquivos = []
    try {
      arquivos = e.findUploadedFiles('arquivo')
    } catch (err) {
      arquivos = []
    }
    if (!arquivos || arquivos.length === 0) {
      return e.json(200, {
        ok: false,
        erro: 'Escolha um arquivo de transcrição (txt, docx ou pdf).',
      })
    }
    const fh = arquivos[0]

    // txt chega como texto no próprio submit; docx/pdf precisam do extrator.
    try {
      const doc = $documents.toMarkdown({ file: fh })
      texto = String((doc && doc.markdown) || '').trim()
    } catch (err) {
      const msg = String(err)
      // O extrator devolve 422 para arquivo sem texto legível.
      if (msg.indexOf('422') >= 0 || /unsupported|no text|empty/i.test(msg)) {
        return e.json(200, {
          ok: false,
          erro: 'Arquivo sem texto legível. Envie a transcrição em txt, docx ou pdf.',
          sem_texto: true,
        })
      }
      $app.logger().warn('gravacoes: extrator falhou', 'erro', msg.slice(0, 120))
      return e.json(200, {
        ok: false,
        erro: 'Não consegui ler esse arquivo. Tente txt, docx ou pdf.',
      })
    }
  }

  texto = String(texto || '').trim()
  if (!texto) {
    return e.json(200, { ok: false, erro: 'O arquivo não tem texto. Envie a transcrição.' })
  }
  // Limite da spec: 200 mil caracteres.
  if (texto.length > 200000) {
    return e.json(200, { ok: false, erro: 'Transcrição muito longa. Envie em partes.' })
  }

  // ---- 3. cria o rascunho (mesma fila da SPEC-2-001) ----
  const chave = idLocal ? 'gravador:' + idLocal : 'gravador:' + auth.id + ':' + Date.now()
  try {
    const rec = new Record($app.findCollectionByNameOrId('rascunhos'))
    rec.set('empresa', empresa)
    rec.set('autor', auth.id)
    rec.set('origem', 'arquivo_gravador')
    rec.set('texto_original', texto)
    rec.set('transcricao', texto)
    rec.set('chave_dedup', chave)
    if (hash) rec.set('hash_conteudo', hash)
    rec.set('status', 'recebido')
    rec.set('tentativas', 0)
    $app.save(rec)

    $app
      .logger()
      .info(
        'gravacoes: transcricao recebida',
        'rascunho',
        rec.id,
        'caracteres',
        texto.length,
        'arquivo',
        nomeArquivo.slice(0, 60),
      )

    return e.json(200, {
      ok: true,
      rascunho: rec.id,
      link: '/rascunhos/' + rec.id,
      caracteres: texto.length,
      resposta: 'Transcrição recebida. Confira e confirme o rascunho.',
    })
  } catch (err) {
    $app.logger().error('gravacoes: falha ao criar rascunho', 'erro', String(err).slice(0, 160))
    return e.json(200, { ok: false, erro: 'Não consegui criar o rascunho agora. Tente de novo.' })
  }
})
