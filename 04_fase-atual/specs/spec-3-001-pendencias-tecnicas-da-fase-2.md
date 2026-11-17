# SPEC-3-001 — Pendências técnicas da fase 2

**Fase:** 3
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** RQ-002; RQ-005; P1; P9 (itens 1 e 3); P11; CL-PEND-002 e CL-PEND-010; sobras da fase 2 (tasks 2ae01199 e 993bc32b; CA-2-06, CA-2-09 e CA-2-17)
**Degrau da solução:** reuso + construção mínima. O código da notificação já existe (0.0.177), a leitura da pasta já existe sob demanda (rota `/gravacoes/importar-drive` e coleção `config_drive`), e a rotina de retenção já existe. Esta SPEC liga, ajusta e prova.

## Contexto e decisões fechadas

- **Estado atual:**
  - **App no ar:** versão 0.0.213, de 11/11/2026.
  - **Notificação no celular:** feita e entregue no iPhone em 02/11 (0.0.177). Foi desligada para seguir a ordem da fase 2. A lista "Avisos", o contador, o aviso de atraso e a cópia ao gestor funcionam.
  - **Pasta do Drive:** importa só sob demanda. A leitura a cada 10 minutos não foi ligada porque a conta de serviço do Google exige RS256, que o runtime não tem.
  - **Guarda dos áudios (RN-50):** a rotina `retencao_rascunhos` usa 30 dias na última cópia do código. O Diogo escolheu 90 dias em 09/11.
  - **Dados de teste:** os usuários `teste.*` e os registros "TESTE —" estão dentro das empresas reais (Agrospy e Rumo Agro).
  - **GitHub:** o espelho em `07-sistemas/comercial/codigo/` parou na 0.0.120 (30/10).
- **Estado desejado:**
  - a notificação no celular está ligada e provada;
  - a pasta do Drive é lida a cada 10 minutos;
  - áudios e conversas ficam guardados por 90 dias;
  - os dados de teste vivem em empresas de teste;
  - o GitHub tem o código igual ao publicado.
- **Decisões já fechadas:**
  - **Serviço de notificação:** OneSignal, plano gratuito, com as chaves `PUSH_APP_ID` e `PUSH_API_KEY` no cofre (P9, item 3).
  - **Drive:** OAuth com refresh token e os escopos `drive.readonly` (ler a pasta) e `drive.file` (o próprio app cria a pasta de teste e os arquivos de prova). A conta de serviço não serve, porque exige RS256.
  - **Guarda:** RN-50 = 90 dias; conversas do assistente = 90 dias.
  - **Sem teste humano (P11):** a entrega no celular é provada pela resposta do OneSignal para uma inscrição de teste, não pelo aparelho de uma pessoa.
  - **Dados de teste:** só nas empresas "Teste A" e "Teste B", com o elenco fixo da tabela "Elenco de teste". As senhas são novas e geradas pelo executor. Elas ficam guardadas só nas credenciais do próprio executor, fora do repositório e do Skip, e nunca em migração.
  - **Migração já aplicada nunca é editada.** A senha antiga de teste que está escrita nas migrações 0023, 0028 e 0032 deixa de valer porque as senhas são trocadas.
- **Bloqueios:**
  - **Leitura a cada 10 min:** depende do aplicativo OAuth do Google Workspace da Agrospy (passo único, ver "Dados e integrações"). Sem ele, a importação sob demanda continua, e as outras tasks seguem.
  - **Notificação:** se as chaves do OneSignal não estiverem mais no cofre, peça ao Diogo uma vez, explicando o que são.

## Resultado observável

- **Notificação:** quem ativa os avisos recebe no celular o aviso do dia e o aviso de atraso. O gestor recebe a cópia.
- **Pasta do Drive:** uma gravação salva na pasta vira rascunho sozinha em até 10 minutos.
- **Painéis:** a equipe não vê mais usuários e produtores de teste nos painéis e listas reais.
- **GitHub:** guarda o código atual do app.

## Limites e dependências

- **Inclui:**
  - ligar a notificação no celular;
  - provar a entrega do aviso do dia, do aviso de atraso e da cópia;
  - RN-50 e guarda das conversas em 90 dias;
  - leitura da pasta do Drive a cada 10 min;
  - empresas de teste;
  - espelho do código no GitHub, mais a regra de manter o espelho atualizado.
