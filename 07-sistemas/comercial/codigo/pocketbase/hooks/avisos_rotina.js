// FASE 2 — SPEC-2-002: rotina de 10 minutos que gera os avisos.
// Mesma lógica da rota de teste, inline (o runtime não aceita require('./local')).
// Um erro numa empresa não para as outras.
cronAdd('gerar_avisos_proxima_acao', '*/10 * * * *', () => {
  try {
    const agora = new Date()
    const br = new Date(agora.getTime() - 3 * 60 * 60 * 1000)
    const hojeBR = br.toISOString().slice(0, 10)
    const horaBR = br.toISOString().slice(11, 16)

    const empresas = $app.findRecordsByFilter('empresas', '', '', 200, 0, {})
    for (const empresa of empresas) {
      try {
        let config = null
        try {
          config = $app.findFirstRecordByFilter('config_avisos', 'empresa = {:e}', {
            e: empresa.id,
          })
        } catch (err) {
          config = null
        }
        const ativo = config ? config.getBool('ativo') : true
        if (!ativo) continue
        const horario = (config && config.getString('horario')) || '07:00'
        const repetir = (config && config.getInt('repetir_atraso_dias')) || 3
        const comCopia = config ? config.getBool('copia_gestor') : true

        if (config) {
          const ultima = config.getString('ultima_execucao')
          if (ultima && String(ultima).slice(0, 10) === hojeBR) continue
        }
        if (horaBR < horario) continue

        const gestores = []
        if (comCopia) {
          const users = $app.findRecordsByFilter('users', '', '', 500, 0, {})
          for (const u of users) {
            const gestao = u.getStringSlice('acesso_gestao')
            const admin2 = u.getStringSlice('acesso_admin')
            if (gestao.indexOf(empresa.id) < 0 && admin2.indexOf(empresa.id) < 0) continue
            let desligada = false
            try {
              const p = $app.findFirstRecordByFilter(
                'preferencias_avisos',
                'usuario = {:u} && empresa = {:e}',
                { u: u.id, e: empresa.id },
              )
              desligada = p.getBool('copia_desligada')
            } catch (err) {
              desligada = false
            }
            if (!desligada) gestores.push(u.id)
          }
        }

        const oportunidades = $app.findRecordsByFilter(
          'oportunidades',
          'empresa = {:e} && situacao = "aberta"',
          'proxima_acao_data',
          500,
          0,
          { e: empresa.id },
        )

        let gerados = 0
        for (const op of oportunidades) {
          const dataAcao = String(op.getString('proxima_acao_data')).slice(0, 10)
          if (!dataAcao) continue
          const responsavel = op.getString('responsavel')
          let nomeProdutor = 'Produtor'
          try {
            nomeProdutor = $app
              .findRecordById('produtores', op.getString('produtor'))
              .getString('nome')
          } catch (err) {}
          const acao = op.getString('proxima_acao')

          const criar = (destinatario, tipo, textoCurto) => {
            const chave = op.id + '|' + tipo + '|' + destinatario + '|' + hojeBR
            try {
              $app.findFirstRecordByFilter('avisos', 'chave_unica = {:c}', { c: chave })
              return false
            } catch (err) {}
            const rec = new Record($app.findCollectionByNameOrId('avisos'))
            rec.set('empresa', empresa.id)
            rec.set('destinatario', destinatario)
            rec.set('oportunidade', op.id)
            rec.set('tipo', tipo)
            rec.set('referencia_data', dataAcao + ' 12:00:00.000Z')
            rec.set('texto_curto', textoCurto)
            rec.set('detalhe', nomeProdutor + ' · ' + (acao || 'próxima ação'))
            rec.set('envio', 'pendente')
            rec.set('chave_unica', chave)
            $app.save(rec)
            return true
          }

          if (dataAcao === hojeBR && responsavel) {
            if (criar(responsavel, 'do_dia', 'Agrospy: você tem 1 ação para hoje')) gerados++
          } else if (dataAcao < hojeBR) {
            const dias = Math.floor(
              (new Date(hojeBR + 'T00:00:00Z').getTime() -
                new Date(dataAcao + 'T00:00:00Z').getTime()) /
                86400000,
            )
            const tocaHoje = dias === 1 || (dias > 1 && (dias - 1) % repetir === 0)
            if (tocaHoje && responsavel) {
              if (criar(responsavel, 'atraso', 'Agrospy: 1 ação atrasada')) gerados++
              for (const g of gestores) {
                if (g === responsavel) continue
                if (criar(g, 'copia_gestor', 'Agrospy: 1 ação atrasada na equipe')) gerados++
              }
            }
          }
        }

        if (config) {
          config.set('ultima_execucao', agora.toISOString())
          $app.save(config)
        } else {
          const nova = new Record($app.findCollectionByNameOrId('config_avisos'))
          nova.set('empresa', empresa.id)
          nova.set('ativo', true)
          nova.set('horario', '07:00')
          nova.set('repetir_atraso_dias', 3)
          nova.set('copia_gestor', true)
          nova.set('ultima_execucao', agora.toISOString())
          $app.save(nova)
        }
        // ---------------------------------------------------------------
        // ENVIO (01/11): a rotina gerava e parava — nenhum aviso chegava ao
        // celular. A rota avisos_enviar.js existia mas não estava agendada em
        // lugar nenhum. O envio agora acontece aqui, logo após gerar.
        // Regra provada: enviar por include_subscription_ids (o alias
        // external_id volta 200 com invalid_aliases e não entrega).
        // ---------------------------------------------------------------
        const appId = $secrets.get('PUSH_APP_ID') || ''
        const chave = $secrets.get('PUSH_API_KEY') || ''
        let enviados = 0
        let semInscricao = 0
        let falhas = 0
        if (appId && chave) {
          const pendentes = $app.findRecordsByFilter(
            'avisos',
            'envio = "pendente" && empresa = {:e}',
            'created',
            100,
            0,
            { e: empresa.id },
          )
          for (const a of pendentes) {
            const destinatario = a.getString('destinatario')
            let inscricao = null
            try {
              inscricao = $app.findFirstRecordByFilter(
                'inscricoes_push',
                'usuario = {:u} && ativa = true',
                { u: destinatario },
              )
            } catch (err) {
              inscricao = null
            }
            if (!inscricao) {
              a.set('envio', 'sem_inscricao')
              $app.save(a)
              semInscricao++
              continue
            }
            // ENVIO PARA TODAS AS INSCRIÇÕES VIVAS DO USUÁRIO (02/11).
            // O banco guarda UM id, mas o aparelho pode criar outro quando o service
            // worker é atualizado a cada publicação. O servidor continuava enviando
            // para o id velho: a Apple aceitava (successful=1) e nada aparecia.
            // Aqui a lista é lida do OneSignal na hora do envio, pelo vínculo
            // external_id do usuário — não do que ficou guardado no banco.
            const idsParaEnviar = []
            try {
              const resU = $http.send({
                url:
                  'https://api.onesignal.com/apps/' +
                  appId +
                  '/users/by/external_id/' +
                  destinatario,
                method: 'GET',
                headers: { Authorization: 'Key ' + chave },
                timeout: 15,
              })
              let cu = resU.body
              try {
                cu = resU.json ? resU.json : JSON.parse(resU.body)
              } catch (err) {}
              for (const s of (cu && cu.subscriptions) || []) {
                const vivo =
                  s.enabled === true &&
                  s.notification_types === 1 &&
                  s.token &&
                  String(s.token).length > 10 &&
                  String(s.type || '').indexOf('Push') >= 0
                if (vivo) idsParaEnviar.push(s.id)
              }
            } catch (err) {
              // sem consulta: cai no id guardado
            }
            if (idsParaEnviar.length === 0) idsParaEnviar.push(inscricao.getString('id_inscricao'))

            let ok = false
            let ultimoErro = ''
            for (let tentativa = 0; tentativa < 2 && !ok; tentativa++) {
              try {
                const res = $http.send({
                  url: 'https://api.onesignal.com/notifications',
                  method: 'POST',
                  headers: {
                    Authorization: 'Key ' + chave,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    app_id: appId,
                    include_subscription_ids: [idInscricao],
                    headings: { en: 'Agrospy', pt: 'Agrospy' },
                    contents: {
                      en: a.getString('texto_curto'),
                      pt: a.getString('texto_curto'),
                    },
                    data: { aviso: a.id, oportunidade: a.getString('oportunidade') },
                  }),
                  timeout: 10,
                })
                let c = res.body
                try {
                  c = res.json ? res.json : JSON.parse(res.body)
                } catch (err) {}
                const temErro = c && c.errors && Object.keys(c.errors).length > 0
                if (res.statusCode >= 200 && res.statusCode < 300 && !temErro) ok = true
                else
                  ultimoErro =
                    'HTTP ' + res.statusCode + (temErro ? ' ' + JSON.stringify(c.errors) : '')
              } catch (err) {
                ultimoErro = String(err)
              }
            }
            a.set('envio', ok ? 'enviado' : 'falhou_envio')
            $app.save(a)
            if (ok) enviados++
            else {
              falhas++
              $app.logger().warn('envio de aviso falhou', 'aviso', a.id, 'erro', ultimoErro)
            }
          }
        }

        if (gerados > 0 || enviados > 0) {
          $app
            .logger()
            .info(
              'avisos',
              'empresa',
              empresa.id,
              'gerados',
              gerados,
              'enviados',
              enviados,
              'sem_inscricao',
              semInscricao,
              'falhas',
              falhas,
            )
        }
      } catch (errEmpresa) {
        $app
          .logger()
          .error('avisos: erro na empresa', 'empresa', empresa.id, 'erro', String(errEmpresa))
      }
    }
  } catch (err) {
    $app.logger().error('rotina avisos falhou', 'erro', String(err))
  }
})
