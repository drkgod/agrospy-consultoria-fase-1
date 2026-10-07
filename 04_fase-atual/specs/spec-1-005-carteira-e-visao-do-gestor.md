# SPEC-1-005 — Minha carteira, visão do gestor e demonstração da fase

**Fase:** 1
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · validação e aceite: Rodrigo Santos (consultor)
**Origem no escopo:** RQ-005 (base), RQ-009; P6; Fase 1, capacidade 7 e critérios de aceite da fase; escopo base §4.7, §6.4, §6.5 e §7.4
**Degrau da solução:** reuso — telas e consultas sobre as coleções das SPECs 1-002 e 1-003, com as regras de acesso da SPEC-1-001; nenhuma coleção nova.

## Contexto e decisões fechadas

- **Estado atual:** o follow-up depende da memória; não há visão do que está atrasado (análise do vídeo, passos 6–7). Cada vendedor precisa ver os próprios clientes e o gestor precisa ver tudo (1ª consultoria 22/09 `[00:30:41]–[00:31:16]`); o painel geral é do gestor (`[00:30:35]`).
- **Estado desejado:** ao abrir o app, o vendedor vê o que está atrasado, o que é para hoje e o que vem nos próximos dias; o gestor vê o mesmo para toda a equipe da empresa ativa.
- **Decisões já fechadas:**
  - “Hoje” segue o fuso de Brasília (America/Sao_Paulo).
  - Grupos: Atrasadas (data anterior a hoje), Hoje, Próximos 7 dias, Depois.
  - A visão do gestor é só para Gestão e Administrador; o Comercial vê só a própria carteira; o Operador não tem carteira nesta fase.
  - Painel com indicadores (funil, conversão, motivos) é da fase 3; avisos push são da fase 2.
- **Bloqueios:** nenhum.

## Resultado observável

O Alisson abre o app de manhã e vê “2 atrasadas, 1 para hoje”; toca numa, registra o que fez e já agenda a próxima. O Diogo, como gestor, vê na visão da equipe quantas ações cada vendedor tem atrasadas e quais produtores estão sem nenhuma oportunidade aberta.

## Limites e dependências

- **Inclui:** tela “Minha carteira” (tela inicial para Comercial, Gestão e Administrador); ações rápidas “Concluir ação” e “Reagendar” (usando as regras da SPEC-1-003); seção “Produtores da minha carteira sem oportunidade aberta”; tela “Visão do gestor” com contagens por responsável, filtro por responsável, produtores sem oportunidade aberta e visitas registradas nos últimos 7 dias por responsável; data/hora da última sincronização; roteiro da demonstração da fase.
- **Fora de escopo:** gráficos, funil, conversão, motivos e exportação (fase 3); avisos push (fase 2); visão do gestor sem internet.
- **Entradas e pré-condições:** SPECs 1-001 a 1-003 em GREEN; para a demonstração final, também a SPEC-1-004.
- **Saídas/artefatos:** duas telas; consultas de contagem; roteiro de reconciliação; registro da demonstração e do aceite.
- **Dependências e responsáveis:** Agrospy executa e demonstra; Diogo testa (CL-004); Rodrigo Santos conduz a call de validação e decide o fechamento da fase.
- **Atores e permissões mínimas:** conforme a matriz da SPEC-1-001.
- **Superfícies/arquivos/configurações afetadas:** telas “Minha carteira” e “Visão do gestor”; serviços de consulta em `src/services/carteira.ts`.
- **Risco e plano B:** contagem da tela divergir da base (filtro de data ou de fuso errado) — a reconciliação do TDD compara com consulta direta.
- **Rollback ou reversão:** telas de leitura; reverter a versão das telas não afeta dados.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| `oportunidades` (aberta) | backend do Skip | `responsavel`, `produtor`, `linha_negocio`, `proxima_acao`, `proxima_acao_data` | regras da SPEC-1-003 (o servidor já devolve só o permitido) | consultas paginadas | sem conexão: Minha carteira mostra a cópia local (SPEC-1-004); a visão do gestor mostra “precisa de internet” |
| `produtores` | backend do Skip | `responsavel`, `arquivado` | regras da SPEC-1-002 | paginado | — |
| `visitas` | backend do Skip | `responsavel_visita`, `data` | regras da SPEC-1-003 | paginado | — |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-26 | agrupamento | Atrasadas: data < hoje; Hoje: data = hoje; Próximos 7 dias: hoje < data ≤ hoje + 7; Depois: data > hoje + 7 (fuso de Brasília) | — | §6.4 |
| RN-27 | ordem dentro do grupo | mais atrasada primeiro; depois data mais próxima | — | §6.5 |
| RN-28 | produtor sem oportunidade aberta | aparece na seção própria (não arquivados) | — | §7.4 |
| RN-29 | visão do gestor | contagens por responsável da empresa ativa: atrasadas, hoje, próximos 7 dias, total abertas e visitas nos últimos 7 dias | — | `[00:30:41]` |

