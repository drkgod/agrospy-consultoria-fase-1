# SPEC-2-001 — Pós-visita por áudio no app, com fila de rascunhos

**Fase:** 2
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · teste: Diogo
**Origem no escopo:** RQ-002; P1; Fase 2, capacidades "fila de rascunhos" e captura em campo; evoluções E1 e E2 da fase 1
**Degrau da solução:** reuso + nativo da plataforma:
- **Reuso:** a gravação de áudio e a fila sem internet da fase 1;
- **Nativo:** a IA do Skip organiza o rascunho;
- **Externo, só se preciso:** um serviço de transcrição, caso o Skip não transcreva áudio.

## Contexto e decisões fechadas

- **Estado atual:** na visita, o app já grava áudio e anexa arquivo (campo `audio` em `visitas`, até 25 MB). Também transcreve por ditado ao vivo. Ele não transcreve um áudio já gravado, e sem internet o áudio fica bloqueado com aviso. O vendedor preenche o formulário à mão.
- **Estado desejado:** o vendedor grava o pós-visita falando, mesmo sem sinal. O sistema transcreve e monta um rascunho com produtor, assuntos, destino da visita e oportunidade com próxima ação. O vendedor confere, corrige e confirma; só então a visita entra no histórico.
- **Decisões já fechadas:**
  - **Rascunho:** nunca vira registro oficial sem confirmação de uma pessoa. A IA só sugere, e o servidor valida tudo o que ela devolve.
  - **Produtor:** a IA não cria produtor. Se não reconhecer o produtor entre os que o autor pode usar, o rascunho pede para escolher ou cadastrar antes de confirmar.
  - **Confirmação pela API normal da fase 1:** o app grava a visita, a oportunidade e a ação com o token de quem confirma. Assim valem todas as regras e os hooks da fase 1. O servidor nunca cria a visita com `$app.save`.
  - **Transcrição:**
    - primeiro, o recurso de IA do Skip, se ele transcrever áudio;
    - se não, o Groq (`whisper-large-v3`, plano gratuito), com o endpoint `/openai/v1/audio/transcriptions` e `language=pt`;
    - a chave fica no cofre do Skip, no segredo `TRANSCRICAO_API_KEY`, criada pelo Diogo (CL-PEND-009).
  - **Organização do rascunho:** `$ai.chat` do Skip com o alias `fast` e resposta só em JSON.
  - **Quem cria rascunho:** Administrador, Gestão e Comercial, como para visitas na fase 1. O Operador não cria.
  - **Fila única:** esta SPEC cria a fila que as SPECs 2-003 (WhatsApp) e 2-004 (gravações) também usam.
  - **Formulário de visita da fase 1:** continua igual. O áudio sem internet entra por "Gravar pós-visita", e o anexo de áudio do formulário continua pedindo internet.
- **Matriz de acesso da fase 1 (vale para toda a fase 2):** as regras estão nas migrações da fase 1, como `0024_regras_acesso_padrao_casa.js`. Confira as regras vigentes no Skip antes de alterar.

  | Recurso | Administrador | Gestão | Comercial | Operador |
  |---|---|---|---|---|
  | Consultar produtores e propriedades | todos | todos | todos | todos |
  | Criar visita para um produtor | todos | todos | só produtor em que ele é o responsável | não |
  | Ver visitas | todas | todas | da própria carteira e as que registrou | não |
  | Oportunidades e ações | todas | todas | só as próprias | não |
  | Usuários, perfis e linhas de negócio | sim | não | não | não |

- **Bloqueios:** se o Skip não transcrever áudio e a chave do Groq ainda não estiver no cofre, a gravação, a fila e a revisão funcionam, e o rascunho fica em `aguardando_transcricao`.

## Resultado observável

O vendedor sai da propriedade sem sinal, toca em "Gravar pós-visita" e fala 1 minuto. O app mostra "1 gravação aguardando envio". Com sinal, o rascunho aparece em "Rascunhos" com o produtor, os assuntos e a oportunidade com próxima ação e data, em geral em até 2 minutos e no máximo em 10. Ele toca em "Confirmar", e a visita aparece na ficha do produtor com o áudio anexado.

## Limites e dependências

