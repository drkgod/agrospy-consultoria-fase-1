# SPEC-2-003 — Agente de campo no WhatsApp

**Fase:** 2
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · teste: Diogo
**Origem no escopo:** RQ-002; P1; P2; Fase 2, capacidade "agente de campo no WhatsApp para pós-visita por áudio/texto e para consultar o histórico"; CL-PEND-001; evolução E8
**Degrau da solução:** nativo da plataforma + construção mínima:
- **WhatsApp:** API oficial da Meta (Cloud API) com número dedicado da empresa, recebida por uma rota do backend do Skip;
- **Rascunhos:** a fila da SPEC-2-001;
- **Consultas:** um agente hospedado do Skip com ferramentas de leitura no modo do próprio usuário. Se isso não for possível, funções fixas de consulta (plano B).

## Contexto e decisões fechadas

- **Estado atual:** o pós-visita pode ser gravado no app (SPEC-2-001). Na estrada, a equipe usa o WhatsApp para tudo, e o histórico oficial não pode ficar no WhatsApp.
- **Estado desejado:** o vendedor manda áudio ou texto do pós-visita para o número do agente, e isso vira rascunho para confirmar no app. Ele também pergunta "o que conversei com o produtor X?" ou "minhas ações de hoje" e recebe só o que pode ver.
- **Decisões já fechadas:**
  - **API:** só a oficial da Meta, com número dedicado da empresa. API não oficial não entra.
  - **Com quem o agente fala:** só com a equipe cadastrada, que inicia a conversa. O agente nunca manda mensagem para produtor. Número sem vínculo ativo **não recebe resposta** (pode ser de produtor) e nada é gravado.
  - **Telefone como identidade:**
    - o número de quem escreve é procurado em `vinculos.telefone_whatsapp` dos vínculos ativos;
    - é gravado só com dígitos, no padrão E.164 sem "+" (ex.: `5544998887777`);
    - um hook recusa o número quando ele já está em vínculo ativo de **outro usuário**, em qualquer empresa;
    - a Meta pode mandar `from` sem o 9 depois do DDD (ex.: `554498887777`). Normalize para dígitos e, quando vier `55` + DDD + 8 dígitos, procure também a forma com o 9. Responda para o `from` recebido.
  - **Regras dos vínculos (corrigir antes de criar o campo):** prove pela API que `teste.admin@agrospy.com.br`, Administrador só da Agrospy, não lista nem altera vínculo da Rumo Agro. Se conseguir, crie uma migração nova com:
    - `listRule` e `viewRule` = `@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.acesso_admin.id ?= empresa)`;
    - `updateRule` = `@request.auth.id != '' && @request.auth.acesso_admin.id ?= empresa && @request.body.usuario:isset != true && @request.body.empresa:isset != true`.
  - **Duas empresas:** se o número tem vínculo ativo nas duas, o agente pergunta "Agrospy ou Rumo Agro?" antes de gravar ou responder e guarda a escolha por 12 horas em `conversas_whatsapp`.
  - **Rascunho ou pergunta:**
    - áudio e documento viram rascunho;
    - texto passa por `$ai.chat` (`fast`), que classifica em `pos_visita`, `pergunta` ou `outro`; com dúvida, o agente pergunta "É o registro de uma visita ou uma pergunta?";
    - o rascunho segue a SPEC-2-001 (origem `whatsapp_audio` ou `whatsapp_texto`);
    - nada entra no histórico sem confirmação no app.
  - **Operador:** consulta produtores, mas não cria rascunho, igual ao app. Se mandar pós-visita, recebe "Seu perfil não registra visitas; posso responder perguntas sobre os produtores".
  - **Consultas:** respeitam a matriz de acesso da fase 1, que está na SPEC-2-001. Por padrão, o Comercial consulta todos os produtores da empresa, mas só as próprias visitas e oportunidades; essa regra é confirmada no teste. Usuário de uma empresa nunca recebe dado da outra.
  - **Memória do agente:**
    - a conversa é aberta por `getOrCreateConversation` com a chave `usuario:empresa`, e a memória de uma empresa nunca entra na outra;
    - o agente não tem nenhuma ferramenta de escrita: quem cria o rascunho é o webhook.
- **Bloqueios:** número dedicado, conta Meta Business verificada e acesso para configurar (CL-PEND-001). Sem isso, a construção segue no modo de teste, e o número real só é ligado depois. O plano B do uso é o pós-visita pelo app (SPEC-2-001).

## Resultado observável

