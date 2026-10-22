# SPEC-2-004 — Gravações do Plaud e de outros gravadores, e teste final da fase

**Fase:** 2
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · teste: Diogo
**Origem no escopo:** RQ-002; P1; Fase 2, capacidades "importação de transcrições do Plaud" e "pasta do Google Drive para gravações de outros gravadores"; CL-PEND-002; demonstração da fase 2
**Degrau da solução:** reuso + construção mínima:
- **Reuso:** a fila de rascunhos (SPEC-2-001), o agente do WhatsApp (SPEC-2-003) e o leitor de documentos nativo do Skip (`$documents.toMarkdown`);
- **Construção:** o envio de arquivo pelo app e a leitura da pasta do Drive. A pasta só entra se o acesso for provado.

## Contexto e decisões fechadas

- **Estado atual:** o Diogo grava reuniões e visitas no Plaud, e outras pessoas usam outros gravadores. Essas gravações e transcrições ficam fora do sistema.
- **Estado desejado:** qualquer gravação ou transcrição chega à mesma fila de rascunhos, por um destes caminhos, e só entra no histórico depois de confirmada:
  - exportada e enviada pelo app;
  - mandada ao WhatsApp do agente;
  - salva na pasta do Drive da empresa.
- **Decisões já fechadas:**
  - **Portas sempre disponíveis:** "Enviar gravação" no app e o arquivo mandado ao agente do WhatsApp. A porta do app não depende da Meta.
  - **Formatos:** áudio (m4a, mp3, wav, ogg, aac, amr, 3gp e webm, até 25 MB) e texto pronto (txt, docx e pdf exportados do Plaud, até 5 MB).
  - **Texto pronto:** não é transcrito de novo; vai direto para a proposta da IA (SPEC-2-001).
    - docx e pdf passam por `$documents.toMarkdown`, o extrator nativo do Skip;
    - resposta 422 deixa o rascunho em `falhou`, com "arquivo sem texto legível";
    - texto com mais de 200 mil caracteres é recusado com "envie em partes".
  - **Repetição:** pelo conteúdo, em qualquer porta, com o `hash_conteudo` da SPEC-2-001 (SHA-256 em base64):
    - no app, calculado no aparelho;
    - no WhatsApp, o `sha256` que a Meta manda;
    - no Drive, o `sha256Checksum` convertido de hex para base64.
    O mesmo arquivo na mesma empresa vira um único rascunho.
  - **Pasta do Drive monitorada:**
    - uma pasta por empresa, lida a cada 10 minutos pela rotina da SPEC-2-001;
    - os rascunhos vão para o dono configurado em `config_drive` (`empresa`, `pasta_id`, `dono`, `ativa` e `ultima_leitura`; só o Administrador edita);
    - escopo `drive.readonly`;
    - conta de serviço do Google exige assinatura RS256, que o runtime não tem, então o acesso é OAuth com refresh token;
    - a prova de acesso só vale com app interno do Google Workspace ou publicado, ou com a renovação do token provada depois de 7 dias;
    - sem essa prova, a SPEC fecha com as duas portas, e a pasta fica como pendência registrada para o consultor decidir.
  - **Fechamento da fase:** o teste final usa o WhatsApp. Se a Meta não tiver liberado o número, o executor para antes do teste final, e o consultor decide se fecha com a porta do app e o WhatsApp como pendência.
- **Bloqueios:** a pasta do Drive depende de CL-PEND-002 e da prova de acesso; a porta do WhatsApp depende da SPEC-2-003; a porta do app não tem bloqueio.

## Resultado observável

O Diogo exporta a transcrição de uma reunião no Plaud e, no app da Agrospy, escolhe o arquivo em "Enviar gravação". No Android, também dá para mandar pelo menu "Compartilhar". Minutos depois, o rascunho aparece em "Rascunhos" com a proposta da visita, e ele confirma. Um vendedor faz o mesmo mandando o áudio do gravador para o WhatsApp do agente.

## Limites e dependências

