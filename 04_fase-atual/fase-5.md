# Fase 5 — Tarefas

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


- [ ] Registrar a auditoria das operações críticas @Agrospy
  > Cada operação crítica (troca de responsável, perfil, aprovação de pagamento, contrato, fechamento de RDV, golpe, chaves de IA) fica registrada com quem e quando, sem edição. Fecha pela prova automática. SPEC-5-001, CA-5-01 a CA-5-03.
  - [ ] Gravar a trilha de auditoria das ações críticas @Agrospy
    > Uma linha por ação da lista, na mesma operação, sem dados pessoais; ninguém altera nem apaga. O histórico anterior é copiado. Fecha pela prova automática. SPEC-5-001, CA-5-01 e CA-5-02.
  - [ ] Mostrar a auditoria para o Administrador @Agrospy
    > Tela com filtros por período, ação e pessoa, detalhe do antes e depois e exportação em CSV. Fecha pela prova automática. SPEC-5-001, CA-5-03.
- [ ] Desligar usuário sem perder a carteira @Agrospy
  > Quem sai da empresa é desligado numa tela só: a carteira vai para outra pessoa com histórico e o acesso é cortado. O relatório de uso orienta os ajustes finais. Fecha pela prova automática. SPEC-5-002, CA-5-04 a CA-5-06.
  - [ ] Desligar usuário com transferência da carteira @Agrospy
    > Produtores, oportunidades abertas e ações vão ao destino escolhido; vínculo, chaves, notificações e sessão são cortados. O último Administrador não sai. Fecha pela prova automática. SPEC-5-002, CA-5-04 e CA-5-05.
  - [ ] Mostrar o relatório de uso do app @Agrospy
    > Por semana: quem usa, visitas por origem, tempo do registro, despesas por origem e telas com erro. Fecha pela prova automática. SPEC-5-002, CA-5-06.
- [ ] Ver as áreas dos produtores no mapa @Agrospy
  > O arquivo KML de cada propriedade vira contorno no mapa da ficha e no mapa da carteira, com nome e área de cada talhão. Fecha pela prova automática. SPEC-5-003, CA-5-07 a CA-5-09.
  - [ ] Desenhar as áreas do KML na ficha do produtor @Agrospy
    > Aba "Mapa" em satélite com os talhões, área calculada e aviso quando difere do cadastro. Aceita KML e KMZ. Fecha pela prova automática. SPEC-5-003, CA-5-07 e CA-5-08.
  - [ ] Mostrar o mapa da carteira @Agrospy
    > Produtores da carteira no mapa, coloridos pela classificação, só os que cada pessoa pode ver; o toque abre a ficha. Fecha pela prova automática. SPEC-5-003, CA-5-09.
- [ ] Sugerir produtores para reabordar (LOOP-02) @Agrospy
  > Toda semana, cada vendedor recebe no app até 5 produtores esquecidos com o motivo e a sugestão de abordagem; ele decide. O loop mede quantos viram contato. Fecha pela prova automática. SPEC-5-004, CA-5-10 a CA-5-12.
  - [ ] Sugerir com IA os produtores para reabordar @Agrospy
    > Seleção por regra (sem contato há 60 dias, serviço da safra passada, janela próxima) e texto da IA com o motivo e a abordagem. Fecha pela prova automática. SPEC-5-004, CA-5-10.
  - [ ] Mostrar as sugestões e registrar a decisão do vendedor @Agrospy
    > Grupo "Sugeridos pela IA" nas prioridades: aceitar cria a ação de reabordar; descartar pede motivo. Nada é enviado ao produtor. Fecha pela prova automática. SPEC-5-004, CA-5-11.
  - [ ] Configurar e rodar o ciclo de reativação no Maestro @Agrospy
    > Conta quantas sugestões viraram visita, oportunidade ou ação em 14 dias, compara com a meta e registra o veredito semanal. Fecha pela prova automática. SPEC-5-004, CA-5-12.
- [ ] Validar o sistema inteiro de ponta a ponta @Agrospy
  > Regressão automática das fases 1 a 5 nas empresas de teste, relatório final com pendências e riscos e a decisão de go-live do Diogo com o consultor. Fecha pela prova automática. SPEC-5-005, CA-5-13 a CA-5-15.
  - [ ] Montar a regressão automática das fases 1 a 5 @Agrospy
    > Um comando roda os 20 cenários de validação contra o app publicado e guarda a evidência de cada um. Fecha pela prova automática. SPEC-5-005, CA-5-13.
  - [ ] Rodar a validação e publicar o relatório final @Agrospy
    > Rodada final sem falha aberta, com as integrações em espera listadas, e relatório por fase com placar, evidências, pendências e riscos. Fecha pela prova automática. SPEC-5-005, CA-5-14 e CA-5-15.
  - [ ] Registrar a decisão de go-live com o Diogo @Agrospy
    > Último passo do projeto: com o relatório final, o Diogo e o consultor registram se liberam o uso pleno. É decisão, não teste. SPEC-5-005, CA-5-15.
