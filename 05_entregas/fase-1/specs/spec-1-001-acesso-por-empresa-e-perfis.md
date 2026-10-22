# SPEC-1-001 — Acesso por empresa e perfis

**Fase:** 1
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · validação: Rodrigo Santos (consultor)
**Origem no escopo:** P2 (empresas independentes), P5 (Skip + Maestro), P6 (perfis e carteira); RQ-004, RQ-009; Fase 1, capacidades 1 e 2
**Degrau da solução:** nativo da plataforma — autenticação de usuários, coleções, regras de acesso e hooks do backend do Skip Cloud; nenhuma dependência nova.

## Contexto e decisões fechadas

- **Estado atual:** não existe sistema; o controle comercial é feito pelo WhatsApp e pela memória (1ª consultoria 22/09 `[00:21:00]–[00:21:06]`). O Diogo tem login no Skip habilitado (`[00:37:37]–[00:37:39]`).
- **Estado desejado:** cada pessoa entra com usuário próprio, escolhe a empresa em que vai trabalhar (Agrospy ou Rumo Agro), vê em todas as telas o nome, a cor e o logo dessa empresa e só acessa o que o perfil dela permite naquela empresa.
- **Decisões já fechadas:**
  - Agrospy e Rumo Agro são empresas independentes no mesmo sistema, cada uma com usuários, permissões, dados e identidade visual próprios. A separação é feita por regra de acesso no servidor; filtro de tela não conta como separação (P2).
  - Perfis por empresa: Administrador, Gestão, Comercial e Operador (P6, `[00:32:24]–[00:32:57]`). Uma pessoa pode ter vínculo nas duas empresas com perfis diferentes (o Diogo é Administrador nas duas).
  - O sistema é um projeto no Skip construído pelo Maestro com o conector Skip (P5).
  - A matriz de permissões abaixo é a fonte única das regras de acesso da fase 1; as SPECs 1-002, 1-003 e 1-005 aplicam essa matriz às suas coleções.
- **Bloqueios:** nenhum. A lista definitiva da equipe (e-mails e perfis) é cadastrada pelo administrador durante esta SPEC (CL-PEND-004).

## Resultado observável

Na tela de entrada, uma pessoa da equipe digita o próprio e-mail e senha; se tiver vínculo nas duas empresas, escolhe a empresa; a partir daí, o topo de todas as telas mostra a empresa ativa. Um usuário da Rumo Agro não consegue ver nem abrir nada da Agrospy — nem pela tela, nem chamando a API diretamente.

## Limites e dependências

