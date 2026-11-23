# SPEC-3-006 — Produtor atendido pelas duas empresas e importação da carteira pela planilha

**Fase:** 3
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** RQ-003; P2 ("relações entre clientes dos tenants são explícitas e autorizadas"); Fase 3, capacidades "vínculo explícito de produtor entre as empresas" e "importação da carteira da planilha"; CL-PEND-003; CL-001
**Degrau da solução:** nativo da plataforma + construção mínima:
- **Nativo:** coleções e rotas do Skip;
- **Construção:** a relação entre produtores das duas empresas e um importador com prévia, relatório e desfazer.

## Contexto e decisões fechadas

- **Estado atual:**
  - **Cadastros separados:** cada empresa tem os próprios produtores (o campo `empresa` nunca muda). O mesmo produtor atendido pela Agrospy e pela Rumo Agro existe como dois cadastros sem ligação, e quem acessa as duas empresas não tem como ir de um para o outro.
  - **Carteira fora do sistema:** está em planilhas. A planilha de etapas de serviço (CL-001) ainda não foi compartilhada. As outras planilhas do Diogo (cadastro, faturamento, fluxo de caixa) não fazem parte desta SPEC.
- **Estado desejado:**
  - **Relação entre empresas:** quem é Administrador das duas empresas relaciona o cadastro da Agrospy ao da Rumo Agro. Quem acessa as duas vê o selo "Também na Rumo Agro" (ou "Também na Agrospy") e troca de um para o outro com um toque. Cada lado continua mostrando só o próprio histórico. Quem acessa uma empresa só não vê nada da outra.
  - **Importação:** o Administrador importa a carteira por um arquivo. Antes de gravar, vê a prévia com o que será criado, o que já existe e o que foi recusado, com motivo. Depois pode desfazer o lote inteiro.
- **Decisões já fechadas:**
  - **Relação, não fusão:** os dois cadastros continuam separados, com históricos separados (P2; RQ-003). A relação é um registro próprio, que só o servidor grava. Cada produtor tem no máximo uma relação ativa com a outra empresa.
  - **Quem relaciona e desfaz:** só quem tem o perfil Administrador nas duas empresas (CL-PEND-003, regra recomendada no escopo).
  - **Quem vê a relação:** só quem tem acesso às duas empresas. Para os outros, a relação não existe (lista vazia e 404).
  - **Importação por empresa:** o arquivo entra sempre na empresa ativa e nunca cria nada na outra.
  - **Modelo de arquivo padrão desta SPEC:** usado enquanto a planilha CL-001 não chega. Colunas na tabela "Modelo do arquivo". Quando a planilha real chegar, o Maestro só acrescenta os nomes de coluna dela na tabela de sinônimos, sem mudar as regras.
  - **Produtor existente nunca é alterado pela importação:** ela só cria. Produtor já existente recebe apenas a propriedade e o serviço novos.
  - **Formatos:**
    - CSV (separador `;` ou `,`, em UTF-8 ou no padrão do Excel no Brasil, windows-1252);
    - XLSX, lido no navegador pela biblioteca `read-excel-file` (primeira aba).

    Limites: 5 MB e 2.000 linhas de dados.
- **Bloqueios:** nenhum. CL-001 não trava: o modelo vale até a planilha real chegar.

## Resultado observável

- **Relação entre empresas:**
  1. O Diogo abre "Produtores em comum" e vê 3 pares sugeridos (mesmo CPF ou mesmo nome no mesmo município).
  2. Ele toca em "Relacionar" num deles.
  3. Na ficha do produtor na Agrospy aparece "Também na Rumo Agro". Ao tocar, o app troca para a Rumo Agro e abre o cadastro de lá, com os projetos de automação daquele produtor. Nada da Agrospy aparece misturado.
  4. O Alisson, que só acessa a Agrospy, não vê selo nenhum.
- **Importação:**
  1. Em "Importar carteira", o Diogo baixa o modelo, preenche e envia o arquivo.
  2. A prévia mostra "38 novos, 7 já cadastrados, 3 recusados". As linhas recusadas trazem o motivo: "linha 12: município vazio".
  3. Ele toca em "Importar 45 linhas", e os produtores entram com propriedade e serviço na etapa certa.
  4. No dia seguinte, ele percebe que usou o arquivo errado e toca em "Desfazer". O lote sai, menos os 2 produtores que já tinham visita registrada, que ficam listados.

## Limites e dependências

- **Inclui:**
  - coleção `produtores_relacionados` e as rotas de relacionar, desfazer e sugerir;
  - selo e troca na ficha;
  - tela "Produtores em comum";
  - coleção `importacoes` e as rotas de prévia, aplicar e desfazer;
  - tela "Importar carteira" com o modelo para baixar;
  - campo `lote_importacao` em `produtores` e `propriedades`. Em `servicos`, o campo já vem da SPEC-3-004.
