# SPEC-2-002 — Avisos da próxima ação no celular, com cópia ao gestor

**Fase:** 2
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · teste: Diogo
**Origem no escopo:** RQ-005; Fase 2, capacidade "avisos push do app ao responsável com cópia configurável ao gestor"; CL-PEND-005, CL-PEND-006 e CL-PEND-010
**Degrau da solução:** nativo da plataforma + construção mínima:
- **Rotina:** a rotina agendada do Skip calcula os avisos;
- **Recepção:** o app instalado da fase 1 recebe as notificações por um serviço de push de plano gratuito (OneSignal). O runtime do Skip não tem a criptografia do web push para enviar sozinho.

## Contexto e decisões fechadas

- **Estado atual:** toda oportunidade aberta tem responsável, próxima ação e data, e "Minha carteira" mostra os atrasos. Ninguém é avisado: o vendedor precisa abrir o app.
- **Estado desejado:** no dia da próxima ação, o responsável recebe um aviso no celular. Se a ação passar do dia sem ser concluída, recebe outro, e o gestor recebe cópia.
- **Decisões já fechadas:**
  - **Cadência padrão (CL-PEND-006), ajustável pelo Administrador por empresa:**
    - aviso do dia às 7h, horário de Brasília;
    - aviso de atraso no dia seguinte e, enquanto continuar atrasada, a cada 3 dias;
    - cópia ao gestor ligada nos atrasos.
  - **Lista "Avisos":** existe sempre no app e não depende de permissão do celular.
  - **Privacidade da tela bloqueada:** a notificação mostra só "Agrospy: você tem 1 ação para hoje" (ou "1 ação atrasada"); o produtor e a ação aparecem ao abrir. O texto começa com o nome da empresa.
  - **O aviso não conclui nada:** concluir ou reagendar segue a fase 1.
  - **Destinatários:**
    - o responsável da oportunidade;
    - na cópia, os usuários Gestão e Administrador ativos da mesma empresa que não desligaram a cópia;
    - nunca usuários de outra empresa.
  - **Serviço de push:** OneSignal, plano gratuito, que atende iPhone com o app instalado na tela inicial. A conta é criada pelo Diogo, e as chaves ficam no cofre: `PUSH_APP_ID` e `PUSH_API_KEY` (CL-PEND-010).
- **Bloqueios:** a notificação no celular depende de CL-PEND-010. A lista "Avisos" não tem bloqueio.

## Resultado observável

Entre 7h00 e 7h10 do dia marcado, o celular do vendedor mostra "Agrospy: você tem 1 ação para hoje". Ao tocar, o app abre na oportunidade, com o produtor e a ação. No dia seguinte, se a ação não foi concluída, chega "Agrospy: 1 ação atrasada", e o Diogo recebe a cópia. Na lista "Avisos" do app aparecem os mesmos avisos com o detalhe, inclusive para quem não ativou a notificação.

## Limites e dependências

- **Inclui:**
  - rotina de avisos;
  - coleções de avisos, inscrições, configuração e preferências;
  - lista "Avisos" com contador;
  - botão "Ativar avisos no celular";
  - envio pelo serviço de push;
  - atraso com cópia ao gestor;
  - configuração do Administrador;
  - opção de desligar a cópia.
- **Fora de escopo:** avisos por WhatsApp (fora do ciclo, decisão P10); avisos para produtores; e-mail.
- **Entradas e pré-condições:** fase 1 no ar; app instalado na tela inicial dos celulares de teste; sistema dos celulares da equipe confirmado (CL-PEND-005; já se sabe que há iPhone); CL-PEND-010 para a notificação.
- **Saídas/artefatos:**
  - coleções `avisos`, `inscricoes_push`, `config_avisos` e `preferencias_avisos`;
  - `hooks/lib/avisos.js` com a função `gerarAvisos(agoraISO)`;
  - rotina e rota de teste;
  - tela "Avisos";
  - evidências em `05_entregas/fase-2/spec-2-002/`.
- **Dependências e responsáveis:** Agrospy executa; o Diogo confirma os celulares, cria a conta do OneSignal e faz o teste final.
- **Atores e permissões mínimas:** cada usuário vê só os próprios avisos; só o Administrador muda a configuração da empresa.
- **Superfícies/arquivos/configurações afetadas:**
  - migrações e hooks;
  - rotina agendada;
  - frontend: tela "Avisos", contador e ativação;
  - `sw.js`, que importa o script do serviço por `importScripts` sem mudar o cache da casca;
  - segredos `PUSH_*`.