- **Inclui:** coleções `empresas` e `vinculos`; campos de acesso derivados no usuário; login, saída e troca de empresa; identidade visual por empresa; tela de usuários para o Administrador (criar usuário, dar/alterar perfil por empresa, desativar vínculo); matriz de permissões; usuários e roteiro de teste de acesso.
- **Fora de escopo:** recuperação de senha por e-mail automático (nesta fase o Administrador define senha temporária); login social; vínculo de um produtor entre as duas empresas (fase 3); auditoria completa (fase 5).
- **Entradas e pré-condições:** conta Skip do Diogo conectada ao Maestro; projeto do sistema criado no Skip; senha temporária do acesso enviada na call já trocada (CL-005).
- **Saídas/artefatos:** migrações do banco com `empresas`, `vinculos` e campos de acesso; telas de entrada, escolha de empresa e usuários; roteiro de teste de acesso com resultado.
- **Dependências e responsáveis:** Agrospy (Diogo como Administrador) executa com o Maestro; Rodrigo Santos valida.
- **Atores e permissões mínimas:** ver matriz abaixo.
- **Superfícies/arquivos/configurações afetadas:** projeto do sistema no Skip — schema (`src/lib/pocketbase/schema.json`), migrações, serviços em `src/services/`, telas de autenticação e layout geral.
- **Risco e plano B:** regra de acesso escrita de forma que um vínculo “vaze” para outro (ex.: alguém Gestão numa empresa ganhar visão de gestor na outra). Plano B: as regras usam somente os campos de acesso derivados do usuário (abaixo), e o teste RED 3 prova o caso cruzado.
- **Rollback ou reversão:** cada mudança de banco entra por migração reversível; se uma regra falhar no teste, reverter a migração e corrigir antes de cadastrar a equipe real.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| `empresas` | backend do Skip | `nome` (único), `slug` (`agrospy`, `rumo-agro`), `cor_primaria` (hex), `logo` (arquivo, opcional), `ativa` (bool) | listar/ver: quem tem a empresa em `acesso_empresas`; editar: quem tem a empresa em `acesso_admin`; criar/apagar: só por migração | criadas uma única vez por migração (seed idempotente por `slug`) | empresa inativa não aparece na escolha |
| `vinculos` | backend do Skip (fonte única de quem acessa o quê) | `usuario` (users), `empresa` (empresas), `perfil` (`administrador` \| `gestao` \| `comercial` \| `operador`), `ativo` (bool), `nome_exibicao` (texto); único por (`usuario`, `empresa`) | listar/ver: Administrador da empresa ou o próprio usuário; criar: quem tem a empresa enviada no corpo em `acesso_admin`; editar: Administrador da empresa, sem poder trocar `usuario` nem `empresa` (imutáveis); apagar: ninguém (desativar) | par usuário+empresa único impede vínculo duplicado | vínculo duplicado é recusado com mensagem |
| `users` (auth do Skip) | backend do Skip | `email`, `name`, `precisa_trocar_senha` (bool) e campos derivados `acesso_empresas`, `acesso_admin`, `acesso_gestao`, `acesso_comercial` (relações múltiplas com `empresas`) | criar: quem tem alguma empresa em `acesso_admin`; ver/editar: o próprio usuário, sem poder enviar os campos `acesso_*`; os campos `acesso_*` só são gravados pelo hook | — | tentativa de enviar `acesso_*` é recusada |
| Hook de acesso | backend do Skip | a cada criação/alteração de vínculo, recalcula os quatro campos `acesso_*` do usuário a partir dos vínculos ativos | roda no servidor | recálculo completo (idempotente) | falha do hook desfaz a alteração do vínculo |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-01 | requisição sem usuário autenticado | nenhuma coleção de negócio responde | — | P2 |
| RN-02 | registro de negócio da empresa X | só é listado, aberto ou alterado por quem tem X em `acesso_empresas` e permissão do perfil na matriz | — | P2 |
| RN-03 | vínculo desativado | o usuário perde o acesso à empresa na requisição seguinte | — | P6 |
| RN-04 | Administrador da empresa X | só cria/altera vínculos da empresa X | o Diogo, Administrador nas duas, gerencia as duas | P6 |
| RN-05 | usuário com mais de uma empresa | escolhe a empresa ativa; a troca limpa da tela e do cache os dados da empresa anterior | usuário com uma empresa entra direto | P2 |
| RN-06 | `acesso_gestao` | inclui as empresas em que o usuário é Administrador ou Gestão | — | P6 |

**Matriz de permissões da fase 1 (fonte única):**

| Recurso | Administrador | Gestão | Comercial | Operador |
|---|---|---|---|---|
| Consultar produtores e propriedades da empresa | sim | sim | sim | sim |
| Criar produtor/propriedade | sim | sim | sim, ficando como responsável | não |
| Editar produtor/propriedade | sim | sim | só da própria carteira | não |
| Trocar responsável | sim | sim | não | não |
| Ver e registrar visitas | todas | todas | da própria carteira e as que registrou | não |
| Ver e editar oportunidades e ações | todas | todas | só as próprias | não |
| Minha carteira | sim | sim | sim | não |
| Visão do gestor | sim | sim | não | não |
| Usuários, perfis, dados da empresa e linhas de negócio | sim | não | não | não |

A matriz segue a regra combinada na call de que o Comercial tem o acesso do Operador mais o comercial (`[00:32:24]`). A visibilidade do Comercial sobre o cadastro de outros vendedores é um default a validar pelo cliente no teste humano da SPEC-1-005; se mudar, muda a regra, não a arquitetura.

## Fluxo e regras

