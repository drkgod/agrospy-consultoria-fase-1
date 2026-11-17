# SPEC-3-005 — Painel do gestor, painel do vendedor e fila de prioridades

**Fase:** 3
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** RQ-003; RQ-005 ("painel exibe fila gerencial"); P2; P6; P7 (a fase 3 entrega a fila determinística de clientes sem contato); Fase 3, capacidades "painel do gestor e painel do vendedor" e "fila priorizada determinística"; CL-PEND-006
**Degrau da solução:** reuso + nativo da plataforma:
- **Reuso:** a "Visão do gestor" e os 3 indicadores semanais da fase 2, a regra de agrupamento da carteira e o destaque da revisita;
- **Nativo:** rotas do Skip com consultas agregadas no servidor;
- **Construção:** os painéis e a fila de prioridades.

## Contexto e decisões fechadas

- **Estado atual:**
  - **Visão do gestor** (`/visao-gestor`, Gestão e Administrador):
    - carteira por responsável: atrasadas, hoje, próximos 7 dias, abertas e visitas em 7 dias;
    - produtores sem oportunidade aberta;
    - os 3 indicadores semanais (prospecções = visitas na semana; visitas com potencial = visitas cujo produtor está como potencial ou cliente; oportunidades com necessidade reconhecida = oportunidades criadas na semana), da semana atual e da anterior, de segunda a domingo em Brasília.

    Os indicadores são contados no navegador, e um erro de consulta vira 0 em silêncio.
  - **O que falta:** não há painel com funil, propostas, ganhos e perdas, nem visão do vendedor sobre a própria carteira além da lista, nem fila de prioridades. Esses dados nascem na SPEC-3-004.
- **Estado desejado:**
  - **Painel do gestor:** Gestão e Administrador abrem "Painel" e veem, da empresa ativa:
    - funil com quantidade e valor por etapa;
    - atrasos;
    - propostas vigentes e vencidas;
    - ganhos, perdas e não prioritárias com motivos;
    - conversão;
    - visitas;
    - serviços por etapa;
    - indicadores semanais;
    - carteira por responsável.

    Os filtros são período, responsável e linha de negócio.
  - **Painel do vendedor:** o Comercial vê o mesmo painel, limitado à própria carteira.
  - **Fila de prioridades:** todos (menos o Operador) têm a fila ordenada por uma regra fixa. Cada número do painel bate com a consulta direta na base.
- **Decisões já fechadas:**
  - **Uma empresa por vez:** o painel mostra só a empresa ativa (P2; RQ-003: "indicadores não podem ser misturados"). "Filtrar por empresa" é trocar a empresa ativa no topo. Nada soma as duas.
  - **Números calculados no servidor:** uma rota de painel e uma rota de fila fazem os cálculos e aplicam o perfil de quem chama. A tela só desenha.
  - **Conversão** (padrão desta SPEC): ganhas ÷ (ganhas + perdidas) no período. As não prioritárias ficam fora da conta e aparecem à parte, porque não são perda.
  - **Cadência de "sem contato"** (padrão desta SPEC, editável pelo Administrador; CL-PEND-006): 20 dias, a frequência de retorno que o Diogo citou no kickoff ("15 a 20 dias"). Proposta "vencendo": 3 dias.
  - **Indicadores semanais:** mantêm a definição da fase 2, mas passam a ser calculados na rota do painel. Erro de consulta aparece como erro, nunca como 0.
  - **Rota antiga:** `/visao-gestor` redireciona para `/painel`. A tabela de carteira por responsável vira uma seção do painel.
- **Bloqueios:** nenhum. Depende das coleções da SPEC-3-004.

## Resultado observável

- **Gestor:** na reunião de segunda, o Diogo abre "Painel" na Agrospy e escolhe "Este mês". Ele vê:
  - 14 oportunidades abertas (R$ 610 mil estimados);
  - o funil por etapa;
  - 3 atrasadas;
  - 5 propostas vigentes, 1 vencida;
  - 2 ganhos (R$ 96 mil) e 1 perda por "Preço";
  - conversão de 67%.

  Ele filtra por "Alisson" e por "Agricultura de precisão" e os números mudam. Ao trocar para Rumo Agro, tudo muda, sem misturar.
