# Fase 2 — Tarefas

<!-- fase-format:2 -->

Cada linha é uma tarefa da Jornada de Execução. **Tudo que cabe num card cabe nesta linha** — se um
campo não estiver aqui, ele não tem como ser preenchido, porque é este arquivo que cria a tarefa.

```
- [ ] Título da tarefa @responsável !30/09/2026 #projeto [interno]   <!-- id:… -->
      > descrição da tarefa, uma ou mais linhas
  - [ ] subtarefa (basta indentar 2 espaços)                         <!-- id:… -->
    - [ ] sub-subtarefa (indente mais 2)                             <!-- id:… -->
```

| marcador | o que define | se você não escrever |
|---|---|---|
| `- [ ]` / `- [/]` / `- [x]` | a fazer / em andamento / concluída | a fazer |
| `@nome` | responsável (`@"Nome Composto"` com aspas) | fica **sem responsável** |
| `!dd/mm/aaaa` | prazo | fica **sem prazo** |
| `#projeto` / `#aculturamento` | tipo | Projeto de IA |
| `[interno]` | o cliente **não** vê esta tarefa | o cliente vê |
| `> texto` na linha de baixo | descrição (aparece ao abrir o card) | sem descrição |
| indentar 2 espaços | vira subtarefa da tarefa acima (vale em qualquer profundidade) | tarefa de topo |

Os marcadores só valem **no fim da linha** — `Revisar #3 do contrato` continua sendo um título.
Um título que TERMINA na forma de um marcador sai escapado com `\\` (`Ligar para \\@joao`); a barra é
só para o parser e nunca aparece no card. Você não precisa escrever isso à mão.
Marque `[x]` para concluir e adicione linhas novas à vontade: elas entram no quadro na próxima
sincronização e voltam aqui com o `<!-- id:… -->` preenchido. **Não apague o marcador de id** das
tarefas que já têm um.

- [ ] Registrar o pós-visita por áudio no app @Agrospy !30/10/2026  <!-- id:c72f5276-6770-4bfe-ba35-9092ad2ee556 -->
  > O vendedor grava o pós-visita falando, mesmo sem sinal, e o sistema monta um rascunho da visita para ele conferir e confirmar. Nada entra no histórico sem confirmação. SPEC-2-001.
  - [ ] Criar a fila de rascunhos para revisar o pós-visita @Agrospy !24/10/2026  <!-- id:0b522b2b-8c1b-4166-9c07-6f600881ed75 -->
    > Nova tela "Rascunhos". Cada pessoa vê só os próprios rascunhos, Gestão e Administrador veem os da empresa, e a outra empresa nunca vê. Fecha pela prova automática. SPEC-2-001, CA-2-04.
  - [ ] Confirmar, corrigir ou descartar o rascunho @Agrospy !27/10/2026  <!-- id:68c2ec27-c5c8-490a-8048-1255343383d7 -->
    > Ao confirmar, a visita entra na ficha do produtor com o áudio, a oportunidade e a próxima ação, pelas mesmas regras da fase 1. O rascunho descartado não entra em lugar nenhum. Fecha pela prova automática. SPEC-2-001, CA-2-03.
  - [ ] Transformar o áudio gravado em rascunho de visita @Agrospy !28/10/2026  <!-- id:5f42475d-2083-49e8-9153-c0ded8096569 -->
    > O áudio enviado é transcrito, e a IA preenche produtor, assuntos e próxima ação com data. O que ela não identificar fica em branco para a pessoa preencher. Se o Skip não transcrever áudio, a Agrospy cria a conta gratuita do Groq e guarda a chave no cofre. Fecha pela prova automática. SPEC-2-001, CA-2-02 e CA-2-05.
  - [ ] Gravar o pós-visita sem internet e enviar depois @Agrospy !29/10/2026  <!-- id:6b4bcbde-5293-49dd-acb3-bc2047720c9b -->
    > Sem sinal, a gravação fica no celular como "aguardando envio" e sobe sozinha quando a internet volta, uma vez só. Fecha pela prova automática. SPEC-2-001, CA-2-01.
  - [ ] Testar o pós-visita por áudio no celular @Agrospy !30/10/2026  <!-- id:abc5e491-405a-4dab-ae70-b2769743f897 -->
    > Teste do Diogo com um vendedor: gravar o pós-visita de uma visita real, conferir o rascunho, confirmar e ver a visita na ficha do produtor. Também confirmar por quanto tempo guardar os áudios. Fecha com o "testei, pode seguir". SPEC-2-001.
- [ ] Receber os avisos da próxima ação no celular @Agrospy !06/11/2026  <!-- id:f20b6ec7-1938-4dcb-a387-1150d0244c68 -->
  > No dia da próxima ação, o responsável recebe um aviso no celular. Se a ação atrasar, recebe outro aviso, e o gestor recebe cópia. SPEC-2-002.
  - [ ] Mostrar os avisos do dia dentro do app @Agrospy !03/11/2026  <!-- id:bdca5efe-1e2d-443f-9cb7-c6a026678524 -->
    > Todo dia às 7h (horário ajustável pelo Administrador), o sistema cria os avisos do dia, que aparecem numa lista "Avisos" com contador no topo, sem repetir. Fecha pela prova automática. SPEC-2-002, CA-2-06 e CA-2-08.
  - [ ] Avisar o atraso e mandar cópia ao gestor @Agrospy !04/11/2026  <!-- id:4b03eb12-8cf5-42b8-980c-d999ba3a07d9 -->
    > Ação vencida e não concluída gera aviso de atraso no dia seguinte e a cada 3 dias, com cópia para Gestão e Administrador, que podem desligar a cópia. O Administrador ajusta horário e repetição. Fecha pela prova automática. SPEC-2-002, CA-2-07 e CA-2-09.
  - [ ] Ativar as notificações no celular @Agrospy !05/11/2026  <!-- id:2ae01199-220f-446b-982d-6174d2348065 -->
    > Com o app instalado na tela inicial, cada pessoa ativa os avisos no celular pelo OneSignal (conta gratuita da Agrospy). A tela bloqueada não mostra o nome do produtor, e quem não ativar continua vendo os avisos na lista. Fecha pela prova automática. SPEC-2-002, CA-2-06, CA-2-08 e CA-2-09.
  - [ ] Testar os avisos no celular @Agrospy !06/11/2026  <!-- id:b33bfdb7-3f63-4454-b031-0b952458dd75 -->
    > Teste do Diogo com um vendedor: ativar os avisos, conferir o aviso das 7h no dia da ação e o aviso de atraso com a cópia no celular do Diogo. Fecha com o "testei, pode seguir". SPEC-2-002.
