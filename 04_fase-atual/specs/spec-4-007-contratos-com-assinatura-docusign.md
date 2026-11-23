# SPEC-4-007 — Contratos: modelos, geração a partir da venda e assinatura pelo DocuSign

**Fase:** 4
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** RQ-007; RQ-011; P4 (modelos criados e geridos no sistema); Fase 4, "aba de modelos de contrato" e "rascunho de contrato com a condição negociada"; emenda P13 de 23/11/2026 (gerar contrato de produtor, área, serviço e condições; assinatura via DocuSign pela API; status volta ao sistema; contrato assinado alimenta os recebimentos por empresa)
**Degrau da solução:** nativo + integração externa mínima:
- **Nativo:** coleções e rotas do Skip; o contrato é montado em HTML no servidor a partir do modelo;
- **Integração:** API eSignature do DocuSign (REST v2.1), que converte o HTML em PDF, coleta as assinaturas e devolve o PDF assinado.

## Contexto e decisões fechadas

- **Estado atual:** a venda ganha guarda a condição negociada (`condicoes_negociadas`, SPEC-3-004). Não há contrato no sistema; a Rumo Agro nunca teve contrato formal.
- **Estado desejado:** de uma venda ganha (ou do produtor, para contrato avulso), o usuário escolhe o modelo, confere produtor, propriedade, área, serviço (ex.: pulverização com drone), empresa contratada e condições, e gera o contrato. Depois de revisar, um Administrador ou Gestão toca "Enviar para assinatura": o DocuSign manda ao produtor e ao sócio, o status volta ao sistema e o PDF assinado fica no contrato.
- **Decisões já fechadas:**
  - **Modelo:** texto com campos entre chaves duplas (lista fechada na tabela "Campos do modelo"); versões imutáveis depois de ativadas (editar um modelo ativo cria nova versão). Só Administrador e Gestão criam, editam, ativam e arquivam (P4).
  - **Modelo fictício até chegar o real:** a migração cria "MODELO FICTÍCIO — Prestação de serviço de pulverização com drone", com cláusulas genéricas de objeto, área, prazo de execução, entrega, preço e pagamento, multa por atraso de pagamento (2% + 1% ao mês) e foro, e com a faixa "MODELO FICTÍCIO — não usar com cliente" no topo do documento. Contrato gerado com modelo fictício não pode ser enviado em `producao` (só no ambiente de demonstração do DocuSign). O modelo real (multas, prazos, entrega) vem do Diogo (CL-002).
  - **Empresa contratada:** a empresa do lançamento (SPEC-4-001) escolhida no contrato; o CNPJ e a razão social dela entram no texto. Sem CNPJ cadastrado, o contrato não é enviado.
  - **Revisão humana obrigatória:** gerar não envia. Só Administrador ou Gestão envia, e a IA nunca envia nem altera cláusula.
  - **Assinantes:** 1) o produtor (nome e e-mail do cadastro, editáveis no contrato); 2) o representante da empresa contratada (Administrador escolhido no envio). Ordem: produtor primeiro.
  - **Autenticação DocuSign:** JWT Grant com a chave RSA da integração, assinada com `jsrsasign` no hook. Se o runtime não aceitar a biblioteca, plano B: Authorization Code Grant com refresh token guardado no cofre e renovado pela rotina diária (consentimento único do Administrador).
  - **Retorno do status:** DocuSign Connect (webhook) com verificação HMAC para `/backend/v1/docusign/connect`; se o plano da conta não tiver Connect, rotina a cada 30 min consulta os envelopes `enviado_assinatura`.
  - **Ambientes:** a construção e as provas usam a conta de desenvolvedor (demo, `account-d.docusign.com`). A conta de produção é criada pela Agrospy (CL-PEND-015); o DocuSign exige a revisão de "go-live" da integração antes de liberar a produção.
  - **Segredos** no cofre do Skip: `DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_USER_ID`, `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_PRIVATE_KEY`, `DOCUSIGN_BASE_URI`, `DOCUSIGN_AUTH_SERVER`, `DOCUSIGN_CONNECT_HMAC`.
- **Bloqueios:** a assinatura real depende da conta DocuSign da Agrospy e dos segredos (CL-PEND-015); o texto final depende do modelo real (CL-002). Enquanto isso, tudo é construído e provado com a conta demo e o modelo fictício. Se nem a conta demo existir, o Maestro cria a conta de desenvolvedor gratuita só se tiver acesso a um e-mail da Agrospy para isso; senão, pede uma vez e segue com as outras SPECs.

