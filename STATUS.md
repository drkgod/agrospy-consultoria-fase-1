# STATUS — Agrospy

**Atualizado em:** 17/11/2026
**Fase atual:** 2 — Captura em campo e avisos
**Versão no ar:** 0.0.213
**Estado:** fase 2 em andamento. SPEC-2-001 e SPEC-2-003 concluídas e testadas pelo Diogo. SPEC-2-002 com a parte "dentro do app" pronta e provada; a notificação no celular foi movida para o fim da fase (emenda de 02/11/2026). SPEC-2-004 concluída em 11/11. Falta religar a notificação no celular, provar a entrega e rodar a regressão automática que fecha a fase. **Sem teste humano** (emenda de 17/11/2026).

| Item | Situação |
|---|---|
| SPEC-2-001 — pós-visita por áudio | Concluída e aprovada pelo Diogo (30/10). RN-50 = 90 dias de guarda (decisão do Diogo em 09/11; na última cópia do código a rotina estava em 30, e muda no fechamento da fase) |
| SPEC-2-003 — assistente de campo | Concluída e aprovada pelo Diogo em 09/11 ("funcionou no app"): tela, pós-visita por texto, perguntas por texto e voz |
| SPEC-2-002 — avisos | Lista, contador, aviso do dia, atraso e cópia ao gestor prontos e provados (09/11). Notificação no celular: código pronto e já entregue em teste, mas fora da ordem atual — vai para 18–19/11 |
| SPEC-2-004 — Plaud e gravadores | Envio pelo app e importação sob demanda da pasta prontos e provados (09 e 11/11). A fase fecha pela regressão automática (task 2bb2808a) |
| Fase 1 | Concluída em 22/10 (34/34); histórico em `05_entregas/fase-1/` |

## Ordem da fase (emenda de 02/11/2026)

1. Avisos **dentro do app** (lista, contador, aviso de atraso, cópia ao gestor) — sem conta externa
2. Assistente de campo
3. Gravações do Plaud e outros gravadores
4. Notificação no celular pelo OneSignal + prova automática da entrega (18/11)
5. Regressão automática de ponta a ponta e fechamento da fase (19/11), sem teste humano

## Entradas da Agrospy (só travam a task que depende delas)

| Item | Para quê | Quando o Maestro pede |
|---|---|---|
| Pasta do Google Drive de cada empresa | gravações pela pasta (SPEC-2-004) | **resolvida em 11/11**: pasta compartilhada; leitura provada. Automação de 10 min depende de credencial Google no Skip (não suportada) — ficou sob demanda |
| Conta gratuita do OneSignal | notificação no celular (SPEC-2-002) | **só ao chegar na parte do celular, no fim da fase** |

## Decisões com padrão aplicado (o Diogo pode mudar, sem travar código)

- Guarda das conversas do assistente: 90 dias
- O perfil Comercial continua consultando o cadastro de todos os produtores da empresa

## Próxima ação

2ae01199: religar a notificação no celular (código da 0.0.177) → b33bfdb7: prova automática da entrega → 2bb2808a: RN-50 em 90 dias, regressão automática de ponta a ponta e limpeza das contas de teste. Nenhuma task espera teste de pessoa (`04_fase-atual/emenda-2026-11-17-sem-teste-humano.md`).
