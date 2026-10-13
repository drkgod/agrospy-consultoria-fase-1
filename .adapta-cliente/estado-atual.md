# Estado atual — Adapta Cliente

- schema_version: adapta-cliente-state/v2
- task_id: f1624dc7-d84e-424d-840b-414ed775636e
- executor: Pardal (ETHOS/Maestro)
- owner_informativo: Agrospy
- spec: 04_fase-atual/specs/spec-1-001-acesso-por-empresa-e-perfis.md
- analise: .adapta-cliente/analises/f1624dc7-d84e-424d-840b-414ed775636e.md
- etapa: concluida
- autorizacao_implementacao: confirmada 2026-10-08 17:31 — "Pode implementar"
- teste_humano: APROVADO pelo Diogo em 2026-10-13 10:11 ("agora deu certo")
- verificacao_automatica: OK — regras provadas por API (RED 4: autoelevacao bloqueada; operador sem criar usuario/vinculo; empresas filtradas por acesso) e fluxo completo no navegador (login, escolha, menu admin, tela /usuarios com lista)
- aprendizado: capturado 06_notas/aprendizado-continuo/AP-2026-10-13-safari-crash-runtime-skip.md (crash client-side no Safari; runtime Skip sem e.record.original())
- sistema: comercial
- skip_projeto: 64376
- skip_versao: f562866 (0.0.20)
- skip_publicacao: publicada:f562866 em 2026-10-12T22:58:45Z
- ultima_acao: bug do Safari corrigido em 3 camadas (UI bloqueia, hook recusa com 400, perfil restaurado); teste humano aprovado; usuarios de teste criados (5 contas por perfil)
- proxima_acao: task 147a4f1b (cadastro de produtor e propriedade, SPEC-1-002) — analise e autorizacao
- atualizado_em: 2026-10-13T10:20:00-03:00