## Fluxo e regras

1. Login e empresa ativa → Comercial, Gestão e Administrador caem em “Minha carteira”; o Operador cai em “Produtores”.
2. Minha carteira → contadores no topo; grupos; cada item mostra produtor, linha, próxima ação, data e dias de atraso.
3. Tocar no item → “Concluir ação” (resultado + próxima) ou “Reagendar” (nova data) ou “Abrir ficha”.
4. Gestão/Administrador → menu “Visão do gestor”: tabela por responsável, filtro por responsável, lista de produtores sem oportunidade aberta e visitas da semana.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | oportunidades com datas ontem, hoje, +3 e +10 dias | uma em cada grupo, na ordem certa | — |
| Limite | virada do dia às 23h59/00h01 (Brasília) | item muda de “Hoje” para “Atrasadas” no dia seguinte | — |
| Limite | sem internet | Minha carteira mostra a cópia local com a hora da última sincronização | sincronizar depois |
| Falha | Comercial tenta abrir a visão do gestor | tela não aparece no menu; a consulta direta não traz dados de outros | — |

## Instruções de execução para o Ethos

1. **Ler antes de alterar:** esta SPEC, as SPECs 1-001 a 1-004 e as telas existentes do projeto no Skip.
2. **Alterar somente:** as telas “Minha carteira” e “Visão do gestor”, o serviço de consultas da carteira e a tela inicial por perfil.
3. **Não alterar:** regras de acesso e coleções; não criar gráfico, funil ou indicador da fase 3.
4. **Executar nesta ordem:** (a) consultas da carteira com o fuso de Brasília; (b) Minha carteira com grupos e ações rápidas; (c) seção de produtores sem oportunidade; (d) visão do gestor; (e) reconciliação RED/GREEN; (f) roteiro da demonstração completa; (g) evidências no card.
5. **Parar e pedir validação quando:** a contagem da tela divergir da consulta direta; o cliente pedir indicador da fase 3; a demonstração falhar em qualquer passo (a tarefa continua aberta).
6. **Estado válido ao parar:** as telas mostram só o permitido e as contagens batem com a base.

## Checklist de execução

- [ ] SPECs 1-001 a 1-003 em GREEN (pré-condição conferida).
- [ ] Minha carteira com grupos, ordem e ações rápidas.
- [ ] Visão do gestor com contagens por responsável.
- [ ] Reconciliação tela × base anexada.
- [ ] Demonstração completa no celular executada e gravada.
- [ ] Teste humano do Diogo registrado e aceite do consultor.
- [ ] Dados de teste (“TESTE —”) arquivados e vínculos dos usuários de teste desativados ao fim da fase.

## Critérios de aceite

- [ ] **CA-1-20:** Minha carteira mostra só as oportunidades abertas do próprio usuário, nos grupos certos para as datas de teste (ontem, hoje, +3 e +10 dias), no fuso de Brasília.
- [ ] **CA-1-21:** concluir uma ação na carteira exige a próxima e move o item para o grupo correspondente; reagendar para data passada é recusado.
- [ ] **CA-1-22:** as contagens da visão do gestor por responsável batem com a contagem direta na base da empresa ativa; o Comercial não acessa a visão do gestor nem pela tela nem pela consulta.
- [ ] **CA-1-23:** o fluxo completo da fase é demonstrado no celular com um produtor real: login → empresa → produtor indicado → visita sem internet → oportunidade com próxima ação → sincronização → Minha carteira → visão do gestor → um usuário da outra empresa não vê nada disso.
- [ ] **CA-1-24:** o Diogo executa o teste humano e confirma; o consultor revisa as evidências de todas as SPECs da fase e registra a decisão de fechamento.