1. Pessoa abre o sistema → tela de entrada (e-mail e senha).
2. Login válido → se `precisa_trocar_senha`, pede a nova senha antes de qualquer tela.
3. Sistema lê os vínculos ativos do usuário: nenhum → mensagem “Você ainda não tem acesso a nenhuma empresa. Fale com o administrador.”; um → entra direto; dois → tela de escolha com nome e logo de cada empresa.
4. Empresa ativa escolhida → topo de todas as telas mostra logo, nome e cor da empresa e o botão “Trocar empresa”.
5. “Trocar empresa” → limpa dados carregados da empresa anterior (tela e cache local) e volta à escolha.
6. Administrador → menu “Usuários” da empresa ativa: criar usuário (nome, e-mail, senha temporária, perfil), alterar perfil, desativar vínculo.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | usuário com vínculo nas duas empresas | escolhe a empresa e vê a identidade dela em todas as telas | — |
| Limite | usuário com vínculo só na Rumo Agro | entra direto na Rumo Agro; a Agrospy não aparece | — |
| Falha | senha errada | mensagem de erro sem dizer se o e-mail existe | tentar de novo |
| Falha | vínculo desativado durante o uso | próxima ação na tela retorna “sem acesso” e volta à escolha de empresa | administrador reativa |
| Falha | usuário tenta enviar `acesso_admin` no próprio cadastro | recusado | — |

## Instruções de execução para o Ethos

1. **Ler antes de alterar:** esta SPEC inteira e o projeto atual no Skip (schema em `src/lib/pocketbase/schema.json` e migrações existentes).
2. **Alterar somente:** coleções `empresas` e `vinculos`, campos do usuário listados, hook de acesso, telas de entrada/escolha de empresa/usuários, layout com a identidade da empresa e o roteiro de teste de acesso.
3. **Não alterar:** coleções de negócio de outras SPECs além de aplicar a matriz; não criar regra que dependa só de filtro na tela.
4. **Executar nesta ordem:** (a) migração de `empresas` com as duas empresas; (b) `vinculos` e campos `acesso_*` com o hook; (c) usuário do Diogo com vínculo Administrador nas duas empresas, criado pelo dono do projeto no Skip; (d) telas de entrada e escolha; (e) identidade visual; (f) tela de usuários; (g) usuários de teste e roteiro RED/GREEN; (h) cadastro da equipe real só depois do roteiro de acesso completo (RED 2–3 → GREEN → regressão da matriz), quando as coleções das SPECs 1-002 e 1-003 já existirem.
5. **Parar e pedir validação quando:** a plataforma não permitir regra de acesso no servidor ou hook de recálculo; um teste negativo passar por acidente (registro de outra empresa aparecer); faltar e-mail ou perfil de alguém da equipe.
6. **Estado válido ao parar:** login funciona, nenhuma empresa enxerga a outra e os usuários de teste continuam disponíveis para as próximas SPECs.

## Checklist de execução

- [ ] Projeto no Skip criado e Maestro conectado (pré-condição conferida).
- [ ] Duas empresas criadas com nome, cor e logo.
- [ ] Vínculos e campos `acesso_*` recalculados pelo hook.
- [ ] Entrada, escolha e troca de empresa funcionando.
- [ ] Tela de usuários do Administrador funcionando.
- [ ] Roteiro de acesso (RED → GREEN → regressão) executado e anexado.
- [ ] Equipe real cadastrada com o perfil certo.

## Critérios de aceite

- [ ] **CA-1-01:** usuário com vínculo ativo entra com e-mail e senha próprios; usuário sem vínculo ativo vê a mensagem de sem acesso e nenhuma lista de dados.
- [ ] **CA-1-02:** usuário com vínculo nas duas empresas escolhe a empresa ativa; nome, cor e logo dela aparecem em todas as telas; trocar de empresa não deixa dado da anterior na tela.
- [ ] **CA-1-03:** pela API, um usuário só da Rumo Agro recebe zero registros da Agrospy em qualquer listagem, recebe “não encontrado/sem permissão” ao abrir um registro da Agrospy pelo id e tem recusada a criação de registro com empresa Agrospy — e o mesmo vale no sentido inverso.
- [ ] **CA-1-04:** cada perfil faz exatamente o que a matriz permite em todas as coleções da fase; um usuário Gestão numa empresa e Comercial na outra não ganha visão de gestor na empresa em que é Comercial.
- [ ] **CA-1-05:** o Administrador cria usuário, dá perfil e desativa vínculo; o desativado perde o acesso na requisição seguinte; ninguém altera os próprios campos `acesso_*`; Administrador de uma empresa não cria vínculo na outra.

