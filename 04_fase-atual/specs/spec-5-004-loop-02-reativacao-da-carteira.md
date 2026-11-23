# SPEC-5-004 — LOOP-02: sugestões de reabordagem da carteira com IA

**Fase:** 5
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** P7; RQ-012; Fase 5, "LOOP-02 — reativação da carteira com sugestões de IA: identifica produtores sem contato há mais de N dias ou em janela pós-safra, sugere a abordagem com base no histórico e mede quantas sugestões viraram contato registrado; humano decide e faz o contato"
**Degrau da solução:** reuso + nativo:
- **Reuso:** a fila de prioridades e o critério de "sem contato" da SPEC-3-005; o conector MCP da SPEC-4-009; `ciclos_loop` da SPEC-4-010; avisos no app;
- **Nativo:** `$ai.chat('fast')` para escrever o motivo e a abordagem sugerida a partir do histórico.

## Contexto e decisões fechadas

- **Estado atual:** a fila de prioridades mostra quem está sem contato há mais de 20 dias, mas não diz por que voltar nem como abordar, e ninguém mede se a reabordagem acontece.
- **Estado desejado:** toda segunda às 7h, o sistema escolhe, para cada vendedor, até 5 produtores para reabordar, com o motivo ("sem contato há 74 dias; comprou pulverização na safra passada; colheita da soja termina em março") e uma sugestão de abordagem. O vendedor vê em "Prioridades → Sugeridos pela IA", aceita ou descarta. O loop mede quantas sugestões viraram visita, oportunidade ou ação registrada em até 14 dias.
- **Decisões já fechadas (padrões desta SPEC, ajustáveis pelo Administrador em `/config/comercial`):**
  - **Candidatos (determinístico, no servidor):** produtores `cliente` ou `potencial` da carteira do vendedor, não arquivados, sem visita nem ação concluída há mais de 60 dias, sem oportunidade aberta com próxima ação futura e sem sugestão nos últimos 28 dias. Prioridade: (1) cliente com serviço concluído na safra anterior; (2) produtor com `janela_prevista` ou `proxima_etapa_prevista` de serviço nos próximos 45 dias; (3) os demais, do contato mais antigo para o mais novo. Até 5 por vendedor por semana.
  - **Texto da IA:** recebe só o resumo do histórico daquele produtor naquela empresa (últimas 5 visitas resumidas, oportunidades e desfechos, serviços), como dado delimitado, e devolve JSON `{motivo ≤ 300, abordagem ≤ 500}`. Se a IA falhar, o motivo é o texto determinístico e a abordagem fica vazia.
  - **A IA sugere; a pessoa decide.** Nada é enviado ao produtor. Aceitar cria uma ação "Reabordar" na carteira com data para hoje + 3 dias (o vendedor pode mudar); descartar pede um motivo curto da lista (já falei, não é o momento, não é cliente, outro).
  - **Conversão:** sugestão `virou_contato` quando, em até 14 dias, aparece visita, oportunidade nova ou ação concluída daquele produtor por qualquer pessoa da empresa.
  - **Meta do loop:** taxa de conversão = virou_contato ÷ sugestões da semana fechada há 14 dias; baseline = a taxa das sugestões das 2 primeiras semanas; alvo = 30% ou baseline + 10 p.p., o maior dos dois limitado a 60%; veredito automático; contestação pelo Diogo como no LOOP-01.
  - **Avisos:** só no app ("Você tem 5 sugestões de reabordagem desta semana").
- **Bloqueios:** nenhum.

## Resultado observável

1. Segunda, 7h, o Alisson recebe no app "5 sugestões de reabordagem desta semana". Em "Prioridades → Sugeridos pela IA", cada cartão traz o produtor, o motivo e a abordagem.
2. Ele aceita 3 (viram ações "Reabordar" na carteira) e descarta 2 com motivo.
3. Duas semanas depois, o relatório do LOOP-02 no Maestro diz: "Agrospy: 40 sugestões na semana de 01/12; 15 viraram contato (37,5%); base 28%, alvo 38%: não atingiu".

## Limites e dependências

