# Índice de SPECs — Fase 1

**Fase:** 1 — MVP comercial multiempresa no celular · **Período:** 06/10/2026 a 20/10/2026
**Gerado em:** 05/10/2026 · **Status das SPECs:** planejadas e revisadas (painel em `fallback_serial`)

| SPEC | Entrega | Degrau da solução | Critérios | Depende de |
|---|---|---|---|---|
| [SPEC-1-001](spec-1-001-acesso-por-empresa-e-perfis.md) | Acesso por empresa e perfis | nativo da plataforma (Skip) | CA-1-01 a CA-1-05 | — |
| [SPEC-1-002](spec-1-002-cadastro-de-produtor-e-propriedade.md) | Cadastro de produtor e propriedade com origem e responsável | nativo da plataforma (Skip) | CA-1-06 a CA-1-09 | SPEC-1-001 |
| [SPEC-1-003](spec-1-003-visita-e-oportunidade-com-proxima-acao.md) | Visita e oportunidade com próxima ação obrigatória | nativo da plataforma (Skip) | CA-1-10 a CA-1-14 | SPEC-1-001, SPEC-1-002 |
| [SPEC-1-004](spec-1-004-uso-no-celular-sem-internet.md) | Uso no celular sem internet e sincronização | construção mínima (app instalável + fila local) | CA-1-15 a CA-1-19 | SPEC-1-001 a SPEC-1-003 |
| [SPEC-1-005](spec-1-005-carteira-e-visao-do-gestor.md) | Minha carteira, visão do gestor e demonstração da fase | reuso | CA-1-20 a CA-1-24 | SPEC-1-001 a SPEC-1-004 |

## Ordem de execução

Preparação (06/10) → acesso e perfis (07–08/10) → cadastro (09/10) → visita e oportunidade (13–14/10) →
carteira e visão do gestor (15/10) → uso sem internet (15–16/10) → testes de acesso e cadastro da
equipe (16/10) → testes de falha de envio e demonstração (19/10) → call de validação e fechamento (20/10).

## Fora desta fase

Avisos no celular e captura por WhatsApp, Plaud e Drive (fase 2); funil, ganho/perda, propostas e
painel com indicadores (fase 3); RDV e contratos (fase 4); vínculo de produtor entre as empresas e
importação de planilhas (fase 3); edição de cadastro sem internet; qualquer uso de IA.

## Tasks

As tasks desta fase estão no arquivo de tarefas da fase (fonte única de status, responsável e prazo)
e listadas em `## Tasks vinculadas` de cada SPEC.
