# SPECs das fases 3, 4 e 5 — Plataforma Agrospy e Rumo Agro

**Emenda de 23/11/2026 — fila única.** As fases 3, 4 e 5 estão liberadas juntas para o Maestro construir até o fim sem parar entre as fases. Este índice reúne as três. As tarefas estão em `../fase.md` (fase 3), `../fase-4.md` (fase 4) e `../fase-5.md` (fase 5); o status de cada tarefa fica só nesses arquivos.

## Como executar (fila única)

1. **Antes de gravar qualquer arquivo:** puxe a versão do GitHub e use-a como base.
2. **Ordem:**
   1. fase 3: o que falta da SPEC-3-003 → SPEC-3-004 → SPEC-3-005 → SPEC-3-006 (com a emenda de 23/11/2026);
   2. fase 4: SPEC-4-001 → 4-002 → 4-003 → 4-004 → 4-005 → 4-006 → 4-007 → 4-008 → 4-009 → 4-010;
   3. fase 5: SPEC-5-001 → 5-002 → 5-003 → 5-004 → 5-005.
3. **Sem teste humano (P11, 17/11/2026):** nenhuma task espera teste, demonstração ou "testei, pode seguir" de pessoa; cada task fecha pela prova automática da própria SPEC. A única decisão de pessoa é o go-live, a última task da fase 5.
4. **Quando algo depender da Agrospy** (segredo, conta, caixa de e-mail, API do Sicredi, conta DocuSign, CNPJs, e-mails da contabilidade, exemplos de KML, modelo de contrato, aplicativo do Google): deixe só aquela task em `[/]` com o motivo numa linha `>`, siga para a próxima que dá para construir e avise uma vez, no fim, com a lista do que ficou esperando. A task "Ler a pasta do Drive a cada 10 minutos" (fase 3) continua nessa situação.
5. **Datas de conclusão:** "Concluída em dd/mm/aaaa" numa linha `>` da task, nunca no fim da linha do título.
6. **Paradas reais** (o Administrador faz na tela, e a fila segue): primeiro envio ao banco em produção (SPEC-4-004) e primeiro contrato real em produção no DocuSign (SPEC-4-007).
7. **O que não estiver aqui** vai como dúvida em `06_notas/`, sem parar a fila.

| Fase | SPECs | Tarefas |
|---|---|---|
| 3 — Gestão comercial e decisão, com o app de cara nova | 3-001 a 3-006 | `../fase.md` |
| 4 — Financeiro, RDV e contratos, com conector de IA e LOOP-01 | 4-001 a 4-010 | `../fase-4.md` |
| 5 — Consolidação, mapa das áreas, reativação da carteira e validação | 5-001 a 5-005 | `../fase-5.md` |

## Fase 3 — Gestão comercial e decisão, com o app de cara nova

**Fase:** 3 — Gestão comercial e decisão, com o app de cara nova
**Gerado em:** 17/11/2026 · **Status das SPECs:** planejadas
**Resultado da fase:**
- o app fica com cara e jeito de app no celular;
- o gestor decide com dados: funil, propostas, atrasos e desfechos por empresa e por responsável;
- o vendedor sabe quem visitar primeiro.

| SPEC | Entrega | Degrau da solução | Critérios | Depende de |
|---|---|---|---|---|
| [SPEC-3-001](spec-3-001-pendencias-tecnicas-da-fase-2.md) | Pendências técnicas da fase 2: avisos no celular, 90 dias, pasta do Drive a cada 10 min, dados de teste separados e código no GitHub | reuso + construção mínima | CA-3-01 a CA-3-05 | fase 2 |
| [SPEC-3-002](spec-3-002-visual-de-app-e-navegacao.md) | Visual de app e navegação: tokens por empresa, casca com abas, componentes e vitrine | construção mínima | CA-3-06 a CA-3-11 | SPEC-3-001 (espelho e dados de teste) |
| [SPEC-3-003](spec-3-003-telas-do-app-no-novo-visual.md) | Todas as telas existentes no novo visual | reuso | CA-3-12 a CA-3-17 | SPEC-3-002 |
| [SPEC-3-004](spec-3-004-funil-proposta-e-desfecho.md) | Funil por empresa, proposta e desfecho com motivo | construção mínima | CA-3-18 a CA-3-23 | SPEC-3-002 |
| [SPEC-3-005](spec-3-005-paineis-e-fila-priorizada.md) | Painéis do gestor e do vendedor e fila priorizada | reuso + construção mínima | CA-3-24 a CA-3-29 | SPEC-3-004 |
| [SPEC-3-006](spec-3-006-produtor-nas-duas-empresas-e-importacao.md) | Produtor nas duas empresas e importação da carteira pela planilha; com a emenda de 23/11/2026, endereço de faturamento, e-mail da nota e arquivo KML | construção mínima | CA-3-30 a CA-3-36 | SPEC-3-004 |

