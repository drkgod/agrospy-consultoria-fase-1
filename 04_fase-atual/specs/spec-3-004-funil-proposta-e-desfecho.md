# SPEC-3-004 — Funil, proposta e desfecho da oportunidade, com o serviço técnico contratado

**Fase:** 3
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** RQ-003; RQ-005; RQ-011 (condição negociada obrigatória no ganho); P2; P6; Fase 3, capacidades "funil configurável por empresa", "orçamento/proposta registrada", "ganho, perda ou não prioritária com motivo" e "etapas de serviço técnico (planilha 0–5)"; CL-PEND-006; CL-001
**Degrau da solução:** nativo da plataforma + construção mínima:
- **Reuso:** `oportunidades` e o histórico append-only `acoes_oportunidade` da fase 1;
- **Nativo:** coleções, rotas e hooks do Skip (PocketBase);
- **Construção:** etapas, propostas, desfecho com condição negociada e acompanhamento do serviço técnico.

## Contexto e decisões fechadas

- **Estado atual:**
  - **Oportunidade:** pertence a uma empresa e a um produtor, tem linha de negócio, responsável e próxima ação com data obrigatória. O campo `situacao` só aceita `aberta`. Ganho e perda ficaram para esta fase de propósito.
  - **Histórico:** as ações ficam em `acoes_oportunidade` (`criada`, `concluida`, `reagendada`), só de inclusão. Os campos `nova_acao` e `nova_data` são obrigatórios.
  - **Proposta:** o orçamento combinado com o produtor não tem lugar no sistema. Hoje ele vai para um grupo de WhatsApp ("orçamento para X hectares do serviço tal, foi passado o valor tal").
  - **Serviço técnico:** o acompanhamento do serviço contratado (etapas de 0 a 5, como coleta, análise, relatório, entrega e recoleta) vive numa planilha de Excel.
- **Estado desejado:**
  - **Etapas:** cada oportunidade aberta está numa etapa do funil da sua empresa. Cada mudança de etapa fica no histórico.
  - **Proposta:** o orçamento fica registrado na oportunidade.
  - **Fechamento:** a oportunidade termina em ganha, perdida ou não prioritária, sempre com motivo. O ganho guarda a condição negociada: produto ou serviço, valor, entrada, parcelas e datas. Essa condição é a base do contrato da próxima fase.
  - **Serviço contratado:** é acompanhado por etapas técnicas, separado da conversa de venda.
- **Decisões já fechadas:**
  - **Funil por empresa:** Agrospy e Rumo Agro têm etapas próprias (P2). Só o Administrador da empresa cria, renomeia, reordena ou desativa etapas e motivos.
  - **Padrões em toda empresa:** a migração cria as etapas, os motivos e as etapas de serviço padrão em todas as empresas existentes, inclusive as de teste. O hook `onRecordAfterCreateSuccess` da coleção `empresas` (`pocketbase/hooks/empresas_padroes.js`, novo) cria os mesmos padrões em empresa criada depois. Nada é criado pelo nome da empresa.
  - **Etapas padrão desta SPEC** (editáveis pelo Administrador; CL-PEND-006 continua aberta para ajuste). Elas vêm do processo de venda que o Diogo descreveu no kickoff: visita, perfil, interesse, retornos com resultados até amadurecer, orçamento e fechamento, num ciclo que pode levar de 1 a 2 anos. Valem para todas as empresas:

    | Ordem | Etapa | Marca proposta |
    |---|---|---|
    | 1 | Necessidade reconhecida | não |
    | 2 | Em amadurecimento | não |
    | 3 | Proposta apresentada | sim |
    | 4 | Negociação | não |

    A prospecção continua sendo a visita sem oportunidade, como já contam os indicadores semanais. Toda oportunidade nova entra na etapa ativa de menor ordem.
  - **Desfechos:** são três e não são etapas: `ganha`, `perdida` e `nao_prioritaria`. Desfecho sem motivo é recusado. O ganho sem condição negociada também é recusado (RQ-011).
  - **Motivos padrão desta SPEC** (editáveis pelo Administrador):

    | Tipo | Motivos |
    |---|---|
    | Perda | Preço; Fechou com concorrente; Sem orçamento ou crédito agora; Sem estrutura ou máquinas para o serviço; Não viu valor no serviço; Sem retorno do produtor; Outro |
    | Não prioritária | Área ou potencial pequeno; Momento da safra; Precisa investir antes em tecnologia; Outro |

    "Outro" exige texto.
  - **Etapas padrão do serviço técnico** (editáveis pelo Administrador; a planilha CL-001 pode ajustar os nomes): 0 Contratado, 1 Coleta, 2 Análise, 3 Relatório, 4 Entrega, 5 Recoleta.
  - **Gravação pelo servidor:** mudança de etapa, desfecho e reabertura passam por rotas do servidor, que gravam a oportunidade e o histórico na mesma transação. A API comum não altera `etapa`, `situacao` nem os campos de desfecho.
  - **Histórico guarda o nome da etapa no momento:** renomear uma etapa não reescreve o passado.
  - **Ganho muda a classificação:** o produtor da oportunidade ganha vira `status_comercial = cliente`.
  - **Contrato fora desta fase:** ganho não gera contrato nem envia nada ao produtor. O contrato é da fase 4.