Saindo da fazenda, o vendedor manda um áudio de 40 segundos para o número da Agrospy. Na hora chega "Recebi, estou preparando o rascunho" e, em até 10 minutos, "Rascunho da visita ao Produtor X pronto para você confirmar: [link]". Ele toca no link, confere e confirma no app. No iPhone, o link abre no Safari, e a tela do rascunho funciona com o login no navegador. À noite, pergunta "quais minhas ações de amanhã?" e recebe a lista só da carteira dele.

## Limites e dependências

- **Inclui:**
  - correção das regras de `vinculos`;
  - campo `telefone_whatsapp`, cadastrado pelo Administrador na tela de usuários;
  - rota do webhook com verificação e assinatura;
  - registro das mensagens;
  - identificação do usuário e da empresa;
  - classificação do texto;
  - áudio e texto viram rascunho;
  - respostas;
  - consultas de leitura;
  - modo de teste.
- **Fora de escopo:** mensagens para produtores; criar ou alterar registro sem confirmação no app; avisos pelo WhatsApp; grupos; arquivos do Plaud (a SPEC-2-004 trata o envio de arquivo ao agente).
- **Entradas e pré-condições:**
  - SPEC-2-001 aceita;
  - para ligar o número real, CL-PEND-001 resolvido e os segredos `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` e `WHATSAPP_APP_SECRET` no cofre;
  - `WHATSAPP_TOKEN` é um token de Usuário do Sistema, sem validade, com a permissão `whatsapp_business_messaging`; o token temporário do painel vence em 24 horas.
- **Saídas/artefatos:**
  - rota `/backend/v1/whatsapp/webhook`;
  - coleções `mensagens_whatsapp` e `conversas_whatsapp`;
  - agente hospedado (ou as funções do plano B);
  - evidências em `05_entregas/fase-2/spec-2-003/`.
- **Dependências e responsáveis:** Agrospy executa; o Diogo providencia o número e a conta da Meta, cadastra os segredos e autoriza o uso do número; o Administrador cadastra o WhatsApp de cada pessoa; o Diogo faz o teste final.
- **Atores e permissões mínimas:** o agente lê só como o usuário identificado; o webhook grava só rascunhos desse usuário.
- **Superfícies/arquivos/configurações afetadas:** migrações (regras e campo dos vínculos, coleções novas); hook da rota; rotina da SPEC-2-001 (baixar a mídia); definição do agente; tela de usuários; segredos.
- **Risco e plano B:** se a liberação da Meta demorar, o app continua com o pós-visita por áudio. Se o agente hospedado não conseguir ler como o usuário, o plano B são funções fixas (ver instruções).
- **Rollback ou reversão:** desligar o webhook no painel da Meta ou na rota; os rascunhos criados continuam na fila.

## Dados e integrações

**Coleções novas** (todas com regras `null`, porque só o servidor acessa):
- **`mensagens_whatsapp`:** `id_mensagem` (único), `telefone`, `tipo`, `media_id`, `sha256`, `status`, `tentativas`, `resposta` e `criado_em`.
- **`conversas_whatsapp`:** `telefone`, `usuario`, `empresa_escolhida` e `valida_ate`.

**Retenção (padrão proposto; confirmar com a Agrospy no teste):** `mensagens_whatsapp` e `conversas_whatsapp` são apagadas depois de 90 dias pela rotina diária.

| Origem/destino | Contrato | Autenticação | Tempo e repetição | Erro |
|---|---|---|---|---|
| Meta → webhook (GET) | `hub.mode`, `hub.verify_token` e `hub.challenge` | `WHATSAPP_VERIFY_TOKEN` comparado com `$security.equal` | — | token errado → 403 |
| Meta → webhook (POST) | 1. ler o corpo cru uma vez; 2. calcular `$security.hs256(corpoCru, $secrets.get("WHATSAPP_APP_SECRET"))`; 3. comparar com o valor depois de `sha256=` em `X-Hub-Signature-256`, usando `$security.equal`; 4. só então `JSON.parse`. A rota é pública: a assinatura é a autenticação | assinatura | grava em `mensagens_whatsapp`; `id_mensagem` repetido responde 200 e nada é refeito | assinatura inválida → 401; payload sem `messages` (ex.: `statuses`) → 200 e ignora |
| Webhook → resposta | pergunta de texto é respondida na mesma chamada; áudio e arquivo recebem na hora "Recebi, estou preparando o rascunho"; outros tipos recebem "Por aqui eu recebo áudio, texto ou arquivo da gravação" | `WHATSAPP_TOKEN` | 2 tentativas | falha registrada sem dado pessoal |
| Rotina de 10 min (SPEC-2-001) → mídia da Meta | GET `/{media-id}` e depois a `url` com o token; cria o rascunho e manda o link | `WHATSAPP_TOKEN` | até 3 tentativas | download falhou: rascunho `falhou`, motivo `download_midia`, aviso ao usuário |
| Webhook → `rascunhos` | `chave_dedup` = `id_mensagem`; `hash_conteudo` = `sha256` da Meta (em base64); `autor` = usuário; `empresa` = empresa da sessão | identificação pelo telefone | índices únicos da SPEC-2-001 | — |
| Agente → coleções da fase 1 | leitura de produtores, propriedades, visitas, oportunidades e ações da empresa da sessão | ferramentas `actAs: user` | timeout de 30 s | "não consegui consultar agora, tente de novo" |

