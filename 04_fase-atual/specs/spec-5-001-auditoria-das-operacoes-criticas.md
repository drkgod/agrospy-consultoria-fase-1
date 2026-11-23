# SPEC-5-001 — Auditoria das operações críticas

**Fase:** 5
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** Fase 5, "auditoria de operações críticas (troca de responsável, alteração de modelo, fechamento de RDV)"; emenda P13 de 23/11/2026 (aprovação de pagamento, golpe, contratos e chaves de IA entram na lista)
**Degrau da solução:** reuso + construção mínima — os eventos que já existem (`eventos`, `eventos_financeiros`, histórico de contratos e despesas) continuam; uma coleção única `auditoria`, append-only, recebe uma linha por operação crítica pela função `registrarAuditoria` chamada nas rotas e hooks existentes.

## Contexto e decisões fechadas

- **Estado atual:** cada área guarda o próprio histórico, em formatos diferentes; não há uma tela única para responder "quem aprovou esse pagamento" ou "quem mudou o perfil desse usuário".
- **Estado desejado:** toda operação crítica das fases 1 a 5 gera uma linha em `auditoria` com quem, quando, o quê, em qual registro e o resumo de antes/depois. O Administrador consulta e exporta. Ninguém edita nem apaga.
- **Decisões já fechadas:**
  - **Lista fechada de ações** (tabela "Ações auditadas"). Ação fora da lista não é auditada nesta SPEC.
  - **Append-only:** create/update/delete null pela API; só `registrarAuditoria` grava, dentro da mesma transação da operação (se a operação falhar, não há linha; se a linha falhar, a operação falha).
  - **Resumo sem dado sensível:** `antes` e `depois` guardam só os campos que mudaram, sem CPF/CNPJ de pessoa, telefone, e-mail, linha digitável, valores de segredo ou conteúdo de arquivo. Valores financeiros entram (são o objeto da auditoria).
  - **Guarda:** 5 anos (sem rotina de limpeza nesta SPEC).
  - **Histórico anterior:** uma migração copia para `auditoria` os eventos já existentes de troca de responsável (`eventos`) e de `eventos_financeiros`, marcados `origem = 'migrado'`.
- **Bloqueios:** nenhum.

## Resultado observável

O Diogo abre "Auditoria", filtra "Aprovação de pagamento" em novembro e vê: data e hora, quem aprovou, a conta (fornecedor e valor), a empresa do lançamento. Filtra "Perfil alterado" e vê quem deu o perfil Administrativo à funcionária. Exporta em CSV.

## Limites e dependências

- **Inclui:** coleção `auditoria`; `lib/auditoria.js`; chamadas nas rotas e hooks das ações auditadas; migração do histórico; tela "Auditoria" com filtros e exportação CSV.
- **Fora de escopo:** auditoria de leitura (quem viu); alerta em tempo real de comportamento suspeito; assinatura criptográfica das linhas.
- **Entradas e pré-condições:** fases 1–4 no ar.
- **Saídas/artefatos:** migrações, `lib/auditoria.js`, alterações pontuais nas rotas listadas, tela; evidências em `05_entregas/fase-5/spec-5-001/`.
- **Dependências e responsáveis:** a Agrospy executa. Nada depende do Diogo.
- **Atores e permissões mínimas:** consultar e exportar: Administrador do tenant; ninguém grava pela API.
- **Superfícies/arquivos/configurações afetadas:** migração `auditoria` e da cópia do histórico; `pocketbase/hooks/lib/auditoria.js`; uma linha de chamada em cada rota/hook da tabela "Ações auditadas"; `src/pages/config/Auditoria.tsx`; `navegacao.ts` (item "Auditoria", seção Administração, só Administrador).
- **Risco e plano B:** hook que grava fora de transação → a chamada vai logo depois do `save` com `$app.runInTransaction` envolvendo os dois; onde isso não for possível (rotina externa), a linha é gravada logo depois e a falha é registrada no log.
- **Rollback ou reversão:** as chamadas são aditivas; remover `registrarAuditoria` de uma rota não muda o comportamento da operação.

