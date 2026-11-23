# SPEC-4-009 — Conector MCP do sistema: relatórios para qualquer IA e lançamento de despesa pelo bot do Maestro

**Fase:** 4
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** emenda P13 de 23/11/2026 (MCP do sistema para relatórios por qualquer IA, com autenticação; sócios podem lançar despesa pelo bot do Maestro via MCP)
**Degrau da solução:** construção mínima — uma rota do Skip que fala o protocolo MCP (JSON-RPC 2.0 sobre HTTP, transporte "Streamable HTTP" respondendo `application/json`), com chaves de acesso por pessoa. Reusa as consultas e regras das SPECs 3-005 e 4-002 a 4-008.

## Contexto e decisões fechadas

- **Estado atual:** os dados só são vistos pelo app. O assistente da fase 2 lê só o que o usuário vê, dentro do app.
- **Estado desejado:** um sócio cria, em "Conexões de IA", uma chave pessoal e cola o endereço e a chave no conector MCP do Maestro (ou de outra IA). A IA consulta relatórios (comercial, contas a pagar, caixa, RDV, contratos, recebimentos) sempre com as permissões de quem criou a chave. Com a chave de lançamento, o sócio lança uma despesa de RDV conversando com o bot do Maestro.
- **Decisões já fechadas:**
  - **Endereço:** `POST https://<app>/backend/v1/mcp` (e `GET` responde 405). Versão de protocolo anunciada: `2025-06-18`. Métodos: `initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call`.
  - **Autenticação:** cabeçalho `Authorization: Bearer <chave>`. A chave tem 40 caracteres aleatórios com o prefixo `agsp_`; o sistema guarda só o hash SHA-256 e os 8 primeiros caracteres para identificação. Mostrada uma vez na criação.
  - **Quem cria:** Administrador e Gestão criam chave de leitura; só Administrador (sócio) cria chave com o escopo `lancar_rdv`. Validade: 90 dias; revogável a qualquer hora; uma pessoa tem no máximo 5 chaves ativas.
  - **Permissões:** a chave age como a pessoa, numa empresa (tenant) escolhida na criação. Cada ferramenta aplica as mesmas regras de acesso das telas. Desligar o vínculo da pessoa invalida a chave.
  - **Somente leitura, com uma exceção:** a única ferramenta que grava é `lancar_despesa_rdv` (escopo `lancar_rdv`). Nenhuma ferramenta aprova, paga, envia contrato, envia ao banco, apaga ou altera regra. As rotas de aprovação, pagamento e envio recusam requisição autenticada por chave (RN-113, RN-132, RN-162).
  - **Dados pessoais:** as respostas não trazem CPF, CNPJ de pessoa física, telefone, e-mail, linha digitável nem arquivo. Valores e nomes de produtor e fornecedor aparecem (são o conteúdo do relatório).
  - **Limite:** 60 chamadas por minuto por chave; 429 acima disso.
- **Bloqueios:** nenhum para construir. A ligação no Maestro é feita pelo sócio (CL-PEND-016) com o passo a passo desta SPEC.

## Resultado observável

1. O Diogo abre "Conexões de IA", cria a chave "Maestro — leitura e despesas" com o escopo de lançar despesa e copia endereço e chave.
2. No Maestro, ele adiciona o conector MCP com esse endereço e chave.
3. Ele pergunta ao bot: "quanto temos para pagar na quinta, por empresa?" e "como está o caixa da AgroSmart em dezembro?". As respostas batem com as telas.
4. Ele manda a foto do recibo do almoço com o cliente e diz "almoço com o Seu João, R$ 142, AgroSpy, cartão da empresa". O bot chama `lancar_despesa_rdv`, e a despesa aparece em "Minhas despesas" dele com a origem "Maestro".
5. Ele revoga a chave; a próxima pergunta recebe "chave inválida".

## Limites e dependências

