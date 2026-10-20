# Estado atual — Adapta Cliente

- schema_version: adapta-cliente-state/v2
- task_id: 4da366fe-2f89-4585-88dc-c46b28672483
- executor: Pardal (ETHOS/Maestro)
- owner_informativo: Agrospy
- spec: 07-sistemas/comercial/codigo/docs/specs/spec-1-004-uso-no-celular-sem-internet.md
- analise: .adapta-cliente/analises/4da366fe-2f89-4585-88dc-c46b28672483.md
- etapa: concluida
- autorizacao_implementacao: confirmada 2026-10-15 — "pode implementar"
- teste_humano: APROVADO pelo Diogo em 20/10/2026 16:00 — "agora deu certo" (após fixes 0.0.82 e 0.0.83)
- aprendizado: capturado:06_notas/aprendizado-continuo/controle.md (newQuery posicional; col.addIndex; dedup antes de UNIQUE; pb export default; empresa obrigatória no payload da fila; fallback offline na lista)
- verificacao_automatica: passou — QA verde (0.0.73→0.0.83 f355b3d); índices id_local corrigidos (1º POST 200, 2º POST 400); SW ativado e shell em cache; login/carteira provados no navegador
- sistema: comercial
- skip_projeto: 64376
- skip_versao: f355b3d (0.0.83)
- skip_publicacao: publicada:f355b3d em 2026-10-20T17:56:12Z
- ultima_acao: task 4da366fe CONCLUÍDA — teste humano aprovado pelo Diogo em 20/10 ("agora deu certo"); fixes 0.0.82 (logo 404 travava SW) e 0.0.83 (empresa no payload da fila, fallback offline da lista, reencaminhar, banner de revisão)
- proxima_acao: iniciar task ed490cca — testes de acesso multiempresa (outra empresa e perfil sem permissão bloqueados)
- atualizado_em: 2026-10-20T16:05:00-03:00