## Resultado observável

1. O Diogo abre a venda ganha da Fazenda Santa Rita (pulverização com drone, 320 ha, entrada e 2 parcelas) e toca "Gerar contrato".
2. O app mostra o contrato preenchido com o modelo ativo, a empresa contratada AgroSpy, o produtor, a propriedade, a área, o serviço e as parcelas. Ele corrige o e-mail do produtor e toca "Enviar para assinatura".
3. O produtor recebe o e-mail do DocuSign e assina; depois o Diogo assina. O contrato no app passa a "Assinado" com o PDF assinado para baixar.
4. As parcelas aparecem em "Recebimentos" da AgroSpy (SPEC-4-008).

## Limites e dependências

- **Inclui:** `modelos_contrato` e `contratos`; tela de modelos; geração do HTML; tela do contrato (prévia, editar assinantes, enviar, cancelar); integração DocuSign (autenticação, envelope, Connect ou consulta, download do PDF assinado); evento "contrato assinado" para a SPEC-4-008.
- **Fora de escopo:** editor rico de cláusulas (o modelo é texto com marcação simples: títulos com `#`, parágrafos e listas); assinatura por outro serviço; envio de contrato por WhatsApp; aditivos; cobrança (SPEC-4-008).
- **Entradas e pré-condições:** SPECs 3-004 (`condicoes_negociadas`, `servicos`) e 4-001 no ar.
- **Saídas/artefatos:** migrações, hooks, rotas, telas; evidências em `05_entregas/fase-4/spec-4-007/`.
- **Dependências e responsáveis:** a Agrospy executa; o Diogo cria a conta DocuSign e cadastra os segredos (CL-PEND-015) e envia o modelo real (CL-002).
- **Atores e permissões mínimas:**

  | Ação | Administrador | Gestão | Administrativo | Comercial | Operador |
  |---|---|---|---|---|---|
  | Modelos (criar, editar, ativar, arquivar) | sim | sim | não | não | não |
  | Gerar contrato | sim | sim | não | só das próprias vendas ganhas (gera rascunho) | não |
  | Ver contratos | todos | todos | todos (só leitura) | só os das próprias oportunidades | não |
  | Enviar para assinatura, cancelar envio | sim | sim | não | não | não |

- **Superfícies/arquivos/configurações afetadas:** migrações de `modelos_contrato` e `contratos` e do campo `contratos_envio_ativo` (bool, padrão true) em `config_financeiro`; `pocketbase/hooks/contratos_rotas.js`, `docusign_connect.js`, `docusign_rotina.js`, `lib/contrato_html.js`, `lib/docusign.js`; dependência `jsrsasign` (hooks); `src/pages/contratos/Modelos.tsx`, `ModeloEditar.tsx`, `Contratos.tsx`, `ContratoDetalhe.tsx`; botão "Gerar contrato" na oportunidade ganha e na ficha do produtor; `src/services/contratos.ts`; `navegacao.ts`; `vitrine.ts`.
- **Risco e plano B:** JWT sem `jsrsasign` → Authorization Code Grant (acima); sem Connect → consulta a cada 30 min; conversão de HTML pelo DocuSign com problema de layout → o HTML usa só tags simples (h1–h3, p, ul, ol, table, strong) e CSS em linha.
- **Rollback ou reversão:** cancelar o envelope pela tela (`voided` no DocuSign) enquanto não assinado; modelos arquivados não geram contratos novos; desligar o envio por `config_financeiro.contratos_envio_ativo = false`.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| DocuSign OAuth `POST {auth_server}/oauth/token` | DocuSign | JWT Grant (`urn:ietf:params:oauth:grant-type:jwt-bearer`), escopos `signature impersonation` | chave RSA no cofre | token guardado em memória do hook até 5 min antes de expirar | erro de consentimento → aviso ao Administrador com o link de consentimento |
| `POST {base_uri}/restapi/v2.1/accounts/{account}/envelopes` | contrato | documento `{documentBase64, name, fileExtension: 'html', documentId: '1'}`; `recipients.signers` com `anchorString` `/ass_produtor/` e `/ass_empresa/` (texto branco no HTML); `status: 'sent'`; `customFields.textCustomFields` com `contrato_id` | token | timeout 30 s; idempotência: o contrato guarda `docusign_envelope_id` e não cria outro enquanto houver envelope ativo | erro → contrato fica `em_revisao` com a mensagem |
| Connect → `POST /backend/v1/docusign/connect` | DocuSign | evento JSON (`envelope-sent`, `recipient-completed`, `envelope-completed`, `envelope-declined`, `envelope-voided`) | cabeçalho `X-DocuSign-Signature-1` (HMAC-SHA256 com `DOCUSIGN_CONNECT_HMAC`) | evento repetido é idempotente (status só avança) | HMAC inválido → 401 sem processar |
| `GET .../envelopes/{id}/documents/combined` | DocuSign | PDF assinado | token | 1 vez ao concluir; nova tentativa na rotina | falha → `pdf_pendente = true` |

