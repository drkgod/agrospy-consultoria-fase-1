# SPEC-4-002 — Contas a pagar com aprovação dos sócios

**Fase:** 4
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** emenda P13 de 23/11/2026 (contas a pagar com aprovação; dias fixos terça e quinta; quem lança é o Administrativo, quem aprova são os sócios; a IA nunca paga)
**Degrau da solução:** nativo da plataforma + construção mínima — coleções e rotas do Skip; telas no sistema visual da SPEC-3-002; aviso pela `lib/avisos.js` da SPEC-4-001.

## Contexto e decisões fechadas

- **Estado atual:** os boletos dos fornecedores chegam por e-mail e pelo banco e são pagos sem registro único nem aprovação formal no sistema.
- **Estado desejado:** todo boleto vira uma conta a pagar com empresa do lançamento, fornecedor, valor, vencimento e o dia fixo de pagamento. O Administrativo lança até o dia; os sócios aprovam ou recusam; o sistema gera a lista aprovada para pagar no app do banco; quem paga dá baixa com o comprovante.
- **Decisões já fechadas:**
  - **Dias fixos:** terça e quinta (`config_financeiro.dias_pagamento`, editável pelo Administrador).
  - **Dia previsto do pagamento (padrão desta SPEC):** o dia de pagamento mais próximo que **não passa do vencimento**, contado a partir de hoje. Ex.: hoje segunda, vence quarta → terça; vence segunda que vem → quinta desta semana. Se não houver dia de pagamento entre hoje e o vencimento (ex.: hoje quarta e vence quarta), a conta fica com `fora_do_dia = true`, previsão = hoje, e vai para o topo da aprovação com o selo "Fora do dia fixo".
  - **Lança:** Administrativo, Gestão ou Administrador. **Aprova ou recusa:** só Administrador. A aprovação é humana, um toque por conta ou "Aprovar todas" do dia, sempre com a lista na tela.
  - **A IA nunca paga e nunca aprova.** Nenhuma rotina, agente ou conector muda o status para `aprovada` ou `paga`. O envio ao banco (SPEC-4-004) só acontece depois da aprovação e só se a API do banco permitir. Sem API, o sistema gera a lista aprovada e o sócio paga no app do banco.
  - **Baixa:** "Marcar como paga" exige a data do pagamento e o comprovante (imagem ou PDF), por Administrador ou Administrativo.
  - **Valores em centavos (inteiro)**, sempre.
- **Bloqueios:** nenhum.

## Resultado observável

1. Segunda às 7h, a funcionária do administrativo recebe no app: "Cadastre até hoje os boletos de terça".
2. Ela lança um boleto da AgroSmart: fornecedor, valor, vencimento quarta, linha digitável e o PDF. O app mostra "Pagamento previsto: terça, 25/11".
3. Segunda à tarde, os sócios recebem "4 contas aguardando aprovação para terça". O Diogo abre, vê a lista com total por empresa, aprova 3 e recusa 1 com motivo.
4. Terça, a tela "Pagar hoje" mostra as 3 aprovadas por empresa, com a linha digitável para copiar e o botão "Baixar lista (PDF)". Depois de pagar no app do banco, ele marca cada uma como paga, com o comprovante.

## Limites e dependências

- **Inclui:** coleções `fornecedores`, `contas_pagar` e `eventos_financeiros`; rotas de lançar, conferir, aprovar, recusar, cancelar e pagar; cálculo do dia previsto; rotina de alertas; telas "Contas a pagar", "Aprovar" e "Pagar hoje"; lista em PDF gerada no navegador.
- **Fora de escopo:** leitura de e-mail (SPEC-4-003); DDA e envio ao banco (SPEC-4-004); juros, multa e cálculo de imposto; conciliação bancária por extrato; ERP.
- **Entradas e pré-condições:** SPEC-4-001 no ar.
- **Saídas/artefatos:** migrações, hooks, rotas, telas; `07-sistemas/comercial/tools/` com a prova; evidências em `05_entregas/fase-4/spec-4-002/`.
- **Dependências e responsáveis:** a Agrospy executa com o Maestro. Nada depende de ação do Diogo.
- **Atores e permissões mínimas:**

  | Ação | Administrador | Gestão | Administrativo | Comercial/Operador |
  |---|---|---|---|---|
  | Ver contas e fornecedores | sim | sim | sim | não |
  | Cadastrar fornecedor, lançar, conferir, cancelar conta não aprovada | sim | sim | sim | não |
  | Aprovar, recusar | sim | não | não | não |
  | Marcar como paga | sim | não | sim | não |
  | Cancelar conta aprovada | sim (com motivo) | não | não | não |