- [ ] Perguntar ao assistente do app sobre a carteira @Agrospy !13/11/2026  <!-- id:94aab9cf-6731-4eb7-b37a-517dffac342c -->
  > Dentro do app, o vendedor pergunta por texto ou voz sobre a própria carteira e também pode escrever um pós-visita curto, que vira rascunho. Sem WhatsApp. SPEC-2-003.
  - [ ] Criar a tela do assistente dentro do app @Agrospy !10/11/2026  <!-- id:864c6848-16e6-48d3-9538-53abe6a9f91c -->
    > Nova tela "Assistente" no app, na empresa ativa. Sem internet, ela avisa e oferece o botão "Gravar pós-visita". O assistente só lê dados, nunca altera. Fecha pela prova automática. SPEC-2-003, CA-2-13 e CA-2-14.
  - [ ] Registrar o pós-visita por texto no assistente @Agrospy !12/11/2026  <!-- id:c504f635-645d-4304-8f81-88ae6f1149f5 -->
    > Um recado escrito ou ditado no assistente, como "visitei o produtor X, ficou de ver o orçamento até sexta", vira rascunho para confirmar. A mesma mensagem não vira dois rascunhos. Fecha pela prova automática. SPEC-2-003, CA-2-12.
  - [ ] Responder perguntas sobre a carteira no assistente @Agrospy !11/11/2026  <!-- id:09510a74-c541-4d88-adb1-6c2be8d3b9c5 -->
    > Perguntas como "minhas ações de amanhã" e "o que conversei com o produtor X" são respondidas com links para os registros, só com o que a pessoa pode ver na empresa dela. Fecha pela prova automática. SPEC-2-003, CA-2-10 e CA-2-11.
  - [ ] Perguntar ao assistente por voz @Agrospy !12/11/2026  <!-- id:fcbe8d32-044e-4881-9a7b-4d07f85687fa -->
    > O vendedor toca no microfone e faz a pergunta falando; o áudio é transcrito e respondido como se fosse escrito. Fecha pela prova automática. SPEC-2-003, CA-2-13.
  - [ ] Testar o assistente do app com a equipe @Agrospy !13/11/2026  <!-- id:47f28655-1831-466a-b9bb-69438c63314b -->
    > Teste do Diogo com um vendedor: perguntar por voz, abrir pelo link, escrever um pós-visita e confirmar o rascunho, e trocar de empresa. Também confirmar se o Comercial continua consultando todos os produtores e o prazo de guarda das conversas. Fecha com o "testei, pode seguir". SPEC-2-003.
- [ ] Trazer as gravações do Plaud e de outros gravadores @Agrospy !19/11/2026  <!-- id:c53689d5-d8b3-4e94-a4f3-527716ad1218 -->
  > Gravações e transcrições do Plaud e de outros gravadores entram na mesma fila de rascunhos, pelo app e, se der, pela pasta do Drive. A fase 2 fecha com o teste final do Diogo. SPEC-2-004.
  - [ ] Enviar gravações do Plaud e de outros gravadores pelo app @Agrospy !16/11/2026  <!-- id:a9653f03-9b99-4098-84f3-4bcdb02741b9 -->
    > Pelo botão "Enviar gravação". O áudio é transcrito, e a transcrição pronta do Plaud (txt, docx ou pdf) vai direto para o rascunho. O mesmo arquivo não vira dois rascunhos. Fecha pela prova automática. SPEC-2-004, CA-2-15 e CA-2-16.
  - [ ] Importar as gravações da pasta do Drive @Agrospy !18/11/2026  <!-- id:993bc32b-f785-4096-bc52-c05b1e6b439c -->
    > Com a pasta do Drive de cada empresa liberada pela Agrospy e o acesso provado, os arquivos novos viram rascunho a cada 10 minutos. Sem acesso, a pendência é registrada, e o envio pelo app continua cobrindo. Fecha pela prova automática. SPEC-2-004, CA-2-16 e CA-2-17.
  - [ ] Demonstrar a fase 2 no celular (teste final da fase) @Agrospy !19/11/2026  <!-- id:2bb2808a-63c0-4f55-8427-aef3b1e10c6a -->
    > Teste final do Diogo: o pós-visita gravado sem sinal vira rascunho e é confirmado, a visita aparece na ficha do produtor, o aviso da próxima ação chega no dia, o assistente responde por voz e uma transcrição do Plaud vira rascunho. Antes do teste, as contas de teste são limpas. Com o "testei, pode seguir", a fase 2 fecha. SPEC-2-004, CA-2-18.