- **Inclui:**
  - "Enviar gravação" no app, a partir de um arquivo do celular ou do computador;
  - arquivo de áudio ou texto mandado ao agente do WhatsApp;
  - leitura de texto de txt, docx e pdf;
  - pasta do Drive (condicional);
  - limpeza das contas de teste;
  - teste final da fase 2.
- **Fora de escopo:** integração direta com a conta do Plaud (a Agrospy exporta do app do Plaud); importação de gravações antigas em lote; vídeo.
- **Entradas e pré-condições:** SPEC-2-001 aceita para a porta do app; SPEC-2-003 aceita para a porta do WhatsApp e para o teste final; CL-PEND-002 para a pasta do Drive.
- **Saídas/artefatos:** tela "Enviar gravação"; tratamento de documentos; `config_drive` e a leitura da pasta (se houver); evidências em `05_entregas/fase-2/spec-2-004/`.
- **Dependências e responsáveis:** Agrospy executa; o Diogo libera a pasta do Drive e mostra como exporta do Plaud; o Diogo faz o teste final da fase.
- **Atores e permissões mínimas:** as da SPEC-2-001; o rascunho vindo da pasta pertence ao dono configurado.
- **Superfícies/arquivos/configurações afetadas:** frontend ("Enviar gravação"; destino de compartilhamento no Android); hook de processamento; rota do WhatsApp (documentos); rotina (pasta do Drive); segredos do Drive, se houver.
- **Risco e plano B:** o iPhone não oferece o app no menu "Compartilhar", então lá a escolha é pela tela "Enviar gravação" ou pelo WhatsApp. Sem acesso ao Drive, as duas portas cobrem o uso.
- **Rollback ou reversão:** esconder "Enviar gravação" e `config_drive.ativa = falso`; os rascunhos existentes continuam.

## Dados e integrações

| Origem/destino | Contrato | Autenticação | Tempo e repetição | Erro |
|---|---|---|---|---|
| App → `rascunhos` | origem `arquivo_gravador`; `midia` (áudio) ou `texto_original` (texto extraído); `produtor` opcional; `hash_conteudo` do aparelho | usuário (regras da SPEC-2-001) | `chave_dedup` = `id_local`; conflito em `hash_conteudo` devolve o existente | formato não aceito → mensagem com os formatos válidos |
| WhatsApp → `rascunhos` | mensagem `document` ou `audio`; mesma rota e assinatura da SPEC-2-003 | assinatura | `chave_dedup` = `id_mensagem`; `hash_conteudo` = `sha256` da Meta | arquivo acima do limite → resposta explicando |
| Pasta do Drive → `rascunhos` | arquivos novos desde `ultima_leitura`; `chave_dedup` = id do arquivo; `hash_conteudo` = `sha256Checksum` em base64 | OAuth com `drive.readonly`; segredos no cofre | a cada 10 min; arquivo já importado não volta | falha de acesso → aviso ao Administrador pela coleção `avisos` (tipo `sistema`); sem perda |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-47 | texto pronto | não transcreve; vai para a proposta | texto vazio ou ilegível → `falhou` com motivo | decisão desta SPEC |
| RN-48 | arquivo repetido em qualquer porta | um rascunho só | — | RN-33 |
| RN-49 | arquivo da pasta do Drive | rascunho do dono configurado | dono inativo → aviso ao Administrador | decisão desta SPEC |

## Fluxo e regras