- **Inclui:** coleção `sugestoes_reabordagem`; rotina semanal de candidatos e texto; grupo "Sugeridos pela IA" na tela de prioridades com aceitar/descartar; marcação de conversão; ferramenta MCP `sugestoes_reabordagem`; configuração do loop no Maestro; parâmetros em `/config/comercial`.
- **Fora de escopo:** mensagem automática ao produtor; WhatsApp; sugestão de preço; uso de dado de fora do sistema (clima, mercado).
- **Entradas e pré-condições:** SPECs 3-005, 4-009 e 4-010 no ar.
- **Saídas/artefatos:** migração, hooks, tela, `07-sistemas/comercial/loops/LOOP-02.md`; relatórios em `05_entregas/loops/LOOP-02/`; evidências em `05_entregas/fase-5/spec-5-004/`.
- **Dependências e responsáveis:** a Agrospy executa. Nada depende do Diogo.
- **Atores e permissões mínimas:** ver, aceitar e descartar: o vendedor responsável (e Gestão/Administrador para todos); configurar parâmetros: Administrador; Operador e Administrativo: não veem.
- **Superfícies/arquivos/configurações afetadas:** migração `sugestoes_reabordagem` e campos novos em `config_comercial` (`reabordagem_dias_sem_contato` 60, `reabordagem_por_vendedor` 5, `reabordagem_janela_dias` 45, `reabordagem_ativa` true); `pocketbase/hooks/reabordagem_rotina.js`, `reabordagem_rotas.js`, `lib/reabordagem.js`; `lib/mcp_ferramentas.js`; `src/pages/Prioridades.tsx` (grupo novo), `src/pages/ConfigComercial.tsx` (campos); `07-sistemas/comercial/loops/LOOP-02.md`.
- **Risco e plano B:** IA fora → texto determinístico; muitos vendedores → rotina por empresa em lotes de 20 vendedores.
- **Rollback ou reversão:** `reabordagem_ativa = false`; sugestões ficam no histórico.

## Dados e integrações

| Coleção | Campos (tipo) | Regras de API |
|---|---|---|
| `sugestoes_reabordagem` | `empresa`, `produtor`, `responsavel`, `semana` (data da segunda), `prioridade` (1–3), `motivo` (≤ 300), `abordagem` (≤ 500), `fonte_texto` (`ia` \| `regra`), `status` (`sugerida` \| `aceita` \| `descartada` \| `virou_contato` \| `expirada`), `motivo_descarte` (select + texto ≤ 200), `acao_criada` (rel), `decidido_em`, `convertido_em`, `created` | list/view: `responsavel = @request.auth.id \|\| acesso_gestao/acesso_admin da empresa` · create/update/delete: null (só rotina e rotas) |

| Ferramenta MCP | Entrada | Saída |
|---|---|---|
| `sugestoes_reabordagem` | `{semana?, responsavel_email?}` | contagens por status e taxa de conversão da semana; lista (produtor, responsável, status), sem o texto da abordagem |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-230 | candidatos | critérios e prioridade das decisões fechadas, no servidor, só na carteira do vendedor e na empresa | — | P7 |
| RN-231 | texto | `$ai.chat('fast')` com o resumo delimitado; JSON validado; saída com instrução, link ou contato inventado é descartada e cai no texto da regra | — | P7; padrão do assistente |
| RN-232 | aceitar | cria ação "Reabordar" (data hoje + 3, editável) na oportunidade aberta do produtor ou, sem oportunidade, cria a oportunidade "Reabordagem" na linha de negócio da oportunidade mais recente do produtor (sem histórico: a primeira linha ativa da empresa), na primeira etapa ativa do funil, com responsável e próxima ação (regras das fases 1 e 3) | — | fase 1 |
| RN-233 | conversão | rotina diária marca `virou_contato` quando há visita, oportunidade nova ou ação concluída do produtor em até 14 dias da `semana`; depois de 14 dias sem isso, `expirada` | — | LOOP-02 |
| RN-234 | descarte | exige motivo; o produtor descartado com "não é cliente" não volta a ser sugerido por 180 dias | — | P7 |

## Fluxo e regras

1. Segunda 7h: rotina gera as sugestões e o aviso por vendedor.
2. Prioridades → "Sugeridos pela IA": cartões com aceitar/descartar.
3. Rotina diária: conversão e expiração.
4. Segunda 8h: o loop no Maestro lê `sugestoes_reabordagem` da semana fechada há 14 dias, grava o ciclo em `ciclos_loop` (`LOOP-02`) e escreve o relatório.

