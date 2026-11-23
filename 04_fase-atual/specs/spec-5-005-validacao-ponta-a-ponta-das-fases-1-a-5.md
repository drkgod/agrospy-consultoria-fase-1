# SPEC-5-005 — Validação ponta a ponta das fases 1 a 5 e decisão de go-live

**Fase:** 5
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11) · decisão de go-live: Diogo (champion) e consultor
**Origem no escopo:** Fase 5, "matriz de validação transversal" e critérios de aceite; P11 ("prova automática registrada para cada fase"; a decisão de go-live continua sendo do champion e do consultor); emenda P13 de 23/11/2026 (financeiro, contratos, MCP e mapa entram na validação)
**Degrau da solução:** reuso — junta numa suíte única as provas automáticas que cada SPEC já deixou em `07-sistemas/comercial/tools/` e acrescenta os cenários integrados entre fases. Não cria capacidade nova.

## Contexto e decisões fechadas

- **Estado atual:** cada SPEC fecha pela própria prova. Não há uma execução única que prove o sistema inteiro, nas duas empresas, depois de todas as fases.
- **Estado desejado:** uma regressão automática, executável com um comando, roda os cenários VF-01 a VF-20 nas empresas de teste, gera o relatório final (por fase, critério e evidência) e lista pendências e riscos. Com o relatório, o Diogo e o consultor registram a decisão de go-live.
- **Decisões já fechadas:**
  - **Sem teste humano (P11):** a validação é automática. A única ação de pessoa é a decisão de go-live, registrada no fim, depois do relatório; ela não é teste e não trava nenhuma task de construção.
  - **Item não provado fica pendente.** Nada é aprovado por ausência de erro relatado.
  - **Integrações que dependem da Agrospy** (Gmail, Sicredi, DocuSign produção, e-mail da contabilidade, chaves) entram com o estado real: provado, em espera (com o motivo) ou não se aplica. Em espera não reprova o go-live por si só; entra em "Pendências e riscos residuais".
  - **Execução:** `node 07-sistemas/comercial/tools/regressao/rodar.mjs --app <url> --saida 05_entregas/fase-5/validacao/` contra o app publicado, com as credenciais de teste só nas variáveis do executor.
- **Bloqueios:** nenhum para montar a suíte; as linhas de integrações em espera seguem a regra acima.

## Resultado observável

O Maestro roda a suíte e publica `05_entregas/fase-5/validacao/relatorio-final.md`: tabela das fases 1–5 com cada cenário verde, vermelho ou em espera, o link da evidência, o placar por fase, as pendências da Agrospy e os riscos. O Diogo e o consultor leem e registram "go-live: sim" (ou "não, por…") na task final.

## Limites e dependências

- **Inclui:** `07-sistemas/comercial/tools/regressao/` (orquestrador, cenários integrados e chamada das provas existentes); relatório final; correções de falhas encontradas, feitas na SPEC de origem (bug dentro do aceite) e registradas; registro da decisão de go-live.
- **Fora de escopo:** capacidade nova; teste de carga; auditoria externa de segurança.
- **Entradas e pré-condições:** todas as SPECs das fases 3, 4 e 5 construídas ou em espera registrada; provas das fases 1 e 2 em `07-sistemas/comercial/tools/` (as que não existirem como script são reescritas a partir dos critérios das SPECs arquivadas em `05_entregas/fase-1/` e `05_entregas/fase-2/`).
- **Saídas/artefatos:** suíte, relatório final, evidências em `05_entregas/fase-5/validacao/`, decisão no `STATUS.md` e no `changelog.md`.
- **Dependências e responsáveis:** a Agrospy executa; o Diogo decide o go-live com o consultor.
- **Atores e permissões mínimas:** elenco de teste completo (inclui `teste.administrativo` e `loop.maestro`).
- **Superfícies/arquivos/configurações afetadas:** só `07-sistemas/comercial/tools/regressao/` e `05_entregas/fase-5/validacao/`; correções seguem as superfícies da SPEC de origem.
- **Risco e plano B:** cenário instável (falha intermitente) → roda 3 vezes; passa só se passar nas 3; senão, vermelho com a nota "instável".
- **Rollback ou reversão:** a suíte só lê e grava nas empresas de teste; a migração de limpeza remove os dados de teste no fim.

## Cobertura das fases 1–5