- **Fora de escopo:**
  - mudar o texto dos avisos, a cadência ou as regras de cópia da fase 2;
  - integração com a conta do Plaud;
  - visual novo (SPEC-3-002 e SPEC-3-003).
- **Entradas e pré-condições:**
  - fase 2 no ar (0.0.213);
  - chaves do OneSignal no cofre;
  - para a leitura a cada 10 min: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN` no cofre.
- **Saídas/artefatos:**
  - migração das empresas de teste, com carga igual à das empresas reais e o elenco de teste;
  - rotina `ler_pasta_drive`;
  - rotina de retenção ajustada;
  - espelho em `07-sistemas/comercial/codigo/`;
  - evidências em `05_entregas/fase-3/spec-3-001/`.
- **Dependências e responsáveis:**
  - Agrospy executa com o Maestro;
  - o Diogo cria o aplicativo OAuth e cola os três segredos no cofre (passo único);
  - o Diogo confirma as chaves do OneSignal, se o Maestro pedir.
- **Atores e permissões mínimas:** as da fase 2. Só o Administrador edita `config_drive`. Os usuários `teste.*` só têm vínculo com as empresas de teste. As rotas de teste aceitam só superusuário.
- **Superfícies/arquivos/configurações afetadas:**
  - `pocketbase/migrations/`;
  - `pocketbase/hooks/` (rotinas de retenção e do Drive; envio de avisos);
  - a tela "Avisos" (botão "Ativar avisos no celular");
  - o `sw.js` (import do script do OneSignal);
  - o cofre do Skip;
  - `07-sistemas/comercial/`.
- **Risco e plano B:**
  - **Token do Google:** se o refresh token for revogado, a rotina registra a falha, avisa o Administrador e a importação sob demanda continua.
  - **OneSignal:** se o serviço falhar, o aviso fica `falhou_envio` e continua na lista.
- **Rollback ou reversão:**
  - **Pasta do Drive:** `config_drive.ativa = falso` desliga a rotina.
  - **Notificação:** esconder o botão "Ativar avisos no celular" e desativar as inscrições volta ao estado da 0.0.213.
  - **Empresas de teste:** o `down` da migração só desativa as empresas de teste. Ele nunca religa usuário `teste.*` à Agrospy ou à Rumo Agro.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| Servidor → OneSignal (envio) | coleção `avisos` | `external_id` do destinatário, `texto_curto` sem nome de produtor, link da oportunidade | `PUSH_API_KEY` no cofre | timeout 10 s; 2 tentativas; um envio por aviso (chave do aviso) | `falhou_envio` quando a resposta não é 2xx, quando vem com `id` vazio ou quando traz `errors` (o OneSignal responde 200 com `errors` para inscrição inexistente ou inválida); o aviso continua na lista |
| App → OneSignal (inscrição) | `inscricoes_push` | inscrição criada dentro do toque em "Ativar avisos no celular". Na prova, a inscrição do usuário de teste é feita no navegador com interface do executor, porque o navegador sem interface pode não conseguir se inscrever | usuário logado | nova inscrição no mesmo aparelho desativa a anterior; ao sair, desativa | permissão negada: só a lista |
| Servidor → Google (token) | cofre | `POST https://oauth2.googleapis.com/token` com `grant_type=refresh_token`, `client_id`, `client_secret`, `refresh_token` | segredos `GOOGLE_*` | timeout 10 s; token de acesso guardado só em memória da execução | 400/401: aviso ao Administrador (tipo `sistema`) uma vez por dia; rotina pula a rodada |
| Pasta do Drive → `rascunhos` | `config_drive` (`empresa`, `pasta_id`, `dono`, `ativa`, `ultima_leitura`); a Teste A aponta para a pasta de teste criada pelo app | `GET https://www.googleapis.com/drive/v3/files?q='<pasta_id>' in parents and trashed=false and modifiedTime > '<ultima_leitura>'&fields=files(id,name,mimeType,size,sha256Checksum,modifiedTime)`; download por `files/<id>?alt=media` | `Authorization: Bearer <token de acesso>`; escopos `drive.readonly` e `drive.file` | a cada 10 min; `chave_dedup` = id do arquivo; `hash_conteudo` = `sha256Checksum` em base64; arquivo já importado não volta | arquivo grande ou formato inválido: rascunho `falhou` com motivo; erro de rede: tenta na próxima rodada sem avançar `ultima_leitura` |