- **Matriz de acesso desta SPEC** (segue a da fase 1):

  | Ação | Administrador | Gestão | Comercial | Operador |
  |---|---|---|---|---|
  | Ver etapas, motivos e etapas de serviço da empresa | sim | sim | sim | sim |
  | Configurar etapas, motivos e etapas de serviço | sim | não | não | não |
  | Mudar etapa, registrar proposta, ganhar, perder, não prioritária | todas da empresa | todas da empresa | só as oportunidades em que é responsável | não |
  | Reabrir oportunidade encerrada | sim | sim | não | não |
  | Ver propostas e condição negociada | todas da empresa | todas da empresa | das oportunidades que ele vê | não |
  | Ver serviços técnicos | sim | sim | sim | sim |
  | Criar serviço e mudar a etapa do serviço | sim | sim | não | sim |

- **Bloqueios:** nenhum. Sem a planilha CL-001, as etapas padrão de serviço valem.

## Resultado observável

- **Na oportunidade:** o vendedor abre uma oportunidade e vê a etapa atual numa trilha de etapas. Ele toca em "Proposta apresentada", registra o valor de R$ 48.000, a validade e o PDF do orçamento, e a oportunidade passa para essa etapa sozinha.
- **No fechamento:** semanas depois, ele toca em "Fechar venda" e preenche:
  - o serviço: amostragem de solo em 600 ha;
  - o valor: R$ 48.000;
  - a entrada: R$ 8.000 hoje;
  - 2 parcelas de R$ 20.000, uma em 30/03 e outra em 30/07, depois da soja e do milho.

  A oportunidade sai da carteira, o produtor vira "cliente" e o app oferece "Criar o serviço". O serviço aparece em "Serviços" na etapa "0 Contratado". O técnico (Operador) avança para "1 Coleta" quando coleta.
- **Na perda:** a oportunidade perdida exige o motivo, que aparece no histórico com data e autor.

## Limites e dependências

- **Inclui:**
  - coleções `etapas_funil`, `motivos_desfecho`, `propostas`, `condicoes_negociadas`, `etapas_servico`, `servicos` e `eventos_servico`;
  - campos novos em `oportunidades` e `acoes_oportunidade`;
  - rotas de etapa, desfecho e reabertura da oportunidade e de etapa do serviço;
  - telas da oportunidade, de configuração do funil, dos motivos e das etapas de serviço, e a lista de serviços;
  - seção "Serviços" na ficha do produtor.
- **Fora de escopo:**
  - painéis e fila de prioridades (SPEC-3-005);
  - produtor nas duas empresas e importação da planilha (SPEC-3-006);
  - contrato, RDV e parte administrativa (fase 4);
  - sugestão por IA (fase 5);
  - envio de proposta ao produtor por qualquer canal;
  - cálculo de imposto ou cobrança das parcelas.
- **Entradas e pré-condições:**
  - fase 2 no ar;
  - SPEC-3-001 aplicada;
  - sistema visual da SPEC-3-002 no ar. Se ainda não estiver, construa as telas com os componentes da SPEC-3-002 assim que existirem e registre a pendência.
- **Saídas/artefatos:** migrações, hooks, rotas, telas e evidências em `05_entregas/fase-3/spec-3-004/`.
- **Dependências e responsáveis:** a Agrospy executa com o Maestro. A planilha CL-001 é só referência de nomes e não trava.
- **Atores e permissões mínimas:** conforme a tabela de acesso desta SPEC. O Operador nunca vê valores de proposta nem a condição negociada.
- **Superfícies/arquivos/configurações afetadas:**
  - `pocketbase/migrations/` (novas a partir da próxima numeração livre);
  - `pocketbase/hooks/oportunidades_hooks.js`, `proxima_acao_vigente.js`, `propostas_hooks.js` (novo), `funil_rotas.js` (novo), `servicos_rotas.js` (novo) e `empresas_padroes.js` (novo, padrões para empresa nova);
  - `pocketbase/hooks/lib/funil.js` (novo);
  - `src/services/oportunidades.ts`, `funil.ts` (novo) e `servicos.ts` (novo);
  - telas `src/pages/Oportunidade.tsx`, `ConfigFunil.tsx`, `ConfigMotivos.tsx`, `ConfigEtapasServico.tsx` e `Servicos.tsx` (novas);
  - `src/pages/ProdutorFicha.tsx` (seção "Serviços" e atalho para a oportunidade);
  - `src/App.tsx`, só as rotas novas (`/oportunidades/:id`, `/servicos`, `/config/funil`, `/config/motivos` e `/config/etapas-servico`);
  - `src/components/app/navegacao.ts`, só as linhas "Serviços" e "Configurações comerciais" da tabela "Navegação por perfil" da SPEC-3-002, e o `tools/tests/navegacao_esperada.json` correspondente;
  - `src/views/` (views sem acesso a dados das telas novas, usadas pela página e pela vitrine) e `src/fixtures/vitrine.ts`.