- **Inclui:**
  - coleção de rascunhos e tela "Rascunhos";
  - botão "Gravar pós-visita" na tela inicial e na ficha do produtor;
  - gravação e envio sem internet;
  - transcrição e proposta pela IA;
  - confirmar, corrigir e descartar;
  - "Tentar de novo" quando falhar;
  - limpeza automática de áudios antigos.
- **Fora de escopo:**
  - WhatsApp (SPEC-2-003);
  - arquivos do Plaud e da pasta do Drive (SPEC-2-004);
  - avisos (SPEC-2-002);
  - editar visita antiga pelo rascunho;
  - IA que conversa ou decide.
- **Entradas e pré-condições:** fase 1 no ar; CL-PEND-009 só se o Skip não transcrever.
- **Saídas/artefatos:**
  - coleção `rascunhos`;
  - rotas `/backend/v1/rascunhos/{id}/processar` e `/backend/v1/rascunhos/{id}/confirmar`;
  - rotina de 10 minutos;
  - tela "Rascunhos";
  - fixtures e evidências em `05_entregas/fase-2/`.
- **Dependências e responsáveis:** Agrospy executa; o Diogo cria a conta gratuita do Groq e cadastra a chave, se for preciso; o Diogo faz o teste final.
- **Atores e permissões mínimas:** a matriz acima e as regras desta SPEC.
- **Superfícies/arquivos/configurações afetadas:**
  - migrações e hooks novos;
  - `hooks/lib/rascunhos.js`;
  - frontend: tela "Rascunhos", botão de gravar e `src/services/fila-offline.ts` para áudio;
  - segredo `TRANSCRICAO_API_KEY`, se necessário.
- **Risco e plano B:** se a transcrição errar nomes, o texto transcrito fica visível ao lado da proposta para corrigir. Se o serviço sair do ar, o rascunho fica `falhou` com "Tentar de novo" e o áudio não se perde.
- **Rollback ou reversão:** esconder o botão e a tela; nenhuma visita já confirmada é afetada.

## Dados e integrações

**Coleção `rascunhos`:**
- `empresa`, `autor` (usuário) e `origem` (`app_audio`; as SPECs 2-003 e 2-004 usam `whatsapp_audio`, `whatsapp_texto`, `arquivo_gravador` e `drive`).
- `midia`: arquivo de áudio até 25 MB, `protected: true`; o app usa token de arquivo para tocar.
- `texto_original`: quando já vier texto.
- `chave_dedup`: idempotência da porta, única:
  - `id_local` no app;
  - `messages[].id` no WhatsApp;
  - id do arquivo no Drive.
- `hash_conteudo`: SHA-256 do conteúdo em base64, único por empresa quando preenchido:
  - no app, calculado no aparelho com `crypto.subtle.digest` antes de entrar na fila;
  - no WhatsApp, o `sha256` que a Meta manda;
  - no Drive, o `sha256Checksum` convertido de hex para base64;
  - texto digitado no WhatsApp não tem hash.
- `id_local` e `criado_em_aparelho`.
- `status`: `recebido`, `aguardando_transcricao`, `transcrevendo`, `pronto_para_revisar`, `confirmado`, `descartado` ou `falhou`.
- `transcricao`, `proposta` (JSON, formato abaixo), `produtor` (opcional), `motivo_falha` e `tentativas`.
- `visita_criada`, `confirmado_por` e `confirmado_em`.

**Regras de acesso** (padrão da fase 1, com `@request.auth.acesso_*`; nunca regra vazia `""`):
- **list/view:** `@request.auth.id != '' && (autor = @request.auth.id || @request.auth.acesso_gestao.id ?= empresa || @request.auth.acesso_admin.id ?= empresa)`.
- **create:** `@request.auth.id != '' && @request.body.autor = @request.auth.id && (@request.auth.acesso_admin.id ?= @request.body.empresa || @request.auth.acesso_gestao.id ?= @request.body.empresa || @request.auth.acesso_comercial.id ?= @request.body.empresa)`.
- **update:** a mesma condição da leitura. Um hook de request recusa mudança em `empresa`, `autor`, `origem`, `midia`, `chave_dedup`, `hash_conteudo`, `status`, `transcricao`, `visita_criada`, `confirmado_por` e `confirmado_em`, que só o servidor muda.
- **delete:** `null`.

