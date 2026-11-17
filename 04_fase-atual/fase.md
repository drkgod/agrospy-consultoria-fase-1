# Fase 3 — Tarefas

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

- [ ] Fechar as pendências técnicas da fase 2 @Agrospy !21/11/2026
  > O que ficou de técnico da fase 2 entra no ar: avisos no celular, guarda de 90 dias, leitura da pasta do Drive a cada 10 minutos, dados de teste fora das empresas reais e código atualizado no GitHub. Sem teste humano (P11). Fecha pela prova automática. SPEC-3-001, CA-3-01 a CA-3-05.
  - [ ] Atualizar o código do app no GitHub @Agrospy !18/11/2026
    > O espelho em 07-sistemas/comercial/codigo/ fica igual à versão publicada no Skip, arquivo por arquivo, sem chave nem senha. A partir daqui, toda task fechada atualiza o espelho. Fecha pela prova automática. SPEC-3-001, CA-3-05.
  - [ ] Separar os dados de teste das empresas reais @Agrospy !18/11/2026
    > Cria as empresas "Teste A" e "Teste B" com a mesma carga das empresas reais e o elenco fixo de usuários de teste, com senhas novas. Os registros "TESTE —" saem da Agrospy e da Rumo Agro, e as provas não mudam mais as contagens reais. Fecha pela prova automática. SPEC-3-001, CA-3-04.
  - [ ] Religar os avisos no celular @Agrospy !19/11/2026
    > O botão "Ativar avisos no celular" volta, com o código pronto desde 02/11. O aviso do dia, o de atraso e a cópia ao gestor saem pelo OneSignal, e a entrega é provada pela resposta do serviço numa inscrição de teste. A tela bloqueada não mostra o nome do produtor. Fecha pela prova automática. SPEC-3-001, CA-3-01.
  - [ ] Guardar áudios e conversas por 90 dias @Agrospy !19/11/2026
    > A rotina de limpeza passa a guardar os áudios dos rascunhos e as conversas do assistente por 90 dias, como o Diogo decidiu em 09/11. Fecha pela prova automática. SPEC-3-001, CA-3-02.
  - [ ] Ler a pasta do Drive a cada 10 minutos @Agrospy !20/11/2026
    > Com o aplicativo do Google da Agrospy ligado uma vez (o Maestro manda o passo a passo), cada gravação nova na pasta vira rascunho sozinha em até 10 minutos, sem duplicar. Sem isso, a importação sob demanda continua, e a task fica em andamento com a pendência no STATUS. Fecha pela prova automática. SPEC-3-001, CA-3-03.
- [ ] Deixar o app com cara de aplicativo de celular @Agrospy !26/11/2026
  > Visual novo no app inteiro, nas cores de cada empresa:
  > - no celular: barra de abas embaixo, botão + para registrar, saudação com a data e folhas que sobem de baixo;
  > - no computador: menu lateral com abas em pílula no topo;
  > - cartões de vidro claro, cartão de destaque em degradê e gráficos de pontos.
  > Fecha pela prova automática. SPEC-3-002, CA-3-06 a CA-3-11.
  - [ ] Aplicar as cores, letras e formas do novo visual em cada empresa @Agrospy !21/11/2026
    > Tokens claros, fonte do próprio celular e vidro fosco. Tema da Agrospy (verde) e da Rumo Agro (azul-petróleo) pela cor da empresa, com os contrastes mínimos conferidos. Cor só em `lib/cores.ts` e nos tokens. Fecha pela prova automática. SPEC-3-002, CA-3-06.
  - [ ] Montar os componentes do app e a vitrine de exemplo @Agrospy !24/11/2026
    > Componentes:
    > - cartões, cartão de destaque e números com mini gráfico de pontos;
    > - listas com ícone em círculo, filtros em pílula, selos e botões;
    > - folha, estados de vazio, erro e carregando, e aviso no topo.
    > Página `/vitrine` com dados fictícios, nas duas empresas. Capturas em 390 e 1280px, acessibilidade sem falha grave e toque de 44px. Fecha pela prova automática. SPEC-3-002, CA-3-09 e CA-3-10.
  - [ ] Colocar a barra de abas no celular e o menu lateral no computador @Agrospy !25/11/2026
    > A casca nova fica no lugar do cabeçalho antigo, com os mesmos caminhos de tela.
    > - **Celular:** Hoje, Produtores, +, Avisos com contador e Mais.
    > - **Computador:** menu lateral com seções e abas em pílula.
    > - **Topo:** saudação com a data e troca de empresa numa folha.
    > - **Sair:** com envios pendentes, pede confirmação na folha.
    > Fecha pela prova automática. SPEC-3-002, CA-3-07 e CA-3-08.
  - [ ] Deixar o app instalável com ícone próprio e a cor da empresa @Agrospy !26/11/2026
    > Ícones PNG para Android e iPhone, idioma pt-BR e área segura do iPhone. A cor da barra muda com a empresa. O service worker e a fila sem internet continuam funcionando. Fecha pela prova automática. SPEC-3-002, CA-3-11.
