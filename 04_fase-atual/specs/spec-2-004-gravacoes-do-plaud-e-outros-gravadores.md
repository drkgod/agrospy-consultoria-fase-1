# SPEC-2-004 — Gravações do Plaud e de outros gravadores, e fechamento da fase

**Fase:** 2
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (emenda de 17/11/2026)
**Origem no escopo:** RQ-002; P1; P10; Fase 2, capacidades "importação de transcrições do Plaud" e "pasta do Google Drive para gravações de outros gravadores"; CL-PEND-002; demonstração da fase 2
**Degrau da solução:** reuso + construção mínima:
- **Reuso:** a fila de rascunhos (SPEC-2-001) e o leitor de documentos nativo do Skip (`$documents.toMarkdown`);
- **Construção:** o envio de arquivo pelo app e a leitura da pasta do Drive. A pasta só entra se o acesso for provado.

## Contexto e decisões fechadas

- **Estado atual:** o Diogo grava reuniões e visitas no Plaud, e outras pessoas usam outros gravadores. Essas gravações e transcrições ficam fora do sistema.
- **Estado desejado:** qualquer gravação ou transcrição chega à mesma fila de rascunhos, enviada pelo app ou salva na pasta do Drive da empresa, e só entra no histórico depois de confirmada.
- **Decisões já fechadas:**
  - **Porta sempre disponível:** "Enviar gravação" no app. O WhatsApp não é usado (P10).
  - **Formatos:** áudio (m4a, mp3, wav, ogg, aac, amr, 3gp e webm, até 25 MB) e texto pronto (txt, docx e pdf exportados do Plaud, até 5 MB).
  - **Texto pronto:** não é transcrito de novo; vai direto para a proposta da IA (SPEC-2-001).
    - docx e pdf passam por `$documents.toMarkdown`, o extrator nativo do Skip;
    - resposta 422 deixa o rascunho em `falhou`, com "arquivo sem texto legível";
    - texto com mais de 200 mil caracteres é recusado com "envie em partes".
  - **Repetição:** pelo conteúdo, com o `hash_conteudo` da SPEC-2-001 (SHA-256 em base64): calculado no aparelho no app e vindo do `sha256Checksum` do Drive, convertido para base64. O mesmo arquivo na mesma empresa vira um único rascunho, pelo app ou pela pasta.
  - **Pasta do Drive monitorada:**
    - uma pasta por empresa, lida a cada 10 minutos pela rotina da SPEC-2-001;
    - os rascunhos vão para o dono configurado em `config_drive` (`empresa`, `pasta_id`, `dono`, `ativa` e `ultima_leitura`; só o Administrador edita);
    - escopo `drive.readonly`;
    - conta de serviço do Google exige assinatura RS256, que o runtime não tem, então o acesso é OAuth com refresh token;
    - a prova de acesso só vale com app interno do Google Workspace ou publicado, ou com a renovação do token provada depois de 7 dias;
    - sem essa prova, a SPEC fecha com o envio pelo app, e a pasta fica como pendência registrada para o consultor decidir.
- **Bloqueios:** a pasta do Drive depende de CL-PEND-002 e da prova de acesso; o envio pelo app não tem bloqueio.

## Resultado observável

O Diogo exporta a transcrição de uma reunião no Plaud e, no app da Agrospy, escolhe o arquivo em "Enviar gravação". No Android, também dá para mandar pelo menu "Compartilhar". Minutos depois, o rascunho aparece em "Rascunhos" com a proposta da visita, e ele confirma. Um vendedor faz o mesmo com o áudio do gravador dele.

## Limites e dependências

- **Inclui:**
  - "Enviar gravação" no app, a partir de um arquivo do celular ou do computador;
  - leitura de texto de txt, docx e pdf;
  - pasta do Drive (condicional);
  - limpeza das contas de teste;
  - fechamento da fase 2 pela regressão automática de ponta a ponta.
- **Fora de escopo:** WhatsApp (P10); integração direta com a conta do Plaud (a Agrospy exporta do app do Plaud); importação de gravações antigas em lote; vídeo.
- **Entradas e pré-condições:** SPEC-2-001 aceita para o envio pelo app; SPECs 2-002 e 2-003 aceitas para o fechamento da fase; CL-PEND-002 para a pasta do Drive.
- **Saídas/artefatos:** tela "Enviar gravação"; tratamento de documentos; `config_drive` e a leitura da pasta (se houver); evidências em `05_entregas/fase-2/spec-2-004/`.
- **Dependências e responsáveis:** Agrospy executa; o Diogo libera a pasta do Drive e mostra como exporta do Plaud.
- **Atores e permissões mínimas:** as da SPEC-2-001; o rascunho vindo da pasta pertence ao dono configurado.
- **Superfícies/arquivos/configurações afetadas:** frontend ("Enviar gravação"; destino de compartilhamento no Android); hook de processamento; rotina (pasta do Drive); segredos do Drive, se houver.
- **Risco e plano B:** o iPhone não oferece o app no menu "Compartilhar", então lá a escolha é pela tela "Enviar gravação". Sem acesso ao Drive, o envio pelo app cobre o uso.
- **Rollback ou reversão:** esconder "Enviar gravação" e `config_drive.ativa = falso`; os rascunhos existentes continuam.