1. No app, "Enviar gravação" → escolher o arquivo → produtor opcional → "Enviar". O aparelho calcula o hash antes de entrar na fila.
2. O servidor identifica o tipo: áudio segue a transcrição da SPEC-2-001; texto passa pelo extrator e vai direto para a proposta.
3. No WhatsApp, o arquivo mandado ao agente segue o mesmo caminho e recebe o link.
4. Pasta do Drive (se liberada e provada): a cada 10 minutos, arquivos novos viram rascunho do dono.
5. O rascunho é confirmado ou descartado como na SPEC-2-001.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | txt do Plaud pelo app | rascunho com proposta, sem transcrição | — |
| Principal | m4a mandado ao WhatsApp | rascunho transcrito e link | — |
| Limite | o mesmo arquivo pelo app e pelo WhatsApp | um rascunho só | — |
| Falha | vídeo ou arquivo acima de 25 MB | recusa com mensagem clara | — |
| Falha | pdf sem texto | `falhou` com "arquivo sem texto legível" | — |
| Falha | Drive sem acesso | aviso ao Administrador | as duas portas continuam |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; as SPECs 2-001 e 2-003; os guias de hooks do Skip (arquivos, HTTP e `$documents`).
2. **Contexto técnico do Skip:** o mesmo da SPEC-2-001.
3. **Alterar somente:** a tela "Enviar gravação"; o tratamento de documentos; a parte de documentos na rota do WhatsApp; `config_drive` e a leitura da pasta (se houver).
4. **Não alterar:** as regras de confirmação e de acesso da SPEC-2-001; nunca gravar no histórico sem confirmação.
5. **Executar nesta ordem:**
   1. "Enviar gravação" com áudio e texto;
   2. arquivo pelo WhatsApp;
   3. repetição entre portas e formatos;
   4. pasta do Drive, só se CL-PEND-002 estiver liberado;
   5. limpeza das contas de teste;
   6. teste final da fase.
6. **Parar e pedir validação quando:**
   - `$documents.toMarkdown` não existir no projeto (aceite só txt e avise o consultor);
   - o acesso ao Drive não puder ser provado como descrito (registre a pendência e siga);
   - o `sha256` da Meta não bater com o hash do app para o mesmo arquivo de teste (registre os dois valores; o CA-2-16 vale por porta até o consultor decidir);
   - antes do teste final, se o WhatsApp não estiver liberado (o consultor decide o fechamento).
7. **Estado válido ao parar:** as SPECs 2-001 a 2-003 continuam funcionando; nenhum rascunho é perdido.

## Checklist de execução

- [ ] "Enviar gravação" com áudio e texto.
- [ ] Arquivo pelo WhatsApp vira rascunho.
- [ ] Repetição entre portas não duplica; formato inválido é recusado.
- [ ] Pasta do Drive ligada ou pendência registrada.
- [ ] Contas de teste limpas: vínculos `teste.*` desativados, telefones de teste apagados e senhas trocadas.
- [ ] Teste final da fase feito pelo Diogo.
- [ ] Evidências em `05_entregas/fase-2/spec-2-004/`.

## Critérios de aceite

- [ ] **CA-2-15:** um arquivo de áudio ou de texto (txt, docx ou pdf) enviado pelo app ou ao WhatsApp do agente vira rascunho na fila de quem enviou; o texto pronto não passa por nova transcrição.
- [ ] **CA-2-16:** o mesmo arquivo enviado duas vezes, pela mesma porta ou por portas diferentes, cria um único rascunho; vídeo e arquivo acima do limite são recusados com mensagem clara.
- [ ] **CA-2-17:** com a pasta liberada e o acesso provado, um arquivo novo na pasta da empresa vira rascunho do dono em até 10 minutos e não é importado de novo. Sem acesso provado, a pendência fica registrada no changelog e no STATUS com o motivo.
- [ ] **CA-2-18:** o Diogo executa no celular a demonstração da fase e responde "testei, pode seguir". A demonstração tem quatro passos:
  - um áudio de pós-visita mandado ao WhatsApp vira rascunho;
  - confirmado, ele entra na ficha do produtor;
  - a próxima ação gera aviso no dia;
  - uma transcrição do Plaud enviada pelo app vira rascunho.