- **Risco e plano B:**
  - **Hook de próxima ação:** o hook da fase 1 pode recusar fechar uma oportunidade com data passada. Por isso a regra de próxima ação passa a valer só para `situacao = aberta` (RN-63).
  - **Arquivo da proposta:** se falhar, a proposta é gravada sem arquivo e a tela avisa.
- **Rollback ou reversão:** esconder os botões novos na tela. As coleções novas ficam sem uso. Os campos novos de `oportunidades` são aditivos e a carteira da fase 1 continua lendo `situacao = aberta`. Nenhuma migração apaga dado.

## Dados e integrações

| Coleção | Campos (tipo) | Regras de API (list/view · create/update · delete) |
|---|---|---|
| `etapas_funil` | `empresa` (rel), `nome` (texto 1–60), `ordem` (número ≥ 1), `ativa` (bool), `marca_proposta` (bool), `created`/`updated` | `acesso_empresas` · `acesso_admin` da empresa · null |
| `motivos_desfecho` | `empresa`, `tipo` (`perdida` \| `nao_prioritaria`), `nome` (1–80), `exige_texto` (bool), `ativo` (bool), `ordem` | `acesso_empresas` · `acesso_admin` · null |
| `oportunidades` (campos novos) | `etapa` (rel `etapas_funil`), `situacao` (valores `aberta`, `ganha`, `perdida`, `nao_prioritaria`), `valor_estimado` (número ≥ 0, opcional), `encerrada_em` (data), `motivo_desfecho` (rel), `motivo_texto` (texto ≤ 500), `reavaliar_em` (data, só não prioritária) | regras da fase 1. O hook trava `etapa`, `situacao`, `encerrada_em`, `motivo_*` e `reavaliar_em` na API comum, na criação e na alteração (RN-62) |
| `acoes_oportunidade` (campos novos) | `tipo` ganha os valores `etapa_alterada`, `proposta_registrada`, `ganha`, `perdida`, `nao_prioritaria` e `reaberta`; `nova_acao` e `nova_data` deixam de ser obrigatórios no esquema (o hook continua exigindo nos tipos da fase 1); `etapa_de_nome`, `etapa_para_nome` (texto) e `detalhe` (texto ≤ 2000) | regras da fase 1. O hook recusa na API comum os tipos novos, que só o servidor grava (RN-62) |
| `propostas` | `empresa`, `oportunidade` (rel), `versao` (número), `valor` (número > 0), `validade` (data), `descricao` (texto ≤ 2000), `arquivo` (arquivo protegido, pdf/jpg/png/docx, ≤ 10 MB), `status` (`vigente` \| `substituida` \| `aceita` \| `recusada`), `registrado_por`, `created` | view: quem vê a oportunidade, menos Operador · create: quem pode alterar a oportunidade; o hook calcula `versao`, `status` e `empresa` e ignora esses campos no corpo (RN-68) · update/delete: null |
| `condicoes_negociadas` | `empresa`, `oportunidade` (rel), `produtor`, `linha_negocio`, `produto_servico` (texto 1–500), `valor_total` (> 0), `entrada_valor` (≥ 0), `entrada_data` (data), `parcelas` (JSON: lista de `{numero, valor, vencimento}`, 0–60 itens), `forma_pagamento` (`pix` \| `boleto` \| `transferencia` \| `cheque` \| `cartao` \| `permuta_grao` \| `outro`), `observacoes` (≤ 2000), `proposta` (rel opcional), `registrado_por`, `cancelada` (bool), `created` | view: quem vê a oportunidade, menos Operador · create/update/delete: null (só a rota) |
| `etapas_servico` | `empresa`, `nome` (1–60), `ordem` (número ≥ 0), `ativa` (bool) | `acesso_empresas` · `acesso_admin` · null |
| `servicos` | `empresa`, `produtor` (req), `propriedade` (opcional, do mesmo produtor), `linha_negocio` (req), `oportunidade` (opcional, ganha), `safra` (texto 4–20, ex. "2026/27"), `talhoes` (texto ≤ 500), `etapa_atual` (rel `etapas_servico`), `etapa_atual_em` (data), `proxima_etapa_prevista` (data opcional), `janela_prevista` (texto ≤ 120, ex. "após a colheita da soja"), `situacao` (`em_andamento` \| `concluido` \| `cancelado`), `observacoes`, `lote_importacao` (texto, usado pela SPEC-3-006), `criado_por`, `created`/`updated` | `acesso_empresas` · create/update: null (só as rotas) · null |
| `eventos_servico` | `empresa`, `servico`, `etapa_de_nome`, `etapa_para_nome`, `data` (data), `observacao` (≤ 1000), `registrado_por`, `created` | `acesso_empresas` · null · null (só a rota grava; só inclusão) |