**Aplicativo OAuth (passo único do Diogo, com o Maestro guiando por mensagem curta):**
1. No Google Cloud do Workspace da Agrospy: criar o projeto "Agrospy App", ativar a Google Drive API e configurar a tela de consentimento como **Interno**. Assim não há verificação do Google, e o token não expira em 7 dias.
2. Criar a credencial "ID do cliente OAuth", tipo "Aplicativo da Web", com o URI de redirecionamento `https://developers.google.com/oauthplayground`.
3. No OAuth Playground (engrenagem → "Use your own OAuth credentials"), autorizar os escopos `https://www.googleapis.com/auth/drive.readonly` e `https://www.googleapis.com/auth/drive.file` com a conta dona da pasta "Gravações" e trocar o código pelo refresh token.
4. Colar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN` no cofre do Skip. Os valores nunca vêm pelo chat nem pelo grupo.
5. Se a pasta "Gravações" estiver compartilhada como "qualquer pessoa com o link", trocar para "restrito". O executor confere isso pela lista de permissões da pasta (`permissions.list`): não pode haver permissão do tipo `anyone`.

**Pasta de teste (sem pessoa):** com os segredos no cofre, a rota de teste `POST /backend/v1/teste/drive/preparar` (só superusuário) cria pelo escopo `drive.file` a pasta "Agrospy — teste de importação" e grava nela os arquivos de prova. Depois, aponta o `config_drive` da Teste A para essa pasta. A rota `POST /backend/v1/teste/drive/token-invalido` (só superusuário) roda uma rodada da Teste A com um refresh token inválido passado na própria chamada, sem tocar nos segredos de produção.

**Elenco de teste (criado nesta SPEC e usado por todas as SPECs da fase):**

| Usuário | Empresa | Perfil |
|---|---|---|
| `teste.admin` | Teste A e Teste B | Administrador nas duas |
| `teste.admin.a` | Teste A | Administrador |
| `teste.gestao` | Teste A | Gestão |
| `teste.comercial1` | Teste A | Comercial |
| `teste.comercial2` | Teste A | Comercial |
| `teste.operador` | Teste A | Operador |
| `teste.multi` | Teste A e Teste B | Comercial nas duas |
| `teste.rumo` | Teste B | Comercial |

**Carga das empresas de teste:** a Teste A espelha a Agrospy (cor #153A1D, as mesmas linhas de negócio e o `config_avisos` padrão). A Teste B espelha a Rumo Agro (cor #304A54 e as mesmas linhas). As duas têm `config_drive` inativo até a pasta de teste existir. Usuários `teste.*` que já existem são reaproveitados: o vínculo com as empresas reais é desativado, a senha é trocada e o vínculo com a empresa de teste é criado.

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-50 | rascunho `descartado` ou `falhou` há mais de 90 dias | a rotina diária tira `midia`, `transcricao` e `texto_original` | rascunho `confirmado` perde `midia` depois da cópia para `visitas.audio` (como na fase 2) | decisão do Diogo, 09/11/2026 |
| RN-51 | mensagem de conversa do assistente com mais de 90 dias | a rotina diária remove só as mensagens antigas do JSON da conversa; a conversa sem mensagens é apagada | conversa usada todo dia mantém as mensagens recentes | P11 (padrão aplicado) |
| RN-52 | usuário `teste.*` | vínculo só com as empresas "Teste A" e "Teste B", conforme o elenco; senha nova; nunca vínculo com Agrospy ou Rumo Agro | — | P11 |
| RN-53 | registro com prefixo "TESTE —" numa empresa real | é removido pela migração de limpeza; provas novas só gravam nas empresas de teste | — | P11 |
| RN-54 | pasta do Drive com permissão `anyone` | o executor detecta pela `permissions.list` e pede ao Diogo, uma vez, para restringir; a rotina continua lendo pelo OAuth | enquanto a permissão existir, fica registrada no STATUS | P1 (privacidade) |

## Fluxo e regras

1. O Maestro copia o código publicado para o GitHub e confere arquivo por arquivo.
2. Os dados de teste mudam para as empresas "Teste A" e "Teste B", e as empresas reais ficam limpas.
3. A notificação no celular volta a aparecer na tela "Avisos". A prova usa um navegador de computador inscrito com o usuário de teste.
4. A guarda passa para 90 dias.
5. Com os segredos do Google no cofre, a rotina lê a pasta a cada 10 minutos. Sem eles, a importação sob demanda continua.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | aviso do dia para usuário inscrito | OneSignal responde 2xx com id; aviso marcado `enviado` | — |
| Principal | arquivo novo na pasta | rascunho do dono em até 10 min | — |
| Limite | o mesmo arquivo já enviado pelo app | um único rascunho | — |
| Limite | rascunho descartado há 89 e há 91 dias | o de 89 mantém a mídia; o de 91 perde | — |
| Falha | inscrição inválida | `falhou_envio`; o aviso continua na lista | — |
| Falha | refresh token revogado | aviso `sistema` ao Administrador; nada é perdido | importação sob demanda |
| Falha | segredos do Google ausentes | rotina não roda e registra "sem credencial" uma vez por dia | importação sob demanda |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; as SPECs 2-002 e 2-004 em `05_entregas/fase-2/specs/`; os hooks atuais de avisos, retenção e Drive no Skip; os guias de hooks, rotinas, HTTP e segredos do Skip.
2. **Contexto técnico do Skip:**
   - hooks PocketBase JSVM, sem `Intl` e sem funções declaradas no topo (use `require(\`${__hooks}/lib/...\`)` dentro do handler);
   - `$http.send` não lança erro em não-2xx;
   - segredos só com `$secrets.get`;
   - migrações só rodam no publish;
   - log sem nome de produtor nem telefone.
