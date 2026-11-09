# STATUS — Agrospy

**Atualizado em:** 09/11/2026
**Fase atual:** 2 — Captura em campo e avisos
**Versão no ar:** 0.0.204
**Estado:** fase 2 em andamento. SPEC-2-001 e SPEC-2-003 concluídas e testadas pelo Diogo. SPEC-2-002 com a parte "dentro do app" pronta e provada; a notificação no celular foi movida para o fim da fase (emenda de 02/11/2026). Falta a SPEC-2-004 (Plaud/Drive) e o teste final em 19/11.

| Item | Situação |
|---|---|
| SPEC-2-001 — pós-visita por áudio | Concluída e aprovada pelo Diogo (30/10). RN-50 = 30 dias de guarda; Drive desnecessário |
| SPEC-2-003 — assistente de campo | Concluída e aprovada pelo Diogo em 09/11 ("funcionou no app"): tela, pós-visita por texto, perguntas por texto e voz |
| SPEC-2-002 — avisos | Lista, contador, aviso do dia, atraso e cópia ao gestor prontos e provados (09/11). Notificação no celular: código pronto e já entregue em teste, mas fora da ordem atual — vai para 18–19/11 |
| SPEC-2-004 — Plaud e gravadores | Não iniciada. Prazo 19/11 |
| Fase 1 | Concluída em 22/10 (34/34); histórico em `05_entregas/fase-1/` |

## Ordem da fase (emenda de 02/11/2026)

1. Avisos **dentro do app** (lista, contador, aviso de atraso, cópia ao gestor) — sem conta externa
2. Assistente de campo
3. Gravações do Plaud e outros gravadores
4. Notificação no celular pelo OneSignal + teste dos avisos no celular (18–19/11)
5. Teste final da fase (19/11)

## Entradas da Agrospy (só travam a task que depende delas)

| Item | Para quê | Quando o Maestro pede |
|---|---|---|
| Pasta do Google Drive de cada empresa | gravações pela pasta (SPEC-2-004) | na task da pasta |
| Conta gratuita do OneSignal | notificação no celular (SPEC-2-002) | **só ao chegar na parte do celular, no fim da fase** |

## Decisões pendentes do Diogo (não travam código)

- Prazo de guarda das conversas do assistente (sugerido: 90 dias)
- Se o perfil Comercial consulta o cadastro de todos os produtores da empresa ou só a própria carteira

## Próxima ação

SPEC-2-004: envio de gravações do Plaud e outros gravadores pelo app (16/11), depois importação da pasta do Drive (18/11), depois o teste final (19/11).