- **Fora de escopo:**
  - fundir dois cadastros;
  - copiar histórico de uma empresa para a outra;
  - relacionar produtores da mesma empresa (duplicidade interna);
  - importar visitas, oportunidades ou valores;
  - importar planilhas financeiras, de faturamento ou de fluxo de caixa (fase 4 e parte administrativa);
  - atualizar em lote um produtor existente;
  - importação automática periódica.
- **Entradas e pré-condições:**
  - SPEC-3-004 no ar (`etapas_servico` e `servicos`);
  - sistema visual da SPEC-3-002;
  - usuário de teste Administrador nas duas empresas de teste (SPEC-3-001).
- **Saídas/artefatos:**
  - migrações, hooks, rotas e telas;
  - `public/modelo-importacao-carteira.csv`;
  - fixtures em `05_entregas/fase-3/fixtures/`;
  - evidências em `05_entregas/fase-3/spec-3-006/`.
- **Dependências e responsáveis:** a Agrospy executa com o Maestro. O Diogo compartilha a planilha de etapas de serviço (CL-001) quando puder. O Maestro pede uma vez e segue.
- **Atores e permissões mínimas:**

  | Ação | Administrador das duas empresas | Administrador de uma empresa | Gestão | Comercial | Operador |
  |---|---|---|---|---|---|
  | Ver selo e trocar para o produtor relacionado | sim | se também acessa a outra empresa | se acessa as duas | se acessa as duas | se acessa as duas |
  | Relacionar, desfazer, ver sugestões | sim | não | não | não | não |
  | Importar, ver prévia e desfazer lote | sim, na empresa ativa | sim, na própria empresa | não | não | não |

- **Superfícies/arquivos/configurações afetadas:**
  - migrações de `produtores_relacionados` e `importacoes`, e `lote_importacao` em `produtores` e `propriedades`;
  - `pocketbase/hooks/relacao_rotas.js`, `importacao_rotas.js` e `lib/importacao.js` (novos);
  - `src/services/relacao.ts` e `importacao.ts` (novos);
  - telas `src/pages/ProdutoresEmComum.tsx` e `ImportarCarteira.tsx` (novas);
  - `src/pages/ProdutorFicha.tsx` (selo e troca);
  - `public/modelo-importacao-carteira.csv`;
  - dependência `read-excel-file` no `package.json`;
  - `src/App.tsx`, só as rotas `/importar` e `/config/produtores-em-comum`;
  - `src/components/app/navegacao.ts` e `tools/tests/navegacao_esperada.json`, só as linhas "Importar carteira" e "Produtores em comum" da tabela "Navegação por perfil" da SPEC-3-002;
  - `src/views/` (views sem acesso a dados das telas novas) e `src/fixtures/vitrine.ts`.
- **Risco e plano B:**
  - **XLSX:** se `read-excel-file` não instalar ou não rodar no Skip, a tela aceita só CSV e explica "No Excel: Arquivo > Salvar como > CSV". Registre no changelog.
  - **Tempo:** se a prévia de 2.000 linhas passar do limite de tempo do Skip, a tela envia em blocos de 500 para a mesma importação (`importacoes` acumula o relatório) e só libera "Importar" no fim.
- **Rollback ou reversão:**
  - a relação se desfaz pela rota, e o histórico da relação fica;
  - o lote se desfaz pela rota;
  - esconder os itens do menu desliga a funcionalidade sem perda de dado.

## Dados e integrações

| Coleção | Campos (tipo) | Regras de API (list/view · create/update · delete) |
|---|---|---|
| `produtores_relacionados` | `empresa_a`, `produtor_a`, `empresa_b`, `produtor_b` (relações; o par é gravado com `empresa_a` = Agrospy e `empresa_b` = Rumo Agro, pela ordem do id da empresa), `ativo` (bool), `criado_por`, `desfeito_por`, `desfeito_em` (data), `motivo_desfazer` (texto 5–500), `created`/`updated` | list/view: `@request.auth.acesso_empresas.id ?= empresa_a && @request.auth.acesso_empresas.id ?= empresa_b` · create/update/delete: null (só rotas) |
| `importacoes` | `empresa`, `arquivo_nome` (≤ 200), `criado_por`, `status` (`previa` \| `aplicada` \| `desfeita` \| `expirada`), `total_linhas`, `novos`, `existentes`, `recusadas`, `servicos_novos` (números), `relatorio` (JSON por linha: `{linha, nome, municipio, acao, motivo?, produtor_id?, servico}`, sem documento, telefone ou e-mail), `relatorio_desfazer` (JSON), `aplicada_em`, `desfeita_em`, `created` | list/view: `acesso_admin` da empresa · create/update/delete: null (só rotas) |
| `produtores`, `propriedades` (campo novo) | `lote_importacao` (texto ≤ 30, id da importação) | regras da fase 1; o hook recusa `lote_importacao` vindo pela API comum |