- **Superfícies/arquivos/configurações afetadas:** migrações de `fornecedores`, `contas_pagar`, `eventos_financeiros`; `pocketbase/hooks/pagar_rotas.js`, `pagar_rotina.js`, `lib/pagar.js`, `lib/boleto.js` (novos); `src/pages/financeiro/ContasPagar.tsx`, `AprovarContas.tsx`, `PagarHoje.tsx`, `Fornecedores.tsx`; `src/services/pagar.ts`, `fornecedores.ts`; dependência `pdfmake` 0.2.x no `package.json`; `src/App.tsx` (rotas), `navegacao.ts`, `vitrine.ts`.
- **Risco e plano B:** se `pdfmake` não instalar no Skip, a lista sai como página de impressão (`window.print()` com CSS de impressão) e isso fica no changelog.
- **Rollback ou reversão:** migrações reversíveis; conta lançada pode ser cancelada com motivo; nada sai do sistema para o banco nesta SPEC.

## Dados e integrações

| Coleção | Campos (tipo) | Regras de API |
|---|---|---|
| `fornecedores` | `empresa` (rel tenant, req), `nome` (2–200, req), `documento` (CPF 11 ou CNPJ 14 dígitos, opcional, único no tenant quando preenchido), `emails_remetentes` (JSON: lista de e-mails ou domínios `@dominio.com.br`, até 20), `categoria_padrao` (texto ≤ 60), `chave_pix` (≤ 120), `uso` (`pagar` \| `rdv` \| `ambos`), `bloqueado` (bool), `motivo_bloqueio` (≤ 500), `bloqueado_por`, `bloqueado_em`, `criado_por`, `created`/`updated` | list/view: `@request.auth.acesso_empresas.id ?= empresa` (Comercial/Operador precisam para o RDV, só `uso` rdv/ambos pelo filtro da tela) · create/update: só rotas · delete: null |
| `contas_pagar` | `empresa` (req), `empresa_lancamento` (rel, req, do mesmo tenant e ativa), `fornecedor` (rel, opcional na origem e-mail/DDA até a conferência; obrigatório para `lancada`), `beneficiario_usuario` (rel users, opcional, usado no reembolso de RDV da SPEC-4-006), `descricao` (≤ 300), `valor_centavos` (inteiro > 0), `vencimento` (data, req), `pagamento_previsto` (data, calculado), `fora_do_dia` (bool), `linha_digitavel` (47 ou 48 dígitos, opcional), `boleto` (arquivo pdf/jpg/png ≤ 10 MB, protegido), `origem` (`manual` \| `email` \| `dda` \| `rdv`), `status` (`rascunho` \| `lancada` \| `aprovada` \| `recusada` \| `paga` \| `cancelada`), `alerta` (texto ≤ 300, ex. "beneficiário diferente do fornecedor"), `chave_dedup` (texto ≤ 120, único por tenant entre não canceladas), `lancado_por`, `aprovado_por`, `aprovado_em`, `motivo_recusa`, `pago_por`, `pago_em` (data), `comprovante` (arquivo ≤ 10 MB, protegido), `envio_banco` (JSON, usado pela SPEC-4-004), `created`/`updated` (o campo `ref_email` é acrescentado pela SPEC-4-003) | list/view: `@request.auth.acesso_financeiro.id ?= empresa` · create/update/delete: null (só rotas) |
| `eventos_financeiros` | `empresa`, `colecao`, `registro`, `acao` (texto ≤ 40), `de_status`, `para_status`, `por`, `detalhe` (≤ 500, sem valor nem documento), `created` | list/view: `acesso_financeiro` · create/update/delete: null (append-only, só hooks) |