**Modo de teste (antes da conta da Meta):**
- o executor cadastra `WHATSAPP_APP_SECRET` com um valor de teste e `WHATSAPP_MODO_TESTE = sim`;
- a resposta fica em `mensagens_whatsapp.resposta`, sem chamar a Meta;
- o `media_id` de teste aponta para um arquivo em `05_entregas/fase-2/fixtures/`;
- ao ligar o número real, o Diogo troca o segredo, e o modo de teste é desligado;
- o número de teste do painel da Meta pode provar a ida e a volta antes do número dedicado.

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-41 | número sem vínculo ativo | sem resposta; nada gravado além do registro técnico da mensagem; conta no monitor de desconhecidos | — | regra de não falar com produtor |
| RN-42 | vínculo ativo nas duas empresas | pergunta a empresa e guarda por 12 horas | — | P2 |
| RN-43 | áudio, documento ou texto classificado como `pos_visita` | rascunho e resposta com link | texto classificado como `pergunta` vai para a consulta | RQ-002 |
| RN-44 | consulta | só o que o usuário pode ver na empresa da sessão; sem dado, diz que não encontrou | nunca cita a outra empresa | P2, P6 |
| RN-45 | mensagem repetida pela Meta | um único rascunho | — | idempotência |
| RN-46 | Operador manda pós-visita | resposta explicando que o perfil não registra visitas; nada gravado | consulta permitida | matriz da fase 1 |

## Fluxo e regras

1. Antes de tudo, prove e, se preciso, corrija as regras de `vinculos`. Depois o Administrador cadastra o WhatsApp de cada pessoa na tela de usuários.
2. A mensagem chega → a assinatura é conferida → a mensagem é gravada → o usuário e a empresa são identificados.
3. Pergunta: o agente responde na hora. Pós-visita: o "Recebi" sai na hora, e a rotina baixa a mídia, cria o rascunho e manda o link.
4. O rascunho segue a SPEC-2-001 e é confirmado no app pelo link.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | áudio de vendedor cadastrado | "Recebi" na hora e o link em até 10 minutos | — |
| Principal | "minhas ações de hoje" | lista das próprias ações | — |
| Limite | `from` sem o 9 | identifica o usuário | — |
| Limite | usuário nas duas empresas | pergunta a empresa | vale por 12 h |
| Falha | número desconhecido | sem resposta, nada gravado | — |
| Falha | Meta reenvia a mesma mensagem | um rascunho só | `id_mensagem` |
| Falha | POST sem assinatura válida | 401 | — |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; a SPEC-2-001 (fila, rotina e matriz de acesso); as regras atuais de `vinculos` no Skip; os guias de hooks, de IA e de agentes do Skip.
2. **Contexto técnico do Skip:** o mesmo da SPEC-2-001. Em particular:
   - o handler não responde e continua processando depois, por isso o processamento pesado fica na rotina;
   - leia o corpo cru antes de qualquer `JSON.parse`;
   - log sem telefone, nome ou texto.
3. **Alterar somente:** as regras e o campo de `vinculos`; as duas coleções novas; a rota; a etapa de mídia na rotina; o agente ou as funções do plano B; a tela de usuários.
4. **Não alterar:** as regras das demais coleções da fase 1; nunca dar ao agente ferramenta de escrita nem modo admin; nunca enviar mensagem a produtor.
5. **Executar nesta ordem:**
   1. regras de `vinculos` e campo do WhatsApp;
   2. rota com verificação e assinatura, no modo de teste;
   3. identificação, número desconhecido e Operador;
   4. pós-visita vira rascunho;
   5. consultas;
   6. ligação do número real e teste com a equipe.