## TDD da SPEC

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | acesso sem login | chamar a listagem de `vinculos` e de qualquer coleção de negócio sem token | antes das regras, a resposta traz dados (falha esperada); depois deve vir vazia/recusada | resposta da API anexada ao card |
| RED 2 | isolamento entre empresas (CA-1-03) | com o token de `teste.comercial.rumo`, listar e abrir por id um registro de teste da Agrospy e tentar criar um registro com empresa Agrospy | antes das regras, aparece ou é criado (falha esperada) | respostas da API |
| RED 3 | vazamento entre vínculos (CA-1-04) | com o token de `teste.misto` (Gestão na Rumo Agro, Comercial na Agrospy), listar oportunidades de `teste.comercial1.agrospy` | antes da regra derivada, aparecem (falha esperada) | respostas da API |
| RED 4 | autoproteção (CA-1-05) | com o token de `teste.comercial1.agrospy`, enviar `acesso_admin` no próprio usuário | antes da regra, o campo é aceito (falha esperada) | resposta da API |
| GREEN | menor comportamento que passa | aplicar regras + hook e repetir RED 1–4 | todos recusados/vazios; login, escolha e troca de empresa funcionam no celular e no computador (CA-1-01, CA-1-02) | respostas da API + prints das telas |
| REFACTOR/REGRESSÃO | matriz completa | para cada usuário de teste, executar a tabela da matriz em todas as coleções da fase (listar, abrir, criar, editar) e comparar com o esperado; desativar `teste.operador.agrospy` e repetir uma chamada | 100% das células iguais à matriz; o desativado é recusado na chamada seguinte | tabela de resultado (usuário × recurso × esperado × obtido) |

**Como executar o roteiro de API (vale para todas as SPECs da fase):** pelo Maestro, fazer requisições HTTP à API REST do backend do projeto no Skip (endereço do backend do projeto), autenticando cada usuário de teste com e-mail e senha (`auth-with-password` da coleção `users`) e usando o token devolvido; registrar, para cada chamada, usuário, método, coleção, resultado esperado e resultado obtido. A interface não substitui esse roteiro: a prova de isolamento é sempre pela API.

**Dados/fixtures:** empresas Agrospy e Rumo Agro; usuários de teste `teste.admin.agrospy`, `teste.gestao.agrospy`, `teste.comercial1.agrospy`, `teste.comercial2.agrospy`, `teste.operador.agrospy`, `teste.comercial.rumo` e `teste.misto` (Gestão na Rumo Agro e Comercial na Agrospy), com e-mails de teste definidos pela Agrospy; registros de teste com nome iniciado por “TESTE —”. Nunca usar dados reais de produtores nos testes.
**Caminhos de erro obrigatórios:** sem token, token de outra empresa, vínculo desativado, perfil sem permissão, tentativa de escalar o próprio acesso, vínculo duplicado.
**Evidência exigida:** respostas da API do roteiro (antes e depois), tabela da matriz preenchida e prints das telas de entrada, escolha e topo com a identidade da empresa.

## Teste humano do cliente

- **Origem:** CL-004 (acompanhar e validar as entregas no portal) — o teste completo da fase está na SPEC-1-005.
- **Quem testa:** Diogo.
- **Passos:** entrar com o próprio usuário, escolher Agrospy, conferir o logo e o nome no topo, trocar para Rumo Agro e conferir que a lista muda; abrir “Usuários” e conferir a equipe e os perfis.
- **Resultado esperado:** a empresa ativa está sempre clara e cada pessoa da equipe aparece com o perfil combinado.
- **Evidência do aceite:** mensagem do Diogo no card da tarefa.

## Handoff e operação

