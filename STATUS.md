# STATUS — Agrospy

**Atualizado em:** 22/10/2026
**Fase atual:** 2 — Captura em campo e avisos
**Versão no ar:** 0.0.88
**Estado:** fase 2 liberada em 22/10/2026; 0/21 tasks concluídas. Fase 1 concluída em 22/10/2026 (34/34, teste final do Diogo); histórico em `05_entregas/fase-1/`.

| Item | Situação |
|---|---|
| SPECs | 4, com TDD e critérios CA-2-01 a CA-2-18 |
| Tasks | 21: 4 de topo (uma por SPEC) e 17 subtarefas, todas com ID do portal |
| Teste humano | só na última task de cada SPEC; as demais fecham pela prova automática |
| Ordem | pós-visita por áudio no app → avisos → assistente dentro do app → gravações do Plaud e teste final |

## Entradas da Agrospy (só travam a task que depende delas)

| Item | Para quê | Quando o Maestro pede |
|---|---|---|
| Pasta do Google Drive de cada empresa | gravações pela pasta (SPEC-2-004) | na task da pasta |
| Sistema dos celulares da equipe | avisos (SPEC-2-002) | no teste dos avisos |
| Conta gratuita do Groq (transcrição) | só se o Skip não transcrever áudio (SPEC-2-001) | na task de transcrição |
| Conta gratuita do OneSignal (avisos) | notificação no celular (SPEC-2-002) | na task de notificações |

## Próxima ação

Começar pela task "Criar a fila de rascunhos para revisar o pós-visita" (SPEC-2-001) e seguir a ordem do arquivo de tasks.