## Configuração no Maestro

- **Tipo:** loop
- **Sistemas usados:** SPEC-1-003, SPEC-3-004 (serviços), SPEC-3-005 (fila), SPEC-4-009 (conector), SPEC-4-010 (`ciclos_loop`)
- **Agente responsável:** assistente principal do Maestro

### Meta

- **Nome curto:** reativação da carteira
- **O que atingir:** taxa de sugestões que viram contato registrado em 14 dias ≥ alvo
- **Prazo do ciclo:** semanal, com leitura 14 dias depois da semana
- **Valor estimado:** não estimado (indicadores do kickoff "acelerar" e "conversão")

### Validação

- **Como saber que foi atingido:** taxa da semana ≥ alvo
- **Modo:** assistente mede
- **Fonte independente:** registros de visita, oportunidade e ação no sistema (não a declaração do vendedor)
- **Baseline / alvo / unidade:** taxa das 2 primeiras semanas / max(30%, baseline + 10 p.p.) limitado a 60% / percentual de sugestões
- **Cadência:** semanal, segunda 8h
- **Responsável pelo veredito:** automático (P11); o Diogo pode contestar

### Conectores e skills

| Item | Tipo | Uso | Permissão/entrada | Saída | Plano B |
|---|---|---|---|---|---|
| Conector MCP "Agrospy" | conector remoto | `sugestoes_reabordagem` | chave de leitura do `loop.maestro` | contagens | rotina do Skip grava o ciclo |
| GitHub do projeto | conector | relatório | o do Maestro executor | `05_entregas/loops/LOOP-02/` | resumo na conversa |

### Arranque

- **Instruções permanentes:** texto em `07-sistemas/comercial/loops/LOOP-02.md`: "Toda segunda às 8h, leia `sugestoes_reabordagem` da semana fechada há 14 dias em cada empresa; calcule a taxa; grave o ciclo LOOP-02; escreva o relatório e mande o resumo ao sócio. Não crie sugestão, não altere registro, não contate produtor."
- **Primeiras tarefas:** duas semanas de baseline; primeiro veredito na terceira leitura.
- **Autonomia:** sim, com limites (só leitura e registro do ciclo).
- **Limites e aprovações:** nenhuma escrita além do ciclo e do relatório.
- **Teto de créditos:** não definido.
- **Condição de pausa/recuperação:** igual ao LOOP-01 (3 falhas → pausa; retomada idempotente por `empresa + loop + inicio`).

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; SPECs 3-005, 4-009 e 4-010; `assistente_perguntar.js` (dado delimitado); `00-INDICE.md` (regras comuns).
2. **Contexto técnico do Skip:** o da SPEC-4-001; o log nunca registra o texto gerado nem o histórico enviado.
3. **Alterar somente:** as superfícies listadas.
4. **Não alterar:** os grupos atuais da fila de prioridades.
5. **Executar nesta ordem:** (1) candidatos determinísticos; (2) texto pela IA com plano B; (3) tela, aceitar e descartar; (4) conversão; (5) ferramenta MCP e loop no Maestro; (6) ciclo controlado.
6. **Parar e pedir validação quando:** nenhuma parada prevista.
7. **Estado válido ao parar:** a fila de prioridades funciona como antes.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

Sistema da SPEC-3-002. Grupo "Sugeridos pela IA" com `Cartao` por produtor (nome, `Selo` com a prioridade, motivo, abordagem recolhida, `BotaoPrimario` "Vou abordar" e `BotaoSecundario` "Descartar" com folha de motivo); selo "sugestão da IA" discreto; estados carregando, vazio ("Sem sugestões esta semana"), erro e sem internet.

## Checklist de execução

- [ ] Candidatos e prioridade conferidos contra a fixture.
- [ ] Texto da IA com validação e plano B.
- [ ] Aceitar/descartar com ação e motivo.
- [ ] Conversão e expiração.
- [ ] Ferramenta MCP, loop configurado e ciclo controlado.
- [ ] Evidências em `05_entregas/fase-5/spec-5-004/`.

## Critérios de aceite

