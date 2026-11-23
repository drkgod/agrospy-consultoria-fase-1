# Estado atual — Adapta Cliente

- schema_version: adapta-cliente-state/v3
- task_id: pendente (próxima: "Conferir que todo o app continua funcionando no novo visual", SPEC-3-003 CA-3-16/17; o ID vem do portal)
- aguardando_teste: nenhuma (P11: sem teste humano)
- em_espera: "Ler a pasta do Drive a cada 10 minutos" (fase 3; falta o aplicativo OAuth do Google no cofre)
- executor: Pardal (ETHOS/Maestro)
- owner_informativo: Agrospy
- spec: 04_fase-atual/specs/spec-3-003-telas-do-app-no-novo-visual.md
- etapa: fase 3 em construção; fases 4 e 5 liberadas na mesma fila (emenda de 23/11/2026)
- ciclo: continuo — fila única: resto da SPEC-3-003 → SPEC-3-004 → SPEC-3-005 → SPEC-3-006 → fase 4 (fase-4.md) → fase 5 (fase-5.md), sem pedir autorização nem teste entre as tarefas e sem parar entre as fases; o que depender da Agrospy (segredo, KML, contrato, e-mails, API do Sicredi, conta DocuSign) fica em espera e é avisado uma vez no fim
- teste_humano: não se aplica (P11)
- verificacao_automatica: fase 2 concluída em 17/11/2026 (18/18), com evidência no histórico do repositório
- sistema: comercial
- skip_projeto: 64376
- skip_versao: 0.0.261 (23/11/2026)
- ultima_acao: 23/11/2026 [MAESTRO] SPEC-3-003 task 4 concluída: Avisos, Assistente (chat), Visão do gestor, Login e Escolher empresa no visual novo. Corrigido bug crítico de login (preventDefault em undefined) que impedia entrar no app.
- proxima_acao: fechar a SPEC-3-003 com a task de conferência (CA-3-16/CA-3-17), depois SPEC-3-004 na ordem do índice
- atualizado_em: 2026-11-23T16:30:00-03:00