- **Inclui:** coleção `chaves_api`; tela "Conexões de IA"; rota `/backend/v1/mcp` com as ferramentas da tabela; limite de chamadas; registro de uso sem conteúdo; passo a passo de ligação no Maestro em `07-sistemas/comercial/conector-mcp.md`.
- **Fora de escopo:** OAuth do MCP; recursos (`resources/*`) e prompts do protocolo; ferramentas de escrita além da despesa; acesso público sem chave; WhatsApp.
- **Entradas e pré-condições:** SPECs 3-005 e 4-002 a 4-008 no ar (as ferramentas de cada área só entram quando a SPEC daquela área estiver no ar; ferramenta de área ainda não construída não aparece em `tools/list`).
- **Saídas/artefatos:** migração, hooks, tela; `07-sistemas/comercial/conector-mcp.md`; evidências em `05_entregas/fase-4/spec-4-009/`.
- **Dependências e responsáveis:** a Agrospy executa; o sócio liga o conector no Maestro dele (CL-PEND-016).
- **Atores e permissões mínimas:** criar chave de leitura: Administrador, Gestão; criar chave `lancar_rdv`: Administrador; revogar: o dono e qualquer Administrador do tenant; ver lista de chaves: o dono vê as suas, o Administrador vê todas do tenant (sem o valor).
- **Superfícies/arquivos/configurações afetadas:** migração `chaves_api` e do campo `mcp_ativo` (bool, padrão true) em `config_financeiro`; `pocketbase/hooks/mcp_rota.js`, `lib/mcp_ferramentas.js`, `lib/chaves_api.js`; `src/pages/config/ConexoesIa.tsx`; `src/services/chaves-api.ts`; `navegacao.ts`; `07-sistemas/comercial/conector-mcp.md`.
- **Risco e plano B:** se o conector MCP do Maestro exigir OAuth em vez de cabeçalho com chave, o Maestro registra a limitação em `06_notas/` e a rota continua disponível para outras IAs; a ligação no Maestro vira pendência para a consultoria decidir.
- **Rollback ou reversão:** `config_financeiro.mcp_ativo = false` faz a rota responder 503; revogar chaves.

## Dados e integrações

| Coleção | Campos (tipo) | Regras de API |
|---|---|---|
| `chaves_api` | `empresa`, `usuario` (rel), `nome` (3–80), `prefixo` (8), `hash` (64, único), `escopos` (JSON: `['leitura']` ou `['leitura','lancar_rdv']`), `expira_em`, `revogada_em`, `revogada_por`, `ultimo_uso_em`, `usos_minuto` (JSON de controle), `created` | list/view: `usuario = @request.auth.id \|\| @request.auth.acesso_admin.id ?= empresa` (o campo `hash` fica oculto) · create/update/delete: null (só rotas) |

| Ferramenta (`tools/call`) | Escopo | Entrada (JSON Schema resumido) | Saída | Regra |
|---|---|---|---|---|
| `resumo_comercial` | leitura | `{periodo_inicio, periodo_fim, responsavel_email?}` | números do painel da SPEC-3-005 | Comercial só a própria carteira |
| `fila_prioridades` | leitura | `{limite ≤ 50}` | grupos da fila da SPEC-3-005 (produtor, motivo, data) | idem |
| `contas_a_pagar` | leitura | `{status?, dia_pagamento?, empresa_lancamento?}` | lista e totais por empresa (fornecedor, valor, vencimento, previsto, status) | só `acesso_financeiro` |
| `fluxo_de_caixa` | leitura | `{empresa_lancamento \| 'todas', de, ate, agrupar}` | resultado da rota da SPEC-4-008 | só `acesso_financeiro` |
| `despesas_rdv` | leitura | `{mes, funcionario_email?, categoria?}` | totais e lista (sem arquivos) | financeiro vê todos; os demais só as próprias |
| `contratos` | leitura | `{status?}` | lista (produtor, serviço, valor, status, datas) | regras da SPEC-4-007 |
| `recebimentos` | leitura | `{status?, de?, ate?}` | lista e totais por empresa | só `acesso_financeiro` |
| `lancar_despesa_rdv` | `lancar_rdv` | `{data, valor, empresa_lancamento (nome), categoria, motivo, custeio, fornecedor_nome?, produtor_nome?, km_rodado?, descricao?, imagem_base64? (jpg/png ≤ 4 MB), sem_comprovante_justificativa?}` | `{id, resumo}` ou erro com o que falta | aplica RN-140 a RN-147 da SPEC-4-005 com `origem = 'mcp'` e `funcionario` = dono da chave; idempotência por `id_local` = hash(chave + data + valor + fornecedor) em 10 min |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-180 | chave | inválida, expirada, revogada ou com vínculo inativo → erro JSON-RPC `-32001` "chave inválida" com HTTP 401 | — | P13 |
| RN-181 | escopo | ferramenta de escrita sem `lancar_rdv` → erro `-32003` "sem permissão" | — | P13 |
| RN-182 | limite | > 60 chamadas/min por chave → HTTP 429 | — | P13 |
| RN-183 | conteúdo | argumentos e respostas nunca vão para o log; o log guarda chave (prefixo), ferramenta, duração e status | — | privacidade |
| RN-184 | saída | sem CPF, telefone, e-mail, linha digitável, arquivos e segredos; texto de campos livres cortado em 300 caracteres | — | privacidade |
| RN-185 | ações proibidas | não existe ferramenta para aprovar, pagar, enviar contrato, enviar ao banco, apagar ou alterar configuração | — | P13 |

## Fluxo e regras

