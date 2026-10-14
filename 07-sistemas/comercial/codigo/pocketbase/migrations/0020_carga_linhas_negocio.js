// SPEC-1-003 — carga inicial das linhas de negócio (CL-PEND-008): editável pelo
// Administrador na tela do app; idempotente (só cria quando (empresa, nome) não existe).
// Agrospy: 7 + Relacionamento (fixa). Rumo Agro: 4 + Relacionamento (fixa).
migrate(
  (app) => {
    const empresas = app.findCollectionByNameOrId('empresas')
    const ln = app.findCollectionByNameOrId('linhas_negocio')
    const novas = []
    const cria = (empresaId, nome, fixa) => {
      try {
        app.findFirstRecordByFilter(
          ln,
          `empresa = "${empresaId}" && nome = "${nome.replace(/"/g, '\\"')}"`,
        )
        return
      } catch (e) {
        const r = new Record(ln)
        r.set('empresa', empresaId)
        r.set('nome', nome)
        r.set('ativa', true)
        r.set('fixa', !!fixa)
        app.save(r)
        novas.push(nome)
      }
    }
    const agrospy = app.findFirstRecordByFilter(empresas, `nome = "Agrospy"`)
    const rumo = app.findFirstRecordByFilter(empresas, `nome = "Rumo Agro"`)
    if (agrospy) {
      cria(agrospy.id, 'Consultoria em agricultura de precisão')
      cria(agrospy.id, 'Sementes de pastagem')
      cria(agrospy.id, 'Tecnologia de aplicação')
      cria(agrospy.id, 'Equipamentos para plantadeiras')
      cria(agrospy.id, 'Fertilizantes e insumos biológicos')
      cria(agrospy.id, 'Sistema de multi-filtragem para pulverizadores')
      cria(agrospy.id, 'Estações meteorológicas e monitoramento climático')
      cria(agrospy.id, 'Relacionamento — retorno sem linha definida', true)
    }
    if (rumo) {
      cria(rumo.id, 'Mapeamento de áreas')
      cria(rumo.id, 'Linhas de orientação de plantio')
      cria(rumo.id, 'Linhas de orientação de pulverização')
      cria(rumo.id, 'Projetos de terraços')
      cria(rumo.id, 'Relacionamento — retorno sem linha definida', true)
    }
    console.log(`[0020] linhas de negócio criadas: ${novas.length}`)
  },
  (app) => {
    const ln = app.findCollectionByNameOrId('linhas_negocio')
    const nomes = [
      'Consultoria em agricultura de precisão',
      'Sementes de pastagem',
      'Tecnologia de aplicação',
      'Equipamentos para plantadeiras',
      'Fertilizantes e insumos biológicos',
      'Sistema de multi-filtragem para pulverizadores',
      'Estações meteorológicas e monitoramento climático',
      'Relacionamento — retorno sem linha definida',
      'Mapeamento de áreas',
      'Linhas de orientação de plantio',
      'Linhas de orientação de pulverização',
      'Projetos de terraços',
    ]
    const registros = app.findRecordsByFilter(ln, '')
    for (const r of registros) {
      if (nomes.includes(r.getString('nome'))) app.delete(r)
    }
  },
)