- **Vendedor:** o vendedor abre "Prioridades" e vê, nesta ordem:
  1. as ações atrasadas;
  2. as de hoje;
  3. a proposta que vence em 2 dias;
  4. o cliente sem contato há 39 dias, que está na época boa;
  5. o produtor que pediu para ser revisto agora.

## Limites e dependências

- **Inclui:**
  - rota `GET /backend/v1/painel` e tela `/painel`, com a versão do gestor e a do vendedor;
  - rota `GET /backend/v1/fila` e tela `/prioridades`;
  - coleção `config_comercial` e tela `/config/comercial`;
  - redirecionamento de `/visao-gestor`;
  - cartão "Prioridades" com os 3 primeiros itens na tela inicial, se a tela inicial da SPEC-3-003 já estiver no ar.
- **Fora de escopo:**
  - sugestão de reabordagem por IA (fase 5);
  - exportar o painel em PDF ou planilha;
  - somar as duas empresas;
  - metas de venda;
  - avisos novos (a fila não dispara notificação);
  - indicadores financeiros e RDV (fase 4).
- **Entradas e pré-condições:**
  - SPEC-3-004 no ar (etapas, propostas, desfechos e serviços);
  - sistema visual da SPEC-3-002.
- **Saídas/artefatos:** rotas, `hooks/lib/painel.js` e `hooks/lib/fila.js`, telas e evidências em `05_entregas/fase-3/spec-3-005/`.
- **Dependências e responsáveis:** a Agrospy executa com o Maestro.
- **Atores e permissões mínimas:**

  | Recurso | Administrador | Gestão | Comercial | Operador |
  |---|---|---|---|---|
  | Painel | empresa inteira, filtro por responsável | empresa inteira, filtro por responsável | só a própria carteira, sem filtro de responsável e sem a tabela por responsável | não (403 e sem item no menu) |
  | Fila de prioridades | empresa inteira ou um responsável | empresa inteira ou um responsável | só a própria carteira | não |
  | Configuração comercial | edita | vê | vê | não |
  | Parâmetro `hoje` nas rotas (só prova) | sim | não (ignorado) | não (ignorado) | — |

- **Superfícies/arquivos/configurações afetadas:**
  - `pocketbase/hooks/painel_rotas.js`, `fila_rotas.js`, `lib/painel.js` e `lib/fila.js` (novos);
  - migração de `config_comercial`;
  - `src/services/painel.ts` e `fila.ts` (novos);
  - telas `src/pages/Painel.tsx`, `Prioridades.tsx` e `ConfigComercial.tsx` (novas);
  - `src/pages/VisaoGestor.tsx`, que sai e vira redirecionamento;
  - `src/App.tsx`, só as rotas `/painel`, `/prioridades`, `/config/comercial` e o redirecionamento de `/visao-gestor`;
  - `src/components/app/navegacao.ts` e `tools/tests/navegacao_esperada.json`: entram "Painel", "Prioridades" e `/config/comercial` em "Configurações comerciais", e sai "Visão do gestor", conforme a tabela "Navegação por perfil" da SPEC-3-002. O menu é desenhado pelo `AppShell` a partir desse arquivo;
  - `src/views/` (views sem acesso a dados do painel e das prioridades) e `src/fixtures/vitrine.ts`;
  - `pocketbase/hooks/empresas_padroes.js` da SPEC-3-004, só para acrescentar a linha de `config_comercial`.
- **Risco e plano B:**
  - **Desempenho:** uma rota lenta com muitos registros. Use consultas agregadas com `$app.db().newQuery` e parâmetros ligados (`{:empresa}`), nunca concatenação. Limite de 2 s por chamada com 5 mil oportunidades na fixture de carga. Se passar, registre o tempo e pagine as listas (20 itens).
  - **Época do produtor:** se o texto da época não puder ser lido, o produtor fica fora da prioridade de época e cai na ordem seguinte.