1. **Conexões de IA** (`/config/conexoes-ia`): lista das chaves (nome, prefixo, escopos, criada, último uso, expira); "Nova chave" (nome, empresa, escopo) → mostra a chave uma vez com "Copiar" e o endereço; "Revogar".
2. **Rota MCP:** valida a chave → aplica limite → resolve o método → em `tools/call`, executa a ferramenta com o usuário dono da chave e devolve `content: [{type: 'text', text: <JSON>}]` e `structuredContent`.
3. **Passo a passo no Maestro** (em `07-sistemas/comercial/conector-mcp.md`): adicionar conector MCP remoto, colar o endereço, cabeçalho `Authorization: Bearer <chave>`, testar com `tools/list`.

## Configuração no Maestro

- **Tipo:** conector compartilhado
- **Sistemas usados:** SPEC-3-005 (painel e fila), SPECs 4-002 a 4-008 (financeiro, RDV, contratos, recebimentos)
- **Agente responsável:** assistente principal do Maestro do sócio

### Meta

- **Nome curto:** dados do sistema na conversa
- **O que atingir:** o sócio obtém pelo bot os mesmos números das telas e lança despesa sem abrir o app
- **Prazo do ciclo:** contínuo (não é loop de meta; é conector que os loops 4-010 e 5-004 usam)
- **Valor estimado:** não estimado

### Validação

- **Como saber que foi atingido:** a bateria de perguntas da prova devolve números iguais às rotas do app
- **Modo:** conta entrega
- **Fonte independente:** consultas diretas na base (SQL de conferência)
- **Baseline / alvo / unidade:** 0 / 100% das 8 ferramentas conferidas / ferramentas
- **Cadência:** na construção e na regressão da fase 5
- **Responsável pelo veredito:** Maestro, pela prova automática

### Conectores e skills

| Item | Tipo | Uso | Permissão/entrada | Saída | Plano B |
|---|---|---|---|---|---|
| Conector MCP "Agrospy" | conector remoto | consultas e lançamento de despesa | chave pessoal (leitura ou `lancar_rdv`) | JSON das ferramentas | app |

### Arranque

- **Instruções permanentes:** "Use o conector Agrospy para responder sobre carteira, contas a pagar, caixa, despesas, contratos e recebimentos. Nunca diga que aprovou, pagou ou enviou algo: o conector não faz isso. Para lançar despesa, confirme com o sócio valor, data e empresa antes de chamar `lancar_despesa_rdv`."
- **Primeiras tarefas:** `tools/list`; perguntar o total a pagar do próximo dia de pagamento.
- **Autonomia:** não (consulta quando o sócio pergunta; lança só com confirmação).
- **Limites e aprovações:** só a chave do próprio sócio; nenhuma ação financeira.
- **Teto de créditos:** não definido.
- **Condição de pausa/recuperação:** erro 401 → pedir ao sócio uma chave nova; 429 → esperar 1 minuto.

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; as rotas de consulta das SPECs 3-005 e 4-002 a 4-008; a especificação pública do MCP (transporte Streamable HTTP, `initialize`, `tools/list`, `tools/call`); `00-INDICE.md` (regras comuns).
2. **Contexto técnico do Skip:** o da SPEC-4-001; hash com `$security.sha256`; chave gerada com `$security.randomString(40)`; nenhuma ferramenta chama outra rota HTTP do próprio app: chama as funções das libs com o usuário dono da chave.
3. **Alterar somente:** as superfícies listadas. A chave só é aceita na rota MCP; as outras rotas continuam exigindo a sessão do app.
4. **Não alterar:** regras de acesso das telas.
5. **Executar nesta ordem:** (1) `chaves_api` e tela; (2) rota com `initialize`, `ping`, `tools/list`; (3) ferramentas de leitura das áreas já no ar; (4) `lancar_despesa_rdv`; (5) limite e log; (6) passo a passo do Maestro e prova com um cliente MCP real.
6. **Parar e pedir validação quando:** nenhuma parada prevista. A ligação no Maestro do sócio é do sócio (CL-PEND-016); o Maestro manda o passo a passo e segue.
7. **Estado válido ao parar:** o app funciona igual; a rota pode ficar desligada por configuração.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

Sistema da SPEC-3-002. Tela "Conexões de IA" com `ListaItem` por chave, `Selo` de escopo e de expiração; chave nova mostrada uma vez num `Cartao` com fonte monoespaçada, botão "Copiar" e o aviso "Guarde agora: ela não aparece de novo"; revogar com confirmação em `Folha`; estados carregando, vazio, erro e sem internet.

## Checklist de execução

- [ ] Chaves com hash, validade, escopos e revogação.
- [ ] Rota MCP com `initialize`, `tools/list`, `tools/call` e erros JSON-RPC.
- [ ] 7 ferramentas de leitura e `lancar_despesa_rdv`.
- [ ] Limite de 60/min e log sem conteúdo.
- [ ] Passo a passo do Maestro e prova com cliente MCP.
- [ ] Evidências em `05_entregas/fase-4/spec-4-009/`.