| Rota | Quem | Entrada | Efeito (numa transação) | Erros |
|---|---|---|---|---|
| `POST /backend/v1/oportunidades/{id}/etapa` | Administrador e Gestão da empresa, ou o responsável Comercial | `{etapa, observacao?}` | troca `etapa` e grava ação `etapa_alterada` com os nomes de/para | 403 sem permissão; 404 de outra empresa; 409 oportunidade encerrada; 400 etapa inativa ou de outra empresa; mesma etapa: 200 sem nova ação |
| `POST /backend/v1/oportunidades/{id}/desfecho` | idem | `{tipo, motivo?, motivo_texto?, reavaliar_em?, proposta_aceita?, condicao?, criar_servico?}` | grava `situacao`, `encerrada_em`, motivo e ação. No ganho: cria `condicoes_negociadas`, marca a proposta aceita e as outras vigentes como recusadas, põe o produtor como `cliente` e, se `criar_servico`, cria o serviço na etapa de menor ordem | 400 com a mensagem da regra violada (RN-64 a RN-67); 409 já encerrada |
| `POST /backend/v1/oportunidades/{id}/reabrir` | Administrador e Gestão | `{motivo_texto, nova_acao, nova_data}` | `situacao = aberta`, volta para a etapa que tinha, marca a condição negociada como `cancelada` e grava a ação `reaberta` | 403 Comercial; 400 sem texto ou data passada |
| `POST /backend/v1/servicos` | Administrador, Gestão e Operador da empresa | `{produtor, propriedade?, linha_negocio, safra, talhoes?, oportunidade?, proxima_etapa_prevista?, janela_prevista?}` | cria o serviço na etapa de menor ordem e grava o primeiro evento | 403 Comercial; 400 propriedade de outro produtor ou linha de outra empresa |
| `POST /backend/v1/servicos/{id}/etapa` | Administrador, Gestão e Operador | `{etapa, data, observacao?, concluir?}` | troca a etapa e grava o evento. `concluir` marca `situacao = concluido` | 400 ao voltar de etapa sem observação; 400 com data no futuro |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-60 | oportunidade criada (app, rascunho ou visita) sem `etapa` | o hook põe a etapa ativa de menor ordem da empresa | empresa sem etapa ativa: 400 "Configure o funil" (a migração e o hook de empresa nova criam as padrão) | esta SPEC |
| RN-61 | Administrador desativa uma etapa | recusa enquanto houver oportunidade aberta nela ("Mova as N oportunidades antes"). Precisa sobrar ao menos uma etapa ativa. Só uma etapa por empresa marca proposta | renomear e reordenar são livres | esta SPEC |
| RN-62 | API comum de `oportunidades` (criação ou alteração) ou criação de ação de tipo novo | **Na criação:** o hook põe `situacao = aberta` e a etapa da RN-60. Se o corpo trouxer `situacao` diferente de `aberta`, `encerrada_em`, `motivo_*`, `reavaliar_em` ou `etapa` inativa ou de outra empresa, responde 400 "Use os botões da oportunidade". **Na alteração:** qualquer mudança nesses campos dá o mesmo 400. **Ação de tipo novo** pela API comum: 400 | as rotas usam `$app.save` | esta SPEC |
| RN-63 | regra de próxima ação vigente (fase 1) | vale só para `situacao = aberta` | — | fase 1, RN-19 |
| RN-64 | desfecho `perdida` ou `nao_prioritaria` | exige motivo ativo do mesmo tipo e da mesma empresa. Motivo com `exige_texto` pede `motivo_texto` (≥ 5 caracteres) | — | RQ-011; escopo, fase 3 |
| RN-65 | desfecho `ganha` | exige `condicao` com `produto_servico` e `valor_total > 0` | — | RQ-011 |
| RN-66 | condição negociada | `entrada_valor + soma(parcelas.valor)` igual a `valor_total`, com tolerância de R$ 0,01. Sem parcelas, a entrada é o valor total (à vista). Parcelas numeradas de 1 a N com vencimento crescente | — | RQ-011; "pagamentos espaçados" |
| RN-67 | `nao_prioritaria` com `reavaliar_em` | data de hoje em diante. O produtor volta para a fila de prioridades nessa data (SPEC-3-005) | sem data: não volta sozinho | esta SPEC |
| RN-68 | proposta registrada | o hook de criação de `propostas` calcula `versao` = última + 1, `status = vigente` e `empresa` = a da oportunidade, ignorando o que vier do cliente. A vigente anterior vira `substituida`. A ação `proposta_registrada` é gravada. Se a etapa atual tem ordem menor que a etapa que marca proposta, a oportunidade vai para ela (ação `etapa_alterada`) | oportunidade encerrada: 409 | esta SPEC |
| RN-69 | proposta vencida | `status = vigente` e `validade` < hoje (Brasília) aparece como "vencida" na tela. O status gravado não muda | — | esta SPEC |
| RN-70 | ganho | o produtor fica com `status_comercial = cliente`. A oportunidade sai da carteira e dos avisos, que já filtram `aberta` | — | escopo, classificação da fase 2 |
| RN-71 | etapa do serviço | avançar é livre. Voltar exige observação. A data não pode ser futura. Cada troca gera um evento só de inclusão, com o nome das etapas | — | CL-001; escopo "marcos coleta, análise, relatório, entrega e recoleta" |