- **Rollback ou reversão:** esconder os itens "Painel" e "Prioridades" do menu e voltar `/visao-gestor` para a tela da fase 2, que fica no histórico do Skip. As rotas só leem dados.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| `GET /backend/v1/painel` | `oportunidades`, `etapas_funil`, `propostas`, `condicoes_negociadas`, `motivos_desfecho`, `visitas`, `servicos`, `vinculos` | parâmetros: `empresa` (obrigatório), `inicio` e `fim` (`AAAA-MM-DD`), `responsavel?`, `linha?`, `hoje?` (só Administrador). A resposta está descrita logo abaixo | `$apis.requireAuth()`; perfil pela tabela `vinculos` ativa na empresa; Comercial com `responsavel` forçado para ele mesmo | só leitura; mesma entrada dá a mesma saída | 400 em período inválido (fim < início ou mais de 366 dias); 403 para Operador; 404 para empresa sem acesso |
| `GET /backend/v1/fila` | `oportunidades`, `propostas`, `produtores`, `visitas`, `acoes_oportunidade`, `config_comercial` | parâmetros: `empresa`, `responsavel?`, `pagina` (1…), `por_pagina` (≤ 50), `hoje?`. A resposta traz `{itens: [{grupo, ordem, tipo, produtor: {id, nome, municipio}, oportunidade?: {id, descricao, etapa_nome}, responsavel_nome, motivo, data_referencia}], total}` | igual ao painel | só leitura; ordem estável | igual ao painel |
| `config_comercial` | coleção nova | `empresa` (única), `dias_sem_contato` (número de 5 a 365, padrão 20), `dias_proposta_vencendo` (número de 0 a 30, padrão 3) | list/view: `acesso_empresas`; create/update: `acesso_admin`; delete: null | a migração cria uma linha por empresa existente, com os padrões. O hook de empresa nova da SPEC-3-004 (`empresas_padroes.js`) passa a criar também a linha de empresa criada depois | valor fora da faixa: 400 |

**Resposta do painel:**
- `abertas`: `{quantidade, valor_estimado, sem_valor}`;
- `mini_series`: `{novas_oportunidades, propostas_registradas, ganhas}`, cada uma com 8 números, um por semana (segunda a domingo em Brasília; a última é a semana atual), e `conversao_mensal`, com os 6 meses da `serie_mensal`. Elas alimentam o `MiniPontos` dos 4 `CartaoNumero` e respeitam os mesmos filtros de responsável e linha;
- `funil`: `[{etapa_id, nome, ordem, quantidade, valor_estimado}]`, com todas as etapas ativas na ordem, inclusive as com 0;
- `atrasadas`: `{quantidade, itens}`, com até 20 itens;
- `propostas_vigentes`: `{quantidade, valor, vencidas, itens}`;
- `resultados`: `{ganhas: {quantidade, valor}, perdidas: {quantidade}, nao_prioritarias: {quantidade}, conversao_pct}`;
- `motivos_perda` e `motivos_nao_prioritaria`: `[{motivo, quantidade}]`;
- `serie_mensal`: últimos 6 meses, `[{mes, ganhas, perdidas}]`;
- `visitas`: `{quantidade}`;
- `servicos_por_etapa`: `[{etapa, quantidade}]`;
- `indicadores_semanais`: `{atual: {prospeccoes, com_potencial, oportunidades}, anterior: {...}, inicio_semana}`;
- `por_responsavel`: igual à tabela da fase 2; só para Gestão e Administrador.

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-72 | qualquer chamada do painel ou da fila | considera só a empresa pedida, que precisa estar em `acesso_empresas`. Comercial fica limitado a `responsavel = ele` (oportunidades) e a `produtores.responsavel = ele` (produtores). Operador recebe 403 | — | P2; P6 |
| RN-73 | período | padrão: do dia 1 do mês até hoje (Brasília). Pílulas: "Esta semana" (segunda a domingo), "Este mês", "Últimos 90 dias", "Este ano" e "Personalizado" (no máximo 366 dias) | — | esta SPEC |
| RN-74 | o que depende do período | abertas, funil, atrasadas e propostas vigentes mostram o estado de hoje e não dependem do período. Ganhas, perdidas e não prioritárias usam `encerrada_em` no período. O valor ganho é a soma de `condicoes_negociadas.valor_total` não canceladas. Visitas usam `data` no período | filtro de linha não se aplica às visitas, e a tela diz isso | esta SPEC |
| RN-75 | conversão | `ganhas ÷ (ganhas + perdidas) × 100`, com uma casa decimal. Sem encerradas: "—" | — | esta SPEC |
| RN-76 | atrasada | aberta com `proxima_acao_data` antes de hoje (Brasília), a mesma regra da carteira | — | fase 1, RN-26 |
| RN-77 | indicadores semanais | mesma definição da fase 2, calculada no servidor. Falha de consulta devolve erro, nunca 0 | — | fase 2 |
| RN-78 | ordem da fila | ver a seção "Ordem da fila" abaixo | — | P7; esta SPEC |
| RN-79 | configuração comercial | só o Administrador muda, dentro das faixas. A fila usa o valor vigente na hora da chamada | — | CL-PEND-006 |
| RN-80 | último contato do produtor | a data mais recente entre `visitas.data` e `acoes_oportunidade.created` do produtor na empresa. Sem nenhum contato, vale `produtores.created` | — | esta SPEC |