- **Risco e plano B:** iPhone sem o app instalado ou com a permissão negada não recebe notificação, e o aviso continua na lista. Se o serviço falhar, o aviso fica `falhou_envio` e a lista continua certa.
- **Rollback ou reversão:** `config_avisos.ativo = falso` desliga os avisos da empresa sem afetar as oportunidades.

## Dados e integrações

**Coleções:**
- **`avisos`:**
  - `empresa`, `destinatario`, `oportunidade` e `tipo` (`do_dia`, `atraso` ou `copia_gestor`);
  - `referencia_data` (data da próxima ação), `texto_curto` (tela bloqueada) e `detalhe` (produtor e ação, visível no app);
  - `lido_em` e `envio` (`pendente`, `enviado`, `sem_inscricao` ou `falhou_envio`);
  - `chave_unica` = oportunidade + tipo + destinatário + data do aviso, única.
- **`inscricoes_push`:** `usuario`, `id_inscricao` (do serviço) e `ativa`. O serviço usa `external_id` = id do usuário.
- **`config_avisos`:** `empresa`, `ativo` (padrão verdadeiro), `horario` (padrão 07:00, só múltiplos de 10 minutos), `repetir_atraso_dias` (padrão 3), `copia_gestor` (padrão verdadeiro) e `ultima_execucao`.
- **`preferencias_avisos`:** `usuario`, `empresa` e `copia_desligada` (padrão falso); única por usuário e empresa.

**Regras de acesso** (nunca regra vazia `""`):
- **`avisos`:** list/view = `destinatario = @request.auth.id`; update só do campo `lido_em`; create/delete = `null`.
- **`inscricoes_push`:** todas as regras com `usuario = @request.auth.id`.
- **`config_avisos`:** view para quem tem vínculo com a empresa (`@request.auth.acesso_empresas.id ?= empresa`, como na fase 1); update só para `@request.auth.acesso_admin.id ?= empresa`.
- **`preferencias_avisos`:** todas as regras com `usuario = @request.auth.id`.

| Origem/destino | Contrato | Autenticação | Tempo e repetição | Erro |
|---|---|---|---|---|
| Rotina `cronAdd("*/10 * * * *")` (UTC) → `gerarAvisos(agora)` | para cada empresa com `ativo`, se a hora de Brasília (UTC−3, sem `Intl`) for ≥ `horario` e `ultima_execucao` não for de hoje: gera os avisos e grava `ultima_execucao` | servidor | `chave_unica` impede repetição | erro numa empresa não para as outras |
| Rota de teste `POST /backend/v1/teste/avisos/rodar` | chama `gerarAvisos` com `{ "agora": "..." }` | só superusuário (`$apis.requireSuperuserAuth()`) | — | — |
| App → OneSignal (inscrição) | botão "Ativar avisos no celular" (no iPhone, o pedido de permissão precisa sair de um toque); grava `inscricoes_push` | usuário | inscrição nova no mesmo aparelho desativa a anterior; ao sair da conta, o app desativa a inscrição do aparelho | permissão negada: só a lista |
| Servidor → OneSignal (envio) | `$http.send` para a API do serviço com `external_id` do destinatário, `texto_curto` e o link | `PUSH_API_KEY` | timeout de 10 s; 2 tentativas | `statusCode` diferente de 2xx: `falhou_envio` |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-36 | oportunidade aberta com `proxima_acao_data` = hoje | aviso `do_dia` ao responsável | responsável inativo: aviso `copia_gestor` aos gestores | RQ-005 |
| RN-37 | ação vencida e oportunidade aberta | aviso `atraso` no dia seguinte e a cada `repetir_atraso_dias` | concluiu ou reagendou: para | RQ-005 |
| RN-38 | aviso de atraso e `copia_gestor` ligada | `copia_gestor` aos Gestão/Administrador ativos da empresa sem `copia_desligada` | o próprio responsável não recebe cópia de si mesmo | 22/09 `[00:27:33]` |
| RN-39 | aviso | não conclui nem altera a oportunidade | — | RQ-005 |
| RN-40 | horário | Brasília = UTC−3 | — | fase 1 (RN-26) |

## Fluxo e regras