3. **Alterar somente:** as superfícies listadas em "Limites e dependências".
4. **Não alterar:**
   - regras de acesso e de confirmação das fases 1 e 2;
   - o cache da casca do app;
   - o texto e a cadência dos avisos.
5. **Executar nesta ordem:**
   1. espelho do código no GitHub (CA-3-05);
   2. empresas de teste e limpeza (CA-3-04);
   3. notificação no celular (CA-3-01);
   4. guarda de 90 dias (CA-3-02);
   5. leitura da pasta a cada 10 min (CA-3-03).
6. **Parar e pedir validação quando:**
   - as chaves do OneSignal não existirem (peça ao Diogo uma vez e siga com as outras tasks);
   - os segredos `GOOGLE_*` não existirem ao chegar no passo 5. Nesse caso, mande ao Diogo o roteiro do aplicativo OAuth em mensagem curta, deixe a task "Ler a pasta do Drive a cada 10 minutos" em `[/]` com a pendência no STATUS e siga para a próxima SPEC. A task fecha quando os segredos chegarem e as provas passarem;
   - o serviço exigir plano pago.
7. **Estado válido ao parar:** a lista de avisos e a importação sob demanda continuam funcionando, e nenhum rascunho se perde.
8. **Ritmo:** construir as tasks em sequência, sem pedir autorização nem teste entre elas. Sem teste do cliente (P11).
9. **Regra que vale para a fase toda:** ao fechar cada task, atualizar o espelho do código no GitHub com a versão publicada.
   - O espelho copia todos os arquivos do Skip, inclusive `pocketbase/`.
   - Ficam de fora só os arquivos com credencial listados em `07-sistemas/comercial/plataforma.md` (hoje, a migração 0003).
   - `LEIA-ME.md` e `docs/` do espelho são documentação e não entram na comparação.

## Checklist de execução

- [ ] Espelho igual ao publicado, sem segredos.
- [ ] Empresas "Teste A" e "Teste B" com os usuários `teste.*`; empresas reais sem "TESTE —".
- [ ] Notificação ligada, com entrega provada pelo OneSignal.
- [ ] RN-50 e RN-51 em 90 dias.
- [ ] Leitura da pasta a cada 10 min, ou pendência registrada com o motivo.
- [ ] Evidências em `05_entregas/fase-3/spec-3-001/`.