**Ordem da fila (RN-78):**
- **Cada item aparece uma vez,** no primeiro grupo que se aplicar.
- **Desempate dentro de cada grupo:** o critério do grupo, depois o nome do produtor em ordem alfabética (sem acento e sem diferenciar maiúscula) e depois o id.

| Grupo | Entra | Ordena por |
|---|---|---|
| 1 Atrasada | oportunidade aberta com ação antes de hoje | dias de atraso, do maior para o menor |
| 2 Hoje | oportunidade aberta com ação hoje | `valor_estimado` do maior para o menor; sem valor por último |
| 3 Proposta vencendo | oportunidade aberta com proposta vigente de validade até hoje + `dias_proposta_vencendo` (inclui as vencidas) | validade, da mais antiga para a mais recente |
| 4 Sem contato | produtor não arquivado, com `status_comercial` `cliente` ou `potencial`, sem oportunidade aberta e com último contato (RN-80) há mais de `dias_sem_contato` dias | primeiro quem está na época de maior efetividade (o texto `epoca_efetividade` cobre o mês atual, pela mesma leitura do destaque da revisita); depois `cliente` antes de `potencial`; depois mais dias sem contato |
| 5 Rever agora | produtor com oportunidade `nao_prioritaria` cujo `reavaliar_em` já chegou, sem oportunidade aberta e sem contato depois de `reavaliar_em` | `reavaliar_em`, da mais antiga para a mais recente |

**Motivo mostrado em cada item:** "Atrasada há N dias", "Ação para hoje", "Proposta vence em N dias" ou "Proposta vencida há N dias", "Sem contato há N dias", acrescido de "· época boa agora" quando for o caso, e "Pediu para rever em dd/mm".

## Fluxo e regras

1. **`/painel`** (menu "Painel", para Administrador, Gestão e Comercial):
   1. topo com o título, a empresa ativa (que abre a troca de empresa) e o período;
   2. pílulas de período;
   3. filtros de responsável (só Gestão e Administrador) e de linha de negócio;
   4. blocos na ordem:
      1. 4 números com mini gráfico: abertas (quantidade e valor), propostas vigentes (quantidade, valor e vencidas), ganhos no período (quantidade e valor) e conversão;
      2. funil por etapa;
      3. resultados dos últimos 6 meses (ganhas × perdidas);
      4. atrasadas;
      5. prioridades (os 5 primeiros da fila, com "Ver todas");
      6. propostas vigentes;
      7. motivos de perda e de não prioritária;
      8. indicadores semanais (atual × anterior);
      9. serviços por etapa;
      10. carteira por responsável (só Gestão e Administrador).