| Rota | Quem | Entrada | Efeito | Erros |
|---|---|---|---|---|
| `POST /backend/v1/fornecedores` e `PATCH /backend/v1/fornecedores/{id}` | financeiro (Adm/Gestão/Administrativo); o RDV usa a rota da SPEC-4-005 | campos do fornecedor | cria/edita | 400 documento inválido ou repetido; 403 |
| `POST /backend/v1/pagar` | financeiro | `{empresa, empresa_lancamento, fornecedor, descricao, valor_centavos, vencimento, linha_digitavel?}` + arquivo `boleto` (multipart) | cria `lancada` com `pagamento_previsto` (RN-110) | 400 regra; 409 duplicada (RN-112) |
| `POST /backend/v1/pagar/{id}/conferir` | financeiro | campos corrigidos | `rascunho` → `lancada` | 400 sem fornecedor; 409 status |
| `POST /backend/v1/pagar/aprovar` | Administrador | `{ids: [...]}` (1 a 200) | cada `lancada` → `aprovada` com autor e hora; devolve as que não puderam | 403; itens fora de `lancada` voltam em `ignoradas` |
| `POST /backend/v1/pagar/{id}/recusar` | Administrador | `{motivo}` (5–500) | `recusada` + aviso a quem lançou | 403; 400 |
| `POST /backend/v1/pagar/{id}/pagar` | Administrador ou Administrativo | `{pago_em}` + arquivo `comprovante` | `aprovada` → `paga` | 409 se não `aprovada`; 400 sem comprovante ou data futura |
| `POST /backend/v1/pagar/{id}/cancelar` | financeiro (não aprovada) ou Administrador (aprovada) | `{motivo}` | `cancelada` | 403; 409 se `paga` |
| `GET /backend/v1/pagar/dia?empresa&data` | financeiro | — | lista do dia agrupada por empresa do lançamento com totais | 403 |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-110 | lançar ou conferir | `pagamento_previsto` = maior dia de pagamento (D) com hoje ≤ D ≤ vencimento; sem D → previsto = hoje e `fora_do_dia = true` | vencimento passado → 400 "Boleto vencido: confira juros e lance com a nova data" | P13 |
| RN-111 | linha digitável informada | `lib/boleto.js` valida os dígitos verificadores (módulo 10 por campo e módulo 11 geral; arrecadação de 48 dígitos pelo módulo 10/11 do campo de identificação) e extrai valor e vencimento (fator de vencimento com a base de 22/02/2025 para fator 1000 e a regra antiga para fatores emitidos antes); se valor ou vencimento informados divergirem → 400 mostrando o lido | boleto sem valor no código (valor zero) aceita o valor digitado | padrão FEBRABAN |
| RN-112 | duplicidade | `chave_dedup` = linha digitável só dígitos; sem linha = `fornecedor + valor + vencimento`; já existe não cancelada → 409 com o id da existente | — | P13 |
| RN-113 | aprovar | só perfil `administrador` no tenant, pelo vínculo ativo; a IA e as rotinas nunca chamam esta rota; as chaves de API da SPEC-4-009 só valem na rota MCP, que não tem ferramenta de aprovar | — | P13 |
| RN-114 | alerta do administrativo | às `hora_alerta`, no dia anterior a cada dia de pagamento (`antecedencia_alerta_dias`) e no próprio dia: aviso "Cadastre até hoje os boletos de {dia}" para Administrativo e Gestão (e-mail se `aviso_email_administrativo`) | sem Administrativo no tenant, vai ao Administrador | P13 |
| RN-115 | alerta dos sócios | às 14h do dia anterior e às 7h do dia de pagamento: "{N} contas aguardando aprovação para {dia}" para os Administradores, só se N > 0; `fora_do_dia` gera aviso imediato | — | P13 |
| RN-116 | trilha | toda mudança de status grava `eventos_financeiros` | — | P13 |

## Fluxo e regras