## Critérios de aceite

- [ ] **CA-3-01:** com `teste.comercial1` inscrito no navegador com interface do executor e `teste.gestao` como gestor:
  - o aviso do dia e o aviso de atraso saem pelo OneSignal com resposta 2xx e id, e a cópia ao gestor de teste também;
  - o `texto_curto` não tem nome de produtor;
  - sem inscrição, o aviso fica só na lista;
  - inscrição inválida ou resposta 200 com `errors` ou `id` vazio gera `falhou_envio`, e o aviso continua na lista;
  - no mesmo navegador, depois de sair e entrar com outro usuário, o aviso do primeiro não chega ao segundo.
- [ ] **CA-3-02:**
  - um rascunho `descartado` há 91 dias perde `midia`, `transcricao` e `texto_original`, e um há 89 dias não perde;
  - numa conversa com mensagens de 91 e de 89 dias, só a de 91 dias sai; uma conversa só com mensagens de 91 dias é apagada.
- [ ] **CA-3-03:**
  - com os segredos `GOOGLE_*` no cofre, um arquivo novo gravado pela rota de teste na pasta de teste da Teste A vira rascunho do dono em até 10 minutos e não é importado de novo;
  - o mesmo arquivo já enviado pelo app não duplica;
  - um refresh token inválido (rota de teste) gera aviso `sistema` ao Administrador da Teste A;
  - a pasta real não tem permissão `anyone`, ou isso fica registrado no STATUS.
  - Sem os segredos, a task fica em `[/]` com a pendência no STATUS, e a importação sob demanda continua.
- [ ] **CA-3-04:**
  - o elenco de teste existe com os vínculos da tabela e com senhas novas (a senha antiga das migrações 0023, 0028 e 0032 não autentica nenhum usuário);
  - Teste A e Teste B têm a mesma carga das empresas que espelham (linhas de negócio e `config_avisos`);
  - nenhum usuário `teste.*` tem vínculo ativo com a Agrospy ou a Rumo Agro;
  - nenhum registro "TESTE —" existe nas empresas reais;
  - as contagens da carteira e da visão do gestor das empresas reais não mudam depois de rodar as provas.
- [ ] **CA-3-05:**
  - todo arquivo do Skip está em `07-sistemas/comercial/codigo/` com o mesmo conteúdo (diferença zero na comparação por arquivo), exceto os arquivos com credencial listados em `plataforma.md`;
  - a busca por valores de segredo no espelho volta vazia: `gsk_`, `sk-`, `os_v2_`, `1//`, `client_secret"\s*:\s*"` e as chaves reais do cofre, conferidas pelo hash. A busca é por valor, não por nome de variável.