| Rota | Quem | Entrada | Efeito | Erros |
|---|---|---|---|---|
| `POST /backend/v1/produtores/relacionar` | Administrador nas duas empresas | `{produtor_a, produtor_b}` | cria a relação ativa | 403 sem o perfil nas duas; 400 mesma empresa ou produtor arquivado; 409 algum dos dois já tem relação ativa |
| `POST /backend/v1/produtores/relacionados/{id}/desfazer` | idem | `{motivo}` | `ativo = false`, com autor, data e motivo | 403; 400 sem motivo; desfazer de novo: 200 sem mudança |
| `GET /backend/v1/produtores/possiveis-em-comum` | idem | — | até 100 pares sugeridos (RN-83), sem os já relacionados | 403 |
| `POST /backend/v1/importacoes/previa` | Administrador da empresa | `{empresa, arquivo_nome, linhas: [{...colunas do modelo}], importacao_id?}` (blocos de até 500 linhas) | valida (RN-85, RN-88) e grava `importacoes` em `previa` com o relatório. Não cria produtor, propriedade nem serviço | 403; 400 mais de 2.000 linhas no total ou empresa diferente da importação |
| `POST /backend/v1/importacoes/{id}/aplicar` | Administrador da empresa | — | numa transação, revalida e cria produtores, propriedades e serviços novos com `lote_importacao = id`. Status `aplicada` | 403; 409 `desfeita` ou `expirada`; já `aplicada`: 200 com o mesmo resumo e nada novo |
| `POST /backend/v1/importacoes/{id}/desfazer` | Administrador da empresa | — | apaga o que o lote criou sem atividade depois, mantém e lista o resto. Status `desfeita` | 403; 409 `previa`; já `desfeita`: 200 sem mudança |

**Modelo do arquivo** (cabeçalho na primeira linha; * = obrigatório):

| Coluna | Regra | Sinônimos aceitos no cabeçalho (sem acento e sem diferenciar maiúscula) |
|---|---|---|
| `produtor_nome`* | 2 a 200 caracteres | produtor, cliente, nome |
| `documento` | CPF ou CNPJ, 11 ou 14 dígitos (a pontuação é ignorada) | cpf, cnpj, cpf/cnpj |
| `telefone` | até 30 caracteres | telefone, celular, whatsapp |
| `email` | e-mail válido | e-mail, email |
| `municipio`* | até 120 caracteres | município, cidade |
| `responsavel_email` | e-mail de um usuário com vínculo ativo de Administrador, Gestão ou Comercial nesta empresa. Vazio = quem importa | responsável, vendedor |
| `status_comercial` | `potencial`, `nao_potencial` ou `cliente`. Vazio = sem classificação | classificação, status |
| `propriedade_nome` | até 200 | fazenda, propriedade |
| `propriedade_municipio` | até 120. Vazio = o município do produtor | município da fazenda |
| `area_ha` | número ≥ 0, com vírgula ou ponto | área, area (ha), hectares |
| `servico_linha` | nome de uma linha de negócio ativa da empresa. Obrigatória se houver `safra` ou `etapa_servico` | serviço, linha, linha de negócio |
| `safra` | 4 a 20 caracteres, ex.: 2026/27. Obrigatória se houver `servico_linha` | ciclo, safra |
| `talhoes` | até 500 | talhão, talhões |
| `etapa_servico` | número da ordem (0–5) ou nome de uma etapa de serviço ativa. Vazio = a de menor ordem | etapa, fase, status do serviço |
| `data_etapa` | dd/mm/aaaa, até hoje | data da etapa |
| `proxima_etapa_prevista` | dd/mm/aaaa | próxima etapa |
| `janela_prevista` | até 120 | janela, quando |
| `observacoes` | até 2000 | observações, obs |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-81 | relacionar ou desfazer | exige `acesso_admin` nas duas empresas. Os produtores precisam ser de empresas diferentes, não arquivados e sem relação ativa | — | P2; CL-PEND-003 |
| RN-82 | ficha e listas | cada ficha mostra só o histórico da própria empresa (visitas, oportunidades, propostas, serviços). O selo aparece só para quem acessa as duas empresas. Tocar nele troca a empresa ativa e abre o produtor relacionado | — | RQ-003 |
| RN-83 | sugestão de produtores em comum | pares entre as duas empresas com o mesmo `documento` (só dígitos, não vazio), ou com nome e município iguais depois de normalizar (minúsculas, sem acento, espaços únicos). Mesmo documento vem primeiro | — | esta SPEC |
| RN-84 | importar | só `acesso_admin` da empresa da importação. Tudo é gravado na empresa da importação | — | P2; P6 |
| RN-85 | produtor já existente | na mesma empresa: mesmo documento ou, sem documento, mesmo nome e município normalizados. Nesse caso a linha vira `produtor_existente` e o produtor não é alterado. Uma linha repetida dentro do arquivo vira o mesmo produtor da primeira ocorrência | nunca procura na outra empresa | CL-001 ("sem duplicar produtor") |
| RN-86 | aplicar | revalida cada linha na hora. A que ficou inválida vira recusada no resumo. Propriedade com o mesmo nome normalizado no mesmo produtor é reaproveitada. Serviço com o mesmo produtor, linha, safra e propriedade não é criado de novo (`ja_existe`). Aplicar duas vezes não cria nada. A prévia vale 24 h e depois vira `expirada` | — | esta SPEC |
| RN-87 | desfazer | apaga o que tem `lote_importacao = id` e não teve atividade depois da importação: visita, oportunidade, rascunho confirmado, evento de serviço além do inicial, relação entre empresas ou propriedade e serviço criados fora do lote. O que teve atividade fica e entra em `relatorio_desfazer` com o motivo | — | esta SPEC |
| RN-88 | validação da linha | aplica a coluna "Regra" do modelo. Linha totalmente vazia é ignorada e não conta. Cada recusa tem um motivo em português com o número da linha do arquivo (o cabeçalho é a linha 1) | — | esta SPEC |

