# SPEC-4-008 — Recebimentos, aviso do boleto de cobrança e fluxo de caixa por empresa

**Fase:** 4
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** emenda P13 de 23/11/2026 (contrato assinado alimenta o fluxo de recebimentos por empresa; boleto de cobrança continua manual, com aviso no app e por e-mail ao administrativo; cada empresa tem o próprio fluxo de caixa com entradas e saídas; fluxo de caixa simples entra; ERP, imposto e emissão de NF continuam fora)
**Degrau da solução:** nativo + construção mínima — coleções, rotinas e rotas do Skip; cálculo do fluxo no servidor sobre `recebimentos`, `contas_pagar` e `movimentos_caixa`.

## Contexto e decisões fechadas

- **Estado atual:** a SPEC-4-007 publica o evento de contrato assinado com as parcelas; a SPEC-4-002 guarda as contas a pagar. Não há visão de recebimentos nem de caixa.
- **Estado desejado:** cada parcela do contrato vira um recebimento da empresa contratada. Dez dias antes do vencimento, o Administrativo recebe no app e por e-mail "Emitir o boleto da parcela 2/3 do produtor X, vence em 30/03". Ele emite no banco, anexa o boleto no recebimento e, quando o dinheiro cai, dá baixa. Cada empresa (AgroSpy, AgroSmart, Rumo Agro) tem o seu fluxo de caixa: entradas e saídas previstas e realizadas, por semana ou mês, com saldo.
- **Decisões já fechadas:**
  - **Boleto de cobrança é manual.** O sistema não emite boleto nem envia cobrança ao produtor; avisa e guarda o arquivo.
  - **Fontes do fluxo de caixa (padrão desta SPEC):**
    - **entradas:** `recebimentos` (previsto pela data de vencimento; realizado pela data do recebimento);
    - **saídas:** `contas_pagar` com status `lancada` ou `aprovada` (previsto pela `pagamento_previsto`) e `paga` (realizado por `pago_em`); `rascunho`, `recusada` e `cancelada` não entram;
    - **lançamentos avulsos:** `movimentos_caixa` (entrada ou saída manual, ex.: aporte, tarifa, venda sem contrato), lançados pelo financeiro;
    - **saldo inicial** por empresa do lançamento e data, informado pelo Administrador.
  - Despesas de RDV entram no caixa pelo reembolso (conta a pagar criada na SPEC-4-006) e pela fatura do cartão (boleto lançado), nunca despesa por despesa, para não contar duas vezes.
  - **Valores em centavos**; cálculo sempre no servidor; nada soma empresas diferentes sem o filtro "Todas as empresas do tenant", que mostra as colunas separadas e o total.
  - **Recebimento manual:** o financeiro pode lançar um recebimento avulso (sem contrato), com empresa do lançamento obrigatória.
- **Bloqueios:** nenhum.

## Resultado observável

1. O contrato da Fazenda Santa Rita é assinado e aparecem 3 recebimentos da AgroSpy: entrada (vence hoje), 30/03 e 30/07.
2. Em 20/03, a funcionária recebe no app e por e-mail o aviso para emitir o boleto da parcela de 30/03. Ela anexa o PDF; o aviso para de repetir.
3. Em 30/03, o dinheiro cai e ela dá baixa: "Recebido em 30/03, R$ 20.000,00".
4. O Diogo abre "Fluxo de caixa", escolhe AgroSpy, visão mensal: entradas, saídas, saldo do mês e saldo acumulado, com previsto e realizado lado a lado. Troca para AgroSmart e vê só a AgroSmart.

## Limites e dependências

