# SPEC-4-001 — Empresas do lançamento, perfil Administrativo e avisos financeiros

**Fase:** 4
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** emenda P13 de 23/11/2026 (duas empresas no tenant Agrospy, perfil Administrativo, avisos sempre no app); P2; P6; Fase 4, "perfil Gestão vê o financeiro da empresa"
**Degrau da solução:** reuso + construção mínima:
- **Reuso:** o padrão de `vinculos` e dos campos de acesso calculados (`acesso_empresas`, `acesso_admin`, `acesso_gestao`), a coleção `avisos` e o envio pelo OneSignal da fase 2;
- **Construção:** a coleção das empresas do lançamento, o perfil `administrativo`, o campo `acesso_financeiro` e a biblioteca de e-mail.

## Contexto e decisões fechadas

- **Estado atual:**
  - o app tem dois tenants (Agrospy e Rumo Agro) e quatro perfis por tenant: `administrador`, `gestao`, `comercial` e `operador`;
  - o tenant Agrospy fatura por dois CNPJs (AgroSpy e AgroSmart), e o app não sabe disso;
  - os avisos (`avisos`) só conhecem a oportunidade (`do_dia`, `atraso`, `copia_gestor`);
  - o app não envia e-mail próprio.
- **Estado desejado:**
  - cada tenant tem a lista das **empresas do lançamento** (CNPJs que lançam despesa, conta a pagar, recebimento e contrato): AgroSpy e AgroSmart no tenant Agrospy, Rumo Agro no tenant Rumo Agro;
  - existe o perfil **Administrativo** (a funcionária do administrativo): lança e confere o financeiro, mas não aprova pagamento;
  - os avisos do financeiro chegam no app (lista + notificação no celular) e, quando a SPEC pedir, também por e-mail.
- **Decisões já fechadas:**
  - **Empresa do lançamento ≠ tenant.** O tenant continua sendo a fronteira de acesso (P2). A empresa do lançamento é um campo obrigatório de todo registro financeiro e decide o fluxo de caixa de cada CNPJ.
  - **Cada empresa do lançamento tem fluxo de caixa próprio** (SPEC-4-008).
  - **Quem vê o financeiro:** Administrador, Gestão e Administrativo do tenant (`acesso_financeiro`). Comercial e Operador só veem as próprias despesas de RDV (SPEC-4-005).
  - **Quem aprova pagamento:** só o perfil Administrador (os sócios). Regra aplicada nas SPECs 4-002 e 4-004.
  - **Avisos nunca vão por WhatsApp.** Canal: app (lista + notificação) e, quando a SPEC indicar, e-mail.
  - **E-mail:** sai pelo envio do próprio Skip (`$app.newMailClient()`), com registro de cada envio. O remetente é o padrão do Skip, com resposta para o e-mail que o Administrador configurar.
  - **A planilha financeira antiga não é base.** O padrão dos dados é o desta SPEC.
- **Bloqueios:** nenhum para construir. Os CNPJs e razões sociais reais entram pela tela do Administrador (pendência CL-PEND-011). Se o plano do Skip não enviar e-mail, a parte de e-mail fica em espera (CL-PEND-018) e o resto segue.

## Resultado observável

1. O Diogo abre "Empresas do lançamento" e vê AgroSpy e AgroSmart (tenant Agrospy). Preenche CNPJ, razão social e o e-mail da contabilidade de cada uma.
2. Ele cria a funcionária do administrativo com o perfil Administrativo. Ela entra e vê o menu "Financeiro", mas não vê o botão "Aprovar" nas telas das próximas SPECs.
3. Um aviso financeiro de teste aparece na lista de avisos dela, chega como notificação no celular e, quando pedido, também por e-mail, com o envio registrado.

## Limites e dependências

- **Inclui:**
  - coleção `empresas_lancamento` e a tela "Empresas do lançamento";
  - valor `administrativo` no campo `perfil` de `vinculos`, com a tela de usuários oferecendo o perfil;
  - campo calculado `acesso_financeiro` em `users`, nos hooks que já recalculam os acessos;
  - coleção `config_financeiro` (uma por tenant);
  - tipos novos em `avisos` e os campos `ref_colecao` e `ref_id`;
  - `pocketbase/hooks/lib/email.js` e a coleção `envios_email`;
  - seção "Financeiro" na navegação.
