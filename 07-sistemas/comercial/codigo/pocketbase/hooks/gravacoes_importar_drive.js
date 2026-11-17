// FASE 2 — SPEC-2-004: importação da pasta do Drive SOB DEMANDA.
//
// POR QUE SOB DEMANDA E NÃO AUTOMÁTICA (medido em 09/11/2026):
// A pasta "Gravações" está compartilhada e a leitura/escrita funciona (provei: criei
// um arquivo, listei e li o conteúdo de volta). O que falta é o SERVIDOR do Skip poder
// autenticar no Google: a lista de segredos do projeto não tem nenhuma credencial
// Google, e conta de serviço exige JWT RS256, que o runtime não assina.
// A spec 2-004 previu exatamente isso: "sem essa prova, a SPEC fecha com o envio pelo
// app, e a pasta fica como pendência registrada".
//
// O QUE ESTA ROTA FAZ: recebe os arquivos já lidos (drive_id, nome, texto) e cria os
// rascunhos na mesma fila da SPEC-2-001. A leitura da pasta é feita por quem tem a
// conexão (o assistente, sob pedido do usuário) — a rota só grava.
//
// Deduplicação conforme a spec: chave_dedup = id do arquivo no Drive; assim o mesmo
// arquivo importado duas vezes não vira dois rascunhos.
routerAdd('POST', '/backend/v1/gravacoes/importar-drive', (e) => {
  if (e.request.header.get('X-Contagem') !== 'conta-agrospy-2026-11') {
    throw e.forbiddenError('Sem chave.')
  }
  const corpo = e.requestInfo().body || {}
  const empresa = String(corpo.empresa || '')
  const arquivos = Array.isArray(corpo.arquivos) ? corpo.arquivos : []
  if (!empresa) return e.json(400, { ok: false, erro: 'Informe a empresa.' })
  if (arquivos.length === 0) return e.json(200, { ok: true, criados: 0, ja_existiam: 0 })

  // Dono configurado em config_drive (a spec diz que o rascunho da pasta é dele).
  let cfg = null
  try {
    cfg = $app.findFirstRecordByFilter('config_drive', 'empresa = {:e}', { e: empresa })
  } catch (err) {
    cfg = null
  }
  if (!cfg) return e.json(400, { ok: false, erro: 'A pasta do Drive não está configurada.' })
  const dono = cfg.getString('dono')
  if (!dono) return e.json(400, { ok: false, erro: 'A pasta não tem dono configurado.' })

  const out = { ok: true, criados: 0, ja_existiam: 0, sem_texto: 0, detalhe: [] }

  for (const a of arquivos) {
    const driveId = String((a && a.drive_id) || '')
    const nome = String((a && a.nome) || 'arquivo')
    let texto = String((a && a.texto) || '').trim()
    const hash = String((a && a.hash) || '')

    if (!driveId) {
      out.detalhe.push({ nome: nome, resultado: 'sem id do Drive' })
      continue
    }

    // Texto vazio: tenta extrair do próprio corpo, se vier base64 de docx/pdf.
    if (!texto && a && a.base64) {
      try {
        const bytes = Uint8Array.from(atob(String(a.base64)), (c) => c.charCodeAt(0))
        const f = $filesystem.fileFromBytes(bytes, nome)
        const doc = $documents.toMarkdown({ file: f })
        texto = String((doc && doc.markdown) || '').trim()
      } catch (err) {
        out.sem_texto++
        out.detalhe.push({ nome: nome, resultado: 'arquivo sem texto legível' })
        continue
      }
    }
    if (!texto) {
      out.sem_texto++
      out.detalhe.push({ nome: nome, resultado: 'sem texto' })
      continue
    }
    if (texto.length > 200000) {
      out.detalhe.push({ nome: nome, resultado: 'texto acima de 200 mil caracteres' })
      continue
    }

    // O mesmo arquivo do Drive não vira dois rascunhos (chave = id do arquivo).
    const chave = 'drive:' + driveId
    let existente = null
    try {
      existente = $app.findFirstRecordByFilter('rascunhos', 'chave_dedup = {:c}', { c: chave })
    } catch (err) {
      existente = null
    }
    if (existente) {
      out.ja_existiam++
      out.detalhe.push({ nome: nome, resultado: 'já estava na fila', rascunho: existente.id })
      continue
    }

    try {
      const rec = new Record($app.findCollectionByNameOrId('rascunhos'))
      rec.set('empresa', empresa)
      rec.set('autor', dono)
      rec.set('origem', 'drive')
      rec.set('texto_original', texto)
      rec.set('transcricao', texto)
      rec.set('chave_dedup', chave)
      if (hash) rec.set('hash_conteudo', hash)
      rec.set('status', 'recebido')
      rec.set('tentativas', 0)
      $app.save(rec)
      out.criados++
      out.detalhe.push({ nome: nome, resultado: 'criado', rascunho: rec.id })
    } catch (err) {
      out.detalhe.push({ nome: nome, resultado: 'erro: ' + String(err).slice(0, 80) })
    }
  }

  // Registra a última leitura bem-sucedida.
  try {
    cfg.set('ultima_leitura', new Date().toISOString())
    cfg.set('ultimo_erro', '')
    $app.save(cfg)
  } catch (err) {}

  return e.json(200, out)
})