> **Emenda de 23/11/2026.** A SPEC-3-006 ganhou a seção "Emenda de 23/11/2026 — dados de faturamento e arquivo KML" (CA-3-35 e CA-3-36) e duas tasks. As fases 4 e 5 foram liberadas na mesma fila: ao terminar a fase 3, siga direto para a fase 4 e depois para a fase 5, sem parar entre elas.

### Como executar

1. **Construção em sequência**, uma task depois da outra, na ordem do `fase.md`, sem pedir autorização entre elas.
2. **Sem teste humano (P11, 17/11/2026).**
   - Toda task fecha pela prova automática da própria SPEC, com evidência em `05_entregas/fase-3/` e o log do Skip.
   - Nenhuma task espera teste, demonstração ou "testei, pode seguir" de pessoa.
3. **Ordem:**
   1. pendências técnicas da fase 2 (SPEC-3-001);
   2. visual de app (SPEC-3-002);
   3. telas existentes no novo visual (SPEC-3-003);
   4. funil, proposta e desfecho (SPEC-3-004);
   5. painéis e fila (SPEC-3-005);
   6. produtor nas duas empresas e importação (SPEC-3-006).
4. **Regra visual:** toda tela nova ou alterada usa o sistema da SPEC-3-002.
   - componentes de `src/components/app/`;
   - cores só pelos tokens, com hex só em `src/lib/cores.ts`;
   - estados de carregando, vazio, erro e sem internet;
   - entrada na `/vitrine`;
   - capturas em 390×844 e 1280×800 sem rolagem horizontal;
   - axe-core sem falhas sérias.
5. **Código no GitHub:** ao fechar cada task, atualize o espelho em `07-sistemas/comercial/codigo/` com a versão publicada.
6. **Dados de teste:** só nas empresas "Teste A" e "Teste B", com o elenco de teste da SPEC-3-001. As senhas ficam só nas credenciais do executor. Nunca grave teste na Agrospy ou na Rumo Agro.
7. **Se faltar algo que só a Agrospy pode providenciar**, peça uma vez e pare só aquela task. Siga com a próxima que não depende disso. Itens possíveis:
   - as chaves do OneSignal;
   - o aplicativo do Google para a pasta do Drive (sem ele, "Ler a pasta do Drive a cada 10 minutos" fica em `[/]`, com a pendência no STATUS).

   A planilha da carteira não trava nada: a importação usa o modelo da SPEC-3-006, e a planilha real é pedida uma vez.
8. **Decisão de negócio em aberto:** vale o padrão escrito na SPEC, como etapas do funil, motivos e dias sem contato. O Administrador pode editar depois, e a construção não para.

### Fora desta fase

- RDV, contratos e a parte administrativa (fase 4, já liberada na mesma fila);
- sugestões por IA para reabordagem (fase 5);
- WhatsApp e mensagens automáticas para produtores;
- AutoCAD.

### Tasks

As tasks desta fase estão em `../fase.md` e listadas em `## Tasks vinculadas` de cada SPEC.

## Fase 4 — Financeiro, RDV e contratos

**Fase:** 4 — Financeiro, RDV e contratos, com conector de IA e LOOP-01
**Gerado em:** 23/11/2026 (emenda P13 do escopo) · **Status das SPECs:** planejadas
**Resultado da fase:**
- boletos chegam (à mão, por e-mail de fornecedor cadastrado e, se houver API, pelo DDA do Sicredi), os sócios aprovam e o pagamento sai pela lista aprovada;
- o RDV é lançado com foto e leitura automática e fechado no mês com PDF, planilha e envio à contabilidade;
- a venda ganha vira contrato assinado pelo DocuSign, que vira recebimentos; cada empresa (AgroSpy, AgroSmart, Rumo Agro) tem o próprio fluxo de caixa;
- os dados ficam disponíveis para IAs pelo conector MCP, e o LOOP-01 mede a próxima ação em dia.

