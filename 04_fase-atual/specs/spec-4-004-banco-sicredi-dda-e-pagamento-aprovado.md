# SPEC-4-004 — Banco Sicredi: DDA e envio do pagamento aprovado (condicionado à API)

**Fase:** 4
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** emenda P13 de 23/11/2026 (boletos pelo DDA via API do Sicredi, se existir API; integração para enviar ao banco só depois da aprovação humana e só se a API permitir; senão, lista aprovada para o sócio pagar no app do banco)
**Degrau da solução:** construção mínima condicionada — um adaptador de banco com contrato fixo nesta SPEC; a chamada concreta segue a documentação oficial que o Sicredi entregar à Agrospy. Sem API, o adaptador fica desligado e vale a lista aprovada da SPEC-4-002.

## Contexto e decisões fechadas

- **Estado atual:** a SPEC-4-002 entrega a lista aprovada e a baixa manual. Não se sabe se a conta PJ da Agrospy no Sicredi tem API de DDA (consulta de boletos registrados contra o CNPJ) e de pagamento de boletos.
- **Estado desejado:**
  - **Com API de DDA:** os boletos do DDA de cada CNPJ entram como `rascunho` (origem `dda`) para o Administrativo conferir, sem duplicar os que já vieram por e-mail ou à mão.
  - **Com API de pagamento:** o sócio, depois de aprovar, toca em "Enviar ao banco" e o lote do dia vai ao Sicredi; o retorno do banco (agendado, pago, recusado) volta para cada conta.
  - **Sem API:** nada muda: lista aprovada e baixa manual (SPEC-4-002). O sistema mostra "Banco não integrado".
- **Decisões já fechadas:**
  - **Primeiro passo é levantar, não construir.** A Agrospy pergunta ao gerente do Sicredi, uma vez, quais APIs a conta PJ tem (DDA, pagamento de boletos), como obter credenciais e se exigem certificado digital (CL-PEND-014). O Maestro manda a pergunta pronta.
  - **Nunca antes da aprovação.** O adaptador só aceita contas `aprovada` e só por ação de um Administrador logado (nunca por rotina, agente ou chave de API).
  - **Uma vez só.** Cada conta enviada guarda `envio_banco.id_externo`; reenvio da mesma conta é recusado enquanto houver envio `agendado` ou `pago`.
  - **Contrato interno do adaptador** (`pocketbase/hooks/lib/banco_sicredi.js`):
    - `listarDDA({cnpj, desde})` → `[{linha_digitavel, valor_centavos, vencimento, beneficiario_nome, beneficiario_documento, id_externo}]`;
    - `enviarPagamentos({cnpj, contas: [{id, linha_digitavel, valor_centavos, data_pagamento}]})` → `[{id, id_externo, situacao: 'agendado'|'recusado', motivo?}]`;
    - `consultarPagamento({id_externo})` → `{situacao: 'agendado'|'pago'|'recusado'|'cancelado', pago_em?, comprovante_url?}`.
  - **Credenciais** só no cofre do Skip (`SICREDI_*`, nomes definidos pela documentação), cadastradas pela Agrospy.
  - **Certificado digital (mTLS):** se a API exigir certificado de cliente e o runtime do Skip não permitir, a integração fica registrada como não viável na plataforma e a lista aprovada continua sendo o caminho. Não se troca de plataforma por conta disso.
- **Bloqueios:** CL-PEND-014. Enquanto a resposta e as credenciais não chegam, as tasks de DDA e de envio ficam em espera com o motivo na linha `>`; a fase segue.

## Resultado observável

- **Sem API:** "Contas a pagar" mostra o selo "Banco não integrado — pague pelo app do Sicredi com a lista aprovada".
- **Com DDA:** às 6h e às 13h, os boletos novos do DDA da AgroSpy e da AgroSmart aparecem em "Para conferir", com a origem "DDA", sem repetir o boleto que já chegou por e-mail.
- **Com pagamento:** terça, depois de aprovar, o Diogo toca "Enviar ao banco (3 contas, R$ 12.430,00)", confirma, e cada conta passa a "Agendada no banco". No fim do dia, as pagas ficam "Paga" com o comprovante do banco.

