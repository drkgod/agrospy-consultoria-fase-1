// FASE 2 — SPEC-2-001: perfil do produtor e classificação de potencial (escopo do guardanapo).
// Campos novos em produtores (aditivos, nunca mudam tipo):
//   perfil_tecnologia: select (adepto/parcial/nao_adepto) — adoção de tecnologia
//   perfil_ap: select (faz/fez/nunca) — agricultura de precisão
//   perfil_estrutura: text — equipamentos/estrutura que possui
//   status_comercial: select (potencial/nao_potencial/cliente) — classificação
//   epoca_efetividade: text — janela do ano de maior efetividade (ex.: "set-dez")
// Regras de acesso mantidas (mesmas da Fase 1); campos editáveis por quem pode editar produtor.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('produtores')
    col.fields.add(
      new SelectField({
        name: 'perfil_tecnologia',
        maxSelect: 1,
        values: ['adepto', 'parcial', 'nao_adepto'],
      }),
    )
    col.fields.add(
      new SelectField({
        name: 'perfil_ap',
        maxSelect: 1,
        values: ['faz', 'fez', 'nunca'],
      }),
    )
    col.fields.add(new TextField({ name: 'perfil_estrutura', max: 2000 }))
    col.fields.add(
      new SelectField({
        name: 'status_comercial',
        maxSelect: 1,
        values: ['potencial', 'nao_potencial', 'cliente'],
      }),
    )
    col.fields.add(new TextField({ name: 'epoca_efetividade', max: 120 }))
    app.save(col)
    console.log('0035 fase2 perfil produtor ok')
  },
  (app) => {
    const col = app.findCollectionByNameOrId('produtores')
    for (const nome of [
      'perfil_tecnologia',
      'perfil_ap',
      'perfil_estrutura',
      'status_comercial',
      'epoca_efetividade',
    ]) {
      try {
        col.fields.removeByName(nome)
      } catch (e) {
        /* já não existe */
      }
    }
    app.save(col)
  },
)