| SPEC | Entrega | Degrau da solução | Critérios | Depende de |
|---|---|---|---|---|
| [SPEC-4-001](spec-4-001-empresas-do-lancamento-e-perfil-administrativo.md) | Empresas do lançamento, perfil Administrativo e avisos financeiros | reuso + construção mínima | CA-4-01 a CA-4-03 | fase 3 |
| [SPEC-4-002](spec-4-002-contas-a-pagar-com-aprovacao.md) | Contas a pagar com aprovação dos sócios, dias fixos e lista aprovada | nativo + construção mínima | CA-4-04 a CA-4-08 | SPEC-4-001 |
| [SPEC-4-003](spec-4-003-boletos-por-email-com-lista-de-bloqueio.md) | Boletos por e-mail só de fornecedor cadastrado, com lista de bloqueio | reuso + nativo | CA-4-09 a CA-4-11 | SPEC-4-002 |
| [SPEC-4-004](spec-4-004-banco-sicredi-dda-e-pagamento-aprovado.md) | Sicredi: DDA e envio do pagamento aprovado (se houver API) | construção mínima condicionada | CA-4-12 a CA-4-14 | SPEC-4-002 |
| [SPEC-4-005](spec-4-005-rdv-lancamento-com-foto-e-leitura-automatica.md) | RDV com foto, leitura automática e assistente flutuante | reuso + dependência existente + nativo | CA-4-15 a CA-4-18 | SPECs 4-001 e 4-002 |
| [SPEC-4-006](spec-4-006-fechamento-mensal-do-rdv-e-envio-a-contabilidade.md) | Fechamento mensal do RDV, painel e envio à contabilidade | construção mínima | CA-4-19 a CA-4-22 | SPEC-4-005 |
| [SPEC-4-007](spec-4-007-contratos-com-assinatura-docusign.md) | Contratos com modelos e assinatura pelo DocuSign | nativo + integração mínima | CA-4-23 a CA-4-26 | SPECs 3-004 e 4-001 |
| [SPEC-4-008](spec-4-008-recebimentos-e-fluxo-de-caixa-por-empresa.md) | Recebimentos, aviso do boleto de cobrança e fluxo de caixa por empresa | nativo + construção mínima | CA-4-27 a CA-4-30 | SPECs 4-002 e 4-007 |
| [SPEC-4-009](spec-4-009-conector-mcp-do-sistema.md) | Conector MCP do sistema e lançamento de despesa pelo bot do Maestro (conector) | construção mínima | CA-4-31 a CA-4-33 | SPECs 4-002 a 4-008 |
| [SPEC-4-010](spec-4-010-loop-01-proxima-acao-em-dia.md) | LOOP-01: próxima ação em dia (loop) | reuso | CA-4-34 a CA-4-36 | SPEC-4-009 |

SPECs de sistema: 4-001 a 4-008. SPECs de conector e loop: 4-009 e 4-010. São 10 SPECs, acima da faixa de referência de 3 a 7, porque a emenda P13 juntou na fase 4 o financeiro (contas a pagar, e-mail, banco, caixa), o RDV completo e os contratos com assinatura. Cada integração (e-mail, banco, DocuSign, MCP) tem SPEC própria.

### Como executar

1. **Construção em sequência**, na ordem de `../fase-4.md`, sem pedir autorização nem teste entre as tasks.
2. **Ordem:** 4-001 → 4-002 → 4-003 → 4-004 → 4-005 → 4-006 → 4-007 → 4-008 → 4-009 → 4-010.
3. **Pontos de aprovação reais** (feitos por um Administrador na tela, sem parar a fila): primeiro envio ao banco em produção (SPEC-4-004) e primeiro contrato real em produção no DocuSign (SPEC-4-007).
4. **Em espera sem travar a fase:** caixa de e-mail dos boletos (CL-PEND-013), APIs do Sicredi (CL-PEND-014), conta DocuSign (CL-PEND-015), CNPJs (CL-PEND-011), e-mails da contabilidade (CL-PEND-012), envio de e-mail no plano do Skip (CL-PEND-018), modelo de contrato real (CL-002), conector no Maestro do sócio (CL-PEND-016).