2. Tocar num item abre a oportunidade ou a ficha do produtor. Tocar numa etapa do funil abre a lista das oportunidades dela, com os mesmos filtros.
3. **`/prioridades`:** a fila completa, paginada de 20 em 20, com os grupos como cabeçalhos de seção. Gestão e Administrador podem filtrar por responsável.
4. **`/config/comercial`** (Administrador): os dois números, com a explicação de cada um em uma frase.
5. **Tela inicial:** se a tela da SPEC-3-003 já estiver no ar, ganha o cartão "Prioridades" com os 3 primeiros itens da fila do usuário.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | Gestão, "Este mês", sem filtros | todos os blocos com os números da base | — |
| Limite | período sem nenhum encerramento | conversão "—" e resultados zerados com `EstadoVazio` | — |
| Limite | etapa ativa sem oportunidade | aparece no funil com 0 | — |
| Falha | Comercial pede `responsavel` de outro | a resposta vem só com a carteira dele (`escopo: propria_carteira`) | — |
| Falha | Operador abre `/painel` | 403; a tela mostra "Seu perfil não tem acesso ao painel" e o item não aparece no menu | — |
| Falha | consulta do indicador falha | o bloco mostra `EstadoErro` com "Tentar de novo", nunca 0 | — |
| Falha | sem internet | `AvisoTopo` com os últimos números carregados, marcados "de dd/mm hh:mm"; filtros desabilitados | — |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; a SPEC-3-004; `src/pages/VisaoGestor.tsx`; `src/services/carteira.ts` (`agrupar` e `indicadoresSemanais`); a leitura de época do destaque da revisita em `ProdutorFicha.tsx` ou no serviço onde estiver; as coleções `oportunidades`, `visitas`, `produtores` e `vinculos`; o guia de rotas do Skip.
2. **Contexto técnico do Skip (PocketBase v0.36 em goja):**
   - Brasília é UTC−3 fixo, e o runtime não tem `Intl`;
   - não declare funções no topo do arquivo: use `require(\`${__hooks}/lib/painel.js\`)` e `require(\`${__hooks}/lib/fila.js\`)` dentro do handler;
   - consultas com `$app.db().newQuery("...").bind({...}).all(...)` ou `$app.findRecordsByFilter` com parâmetros, nunca concatenação de texto do usuário;
   - migrações só rodam no publish;
   - leve a leitura de época para `lib/fila.js`, com a mesma regra da tela, e use a mesma função nos dois lados (ou copie com o mesmo teste) para que tela e servidor concordem;
   - log nunca leva nome de produtor nem valor.
3. **Alterar somente:** as superfícies listadas em "Limites e dependências".
4. **Não alterar:**
   - as regras de acesso das coleções;
   - a carteira (`/`) além do cartão "Prioridades";
   - os dados (as rotas só leem).
5. **Executar nesta ordem** (a mesma da tabela de tasks):
   1. `config_comercial` em todas as empresas, a linha no hook de empresa nova e a fixture determinística (abaixo);
   2. `lib/fila.js`, a rota da fila, provada pela fixture, a tela `/prioridades` e a tela `/config/comercial` (task "Ordenar a fila de prioridades da carteira");
   3. `lib/painel.js`, a rota do painel com a reconciliação e a tela do painel do gestor, já com o bloco de prioridades (task "Montar o painel do gestor com funil, propostas e resultados");
   4. a versão do vendedor (task "Mostrar o painel do vendedor só com a própria carteira");
   5. o cartão "Prioridades" na tela inicial, o redirecionamento de `/visao-gestor`, as provas visuais e de tempo e a limpeza da fixture (task "Conferir os números do painel com a base").
6. **Parar e pedir validação quando:** nenhuma parada prevista. Se a rota passar de 2 s com a fixture de carga, registre o tempo e pagine as listas, sem parar.
7. **Estado válido ao parar:** a carteira e a "Visão do gestor" antiga continuam funcionando até o redirecionamento.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

As telas usam o sistema visual da SPEC-3-002, com os componentes de `src/components/app/`. Cor em hex só em `src/lib/cores.ts`, e os gráficos seguem as regras de gráfico da SPEC-3-002 (identificação por rótulo, não só por cor).