6. **Plano B das consultas** (se o agente hospedado não conseguir ler como o usuário):
   - sem agente hospedado, as consultas viram funções fixas do hook: "minhas ações de hoje, amanhã e da semana", "visitas e oportunidades do produtor X" e "dados do produtor X";
   - cada função filtra pelas mesmas condições das regras da fase 1 para o usuário e a empresa;
   - o `$ai.chat` só escolhe a função e escreve a resposta;
   - o RED 2 vale igual.
7. **Parar e pedir validação quando:**
   - faltar o número, a conta da Meta ou os segredos (CL-PEND-001): siga no modo de teste e pare só na ligação do número real;
   - **antes de apontar o webhook da Meta e mandar a primeira resposta real: o Diogo autoriza o uso do número**;
   - a Meta pedir pagamento ou uma verificação que dependa do Diogo.
8. **Estado válido ao parar:** o app e o pós-visita por áudio continuam funcionando; sem o número real, a rota só aceita mensagens de teste assinadas.

## Checklist de execução

- [ ] Regras de `vinculos` provadas (e corrigidas, se preciso).
- [ ] WhatsApp de cada pessoa cadastrado, sem número repetido.
- [ ] Rota com verificação, assinatura e registro das mensagens.
- [ ] Número desconhecido sem resposta; Operador sem rascunho.
- [ ] Pós-visita vira rascunho com link.
- [ ] Consultas respeitam empresa e perfil, com memória separada.
- [ ] Número real ligado com a autorização do Diogo.
- [ ] Evidências em `05_entregas/fase-2/spec-2-003/`, com telefones mascarados.

## Critérios de aceite

- [ ] **CA-2-10:** áudio ou texto de pós-visita enviado ao número do agente por um usuário cadastrado vira rascunho na fila desse usuário, na empresa certa. A confirmação de recebimento chega na hora, e o link do rascunho em até 10 minutos.
- [ ] **CA-2-11:** mensagem de número sem vínculo ativo não recebe resposta e não grava rascunho; o mesmo vale para vínculo inativo.
- [ ] **CA-2-12:** perguntas sobre o histórico respondem só com dados que o usuário pode ver na empresa da sessão. Um usuário só da Rumo Agro nunca recebe dado da Agrospy, e um Administrador de uma empresa não lista nem altera vínculo da outra.
- [ ] **CA-2-13:** a mesma mensagem recebida duas vezes cria um único rascunho. Se o download da mídia falhar, o rascunho fica `falhou` com o motivo `download_midia` e o usuário é avisado. Se a transcrição falhar, o áudio fica guardado.
- [ ] **CA-2-14:** chamada à rota sem assinatura válida da Meta é recusada com 401, e o agente não tem nenhuma ferramenta de escrita.

## TDD da SPEC

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | assinatura (CA-2-14) | POST de teste sem assinatura e com assinatura errada | antes da verificação, processa (falha esperada); depois, 401 | respostas |
| RED 2 | isolamento (CA-2-12) | mensagem simulada do número de teste da Rumo Agro perguntando por "TESTE — Produtor A" da Agrospy | antes das regras, responde com dado (falha esperada); depois, "não encontrei" | `mensagens_whatsapp.resposta` |
| RED 3 | vínculos (CA-2-12) | com teste.admin, listar vínculos da Rumo Agro e dar PATCH com telefone no vínculo de um usuário de teste da Rumo Agro; cadastrar o mesmo número em dois usuários | 0 registros e 403/404; o segundo cadastro é recusado | respostas da API |
| GREEN 1 | pós-visita (CA-2-10) | mensagens simuladas assinadas, com áudio de teste e texto de pós-visita, do número de teste do comercial1 | "Recebi"; dois rascunhos na fila do comercial1; links na resposta | consulta + respostas |
| GREEN 2 | desconhecido, duplicado e formato (CA-2-11, CA-2-13) | número não cadastrado; a mesma mensagem duas vezes; `from` sem o 9 para o comercial1; mídia de teste inexistente | sem resposta e nada gravado; um rascunho só; identifica o comercial1; `falhou` com `download_midia` | consultas |
| REFACTOR/REGRESSÃO | consultas e regras | (b) `teste.multi` (vínculo nas duas empresas) pergunta; (c) Operador manda pós-visita; (d) regressão da SPEC-2-001; (e) com `teste.multi`, perguntar na Agrospy, trocar para a Rumo Agro e perguntar de novo; (f) `skip_cloud_describe_agent` mostra só ferramentas de leitura com `actAs: user`; (g) vínculo inativo manda mensagem | (b) pergunta a empresa; (c) explica e não grava; (d) sem divergência; (e) a resposta não cita a Agrospy; (f) ok; (g) sem resposta | respostas + descrição do agente |