1. **Contas a pagar** (`/financeiro/pagar`): pílulas por status (Para conferir, Aguardando aprovação, Aprovadas, Pagas, Recusadas), filtro por empresa do lançamento e por dia previsto; botão "Lançar boleto".
2. **Lançar boleto** (folha): empresa do lançamento, fornecedor (busca; "novo fornecedor" na mesma folha), linha digitável (colar; o app valida e preenche valor e vencimento), descrição, PDF/foto. Mostra o pagamento previsto antes de salvar.
3. **Aprovar** (`/financeiro/aprovar`, só Administrador): agrupado por dia previsto e empresa, com total; cada item mostra fornecedor, valor, vencimento, alerta e o PDF; "Aprovar", "Recusar" e "Aprovar todas deste dia" (confirma numa folha com o total).
4. **Pagar hoje** (`/financeiro/pagar-hoje`): aprovadas com previsto ≤ hoje, por empresa; "Copiar linha digitável"; "Baixar lista (PDF)" com empresa, fornecedor, valor, vencimento e linha digitável; "Marcar como paga" (data + comprovante).
5. **Rotina** `pagar_rotina.js` a cada 30 min: alertas RN-114 e RN-115 (deduplicados por `chave_unica` = tipo + tenant + dia).

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | segunda 24/11, vence qua 26/11 | previsto ter 25/11 | — |
| Principal | segunda 24/11, vence seg 01/12 | previsto qui 27/11 | — |
| Limite | quarta 26/11, vence qua 26/11 | previsto 26/11, `fora_do_dia`, aviso imediato aos sócios | — |
| Limite | mesma linha digitável duas vezes | 409 com a existente | — |
| Falha | Administrativo chama aprovar | 403 | — |
| Falha | linha digitável com dígito errado | 400 "Linha digitável inválida" | redigitar |
| Falha | marcar paga sem comprovante | 400 | anexar |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; a SPEC-4-001; `00-INDICE.md` (regras comuns); `lib/avisos.js`.
2. **Contexto técnico do Skip:** o mesmo da SPEC-4-001 (goja, `require` dentro do handler, `$app.runInTransaction`, sem `Intl`, UTC−3 fixo, log sem valor nem documento). Datas de pagamento calculadas em dias de Brasília.
3. **Alterar somente:** as superfícies listadas.
4. **Não alterar:** nada das fases 1–3; `empresas_lancamento` além de ler.
5. **Executar nesta ordem:** (1) `fornecedores` + tela; (2) `lib/boleto.js` com testes unitários; (3) `contas_pagar`, lançar e RN-110 a RN-112; (4) rotina de alertas; (5) aprovar/recusar; (6) pagar hoje, PDF e baixa; (7) provas visuais.
6. **Parar e pedir validação quando:** nenhuma parada prevista. Nada é enviado ao banco nesta SPEC.
7. **Estado válido ao parar:** contas lançadas continuam consultáveis; nenhuma conta muda de status sozinha.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

Sistema da SPEC-3-002. Lista com `ListaItem` (fornecedor, empresa em `Selo`, valor, vencimento, dia previsto); `CartaoDestaque` com o total aguardando aprovação; selos "Fora do dia fixo" e alerta em cor de atenção pelo token; formulários em `Folha`; confirmação de "Aprovar todas" em `Folha` (nunca `window.confirm`); estados carregando, vazio ("Nenhuma conta para aprovar"), erro e sem internet (lançar exige internet). Vitrine com uma lista fictícia de 5 contas.

## Checklist de execução

- [ ] Fornecedores com documento validado.
- [ ] `lib/boleto.js` com testes de linhas válidas, inválidas e fator de vencimento antes e depois de 22/02/2025.
- [ ] Lançar, conferir, aprovar, recusar, pagar e cancelar com trilha.
- [ ] Rotina de alertas deduplicada.
- [ ] Lista do dia em PDF.
- [ ] Capturas, axe-core e evidências em `05_entregas/fase-4/spec-4-002/`.

## Critérios de aceite

- [ ] **CA-4-04:** fornecedor com documento inválido ou repetido no tenant dá 400; fornecedor de um tenant não aparece no outro.
- [ ] **CA-4-05:** o pagamento previsto bate com RN-110 nos 6 casos da fixture de datas; linha digitável válida preenche valor e vencimento e a inválida dá 400; a mesma linha duas vezes dá 409.
- [ ] **CA-4-06:** com o relógio de teste, a rotina gera exatamente 1 aviso "Cadastre até hoje" por destinatário no dia anterior e 1 no dia, e 1 aviso aos Administradores quando há conta aguardando; sem conta, nenhum aviso aos sócios.
- [ ] **CA-4-07:** só `teste.admin.a` aprova e recusa (Gestão e Administrativo recebem 403; o caso da chave de API é provado na SPEC-4-009); "Aprovar todas" muda só as `lancada` do dia; recusa exige motivo e avisa quem lançou; toda mudança grava `eventos_financeiros`.
- [ ] **CA-4-08:** "Pagar hoje" lista só as aprovadas com previsto ≤ hoje, com totais por empresa iguais à soma na base; o PDF tem as mesmas linhas; marcar como paga exige data e comprovante e só vale para `aprovada`.

## TDD da SPEC

**Empresas nas provas:** Teste A (com "TESTE — Spy" e "TESTE — Smart") e Teste B. **Relógio de teste:** a rotina e as rotas aceitam `agora` só em chamada de superusuário (`POST /backend/v1/teste/pagar/rotina {agora}`), como nas provas de avisos da fase 2.