- **Painel:**
  - `AppShell` com `CabecalhoTela` (título "Painel", `subtitulo` com a empresa ativa e o período, e a pílula da empresa como ação, que abre a `TrocaEmpresa`). A saudação fica só na tela Hoje, pelo contrato da SPEC-3-002;
  - `FiltroPilulas` de período no topo, com os filtros de responsável e linha numa `Folha` no celular;
  - linha de 4 `CartaoNumero`, cada um com `MiniPontos` alimentado por `mini_series` (novas oportunidades, propostas registradas e ganhas por semana; conversão por mês);
  - `CartaoDestaque` "Funil" (rótulo "Oportunidades abertas", valor = quantidade e rodapé com o valor estimado) com `children` = `BarrasFinas` `embutido`, `tom="heroi"` e `ordenar = false`, uma linha por etapa na ordem do funil, com `texto` = quantidade e valor (contrato da SPEC-3-002);
  - `GraficoPontos` "Resultados por mês" com `series` = ganhas e perdidas (até 2 séries no contrato da SPEC-3-002, com legenda e marcador diferente por série);
  - `Cartao` com `ListaItem` para atrasadas, prioridades e propostas, cada item com ícone em círculo, título, subtítulo e valor ou `Selo` à direita;
  - `BarrasFinas` para motivos e serviços por etapa;
  - indicadores semanais como 3 `CartaoNumero` com a variação "vs. semana anterior".
- **Navegação:** "Painel", "Prioridades" e a configuração comercial seguem a tabela "Navegação por perfil" da SPEC-3-002.
- **Disposição:** no celular, uma coluna na ordem do fluxo. A partir de 1024 px, coluna principal de 2/3 (números, funil, resultados, atrasadas) e lateral de 1/3 (prioridades, propostas, motivos, serviços).
- **Prioridades:** `ListaItem` com `Selo` do grupo ("Atrasada", "Hoje", "Proposta", "Sem contato", "Rever") e o motivo como subtítulo.
- **Estados:** carregando com `Esqueleto` por bloco; vazio com `EstadoVazio` ("Nenhuma prioridade agora. Bom trabalho."); erro com `EstadoErro` por bloco; sem internet com `AvisoTopo`.
- **Vitrine `/vitrine`:** inclui o painel e a fila com dados fictícios: 4 etapas, 3 atrasadas, 2 propostas (1 vencida) e os 5 grupos da fila.

## Checklist de execução

- [ ] Fixture determinística criada; fila na ordem esperada.
- [ ] Rota do painel reconciliada com a base em todos os blocos.
- [ ] Perfis: Comercial limitado, Operador bloqueado, `hoje` ignorado fora do Administrador.
- [ ] Telas do painel, das prioridades e da configuração; redirecionamento de `/visao-gestor`.
- [ ] Vitrine, capturas em 390×844 e 1280×800 e axe-core.
- [ ] Fixture removida por migração de limpeza.
- [ ] Evidências em `05_entregas/fase-3/spec-3-005/`.

## Critérios de aceite

- [ ] **CA-3-24:** com a fixture, o painel de Gestão mostra os blocos do fluxo, e cada número bate 100% com a consulta direta na base da empresa ativa:
  - abertas (quantidade e valor);
  - funil por etapa;
  - atrasadas;
  - propostas vigentes e vencidas;
  - ganhas (quantidade e valor), perdidas e não prioritárias;
  - conversão;
  - motivos;
  - visitas;
  - serviços por etapa;
  - as mini séries dos 4 números.
- [ ] **CA-3-25:**
  - mudar o período, o responsável e a linha muda os números conforme RN-73 e RN-74, de novo batendo com a base;
  - trocar a empresa ativa troca todos os números;
  - nenhuma resposta soma ou mostra dados da outra empresa.
- [ ] **CA-3-26:**
  - o Comercial vê o painel e a fila só da própria carteira, mesmo pedindo outro responsável pela API, e não vê a tabela por responsável;
  - o Operador recebe 403 e não tem os itens no menu.
- [ ] **CA-3-27:**
  - com `hoje = 2026-12-10` e a fixture, a fila de `teste.comercial1` sai exatamente na ordem O1, O6, O2, O3, O4, O5, P7, P8, P11, sem P9 nem P10;
  - a fila de `teste.admin` sem `responsavel` (empresa inteira, com `hoje = 2026-12-10`) começa por O12;
  - duas chamadas seguidas devolvem a mesma ordem;
  - nenhum item aparece duas vezes.
- [ ] **CA-3-28:**
  - o Administrador muda `dias_sem_contato` para 10 e P9 entra no grupo 4, entre P7 e P8;
  - Gestão e Comercial não conseguem mudar a configuração;
  - valor fora da faixa é recusado.