## Fluxo e regras

1. **Produtores em comum** (`/config/produtores-em-comum`, só para quem é Administrador nas duas empresas):
   - lista dos pares sugeridos, com o motivo ("mesmo CPF/CNPJ" ou "mesmo nome e município") e "Relacionar";
   - lista das relações ativas, com "Desfazer" (pede o motivo numa folha).
2. **Ficha do produtor:** com relação visível, mostra no topo pílulas "Agrospy | Rumo Agro", com a empresa atual marcada. Tocar na outra troca a empresa ativa (mesma ação de `TrocaEmpresa`) e abre a ficha relacionada.
3. **Importar carteira** (`/importar`, Administrador da empresa ativa), em 3 passos:
   1. **Arquivo:** "Baixar modelo" e "Escolher arquivo". O navegador lê o arquivo e mapeia os cabeçalhos pelos sinônimos. Coluna obrigatória ausente: a tela para com "O arquivo não tem a coluna Município".
   2. **Prévia:**
      - números de novos, existentes e recusados;
      - pílulas para filtrar as linhas;
      - recusadas com a linha e o motivo;
      - "Baixar recusadas (CSV)";
      - "Importar N linhas".
   3. **Resultado:** resumo com produtores, propriedades e serviços criados, e o histórico das importações da empresa, com status e "Desfazer" (confirmação numa folha, com a contagem do que será apagado).
4. O Maestro pede uma vez ao Diogo a planilha de etapas de serviço (CL-001). Quando ela chegar, acrescenta os nomes de coluna dela na tabela de sinônimos e importa um arquivo de teste derivado dela, sem dados reais na evidência.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | Administrador das duas empresas relaciona um par sugerido | selo nas duas fichas para quem acessa as duas | — |
| Principal | arquivo com 12 linhas da fixture | prévia com 4 novos, 3 existentes e 5 recusadas; aplicar cria 4 produtores, as propriedades e os serviços | — |
| Limite | linha repetida no arquivo | a segunda vira o mesmo produtor da primeira | — |
| Limite | aplicar duas vezes | o segundo aplicar não cria nada | — |
| Falha | Administrador só da Agrospy tenta relacionar | 403 | — |
| Falha | Comercial abre `/importar` | sem item no menu; a rota dá 403 | — |
| Falha | arquivo com 2.500 linhas ou 6 MB | recusado antes da prévia, com a mensagem do limite | dividir o arquivo |
| Falha | desfazer depois de uma visita num produtor do lote | esse produtor fica e aparece no relatório do desfazer | — |
| Falha | sem internet | `AvisoTopo`; importar e relacionar pedem internet | — |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; a SPEC-3-004 (`etapas_servico` e `servicos`); as migrações e hooks de `produtores` e `propriedades` (`0011`, `0012`, `0013`, `0015`, `produtores_hooks.js`, incluindo a recusa de documento repetido e o responsável padrão); `src/pages/ProdutorFicha.tsx`; `src/services/empresas.ts` (troca de empresa); o guia de rotas e de arquivos do Skip.
2. **Contexto técnico do Skip (PocketBase v0.36 em goja):**
   - migrações só rodam no publish;
   - o diretório é `pocketbase/`;
   - o runtime não tem `Intl`, e Brasília é UTC−3 fixo;
   - não declare funções no topo do arquivo: use `require(\`${__hooks}/lib/importacao.js\`)` dentro do handler;
   - grave com `$app.runInTransaction`;
   - `$app.save` não passa pelas regras nem pelos hooks de request. Por isso a rota de aplicar repete as validações da fase 1 (documento repetido, responsável) pela mesma função da lib;
   - o perfil vem de `vinculos` ativos;
   - log sem nome, documento, telefone nem e-mail, só contagens e ids.