## TDD da SPEC

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | espelho (CA-3-05) | comparar o SHA-256 de cada arquivo do Skip (menos a lista de exclusão) com `07-sistemas/comercial/codigo/` | antes: diferenças (o espelho está na 0.0.120) | relatório da comparação |
| GREEN 1 | espelho (CA-3-05) | copiar todos os arquivos (inclusive `pocketbase/`), comparar de novo e buscar os valores de segredo | zero diferenças; busca vazia | relatório + commit |
| RED 2 | dados de teste (CA-3-04) | listar os vínculos de `teste.*` e os registros "TESTE —" nas empresas reais | antes: aparecem | consulta |
| GREEN 2 | dados de teste (CA-3-04) | migração das empresas de teste com a carga e o elenco; troca das senhas; limpeza; login de cada usuário do elenco com a senha nova e tentativa com a senha antiga; uma prova da fase 2 na Teste A | elenco autenticando só com a senha nova; zero nas empresas reais; contagens reais iguais antes e depois | consultas antes/depois + respostas do login |
| GREEN 3 | notificação (CA-3-01) | inscrever `teste.comercial1` e `teste.gestao` no navegador com interface do executor; rota de teste de avisos com `agora` = hoje 07:05 e depois com ação vencida (Teste A) | 2xx com `id` não vazio e sem `errors` para o aviso e a cópia; `enviado` na coleção | respostas + consulta |
| REFACTOR 1 | notificação, falhas (CA-3-01) | (a) sem inscrição; (b) inscrição inválida; (c) troca de usuário no mesmo navegador; (d) `texto_curto` sem nome | (a) só na lista; (b) `falhou_envio`, inclusive com resposta 200 com `errors`; (c) não vaza; (d) sem nome | respostas + consulta |
| RED/GREEN 4 | guarda (CA-3-02) | criar por migração de teste, na Teste A, rascunhos com 89 e 91 dias e uma conversa com mensagens de 89 e 91 dias; rodar a retenção pela rota `POST /backend/v1/teste/retencao` (só superusuário), que chama a mesma função da rotina diária | antes do ajuste, o de 89 perde a mídia (30 dias); depois, só os de 91 e só a mensagem de 91 dias | consultas |
| GREEN 5 | pasta do Drive (CA-3-03) | `POST /backend/v1/teste/drive/preparar` grava na pasta de teste um arquivo novo e o m4a já enviado pelo app pela Teste A; esperar uma rodada | um rascunho do arquivo novo; o m4a não duplica; a rodada seguinte não importa de novo | consultas + log da rotina |
| REFACTOR 2 | pasta do Drive, falhas e privacidade (CA-3-03) | `POST /backend/v1/teste/drive/token-invalido`; `permissions.list` da pasta real | aviso `sistema` ao Administrador da Teste A, sem perda; nenhuma permissão `anyone` (ou registro no STATUS) | consulta + log + resposta das permissões |
| REGRESSÃO | fases 1 e 2 | gravar pós-visita, confirmar rascunho, assistente e envio pelo app com os usuários de teste | sem divergência | respostas + log do Skip |

**Dados/fixtures:**
- empresas "Teste A" e "Teste B";
- elenco de teste da tabela, com senhas novas guardadas só nas credenciais do executor;
- produtor "TESTE — Produtor A" na Teste A;
- arquivos de teste da fase 2;
- pasta de teste criada pelo próprio app (escopo `drive.file`).

**Caminhos de erro obrigatórios:**
- sem inscrição;
- inscrição inválida;
- OneSignal fora do ar;
- token do Google inválido;
- segredos ausentes;
- arquivo repetido;
- formato inválido.

**Evidência exigida:** relatórios, respostas e consultas em `05_entregas/fase-3/spec-3-001/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11, 17/11/2026). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-3/spec-3-001/` e o log do Skip.

## Handoff e operação

- **Como demonstrar:**
  - aviso de atraso chegando no navegador inscrito;
  - arquivo novo na pasta virando rascunho.
- **Como operar depois:**
  - cada pessoa toca em "Ativar avisos no celular" com o app instalado na tela inicial;
  - as gravações vão para a pasta "Gravações".
- **Como monitorar:**
  - avisos em `falhou_envio`;
  - avisos `sistema` de falha do Drive;
  - `ultima_leitura` parada há mais de 1 hora.
- **Pendência conhecida:** no iPhone, só recebe notificação quem instalou o app na tela inicial.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Fechar as pendências técnicas da fase 2 | Agrospy | SPEC-3-001 | CA-3-01 a CA-3-05 | todas as subtasks | evidências das subtasks | fase 2 no ar |
| id pendente | Atualizar o código do app no GitHub | Agrospy | SPEC-3-001 | CA-3-05 | RED 1 → GREEN 1 | relatório da comparação + commit | acesso ao Skip |
| id pendente | Separar os dados de teste das empresas reais | Agrospy | SPEC-3-001 | CA-3-04 | RED 2 → GREEN 2 | consultas antes/depois | espelho atualizado |
| id pendente | Religar os avisos no celular | Agrospy | SPEC-3-001 | CA-3-01 | GREEN 3 + REFACTOR 1 | respostas do OneSignal + consulta | chaves do OneSignal; empresas de teste |
| id pendente | Guardar áudios e conversas por 90 dias | Agrospy | SPEC-3-001 | CA-3-02 | RED/GREEN 4 | consultas | empresas de teste |
| id pendente | Ler a pasta do Drive a cada 10 minutos | Agrospy | SPEC-3-001 | CA-3-03 | GREEN 5 + REFACTOR 2 + REGRESSÃO | consultas + log; sem os segredos, task em `[/]` com a pendência | segredos `GOOGLE_*` no cofre |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