## Fluxo e regras

1. A migração cria as coleções, os campos novos e as etapas, os motivos e as etapas de serviço padrão em todas as empresas existentes. O hook de empresa nova cria os mesmos padrões em empresa criada depois. Toda oportunidade aberta sem etapa recebe a etapa de ordem 1.
2. Na tela da oportunidade (`/oportunidades/:id`) aparecem:
   - a trilha de etapas;
   - o valor estimado;
   - a próxima ação;
   - as propostas, com a versão, o valor, a validade, a situação (vencida em destaque) e o arquivo;
   - o histórico completo;
   - os botões "Mudar etapa", "Registrar proposta", "Fechar venda", "Perdi", "Não é prioridade agora" e, para Gestão e Administrador, "Reabrir".
3. "Registrar proposta" abre uma folha com valor, validade, descrição e arquivo, e grava pela API de `propostas` (RN-68).
4. "Fechar venda" abre uma folha em 2 passos:
   1. produto/serviço, valor total, forma de pagamento e proposta aceita, que vem preenchida com a vigente;
   2. entrada e parcelas. A tela soma e mostra a diferença em tempo real, e só habilita "Confirmar" quando a soma bate (RN-66).

   No fim, pergunta "Criar o serviço técnico agora?".
5. "Perdi" e "Não é prioridade agora" abrem uma folha com a lista de motivos ativos do tipo, o texto quando exigido e, na não prioritária, a data opcional "Rever em".
6. Configurações (só Administrador):
   - `/config/funil`: etapas com arrastar ou setas para ordenar, renomear, ativar e desativar, e marcar a etapa da proposta;
   - `/config/motivos`;
   - `/config/etapas-servico`.
7. `/servicos` lista os serviços da empresa ativa. As pílulas filtram por etapa e por situação. Cada item mostra produtor, propriedade, safra, etapa atual com a data e a próxima etapa prevista. "Avançar etapa" abre a folha da rota de etapa do serviço.
8. A ficha do produtor ganha a seção "Serviços", com os serviços dele e a etapa de cada um, e cada oportunidade abre a tela da oportunidade.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | oportunidade aberta em "Necessidade reconhecida" | proposta → "Proposta apresentada" → ganho com entrada e 2 parcelas → produtor `cliente` → serviço na etapa 0 | — |
| Limite | soma das parcelas difere do total em R$ 0,02 | "Confirmar" desabilitado. Pela API, 400 RN-66 | corrigir os valores |
| Limite | etapa renomeada depois de uma mudança | o histórico antigo mostra o nome antigo | — |
| Falha | Comercial tenta fechar oportunidade de outro vendedor | 403 | — |
| Falha | PATCH em `situacao` pela API comum | 400 RN-62 | usar a rota |
| Falha | desativar etapa com oportunidades abertas | 400 com a contagem | mover as oportunidades antes |
| Falha | usuário da Rumo Agro chama a rota numa oportunidade da Agrospy | 404 | — |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; as migrações e os hooks de `oportunidades`, `acoes_oportunidade`, `visitas` e `produtores` (`0022`, `0024`, `0035`, `proxima_acao_vigente.js`, `oportunidades_hooks.js`); `src/services/oportunidades.ts` e `carteira.ts`; a rotina de avisos da fase 2; o guia de hooks e rotas do Skip.
2. **Contexto técnico do Skip (PocketBase v0.36 em goja):**
   - migrações só rodam no publish;
   - o diretório é `pocketbase/`;
   - Brasília é UTC−3 fixo, e o runtime não tem `Intl`;
   - não declare funções no topo do arquivo: use `require(\`${__hooks}/lib/funil.js\`)` dentro do handler;
   - rotas com `routerAdd` e `$apis.requireAuth()`; leia o corpo com `e.requestInfo().body`;
   - grave em transação com `$app.runInTransaction((txApp) => { ... })`;
   - `$app.save` não passa pelas regras de API;
   - `e.record.original()` não existe: leia o estado anterior com `$app.findRecordById`;
   - para descobrir o perfil do usuário na empresa, consulte `vinculos` (`usuario`, `empresa`, `ativo = true`), porque não existe `acesso_operador`;
   - adicionar valor a um campo `select` e tornar um campo não obrigatório são mudanças aditivas. Nunca troque o tipo de um campo existente;
   - log nunca leva nome do produtor, valor nem texto livre.