## Limites e dependências

- **Inclui:** levantamento com o Sicredi (pergunta pronta e registro da resposta em `06_notas/`); `config_banco` por tenant; adaptador com o contrato acima; rotina do DDA; rota de envio; rotina de consulta de situação; selos e botões nas telas da SPEC-4-002.
- **Fora de escopo:** outros bancos; Pix por API; conciliação por extrato; emissão de boleto de cobrança (continua manual, SPEC-4-008); aprovação automática.
- **Entradas e pré-condições:** SPEC-4-002 no ar; para construir o adaptador real, a documentação oficial e as credenciais de homologação (sandbox) do Sicredi no cofre.
- **Saídas/artefatos:** `06_notas/2026-sicredi-apis.md` com a resposta do banco (sem credencial); migração de `config_banco`; hooks; evidências em `05_entregas/fase-4/spec-4-004/`.
- **Dependências e responsáveis:** a Agrospy levanta com o Sicredi e cadastra as credenciais; o Maestro constrói.
- **Atores e permissões mínimas:** configurar: Administrador; enviar ao banco: Administrador; ver a situação: financeiro.
- **Superfícies/arquivos/configurações afetadas:** migração `config_banco`; `pocketbase/hooks/lib/banco_sicredi.js`, `banco_rotinas.js`, `banco_rotas.js`; telas `ContasPagar.tsx`, `PagarHoje.tsx` (selo e botão), `ConfigBanco.tsx`; `navegacao.ts` (item dentro de "Configuração financeira").
- **Risco e plano B:** sem API, mTLS impossível ou documentação insuficiente → `config_banco.modo = 'sem_integracao'` e registro da pendência; homologação com sandbox antes de qualquer chamada real.
- **Rollback ou reversão:** `config_banco.modo = 'sem_integracao'` desliga tudo; contas `agendadas` continuam consultáveis e podem receber baixa manual.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| API de DDA do Sicredi | banco | contrato `listarDDA` | credenciais do cofre conforme a documentação | timeout 30 s; 2 rodadas por dia; dedup por `id_externo` e por `chave_dedup` (RN-112) | falha não cria nada e gera aviso ao Administrador na 2ª falha seguida |
| API de pagamento do Sicredi | banco | contrato `enviarPagamentos` e `consultarPagamento` | idem | timeout 30 s; sem retry automático no envio (o resultado incerto vira `verificar` e a rotina consulta antes de qualquer novo envio) | recusado volta para `aprovada` com o motivo do banco |

| Coleção | Campos (tipo) | Regras de API |
|---|---|---|
| `config_banco` | `empresa` (único), `modo` (`sem_integracao` \| `homologacao` \| `producao`), `dda_ativo` (bool), `pagamento_ativo` (bool), `contas` (JSON: `[{empresa_lancamento, agencia, conta}]`, sem senha), `ultima_leitura_dda`, `falhas_seguidas`, `observacao` (≤ 500) | list/view: `acesso_financeiro` · update: `acesso_admin` · create/delete: null |
| `contas_pagar.envio_banco` (JSON da SPEC-4-002) | `{id_externo, situacao: 'agendado'\|'pago'\|'recusado'\|'cancelado'\|'verificar', enviado_por, enviado_em, motivo?, atualizado_em}` | só hooks |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-130 | `modo = sem_integracao` | rotinas não rodam; telas mostram o selo "Banco não integrado" | — | P13 |
| RN-131 | DDA | cada boleto novo vira `contas_pagar` `rascunho` origem `dda`, com a empresa do lançamento pelo CNPJ consultado e o fornecedor pelo documento do beneficiário (sem fornecedor → vazio para conferir); já existente por `chave_dedup` → não cria | beneficiário bloqueado → cria com `alerta` "Fornecedor bloqueado (golpe)" | P13 |
| RN-132 | enviar ao banco | só Administrador logado, só contas `aprovada` do lote escolhido, com confirmação mostrando quantidade e total; rotina e agente não chamam esta rota (as chaves da SPEC-4-009 não têm ferramenta de envio) | `modo = homologacao` só envia para o sandbox | P13 |
| RN-133 | resultado incerto (timeout) | `situacao = verificar`; nenhum reenvio até `consultarPagamento` responder | — | P13 |
| RN-134 | situação `pago` | conta vira `paga` com `pago_em` e o comprovante do banco (baixado e anexado quando houver URL) | — | P13 |
| RN-135 | primeira chamada em `producao` | ponto de aprovação: o Administrador muda o modo para `producao` na tela, com o texto "Os próximos envios vão para o banco de verdade" | — | gravação em sistema externo real |