| Fase | Sistema/loop/agente | SPEC/critério de origem | Cenário integrado | Evidência anterior | Prova nesta SPEC |
|---|---|---|---|---|---|
| 1 | acesso por empresa e perfis | SPEC-1-001 / CA-1-01 a CA-1-05 | VF-01 | `05_entregas/fase-1/` | regressão pela API |
| 1 | produtor, visita, oportunidade, sem internet, carteira | SPECs 1-002 a 1-005 | VF-02, VF-03 | `05_entregas/fase-1/` | navegador + API |
| 2 | áudio, avisos, assistente, gravações | SPECs 2-001 a 2-004 | VF-04, VF-05 | `05_entregas/fase-2/` | navegador + API |
| 3 | pendências, visual, telas | SPECs 3-001 a 3-003 | VF-06 | `05_entregas/fase-3/` | capturas + axe |
| 3 | funil, painéis, vínculo e importação (com emenda de 23/11) | SPECs 3-004 a 3-006 | VF-07, VF-08 | `05_entregas/fase-3/` | API + navegador |
| 4 | empresas do lançamento, perfil Administrativo | SPEC-4-001 | VF-09 | `05_entregas/fase-4/spec-4-001/` | API |
| 4 | contas a pagar, e-mail, banco | SPECs 4-002 a 4-004 | VF-10, VF-11 | `05_entregas/fase-4/` | API + injeção |
| 4 | RDV e fechamento | SPECs 4-005, 4-006 | VF-12 | `05_entregas/fase-4/` | navegador + API |
| 4 | contratos, recebimentos, caixa | SPECs 4-007, 4-008 | VF-13 | `05_entregas/fase-4/` | DocuSign demo + API |
| 4 | conector MCP, LOOP-01 | SPECs 4-009, 4-010 | VF-14 | `05_entregas/fase-4/` | cliente MCP + ciclo |
| 5 | auditoria, desligamento, mapa, LOOP-02 | SPECs 5-001 a 5-004 | VF-15, VF-16, VF-17 | `05_entregas/fase-5/` | API + navegador |
| Transversal | isolamento, privacidade, integridade, recuperação, indicadores | todas | VF-18, VF-19, VF-20 | — | suíte |

## Matriz de validação ponta a ponta