## TDD da SPEC

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | agrupamento por data (CA-1-20) | criar para `teste.comercial1.agrospy` quatro oportunidades com datas ontem, hoje, +3 e +10 (inserção direta pela API para a de ontem, com `criado_em_aparelho` de ontem) e abrir a tela antes da regra de grupos | tudo numa lista só ou em grupos errados (falha esperada) | print |
| RED 2 | visão do gestor (CA-1-22) | com `teste.comercial1.agrospy`, chamar a consulta da visão do gestor | antes da proteção, retorna dados de outros (falha esperada) | resposta |
| GREEN | menor comportamento que passa | implementar grupos, ordem, ações rápidas e visão do gestor; repetir RED 1–2; concluir e reagendar uma ação na carteira (CA-1-21) | grupos corretos; Comercial sem acesso; item muda de grupo | prints + respostas |
| REFACTOR/REGRESSÃO | reconciliação e virada do dia | comparar, para cada responsável de teste, as contagens da tela com uma consulta direta às oportunidades abertas; conferir a virada do dia no fuso de Brasília; repetir a regressão de acesso da SPEC-1-001 | 100% das contagens iguais; virada correta; matriz sem divergência | tabela tela × base + tabela da matriz |
| Prova final da fase | demonstração (CA-1-23) | executar o roteiro completo no celular, com gravação de tela, usando um produtor real e um usuário de cada empresa | todos os passos passam | gravação + prints anexados ao card |

**Dados/fixtures:** usuários e produtores de teste das SPECs anteriores; um produtor real escolhido pelo Diogo para a demonstração.
**Caminhos de erro obrigatórios:** data na virada do dia, Comercial na visão do gestor, sem internet na carteira, reagendar para o passado.
**Evidência exigida:** prints dos grupos, tabela de reconciliação, gravação da demonstração e a mensagem de aceite do Diogo.

## Teste humano do cliente

- **Origem:** CL-004 (acompanhar e validar as entregas no portal).
- **Quem testa:** Diogo, com um vendedor (por exemplo, o Alisson).
- **Passos:** (1) o vendedor entra no celular na Agrospy; (2) cadastra um produtor real que veio por indicação; (3) em modo avião, registra a visita e cria a oportunidade com próxima ação; (4) sai do modo avião e confere o envio; (5) vê a ação em “Minha carteira”; (6) o Diogo abre a visão do gestor e encontra a ação; (7) um usuário só da Rumo Agro procura o produtor e não encontra; (8) o Diogo confere se os perfis de cada pessoa estão como combinado, inclusive se o vendedor deve ou não consultar o cadastro de outros vendedores.
- **Resultado esperado:** o fluxo funciona do começo ao fim no celular, sem perder nada, e a separação entre as empresas está clara.
- **Evidência do aceite:** mensagem do Diogo “testei, pode seguir” (ou o que precisa mudar) no card da call de validação.

## Handoff e operação

- **Como demonstrar:** seguir os passos do teste humano na call de validação.
- **Como operar depois:** o vendedor começa o dia pela Minha carteira; o gestor revisa a visão da equipe na reunião semanal.
- **Como monitorar:** número de ações atrasadas por responsável e visitas registradas por semana.
- **Pendência conhecida:** avisos no celular chegam na fase 2; indicadores e funil, na fase 3.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| baad9730-ed85-4a49-a5e9-6a3b8a30454a | Montar a tela Minha carteira com ações atrasadas, de hoje e próximas | Agrospy | SPEC-1-005 | CA-1-20, CA-1-21 | RED 1 → GREEN | prints dos grupos e da ação concluída | SPECs 1-001 a 1-003 em GREEN |
| 684e8557-4e70-420b-8479-a570f9ff33ad | Montar a visão do gestor com a carteira de toda a equipe | Agrospy | SPEC-1-005 | CA-1-22 | RED 2 → GREEN → REFACTOR/REGRESSÃO (reconciliação) | tabela tela × base | Minha carteira pronta |
| 8187b1f6-4eef-42e6-91ca-32cfe9b2eaa4 | Demonstrar o fluxo completo da Fase 1 no celular | Agrospy | SPEC-1-005 | CA-1-23 | prova final da fase | gravação de tela + prints | SPECs 1-001 a 1-004 em GREEN |
| 7acbab78-166f-4684-91ad-13dda69e9901 | Fazer a call de validação da Fase 1 com a Agrospy | Rodrigo Santos | SPEC-1-005 | CA-1-23, CA-1-24 | teste humano do cliente (CL-004) | registro da call e mensagem do Diogo | demonstração pronta |
| 99563d4a-ae5b-488a-a4ba-b45b7d24bfea | Revisar as evidências e decidir o fechamento da Fase 1 | Rodrigo Santos | SPEC-1-005 | CA-1-24 | evidências das SPECs 1-001 a 1-005 | decisão registrada no card e no STATUS | call de validação feita |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
