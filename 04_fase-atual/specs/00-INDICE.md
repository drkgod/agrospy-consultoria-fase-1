# Índice de SPECs — Fase 2

**Fase:** 2 — Captura em campo e avisos
**Gerado em:** 22/10/2026 · **Status das SPECs:** planejadas e revisadas
**Resultado da fase:** o vendedor registra o pós-visita falando, sem formulário, e ninguém perde a data de retorno.

| SPEC | Entrega | Degrau da solução | Critérios | Depende de |
|---|---|---|---|---|
| [SPEC-2-001](spec-2-001-pos-visita-por-audio-no-app.md) | Pós-visita por áudio no app, com fila de rascunhos | reuso + nativo da plataforma | CA-2-01 a CA-2-05 | fase 1 |
| [SPEC-2-002](spec-2-002-avisos-da-proxima-acao.md) | Avisos da próxima ação no celular, com cópia ao gestor | nativo da plataforma + construção mínima | CA-2-06 a CA-2-09 | fase 1 |
| [SPEC-2-003](spec-2-003-agente-de-campo-no-whatsapp.md) | Agente de campo no WhatsApp | nativo da plataforma + construção mínima (API oficial da Meta) | CA-2-10 a CA-2-14 | SPEC-2-001 |
| [SPEC-2-004](spec-2-004-gravacoes-do-plaud-e-outros-gravadores.md) | Gravações do Plaud e de outros gravadores, e teste final da fase | reuso + construção mínima | CA-2-15 a CA-2-18 | SPEC-2-001 (app); SPEC-2-003 (WhatsApp e teste final) |

## Como executar

1. **Construção em sequência**, uma task depois da outra, sem pedir autorização antes de cada uma.
2. **Teste humano só na última task de cada SPEC.** As demais tasks fecham pela prova automática da própria SPEC.
3. **Ordem:**
   1. pós-visita por áudio no app (SPEC-2-001);
   2. avisos (SPEC-2-002);
   3. WhatsApp (SPEC-2-003): a construção segue no modo de teste, e o número real entra quando a Meta liberar e o Diogo autorizar;
   4. gravações e teste final da fase (SPEC-2-004).
4. **Se faltar algo que só a Agrospy pode providenciar**, pare só aquela task e siga com a próxima que não depende disso:
   - a chave do serviço de transcrição;
   - a conta do serviço de notificação;
   - o número e a conta da Meta;
   - a pasta do Drive.

## Fora desta fase

- funil, propostas, ganho e perda com motivo, e painel com indicadores (fase 3);
- vínculo de produtor entre as empresas e importação de planilhas (fase 3);
- RDV e contratos (fase 4);
- sugestões por IA para reabordagem (fase 5);
- qualquer mensagem automática para produtores.

## Tasks

As tasks desta fase estão no arquivo de tarefas da fase e listadas em `## Tasks vinculadas` de cada SPEC.