| ID | Pré-condição | Procedimento exato | Resultado esperado | Evidência | Responsável | Ação se falhar |
|---|---|---|---|---|---|---|
| VF-01 | elenco de teste | para cada perfil e as duas empresas, listar e abrir registros da outra empresa e recursos sem permissão pela API | 0 itens / 403 / 404 em todos | `vf01.json` | Maestro | corrigir na SPEC-1-001 |
| VF-02 | navegador em modo offline | cadastrar produtor, visita e oportunidade offline; voltar online; forçar reenvio | cada registro uma vez; próxima ação obrigatória | `vf02.json` + capturas | Maestro | SPEC-1-004 |
| VF-03 | carteira de teste | comparar "Minha carteira" e painel do gestor com SQL | iguais | `vf03.json` | Maestro | SPEC-1-005/3-005 |
| VF-04 | áudio de teste | gravar pós-visita, confirmar um rascunho e descartar outro; reenviar o mesmo áudio | confirmado no histórico; descartado fora; sem duplicar | `vf04.json` | Maestro | SPEC-2-001 |
| VF-05 | inscrição de teste | aviso do dia e de atraso com cópia ao gestor; assistente por `teste.rumo` pergunta da Teste A | aceitos pelo OneSignal; assistente sem dado da Teste A | `vf05.json` | Maestro | SPECs 2-002/2-003 |
| VF-06 | app publicado | capturas 390×844 e 1280×800 de todas as rotas da navegação por perfil; axe-core | rolagem horizontal 0; sem falha séria | `vf06/` | Maestro | SPEC-3-002/3-003 |
| VF-07 | oportunidade de teste | funil → proposta → ganho com parcelas → serviço; perda com motivo | condição gravada; motivo obrigatório; painel bate | `vf07.json` | Maestro | SPEC-3-004/3-005 |
| VF-08 | fixtures da SPEC-3-006 | relacionar par; importar com endereço de faturamento, e-mail da NF e KML; desfazer | sem vazamento; campos novos gravados; desfazer certo | `vf08.json` | Maestro | SPEC-3-006 |
| VF-09 | elenco | `teste.administrativo` × rotas financeiras e comerciais | financeiro sim, aprovação não, comercial como Operador | `vf09.json` | Maestro | SPEC-4-001 |
| VF-10 | fixtures de boletos | lançar, alertar (relógio), aprovar, pagar; tentar aprovar por Administrativo e por chave de API | fluxo completo; 403 nos dois | `vf10.json` | Maestro | SPEC-4-002 |
| VF-11 | fixtures de e-mail | injetar 6 e-mails; golpe; Gmail real e Sicredi no estado real | rascunhos, pendência, bloqueio; integrações provadas ou em espera registrada | `vf11.json` | Maestro | SPECs 4-003/4-004 |
| VF-12 | fixtures de RDV | lançar com foto, canhoto → nota, assistente; fechar mês; e-mail; reembolso em contas a pagar | uma despesa por canhoto+nota; totais iguais à base; reembolso criado | `vf12.json` + PDF | Maestro | SPECs 4-005/4-006 |
| VF-13 | DocuSign demo | venda ganha → contrato → envio → assinado (evento) → 3 recebimentos → aviso de cobrança → baixa → fluxo de caixa | encadeamento completo; caixa igual ao esperado | `vf13.json` | Maestro | SPECs 4-007/4-008 |
| VF-14 | chaves de teste | cliente MCP: 8 ferramentas, permissões, `lancar_despesa_rdv`; ciclo controlado do LOOP-01 | números iguais às telas; ciclo e veredito | `vf14.json` | Maestro | SPECs 4-009/4-010 |
| VF-15 | todas as ações auditadas | executar cada ação e conferir `auditoria`; tentar editar linha | 1 linha por ação; edição recusada | `vf15.json` | Maestro | SPEC-5-001 |
| VF-16 | usuário de teste | desligar com transferência; mapa KML na ficha e na carteira | carteira no destino, acesso cortado; contornos e permissões certos | `vf16.json` + capturas | Maestro | SPECs 5-002/5-003 |
| VF-17 | fixture do LOOP-02 | sugestões, aceitar, conversão, ciclo | seleção, conversão e veredito certos | `vf17.json` | Maestro | SPEC-5-004 |
| VF-18 | todas as respostas da suíte | varrer respostas e logs do Skip por CPF, telefone, e-mail, linha digitável, segredo | 0 ocorrências fora dos campos autorizados | `vf18.json` | Maestro | SPEC de origem |
| VF-19 | falhas simuladas | Groq, OneSignal, Gmail, DocuSign e MCP desligados por rota de teste; repetir operações | nenhum dado perdido nem duplicado; recuperação ao religar | `vf19.json` | Maestro | SPEC de origem |
| VF-20 | registros do sistema | calcular os indicadores do kickoff (intervalo entre contatos, tempo até desfecho, conversão) pela rota do painel e por SQL | iguais; período e fórmula no relatório | `vf20.json` | Maestro | SPEC-3-005 |

## Aceite global

- **Roteiro do champion:** nenhum teste. O Diogo lê o `relatorio-final.md` (resumo de uma página no topo) e responde se libera o uso pleno.
- **Aprovadores:** Diogo (champion) e consultor.
- **Critério de go-live/encerramento:** VF-01 a VF-20 verdes, exceto linhas em espera por dependência da Agrospy, listadas com o motivo; nenhum vermelho aberto.
- **Pendências e riscos residuais:** gerados pela suíte (integrações em espera, CL-PEND abertas, cenários instáveis).
- **Decisão quando houver falha:** corrigir na SPEC de origem (bug dentro do aceite) e rodar de novo; mudança além do aceite vira emenda da consultoria; com vermelho aberto, não liberar.

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; `00-INDICE.md` (regras comuns); as seções TDD de todas as SPECs em `04_fase-atual/specs/` e as SPECs arquivadas em `05_entregas/fase-1/` e `05_entregas/fase-2/`; as ferramentas em `07-sistemas/comercial/tools/`.
2. **Contexto técnico:** Node 20 com `playwright` e `@axe-core/playwright` nas versões fixas da SPEC-3-002; credenciais de teste só em variáveis de ambiente do executor.
3. **Alterar somente:** `07-sistemas/comercial/tools/regressao/` e `05_entregas/fase-5/validacao/`; correções seguem a SPEC de origem.
4. **Não alterar:** dados das empresas reais.
5. **Executar nesta ordem:** (1) orquestrador e chamada das provas existentes; (2) cenários integrados VF-07, VF-12, VF-13; (3) transversais VF-18 a VF-20; (4) rodada completa; (5) correções e nova rodada; (6) relatório final; (7) pedir a decisão de go-live, uma vez.
6. **Parar e pedir validação quando:** só no fim, para a decisão de go-live, que não bloqueia nada além do encerramento.
7. **Estado válido ao parar:** sistema publicado intacto; dados de teste removidos.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática; a decisão de go-live é o último passo. Ponto de aprovação: nenhum antes do relatório final.