## Dados e integrações

| Coleção | Campos (tipo) | Regras de API |
|---|---|---|
| `auditoria` | `empresa` (rel, req), `ator` (rel users, opcional para rotina), `ator_tipo` (`usuario` \| `rotina` \| `chave_api` \| `superusuario`), `acao` (select da tabela abaixo), `colecao` (≤ 40), `registro` (≤ 30), `resumo` (≤ 300, texto legível), `antes` (JSON ≤ 4 KB), `depois` (JSON ≤ 4 KB), `origem` (`ao_vivo` \| `migrado`), `created` | list/view: `@request.auth.acesso_admin.id ?= empresa` · create/update/delete: null |

**Ações auditadas**

| Ação | Onde chamar | Fase |
|---|---|---|
| `responsavel_trocado` | troca de responsável de produtor e oportunidade | 1 |
| `vinculo_criado`, `perfil_alterado`, `vinculo_desativado` | tela de usuários / `vinculos` | 1, 4 |
| `oportunidade_reaberta` | reabertura de oportunidade encerrada | 3 |
| `etapas_funil_alteradas` | configurações comerciais | 3 |
| `relacao_empresas_criada`, `relacao_empresas_desfeita` | SPEC-3-006 | 3 |
| `importacao_aplicada`, `importacao_desfeita` | SPEC-3-006 | 3 |
| `empresa_lancamento_alterada`, `config_financeiro_alterada` | SPEC-4-001 | 4 |
| `conta_aprovada`, `conta_recusada`, `conta_paga`, `conta_cancelada` | SPEC-4-002 | 4 |
| `remetente_bloqueado`, `remetente_desbloqueado` | SPEC-4-003 | 4 |
| `banco_modo_alterado`, `pagamento_enviado_banco` | SPEC-4-004 | 4 |
| `rdv_fechado`, `rdv_reaberto`, `despesa_sem_comprovante` | SPECs 4-005 e 4-006 | 4 |
| `modelo_ativado`, `modelo_arquivado`, `contrato_enviado`, `contrato_cancelado`, `contrato_assinado` | SPEC-4-007 | 4 |
| `recebimento_cancelado`, `saldo_inicial_alterado` | SPEC-4-008 | 4 |
| `chave_api_criada`, `chave_api_revogada` | SPEC-4-009 | 4 |
| `usuario_desligado`, `carteira_transferida` | SPEC-5-002 | 5 |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-200 | operação auditada | uma linha na mesma transação | rotina externa: logo depois, com falha no log | fase 5 |
| RN-201 | `antes`/`depois` | só campos alterados; remove CPF de pessoa, telefone, e-mail, linha digitável, segredos e caminhos de arquivo | — | privacidade |
| RN-202 | consulta | filtros por período, ação, ator, coleção/registro; paginação de 50; exportação CSV até 10.000 linhas por vez | — | fase 5 |
| RN-203 | imutabilidade | nenhuma regra de API permite criar, alterar ou apagar | superusuário também não altera pela tela | fase 5 |

## Fluxo e regras

1. Cada rota/hook da tabela chama `registrarAuditoria({empresa, ator, ator_tipo, acao, colecao, registro, resumo, antes, depois})`.
2. **Auditoria** (`/config/auditoria`): filtros, lista com data, ator, ação e resumo; toque mostra antes/depois; "Exportar CSV".

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | aprovar conta | 1 linha `conta_aprovada` | — |
| Limite | operação falha no meio | nenhuma linha | — |
| Falha | Gestão abre a auditoria | 403 | — |
| Falha | `PATCH` numa linha | 403/404 | — |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; as rotas e hooks da tabela "Ações auditadas"; `00-INDICE.md` (regras comuns).
2. **Contexto técnico do Skip:** o da SPEC-4-001.
3. **Alterar somente:** a coleção, a lib, uma chamada por ponto da tabela, a tela e a navegação.
4. **Não alterar:** a lógica das operações auditadas.
5. **Executar nesta ordem:** (1) coleção e lib; (2) pontos das fases 1–3; (3) pontos da fase 4; (4) migração do histórico; (5) tela e exportação; (6) provas.
6. **Parar e pedir validação quando:** nenhuma parada prevista.
7. **Estado válido ao parar:** todas as operações funcionam como antes.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