**Formato da proposta** (os valores seguem a fase 1, migração `0021_visitas.js`):
- `produtor` e `propriedade`: ids que o autor pode usar, ou vazio.
- `data`: padrão é o dia de `criado_em_aparelho`.
- `assuntos_tratados`.
- `destino`: `nova_oportunidade`, `oportunidade_atualizada` ou `sem_oportunidade`.
  - Com `nova_oportunidade`: `oportunidades[]`, cada uma com {`linha_negocio` ativa da empresa, `descricao`, `proxima_acao`, `proxima_acao_data`}.
  - Com `oportunidade_atualizada`: `oportunidade` (aberta, do produtor, editável pelo autor), `resultado`, `nova_acao` e `nova_data`, gravados como ação `concluida`.
  - Com `sem_oportunidade`: `motivo_sem_oportunidade`, com os valores `sem_interesse_agora`, `sem_perfil`, `atendido_por_concorrente` ou `outro`.
- `campos_incertos`: lista do que ficou incerto.

| Origem/destino | Contrato | Autenticação | Tempo e repetição | Erro |
|---|---|---|---|---|
| App → `rascunhos` | a fila da fase 1 envia o item com `id_local` e `hash_conteudo` | token do usuário | conflito em `chave_dedup` ou `hash_conteudo` devolve o rascunho existente e não cria outro | duplicado de outro usuário: "Esta gravação já foi enviada por outra pessoa da empresa", sem abrir o rascunho alheio; a fila trata como enviado |
| App → `POST /backend/v1/rascunhos/{id}/processar` | o app chama logo depois de criar | token do autor | a rota só segue se conseguir mudar `recebido` para `transcrevendo`; transcreve e monta a proposta na mesma chamada | falha: `tentativas + 1` e volta para `recebido` |
| Rotina `cronAdd("*/10 * * * *")` | pega rascunhos em `recebido`, ou `transcrevendo` há mais de 15 min, com `tentativas < 3`, um por execução | servidor | depois da 3ª falha, `falhou` | `motivo_falha` com a classe do erro, sem dados pessoais |
| Transcrição | Skip, se transcrever; senão Groq por `$http.send` com `multipart/form-data` | `TRANSCRICAO_API_KEY` no cofre | timeout de 60 s | `$http.send` não lança erro em não-2xx: confira `statusCode` |
| Proposta | `$ai.chat` (`fast`) só em JSON; a transcrição vai como dado, entre delimitadores; a lista de produtores e linhas enviada é só a que o autor pode usar | servidor | timeout de 30 s | ver a validação abaixo |
| Confirmação | o app grava pela API da fase 1 e chama `POST /backend/v1/rascunhos/{id}/confirmar` com o id da visita | token de quem confirma | a visita usa `id_local = "rasc-<id do rascunho>"` (o índice único impede segunda visita), as oportunidades usam `"rasc-<id>-<n>"` e a ação usa `"rasc-<id>-a"` | ver o fluxo |

**Validação da proposta no servidor, antes de gravar:**
- os ids precisam existir na empresa e no conjunto que o autor pode usar;
- a linha de negócio precisa estar ativa;
- a data precisa ser válida e não pode ser anterior ao dia do registro;
- os valores de lista precisam ser os da fase 1;
- campo fora do formato é descartado;
- item inválido fica vazio e entra em `campos_incertos`;
- o modelo nunca grava id nem status.

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-29 | rascunho criado | visível só ao autor e a Gestão/Administrador da mesma empresa | — | P2, P6 |
| RN-30 | confirmar | só o autor ou Gestão/Administrador. `responsavel_visita` = autor; `confirmado_por` = quem confirmou | — | P6 |
| RN-31 | produtor | o conjunto usado na proposta e na escolha manual é o que o autor pode usar: para o Comercial, os produtores em que ele é o responsável; para Gestão/Administrador, todos da empresa | produtor fora do conjunto conta como "não reconhecido" | matriz da fase 1 |
| RN-32 | descartar | pede confirmação; `descartado`; não entra no histórico | — | RQ-002 |
| RN-33 | repetição | um rascunho por `chave_dedup` e por `hash_conteudo` na empresa | — | escopo, fase 2 |
| RN-34 | sem internet | a gravação entra na fila do aparelho com `id_local` e sobe ao voltar | — | evolução E1 |
| RN-35 | Operador | não grava pós-visita nem vê "Rascunhos" | — | matriz da fase 1 |
| RN-50 | retenção (padrão proposto; confirmar com a Agrospy no teste) | a rotina diária tira `midia`, `transcricao` e `texto_original` de rascunhos `descartado` ou `falhou` há mais de 30 dias; o rascunho `confirmado` perde `midia` depois que o áudio é copiado para `visitas.audio` | — | P1 (práticas de privacidade da Agrospy) |