- [ ] **CA-3-29:**
  - os 3 indicadores semanais (atual e anterior) batem com a contagem direta da base, e uma falha de consulta aparece como erro, não como 0;
  - `/visao-gestor` leva a `/painel`;
  - as telas passam nas provas visuais (sem rolagem horizontal, axe-core sem falha séria ou crítica) e estão na vitrine.

## TDD da SPEC

**Empresas nas provas (SPEC-3-001):** toda prova desta SPEC roda nas empresas de teste. Onde a prova diz "Agrospy", use a "Teste A"; onde diz "Rumo Agro", use a "Teste B". Os usuários `teste.*` têm vínculo só com elas, e nada de teste é gravado na Agrospy ou na Rumo Agro reais.

**Fixture determinística (migração de teste, prefixo "TESTE —", na Teste A):**
- `hoje = 2026-12-10`;
- **datas de criação:** a migração grava o `created` das visitas, das oportunidades e das ações com `record.setRaw('created', 'AAAA-MM-DD 12:00:00.000Z')` antes do `$app.save`, porque o autodate do PocketBase mantém a data definida assim na criação. Depois confere lendo de volta. Sem isso, a RN-80 usaria a data real da prova. Se o runtime não mantiver a data, essa prova para e o motivo é registrado, porque é limite da plataforma;
- `dias_sem_contato` = 20 e `dias_proposta_vencendo` = 3;
- responsável `teste.comercial1`, salvo onde indicado.

| Item | Situação montada |
|---|---|
| O1 | produtor P1, oportunidade aberta, ação em 03/12 (7 dias de atraso) |
| O6 | produtor P6, aberta, ação em 03/12 (7 dias) e proposta vigente vencida em 01/12 |
| O2 | P2, aberta, ação em 08/12 (2 dias) |
| O3 | P3, aberta, ação em 10/12, valor estimado 30.000 |
| O4 | P4, aberta, ação em 10/12, sem valor |
| O5 | P5, aberta, ação em 20/12, proposta vigente com validade em 12/12 |
| P7 | `cliente`, sem oportunidade aberta, última visita em 01/11 (39 dias), época "dez-fev" |
| P8 | `potencial`, sem oportunidade aberta, última visita em 15/10 (56 dias), sem época |
| P9 | `cliente`, sem oportunidade aberta, última visita em 25/11 (15 dias) |
| P10 | `nao_potencial`, última visita em 01/08 |
| P11 | sem classificação comercial, oportunidade `nao_prioritaria` com `reavaliar_em` em 05/12 e sem contato depois (a oportunidade e as ações dela com `created` em 20/11 e 25/11) |
| O12 | produtor P12, de `teste.comercial2`, aberta, ação em 01/12 (9 dias) |