- [ ] **CA-5-10:** na fixture (carteira de `teste.comercial1` com 12 produtores em situações conhecidas), a rotina escolhe exatamente os 5 esperados na ordem de prioridade, nenhum de outro vendedor ou empresa, e nenhum sugerido nos últimos 28 dias; com a IA desligada, as 5 sugestões saem com o texto da regra.
- [ ] **CA-5-11:** aceitar cria a ação "Reabordar" (ou a oportunidade "Reabordagem") com responsável e próxima ação; descartar exige motivo; "não é cliente" bloqueia nova sugestão por 180 dias; Operador e Administrativo não veem sugestões (403); uma saída da IA com link ou instrução é trocada pelo texto da regra.
- [ ] **CA-5-12:** com o relógio de teste, uma visita registrada 5 dias depois marca `virou_contato` e a sugestão sem contato em 14 dias vira `expirada`; o ciclo controlado do loop grava baseline, alvo, taxa e veredito certos e o relatório; o loop não altera registros.

## TDD da SPEC

**Empresas nas provas:** Teste A. **Fixture** com o resultado esperado em `05_entregas/fase-5/fixtures/loop02-esperado.json`: 12 produtores do `teste.comercial1` (3 clientes com serviço concluído na safra anterior, 2 com janela nos próximos 45 dias, 4 sem contato há 61–200 dias, 1 com oportunidade com próxima ação futura, 1 sugerido há 10 dias, 1 arquivado) e 3 produtores de `teste.comercial2`.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | candidatos (CA-5-10) | rodar a seleção antes dos filtros de oportunidade e de 28 dias | inclui o com oportunidade e o recém-sugerido (falha esperada) | saída |
| GREEN 1 | seleção e texto (CA-5-10) | rotina com relógio de teste; repetir com `$ai` simulado falhando | 5 esperados na ordem; texto da regra | consultas + diff |
| GREEN 2 | decisão (CA-5-11) | aceitar 2 (um com e outro sem oportunidade); descartar sem e com motivo; "não é cliente" e rodar a semana seguinte; acessar como `teste.operador` e `teste.administrativo`; simular saída da IA com link | ação e oportunidade criadas; 400 e 200; não volta; 403; texto da regra | respostas + consultas |
| GREEN 3 | conversão e loop (CA-5-12) | visita no dia +5; avançar 15 dias; ciclo controlado do loop | `virou_contato`; `expirada`; ciclo e relatório certos | consultas + relatório |
| REFACTOR/REGRESSÃO | regressão | grupos antigos da fila (SPEC-3-005); contagem e `updated` de oportunidades antes e depois do loop; capturas e axe-core | sem diferença; loop sem escrita; sem falha séria | relatório |

**Caminhos de erro obrigatórios:** IA fora, saída da IA inválida, perfil sem permissão, outro vendedor, outro tenant, descarte sem motivo, conector fora no loop.
**Evidência exigida:** em `05_entregas/fase-5/spec-5-004/` e `05_entregas/loops/LOOP-02/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-5/spec-5-004/` e o log do Skip. Os parâmetros são o padrão desta SPEC e o Administrador pode mudar.

## Handoff e operação

- **Como demonstrar:** sugestões da semana para um vendedor de teste; aceitar; relatório do loop.
- **Como operar depois:** cada vendedor decide as sugestões na segunda; o gestor acompanha a taxa.
- **Como monitorar:** taxa de conversão; sugestões não decididas há 7 dias.
- **Pendência conhecida:** nenhuma.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Sugerir produtores para reabordar (LOOP-02) | Agrospy | SPEC-5-004 | CA-5-10 a CA-5-12 | todas as subtasks | evidências das subtasks | SPECs 3-005, 4-009 e 4-010 no ar |
| id pendente | Sugerir com IA os produtores para reabordar | Agrospy | SPEC-5-004 | CA-5-10 | RED 1 → GREEN 1 | consultas + diff | SPEC-3-005 |
| id pendente | Mostrar as sugestões e registrar a decisão do vendedor | Agrospy | SPEC-5-004 | CA-5-11 | GREEN 2 | respostas + consultas | sugestões |
| id pendente | Configurar e rodar o ciclo de reativação no Maestro | Agrospy | SPEC-5-004 | CA-5-12 | GREEN 3 + REFACTOR | consultas + relatório | decisão do vendedor |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