### Fora desta fase

- ERP, cálculo de imposto, emissão de nota fiscal e emissão automática de boleto de cobrança;
- conciliação bancária por extrato; Pix por API; outros bancos;
- avisos por WhatsApp e mensagens a produtores;
- auditoria completa, desligamento de usuário, mapa KML e LOOP-02 (fase 5);
- painel de fertilidade/NDVI, Sentinel, calculadora de fertilizantes, AutoCAD, QGIS e drone (fora do projeto).

### Tasks

As tasks desta fase estão em `../fase-4.md` e listadas em `## Tasks vinculadas` de cada SPEC.

## Fase 5 — Consolidação, mapa e validação

**Fase:** 5 — Consolidação, mapa das áreas, reativação da carteira e validação ponta a ponta
**Gerado em:** 23/11/2026 (emenda P13 do escopo) · **Status das SPECs:** planejadas
**Resultado da fase:**
- o sistema opera nas duas empresas com auditoria das operações críticas e desligamento seguro de usuário;
- as áreas das propriedades aparecem no mapa a partir do KML;
- a carteira esquecida volta a ser trabalhada com sugestões da IA medidas pelo LOOP-02;
- a validação automática prova as fases 1 a 5 e o Diogo e o consultor decidem o go-live.

| SPEC | Entrega | Degrau da solução | Critérios | Depende de |
|---|---|---|---|---|
| [SPEC-5-001](spec-5-001-auditoria-das-operacoes-criticas.md) | Auditoria das operações críticas | reuso + construção mínima | CA-5-01 a CA-5-03 | fases 1–4 |
| [SPEC-5-002](spec-5-002-desligamento-de-usuario-e-relatorio-de-uso.md) | Desligamento de usuário com transferência da carteira e relatório de uso | reuso + construção mínima | CA-5-04 a CA-5-06 | SPEC-5-001 |
| [SPEC-5-003](spec-5-003-mapa-das-areas-por-kml.md) | Mapa das áreas por KML na ficha e na carteira | dependência nova pequena + reuso | CA-5-07 a CA-5-09 | SPEC-3-006 (emenda de 23/11) |
| [SPEC-5-004](spec-5-004-loop-02-reativacao-da-carteira.md) | LOOP-02: sugestões de reabordagem com IA (loop) | reuso + nativo | CA-5-10 a CA-5-12 | SPECs 3-005, 4-009 e 4-010 |
| [SPEC-5-005](spec-5-005-validacao-ponta-a-ponta-das-fases-1-a-5.md) | Validação ponta a ponta das fases 1 a 5 e decisão de go-live | reuso | CA-5-13 a CA-5-15 | SPECs 5-001 a 5-004 |

SPECs de sistema: 5-001 a 5-003 (a 5-004 também entrega a parte de sistema das sugestões). Loop: 5-004. Validação: 5-005.

### Como executar

1. **Construção em sequência**, na ordem de `../fase-5.md`, sem pedir autorização nem teste entre as tasks.
2. **Ordem:** 5-001 → 5-002 → 5-003 → 5-004 → 5-005.
3. **Fim do projeto:** a última task é a decisão de go-live, registrada pelo Diogo e pelo consultor sobre o relatório final. Não é teste.
4. **Em espera sem travar a fase:** exemplos de KML do Diogo (CL-PEND-017) — o mapa é construído e provado com KML fictício.

### Fora desta fase

- escopo novo: o que falhar na validação fica como pendência registrada e não é aprovado por ausência de erro relatado;
- painel de evolução de fertilidade/NDVI, imagens Sentinel, calculadora de fertilizantes, AutoCAD, QGIS e drone (fora do projeto; ficam para o Maestro da Agrospy numa conversa separada);
- desenho ou edição de contornos no app; mapa sem internet.

### Tasks

As tasks desta fase estão em `../fase-5.md` e listadas em `## Tasks vinculadas` de cada SPEC.

## Regras comuns das fases 4 e 5

