// VERIFICAÇÃO PÓS-LIMPEZA (01/11 22:40): só relata, não altera nada.
// Roda como migration porque a limpeza apagou o usuário de teste que servia de
// autenticação (teste.admin@agrospy.com.br). Em vez de recriar um usuário de teste
// — que é justamente o que acabamos de remover — a verificação escreve no log do
// servidor, lido por skip_cloud_list_logs.
// Idempotente: pode rodar de novo sem efeito.
migrate(
  (app) => {
    const linhas = []
    const conta = (nome) => {
      try {
        return app.findRecordsByFilter(nome, '', '', 5000, 0).length
      } catch (err) {
        return 'erro: ' + String(err)
      }
    }

    const users = app.findRecordsByFilter('users', '', 'email', 500, 0)
    const teste = users.filter((u) => /^teste\.|^prova\./i.test(u.getString('email')))
    linhas.push('users_total=' + users.length)
    linhas.push('users_teste_restantes=' + teste.length)
    linhas.push(
      'users_reais=' +
        users
          .filter((u) => !/^teste\.|^prova\./i.test(u.getString('email')))
          .map((u) => u.getString('email'))
          .join(','),
    )

    for (const c of [
      'produtores',
      'propriedades',
      'visitas',
      'oportunidades',
      'acoes_oportunidade',
      'avisos',
      'rascunhos',
      'inscricoes_push',
      'preferencias_avisos',
      'vinculos',
    ]) {
      linhas.push(c + '=' + conta(c))
    }

    // Produtores que sobraram, com o responsável
    const prods = app.findRecordsByFilter('produtores', '', 'nome', 500, 0)
    for (const p of prods) {
      let resp = '(vazio)'
      try {
        resp = app.findRecordById('users', p.getString('responsavel')).getString('email')
      } catch (err) {
        resp = '(SEM DONO)'
      }
      linhas.push('produtor: ' + p.getString('nome') + ' -> ' + resp)
    }

    // Oportunidades: alguma ficou sem dono ou apontando para produtor inexistente?
    let opsSemProdutor = 0
    const ops = app.findRecordsByFilter('oportunidades', '', 'created', 2000, 0)
    for (const o of ops) {
      const pid = o.getString('produtor')
      if (!pid) {
        opsSemProdutor++
        continue
      }
      try {
        app.findRecordById('produtores', pid)
      } catch (err) {
        opsSemProdutor++
      }
    }
    linhas.push('oportunidades_total=' + ops.length + ' orfas=' + opsSemProdutor)

    // Inscrição de push do Diogo (o push tem de continuar funcionando)
    const insc = app.findRecordsByFilter('inscricoes_push', 'ativa = true', '', 50, 0)
    linhas.push('inscricoes_ativas=' + insc.length)
    for (const i of insc) {
      let email = '(?)'
      try {
        email = app.findRecordById('users', i.getString('usuario')).getString('email')
      } catch (err) {
        email = '(SEM DONO)'
      }
      linhas.push('inscricao_ativa: ' + email)
    }

    console.log('[VERIFICACAO-LIMPEZA] ' + linhas.join(' | '))
  },
  (app) => {
    // sem reversão: é só relatório
  },
)
