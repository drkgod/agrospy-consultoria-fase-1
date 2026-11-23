# STATUS — Agrospy

**Atualizado em:** 23/11/2026 (emenda da consultoria: fases 4 e 5 liberadas na mesma fila)
**Fases liberadas:** 3 — Gestão comercial e decisão (17/11/2026); 4 — Financeiro, RDV e contratos e 5 — Consolidação, mapa e validação (23/11/2026), numa fila só
**Versão no ar:** 0.0.232 (18/11/2026)
**Estado:** fila única com 21 SPECs (6 + 10 + 5) e 100 tasks (fase 3: 36, com 2 novas da emenda da SPEC-3-006; fase 4: 47; fase 5: 17). Os IDs são criados pelo portal. Sem teste humano (P11).

| Item | Situação |
|---|---|
| Fase 1 | Concluída em 22/10 (34/34). Histórico em `05_entregas/fase-1/` |
| Fase 2 | Concluída em 17/11 (18/18), sem teste humano. Histórico em `05_entregas/fase-2/` |
| SPEC-3-001 — pendências técnicas da fase 2 | 4 de 5 prontas e provadas em 17/11 (código no GitHub, dados de teste separados, avisos no celular, 90 dias). A pasta do Drive a cada 10 min está **em andamento**: depende do aplicativo OAuth do Google (segredos `GOOGLE_*`); a importação sob demanda segue funcionando |
| SPEC-3-002 — visual de app e navegação | 3 de 4 prontas em 18/11: tokens por empresa (`src/lib/cores.ts`), AppShell com abas no celular e menu lateral no computador, e vitrine em `/vitrine` (provada nos 2 tamanhos e 2 empresas). ícone em PNG no manifest e no apple-touch-icon (o iPhone ignora SVG). **Falta** um PNG quadrado 512x512 próprio: binário não sobe pelo MCP do Skip e precisa ser gerado de outra forma |
| SPEC-3-003 — telas no novo visual | A fazer |
| SPEC-3-004 — funil, proposta e desfecho | A fazer |
| SPEC-3-005 — painéis e fila priorizada | A fazer |
| SPEC-3-006 — produtor nas duas empresas e importação | A fazer. Emenda de 23/11/2026: endereço de faturamento, e-mail da nota e arquivo KML (2 tasks novas) |
| Fase 4 — SPEC-4-001 a SPEC-4-010 | A fazer, logo depois da fase 3: empresas do lançamento e perfil Administrativo, contas a pagar com aprovação, boletos por e-mail, Sicredi, RDV, fechamento do RDV, contratos com DocuSign, recebimentos e caixa, conector MCP, LOOP-01 |
| Fase 5 — SPEC-5-001 a SPEC-5-005 | A fazer, depois da fase 4: auditoria, desligamento de usuário, mapa KML, LOOP-02, validação ponta a ponta e decisão de go-live |

## Entradas da Agrospy (só travam a task que depende delas)

| Item | Para quê | Quando o Maestro pede |
|---|---|---|
| Chaves do OneSignal (já usadas em 02/11) | avisos no celular (SPEC-3-001) | só se não estiverem mais no cofre |
| Aplicativo do Google da Agrospy (3 segredos no cofre) | ler a pasta do Drive a cada 10 min (SPEC-3-001) | ao chegar nessa task, com o passo a passo |
| Planilha da carteira | importação (SPEC-3-006) | ao chegar na importação; sem ela, vale o modelo da SPEC |
| CNPJ e razão social da AgroSpy, AgroSmart e Rumo Agro | empresas do lançamento (SPEC-4-001) | pela tela; não trava |
| E-mail da contabilidade de cada empresa (Rumo Agro: administrativo; AgroSpy/AgroSmart: financeiro) | envio do fechamento do RDV (SPEC-4-006) | pela tela; o envio espera |
| Caixa de e-mail dos boletos e autorização do Gmail | leitura dos boletos (SPEC-4-003) | na task "Ligar a caixa de e-mail dos boletos ao sistema" |
| Resposta do Sicredi sobre API de DDA e de pagamento, e credenciais | SPEC-4-004 | na primeira task da SPEC-4-004; sem API, vale a lista aprovada |
| Conta DocuSign da Agrospy e segredos no cofre | assinatura de contratos (SPEC-4-007) | ao chegar no envio; a construção usa a conta de demonstração |
| Modelo de contrato real (multas, prazos, entrega) | SPEC-4-007 | sem ele, vale o modelo fictício, que não vai para cliente |
| Conector MCP no Maestro dos sócios | SPEC-4-009 | passo a passo em `07-sistemas/comercial/conector-mcp.md` |
| Exemplos de arquivos KML | mapa (SPEC-5-003) | sem eles, vale o KML fictício |
| Envio de e-mail no plano do Skip | avisos por e-mail e fechamento (SPECs 4-001 e 4-006) | só se não funcionar |

## Padrões aplicados (o Diogo pode mudar sem travar código)

- **Guarda:** áudios e conversas do assistente ficam 90 dias.
- **Consulta do Comercial:** o Comercial continua vendo todos os produtores da empresa.
- **Etapas do funil:** Necessidade reconhecida, Em amadurecimento, Proposta apresentada e Negociação.
- **Motivos:** os da SPEC-3-004, editáveis pelo Administrador.
- **Sem contato:** 20 dias. Proposta "vencendo": 3 dias.

## Próxima ação

Fase 3, SPEC-3-003: "Redesenhar Avisos, Assistente, Visão do gestor, a entrada e as telas do Administrador". Depois, siga a fila: resto da SPEC-3-003 → SPEC-3-004 → SPEC-3-005 → SPEC-3-006 → fase 4 (`04_fase-atual/fase-4.md`) → fase 5 (`04_fase-atual/fase-5.md`), sem parar entre as tasks nem entre as fases. O que depender da Agrospy fica em espera e é avisado uma vez no fim.