Valem para todas as SPECs `spec-4-*` e `spec-5-*`. Cada SPEC cita esta seção em "Ler antes de alterar".

1. **Sem teste humano (P11, 17/11/2026).** Nenhuma task nem SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. Toda task fecha pela prova automática da própria SPEC, com evidência em `05_entregas/fase-N/spec-N-00X/` e o log do Skip. A única decisão de pessoa no fim do projeto é o go-live (última task da SPEC-5-005), tomada sobre o relatório final.
2. **Estado da task no arquivo da fase.** `[x]` quando a prova da SPEC passou no app publicado, com a data de conclusão numa linha `>` ("Concluída em dd/mm/aaaa") — nunca no fim da linha do título, porque o portal lê o fim da linha como responsável e prazo. `[/]` quando começou ou está em espera, com o motivo numa linha `>`.
3. **Dependência da Agrospy** (segredo, conta, caixa de e-mail, API do Sicredi, conta DocuSign, CNPJs, e-mails da contabilidade, exemplos de KML, modelo de contrato): deixe só aquela task em espera com o motivo, siga para a próxima que dá para construir e, no fim, avise uma vez com a lista do que ficou esperando.
4. **Empresas de teste.** Provas só nas empresas "Teste A" e "Teste B" (SPEC-3-001), com o elenco `teste.*` mais `teste.administrativo` (SPEC-4-001) e o usuário técnico `loop.maestro` (SPEC-4-010). Nada de teste é gravado na Agrospy ou na Rumo Agro reais. Senhas e chaves de teste ficam só nas credenciais do executor.
5. **Contexto técnico do Skip (PocketBase v0.36 em goja).** Migrações só rodam no publish; migração aplicada nunca é editada; não declare funções no topo de arquivo de hook (`require(\`${__hooks}/lib/...\`)` dentro do handler); grave com `$app.runInTransaction`; segredos só por `$secrets.get`; `$ai.*` só no hook (modelos `fast`/`reasoning`, só texto); PDF com texto por `$documents.toMarkdown` (até 10 MB, sem OCR); e-mail pelo cliente de e-mail do Skip; o runtime não tem `Intl` e Brasília é UTC−3 fixo.
6. **Dinheiro e datas.** Valores sempre em centavos (inteiro). Datas de negócio em dias de Brasília.
7. **Avisos.** Sempre no app (lista + notificação no celular) e, quando a SPEC disser, também por e-mail. Nunca por WhatsApp. A notificação na tela bloqueada não mostra nome de produtor ou fornecedor nem valor.
8. **A IA lê e sugere; pessoas decidem.** Nenhum agente, rotina, loop ou chave de API aprova pagamento, marca como pago, envia ao banco, envia contrato ou altera regra. Texto vindo de e-mail, PDF, foto, áudio ou histórico entra no modelo como dado delimitado, nunca como instrução, e a saída é JSON validado.
9. **Privacidade.** Log sem nome, documento, telefone, e-mail, valor, linha digitável ou texto falado; só ids, contagens e status. Segredos nunca em arquivo, migração, evidência ou log.
10. **Duas empresas no tenant Agrospy.** Todo lançamento financeiro (despesa, conta a pagar, recebimento, contrato) escolhe a empresa do lançamento (AgroSpy, AgroSmart ou Rumo Agro, SPEC-4-001), e cada uma tem o próprio fluxo de caixa. A planilha financeira antiga não é base: o padrão dos dados é o das SPECs.
11. **Visual.** Toda tela nova usa o sistema da SPEC-3-002: componentes de `src/components/app/`, cor só pelos tokens (hex só em `src/lib/cores.ts`), estados de carregando, vazio, erro e sem internet, entrada na `/vitrine`, capturas em 390×844 e 1280×800 sem rolagem horizontal da página e axe-core sem falha séria. Os itens novos de menu seguem a tabela da SPEC-4-001.
12. **Ao fechar cada task:** atualize o espelho do código em `07-sistemas/comercial/codigo/` e guarde as evidências.
13. **Fora do sistema e do projeto:** ERP, cálculo de imposto, emissão de nota fiscal; painel de evolução de fertilidade/NDVI, imagens Sentinel, calculadora de fertilizantes, AutoCAD, QGIS e drone. Não construa nada disso.
