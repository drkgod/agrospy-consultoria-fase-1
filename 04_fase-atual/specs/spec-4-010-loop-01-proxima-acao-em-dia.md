# SPEC-4-010 — LOOP-01: ciclo semanal de próxima ação em dia

**Fase:** 4
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** Fase 4, "Loop e agente (acréscimo): LOOP-01 — completude de follow-up"; RQ-013 (medição dos indicadores pelo sistema); P11 (decisão de negócio fica com o padrão da SPEC)
**Degrau da solução:** reuso — o loop roda no Maestro e lê o sistema pelo conector MCP da SPEC-4-009 (`resumo_comercial` e `fila_prioridades`) e por uma ferramenta de leitura nova, `indicador_follow_up`, acrescentada nesta SPEC. O loop não altera registros.

## Contexto e decisões fechadas

- **Estado atual:** a fila de prioridades (SPEC-3-005) mostra o que está atrasado, mas ninguém mede, semana a semana, se a carteira está com a próxima ação em dia.
- **Estado desejado:** toda segunda às 8h, o assistente do Maestro mede a parcela de oportunidades abertas com próxima ação em dia, por empresa e por responsável, compara com a linha de base e o alvo, entrega a lista das oportunidades sem ação em dia (para o gestor cobrar) e registra o veredito do ciclo.
- **Decisões já fechadas (padrões desta SPEC, ajustáveis pelo Diogo sem parar a construção):**
  - **Indicador:** `em_dia` = oportunidades `aberta` com próxima ação de data ≥ hoje ÷ oportunidades `aberta`, por empresa (tenant), no momento da medição.
  - **Linha de base:** a média das medições diárias dos 7 dias antes do primeiro ciclo, calculada pela ferramenta (a partir do histórico de ações, data de vencimento e conclusão).
  - **Alvo do ciclo:** o menor entre 90% e linha de base + 10 pontos percentuais.
  - **Ciclo:** semanal (segunda a domingo); veredito na segunda seguinte, 8h.
  - **Veredito:** automático e binário — "atingiu" se a medição de fechamento ≥ alvo; "não atingiu" senão. O Diogo pode contestar no app; contestação vira registro, não muda o número.
  - **Saída:** relatório no repositório (`05_entregas/loops/LOOP-01/AAAA-MM-DD.md`) e resumo na conversa do Maestro do sócio. Avisos para a equipe continuam saindo só pelo app (a fila de prioridades já existe); o loop não manda WhatsApp nem mensagem a produtor.
- **Bloqueios:** depende da SPEC-4-009 no ar e do conector MCP ligado no Maestro (CL-PEND-016). Sem o conector ligado no Maestro do sócio, o loop roda no Maestro executor com uma chave de leitura do usuário técnico `loop.maestro` (perfil Gestão, só leitura pela chave) em cada tenant real.

## Resultado observável

Segunda, 8h, o Diogo recebe no Maestro: "LOOP-01 — semana 01/12 a 07/12. Agrospy: 78% com próxima ação em dia (base 71%, alvo 81%): não atingiu. Rumo Agro: 92% (base 88%, alvo 90%): atingiu. 14 oportunidades sem ação em dia: Alisson 6, Carlos 5, Diogo 3 — lista no relatório." O relatório fica no repositório com a lista e o histórico dos ciclos.

## Limites e dependências

- **Inclui:** ferramenta MCP `indicador_follow_up`; registro dos ciclos em `ciclos_loop`; configuração do loop no Maestro; relatório semanal; tela "Ciclos do loop" (só leitura) para Administrador e Gestão com a opção "Contestar".
- **Fora de escopo:** alterar oportunidades, reagendar ações ou mandar mensagem a vendedor fora do app; sugestões por IA (LOOP-02, fase 5); metas por vendedor.
- **Entradas e pré-condições:** SPEC-4-009 no ar; SPEC-3-005 (fila) no ar.
- **Saídas/artefatos:** migração `ciclos_loop`; extensão de `lib/mcp_ferramentas.js`; `07-sistemas/comercial/loops/LOOP-01.md` (instruções permanentes); relatórios em `05_entregas/loops/LOOP-01/`; evidências em `05_entregas/fase-4/spec-4-010/`.
- **Dependências e responsáveis:** a Agrospy executa; o Diogo recebe o veredito.
- **Atores e permissões mínimas:** a ferramenta exige chave de leitura de perfil Administrador ou Gestão; a tela de ciclos é de Administrador e Gestão.
- **Superfícies/arquivos/configurações afetadas:** migração `ciclos_loop` e do usuário técnico `loop.maestro` (sem senha de login; acesso só por chave); `lib/mcp_ferramentas.js`; rota `POST /backend/v1/loops/ciclos` (registrar ciclo, só chave do `loop.maestro` ou Administrador); `src/pages/config/CiclosLoop.tsx`; `navegacao.ts`.
- **Risco e plano B:** se o Maestro não agendar tarefas recorrentes, uma rotina do Skip calcula a medição na segunda às 8h e grava o ciclo; o Maestro lê e gera o relatório quando abrir.
- **Rollback ou reversão:** desligar o loop no Maestro; a ferramenta é só leitura.