1. A cada 10 minutos, a rotina confere as empresas. No primeiro ciclo depois do horário configurado, cria os avisos do dia e de atraso que ainda não existem.
2. Para cada aviso, se o destinatário tem inscrição ativa, envia o `texto_curto` pelo serviço; senão, marca `sem_inscricao`.
3. No app, o contador do topo mostra os não lidos. "Avisos" lista os avisos com o detalhe, e tocar abre a oportunidade.
4. "Ativar avisos no celular" pede a permissão; o usuário pode desativar em "Avisos". Gestão e Administrador podem desligar a cópia.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | ação para hoje | aviso entre 7h00 e 7h10 no celular e na lista | — |
| Limite | ação concluída antes das 7h | nenhum aviso | — |
| Limite | rotina roda várias vezes no mesmo dia | sem repetição | `ultima_execucao` e `chave_unica` |
| Falha | celular sem inscrição | aviso só na lista | — |
| Falha | duas pessoas no mesmo iPhone | só quem está logado recebe | troca de inscrição ao sair e entrar |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; as coleções de oportunidades e vínculos; o service worker e o manifesto da fase 1; os guias de hooks e de rotinas do Skip; a documentação do OneSignal para web push.
2. **Contexto técnico do Skip:**
   - `cronAdd` roda em UTC, com intervalo mínimo de 10 minutos;
   - o runtime não tem `Intl`;
   - `$http.send` não lança erro em não-2xx;
   - segredos só com `$secrets.get`;
   - log sem nome nem telefone;
   - não declare funções no topo do arquivo: use `require(\`${__hooks}/lib/avisos.js\`)` dentro do handler.
3. **Alterar somente:** as quatro coleções; a rotina e a rota de teste; a tela "Avisos" e o contador; a ativação no app; a importação do script do serviço no `sw.js`.
4. **Não alterar:** as regras de oportunidade da fase 1; o cache da casca do app.
5. **Executar nesta ordem:**
   1. coleções, `gerarAvisos` e a lista "Avisos", sem notificação;
   2. atraso e cópia ao gestor, com as preferências;
   3. configuração do Administrador;
   4. inscrição e envio pelo serviço;
   5. teste em celular real.
6. **Parar e pedir validação quando:**
   - `PUSH_APP_ID` ou `PUSH_API_KEY` não existirem (peça ao Diogo a conta gratuita do OneSignal, CL-PEND-010);
   - o serviço exigir plano pago;
   - o `importScripts` do serviço quebrar o service worker da fase 1.
7. **Estado válido ao parar:** a lista "Avisos" funciona mesmo sem notificação; a rotina não altera nenhuma oportunidade.

## Checklist de execução

- [ ] `gerarAvisos` cria os avisos do dia e de atraso sem repetir.
- [ ] Lista "Avisos" e contador.
- [ ] Atraso com cópia e preferência de desligar.
- [ ] Configuração do Administrador.
- [ ] Notificação pelo serviço, sem vazar entre usuários no mesmo aparelho.
- [ ] Evidências em `05_entregas/fase-2/spec-2-002/`.

## Critérios de aceite

- [ ] **CA-2-06:** entre o horário configurado e 10 minutos depois (padrão 7h00–7h10, Brasília), cada oportunidade aberta com próxima ação no dia gera um aviso ao responsável. O aviso aparece na lista "Avisos" com produtor, ação e link e, no celular inscrito, como notificação com o `texto_curto`.
- [ ] **CA-2-07:** uma ação vencida e não concluída gera aviso de atraso no dia seguinte e a cada 3 dias, com cópia aos usuários Gestão e Administrador ativos da mesma empresa que não desligaram a cópia.
- [ ] **CA-2-08:**
  - rodar a rotina várias vezes no mesmo dia não repete aviso;
  - concluir ou reagendar a ação para os avisos;
  - nenhum aviso vai para usuário de outra empresa;
  - no mesmo aparelho, só o usuário logado recebe.
- [ ] **CA-2-09:**
  - o usuário ativa e desativa a notificação;
  - sem inscrição, o aviso continua na lista;
  - só o Administrador muda o horário, a repetição, a cópia e o `ativo` da sua empresa;
  - cada gestor desliga a própria cópia.