3. **Alterar somente:** as superfícies listadas em "Limites e dependências".
4. **Não alterar:**
   - registros existentes de `produtores` e `propriedades`, além de ler;
   - as regras de visibilidade da fase 1;
   - nada na outra empresa durante uma importação.
5. **Executar nesta ordem:**
   1. relação: coleção, rotas, sugestões e permissões (RN-81 a RN-83);
   2. selo e troca na ficha, e a tela de produtores em comum;
   3. `importacoes` e a rota de prévia com o leitor no navegador e o modelo;
   4. aplicar;
   5. desfazer;
   6. pedir a planilha CL-001 uma vez;
   7. provas visuais e limpeza das fixtures.
6. **Parar e pedir validação quando:** nenhuma parada prevista. A falta da planilha CL-001 não para: o modelo vale. A falta do XLSX segue o plano B.
7. **Estado válido ao parar:** cadastro, ficha e carteira funcionam como antes. Prévia não aplicada não grava nada.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

As telas usam o sistema visual da SPEC-3-002, com os componentes de `src/components/app/`. Cor em hex só em `src/lib/cores.ts`.

- **Ficha do produtor:**
  - `Selo` "Também na Rumo Agro" (ou "Também na Agrospy") ao lado do nome;
  - `FiltroPilulas` "Agrospy | Rumo Agro" para trocar, com a cor de cada empresa vindo do token da empresa ativa da SPEC-3-002.
- **Produtores em comum:**
  - `Cartao` com `ListaItem`: os dois nomes com o município, `Selo` com o motivo da sugestão e `BotaoSecundario` "Relacionar";
  - confirmação e motivo do desfazer numa `Folha`.
- **Importar carteira:**
  - passos com `FiltroPilulas` `somenteLeitura` (1 Arquivo, 2 Prévia, 3 Resultado);
  - `Cartao` de envio com `BotaoSecundario` "Baixar modelo" e `BotaoPrimario` "Escolher arquivo";
  - prévia com 3 `CartaoNumero` (novos, existentes, recusados) e `ListaItem` das recusadas com `Selo` "linha N";
  - `BotaoPrimario` "Importar N linhas";
  - histórico com `ListaItem` e `Selo` de status;
  - "Desfazer" com confirmação em `Folha` (nunca `window.confirm`).
- **Navegação:** "Importar carteira" e "Produtores em comum" seguem a tabela "Navegação por perfil" da SPEC-3-002.
- **Estados:** carregando com `Esqueleto` (com a contagem "lendo 1.200 linhas…"); vazio com `EstadoVazio` ("Nenhum par sugerido", "Nenhuma importação ainda"); erro com `EstadoErro`; sem internet com `AvisoTopo`.
- **Vitrine `/vitrine`:** inclui uma ficha com o selo, a lista de pares e a prévia de uma importação fictícia com recusadas.

## Checklist de execução

- [ ] Relação com permissões, sugestões e desfazer.
- [ ] Ficha com selo e troca; isolamento para quem acessa uma empresa só.
- [ ] Modelo, leitor de CSV (`;` e `,`, UTF-8 e windows-1252) e de XLSX (ou plano B registrado).
- [ ] Prévia sem gravação; aplicar sem duplicar e idempotente; desfazer com o relatório.
- [ ] Pedido da planilha CL-001 feito uma vez e registrado.
- [ ] Vitrine, capturas em 390×844 e 1280×800 e axe-core.
- [ ] Fixtures removidas; evidências em `05_entregas/fase-3/spec-3-006/`.

## Critérios de aceite

- [ ] **CA-3-30:**
  - o Administrador das duas empresas relaciona um produtor da Agrospy a um da Rumo Agro;
  - a ficha mostra o selo e troca a empresa ativa ao tocar, abrindo o cadastro relacionado com o histórico só daquela empresa;
  - a sugestão traz os pares por documento e por nome e município;
  - Administrador de uma empresa só recebe 403;
  - relacionar um produtor que já tem relação dá 409;
  - desfazer guarda autor, data e motivo.