3. **Alterar somente:** as superfícies listadas em "Limites e dependências".
4. **Não alterar:**
   - as regras de visibilidade da fase 1;
   - a fila de rascunhos, os avisos e o assistente da fase 2, salvo a regra de que oportunidade encerrada não gera aviso, se ainda não existir;
   - registros antigos de `acoes_oportunidade` (só inclusão).
5. **Executar nesta ordem** (a mesma da tabela de tasks):
   1. migração das etapas, dos motivos e das etapas de serviço padrão em todas as empresas, o hook de empresa nova, a etapa nas oportunidades abertas (RN-60, RN-61) e a tela `/config/funil` (task "Configurar as etapas do funil de cada empresa");
   2. travas da API comum na criação e na alteração (RN-62), RN-63, rota de etapa e tela da oportunidade com trilha e histórico (task "Mudar a etapa da oportunidade com histórico");
   3. propostas (task "Registrar o orçamento ou a proposta na oportunidade");
   4. desfecho com condição negociada (task "Fechar a venda com a condição negociada");
   5. perda, não prioritária, reabrir e a tela `/config/motivos` (task "Registrar perda ou não prioritária com motivo");
   6. serviços e eventos, a tela `/config/etapas-servico`, a tela `/servicos` e a seção na ficha (task "Acompanhar as etapas do serviço técnico contratado");
   7. regressão e provas visuais, dentro da última task.
6. **Parar e pedir validação quando:** o upload de arquivo em `propostas` não funcionar como arquivo protegido. Nesse caso, grave sem arquivo, registre e siga. Nenhuma outra parada: decisões abertas já têm padrão nesta SPEC.
7. **Estado válido ao parar:** a carteira, os avisos, os rascunhos e o assistente funcionam. Oportunidades abertas continuam abertas e com etapa.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

As telas novas usam o sistema visual da SPEC-3-002, com os componentes de `src/components/app/`. Cor em hex só em `src/lib/cores.ts`.

- **Oportunidade:**
  - `AppShell` com `CabecalhoTela` (título "Oportunidade", `subtitulo` com o nome do produtor e voltar);
  - `CartaoDestaque` com a etapa atual, o valor estimado e a próxima ação;
  - trilha de etapas com `FiltroPilulas` `somenteLeitura`, com a atual em destaque;
  - `Selo` para vigente, vencida, aceita, substituída, ganha, perdida e não prioritária;
  - propostas e histórico como `ListaItem` com ícone em círculo;
  - ações em `BotaoPrimario` ("Fechar venda") e `BotaoSecundario`;
  - formulários em `Folha` com `lado="lateral"`: sobe de baixo no celular e vira painel lateral de 440px no computador, pelo contrato da SPEC-3-002.
- **Configurações:** `Cartao` com `ListaItem` ordenáveis e `Selo` "marca proposta".
- **Navegação:** os itens "Serviços" e "Configurações comerciais" seguem a tabela "Navegação por perfil" da SPEC-3-002 (perfis e lugar no celular e no computador).
- **Serviços:**
  - `FiltroPilulas` por etapa;
  - `ListaItem` com `Selo` da etapa;
  - `MiniPontos` com `niveis = 1` e `serie` de 6 valores (1 até a etapa atual e 0 depois), mostrando a posição de 0 a 5.
- **Estados:**
  - carregando: `Esqueleto`;
  - vazio: `EstadoVazio` ("Nenhuma proposta ainda", "Nenhum serviço nesta etapa");
  - erro: `EstadoErro` com "Tentar de novo";
  - sem internet: `AvisoTopo` "Sem conexão: as mudanças de etapa e o fechamento pedem internet", com os botões desabilitados.
- **Vitrine `/vitrine`:** inclui uma oportunidade fictícia com 2 propostas, um ganho com 2 parcelas e um serviço na etapa 2.

## Checklist de execução