**Dados/fixtures:**
- números de teste cadastrados nos vínculos de comercial1, gestao e operador, do usuário da Rumo Agro e do `teste.multi`;
- `teste.multi@agrospy.com.br`: usuário de teste com vínculo Comercial nas duas empresas, criado por migração de teste se não existir e desativado na limpeza do fim da fase (SPEC-2-004);
- mensagens simuladas no formato da Meta, assinadas com o segredo de teste;
- áudio de teste da SPEC-2-001.

**Caminhos de erro obrigatórios:** assinatura inválida, número desconhecido, vínculo inativo, duas empresas, mensagem repetida, `from` sem o 9, falha ao baixar a mídia, pergunta sobre a outra empresa, Operador.
**Evidência exigida:** respostas da rota, consultas e prints do WhatsApp no celular (no teste humano), com telefones mascarados, em `05_entregas/fase-2/spec-2-003/`.

## Teste humano do cliente

- **Origem:** CL-004.
- **Quem testa:** Diogo e um vendedor.
- **Passos:**
  1. Com a autorização do Diogo, ligar o número real.
  2. O vendedor manda um áudio real de pós-visita e confirma o rascunho pelo link.
  3. O vendedor pergunta "minhas ações de amanhã".
  4. O Diogo pergunta por um produtor da Rumo Agro, escolhendo a empresa.
  5. Confirmar com o Diogo se o Comercial deve continuar consultando o cadastro de todos os produtores da empresa ou só da própria carteira.
  6. Confirmar com o Diogo o prazo de guarda das mensagens (90 dias).
- **Resultado esperado:** o áudio vira rascunho, as respostas vêm certas e nada de outra empresa aparece.
- **Evidência do aceite:** "testei, pode seguir" do Diogo ao Maestro. As respostas sobre a regra do Comercial e o prazo de guarda vão para o changelog. Se ele quiser mudar a regra do Comercial, isso vira emenda do consultor, não mudança feita no teste.

## Handoff e operação

- **Como demonstrar:** áudio → "Recebi" → link → confirmar no app; pergunta → resposta.
- **Como operar depois:** o Administrador cadastra o WhatsApp de quem entra e desativa o vínculo de quem sai.
- **Como monitorar:** mensagens de números desconhecidos e rascunhos em `falhou` vindos do WhatsApp.
- **Pendência conhecida:** resposta de texto dentro da janela de 24 horas aberta pelo usuário não é cobrada pela Meta (conferir a tabela vigente).

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| 94aab9cf-6731-4eb7-b37a-517dffac342c | Usar o agente de campo no WhatsApp | Agrospy | SPEC-2-003 | CA-2-10 a CA-2-14 | todas as subtasks | evidências das subtasks | SPEC-2-001 aceita |
| 864c6848-16e6-48d3-9538-53abe6a9f91c | Cadastrar o WhatsApp da equipe e receber mensagens de teste | Agrospy | SPEC-2-003 | CA-2-11, CA-2-12 (vínculos), CA-2-14 | RED 1, RED 3 → GREEN 2 (desconhecido) + REFACTOR (c)(g) | respostas da rota e da API | SPEC-2-001 aceita |
| c504f635-645d-4304-8f81-88ae6f1149f5 | Receber o pós-visita pelo WhatsApp como rascunho | Agrospy | SPEC-2-003 | CA-2-10, CA-2-13 | GREEN 1–2 | consulta da fila + respostas | mensagens de teste funcionando |
| 09510a74-c541-4d88-adb1-6c2be8d3b9c5 | Responder perguntas sobre o histórico pelo WhatsApp | Agrospy | SPEC-2-003 | CA-2-12, CA-2-14 | RED 2 → GREEN + REFACTOR (b)(e)(f) | respostas + descrição do agente | mensagens de teste funcionando |
| fcbe8d32-044e-4881-9a7b-4d07f85687fa | Testar o agente do WhatsApp com a equipe | Agrospy | SPEC-2-003 | CA-2-10 a CA-2-14 | teste humano + REFACTOR (d) | "testei, pode seguir" + prints | tasks anteriores; CL-PEND-001; autorização do Diogo |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