Mais dois desfechos no mês, com responsável `teste.comercial1`, que ficam fora da fila:
- P13: oportunidade ganha de 48.000, com condição e `encerrada_em` em 05/12. P13 vira `cliente`, mas tem visita em 08/12, então não entra no grupo 4;
- P14: oportunidade perdida por "Preço", com `encerrada_em` em 06/12. P14 é `potencial` e tem visita em 08/12, então também não entra no grupo 4.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | fila (CA-3-27) | chamar `/fila` com a fixture antes de `lib/fila.js` | rota inexistente ou ordem diferente (falha esperada) | resposta |
| GREEN 1 | ordem da fila (CA-3-27) | como `teste.admin`: `/fila?responsavel=<comercial1>&hoje=2026-12-10`, duas vezes; depois sem `responsavel` | O1, O6, O2, O3, O4, O5, P7, P8, P11 nas duas; sem `responsavel`, O12 primeiro | respostas |
| GREEN 2 | configuração (CA-3-28) | `dias_sem_contato = 10` e repetir a fila; PATCH como `teste.gestao` e como `teste.comercial1`; PATCH com `dias_sem_contato = 400` | P9 entra no grupo 4 entre P7 e P8 (cliente antes de potencial); 403 para Gestão e Comercial; 400 para o valor fora da faixa | respostas |
| GREEN 3 | reconciliação (CA-3-24) | `/painel` do mês de 12/2026 como `teste.gestao`; para cada bloco, inclusive `mini_series`, a consulta direta equivalente pela API das coleções | todos iguais (planilha de conferência bloco a bloco) | respostas + tabela de conferência |
| GREEN 4 | filtros e empresas (CA-3-25) | repetir com `responsavel = comercial2`, com uma linha de negócio e com "Esta semana"; chamar com a empresa Teste B | iguais à base; a Teste B sem nenhum item da fixture da Teste A | respostas |
| GREEN 5 | perfis (CA-3-26) | `teste.comercial1` pede `responsavel = comercial2` e `hoje`; `teste.operador` chama as duas rotas | resposta só com a carteira dele e `hoje` ignorado; 403 para o Operador | respostas |
| REFACTOR/REGRESSÃO | indicadores, visual e regressão (CA-3-29) | (a) indicadores semanais × contagem direta; (b) no navegador automatizado, interceptar a chamada de `/backend/v1/painel` devolvendo 500 e ver os blocos em erro; (c) `/visao-gestor`; (d) carteira `/` e avisos sem divergência; (e) capturas em 390×844 e 1280×800 de `/painel` (Gestão e Comercial) e `/prioridades`, com rolagem horizontal = 0 e axe-core; (f) fixture de carga com 5 mil oportunidades: tempo das rotas | (a) iguais; (b) erro visível; (c) redireciona; (d) sem divergência; (e) sem falha séria ou crítica; (f) no máximo 2 s ou paginação registrada | respostas, capturas, relatório do axe, tempos |

**Dados/fixtures:**
- a tabela acima;
- os usuários `teste.comercial1`, `teste.comercial2`, `teste.gestao`, `teste.admin` (Administrador da Teste A e da Teste B) e `teste.operador`, do elenco da SPEC-3-001;
- uma migração de limpeza remove a fixture e a carga no fim.

**Caminhos de erro obrigatórios:** Operador, Comercial pedindo outro responsável, outra empresa, período inválido, falha de consulta, sem internet, empresa sem etapa ativa.

**Evidência exigida:** respostas, tabela de conferência, capturas, relatório do axe e tempos em `05_entregas/fase-3/spec-3-005/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-3/spec-3-005/` e o log do Skip. A cadência de 20 dias e a regra de conversão são padrões desta SPEC: o Administrador muda a cadência na tela. Mudar a regra de conversão vira emenda.

## Handoff e operação

- **Como demonstrar:** "Painel" na reunião de equipe com filtro por vendedor; "Prioridades" no celular do vendedor no começo do dia.
- **Como operar depois:** o Administrador ajusta a cadência em `/config/comercial`. Cada vendedor começa o dia pela fila.
- **Como monitorar:** o tempo das rotas no log do Skip e a quantidade de itens no grupo "Sem contato" (fila grande demais pede revisão da cadência).
- **Pendência conhecida:** cadência por linha de negócio (CL-PEND-006 pergunta se varia) não entra; hoje é uma por empresa.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Ver o painel comercial e a fila de prioridades | Agrospy | SPEC-3-005 | CA-3-24 a CA-3-29 | todas as subtasks | evidências das subtasks | SPEC-3-004 no ar |
| id pendente | Ordenar a fila de prioridades da carteira | Agrospy | SPEC-3-005 | CA-3-27, CA-3-28 | RED 1 → GREEN 1 + GREEN 2 | respostas | SPEC-3-004 no ar |
| id pendente | Montar o painel do gestor com funil, propostas e resultados | Agrospy | SPEC-3-005 | CA-3-24, CA-3-25 | GREEN 3 + GREEN 4 | respostas + tabela de conferência | fila no ar |
| id pendente | Mostrar o painel do vendedor só com a própria carteira | Agrospy | SPEC-3-005 | CA-3-26 | GREEN 5 | respostas + capturas | painel do gestor |
| id pendente | Conferir os números do painel com a base | Agrospy | SPEC-3-005 | CA-3-29 | REFACTOR (a) a (f) | respostas, capturas, relatório do axe e tempos | painel e fila no ar |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