## Checklist de execução

- [ ] Suíte com VF-01 a VF-20.
- [ ] Rodada completa com 3 repetições nos instáveis.
- [ ] Falhas corrigidas na SPEC de origem e rodada final verde.
- [ ] Relatório final com pendências e riscos.
- [ ] Decisão de go-live registrada no `STATUS.md` e no `changelog.md`.

## Critérios de aceite

- [ ] **CA-5-13:** `rodar.mjs` executa os 20 cenários com um comando contra o app publicado e grava um JSON por cenário em `05_entregas/fase-5/validacao/`; cada linha da tabela "Cobertura das fases 1–5" tem cenário e evidência.
- [ ] **CA-5-14:** a rodada final tem VF-01 a VF-20 verdes ou em espera com motivo de dependência da Agrospy; nenhum vermelho; cenários instáveis passaram nas 3 repetições; VF-18 com 0 ocorrências.
- [ ] **CA-5-15:** `relatorio-final.md` traz o resumo de uma página, a tabela por fase com placar e links, as pendências (CL-PEND) e os riscos; a decisão de go-live do Diogo e do consultor está registrada com data no `STATUS.md` e no `changelog.md`.

## TDD da SPEC

**Empresas nas provas:** Teste A e Teste B. **Fixtures:** as das SPECs de origem, recriadas pela suíte e removidas no fim.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | a suíte pega falha (CA-5-13) | rodar VF-01 com uma regra de acesso relaxada numa empresa de teste por rota de teste (só superusuário) e depois restaurar | VF-01 vermelho (esperado); restaurado, verde | `vf01.json` das duas rodadas |
| GREEN 1 | suíte (CA-5-13) | `node 07-sistemas/comercial/tools/regressao/rodar.mjs --app <url> --saida 05_entregas/fase-5/validacao/` | 20 JSONs; cobertura completa | pasta |
| GREEN 2 | rodada final (CA-5-14) | rodar depois das correções | critério do CA-5-14 | pasta + resumo |
| REFACTOR/REGRESSÃO | relatório e decisão (CA-5-15) | gerar o relatório; registrar a decisão | relatório completo; decisão com data | relatório + `STATUS.md` |

**Caminhos de erro obrigatórios:** cenário vermelho, instável, integração em espera, dado de teste esquecido (a limpeza confere 0 registros "TESTE —" nas empresas reais).
**Evidência exigida:** `05_entregas/fase-5/validacao/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-5/validacao/` e o log do Skip. A decisão de go-live do Diogo e do consultor é o registro final do projeto, feita sobre o relatório, sem roteiro de teste.

## Handoff e operação

- **Como demonstrar:** abrir o relatório final.
- **Como operar depois:** rodar `rodar.mjs` antes de cada mudança grande no sistema.
- **Como monitorar:** a suíte é a regressão oficial do sistema.
- **Pendência conhecida:** as linhas em espera do relatório.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Validar o sistema inteiro de ponta a ponta | Agrospy | SPEC-5-005 | CA-5-13 a CA-5-15 | todas as subtasks | evidências das subtasks | SPECs 5-001 a 5-004 construídas |
| id pendente | Montar a regressão automática das fases 1 a 5 | Agrospy | SPEC-5-005 | CA-5-13 | RED 1 → GREEN 1 | pasta de validação | SPECs anteriores |
| id pendente | Rodar a validação e publicar o relatório final | Agrospy | SPEC-5-005 | CA-5-14, CA-5-15 | GREEN 2 + REFACTOR (relatório) | relatório final | suíte |
| id pendente | Registrar a decisão de go-live com o Diogo | Agrospy | SPEC-5-005 | CA-5-15 | REFACTOR (decisão) | `STATUS.md` + `changelog.md` | relatório final |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