- [ ] Redesenhar todas as telas do app no novo visual @Agrospy !03/12/2026
  > Todas as telas no visual novo, cada uma com os estados de carregando, vazio, erro e sem internet e com a versão de exemplo na vitrine. As regras, os dados e os caminhos continuam iguais. Fecha pela prova automática. SPEC-3-003, CA-3-12 a CA-3-17.
  - [ ] Redesenhar a tela inicial com a agenda do dia @Agrospy !27/11/2026
    > A tela "Hoje" tem:
    > - saudação;
    > - cartão de destaque com as ações de hoje e as atrasadas;
    > - filtros Atrasadas, Hoje, Próximos 7 dias e Depois;
    > - lista com concluir e reagendar numa folha.
    > Os números batem com a carteira. Fecha pela prova automática. SPEC-3-003, CA-3-12 e CA-3-16.
  - [ ] Redesenhar a lista de produtores e a ficha do produtor @Agrospy !28/11/2026
    > - **Produtores:** busca em pílula e filtros por classificação.
    > - **Ficha:** cabeçalho com as ações, "Para a próxima visita" e abas Resumo, Oportunidades, Visitas, Propriedades e Perfil.
    > - **Formulários:** em folha, com os mesmos campos obrigatórios.
    > Fecha pela prova automática. SPEC-3-003, CA-3-13 e CA-3-16.
  - [ ] Redesenhar o registro de visita em passos, os rascunhos e o envio de gravação @Agrospy !01/12/2026
    > - **Registro de visita:** 3 passos (a conversa, o próximo passo, revisar), com o botão fixo embaixo e as mesmas validações.
    > - **Rascunhos e revisão:** com o player e a confirmação na folha.
    > - **Também no visual novo:** pendências de envio e enviar gravação.
    > - **Sem internet:** a visita fica guardada e sobe ao voltar.
    > Fecha pela prova automática. SPEC-3-003, CA-3-14 e CA-3-16.
  - [ ] Redesenhar Avisos, Assistente, Visão do gestor, a entrada e as telas do Administrador @Agrospy !02/12/2026
    > - **Avisos:** lista com não lidos marcados.
    > - **Assistente:** em formato de chat.
    > - **Visão do gestor:** números da semana com variação e atrasadas por responsável.
    > - **Também no visual novo:** login, escolha de empresa, linhas de negócio, usuários e pasta do Drive, com formulários em folha.
    > Fecha pela prova automática. SPEC-3-003, CA-3-15 e CA-3-16.
  - [ ] Conferir que todo o app continua funcionando no novo visual @Agrospy !03/12/2026
    > Conferência completa no app publicado, por perfil:
    > - carteira e registro de visita, inclusive sem internet;
    > - gravação vira rascunho; descartar com confirmação;
    > - avisos e assistente;
    > - acessos por perfil e troca de empresa.
    > Saem o aviso antigo de mensagens e o cabeçalho antigo. Verificador, capturas e log do Skip sem erro. Fecha pela prova automática. SPEC-3-003, CA-3-16 e CA-3-17.
- [ ] Acompanhar a oportunidade até o fechamento @Agrospy !08/12/2026
  > Cada oportunidade passa a ter etapa no funil, proposta registrada e um fim claro: ganha (com a condição negociada), perdida ou não prioritária (sempre com motivo). O serviço contratado é acompanhado pelas etapas técnicas, de 0 Contratado a 5 Recoleta. Fecha pela prova automática. SPEC-3-004, CA-3-18 a CA-3-23.
  - [ ] Configurar as etapas do funil de cada empresa @Agrospy !04/12/2026
    > Agrospy e Rumo Agro começam com 4 etapas padrão (Necessidade reconhecida, Em amadurecimento, Proposta apresentada, Negociação), que só o Administrador renomeia, reordena ou desativa. Os motivos de perda e de não prioritária também ficam editáveis. Toda oportunidade aberta ganha uma etapa. Fecha pela prova automática. SPEC-3-004, CA-3-18.
  - [ ] Mudar a etapa da oportunidade com histórico @Agrospy !04/12/2026
    > Nova tela da oportunidade com a trilha de etapas. Cada mudança fica no histórico com quem mudou, quando e o nome da etapa naquele momento. A API comum não muda etapa nem desfecho por fora dos botões. Fecha pela prova automática. SPEC-3-004, CA-3-18 e CA-3-23.
  - [ ] Registrar o orçamento ou a proposta na oportunidade @Agrospy !07/12/2026
    > Valor, validade, descrição e o arquivo do orçamento (opcional). A proposta nova substitui a anterior, a oportunidade vai para "Proposta apresentada" e a vencida aparece marcada. Fecha pela prova automática. SPEC-3-004, CA-3-19.
  - [ ] Fechar a venda com a condição negociada @Agrospy !07/12/2026
    > "Fechar venda" exige o produto ou serviço, o valor, a entrada e as parcelas com as datas, e só confirma quando a soma bate. O produtor vira cliente, a oportunidade sai da carteira e dos avisos, e o app oferece criar o serviço técnico. Fecha pela prova automática. SPEC-3-004, CA-3-20.
  - [ ] Registrar perda ou não prioritária com motivo @Agrospy !08/12/2026
    > Perda e não prioritária pedem um motivo da lista (e texto no "Outro"). A não prioritária pode ter uma data para rever. Só Gestão e Administrador reabrem uma oportunidade encerrada. Fecha pela prova automática. SPEC-3-004, CA-3-21.
  - [ ] Acompanhar as etapas do serviço técnico contratado @Agrospy !08/12/2026
    > Tela "Serviços" e seção na ficha do produtor: cada serviço tem safra, talhões e etapa atual. Administrador, Gestão e Operador avançam a etapa, com data e autor. O Comercial só consulta. Inclui a regressão de acesso e das telas. Fecha pela prova automática. SPEC-3-004, CA-3-22 e CA-3-23.