- **Fora de escopo:** contas a pagar, RDV, contratos e recebimentos (outras SPECs); emissão de nota fiscal; cálculo de imposto; ERP.
- **Entradas e pré-condições:** fase 3 no ar (casca visual da SPEC-3-002 e empresas de teste da SPEC-3-001).
- **Saídas/artefatos:** migrações, hooks, telas, `lib/email.js`; evidências em `05_entregas/fase-4/spec-4-001/`.
- **Dependências e responsáveis:** a Agrospy executa com o Maestro. O Diogo informa CNPJs e e-mails pela tela (CL-PEND-011, CL-PEND-012).
- **Atores e permissões mínimas:**

  | Ação | Administrador | Gestão | Administrativo | Comercial | Operador |
  |---|---|---|---|---|---|
  | Ver empresas do lançamento | sim | sim | sim | sim (só nome, para escolher no RDV) | sim (só nome) |
  | Criar/editar empresas do lançamento | sim | não | não | não | não |
  | Editar `config_financeiro` | sim | não | não | não | não |
  | Menu "Financeiro" | sim | sim | sim | não (só "Minhas despesas", SPEC-4-005) | não (idem) |
  | Dar o perfil Administrativo a alguém | sim | não | não | não | não |

- **Superfícies/arquivos/configurações afetadas:**
  - migrações novas (numeração seguinte à última aplicada): `empresas_lancamento`, `config_financeiro`, `envios_email`, alteração de `vinculos.perfil`, `users.acesso_financeiro`, `avisos` (tipos e campos novos);
  - hooks `recalcula_acessos_create.js`, `recalcula_acessos_update.js`, `recalcula_acessos_delete.js` (só a parte do novo campo);
  - `pocketbase/hooks/lib/email.js`, `pocketbase/hooks/lib/avisos.js` (função `criarAvisoFinanceiro`);
  - `src/pages/Usuarios.tsx` (opção do perfil), `src/pages/EmpresasLancamento.tsx` e `src/services/empresas-lancamento.ts` (novos);
  - `src/components/app/navegacao.ts` e `07-sistemas/comercial/tools/tests/navegacao_esperada.json` (linhas da seção "Financeiro");
  - `src/fixtures/vitrine.ts`.
- **Risco e plano B:**
  - **Perfil novo quebra regra antiga:** toda regra que testa `perfil = 'gestao'` ou lista de perfis continua igual; o Administrativo não entra em regra comercial. A regressão (REFACTOR a) prova.
  - **Envio de e-mail indisponível no plano:** `lib/email.js` grava `envios_email` com `status = 'sem_envio'` e o aviso no app sai normalmente. A pendência vai uma vez ao Diogo.
- **Rollback ou reversão:** migrações reversíveis; tirar o perfil de um vínculo devolve o acesso anterior; esconder a seção "Financeiro" desliga as telas sem perda de dado.

## Dados e integrações

| Coleção | Campos (tipo) | Regras de API (list/view · create/update · delete) |
|---|---|---|
| `empresas_lancamento` | `empresa` (rel tenant, req), `nome` (texto 2–80, req), `razao_social` (texto ≤ 200), `cnpj` (texto, 14 dígitos ou vazio; único entre todos os tenants quando preenchido), `email_contabilidade` (e-mail ou vazio), `email_resposta` (e-mail ou vazio, usado como "responder para"), `ativo` (bool), `ordem` (número), `created`/`updated` | list/view: `@request.auth.acesso_empresas.id ?= empresa` · create/update: `@request.auth.acesso_admin.id ?= empresa` · delete: null (desativar no lugar de apagar) |
| `config_financeiro` | `empresa` (rel, único), `dias_pagamento` (JSON, padrão `[2,4]` = terça e quinta; 0 = domingo), `hora_alerta` (texto `HH:MM`, padrão `07:00`), `antecedencia_alerta_dias` (número 0–5, padrão 1), `dias_aviso_cobranca` (número 1–30, padrão 10, usado na SPEC-4-008), `aviso_email_administrativo` (bool, padrão true) | list/view: `acesso_financeiro` · update: `acesso_admin` · create/delete: null (criada por migração para cada tenant) |
| `envios_email` | `empresa`, `para` (texto, endereços separados por vírgula), `assunto` (≤ 200), `tipo` (texto ≤ 40), `ref_colecao`, `ref_id`, `status` (`enviado` \| `falhou` \| `sem_envio`), `erro` (≤ 500), `tentativas` (número), `chave_unica` (texto ≤ 300, único), `created` | list/view: `acesso_admin` · create/update/delete: null (só hooks) |
| `vinculos` (alteração) | `perfil` ganha o valor `administrativo` | regras atuais |
| `users` (campo novo) | `acesso_financeiro` (rel múltipla `empresas`), calculado: empresas em que o vínculo ativo é `administrador`, `gestao` ou `administrativo` | protegido como os outros `acesso_*` (o corpo da requisição não pode enviar) |
| `avisos` (alteração) | `tipo` ganha `financeiro`; campos novos `ref_colecao` (texto ≤ 40) e `ref_id` (texto ≤ 30); `oportunidade` continua opcional | regras atuais |