## Dados e integrações

| Origem/destino | Contrato | Autenticação | Tempo e repetição | Erro |
|---|---|---|---|---|
| App → `rascunhos` | origem `arquivo_gravador`; `midia` (áudio) ou `texto_original` (texto extraído); `produtor` opcional; `hash_conteudo` do aparelho | usuário (regras da SPEC-2-001) | `chave_dedup` = `id_local`; conflito em `hash_conteudo` devolve o existente | formato não aceito → mensagem com os formatos válidos |
| Pasta do Drive → `rascunhos` | arquivos novos desde `ultima_leitura`; `chave_dedup` = id do arquivo; `hash_conteudo` = `sha256Checksum` em base64 | OAuth com `drive.readonly`; segredos no cofre | a cada 10 min; arquivo já importado não volta | falha de acesso → aviso ao Administrador pela coleção `avisos` (tipo `sistema`); sem perda |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-47 | texto pronto | não transcreve; vai para a proposta | texto vazio ou ilegível → `falhou` com motivo | decisão desta SPEC |
| RN-48 | arquivo repetido, pelo app ou pela pasta | um rascunho só | — | RN-33 |
| RN-49 | arquivo da pasta do Drive | rascunho do dono configurado | dono inativo → aviso ao Administrador | decisão desta SPEC |

## Fluxo e regras

1. No app, "Enviar gravação" → escolher o arquivo → produtor opcional → "Enviar". O aparelho calcula o hash antes de entrar na fila; sem internet, o arquivo espera na fila como na SPEC-2-001.
2. O servidor identifica o tipo: áudio segue a transcrição da SPEC-2-001; texto passa pelo extrator e vai direto para a proposta.
3. Pasta do Drive (se liberada e provada): a cada 10 minutos, arquivos novos viram rascunho do dono.
4. O rascunho é confirmado ou descartado como na SPEC-2-001.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | txt do Plaud pelo app | rascunho com proposta, sem transcrição | — |
| Principal | m4a do gravador pelo app | rascunho transcrito | — |
| Limite | o mesmo arquivo enviado duas vezes, ou pelo app e pela pasta | um rascunho só | — |
| Falha | vídeo ou arquivo acima de 25 MB | recusa com mensagem clara | — |
| Falha | pdf sem texto | `falhou` com "arquivo sem texto legível" | — |
| Falha | Drive sem acesso | aviso ao Administrador | o envio pelo app continua |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; a SPEC-2-001; os guias de hooks do Skip (arquivos, HTTP e `$documents`).
2. **Contexto técnico do Skip:** o mesmo da SPEC-2-001.
3. **Alterar somente:** a tela "Enviar gravação"; o tratamento de documentos; `config_drive` e a leitura da pasta (se houver).
4. **Não alterar:** as regras de confirmação e de acesso da SPEC-2-001; nunca gravar no histórico sem confirmação.
5. **Executar nesta ordem:**
   1. "Enviar gravação" com áudio e texto;
   2. repetição e formatos;
   3. pasta do Drive, só se CL-PEND-002 estiver liberado;
   4. limpeza das contas de teste;
   5. regressão automática de ponta a ponta (CA-2-18) e fechamento da fase.
6. **Parar e pedir validação quando:**
   - `$documents.toMarkdown` não existir no projeto (aceite só txt e avise o consultor);
   - o acesso ao Drive não puder ser provado como descrito (registre a pendência e siga);
   - o `sha256Checksum` do Drive não bater com o hash do app para o mesmo arquivo de teste (registre os dois valores; o CA-2-16 vale por porta até o consultor decidir).
7. **Estado válido ao parar:** as SPECs 2-001 a 2-003 continuam funcionando; nenhum rascunho é perdido.

## Checklist de execução

- [ ] "Enviar gravação" com áudio e texto.
- [ ] Repetição não duplica; formato inválido é recusado.
- [ ] Pasta do Drive ligada ou pendência registrada.
- [ ] Contas de teste limpas: vínculos `teste.*` desativados e senhas trocadas.
- [ ] Regressão automática de ponta a ponta passando (CA-2-18), com o RN-50 em 90 dias.
- [ ] Evidências em `05_entregas/fase-2/spec-2-004/`.

## Critérios de aceite