## Fluxo e regras

1. **Levantamento:** o Maestro envia à Agrospy a pergunta pronta ao Sicredi (quais APIs, credenciais, sandbox, certificado). Registra a resposta em `06_notas/`.
2. **Sem API:** `modo = sem_integracao`, selo nas telas, tasks de DDA e envio fecham como "Não se aplica: o Sicredi não tem API para esta conta" com a resposta registrada.
3. **Com API:** adaptador em homologação com o sandbox; provas; o Administrador liga `producao`.
4. **DDA:** rotina às 6h e 13h por empresa do lançamento com conta cadastrada.
5. **Envio:** em "Pagar hoje", botão "Enviar ao banco" (Administrador) → confirmação → `enviarPagamentos` → situações por conta; rotina a cada 2 h consulta `agendado` e `verificar`.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | sem API | selo; lista aprovada | — |
| Principal | DDA com 3 boletos, 1 já lançado por e-mail | 2 rascunhos | — |
| Limite | timeout no envio | `verificar`; sem reenvio | consulta resolve |
| Falha | Administrativo tenta enviar | 403 | — |
| Falha | banco recusa | conta volta a `aprovada` com o motivo | pagar pelo app |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; SPEC-4-002; `00-INDICE.md` (regras comuns); a documentação oficial do Sicredi que a Agrospy enviar (guardar o link em `06_notas/`, sem credencial).
2. **Contexto técnico do Skip:** o da SPEC-4-001; `$http.send` com timeout 30 s; segredos só por `$secrets.get`.
3. **Alterar somente:** as superfícies listadas.
4. **Não alterar:** as regras de aprovação da SPEC-4-002.
5. **Executar nesta ordem:** (1) pergunta ao Sicredi e `config_banco` com o selo (vale também sem API); (2) se houver API: adaptador em homologação, DDA, envio e consulta; (3) provas; (4) produção pelo Administrador.
6. **Parar e pedir validação quando:** (a) a resposta do Sicredi ou as credenciais não chegaram — deixe as tasks de DDA e envio em espera e siga para a SPEC seguinte; (b) a documentação exige algo que o runtime não faz (mTLS, assinatura com certificado) — registre e siga; (c) a primeira chamada em produção (RN-135), que é do Administrador.
7. **Estado válido ao parar:** SPEC-4-002 funcionando sem integração.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: RN-135 (primeiro envio real ao banco).

## Visual

Sistema da SPEC-3-002. `Selo` "Banco não integrado", "DDA", "Agendada no banco", "Verificar"; botão "Enviar ao banco" como `BotaoPrimario` só para Administrador, com confirmação em `Folha`; estados carregando, vazio, erro e sem internet.

## Checklist de execução

- [ ] Pergunta ao Sicredi enviada uma vez e resposta registrada.
- [ ] `config_banco` e selo "Banco não integrado".
- [ ] Com API: DDA, envio e consulta em homologação, com as provas.
- [ ] Sem API: tasks fechadas como "Não se aplica" com a resposta registrada.
- [ ] Evidências em `05_entregas/fase-4/spec-4-004/`.