**Carga inicial (migração):**
- tenant Agrospy: "AgroSpy" (ordem 1) e "AgroSmart" (ordem 2), CNPJ vazio;
- tenant Rumo Agro: "Rumo Agro" (ordem 1), CNPJ vazio;
- empresa de teste "Teste A": "TESTE — Spy" e "TESTE — Smart", com CNPJs fictícios válidos no dígito verificador gerados pelo executor; "Teste B": "TESTE — Rumo";
- `config_financeiro` padrão para os quatro tenants;
- usuário novo do elenco de teste: `teste.administrativo` (Administrativo na Teste A), com senha só nas credenciais do executor.

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-100 | CNPJ preenchido | só dígitos, 14, com dígito verificador válido; repetido em qualquer tenant → 400 "CNPJ já cadastrado" | vazio é aceito e mostra o selo "CNPJ pendente" | P13 |
| RN-101 | empresa do lançamento desativada | some das listas de escolha; registros antigos continuam mostrando o nome | — | P13 |
| RN-102 | tenant sem nenhuma empresa do lançamento ativa | telas financeiras mostram "Cadastre uma empresa do lançamento" e não deixam lançar | — | P13 |
| RN-103 | acesso financeiro | `acesso_financeiro` recalculado no mesmo hook que recalcula `acesso_admin` e `acesso_gestao` | — | P6, P13 |
| RN-104 | aviso financeiro | `criarAvisoFinanceiro({empresa, destinatarios, texto_curto, detalhe, ref_colecao, ref_id, chave_unica, email})` cria um aviso por destinatário (deduplicado por `chave_unica`), dispara a notificação pelo caminho atual e, se `email = true` e o destinatário tiver e-mail, chama `lib/email.js` | a notificação na tela bloqueada nunca mostra nome de fornecedor, produtor nem valor | fase 2; P13 |
| RN-105 | envio de e-mail | `lib/email.js` envia pelo cliente de e-mail do Skip, grava `envios_email` e não repete envio com a mesma `chave_unica`; falha fica `falhou` com o erro e a rotina tenta de novo até 3 vezes, uma vez por hora | sem recurso de e-mail → `sem_envio` | P13 |

## Fluxo e regras