- [ ] **CA-2-15:** um arquivo de áudio ou de texto (txt, docx ou pdf) enviado pelo app vira rascunho na fila de quem enviou; o texto pronto não passa por nova transcrição.
- [ ] **CA-2-16:** o mesmo arquivo enviado duas vezes, pelo app ou pelo app e pela pasta do Drive, cria um único rascunho; vídeo e arquivo acima do limite são recusados com mensagem clara.
- [ ] **CA-2-17:** com a pasta liberada e o acesso provado, um arquivo novo na pasta da empresa vira rascunho do dono em até 10 minutos e não é importado de novo. Sem acesso provado, a pendência fica registrada no changelog e no STATUS com o motivo.
- [ ] **CA-2-18:** a regressão automática da fase passa nos cinco passos, sem teste de pessoa (emenda de 17/11/2026). Ela usa os usuários e o produtor de teste, pela API e pelo navegador automatizado com a rede desligada e religada:
  - um pós-visita gravado no app sem sinal vira rascunho ao voltar a internet;
  - confirmado, ele entra na ficha do produtor;
  - a próxima ação gera aviso no dia;
  - o assistente responde uma pergunta por voz sobre a carteira;
  - uma transcrição do Plaud enviada pelo app vira rascunho.

## TDD da SPEC

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | repetição (CA-2-16) | enviar `pos-visita-teste.m4a` duas vezes pelo app | antes da chave por conteúdo, dois rascunhos (falha esperada); depois, um | consultas |
| GREEN 1 | app (CA-2-15) | enviar pelo app um txt de teste exportado do Plaud e um m4a de teste | dois rascunhos; o txt sem transcrição | consultas + prints |
| GREEN 2 | pasta do Drive (CA-2-16, CA-2-17) | colocar na pasta liberada um arquivo de teste novo e o mesmo m4a já enviado pelo app | rascunho do arquivo novo em até 10 min; o m4a repetido não duplica; a leitura seguinte não importa de novo | consultas |
| REFACTOR/REGRESSÃO | formatos e regressão | (a) vídeo e arquivo de 30 MB; (b) pdf e docx com texto e pdf sem texto; (c) regressão das SPECs 2-001 a 2-003 | (a) recusados; (b) texto extraído e `falhou` no pdf sem texto; (c) sem divergência | prints + consultas |
| Prova final da fase | regressão de ponta a ponta (CA-2-18) | o roteiro automático dos cinco passos, pela API e pelo navegador automatizado (rede desligada e religada) | todos os passos passam | saída do roteiro + log do Skip |

**Dados/fixtures:** arquivos de teste em `05_entregas/fase-2/fixtures/` (txt, pdf e docx curtos, pdf sem texto, m4a de 30 s, um vídeo e um arquivo de 30 MB), sem dados reais de produtor; pasta de teste no Drive, se liberada.
**Caminhos de erro obrigatórios:** formato inválido, tamanho acima do limite, arquivo repetido, texto vazio ou ilegível, Drive sem acesso.
**Evidência exigida:** consultas da fila, prints e a saída da regressão automática, com o log do Skip, em `05_entregas/fase-2/spec-2-004/`.

## Teste do cliente: Não se aplica

Sem teste humano (emenda de 17/11/2026, `04_fase-atual/emenda-2026-11-17-sem-teste-humano.md`). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-2/spec-2-004/` e o log do Skip.

## Handoff e operação

- **Como demonstrar:** rodar o roteiro da regressão automática (CA-2-18).
- **Como operar depois:** exportar do Plaud e enviar pelo app; revisar os rascunhos no fim do dia.
- **Como monitorar:** rascunhos parados e falhas de leitura da pasta do Drive.
- **Pendência conhecida:** integração direta com a conta do Plaud não faz parte desta fase.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| c53689d5-d8b3-4e94-a4f3-527716ad1218 | Trazer as gravações do Plaud e de outros gravadores | Agrospy | SPEC-2-004 | CA-2-15 a CA-2-18 | todas as subtasks | evidências das subtasks | SPEC-2-001 aceita |
| a9653f03-9b99-4098-84f3-4bcdb02741b9 | Enviar gravações do Plaud e de outros gravadores pelo app | Agrospy | SPEC-2-004 | CA-2-15, CA-2-16 | RED 1 → GREEN 1 + REFACTOR (a)(b) | consultas + prints | SPEC-2-001 aceita |
| 993bc32b-f785-4096-bc52-c05b1e6b439c | Importar as gravações da pasta do Drive | Agrospy | SPEC-2-004 | CA-2-16, CA-2-17 | GREEN 2 ou pendência registrada | consultas ou registro da pendência | CL-PEND-002 |
| 2bb2808a-63c0-4f55-8427-aef3b1e10c6a | Fechar a fase 2 com a regressão automática de ponta a ponta | Agrospy | SPEC-2-004 | CA-2-18 | prova final da fase (automática) + REFACTOR (c) + RN-50 em 90 dias + limpeza das contas de teste | saída do roteiro + log do Skip | tasks anteriores concluídas |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| 22/10/2026 | decisão P10 | porta do WhatsApp removida; task 47f28655 passa para a SPEC-2-003 (hoje "Testar o assistente do app com a equipe", pela ordem dos cartões no portal); teste final troca o WhatsApp pelo pós-visita gravado sem sinal e pela pergunta ao assistente | fase 2 sem WhatsApp |
| 17/11/2026 | consultor | `## Teste do cliente: Não se aplica`; CA-2-18 e 2bb2808a viram regressão automática de ponta a ponta | Sem teste humano no projeto |