## Fluxo e regras

1. O vendedor toca em "Gravar pós-visita", grava e toca em "Enviar". Na ficha do produtor, o produtor já vem sugerido.
2. Sem internet, a gravação fica na fila como "aguardando envio". Com internet, cria o rascunho `recebido` e o app chama a rota de processar.
3. A rota transcreve, monta e valida a proposta e deixa o rascunho `pronto_para_revisar`. Se falhar, a rotina de 10 minutos tenta de novo.
4. Em "Rascunhos", o vendedor vê o texto transcrito, a proposta e os campos incertos marcados. Corrige o que precisar e toca em "Confirmar" ou "Descartar".
5. Ao confirmar:
   1. o app grava, com o token do usuário e pela API da fase 1, a visita, as oportunidades e a ação;
   2. depois chama a rota de confirmar;
   3. a rota confere a empresa, o `id_local` e se o status é `pronto_para_revisar`;
   4. copia `midia` para `visitas.audio` e grava `confirmado`, `visita_criada`, `confirmado_por` e `confirmado_em`;
   5. se o rascunho já estiver confirmado, devolve a visita existente.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | áudio citando produtor da carteira e próxima ação | rascunho pronto; confirmado vira visita com áudio | — |
| Limite | áudio sem citar produtor | rascunho pede o produtor | — |
| Limite | sem internet | gravação na fila; sobe uma vez | duplicado é tratado como enviado |
| Falha | transcrição fora | `falhou` depois de 3 tentativas, com "Tentar de novo" | áudio guardado |
| Falha | confirmar duas vezes | uma visita só | índice único de `id_local` |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; as coleções `visitas`, `oportunidades`, `acoes_oportunidade`, `produtores` e `linhas_negocio` e os hooks da fase 1; `src/services/fila-offline.ts`; os guias de hooks e de IA (`$ai`) do Skip.
2. **Contexto técnico do Skip (PocketBase v0.36 em goja):**
   - `cronAdd` roda em UTC, com intervalo mínimo de 10 minutos.
   - Brasília é UTC−3 fixo, e o runtime não tem `Intl`.
   - Validação com usuário fica em hook de request. `$app.save` feito por hook não passa pelas regras de API nem pelos hooks de request da fase 1.
   - `$http.send` não lança erro em não-2xx: confira `statusCode` e use `res.json`.
   - Não declare funções no topo do arquivo: use `require(\`${__hooks}/lib/<arquivo>.js\`)` dentro do handler.
   - `e.record.original()` não existe: leia o estado anterior com `$app.findRecordById`.
   - Compare tokens com `$security.equal`; segredos só com `$secrets.get`.
   - Log nunca leva nome, telefone, texto transcrito nem token.
3. **Alterar somente:** a coleção `rascunhos` e as regras; as rotas e a rotina; a tela "Rascunhos"; o botão "Gravar pós-visita"; a fila sem internet para áudio.
4. **Não alterar:** as regras e validações de visitas e oportunidades da fase 1; dados já confirmados; nunca criar produtor nem visita pelo servidor.
5. **Executar nesta ordem:**
   1. coleção e regras, com um rascunho criado à mão;
   2. revisão, confirmação e descarte, usando esse rascunho;
   3. envio de áudio online, transcrição e proposta;
   4. áudio sem internet;
   5. falhas, repetição e retenção;
   6. teste no celular.
