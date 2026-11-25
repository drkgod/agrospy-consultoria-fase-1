# Estado atual — Adapta Cliente

- schema_version: adapta-cliente-state/v3
- task_id: pendente (próxima: "Ligar produtores das duas empresas e importar a carteira", SPEC-3-006)
- aguardando_teste: nenhuma (P11: sem teste humano)
- em_espera: "Ler a pasta do Drive a cada 10 minutos" (fase 3; falta o aplicativo OAuth do Google no cofre)
- em_espera_2: nada além do Drive
- executor: Pardal (ETHOS/Maestro)
- owner_informativo: Agrospy
- spec: 04_fase-atual/specs/spec-3-006-produtor-nas-duas-empresas-e-importacao.md
- etapa: fase 3 em construção; fases 4 e 5 liberadas na mesma fila (emenda de 23/11/2026)
- ciclo: continuo — fila única: resto da SPEC-3-003 → SPEC-3-004 → SPEC-3-005 → SPEC-3-006 → fase 4 (fase-4.md) → fase 5 (fase-5.md), sem pedir autorização nem teste entre as tarefas e sem parar entre as fases; o que depender da Agrospy (segredo, KML, contrato, e-mails, API do Sicredi, conta DocuSign) fica em espera e é avisado uma vez no fim
- teste_humano: não se aplica (P11)
- verificacao_automatica: fase 2 concluída em 17/11/2026 (18/18), com evidência no histórico do repositório
- sistema: comercial
- skip_projeto: 64376
- skip_versao: 0.0.302 (25/11/2026)
- ultima_acao: 25/11/2026 [MAESTRO] SPEC-3-005 CONCLUÍDA (4/4): rota da fila (RN-78, 5 grupos provados com fixture), rota do painel (funil, propostas, resultados, indicadores, serviços, por responsável), telas /painel, /prioridades e /config/comercial, /visao-gestor redirecionando. Permissões provadas: comercial=vê só a própria carteira, operador=403.
- proxima_acao: SPEC-3-006 (produtor nas duas empresas e importação da carteira), depois fase 4 (10 SPECs) e fase 5 (5 SPECs)
- atualizado_em: 2026-11-25T14:30:00-03:00