## Critérios de aceite

- [ ] **CA-4-31:** a chave aparece uma vez, só o hash fica salvo; Gestão não cria chave `lancar_rdv` (403); chave revogada, expirada ou de vínculo desligado dá 401; acima de 60 chamadas/min dá 429.
- [ ] **CA-4-32:** um cliente MCP real (o inspetor oficial do MCP ou o próprio Maestro) faz `initialize` e `tools/list` e recebe as 8 ferramentas; cada ferramenta de leitura devolve números iguais às rotas do app e à consulta direta na base; chave de `teste.comercial1` em `contas_a_pagar` recebe erro de permissão e em `resumo_comercial` só a própria carteira; nenhuma resposta contém CPF, telefone, e-mail ou linha digitável.
- [ ] **CA-4-33:** `lancar_despesa_rdv` com chave `lancar_rdv` cria 1 despesa com `origem = 'mcp'` do dono da chave; sem valor, data ou empresa devolve o que falta e não grava; repetir a mesma chamada em 10 min não duplica; com chave só de leitura, erro `-32003`; não existe ferramenta de aprovar, pagar ou enviar em `tools/list`.

## TDD da SPEC

**Empresas nas provas:** Teste A. **Chaves de teste:** criadas para `teste.admin.a` (leitura + `lancar_rdv`), `teste.gestao` (leitura) e `teste.comercial1` (leitura), guardadas só nas credenciais do executor. **Fixtures:** as das SPECs 4-002, 4-006 e 4-008.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | sem chave (CA-4-31) | `tools/list` sem cabeçalho antes da validação | responde (falha esperada); depois, 401 | resposta |
| GREEN 1 | chaves (CA-4-31) | criar e ler a coleção; `teste.gestao` cria `lancar_rdv`; revogar e chamar; expirar pelo relógio de teste; desligar vínculo de teste; 61 chamadas em 1 min | só hash; 403; 401; 401; 401; 429 na 61ª | respostas + consulta |
| GREEN 2 | leitura (CA-4-32) | inspetor MCP: `initialize`, `tools/list`; chamar as 7 de leitura com as 3 chaves; comparar com as rotas e SQL; varrer as respostas por padrões de CPF, telefone, e-mail e linha digitável | 8 ferramentas; valores iguais; permissões certas; 0 ocorrências | respostas + diff |
| GREEN 3 | escrita (CA-4-33) | `lancar_despesa_rdv` completo; sem empresa; repetir; com chave de leitura | 1 despesa `mcp`; erro com `faltando`; sem nova; `-32003` | respostas + consulta |
| REFACTOR/REGRESSÃO | regressão | (a) aprovar conta, enviar contrato e enviar ao banco com `Authorization: Bearer <chave>` → recusado (401 ou 403, nunca 200); (b) log do Skip sem argumentos nem respostas; (c) capturas da tela e axe-core | recusado nos três; log limpo; sem falha séria | relatório |

**Caminhos de erro obrigatórios:** sem chave, chave inválida, revogada, expirada, vínculo inativo, escopo, limite, argumento inválido, ferramenta inexistente (`-32601`).
**Evidência exigida:** em `05_entregas/fase-4/spec-4-009/`, mais o log do Skip; nenhuma chave em arquivo.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-4/spec-4-009/` e o log do Skip. A ligação no Maestro do sócio usa o passo a passo e não trava a construção.

## Handoff e operação

- **Como demonstrar:** criar a chave, ligar no Maestro, perguntar o total a pagar e lançar uma despesa.
- **Como operar depois:** cada sócio cuida das próprias chaves e renova a cada 90 dias (aviso no app 7 dias antes de expirar).
- **Como monitorar:** chaves sem uso há 30 dias; respostas 401/429.
- **Pendência conhecida:** CL-PEND-016 (o sócio liga o conector no Maestro dele).

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Abrir os dados do sistema para as IAs com segurança | Agrospy | SPEC-4-009 | CA-4-31 a CA-4-33 | todas as subtasks | evidências das subtasks | SPECs 4-002 a 4-008 no ar |
| id pendente | Criar as chaves de acesso por pessoa | Agrospy | SPEC-4-009 | CA-4-31 | RED 1 → GREEN 1 | respostas + consulta | SPEC-4-001 |
| id pendente | Responder aos relatórios pelo conector MCP | Agrospy | SPEC-4-009 | CA-4-32 | GREEN 2 + REFACTOR (a)(b) | respostas + diff | chaves |
| id pendente | Lançar despesa pelo bot do Maestro | Agrospy | SPEC-4-009 | CA-4-33 | GREEN 3 + REFACTOR (c) | respostas + consulta | conector MCP |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