## TDD da SPEC

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | repetição entre portas (CA-2-16) | enviar `pos-visita-teste.m4a` pelo app e depois o mesmo arquivo como mensagem simulada do WhatsApp, com o `sha256` do arquivo | antes da chave por conteúdo, dois rascunhos (falha esperada); depois, um | consultas |
| GREEN 1 | app (CA-2-15) | enviar pelo app um txt de teste exportado do Plaud e um m4a de teste | dois rascunhos; o txt sem transcrição | consultas + prints |
| GREEN 2 | WhatsApp (CA-2-15) | mensagem simulada com documento txt e com áudio | rascunhos e resposta com link | consultas |
| GREEN 3 | pasta do Drive (CA-2-17) | colocar um arquivo de teste na pasta liberada | rascunho do dono em até 10 min; a leitura seguinte não importa de novo | consultas |
| REFACTOR/REGRESSÃO | formatos e regressão | (a) vídeo e arquivo de 30 MB; (b) pdf e docx com texto e pdf sem texto; (c) regressão das SPECs 2-001 a 2-003 | (a) recusados; (b) texto extraído e `falhou` no pdf sem texto; (c) sem divergência | prints + consultas |
| Prova final da fase | demonstração (CA-2-18) | o roteiro da demonstração no celular, com o Diogo | todos os passos passam | gravação de tela + mensagem do Diogo |

**Dados/fixtures:** arquivos de teste em `05_entregas/fase-2/fixtures/` (txt, pdf e docx curtos, pdf sem texto, m4a de 30 s, um vídeo e um arquivo de 30 MB), sem dados reais de produtor; pasta de teste no Drive, se liberada.
**Caminhos de erro obrigatórios:** formato inválido, tamanho acima do limite, repetição entre portas, texto vazio ou ilegível, Drive sem acesso.
**Evidência exigida:** consultas da fila, prints e a gravação da demonstração, em `05_entregas/fase-2/spec-2-004/`.

## Teste humano do cliente

- **Origem:** CL-004 — teste final da fase 2.
- **Quem testa:** Diogo.
- **Passos:**
  1. Mandar um áudio de pós-visita ao WhatsApp do agente.
  2. Confirmar o rascunho e conferir a visita na ficha do produtor.
  3. Conferir o aviso da próxima ação no dia.
  4. Exportar uma transcrição do Plaud, enviar pelo app e confirmar o rascunho.
- **Resultado esperado:** tudo chega como rascunho, só entra no histórico depois de confirmado, e os avisos chegam no dia.
- **Evidência do aceite:** "testei, pode seguir" do Diogo ao Maestro. Com isso, a fase 2 fecha.

## Handoff e operação

- **Como demonstrar:** o roteiro do teste final.
- **Como operar depois:** exportar do Plaud e enviar pelo app ou pelo WhatsApp; revisar os rascunhos no fim do dia.
- **Como monitorar:** rascunhos parados e falhas de leitura da pasta do Drive.
- **Pendência conhecida:** integração direta com a conta do Plaud não faz parte desta fase.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| c53689d5-d8b3-4e94-a4f3-527716ad1218 | Trazer as gravações do Plaud e de outros gravadores | Agrospy | SPEC-2-004 | CA-2-15 a CA-2-18 | todas as subtasks | evidências das subtasks | SPEC-2-001 aceita |
| a9653f03-9b99-4098-84f3-4bcdb02741b9 | Enviar gravações do Plaud e de outros gravadores pelo app | Agrospy | SPEC-2-004 | CA-2-15, CA-2-16 | GREEN 1 + REFACTOR (a)(b) | consultas + prints | SPEC-2-001 aceita |
| 47f28655-1831-466a-b9bb-69438c63314b | Mandar gravações para o WhatsApp do agente | Agrospy | SPEC-2-004 | CA-2-15, CA-2-16 | RED 1 → GREEN 2 | consultas | SPEC-2-003 aceita |
| 993bc32b-f785-4096-bc52-c05b1e6b439c | Importar as gravações da pasta do Drive | Agrospy | SPEC-2-004 | CA-2-17 | GREEN 3 ou pendência registrada | consultas ou registro da pendência | CL-PEND-002 |
| 2bb2808a-63c0-4f55-8427-aef3b1e10c6a | Demonstrar a fase 2 no celular (teste final da fase) | Agrospy | SPEC-2-004 | CA-2-18 | prova final da fase + REFACTOR (c) + limpeza das contas de teste | gravação + "testei, pode seguir" | tasks anteriores concluídas |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