- [ ] **CA-3-31:**
  - um usuário com acesso a uma empresa só lista 0 relações, recebe 404 ao buscar a relação pelo id e não vê selo nem dado da outra empresa na ficha;
  - nenhuma tela soma ou junta os históricos das duas empresas.
- [ ] **CA-3-32:**
  - a prévia da fixture de 12 linhas devolve exatamente 4 novos, 3 existentes e 5 recusadas, com a linha e o motivo de cada recusa;
  - nenhum produtor, propriedade ou serviço é gravado na prévia;
  - as versões CSV `;` em windows-1252, CSV `,` em UTF-8 e XLSX dão a mesma prévia (ou o XLSX segue o plano B registrado);
  - arquivo acima de 5 MB ou 2.000 linhas é recusado.
- [ ] **CA-3-33:**
  - aplicar cria só os 4 produtores novos com as propriedades e os serviços na etapa informada, com `lote_importacao`;
  - os 3 existentes ficam sem alteração;
  - nenhum produtor sai duplicado;
  - aplicar de novo não cria nada;
  - Gestão e Comercial recebem 403.
- [ ] **CA-3-34:**
  - desfazer apaga o que o lote criou sem atividade e mantém, listado em `relatorio_desfazer`, o produtor que recebeu visita depois;
  - desfazer de novo não muda nada;
  - nenhum dado da outra empresa nem anterior à importação é alterado.

## TDD da SPEC

**Empresas nas provas (SPEC-3-001):** toda prova desta SPEC roda nas empresas de teste. Onde a prova diz "Agrospy", use a "Teste A"; onde diz "Rumo Agro", use a "Teste B". Os usuários `teste.*` têm vínculo só com elas, e nada de teste é gravado na Agrospy ou na Rumo Agro reais.

**Fixtures** em `05_entregas/fase-3/fixtures/`, sem dado real:
- `importacao-teste.csv`, com 12 linhas, prefixo "TESTE —" e o mesmo conteúdo em três versões: `;` em windows-1252, `,` em UTF-8 e `.xlsx`. As linhas são:
  - 4 novas válidas, uma delas com serviço na etapa 2;
  - 1 que repete o documento de uma nova;
  - 2 que batem com produtores de teste já cadastrados, um por documento e outro por nome e município;
  - 5 inválidas: sem nome; município vazio; responsável sem vínculo; etapa "9"; data "31/02/2026";
- um arquivo com 2.500 linhas.

**Produtores de teste para a relação:**
- "TESTE — Produtor Comum" na Teste A e na Teste B, com o mesmo documento de teste;
- "TESTE — Mesmo Nome", no mesmo município, na Teste A e na Teste B.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | isolamento (CA-3-31) | criar a relação de teste por migração e listar como `teste.comercial1` (só Teste A), antes da regra de list/view | aparece (falha esperada); depois da regra, 0 itens e 404 | respostas |
| GREEN 1 | relacionar (CA-3-30) | sugestões como `teste.admin` (Administrador nas duas); relacionar "Produtor Comum"; relacionar de novo; relacionar como `teste.admin.a` (Administrador só da Teste A); desfazer sem motivo e com motivo | 2 pares sugeridos (documento primeiro); 200; 409; 403; 400; 200 com autor e data | respostas + print da ficha com o selo |
| GREEN 2 | troca e histórico (CA-3-30, CA-3-31) | com `teste.multi` (acesso às duas), abrir a ficha na Teste A e tocar no selo; com `teste.comercial1` (só Teste A), abrir a mesma ficha | troca para a Teste B com o histórico de lá; para o comercial1, sem selo | capturas |
| RED 2 | prévia não grava (CA-3-32) | contar produtores, propriedades e serviços; gerar a prévia da fixture; contar de novo | contagens iguais | consultas |
| GREEN 3 | prévia (CA-3-32) | prévia das 3 versões do arquivo; enviar o arquivo de 2.500 linhas | 4/3/5 com os motivos das 5 recusas nas três versões; o de 2.500 é recusado | respostas + print |
| GREEN 4 | aplicar (CA-3-33) | aplicar; aplicar de novo; aplicar como `teste.gestao` | 4 produtores com `lote_importacao`, propriedades e serviços (um na etapa 2); 0 novos na 2ª; 403 | consultas |
| GREEN 5 | desfazer (CA-3-34) | registrar uma visita de teste num produtor do lote; desfazer; desfazer de novo | 3 produtores e o que eles tinham apagados; o da visita mantido e listado; a 2ª chamada sem mudança | consultas + `relatorio_desfazer` |
| REFACTOR/REGRESSÃO | regressão e visual | (a) cadastro manual de produtor com documento repetido continua dando 400; (b) carteira, painel e fila sem itens de outra empresa; (c) capturas em 390×844 e 1280×800 de `/importar` (prévia), `/config/produtores-em-comum` e da ficha com o selo, com rolagem horizontal = 0 e axe-core | (a) 400; (b) sem divergência; (c) sem falha séria ou crítica | respostas, capturas, relatório do axe |