**Fixtures** em `05_entregas/fase-4/fixtures/`:
- `linhas-digitaveis.json`: 4 linhas válidas geradas pelo executor (2 com fator antes de 22/02/2025, 2 depois), 3 com um dígito trocado, 1 de arrecadação de 48 dígitos;
- `datas-pagamento.json`: 6 pares (hoje, vencimento) → previsto, incluindo os três cenários da tabela e um vencimento no sábado.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | regra de aprovação (CA-4-07) | antes da rota, tentar `PATCH` direto em `contas_pagar.status` como `teste.administrativo` | bloqueado pela regra null (403/404) | resposta |
| GREEN 1 | fornecedores (CA-4-04) | criar com CPF inválido, CNPJ repetido, válido; listar como `teste.rumo` | 400; 400; 200; 0 | respostas |
| GREEN 2 | boleto e datas (CA-4-05) | testes unitários de `lib/boleto.js` com `linhas-digitaveis.json`; lançar os 6 casos de `datas-pagamento.json`; lançar a mesma linha 2× | 4 válidas lidas, 3 recusadas, 48 dígitos aceita; previstos iguais à fixture; 409 | saída dos testes + consultas |
| GREEN 3 | alertas (CA-4-06) | rotina com `agora` = seg 07:00, seg 14:00, ter 07:00 e repetir seg 07:00 | 1 aviso por destinatário em cada horário; repetição sem novo | consultas `avisos` |
| GREEN 4 | aprovação (CA-4-07) | aprovar como `teste.gestao`, `teste.administrativo` e `teste.admin.a`; recusar sem e com motivo; "aprovar todas" com uma `paga` no meio | 403; 403; 200; 400; 200 + aviso; a `paga` em `ignoradas` | respostas + `eventos_financeiros` |
| GREEN 5 | pagar hoje (CA-4-08) | `GET /pagar/dia`; gerar PDF; pagar sem comprovante; pagar uma `lancada`; pagar certo | totais = soma SQL; PDF com as mesmas linhas; 400; 409; 200 | respostas + PDF |
| REFACTOR/REGRESSÃO | regressão e visual | (a) regras das fases 1–3 e SPEC-4-001 com o elenco; (b) capturas 390×844 e 1280×800 das 4 telas, rolagem 0, axe-core | sem diferença; sem falha séria | relatório |

**Caminhos de erro obrigatórios:** perfil sem permissão, outro tenant, duplicidade, boleto vencido, linha inválida, status errado, sem comprovante, sem internet.
**Evidência exigida:** em `05_entregas/fase-4/spec-4-002/`, mais o log do Skip. Fixtures de teste removidas por migração de limpeza no fim.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-4/spec-4-002/` e o log do Skip. A regra do dia previsto é o padrão desta SPEC; o Diogo pode pedir outra, que vira emenda sem parar a construção.

## Handoff e operação

- **Como demonstrar:** lançar um boleto, aprovar, baixar a lista e marcar como paga.
- **Como operar depois:** o Administrativo lança até a véspera; os sócios aprovam até a manhã do dia; quem paga dá baixa no mesmo dia.
- **Como monitorar:** contas `fora_do_dia`, aprovadas e não pagas depois do dia previsto.
- **Pendência conhecida:** nenhuma.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Lançar e aprovar as contas a pagar | Agrospy | SPEC-4-002 | CA-4-04 a CA-4-08 | todas as subtasks | evidências das subtasks | SPEC-4-001 no ar |
| id pendente | Cadastrar os fornecedores | Agrospy | SPEC-4-002 | CA-4-04 | GREEN 1 | respostas | SPEC-4-001 |
| id pendente | Lançar boleto à mão com o dia de pagamento certo | Agrospy | SPEC-4-002 | CA-4-05 | RED 1 → GREEN 2 | testes + consultas | fornecedores |
| id pendente | Avisar o administrativo e os sócios antes de terça e quinta | Agrospy | SPEC-4-002 | CA-4-06 | GREEN 3 | consultas | lançar boleto |
| id pendente | Aprovar ou recusar as contas do dia de pagamento | Agrospy | SPEC-4-002 | CA-4-07 | GREEN 4 | respostas + trilha | lançar boleto |
| id pendente | Gerar a lista aprovada e dar baixa com o comprovante | Agrospy | SPEC-4-002 | CA-4-08 | GREEN 5 + REFACTOR (a)(b) | respostas, PDF, capturas | aprovação |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
