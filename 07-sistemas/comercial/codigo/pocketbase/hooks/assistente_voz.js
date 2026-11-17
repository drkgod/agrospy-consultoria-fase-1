// FASE 2 — SPEC-2-003 (task fcbe8d32): pergunta por VOZ — v2, por REGISTRO.
//
// POR QUE MUDOU (09/11/2026): tentei ler o áudio direto do multipart em quatro
// variações e todas falharam no runtime do Skip:
//   1) fh.tempFilePath  -> não existe
//   2) fh.reader.read() -> "Object has no member 'read'"
//   3) fh.reader.open() -> reader tem só header/open, sem leitura utilizável
//   4) $filesystem.fileFromMultipart(fh) -> não entregou bytes
// O formato medido do findUploadedFiles é: reader, name, originalName, size, asMap.
// O multipart NÃO é o caminho certo aqui.
//
// CAMINHO QUE JÁ FUNCIONA NO PROJETO: a SPEC-2-001 grava o áudio como campo de arquivo
// de um registro e depois lê de storage/ com $os.readFile(...). Isso está provado
// desde 01/11 (áudio de 25807 bytes lido e transcrito). Aqui faço igual:
//   POST /backend/v1/assistente/voz  { empresa }  (multipart campo "audio")
//     1. cria um registro em `rascunhos` com origem app_texto e o áudio no campo midia
//        — é o único campo de arquivo que já existe e está liberado por regra;
//     2. lê o arquivo de storage/ com $os.readFile;
//     3. transcreve no Groq (mesma cadeia da 2-001);
//     4. APAGA o registro temporário (ele não é uma visita, é só o transporte);
//     5. devolve { ok, texto }.
// Assim o áudio nunca fica guardado sem necessidade e a tela continua fazendo os dois
// passos (voz -> texto -> /perguntar).
routerAdd('POST', '/backend/v1/assistente/voz', (e) => {
  const auth = e.auth
  if (!auth) throw e.unauthorizedError('Entre para usar o assistente.')

  const chave = $secrets.get('TRANSCRICAO_API_KEY')
  if (!chave) {
    return e.json(200, { ok: false, erro: 'A transcrição não está configurada no servidor.' })
  }

  const empresa = String((e.requestInfo().body || {}).empresa || '').trim()
  if (!empresa) return e.json(200, { ok: false, erro: 'Informe a empresa ativa.' })

  // Vínculo ativo na empresa (mesma checagem da rota de perguntar).
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
  if (!vinculo) return e.json(200, { ok: false, erro: 'Você não tem acesso a esta empresa.' })

  let arquivos = []
  try {
    arquivos = e.findUploadedFiles('audio')
  } catch (err) {
    arquivos = []
  }
  if (!arquivos || arquivos.length === 0) {
    return e.json(200, { ok: false, erro: 'Nenhum áudio recebido.' })
  }

  // ---- 1. registro de transporte com o áudio no campo de arquivo ----
  let temp = null
  let bytes = null
  try {
    const rec = new Record($app.findCollectionByNameOrId('rascunhos'))
    rec.set('empresa', empresa)
    rec.set('autor', auth.id)
    rec.set('origem', 'app_texto')
    // chave de transporte: identifica que este registro é só áudio de pergunta
    rec.set('chave_dedup', 'voz-pergunta:' + auth.id + ':' + Date.now())
    rec.set('status', 'recebido')
    rec.set('tentativas', 0)
    rec.set('texto_original', '(áudio de pergunta — registro temporário)')
    rec.set('midia', arquivos[0])
    $app.save(rec)
    temp = rec

    // ---- 2. lê os bytes de storage/ (caminho provado na SPEC-2-001) ----
    const nomeArq = rec.getString('midia')
    const caminho =
      $app.dataDir() + '/storage/' + rec.collection().id + '/' + rec.id + '/' + nomeArq
    bytes = $os.readFile(caminho)
  } catch (err) {
    // limpa o registro se ele chegou a existir
    if (temp) {
      try {
        $app.delete($app.findRecordById('rascunhos', temp.id))
      } catch (err2) {}
    }
    $app.logger().error('assistente voz: falha ao guardar/ler audio', 'erro', String(err))
    return e.json(200, { ok: false, erro: 'Não consegui processar o áudio. Tente de novo.' })
  }

  if (!bytes || bytes.length < 1000) {
    try {
      $app.delete($app.findRecordById('rascunhos', temp.id))
    } catch (err) {}
    return e.json(200, { ok: false, erro: 'O áudio chegou vazio. Tente de novo.' })
  }

  // ---- 3. transcreve (mesma cadeia da SPEC-2-001) ----
  const nome = String(temp.getString('midia') || 'pergunta.m4a')
  const fronteira = '----agrospy' + new Date().getTime()
  const txt = (s) => {
    const a = []
    for (let i = 0; i < s.length; i++) a.push(s.charCodeAt(i))
    return new Uint8Array(a)
  }
  const partes =
    '--' +
    fronteira +
    '\r\n' +
    'Content-Disposition: form-data; name="file"; filename="' +
    nome +
    '"\r\n' +
    'Content-Type: audio/mp4\r\n\r\n'
  const rodape =
    '\r\n--' +
    fronteira +
    '\r\n' +
    'Content-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n' +
    '--' +
    fronteira +
    '\r\n' +
    'Content-Disposition: form-data; name="language"\r\n\r\npt\r\n' +
    '--' +
    fronteira +
    '\r\n' +
    'Content-Disposition: form-data; name="response_format"\r\n\r\njson\r\n' +
    '--' +
    fronteira +
    '--\r\n'

  const a = txt(partes)
  const b = txt(rodape)
  const corpo = new Uint8Array(a.length + bytes.length + b.length)
  corpo.set(a, 0)
  corpo.set(bytes, a.length)
  corpo.set(b, a.length + bytes.length)

  let texto = ''
  let falhaTranscricao = ''
  try {
    const res = $http.send({
      url: 'https://api.groq.com/openai/v1/audio/transcriptions',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + chave,
        'Content-Type': 'multipart/form-data; boundary=' + fronteira,
      },
      body: corpo,
      timeout: 60,
    })
    if (res.statusCode < 200 || res.statusCode >= 300) {
      falhaTranscricao = 'HTTP ' + res.statusCode
    } else {
      const dados = res.json ? res.json : JSON.parse(res.body)
      texto = dados && dados.text ? String(dados.text).trim() : ''
    }
  } catch (err) {
    falhaTranscricao = String(err)
  }

  // ---- 4. apaga o registro de transporte, sempre ----
  try {
    $app.delete($app.findRecordById('rascunhos', temp.id))
  } catch (err) {
    $app.logger().warn('assistente voz: nao consegui apagar o transporte', 'id', temp.id)
  }

  if (falhaTranscricao) {
    $app
      .logger()
      .warn('assistente voz: transcricao recusada', 'motivo', falhaTranscricao.slice(0, 120))
    return e.json(200, { ok: false, erro: 'Não entendi o áudio. Tente escrever.' })
  }
  if (!texto) {
    return e.json(200, { ok: false, erro: 'Não entendi o áudio. Tente escrever.' })
  }

  // O texto transcrito NÃO vai para o log (regra da SPEC-2-001 §2).
  $app.logger().info('assistente voz: transcrito', 'caracteres', texto.length)
  return e.json(200, { ok: true, texto: texto })
})