**Dados/fixtures:**
- os arquivos e produtores acima;
- os usuários `teste.admin` (Administrador da Teste A e da Teste B), `teste.admin.a` (Administrador só da Teste A), `teste.multi`, `teste.comercial1` e `teste.gestao`, do elenco da SPEC-3-001;
- uma migração de limpeza remove os produtores "TESTE —", as relações e as importações de teste no fim.

**Caminhos de erro obrigatórios:** perfil sem permissão, empresa só de um lado, relação duplicada, coluna obrigatória ausente, linha inválida, arquivo acima do limite, prévia expirada, aplicar ou desfazer repetidos, sem internet.

**Evidência exigida:** respostas, consultas, capturas e relatório do axe em `05_entregas/fase-3/spec-3-006/`, mais o log do Skip. O registro do pedido da planilha CL-001 vai no changelog.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-3/spec-3-006/` e o log do Skip. O modelo do arquivo é o padrão desta SPEC. A planilha real (CL-001) só acrescenta sinônimos de cabeçalho e não trava a construção.

## Handoff e operação

- **Como demonstrar:** relacionar um par sugerido e trocar de empresa pela ficha; importar o modelo preenchido, ver a prévia, aplicar e desfazer.
- **Como operar depois:**
  - o Diogo (Administrador nas duas empresas) revisa "Produtores em comum" quando entra cliente novo;
  - o Administrador de cada empresa importa a carteira, sempre conferindo a prévia.
- **Como monitorar:** importações com muitas recusas e relações desfeitas (motivo no registro).
- **Pendência conhecida:**
  - colunas da planilha real de etapas de serviço (CL-001), a acrescentar como sinônimos quando ela chegar;
  - duplicidade de produtor dentro da mesma empresa fica para a fase 5 (ajustes de uso).

## Emenda de 23/11/2026 — dados de faturamento e arquivo KML

**Origem:** decisão do consultor com o Diogo na call de 23/11/2026 (emenda P13). **Vale sobre:** esta SPEC, ainda não iniciada. Onde esta seção diverge do texto acima, vale esta seção. Não muda as regras de relação nem de importação; acrescenta campos.

**Intenção:**
- o produtor passa a guardar o **endereço de faturamento** e o **e-mail para a nota fiscal**, usados no contrato (fase 4) e pela contabilidade;
- cada propriedade pode ter o **arquivo KML (ou KMZ)** com o contorno da área e dos lotes/talhões. Nesta fase o sistema só guarda e valida o arquivo; o desenho no mapa é da fase 5.

**O que não muda:** emissão de nota fiscal continua fora do projeto; nenhum mapa é desenhado nesta fase; a importação continua sem alterar produtor existente.

**Degrau da solução:** nativo da plataforma — campos novos nas coleções e no modelo de importação.

**Dados (acréscimos):**

| Coleção | Campo novo (tipo) | Regra |
|---|---|---|
| `produtores` | `endereco_faturamento` (texto ≤ 500) | opcional; editável por quem já edita o produtor (regras da fase 1) |
| `produtores` | `email_nf` (e-mail ≤ 200) | opcional; formato de e-mail validado no hook (400 "E-mail da nota inválido") |
| `propriedades` | `kml` (arquivo, 1 por propriedade, protegido, ≤ 5 MB) | só extensões `.kml` e `.kmz`; o hook confere a extensão e o começo do conteúdo (`.kml`: texto com `<kml`; `.kmz`: assinatura de zip `PK`); outro conteúdo → 400 "Envie um arquivo KML ou KMZ"; acima de 5 MB → 400 |

**Modelo do arquivo de importação (acréscimos à tabela "Modelo do arquivo"):**

| Coluna | Regra | Sinônimos aceitos no cabeçalho |
|---|---|---|
| `endereco_faturamento` | até 500 caracteres | endereço de faturamento, endereço cobrança, endereço |
| `email_nf` | e-mail válido; inválido recusa a linha com o motivo "e-mail da nota inválido" | e-mail nf, email nota, e-mail para nota fiscal |

O arquivo KML não entra pela planilha: é anexado na propriedade, pela ficha.

**Telas (sistema visual da SPEC-3-002):**
- formulário do produtor (folha): os dois campos novos, na seção "Faturamento";
- aba "Perfil" da ficha: mostra os dois campos;
- formulário da propriedade (folha): campo "Mapa da área (KML ou KMZ)" com o nome do arquivo, "Trocar" e "Remover", e a nota "O desenho no mapa chega numa próxima etapa";
- `public/modelo-importacao-carteira.csv` ganha as duas colunas.

**Ordem de execução (acréscimo):** os campos de faturamento entram logo depois da relação entre empresas (passos 1–2) e antes da prévia da importação (passo 3); o arquivo KML entra depois do desfazer (passo 5).

**Superfícies afetadas (acréscimos):** migração com os três campos; `produtores_hooks.js` (validação de `email_nf`); hook novo `propriedades_kml.js` (validação do arquivo); `lib/importacao.js` (colunas e validação); `src/pages/ProdutorFicha.tsx` e os formulários de produtor e propriedade; `public/modelo-importacao-carteira.csv`.

**Critérios de aceite (acréscimos):**

- [ ] **CA-3-35:**
  - o produtor salva e mostra `endereco_faturamento` e `email_nf`; `email_nf` inválido dá 400;
  - a importação lê as duas colunas pelos sinônimos e grava nos produtores novos; linha com `email_nf` inválido é recusada com o motivo;
  - produtor existente continua sem alteração na importação.
- [ ] **CA-3-36:**
  - a propriedade aceita um `.kml` e um `.kmz` válidos de até 5 MB e mostra o nome do arquivo;
  - recusa `.pdf` renomeado para `.kml`, arquivo acima de 5 MB e segundo arquivo na mesma propriedade (o novo substitui o antigo só por "Trocar");
  - usuário de outra empresa não baixa o arquivo (404) e Operador não altera (403).

**TDD (acréscimos, nas empresas de teste):**

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 3 | campo inexistente (CA-3-35) | gravar `email_nf` antes da migração | campo ignorado (falha esperada) | resposta |
| GREEN 6 | faturamento (CA-3-35) | salvar os campos; `email_nf` inválido; prévia e aplicação da fixture `importacao-faturamento.csv` (4 linhas: 2 novas com os campos, 1 com e-mail inválido, 1 existente) | gravados; 400; 2 novos com os campos, 1 recusada, existente sem mudança | respostas + consultas |
| GREEN 7 | KML (CA-3-36) | anexar `teste.kml` e `teste.kmz` gerados pelo executor; `.pdf` renomeado; arquivo de 6 MB; baixar como `teste.rumo`; alterar como `teste.operador` | aceitos; 400; 400; 404; 403 | respostas + captura |

**Evidência exigida:** em `05_entregas/fase-3/spec-3-006/`, junto com as demais.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Ligar produtores das duas empresas e importar a carteira | Agrospy | SPEC-3-006 | CA-3-30 a CA-3-36 | todas as subtasks | evidências das subtasks | SPEC-3-004 no ar |
| id pendente | Relacionar o mesmo produtor na Agrospy e na Rumo Agro | Agrospy | SPEC-3-006 | CA-3-30, CA-3-31 | RED 1 → GREEN 1 + GREEN 2 | respostas + capturas | usuário Administrador nas duas empresas |
| id pendente | Guardar o endereço de faturamento e o e-mail da nota no produtor | Agrospy | SPEC-3-006 | CA-3-35 | RED 3 → GREEN 6 | respostas + consultas | SPEC-3-004 no ar |
| id pendente | Conferir a prévia da planilha antes de importar | Agrospy | SPEC-3-006 | CA-3-32 | RED 2 → GREEN 3 | respostas + print | SPEC-3-004 no ar |
| id pendente | Importar a carteira sem duplicar produtor | Agrospy | SPEC-3-006 | CA-3-33 | GREEN 4 + REFACTOR (a)(b) | consultas | prévia |
| id pendente | Desfazer uma importação inteira | Agrospy | SPEC-3-006 | CA-3-34 | GREEN 5 + REFACTOR (c) | consultas, capturas e relatório do axe | importação aplicada |
| id pendente | Anexar o arquivo KML de cada propriedade | Agrospy | SPEC-3-006 | CA-3-36 | GREEN 7 | respostas + captura | — |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| 23/11/2026 | call do consultor com o Diogo (emenda P13) | seção "Emenda de 23/11/2026 — dados de faturamento e arquivo KML"; tasks "Guardar o endereço de faturamento e o e-mail da nota no produtor" e "Anexar o arquivo KML de cada propriedade" | dados de faturamento para contrato e contabilidade; arquivo KML guardado para o mapa da fase 5 |