1. **Empresas do lançamento** (`/financeiro/empresas`, Administrador): lista com nome, CNPJ (ou selo "CNPJ pendente"), e-mail da contabilidade e ativo; criar e editar numa folha.
2. **Usuários:** a tela de usuários oferece "Administrativo" com a explicação "lança e confere o financeiro; não aprova pagamento".
3. **Configuração financeira** (`/financeiro/configuracao`, Administrador): dias de pagamento (padrão terça e quinta), hora do alerta, antecedência, dias do aviso de cobrança e se o administrativo recebe também por e-mail.
4. **Avisos:** a tela de avisos mostra o aviso financeiro com ícone próprio; tocar abre a tela de `ref_colecao`/`ref_id`.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | Administrador cadastra CNPJ válido | salvo; selo some | — |
| Limite | CNPJ com dígito errado ou repetido | 400 com a mensagem | corrigir |
| Falha | Comercial tenta editar empresa do lançamento pela API | 403 | — |
| Falha | Administrativo tenta mudar `config_financeiro` | 403 | — |
| Falha | envio de e-mail falha | aviso no app sai; `envios_email` = `falhou`; nova tentativa em 1 h | após 3 falhas, fica `falhou` e aparece na tela do Administrador |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; `00-INDICE.md` (seção "Regras comuns das fases 4 e 5"); as migrações `0002`, `0004`, `0040` e as de acesso; os hooks `recalcula_acessos_*.js`, `avisos_enviar.js` e `lib/avisos.js`; `src/pages/Usuarios.tsx`; `src/components/app/navegacao.ts`.
2. **Contexto técnico do Skip (PocketBase v0.36 em goja):** migrações só rodam no publish; não declare funções no topo do arquivo de hook (use `require(\`${__hooks}/lib/...\`)` dentro do handler); grave com `$app.runInTransaction`; segredos só por `$secrets.get`; o runtime não tem `Intl` e Brasília é UTC−3 fixo; log sem nome, documento, e-mail ou valor, só ids e contagens.
3. **Alterar somente:** as superfícies listadas.
4. **Não alterar:** regras comerciais das fases 1 a 3; o envio de avisos de oportunidade.
5. **Executar nesta ordem:** (1) `empresas_lancamento` + carga + tela; (2) perfil e `acesso_financeiro`; (3) `config_financeiro`; (4) `avisos` + `lib/avisos.js`; (5) `lib/email.js` + `envios_email`; (6) navegação, vitrine e provas.
6. **Parar e pedir validação quando:** nenhuma parada prevista. Sem recurso de e-mail no plano: registrar a pendência e seguir.
7. **Estado válido ao parar:** o app comercial funciona como antes; perfis antigos inalterados.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

Sistema visual da SPEC-3-002 (componentes de `src/components/app/`, cor só pelos tokens). Seção nova "Financeiro" no menu lateral e na página "Mais", com os itens das SPECs 4-001 a 4-009 seguindo a tabela abaixo (que estende a "Navegação por perfil" da SPEC-3-002 no mesmo `navegacao.ts`):

| Item | Rota | Administrador | Gestão | Administrativo | Comercial | Operador | SPEC |
|---|---|---|---|---|---|---|---|
| Contas a pagar | `/financeiro/pagar` | sim | sim | sim | não | não | 4-002 |
| E-mails de boletos | `/financeiro/emails` | sim | sim | sim | não | não | 4-003 |
| Minhas despesas | `/despesas` | sim | sim | sim | sim | sim | 4-005 |
| Despesas da equipe | `/financeiro/rdv` | sim | sim | sim | não | não | 4-006 |
| Contratos | `/contratos` | sim | sim | sim (só vê) | não | não | 4-007 |
| Recebimentos | `/financeiro/receber` | sim | sim | sim | não | não | 4-008 |
| Fluxo de caixa | `/financeiro/caixa` | sim | sim | sim | não | não | 4-008 |
| Conexões de IA | `/config/conexoes-ia` | sim | sim | não | não | não | 4-009 |
| Empresas do lançamento | `/financeiro/empresas` | sim | não | não | não | não | 4-001 |
| Configuração financeira | `/financeiro/configuracao` | sim | não | não | não | não | 4-001 |

O Administrativo não tem as abas comerciais "Hoje", "Rascunhos", "Prioridades" e "Painel" (ele não é vendedor); tem "Produtores" só para consulta, como o Operador. Uma linha só entra no menu quando a rota existe. Estados de carregando, vazio, erro e sem internet em todas as telas novas; entrada na `/vitrine`.

## Checklist de execução

- [ ] Empresas do lançamento com carga, tela e RN-100 a RN-102.
- [ ] Perfil Administrativo e `acesso_financeiro` recalculado.
- [ ] `config_financeiro` com os padrões.
- [ ] Aviso financeiro no app, na notificação e por e-mail, com registro.
- [ ] Navegação, vitrine, capturas 390×844 e 1280×800, axe-core.
- [ ] Evidências em `05_entregas/fase-4/spec-4-001/`.

## Critérios de aceite