## Dados e integrações

| Coleção | Campos (tipo) | Regras de API |
|---|---|---|
| `ciclos_loop` | `empresa`, `loop` (`LOOP-01` \| `LOOP-02`), `inicio`, `fim` (datas), `baseline` (número 0–1), `alvo` (0–1), `medicao` (0–1), `veredito` (`atingiu` \| `nao_atingiu` \| `sem_dado`), `detalhe` (JSON: por responsável, sem nome de produtor), `relatorio_path` (≤ 200), `contestacao` (≤ 1000), `contestado_por`, `created` | list/view: `acesso_admin` ou `acesso_gestao` · create: só a rota · update: só a contestação pela rota · delete: null |

| Ferramenta | Entrada | Saída |
|---|---|---|
| `indicador_follow_up` | `{data?: AAAA-MM-DD (padrão hoje), baseline_dias?: 7}` | `{empresa, data, abertas, em_dia, percentual, por_responsavel: [{nome, abertas, em_dia}], sem_acao_em_dia: [{oportunidade_id, produtor, responsavel, proxima_acao_data}], baseline?: {inicio, fim, percentual}}` |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-190 | medição | `percentual` = em_dia ÷ abertas; abertas = 0 → `sem_dado` | — | LOOP-01 |
| RN-191 | baseline | média das medições reconstruídas dos 7 dias antes do 1º ciclo, gravada no 1º ciclo e reaproveitada | — | LOOP-01 |
| RN-192 | alvo | `min(0.90, baseline + 0.10)` | — | padrão desta SPEC |
| RN-193 | veredito | medição de fechamento ≥ alvo → `atingiu` | — | P11 |
| RN-194 | escrita | o loop só grava `ciclos_loop` e o relatório; nenhuma oportunidade, ação ou aviso é alterado | — | escopo, fase 4 |

## Fluxo e regras

1. Segunda, 8h: o Maestro chama `indicador_follow_up` em cada tenant.
2. Calcula o veredito do ciclo anterior (RN-193) e grava pela rota `/loops/ciclos`.
3. Escreve o relatório (resumo, tabela por responsável, lista sem ação em dia, histórico dos ciclos) e manda o resumo ao sócio.
4. Na tela "Ciclos do loop", o Diogo vê os ciclos e pode contestar.

## Configuração no Maestro

- **Tipo:** loop
- **Sistemas usados:** SPEC-1-003 (oportunidades e próxima ação), SPEC-3-005 (fila), SPEC-4-009 (conector MCP)
- **Agente responsável:** assistente principal do Maestro

### Meta

- **Nome curto:** próxima ação em dia
- **O que atingir:** parcela de oportunidades abertas com próxima ação em dia ≥ alvo do ciclo
- **Prazo do ciclo:** 1 semana (segunda a domingo)
- **Valor estimado:** não estimado (indicador do kickoff "acelerar o processo comercial")

### Validação

- **Como saber que foi atingido:** medição de fechamento ≥ alvo (RN-193)
- **Modo:** assistente mede
- **Fonte independente:** consulta direta na base pela ferramenta no servidor, conferida na prova contra SQL
- **Baseline / alvo / unidade:** RN-191 / RN-192 / percentual de oportunidades abertas
- **Cadência:** semanal, segunda 8h
- **Responsável pelo veredito:** automático (P11); o Diogo pode contestar

### Conectores e skills

| Item | Tipo | Uso | Permissão/entrada | Saída | Plano B |
|---|---|---|---|---|---|
| Conector MCP "Agrospy" | conector remoto (SPEC-4-009) | `indicador_follow_up`, `fila_prioridades` | chave de leitura (Gestão/Administrador ou `loop.maestro`) | JSON | rotina do Skip grava o ciclo |
| GitHub do projeto | conector | gravar o relatório | o mesmo do Maestro executor | arquivo em `05_entregas/loops/LOOP-01/` | resumo só na conversa |

### Arranque

- **Instruções permanentes:** texto em `07-sistemas/comercial/loops/LOOP-01.md`: "Toda segunda às 8h, chame `indicador_follow_up` em cada empresa; grave o ciclo pela rota de ciclos; escreva o relatório; mande o resumo ao sócio. Não altere nenhum registro, não mande mensagem a vendedor nem a produtor. Se o conector falhar, registre 'sem_dado' com o erro e tente na hora seguinte, até 3 vezes."
- **Primeiras tarefas:** medir a linha de base e abrir o primeiro ciclo.
- **Autonomia:** sim, com limites (só leitura e registro do ciclo).
- **Limites e aprovações:** nenhuma escrita além de `ciclos_loop` e do relatório.
- **Teto de créditos:** não definido.
- **Condição de pausa/recuperação:** 3 falhas seguidas do conector → pausa e aviso ao sócio; retomada reprocessa só o ciclo pendente (idempotente por `empresa + loop + inicio`).

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; SPEC-4-009; a fila e o painel da SPEC-3-005; `00-INDICE.md` (regras comuns).
2. **Contexto técnico do Skip:** o da SPEC-4-001.
3. **Alterar somente:** as superfícies listadas.
4. **Não alterar:** oportunidades, ações, avisos.
5. **Executar nesta ordem:** (1) ferramenta e `ciclos_loop`; (2) usuário técnico e chave; (3) instruções permanentes e agendamento no Maestro; (4) ciclo controlado com relógio de teste; (5) primeiro ciclo real.
6. **Parar e pedir validação quando:** nenhuma parada prevista.
7. **Estado válido ao parar:** o sistema funciona igual; o loop só lê.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Checklist de execução