- [ ] Ver o painel comercial e a fila de prioridades @Agrospy !11/12/2026
  > O gestor vê, por empresa, o funil, os atrasos, as propostas, os ganhos e perdas com motivos, a conversão e os indicadores semanais, com filtros de período, vendedor e linha. O vendedor vê o mesmo da própria carteira e uma fila de prioridades com ordem fixa. Fecha pela prova automática. SPEC-3-005, CA-3-24 a CA-3-29.
  - [ ] Ordenar a fila de prioridades da carteira @Agrospy !09/12/2026
    > Tela "Prioridades" com 5 grupos em ordem fixa: atrasadas, ações de hoje, propostas vencendo, clientes e potenciais sem contato há mais de 20 dias (primeiro os que estão na época boa) e os que pediram para ser revistos. O Administrador ajusta os dias. Fecha pela prova automática. SPEC-3-005, CA-3-27 e CA-3-28.
  - [ ] Montar o painel do gestor com funil, propostas e resultados @Agrospy !10/12/2026
    > Painel da empresa ativa, calculado no servidor: abertas e valor, funil por etapa, atrasadas, propostas vigentes e vencidas, ganhos, perdas e não prioritárias com motivos, conversão, visitas, serviços por etapa e carteira por responsável. Cada número bate com a base, e nada soma as duas empresas. Fecha pela prova automática. SPEC-3-005, CA-3-24 e CA-3-25.
  - [ ] Mostrar o painel do vendedor só com a própria carteira @Agrospy !10/12/2026
    > O Comercial abre o mesmo painel limitado à carteira dele, mesmo se pedir outro vendedor pela API. O Operador não tem acesso. Fecha pela prova automática. SPEC-3-005, CA-3-26.
  - [ ] Conferir os números do painel com a base @Agrospy !11/12/2026
    > Os 3 indicadores semanais passam a ser calculados no servidor e mostram erro em vez de 0 quando falham. A antiga "Visão do gestor" leva ao painel. Inclui as provas visuais e de tempo. Fecha pela prova automática. SPEC-3-005, CA-3-29.
- [ ] Ligar produtores das duas empresas e importar a carteira @Agrospy !16/12/2026
  > O produtor atendido pela Agrospy e pela Rumo Agro fica relacionado, com o histórico de cada empresa separado. A carteira entra por planilha, com prévia, relatório das linhas recusadas e opção de desfazer o lote. Fecha pela prova automática. SPEC-3-006, CA-3-30 a CA-3-34.
  - [ ] Relacionar o mesmo produtor na Agrospy e na Rumo Agro @Agrospy !14/12/2026
    > Quem é Administrador das duas empresas vê os pares sugeridos (mesmo CPF/CNPJ ou mesmo nome e município) e relaciona. A ficha mostra "Também na Rumo Agro" só para quem acessa as duas, e o toque troca de empresa. Quem acessa uma só não vê nada da outra. Fecha pela prova automática. SPEC-3-006, CA-3-30 e CA-3-31.
  - [ ] Conferir a prévia da planilha antes de importar @Agrospy !14/12/2026
    > Tela "Importar carteira" com o modelo para baixar. O arquivo (CSV ou Excel) vira uma prévia com novos, já cadastrados e recusados, com a linha e o motivo, sem gravar nada. O Maestro pede uma vez a planilha de etapas de serviço da Agrospy (CL-001), sem travar. Fecha pela prova automática. SPEC-3-006, CA-3-32.
  - [ ] Importar a carteira sem duplicar produtor @Agrospy !15/12/2026
    > "Importar" cria só os produtores novos, com propriedade e serviço na etapa informada, e não mexe nos que já existem. Importar duas vezes não duplica nada. Só o Administrador da empresa importa. Fecha pela prova automática. SPEC-3-006, CA-3-33.
  - [ ] Desfazer uma importação inteira @Agrospy !16/12/2026
    > "Desfazer" apaga o que o lote criou e ainda não teve visita, oportunidade ou serviço novo. O que já foi usado fica e aparece listado. Fecha pela prova automática. SPEC-3-006, CA-3-34.