| Coleção | Campos (tipo) | Regras de API |
|---|---|---|
| `modelos_contrato` | `empresa`, `nome` (≤ 120), `corpo` (texto ≤ 50.000), `versao` (número), `status` (`rascunho` \| `ativo` \| `arquivado`), `ficticio` (bool), `modelo_origem` (rel, versão anterior), `criado_por`, `ativado_por`, `ativado_em`, `created`/`updated` | list/view: `acesso_financeiro` ou Comercial (só `ativo`) · create/update: só rotas (Administrador/Gestão) · delete: null |
| `contratos` | `empresa`, `empresa_lancamento` (req), `oportunidade` (rel, opcional), `condicao` (rel `condicoes_negociadas`, opcional), `produtor` (req), `propriedade` (rel, opcional), `servico_descricao` (≤ 500, req), `linha_negocio` (rel), `area_ha` (número ≥ 0), `safra` (≤ 20), `valor_total_centavos` (> 0), `parcelas` (JSON `[{numero, valor_centavos, vencimento}]`, a entrada como número 0), `prazo_execucao` (≤ 200), `modelo` (rel), `modelo_versao` (número), `html` (texto, gerado), `assinantes` (JSON `[{papel: 'produtor'\|'empresa', nome, email, usuario?}]`), `status` (`rascunho` \| `em_revisao` \| `enviado_assinatura` \| `assinado` \| `recusado` \| `cancelado`), `docusign_envelope_id`, `docusign_ambiente` (`demo` \| `producao`), `eventos` (JSON append-only), `pdf_assinado` (arquivo protegido), `pdf_pendente` (bool), `gerado_por`, `enviado_por`, `enviado_em`, `assinado_em`, `motivo` (≤ 500) | list/view: `acesso_financeiro.id ?= empresa \|\| (oportunidade.responsavel = @request.auth.id)` · create/update/delete: null (só rotas) |

**Campos do modelo** (fechados): `{{empresa_razao_social}}`, `{{empresa_cnpj}}`, `{{produtor_nome}}`, `{{produtor_documento}}`, `{{produtor_endereco_faturamento}}`, `{{produtor_email}}`, `{{propriedade_nome}}`, `{{propriedade_municipio}}`, `{{area_ha}}`, `{{safra}}`, `{{servico_descricao}}`, `{{prazo_execucao}}`, `{{valor_total}}` (R$ formatado), `{{valor_total_extenso}}`, `{{tabela_parcelas}}` (tabela HTML), `{{data_contrato}}` (dd/mm/aaaa), `{{municipio_empresa}}`. Campo desconhecido no modelo → o modelo não ativa (400 com a lista). Campo vazio na geração → o contrato fica `rascunho` com a lista "Falta preencher".

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-160 | gerar a partir da venda | copia produtor, propriedade (do serviço da venda, se houver), linha, `produto_servico`, valor e parcelas da `condicoes_negociadas` não cancelada; a pessoa ajusta área, safra, prazo e empresa contratada | condição cancelada → 409 | RQ-011 |
| RN-161 | soma das parcelas | entrada + parcelas = valor total (tolerância de 1 centavo), vencimentos crescentes | — | RN-66 (fase 3) |
| RN-162 | enviar | exige status `em_revisao` ou `rascunho` sem "Falta preencher", CNPJ da empresa contratada, e-mail válido de cada assinante, perfil Administrador/Gestão e `contratos_envio_ativo`; modelo `ficticio` só no ambiente demo | — | P4; P13 |
| RN-163 | status | `envelope-sent` → `enviado_assinatura`; `envelope-completed` → `assinado` (baixa o PDF); `declined` → `recusado`; `voided` → `cancelado`; status nunca volta (exceto `cancelado` → novo rascunho por "Gerar de novo") | — | P13 |
| RN-164 | contrato assinado | grava `assinado_em` e publica o evento para a SPEC-4-008 criar as parcelas | — | P13 |
| RN-165 | modelo ativo editado | cria nova versão em `rascunho`; a anterior continua `ativo` até a nova ser ativada, aí fica `arquivado`; contratos guardam a versão usada | — | P4 |