- **Inclui:** coleções `recebimentos`, `movimentos_caixa` e `saldos_iniciais`; criação das parcelas pelo evento de contrato assinado; rotina do aviso de cobrança; rotas de anexar boleto, baixa, cancelar e lançar avulso; rota e tela do fluxo de caixa; tela "Recebimentos".
- **Fora de escopo:** emissão de boleto ou Pix de cobrança; envio de cobrança ao produtor; conciliação por extrato; DRE, imposto, NF, ERP; juros e multa de atraso calculados.
- **Entradas e pré-condições:** SPECs 4-001, 4-002 e 4-007 no ar.
- **Saídas/artefatos:** migrações, hooks, rotas, telas; evidências em `05_entregas/fase-4/spec-4-008/`.
- **Dependências e responsáveis:** a Agrospy executa; o Administrador informa o saldo inicial de cada empresa (quando quiser; sem ele, o saldo começa em zero com o aviso "Saldo inicial não informado").
- **Atores e permissões mínimas:** ver recebimentos e fluxo de caixa: Administrador, Gestão, Administrativo; anexar boleto, dar baixa, lançar avulso: Administrador, Gestão, Administrativo; cancelar recebimento e informar saldo inicial: Administrador; Comercial e Operador: nada.
- **Superfícies/arquivos/configurações afetadas:** migrações das três coleções; `pocketbase/hooks/recebimentos_rotas.js`, `recebimentos_rotina.js`, `caixa_rotas.js`, `lib/caixa.js`; `docusign_connect.js`/`lib/docusign.js` só para chamar `criarParcelasDoContrato` no evento; `src/pages/financeiro/Recebimentos.tsx`, `FluxoCaixa.tsx`, `MovimentoAvulso.tsx`; `src/services/caixa.ts`, `recebimentos.ts`; `navegacao.ts`; `vitrine.ts`.
- **Risco e plano B:** período longo lento → a rota limita a 24 meses por consulta e calcula por agregação no banco (SQL `GROUP BY` pela API de consulta do Skip), nunca registro a registro no navegador.
- **Rollback ou reversão:** migrações reversíveis; recebimento cancelado com motivo; contrato cancelado depois de assinado não apaga parcelas recebidas (cancela só as não recebidas, com motivo "contrato cancelado").

## Dados e integrações

| Coleção | Campos (tipo) | Regras de API |
|---|---|---|
| `recebimentos` | `empresa`, `empresa_lancamento` (req), `contrato` (rel, opcional), `produtor` (rel, opcional), `descricao` (≤ 300), `parcela` (número; 0 = entrada), `parcelas_total` (número), `valor_centavos` (> 0), `vencimento` (req), `status` (`previsto` \| `boleto_anexado` \| `recebido` \| `cancelado`), `atrasado` (bool, calculado pela rotina), `boleto` (arquivo pdf/jpg/png ≤ 10 MB, protegido), `boleto_anexado_por`, `boleto_anexado_em`, `recebido_em` (data), `valor_recebido_centavos`, `comprovante` (arquivo opcional), `baixa_por`, `origem` (`contrato` \| `manual`), `motivo_cancelamento`, `chave_unica` (contrato + parcela, único), `created`/`updated` | list/view: `acesso_financeiro` · create/update/delete: null (só rotas e hooks) |
| `movimentos_caixa` | `empresa`, `empresa_lancamento` (req), `tipo` (`entrada` \| `saida`), `data` (req), `valor_centavos` (> 0), `descricao` (3–300), `realizado` (bool), `lancado_por`, `cancelado` (bool), `motivo_cancelamento` | list/view: `acesso_financeiro` · create/update: só rotas · delete: null |
| `saldos_iniciais` | `empresa`, `empresa_lancamento` (único), `data`, `valor_centavos` (inteiro, pode ser negativo), `informado_por` | list/view: `acesso_financeiro` · create/update: só Administrador pela rota · delete: null |

| Rota | Quem | Entrada | Efeito | Erros |
|---|---|---|---|---|
| `POST /backend/v1/recebimentos` | financeiro | `{empresa_lancamento, produtor?, descricao, valor_centavos, vencimento}` | recebimento avulso `previsto` | 400 |
| `POST /backend/v1/recebimentos/{id}/boleto` | financeiro | arquivo | `boleto_anexado`; para os avisos | 409 se `recebido`/`cancelado` |
| `POST /backend/v1/recebimentos/{id}/baixa` | financeiro | `{recebido_em, valor_recebido_centavos, comprovante?}` | `recebido` | 400 data futura; 409 status |
| `POST /backend/v1/recebimentos/{id}/cancelar` | Administrador | `{motivo}` | `cancelado` | 403; 409 se `recebido` |
| `POST /backend/v1/caixa/movimentos` e `/{id}/cancelar` | financeiro | campos | cria/cancela | 400 |
| `PUT /backend/v1/caixa/saldo-inicial` | Administrador | `{empresa_lancamento, data, valor_centavos}` | grava | 403 |
| `GET /backend/v1/caixa/fluxo?empresa&empresa_lancamento\|todas&de&ate&agrupar=semana\|mes` | financeiro | — | por período: entradas e saídas previstas e realizadas, saldo do período e acumulado (a partir do saldo inicial), e a lista de itens de cada período | 400 período > 24 meses; 403 |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-170 | contrato assinado | `criarParcelasDoContrato` cria 1 recebimento por item de `contratos.parcelas` (entrada = parcela 0), com a empresa do lançamento do contrato; repetido não duplica (`chave_unica`) | — | P13 |
| RN-171 | aviso de cobrança | rotina diária às `hora_alerta`: recebimento `previsto` com vencimento em até `dias_aviso_cobranca` dias → aviso ao Administrativo (e Gestão) "Emitir o boleto da parcela {n}/{total} de {produtor}, vence {data}", no app e por e-mail se `aviso_email_administrativo`; repete a cada 2 dias até `boleto_anexado` | sem Administrativo → Administrador | P13 |
| RN-172 | atraso | rotina diária: `previsto` ou `boleto_anexado` com vencimento < hoje → `atrasado = true` e aviso único ao Administrador e à Gestão | — | P13 |
| RN-173 | fluxo de caixa | entradas = recebimentos não cancelados (previsto por vencimento, realizado por `recebido_em` com `valor_recebido`) + movimentos de entrada; saídas = contas `lancada`/`aprovada` (previsto por `pagamento_previsto`) e `paga` (realizado por `pago_em`) + movimentos de saída; saldo acumulado começa no saldo inicial; previsto já realizado não conta duas vezes (o item realizado sai da coluna prevista) | — | P13 |
| RN-174 | contrato cancelado depois de assinado | recebimentos não recebidos → `cancelado` com motivo "contrato cancelado" | — | P13 |