## TDD da SPEC

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | repetição (CA-2-08) | chamar a rota de teste duas vezes com o mesmo `agora` | antes da chave única, dois avisos (falha esperada) | consulta da coleção |
| RED 2 | isolamento (CA-2-08) | com o usuário da Rumo Agro, listar avisos da Agrospy pela API | antes das regras, aparece (falha esperada); depois, 0 | respostas da API |
| GREEN 1 | aviso do dia (CA-2-06) | oportunidade de teste com próxima ação hoje; rota de teste com `agora` = hoje 07:05 | aviso na lista; num navegador de computador inscrito, o service worker recebe a notificação (ou o serviço confirma o aceite) | print + consulta |
| GREEN 2 | atraso e cópia (CA-2-07) | oportunidade de teste vencida ontem, criada por migração de teste (`$app.save`, prefixo "TESTE —"); rota de teste com `agora` = hoje e depois hoje + 3 dias | aviso de atraso ao responsável e cópia ao gestor de teste, nos dois dias | consulta + prints |
| REFACTOR/REGRESSÃO | configuração e falhas (CA-2-09) | (a) desativar a notificação e rodar; (b) inscrição inválida; (c) Gestão tenta mudar a configuração; (d) concluir a ação e rodar no dia seguinte; (e) regressão da carteira da fase 1; (f) gestor com a cópia desligada; (g) entrar como comercial1, ativar, sair, entrar como gestao no mesmo navegador; (h) responsável inativo | (a) só na lista; (b) `falhou_envio` sem perder o aviso; (c) recusado; (d) sem aviso; (e) sem divergência; (f) sem cópia; (g) o aviso do comercial1 não chega; (h) cópia aos gestores | prints + respostas |

**Dados/fixtures:**
- oportunidades de teste de "TESTE — Produtor A" com próxima ação hoje e vencida ontem, criadas pela migração de teste e removidas por uma migração de limpeza ao fechar a SPEC;
- usuários de teste comercial1 e gestao;
- um navegador de computador inscrito, para a prova automática;
- iPhone e Android só no teste humano.

**Caminhos de erro obrigatórios:** sem inscrição, permissão negada, inscrição inválida, rotina repetida, usuário inativo, outra empresa, aparelho compartilhado.
**Evidência exigida:** consultas da coleção `avisos`, respostas da API e prints, em `05_entregas/fase-2/spec-2-002/`.

## Teste humano do cliente

- **Origem:** CL-004.
- **Quem testa:** Diogo e um vendedor.
- **Passos:**
  1. Ativar os avisos no celular, com o app instalado na tela inicial.
  2. Deixar uma oportunidade real com próxima ação para o dia seguinte.
  3. No dia, conferir a notificação das 7h e abrir por ela.
  4. Deixar outra ação vencer e conferir o aviso de atraso e a cópia no celular do Diogo.
- **Resultado esperado:** os avisos chegam no horário, para a pessoa certa, sem expor o produtor na tela bloqueada, e abrem a oportunidade.
- **Evidência do aceite:** "testei, pode seguir" do Diogo ao Maestro, com o print do aviso.

## Handoff e operação

- **Como demonstrar:** aviso do dia → tocar → oportunidade; aviso de atraso com cópia.
- **Como operar depois:** cada pessoa ativa os avisos no próprio celular; o Administrador ajusta horário e cópia.
- **Como monitorar:** avisos em `falhou_envio` e usuários sem inscrição ativa.
- **Pendência conhecida:** no iPhone, só recebe notificação quem instalou o app na tela inicial.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| f20b6ec7-1938-4dcb-a387-1150d0244c68 | Receber os avisos da próxima ação no celular | Agrospy | SPEC-2-002 | CA-2-06 a CA-2-09 | todas as subtasks | evidências das subtasks | fase 1 no ar |
| bdca5efe-1e2d-443f-9cb7-c6a026678524 | Mostrar os avisos do dia dentro do app | Agrospy | SPEC-2-002 | CA-2-06, CA-2-08 | RED 1–2 → GREEN 1 (lista) | consulta + print da lista | fase 1 no ar |
| 4b03eb12-8cf5-42b8-980c-d999ba3a07d9 | Avisar o atraso e mandar cópia ao gestor | Agrospy | SPEC-2-002 | CA-2-07, CA-2-09 | GREEN 2 + REFACTOR (c)(d)(e)(f)(h) | consulta + prints | lista de avisos |
| 2ae01199-220f-446b-982d-6174d2348065 | Ativar as notificações no celular | Agrospy | SPEC-2-002 | CA-2-06, CA-2-08, CA-2-09 | GREEN 1 (envio) + REFACTOR (a)(b)(g) | print da notificação no navegador inscrito | lista de avisos; CL-PEND-010 |
| b33bfdb7-3f63-4454-b031-0b952458dd75 | Testar os avisos no celular | Agrospy | SPEC-2-002 | CA-2-06 a CA-2-09 | teste humano | "testei, pode seguir" + print | tasks anteriores concluídas |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