- [ ] Etapas, motivos e etapas de serviço padrão em todas as empresas, mais o hook de empresa nova; oportunidades abertas com etapa.
- [ ] Travas RN-62 e RN-63 ativas.
- [ ] Rotas de etapa, desfecho, reabertura, serviço e etapa do serviço com as permissões da tabela de acesso desta SPEC.
- [ ] Telas da oportunidade, das configurações e de serviços, e a seção na ficha.
- [ ] Caminhos principal, limite e falha exercitados (tabela de cenários).
- [ ] Vitrine, capturas em 390×844 e 1280×800 e axe-core.
- [ ] Evidências em `05_entregas/fase-3/spec-3-004/`.

## Critérios de aceite

- [ ] **CA-3-18:**
  - todas as empresas têm as 4 etapas padrão, uma empresa criada depois recebe os padrões pelo hook, e cada empresa configura as próprias sem afetar a outra;
  - toda oportunidade aberta tem etapa;
  - mudar de etapa grava `etapa_alterada` com os nomes de/para;
  - renomear a etapa não muda o histórico;
  - desativar etapa com oportunidade aberta é recusado.
- [ ] **CA-3-19:**
  - registrar proposta grava a versão, o valor, a validade e o arquivo opcional;
  - a vigente anterior vira `substituida`;
  - a oportunidade vai para "Proposta apresentada" quando estava antes dela;
  - a proposta com validade vencida aparece como "vencida".
- [ ] **CA-3-20:**
  - ganho sem condição negociada, ou com soma diferente do total, é recusado;
  - o ganho válido cria `condicoes_negociadas` com entrada e parcelas, marca a proposta aceita e põe o produtor como `cliente`;
  - a oportunidade some da carteira e dos avisos do dia seguinte.
- [ ] **CA-3-21:**
  - perda e não prioritária sem motivo são recusadas, e o motivo "Outro" exige texto;
  - o desfecho aparece no histórico com autor e data;
  - só Gestão e Administrador reabrem, com texto e próxima ação. A reabertura volta para a etapa anterior e marca a condição negociada como cancelada.
- [ ] **CA-3-22:**
  - Administrador, Gestão e Operador criam o serviço e avançam a etapa, com evento de data e autor;
  - o Comercial só vê;
  - voltar de etapa sem observação é recusado;
  - a ficha do produtor mostra os serviços com a etapa atual.
- [ ] **CA-3-23:**
  - nenhuma rota nem coleção nova devolve dado de outra empresa (404 ou lista vazia);
  - o Operador não vê proposta nem condição;
  - a API comum não grava os campos travados, nem na criação nem na alteração, e não escolhe `versao`, `status` nem `empresa` da proposta;
  - a regressão da carteira, dos avisos, dos rascunhos e do assistente passa sem divergência;
  - as telas passam nas provas visuais.

## TDD da SPEC

**Empresas nas provas (SPEC-3-001):** toda prova desta SPEC roda nas empresas de teste. Onde a prova diz "Agrospy", use a "Teste A"; onde diz "Rumo Agro", use a "Teste B". Os usuários `teste.*` têm vínculo só com elas, e nada de teste é gravado na Agrospy ou na Rumo Agro reais.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | trava (CA-3-23) | com o token de `teste.comercial1`, PATCH `situacao = ganha` numa oportunidade própria | antes da trava: 200 (falha esperada); depois: 400 RN-62 | respostas da API |
| RED 2 | ganho sem condição (CA-3-20) | POST desfecho `{tipo: ganha}` sem `condicao` | antes da rota: inexistente; depois: 400 RN-65 | resposta |
| RED 3 | trava na criação (CA-3-23) | com o token de `teste.comercial1`: POST em `oportunidades` com `situacao = ganha`; POST com `etapa` da Teste B; POST em `propostas` com `versao = 99`, `status = aceita` e `empresa` = Teste B | antes do hook: gravados como vieram (falha esperada); depois: 400, 400 e a proposta gravada com a versão calculada, `vigente` e a empresa da oportunidade | respostas + consultas |
| GREEN 1 | etapas (CA-3-18) | listar `etapas_funil` da Teste A e da Teste B; criar a empresa "TESTE — Empresa Nova" com o superusuário e listar as etapas, os motivos e as etapas de serviço dela; mudar a oportunidade de teste para a ordem 2; renomear a etapa 2 (como `teste.admin.a`) e listar as ações | 4 etapas em cada empresa, inclusive na nova; ação com o nome antigo preservado | consultas |
| GREEN 2 | proposta (CA-3-19) | criar 2 propostas na oportunidade de teste (a 2ª com validade de ontem) | v1 `substituida`, v2 `vigente` exibida como vencida; etapa "Proposta apresentada" | consultas + print |
| GREEN 3 | ganho (CA-3-20) | desfecho ganha: total 48000, entrada 8000 e 2 parcelas de 20000 em datas crescentes, com `criar_servico: true` | condição gravada; proposta aceita; produtor `cliente`; serviço na etapa 0; oportunidade fora da carteira | consultas + print |
| GREEN 4 | perda e reabrir (CA-3-21) | perdida com "Outro" sem texto (400) e com texto (200); reabrir como `teste.comercial1` (403) e como `teste.gestao` (200) | conforme RN-64 e reabertura | respostas + consultas |
| GREEN 5 | serviço (CA-3-22) | Operador avança 0→1→2; tenta voltar 2→1 sem observação (400) e com observação (200); Comercial tenta avançar (403) | eventos com nomes e autor | consultas |
| REFACTOR/REGRESSÃO | isolamento, regressão e visual (CA-3-23) | (a) `teste.rumo` (só Teste B) chama as 5 rotas com IDs da Teste A; (b) `teste.operador` lista `propostas` e `condicoes_negociadas`; (c) rotina de avisos com a oportunidade ganha; (d) carteira, rascunho confirmado e pergunta ao assistente; (e) desativar etapa ocupada; (f) capturas em 390×844 e 1280×800 de `/oportunidades/:id`, `/servicos` e `/config/funil`, com verificação de rolagem horizontal = 0 e axe-core | (a) 404; (b) 0 itens; (c) sem aviso; (d) sem divergência; (e) 400; (f) sem rolagem e sem falha séria ou crítica | respostas, consultas, capturas e relatório do axe |