## Fluxo e regras

1. **Recebimentos** (`/financeiro/receber`): pílulas A vencer, Boleto anexado, Atrasados, Recebidos; filtro por empresa do lançamento; cada item com produtor, parcela, valor, vencimento; ações "Anexar boleto", "Dar baixa"; botão "Novo recebimento".
2. **Fluxo de caixa** (`/financeiro/caixa`): seletor de empresa do lançamento (ou "Todas", em colunas), período e agrupamento; tabela por período (entradas, saídas, saldo, acumulado; previsto × realizado); toque no período abre os itens; "Lançar movimento" e "Saldo inicial" (Administrador).

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | contrato com entrada + 2 parcelas assinado | 3 recebimentos | — |
| Principal | 10 dias antes | 1 aviso app + 1 e-mail | — |
| Limite | evento de assinado repetido | sem novos recebimentos | — |
| Limite | conta paga que estava prevista | sai do previsto e entra no realizado | — |
| Falha | Comercial abre o fluxo | 403 | — |
| Falha | baixa com data futura | 400 | — |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; SPECs 4-001, 4-002 e 4-007; `00-INDICE.md` (regras comuns).
2. **Contexto técnico do Skip:** o da SPEC-4-001; agregação com `$app.db().newQuery(...)` com parâmetros, nunca concatenando texto do usuário.
3. **Alterar somente:** as superfícies listadas.
4. **Não alterar:** regras de `contas_pagar` e `contratos` (só ler; no Connect, só a chamada de `criarParcelasDoContrato`).
5. **Executar nesta ordem:** (1) `recebimentos` e criação pelas parcelas; (2) anexar boleto, baixa, cancelar, avulso; (3) rotina de aviso e atraso; (4) `movimentos_caixa`, `saldos_iniciais` e rota do fluxo; (5) telas e provas visuais.
6. **Parar e pedir validação quando:** nenhuma parada prevista.
7. **Estado válido ao parar:** contas a pagar e contratos funcionam como antes.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

Sistema da SPEC-3-002. Recebimentos em `ListaItem` com `Selo` (A vencer, Boleto anexado, Atrasado em cor de alerta, Recebido); fluxo de caixa com `CartaoNumero` (entradas, saídas, saldo do período) e tabela rolável só na horizontal dentro do próprio cartão no celular (a página não rola na horizontal); gráfico de barras entradas × saídas por período com cores dos tokens; previsto em tom claro e realizado em tom cheio; estados carregando, vazio, erro e sem internet; vitrine com um fluxo fictício de 6 meses.

## Checklist de execução

- [ ] Parcelas do contrato viram recebimentos sem duplicar.
- [ ] Aviso de cobrança no app e por e-mail, até anexar o boleto.
- [ ] Baixa, cancelamento, avulso e atraso.
- [ ] Fluxo de caixa por empresa, previsto × realizado, batendo com a base.
- [ ] Capturas, axe-core e evidências em `05_entregas/fase-4/spec-4-008/`.

## Critérios de aceite

