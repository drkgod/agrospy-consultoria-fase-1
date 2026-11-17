# STATUS — Agrospy

**Atualizado em:** 17/11/2026 (tarde)
**Fase atual:** 3 — Gestão comercial e decisão, com o app de cara nova (liberada em 17/11/2026)
**Versão no ar:** 0.0.225 (17/11/2026)
**Estado:** fase 3 liberada, com 6 SPECs e 34 tasks. Os IDs são criados pelo portal. Sem teste humano (P11).

| Item | Situação |
|---|---|
| Fase 1 | Concluída em 22/10 (34/34). Histórico em `05_entregas/fase-1/` |
| Fase 2 | Concluída em 17/11 (18/18), sem teste humano. Histórico em `05_entregas/fase-2/` |
| SPEC-3-001 — pendências técnicas da fase 2 | 4 de 5 prontas e provadas em 17/11 (código no GitHub, dados de teste separados, avisos no celular, 90 dias). A pasta do Drive a cada 10 min está **em andamento**: depende do aplicativo OAuth do Google (segredos `GOOGLE_*`); a importação sob demanda segue funcionando |
| SPEC-3-002 — visual de app e navegação | A fazer |
| SPEC-3-003 — telas no novo visual | A fazer |
| SPEC-3-004 — funil, proposta e desfecho | A fazer |
| SPEC-3-005 — painéis e fila priorizada | A fazer |
| SPEC-3-006 — produtor nas duas empresas e importação | A fazer |

## Entradas da Agrospy (só travam a task que depende delas)

| Item | Para quê | Quando o Maestro pede |
|---|---|---|
| Chaves do OneSignal (já usadas em 02/11) | avisos no celular (SPEC-3-001) | só se não estiverem mais no cofre |
| Aplicativo do Google da Agrospy (3 segredos no cofre) | ler a pasta do Drive a cada 10 min (SPEC-3-001) | ao chegar nessa task, com o passo a passo |
| Planilha da carteira | importação (SPEC-3-006) | ao chegar na importação; sem ela, vale o modelo da SPEC |

## Padrões aplicados (o Diogo pode mudar sem travar código)

- **Guarda:** áudios e conversas do assistente ficam 90 dias.
- **Consulta do Comercial:** o Comercial continua vendo todos os produtores da empresa.
- **Etapas do funil:** Necessidade reconhecida, Em amadurecimento, Proposta apresentada e Negociação.
- **Motivos:** os da SPEC-3-004, editáveis pelo Administrador.
- **Sem contato:** 20 dias. Proposta "vencendo": 3 dias.

## Próxima ação

SPEC-3-001, primeira task: "Atualizar o código do app no GitHub". Depois, siga a ordem do `04_fase-atual/fase.md`, sem parar entre as tasks.