**Dados/fixtures:**
- produtor "TESTE — Produtor F3" com propriedade de teste na Teste A;
- uma oportunidade aberta de teste na Teste A, com responsável `teste.comercial1`;
- usuários do elenco da SPEC-3-001:
  - `teste.comercial1`;
  - `teste.gestao`;
  - `teste.admin.a`, que configura o funil da Teste A;
  - `teste.operador`;
  - `teste.rumo`, só da Teste B, para o isolamento;
- a empresa "TESTE — Empresa Nova", criada na prova do hook e removida pela migração de limpeza com o que o hook criou;
- PDF de teste de 1 página, sem dado real.

**Caminhos de erro obrigatórios:** sem permissão, outra empresa, campo travado, soma divergente, motivo ausente, etapa inativa, oportunidade já encerrada, sem internet, arquivo acima de 10 MB.

**Evidência exigida:** respostas da API, consultas, capturas e relatório do axe em `05_entregas/fase-3/spec-3-004/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-3/spec-3-004/` e o log do Skip. Etapas, motivos e etapas de serviço são padrões desta SPEC: o Administrador ajusta na tela, sem travar a construção.

## Handoff e operação

- **Como demonstrar:** oportunidade → proposta → fechar venda com parcelas → criar serviço → avançar a etapa do serviço.
- **Como operar depois:** o Administrador ajusta etapas e motivos em Configurações. O vendedor muda a etapa e fecha pela tela da oportunidade. O técnico avança o serviço em "Serviços".
- **Como monitorar:** oportunidades paradas na mesma etapa há mais de 60 dias e propostas vencidas (painel da SPEC-3-005).
- **Pendência conhecida:**
  - nomes das etapas do serviço a confirmar com a planilha CL-001, quando chegar;
  - funil e motivos definitivos (CL-PEND-006) ajustáveis na tela.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Acompanhar a oportunidade até o fechamento | Agrospy | SPEC-3-004 | CA-3-18 a CA-3-23 | todas as subtasks | evidências das subtasks | SPEC-3-001 aplicada |
| id pendente | Configurar as etapas do funil de cada empresa | Agrospy | SPEC-3-004 | CA-3-18 | GREEN 1 (padrões, hook e configuração) + REFACTOR (e) | consultas + print de `/config/funil` | SPEC-3-002 no ar |
| id pendente | Mudar a etapa da oportunidade com histórico | Agrospy | SPEC-3-004 | CA-3-18, CA-3-23 | RED 1 e RED 3 → GREEN 1 (mudança e renome) | respostas + consultas | etapas configuradas |
| id pendente | Registrar o orçamento ou a proposta na oportunidade | Agrospy | SPEC-3-004 | CA-3-19 | GREEN 2 | consultas + print | mudança de etapa |
| id pendente | Fechar a venda com a condição negociada | Agrospy | SPEC-3-004 | CA-3-20 | RED 2 → GREEN 3 + REFACTOR (c) | consultas + print | propostas |
| id pendente | Registrar perda ou não prioritária com motivo | Agrospy | SPEC-3-004 | CA-3-21 | GREEN 4 | respostas + consultas | fechamento de venda |
| id pendente | Acompanhar as etapas do serviço técnico contratado | Agrospy | SPEC-3-004 | CA-3-22, CA-3-23 | GREEN 5 + REFACTOR (a)(b)(d)(f) | consultas, capturas e axe | ganho com `criar_servico` |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