- [ ] **CA-4-01:** o tenant Agrospy lista exatamente AgroSpy e AgroSmart e o Rumo Agro lista Rumo Agro; CNPJ inválido ou repetido dá 400; Comercial e Operador recebem 403 ao criar ou editar; usuário de outro tenant lista 0.
- [ ] **CA-4-02:** `teste.administrativo` tem `acesso_financeiro` só da Teste A, vê a seção "Financeiro", não abre `/financeiro/empresas` nem `/financeiro/configuracao` (403 na API) e não ganha nenhuma permissão comercial nova (carteira, painel e oportunidades iguais ao Operador).
- [ ] **CA-4-03:** `criarAvisoFinanceiro` com `email = true` gera 1 aviso por destinatário, 1 notificação aceita pelo OneSignal sem nome nem valor no texto, e 1 registro em `envios_email` (`enviado` ou `sem_envio`); repetir com a mesma `chave_unica` não gera nada novo.

## TDD da SPEC

**Empresas nas provas:** só "Teste A" e "Teste B" (SPEC-3-001). Elenco: `teste.admin`, `teste.admin.a`, `teste.gestao`, `teste.comercial1`, `teste.operador`, `teste.rumo` e o novo `teste.administrativo`.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | perfil inexistente (CA-4-02) | criar vínculo `administrativo` antes da migração | 400 valor inválido (falha esperada) | resposta |
| GREEN 1 | empresas (CA-4-01) | listar como `teste.admin.a` e `teste.rumo`; criar com CNPJ inválido, repetido e válido; editar como `teste.comercial1` | 2 e 1 itens; 400; 400; 200; 403 | respostas |
| GREEN 2 | perfil (CA-4-02) | criar `teste.administrativo`; ler `acesso_financeiro`; abrir as rotas de configuração; listar oportunidades e painel | Teste A; 403 nas duas; mesmas respostas do `teste.operador` | respostas + captura do menu |
| GREEN 3 | aviso (CA-4-03) | rota de teste (só superusuário) `POST /backend/v1/teste/aviso-financeiro` para `teste.administrativo` com `email=true`, duas vezes | 1 aviso, 1 resposta do OneSignal com id, 1 `envios_email`; 2ª chamada sem nada novo | consultas + resposta do OneSignal |
| REFACTOR/REGRESSÃO | regressão | (a) regras de acesso das fases 1–3 com o elenco (carteira, painel, oportunidades, importação); (b) capturas das telas novas em 390×844 e 1280×800, rolagem horizontal 0, axe-core | (a) sem diferença; (b) sem falha séria ou crítica | relatório |

**Dados/fixtures:** CNPJs fictícios gerados com dígito verificador válido, nunca de empresa real.
**Caminhos de erro obrigatórios:** CNPJ inválido, repetido, perfil sem permissão, outro tenant, e-mail indisponível, aviso repetido.
**Evidência exigida:** respostas, consultas, capturas e axe em `05_entregas/fase-4/spec-4-001/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-4/spec-4-001/` e o log do Skip. CNPJs e e-mails reais entram pela tela quando o Diogo informar e não travam a construção.

## Handoff e operação

- **Como demonstrar:** cadastrar o CNPJ da AgroSmart; criar um usuário Administrativo; disparar o aviso de teste.
- **Como operar depois:** o Administrador mantém CNPJs, e-mails e dias de pagamento.
- **Como monitorar:** `envios_email` com `falhou`; empresas com "CNPJ pendente".
- **Pendência conhecida:** CL-PEND-011 (CNPJs e razões sociais), CL-PEND-012 (e-mails da contabilidade), CL-PEND-018 (envio de e-mail no plano do Skip).

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Preparar as empresas do lançamento e o perfil Administrativo | Agrospy | SPEC-4-001 | CA-4-01 a CA-4-03 | todas as subtasks | evidências das subtasks | fase 3 no ar |
| id pendente | Cadastrar AgroSpy, AgroSmart e Rumo Agro como empresas do lançamento | Agrospy | SPEC-4-001 | CA-4-01 | GREEN 1 | respostas | — |
| id pendente | Criar o perfil Administrativo com acesso ao financeiro | Agrospy | SPEC-4-001 | CA-4-02 | RED 1 → GREEN 2 + REFACTOR (a) | respostas + captura | empresas do lançamento |
| id pendente | Mandar os avisos financeiros no app e por e-mail | Agrospy | SPEC-4-001 | CA-4-03 | GREEN 3 + REFACTOR (b) | consultas + OneSignal | perfil Administrativo |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