6. **Parar e pedir validação quando:**
   - o Skip não transcrever áudio e `TRANSCRICAO_API_KEY` não existir (peça ao Diogo a conta gratuita do Groq e a chave no cofre, CL-PEND-009);
   - o Groq exigir plano pago;
   - `$http.send` não conseguir enviar `multipart/form-data` com o áudio;
   - a rota de processar passar do limite de tempo do Skip (registre a duração e deixe só a rotina processar);
   - o runtime não conseguir copiar o arquivo para `visitas.audio` (não reenvie o áudio pelo celular).
7. **Estado válido ao parar:** o registro manual da fase 1 continua funcionando; rascunho não confirmado não aparece no histórico.

## Checklist de execução

- [ ] Coleção `rascunhos` com as regras desta SPEC.
- [ ] Revisão, confirmação e descarte pela API da fase 1.
- [ ] Áudio enviado vira rascunho com proposta validada.
- [ ] Gravação sem internet sobe uma vez.
- [ ] Falhas, repetição e retenção tratadas.
- [ ] Evidências em `05_entregas/fase-2/spec-2-001/`.

## Critérios de aceite

- [ ] **CA-2-01:** uma gravação feita sem internet aparece como "aguardando envio" e, ao reconectar, vira exatamente um rascunho no servidor.
- [ ] **CA-2-02:** em até 10 minutos depois do envio, o rascunho mostra o texto transcrito e a proposta, com:
  - produtor que o autor pode usar, ou o pedido para escolher;
  - assuntos;
  - destino;
  - próxima ação com data.

  Os campos que a IA não identificou ficam vazios e marcados.
- [ ] **CA-2-03:** confirmar cria a visita com o áudio, e a oportunidade e a ação quando houver, pelas regras da fase 1. Descartar não cria nada. Rascunho confirmado ou descartado não gera uma segunda visita.
- [ ] **CA-2-04:** o rascunho só é visto e confirmado pelo autor e por Gestão/Administrador da mesma empresa. Um usuário da outra empresa não lista nem abre o rascunho, nem pela API. Os campos controlados pelo servidor não mudam pela API.
- [ ] **CA-2-05:** o mesmo áudio enviado de novo não cria segundo rascunho. A falha na transcrição deixa o rascunho em `falhou`, com "Tentar de novo" e o áudio guardado.

## TDD da SPEC

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | acesso (CA-2-04) | com o usuário de teste da Rumo Agro, listar e abrir um rascunho da Agrospy; com o autor, tentar mudar `status` pela API | antes das regras, aparece e muda (falha esperada); depois, 0 registros e 404, e a mudança é recusada | respostas da API |
| RED 2 | repetição (CA-2-05) | enviar duas vezes `pos-visita-teste.m4a` | antes do índice único, dois rascunhos (falha esperada) | respostas da API |
| GREEN 1 | áudio → rascunho (CA-2-02) | enviar `pos-visita-teste.m4a` com o usuário comercial1 | rascunho `pronto_para_revisar` com "TESTE — Produtor A", assuntos e a próxima ação na data do roteiro | print + registro |
| GREEN 2 | confirmar e descartar (CA-2-03) | confirmar um rascunho; descartar outro; repetir a confirmação do primeiro | uma visita com áudio, oportunidade e ação; nada do descartado; a repetição devolve a mesma visita | consulta das coleções |
| GREEN 3 | sem internet (CA-2-01) | no navegador do executor, desligar a rede pela ferramenta de teste, gravar com o áudio de teste e religar | "aguardando envio" e depois um único rascunho | gravação da tela + consulta |
| REFACTOR/REGRESSÃO | falhas e fase 1 | (a) chave de transcrição inválida e "Tentar de novo"; (b) `pos-visita-sem-produtor.m4a`; (c) o Operador tenta abrir "Rascunhos"; (d) duplicado enviado por outro usuário; (e) a rotina de retenção num rascunho descartado de teste; (f) registro manual de visita da fase 1 | (a) `falhou` e depois ok; (b) pede produtor; (c) bloqueado; (d) mensagem sem abrir o rascunho alheio; (e) mídia removida; (f) sem regressão | prints + respostas |