## Critérios de aceite

- [ ] **CA-4-12:** a resposta do Sicredi está registrada em `06_notas/` (ou a espera, com a data do pedido); com `modo = sem_integracao`, as telas mostram o selo e nenhuma rotina de banco roda.
- [ ] **CA-4-13 (com API de DDA):** em homologação, a leitura do DDA cria só os boletos novos, sem duplicar os já lançados, e com alerta quando o beneficiário está bloqueado. Sem API: "Não se aplica" registrado.
- [ ] **CA-4-14 (com API de pagamento):** em homologação, só Administrador logado envia, só contas `aprovada`; outros perfis recebem 403; timeout vira `verificar` sem reenvio; `pago` dá baixa com comprovante. Sem API: "Não se aplica" registrado.

## TDD da SPEC

**Empresas nas provas:** Teste A. **Simulador:** `lib/banco_sicredi.js` tem um modo `simulado` (só em `homologacao` e só na Teste A) que responde pelo contrato com dados fictícios, usado nas provas de regra; as provas de integração usam o sandbox do Sicredi quando existir.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | envio sem aprovação (CA-4-14) | chamar `enviarPagamentos` com uma conta `lancada` pela rota | 409 (antes da regra, a chamada passaria) | resposta |
| GREEN 1 | sem integração (CA-4-12) | `modo = sem_integracao`; abrir telas; disparar as rotinas | selo visível; rotinas sem chamada | captura + log |
| GREEN 2 | DDA simulado (CA-4-13) | simulado com 3 boletos (1 com linha já lançada, 1 de beneficiário bloqueado) | 2 rascunhos, 1 com alerta | consultas |
| GREEN 3 | envio simulado (CA-4-14) | enviar como `teste.administrativo` e como `teste.admin.a`; simular timeout; consultar | 403; agendado; `verificar` sem reenvio; `pago` com baixa | respostas + consultas |
| GREEN 4 | sandbox real (CA-4-13, CA-4-14) | repetir GREEN 2 e 3 contra o sandbox do Sicredi | mesmos resultados | respostas (sem credencial) |
| REFACTOR/REGRESSÃO | regressão | SPEC-4-002 GREEN 4 e 5 com `modo` em cada valor | sem diferença | relatório |

**Caminhos de erro obrigatórios:** sem API, credencial inválida, timeout, recusa do banco, perfil sem permissão, beneficiário bloqueado.
**Evidência exigida:** em `05_entregas/fase-4/spec-4-004/`, mais o log do Skip; nenhuma credencial em arquivo.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-4/spec-4-004/` e o log do Skip. A resposta do Sicredi e as credenciais são pedidas uma vez e travam só as tasks de DDA e de envio.

## Handoff e operação

- **Como demonstrar:** selo sem integração; com API, DDA e envio em homologação.
- **Como operar depois:** o Administrador liga a produção e acompanha as situações "Verificar".
- **Como monitorar:** contas em `verificar` por mais de 4 h; falhas seguidas do DDA.
- **Pendência conhecida:** CL-PEND-014 (APIs do Sicredi e credenciais).

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Ligar o banco Sicredi aos boletos e pagamentos | Agrospy | SPEC-4-004 | CA-4-12 a CA-4-14 | todas as subtasks | evidências das subtasks | SPEC-4-002 no ar |
| id pendente | Levantar com o Sicredi as APIs de DDA e de pagamento | Agrospy | SPEC-4-004 | CA-4-12 | GREEN 1 | nota + captura | — |
| id pendente | Trazer os boletos do DDA para conferência | Agrospy | SPEC-4-004 | CA-4-13 | GREEN 2 + GREEN 4 (DDA) | consultas | CL-PEND-014 com API de DDA |
| id pendente | Enviar ao banco só os pagamentos aprovados | Agrospy | SPEC-4-004 | CA-4-14 | RED 1 → GREEN 3 + GREEN 4 + REFACTOR | respostas + consultas | CL-PEND-014 com API de pagamento |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