Sistema da SPEC-3-002. Lista com `ListaItem` (ícone por área, ação, ator, data), filtros em `FiltroPilulas` e `Folha` de filtros avançados, detalhe em `Folha` com antes/depois lado a lado no computador e empilhado no celular; estados carregando, vazio, erro e sem internet.

## Checklist de execução

- [ ] Coleção imutável e lib.
- [ ] Todas as ações da tabela gravam linha.
- [ ] Histórico migrado.
- [ ] Tela, filtros e CSV.
- [ ] Evidências em `05_entregas/fase-5/spec-5-001/`.

## Critérios de aceite

- [ ] **CA-5-01:** executar cada ação da tabela uma vez nas empresas de teste gera exatamente uma linha com a ação, o ator e o registro certos; uma operação forçada a falhar não gera linha; nenhuma linha contém CPF, telefone, e-mail ou linha digitável.
- [ ] **CA-5-02:** criar, alterar ou apagar linha de `auditoria` pela API dá 403/404 para qualquer perfil; só Administrador consulta (Gestão, Administrativo, Comercial: 403); usuário de outro tenant lista 0.
- [ ] **CA-5-03:** os filtros devolvem as mesmas linhas da consulta direta; o CSV exportado tem as mesmas linhas do filtro; o histórico migrado tem uma linha por evento anterior de troca de responsável e de `eventos_financeiros`.

## TDD da SPEC

**Empresas nas provas:** Teste A e Teste B, com o elenco completo (inclui `teste.administrativo`).

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | sem auditoria (CA-5-01) | aprovar uma conta antes da chamada | 0 linhas (falha esperada) | consulta |
| GREEN 1 | cobertura (CA-5-01) | script `tools/regressao/auditoria.mjs` executa cada ação da tabela e confere a linha; força falha numa transação; varre `antes`/`depois` por padrões sensíveis | 1 linha por ação; 0 na falha; 0 ocorrências | saída do script |
| GREEN 2 | imutabilidade e acesso (CA-5-02) | create/update/delete por cada perfil; listar por perfil e por `teste.rumo` | 403/404; só Administrador; 0 | respostas |
| GREEN 3 | consulta (CA-5-03) | filtros × SQL; CSV × filtro; contagem do migrado × origem | iguais | diff |
| REFACTOR/REGRESSÃO | regressão | regressão das SPECs tocadas (aprovação, contrato, RDV, usuários); capturas e axe-core | sem diferença; sem falha séria | relatório |

**Caminhos de erro obrigatórios:** falha da operação, perfil sem permissão, outro tenant, tentativa de edição, exportação acima do limite.
**Evidência exigida:** em `05_entregas/fase-5/spec-5-001/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-5/spec-5-001/` e o log do Skip.

## Handoff e operação

- **Como demonstrar:** aprovar uma conta e mostrar a linha na auditoria; exportar.
- **Como operar depois:** o Administrador consulta quando precisar responder "quem fez".
- **Como monitorar:** falhas de gravação da auditoria no log.
- **Pendência conhecida:** nenhuma.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Registrar a auditoria das operações críticas | Agrospy | SPEC-5-001 | CA-5-01 a CA-5-03 | todas as subtasks | evidências das subtasks | fases 1–4 no ar |
| id pendente | Gravar a trilha de auditoria das ações críticas | Agrospy | SPEC-5-001 | CA-5-01, CA-5-02 | RED 1 → GREEN 1 + GREEN 2 | saída do script + respostas | fase 4 no ar |
| id pendente | Mostrar a auditoria para o Administrador | Agrospy | SPEC-5-001 | CA-5-03 | GREEN 3 + REFACTOR | diff + capturas | trilha |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