- [ ] Ferramenta `indicador_follow_up` conferida contra SQL.
- [ ] `ciclos_loop`, rota e tela com contestação.
- [ ] Loop configurado no Maestro com as instruções permanentes.
- [ ] Ciclo controlado (baseline conhecido, medição, veredito, retomada).
- [ ] Primeiro ciclo real registrado; evidências em `05_entregas/fase-4/spec-4-010/`.

## Critérios de aceite

- [ ] **CA-4-34:** na fixture da Teste A (20 oportunidades abertas, 14 em dia), `indicador_follow_up` devolve 70% e a lista exata das 6 sem ação em dia; a baseline reconstruída de 7 dias bate com o cálculo da fixture; com 0 abertas, `sem_dado`.
- [ ] **CA-4-35:** o loop está configurado no Maestro com as instruções permanentes de `07-sistemas/comercial/loops/LOOP-01.md`, agendado para segunda 8h (ou a rotina do Skip do plano B), e só a chave do `loop.maestro` ou de Administrador grava ciclo (Comercial: 403).
- [ ] **CA-4-36:** um ciclo controlado com relógio de teste grava baseline, alvo, medição e veredito certos e gera o relatório; com o conector desligado, registra `sem_dado`, tenta 3 vezes e pausa; ao religar, reprocessa só o ciclo pendente sem duplicar; nenhuma oportunidade muda (contagem e `updated` iguais antes e depois).

## TDD da SPEC

**Empresas nas provas:** Teste A. **Fixture:** migração de teste com 20 oportunidades abertas (14 com próxima ação ≥ hoje do relógio de teste) e o histórico de ações dos 7 dias anteriores com o resultado esperado em `05_entregas/fase-4/fixtures/loop01-esperado.json`.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | sem ferramenta (CA-4-34) | `tools/call indicador_follow_up` antes de existir | `-32601` (falha esperada) | resposta |
| GREEN 1 | medição (CA-4-34) | chamar com `data` da fixture e `baseline_dias = 7`; empresa sem oportunidade | 70%, 6 itens, baseline igual ao esperado; `sem_dado` | respostas + diff |
| GREEN 2 | configuração (CA-4-35) | conferir o loop no Maestro (captura da configuração); gravar ciclo com chave de `teste.comercial1` | configurado; 403 | captura + resposta |
| GREEN 3 | ciclo controlado (CA-4-36) | rodar o ciclo com o relógio de teste; desligar a rota MCP (`mcp_ativo = false`) e rodar; religar | ciclo e relatório certos; `sem_dado` + pausa após 3; 1 ciclo reprocessado | consultas + relatório |
| REFACTOR/REGRESSÃO | não escreve (CA-4-36) | contagem e `max(updated)` de oportunidades e ações antes e depois do ciclo; SPEC-4-009 GREEN 2 | iguais; sem diferença | consultas |

**Caminhos de erro obrigatórios:** conector fora, chave sem permissão, zero oportunidades, ciclo repetido.
**Evidência exigida:** em `05_entregas/fase-4/spec-4-010/` e `05_entregas/loops/LOOP-01/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-4/spec-4-010/` e o log do Skip. O veredito do loop é automático; o Diogo pode contestar sem parar o loop.

## Handoff e operação

- **Como demonstrar:** relatório do primeiro ciclo e a tela "Ciclos do loop".
- **Como operar depois:** o gestor usa a lista da segunda para cobrar a equipe pela fila de prioridades.
- **Como monitorar:** ciclos `sem_dado`; três "não atingiu" seguidos viram sinal para a consultoria.
- **Pendência conhecida:** CL-PEND-016 (conector no Maestro do sócio, opcional para este loop).

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Rodar o ciclo semanal de próxima ação em dia (LOOP-01) | Agrospy | SPEC-4-010 | CA-4-34 a CA-4-36 | todas as subtasks | evidências das subtasks | SPEC-4-009 no ar |
| id pendente | Medir a linha de base da próxima ação em dia | Agrospy | SPEC-4-010 | CA-4-34 | RED 1 → GREEN 1 | respostas + diff | SPEC-4-009 |
| id pendente | Configurar o loop semanal no Maestro | Agrospy | SPEC-4-010 | CA-4-35 | GREEN 2 | captura + resposta | ferramenta |
| id pendente | Rodar o primeiro ciclo e registrar o veredito | Agrospy | SPEC-4-010 | CA-4-36 | GREEN 3 + REFACTOR | relatório + consultas | loop configurado |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