**Dados/fixtures:** áudios em `05_entregas/fase-2/fixtures/` (`pos-visita-teste.m4a` e `pos-visita-sem-produtor.m4a`), gerados por voz sintética. Exemplo no macOS: `say -v Luciana -o a.aiff "<roteiro>"` e depois `afconvert -f m4af -d aac a.aiff pos-visita-teste.m4a`.
- **Roteiro:** "Visita ao TESTE — Produtor A. Falamos de sementes de pastagem. Volto dia <data 7 dias à frente> para levar a proposta."
- **Sem voz sintética:** pare e peça ao Diogo um áudio de 1 minuto lendo o roteiro.
- **Carteira de teste:** "TESTE — Produtor A" fica na carteira de `teste.comercial1@agrospy.com.br`; crie se não existir.
- **Usuários:** os de teste da fase 1 (comercial1, gestao, operador da Agrospy e o usuário da Rumo Agro).

**Caminhos de erro obrigatórios:** sem internet, transcrição fora, áudio repetido, duplicado de outro usuário, produtor não reconhecido, permissão negada, Operador, mudança de campo do servidor.
**Evidência exigida:** respostas da API, prints do rascunho e da visita confirmada e gravação da tela, em `05_entregas/fase-2/spec-2-001/`.

## Teste humano do cliente

- **Origem:** CL-004.
- **Quem testa:** Diogo, com um vendedor.
- **Passos:**
  1. Depois de uma visita real, gravar o pós-visita no app, de preferência com o celular sem sinal.
  2. Com sinal, abrir "Rascunhos", conferir, corrigir e confirmar.
  3. Abrir a ficha do produtor.
  4. Confirmar com o Diogo o prazo de guarda dos áudios (RN-50).
- **Resultado esperado:** a visita aparece com o áudio, a oportunidade e a próxima ação, sem digitar o formulário inteiro.
- **Evidência do aceite:** "testei, pode seguir" do Diogo ao Maestro, com o print da visita e a resposta sobre o prazo de guarda registrada no changelog.

## Handoff e operação

- **Como demonstrar:** gravar → rascunho → confirmar → ficha do produtor.
- **Como operar depois:** revisar os rascunhos no fim do dia; nada entra no histórico sem confirmação.
- **Como monitorar:** rascunhos em `falhou`, ou parados em `pronto_para_revisar` há mais de 2 dias.
- **Pendência conhecida:**
  - a precisão da transcrição depende do áudio;
  - o campo `visitas.audio` da fase 1 não é protegido por login; a proteção fica para o consultor decidir.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| c72f5276-6770-4bfe-ba35-9092ad2ee556 | Registrar o pós-visita por áudio no app | Agrospy | SPEC-2-001 | CA-2-01 a CA-2-05 | todas as subtasks | evidências das subtasks | fase 1 no ar |
| 0b522b2b-8c1b-4166-9c07-6f600881ed75 | Criar a fila de rascunhos para revisar o pós-visita | Agrospy | SPEC-2-001 | CA-2-04 | RED 1 → GREEN de acesso | respostas da API | fase 1 no ar |
| 68c2ec27-c5c8-490a-8048-1255343383d7 | Confirmar, corrigir ou descartar o rascunho | Agrospy | SPEC-2-001 | CA-2-03 | GREEN 2 + REFACTOR (c)(f) | consulta das coleções | fila de rascunhos (rascunho criado à mão) |
| 5f42475d-2083-49e8-9153-c0ded8096569 | Transformar o áudio gravado em rascunho de visita | Agrospy | SPEC-2-001 | CA-2-02, CA-2-05 | RED 2 → GREEN 1 + REFACTOR (a)(b)(d) | print do rascunho + respostas | fila de rascunhos; transcrição disponível |
| 6b4bcbde-5293-49dd-acb3-bc2047720c9b | Gravar o pós-visita sem internet e enviar depois | Agrospy | SPEC-2-001 | CA-2-01 | GREEN 3 + REFACTOR (e) | gravação da tela + consulta | áudio vira rascunho |
| abc5e491-405a-4dab-ae70-b2769743f897 | Testar o pós-visita por áudio no celular | Agrospy | SPEC-2-001 | CA-2-01 a CA-2-05 | teste humano | "testei, pode seguir" + print | tasks anteriores concluídas |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