- **Como demonstrar:** entrar com dois usuários de empresas diferentes em dois celulares e mostrar que cada um só vê a própria empresa.
- **Como operar depois:** o Diogo (Administrador) cria e desativa usuários e perfis pela tela “Usuários”.
- **Como monitorar:** ao cadastrar alguém, conferir a empresa e o perfil; rodar a regressão da matriz sempre que uma regra mudar.
- **Celular perdido ou pessoa desligada:** o Administrador desativa o vínculo; o acesso cai na requisição seguinte.
- **Usuários de teste:** ao fim da fase, os vínculos dos usuários de teste ficam desativados e só são reativados para rodar a regressão.
- **Pendência conhecida:** recuperação de senha automática fica para depois; nesta fase o Administrador define senha temporária.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| 3f7fb2d0-64a9-459f-a006-44805554d4cc | Conectar o Skip ao Maestro e criar o projeto do sistema comercial | Agrospy | SPEC-1-001 | pré-condições | checklist item 1 | link do projeto no Skip e conector ativo | login Skip do Diogo |
| c1886bd3-5193-4208-a20e-187112a261e8 | Conectar a conta Skip no Maestro | Agrospy | SPEC-1-001 | pré-condições | conector aparece como conectado | print dos conectores | login Skip do Diogo |
| ceeec8f6-4f9d-4db1-becd-2eb47ee2a5e1 | Criar o projeto do sistema comercial no Skip pelo Maestro | Agrospy | SPEC-1-001 | pré-condições | projeto abre pelo link | link do projeto | conector Skip ativo |
| e6893843-4b81-4fb9-8fe4-f6b841e9aa6d | Montar o login e a escolha de empresa (Agrospy ou Rumo Agro) | Agrospy | SPEC-1-001 | CA-1-01, CA-1-02 | RED 1; GREEN (login, escolha e troca) | prints das telas + resposta da API sem token | projeto criado |
| 47d2b87b-3e1d-4124-96cf-03eebe97b85f | Cadastrar as duas empresas com nome, cor e logo | Agrospy | SPEC-1-001 | CA-1-02 | seed idempotente por slug | lista de empresas no Skip | projeto criado |
| 70cb051a-c050-40ef-a76b-2a4758ea6a58 | Mostrar a empresa ativa em todas as telas e permitir trocar | Agrospy | SPEC-1-001 | CA-1-02 | GREEN de escolha e troca | prints com a identidade de cada empresa | empresas cadastradas |
| f1624dc7-d84e-424d-840b-414ed775636e | Configurar os perfis e a tela de usuários do administrador | Agrospy | SPEC-1-001 | CA-1-05 | RED 4; GREEN do hook | lista de vínculos por empresa | login funcionando |
| 0e80de88-0d2e-4042-bd9b-ba197320b2ff | Criar a tela de usuários para o administrador | Agrospy | SPEC-1-001 | CA-1-05 | criar, alterar perfil, desativar | prints da tela + resposta da API | vínculos e hook prontos |
| f1425ca3-e9c6-4675-b37c-f072c518932e | Criar os usuários de teste de cada perfil | Agrospy | SPEC-1-001 | CA-1-04, CA-1-05 | fixtures do roteiro de API | lista dos usuários de teste com empresa e perfil | tela de usuários pronta |
| ed490cca-8143-49af-9065-856a9f9ade9c | Testar o acesso: outra empresa e perfil sem permissão ficam bloqueados | Agrospy | SPEC-1-001 | CA-1-03, CA-1-04 | RED 2–3, GREEN e REFACTOR/REGRESSÃO | tabela da matriz preenchida | SPEC-1-002 e SPEC-1-003 com coleções criadas |
| caf0d8ff-2613-4382-a118-95e1f2134e0e | Testar que a Rumo Agro não vê dados da Agrospy, nem por fora da tela | Agrospy | SPEC-1-001 | CA-1-03 | RED 2 → GREEN, nos dois sentidos | respostas da API | usuários de teste |
| d37a78c4-d2a3-405a-bad8-38233f11db40 | Testar o que cada perfil pode ver e editar | Agrospy | SPEC-1-001 | CA-1-04 | REFACTOR/REGRESSÃO (matriz completa) + RED 3 | tabela usuário × recurso × esperado × obtido | usuários de teste |
| 6af46d50-9e9c-4182-b201-865b2bf00278 | Cadastrar a equipe da Agrospy e da Rumo Agro com o perfil certo | Agrospy | SPEC-1-001 | CA-1-05 | só depois do roteiro de acesso completo | lista de usuários × perfil × empresa | CL-PEND-004 (lista da equipe); teste de acesso aprovado |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