## Fluxo e regras

1. **Modelos** (`/contratos/modelos`): lista com status, versão e selo "Fictício"; editor de texto com a lista dos campos para inserir e prévia com dados fictícios; ativar e arquivar.
2. **Gerar:** botão na oportunidade ganha ("Gerar contrato") e na ficha do produtor ("Novo contrato"); folha com empresa contratada, modelo, propriedade, área, safra, prazo e assinantes → `rascunho` com a prévia.
3. **Contrato** (`/contratos/{id}`): prévia do documento, "Falta preencher", assinantes, histórico de eventos, "Enviar para assinatura" (confirmação em folha mostrando ambiente demo/produção), "Cancelar envio", "Baixar assinado".
4. **Contratos** (`/contratos`): lista por status e empresa contratada.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | venda ganha com entrada e 2 parcelas | contrato com tabela de 3 linhas; enviado; assinado no demo; PDF baixado | — |
| Limite | Connect repete o evento | sem mudança | — |
| Limite | modelo editado depois de gerar | contrato mantém a versão antiga | — |
| Falha | produtor sem e-mail | não envia: "Informe o e-mail do produtor" | editar assinante |
| Falha | HMAC inválido no Connect | 401 | — |
| Falha | Comercial tenta enviar | 403 | — |
| Falha | modelo fictício em produção | 400 | ativar o modelo real |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; SPEC-3-004 (`condicoes_negociadas`, desfecho e `servicos`); SPEC-4-001; `00-INDICE.md` (regras comuns); a documentação pública do DocuSign eSignature REST v2.1 (JWT Grant, Envelopes: create, Connect HMAC).
2. **Contexto técnico do Skip:** o da SPEC-4-001; `$http.send` com timeout 30 s; segredos por `$secrets.get`; a rota do Connect é pública mas só processa com HMAC válido; o log nunca registra nome, e-mail ou valor.
3. **Alterar somente:** as superfícies listadas.
4. **Não alterar:** `condicoes_negociadas` e o desfecho da SPEC-3-004 (só ler).
5. **Executar nesta ordem:** (1) modelos com o fictício; (2) geração do HTML e prévia; (3) contrato a partir da venda e avulso; (4) DocuSign demo: autenticação e envio; (5) Connect ou consulta, PDF assinado e evento; (6) provas visuais.
6. **Parar e pedir validação quando:** (a) faltam os segredos do DocuSign demo e não há como criar a conta de desenvolvedor — pedir uma vez e deixar as tasks de envio e status em espera; (b) primeiro envio em `producao` (RN-162/ambiente), que é feito por um Administrador na tela depois do go-live do DocuSign e com o modelo real ativo.
7. **Estado válido ao parar:** gerar e revisar contrato funciona sem DocuSign.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: primeiro envio de contrato real em produção (gravação em sistema externo real), feito pelo Administrador.

## Visual

Sistema da SPEC-3-002. Prévia do contrato num `Cartao` branco com fonte serifada do sistema, rolagem própria; `Selo` de status (Rascunho, Em revisão, Enviado, Assinado, Recusado, Cancelado) e de ambiente ("Demonstração"); faixa "MODELO FICTÍCIO" em cor de alerta; editor do modelo em `Textarea` com a lista dos campos em `FiltroPilulas` para inserir; confirmação de envio em `Folha`; estados carregando, vazio, erro e sem internet.

## Checklist de execução

- [ ] Modelos com versões e o modelo fictício.
- [ ] Geração do HTML com todos os campos e a tabela de parcelas.
- [ ] Contrato a partir da venda e avulso, com "Falta preencher".
- [ ] DocuSign demo: envio, Connect (ou consulta), PDF assinado.
- [ ] Evento de contrato assinado.
- [ ] Capturas, axe-core e evidências em `05_entregas/fase-4/spec-4-007/`.

## Critérios de aceite