- [ ] **CA-4-27:** o evento de contrato assinado da fixture cria exatamente 3 recebimentos na empresa contratada (entrada + 2), e o evento repetido não cria nada; recebimento avulso exige empresa do lançamento.
- [ ] **CA-4-28:** com o relógio de teste, 10 dias antes do vencimento sai 1 aviso no app e 1 registro de e-mail ao Administrativo; a cada 2 dias repete até o boleto ser anexado e depois para; vencido sem baixa vira `atrasado` com 1 aviso ao Administrador e à Gestão.
- [ ] **CA-4-29:** baixa exige data não futura e só vale para `previsto`/`boleto_anexado`; só Administrador cancela; Comercial e Operador recebem 403 em todas as rotas.
- [ ] **CA-4-30:** para a fixture de 2 empresas do lançamento, o fluxo mensal de cada uma (entradas, saídas, previsto, realizado, saldo acumulado a partir do saldo inicial) bate com o cálculo direto da fixture; uma conta paga não aparece no previsto e no realizado ao mesmo tempo; o filtro de uma empresa nunca inclui itens da outra.

## TDD da SPEC

**Empresas nas provas:** Teste A ("TESTE — Spy" e "TESTE — Smart"). **Fixture:** migração de teste com saldo inicial de cada empresa, 6 contas a pagar em status variados (2 pagas), 4 recebimentos (1 recebido) e 3 movimentos, com o resultado mensal esperado escrito em `05_entregas/fase-4/fixtures/caixa-esperado.json`. **Relógio de teste** para as rotinas.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | duplicidade (CA-4-27) | chamar `criarParcelasDoContrato` 2× antes do índice único | 6 recebimentos (falha esperada); depois, 3 | consulta |
| GREEN 1 | parcelas e avulso (CA-4-27) | evento de assinado da fixture da SPEC-4-007 (simulador com HMAC); repetir; avulso sem empresa | 3; 0 novos; 400 | consultas |
| GREEN 2 | avisos (CA-4-28) | rotina com `agora` em D−10, D−8, anexar boleto, D−6; e D+1 sem baixa | 1, 1, 0 avisos de cobrança; 1 aviso de atraso | consultas `avisos` e `envios_email` |
| GREEN 3 | baixa e acesso (CA-4-29) | baixa com data futura; baixa de cancelado; cancelar como `teste.administrativo` e `teste.admin.a`; rotas como `teste.comercial1` | 400; 409; 403 e 200; 403 | respostas |
| GREEN 4 | fluxo (CA-4-30) | `GET /caixa/fluxo` mensal para cada empresa e "todas" | igual a `caixa-esperado.json`; nenhuma linha da outra empresa | respostas + diff |
| REFACTOR/REGRESSÃO | regressão e visual | (a) SPEC-4-002 GREEN 4/5 e SPEC-4-007 GREEN 4; (b) período de 25 meses dá 400; (c) capturas 390×844 e 1280×800, rolagem horizontal da página 0, axe-core | sem diferença; 400; sem falha séria | relatório |

**Caminhos de erro obrigatórios:** evento repetido, sem empresa, data futura, status errado, perfil sem permissão, período longo, sem saldo inicial.
**Evidência exigida:** em `05_entregas/fase-4/spec-4-008/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-4/spec-4-008/` e o log do Skip. As fontes do fluxo de caixa são o padrão desta SPEC; mudança vira emenda.

## Handoff e operação

- **Como demonstrar:** contrato assinado → recebimentos → aviso → boleto anexado → baixa → fluxo de caixa.
- **Como operar depois:** o Administrativo cuida dos avisos de cobrança e das baixas; o Administrador informa o saldo inicial.
- **Como monitorar:** recebimentos atrasados; avisos de cobrança sem boleto há mais de 5 dias.
- **Pendência conhecida:** nenhuma.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Acompanhar os recebimentos e o fluxo de caixa por empresa | Agrospy | SPEC-4-008 | CA-4-27 a CA-4-30 | todas as subtasks | evidências das subtasks | SPECs 4-002 e 4-007 no ar |
| id pendente | Criar as parcelas a receber do contrato assinado | Agrospy | SPEC-4-008 | CA-4-27 | RED 1 → GREEN 1 | consultas | SPEC-4-007 |
| id pendente | Avisar o administrativo para emitir e anexar o boleto de cobrança | Agrospy | SPEC-4-008 | CA-4-28 | GREEN 2 | consultas | parcelas |
| id pendente | Dar baixa nos recebimentos | Agrospy | SPEC-4-008 | CA-4-29 | GREEN 3 | respostas | parcelas |
| id pendente | Mostrar o fluxo de caixa de cada empresa | Agrospy | SPEC-4-008 | CA-4-30 | GREEN 4 + REFACTOR (a)(b)(c) | respostas + diff + capturas | baixa |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
