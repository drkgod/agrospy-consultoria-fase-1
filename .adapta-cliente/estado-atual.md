# Estado atual — Adapta Cliente

- schema_version: adapta-cliente-state/v2
- task_id: 4da366fe-2f89-4585-88dc-c46b28672483
- executor: Pardal (ETHOS/Maestro)
- owner_informativo: Agrospy
- spec: 07-sistemas/comercial/codigo/docs/specs/spec-1-004-uso-no-celular-sem-internet.md
- analise: .adapta-cliente/analises/4da366fe-2f89-4585-88dc-c46b28672483.md
- etapa: aguardando_teste_humano
- autorizacao_implementacao: confirmada 2026-10-15 — "pode implementar" (após análise da 4da366fe)
- teste_humano: pendente — roteiro na análise (4da366fe-*.md); prova completa exige celular em modo avião
- aprendizado: capturado:06_notas/aprendizado-continuo/controle.md (newQuery posicional; col.addIndex; dedup antes de UNIQUE; pb export default)
- verificacao_automatica: passou — QA verde (0.0.73→0.0.81 81463d7); RED 1 confirmado como bug real (índices id_local nunca existiram) e corrigido (0030 dedup + 0031 addIndex): 1º POST 200, 2º POST 400, 1 registro no servidor; /sw.js e /manifest 200; carteira com cache offline e última sincronização
- sistema: comercial
- skip_projeto: 64376
- skip_versao: 197f20e (0.0.82)
- skip_publicacao: publicada:197f20e em 2026-10-15T18:29:01Z
- ultima_acao: fix do erro no teste do offline — logo 404 travava a instalação do SW (agora em public/ + cache tolerante); SW ativado e shell comprovado em cache (5 entradas)
- proxima_acao: Diogo fecha/reabre o app 1x com internet e repete o teste no modo avião
- atualizado_em: 2026-10-15T18:15:00-03:00