- [ ] **CA-4-23:** o modelo com campo desconhecido não ativa (400); editar um modelo ativo cria a versão 2 e o contrato gerado antes continua com a versão 1; só Administrador e Gestão mexem em modelos (Administrativo e Comercial: 403).
- [ ] **CA-4-24:** gerar a partir da venda ganha da fixture traz produtor, serviço, valor e as 3 linhas de pagamento iguais à condição negociada; campo vazio deixa "Falta preencher" e bloqueia o envio; o HTML gerado não contém nenhum `{{` sobrando.
- [ ] **CA-4-25:** no DocuSign demo, enviar como `teste.admin.a` cria 1 envelope com os 2 assinantes na ordem; enviar de novo não cria outro; Comercial e Administrativo recebem 403; modelo fictício em `producao` dá 400.
- [ ] **CA-4-26:** concluir as assinaturas no demo leva o contrato a `assinado` com o PDF assinado anexado e publica o evento; evento repetido não muda nada; HMAC inválido dá 401; recusa leva a `recusado`.

## TDD da SPEC

**Empresas nas provas:** Teste A. **Conta:** DocuSign demo. **Assinantes de teste:** dois e-mails de teste controlados pelo executor (nunca de produtor real). **Fixture:** oportunidade ganha de teste com condição de R$ 48.000 (entrada R$ 8.000 + 2 × R$ 20.000), serviço "TESTE — pulverização com drone", 320 ha.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | campo desconhecido (CA-4-23) | ativar modelo com `{{campo_inexistente}}` antes da validação | ativa (falha esperada); depois, 400 | resposta |
| GREEN 1 | modelos (CA-4-23) | criar, ativar, editar ativo, ativar v2; gerar contrato antes e depois; como `teste.administrativo` e `teste.comercial1` | v2 criada; contratos com v1 e v2; 403 | respostas |
| GREEN 2 | geração (CA-4-24) | gerar da fixture; procurar `{{` no HTML; gerar sem área | campos e 3 linhas certos; 0 ocorrências; "Falta preencher: área" | HTML + resposta |
| GREEN 3 | envio demo (CA-4-25) | enviar como `teste.admin.a`; enviar de novo; enviar como `teste.comercial1` e `teste.administrativo`; mudar para `producao` com modelo fictício | 1 envelope; mesmo id; 403; 403; 400 | respostas + id do envelope |
| GREEN 4 | status (CA-4-26) | assinar no demo com os e-mails de teste (navegador automatizado) ou usar o simulador de evento com HMAC válido; repetir o evento; evento com HMAC inválido; outro envelope recusado | `assinado` + PDF + evento; sem mudança; 401; `recusado` | consultas + PDF |
| REFACTOR/REGRESSÃO | regressão e visual | (a) desfecho e condição da SPEC-3-004 sem diferença; (b) capturas 390×844 e 1280×800 de modelos, contrato e lista; axe-core | sem diferença; sem falha séria | relatório |

**Caminhos de erro obrigatórios:** campo desconhecido, campo vazio, sem e-mail, sem CNPJ, perfil sem permissão, HMAC inválido, evento repetido, recusa, cancelamento, DocuSign fora.
**Evidência exigida:** em `05_entregas/fase-4/spec-4-007/`, mais o log do Skip; nenhum segredo em arquivo.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-4/spec-4-007/` e o log do Skip. A conta DocuSign de produção e o modelo real são pedidos uma vez e não travam a construção.

## Handoff e operação

- **Como demonstrar:** gerar o contrato da venda de teste, enviar no demo e mostrar o PDF assinado.
- **Como operar depois:** Gestão revisa e envia; o Administrador mantém os modelos.
- **Como monitorar:** contratos `enviado_assinatura` há mais de 7 dias; `pdf_pendente`.
- **Pendência conhecida:** CL-PEND-015 (conta DocuSign, segredos e go-live); CL-002 (modelo real: multas, prazos, entrega).

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Gerar o contrato e mandar para assinatura | Agrospy | SPEC-4-007 | CA-4-23 a CA-4-26 | todas as subtasks | evidências das subtasks | SPECs 3-004 e 4-001 no ar |
| id pendente | Criar e ativar os modelos de contrato | Agrospy | SPEC-4-007 | CA-4-23 | RED 1 → GREEN 1 | respostas | SPEC-4-001 |
| id pendente | Gerar o contrato a partir da venda ganha | Agrospy | SPEC-4-007 | CA-4-24 | GREEN 2 | HTML + resposta | modelos |
| id pendente | Mandar o contrato para assinatura pelo DocuSign | Agrospy | SPEC-4-007 | CA-4-25 | GREEN 3 | respostas | segredos do DocuSign demo |
| id pendente | Trazer de volta o status da assinatura e o contrato assinado | Agrospy | SPEC-4-007 | CA-4-26 | GREEN 4 + REFACTOR (a)(b) | consultas + PDF + capturas | envio |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
