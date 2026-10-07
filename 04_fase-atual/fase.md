# Fase 1 — Tarefas

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

- [ ] Conectar o Skip ao Maestro e criar o projeto do sistema comercial @Agrospy !06/10/2026  <!-- id:3f7fb2d0-64a9-459f-a006-44805554d4cc -->
  > Preparação da Fase 1. Ligar a conta Skip do Diogo ao Maestro e criar o projeto onde o sistema comercial vai morar.
  > Pronto quando o projeto abre pelo link e o Maestro consegue trabalhar nele. SPEC-1-001 (pré-condições).
  - [ ] Conectar a conta Skip no Maestro @Agrospy !06/10/2026  <!-- id:c1886bd3-5193-4208-a20e-187112a261e8 -->
    > No Maestro: Conectores → Skip → Conectar, com o login do Diogo. Prova: print do Skip como conectado.
  - [ ] Criar o projeto do sistema comercial no Skip pelo Maestro @Agrospy !06/10/2026  <!-- id:ceeec8f6-4f9d-4db1-becd-2eb47ee2a5e1 -->
    > Pedir ao Maestro para criar no Skip o projeto do sistema comercial da Agrospy e da Rumo Agro e guardar nele as SPECs da Fase 1. Prova: link do projeto abrindo.
- [ ] Montar o login e a escolha de empresa (Agrospy ou Rumo Agro) @Agrospy !07/10/2026  <!-- id:e6893843-4b81-4fb9-8fe4-f6b841e9aa6d -->
  > Cada pessoa entra com e-mail e senha próprios e escolhe em qual empresa vai trabalhar; quem só tem uma empresa entra direto.
  > Prova: teste sem login recusado e prints das telas. SPEC-1-001, CA-1-01 e CA-1-02.
  - [ ] Cadastrar as duas empresas com nome, cor e logo @Agrospy !07/10/2026  <!-- id:47d2b87b-3e1d-4124-96cf-03eebe97b85f -->
    > Criar Agrospy e Rumo Agro no sistema, cada uma com nome, cor e logo próprios. Prova: lista das duas empresas no Skip.
  - [ ] Mostrar a empresa ativa em todas as telas e permitir trocar @Agrospy !07/10/2026  <!-- id:70cb051a-c050-40ef-a76b-2a4758ea6a58 -->
    > O topo de todas as telas mostra logo, nome e cor da empresa ativa e o botão “Trocar empresa”, que limpa da tela os dados da anterior. Prova: prints nas duas empresas.
- [ ] Configurar os perfis e a tela de usuários do administrador @Agrospy !08/10/2026  <!-- id:f1624dc7-d84e-424d-840b-414ed775636e -->
  > Perfis por empresa: Administrador, Gestão, Comercial e Operador, como combinado na call de 22/09. O administrador cria usuário, dá o perfil e desativa quando precisar.
  > Ninguém consegue aumentar o próprio acesso. Prova: teste da API e prints. SPEC-1-001, CA-1-05.
  - [ ] Criar a tela de usuários para o administrador @Agrospy !08/10/2026  <!-- id:0e80de88-0d2e-4042-bd9b-ba197320b2ff -->
    > Tela “Usuários” da empresa ativa: criar com senha temporária, alterar perfil e desativar. Prova: prints da tela e o usuário desativado perdendo o acesso.
  - [ ] Criar os usuários de teste de cada perfil @Agrospy !08/10/2026  <!-- id:f1425ca3-e9c6-4675-b37c-f072c518932e -->
    > Usuários de teste (um por perfil na Agrospy, um Comercial na Rumo Agro e um com perfis diferentes nas duas) para provar o acesso sem usar dados reais. Prova: lista dos usuários de teste.
- [ ] Criar o cadastro de produtor e propriedade com a origem da indicação @Agrospy !09/10/2026  <!-- id:147a4f1b-2f57-4098-833b-ce69a962b4b6 -->
  > Cadastro do produtor com de onde veio, quem indicou, de quem é próximo e o responsável (a carteira), mais as propriedades com município e área.
  > Prova: testes de validação e prints do cadastro e da ficha. SPEC-1-002, CA-1-06 a CA-1-09.
  - [ ] Cadastrar produtor com quem indicou e responsável pela carteira @Agrospy !09/10/2026  <!-- id:761c4105-3d3f-4bdb-9d9d-462422092837 -->
    > Quando a origem é indicação, “quem indicou” é obrigatório; quem cadastra vira o responsável. Prova: print do cadastro e teste da indicação sem nome sendo recusada.
  - [ ] Cadastrar propriedade com município, área e localização @Agrospy !09/10/2026  <!-- id:eaf9ddb6-e396-4766-be07-45f78d0ec093 -->
    > Propriedade ligada ao produtor, com município, área em hectares, posse e, se quiser, a localização do celular. Prova: print da ficha com a propriedade.
  - [ ] Avisar quando o produtor já estiver cadastrado @Agrospy !09/10/2026  <!-- id:9eef36f2-fb98-4daf-9164-d49e269f7aa8 -->
    > CPF/CNPJ repetido na mesma empresa é barrado; mesmo nome e município geram aviso de possível duplicado. Prova: print do aviso e teste da API.
- [ ] Criar o registro de visita com o roteiro da conversa @Agrospy !13/10/2026  <!-- id:ae167e8a-d5f2-4d51-b78f-9b9aa5acda14 -->
  > Registrar a visita em poucos toques: data, produtor e o que foi conversado (dá para ditar pelo teclado do celular); o resto do roteiro fica em “Mais detalhes”.
  > Prova: prints do formulário e da ficha. SPEC-1-003, CA-1-10 e CA-1-13.
  - [ ] Montar o formulário curto da visita @Agrospy !13/10/2026  <!-- id:979d69ff-c333-4509-a9a1-41476245aa04 -->
    > Só três campos obrigatórios; estrutura, perfil tecnológico, investimento, máquinas, necessidades e acordos ficam opcionais. Prova: print do formulário.
  - [ ] Mostrar visitas e oportunidades na ficha do produtor @Agrospy !13/10/2026  <!-- id:bd7652e9-6149-4aa2-bce3-30d517108d4d -->
    > A ficha mostra visitas e oportunidades da mais recente para a mais antiga, com quem registrou. Prova: print da ficha.
- [ ] Registrar oportunidades com responsável e próxima ação obrigatória @Agrospy !14/10/2026  <!-- id:448d4044-5617-4296-806b-371ec39e9a51 -->
  > Toda visita termina com um próximo passo e toda oportunidade aberta tem linha de negócio, responsável, próxima ação e data.
  > Prova: testes de recusa e prints. SPEC-1-003, CA-1-11, CA-1-12 e CA-1-14.
  - [ ] Configurar as linhas de negócio de cada empresa @Agrospy !14/10/2026  <!-- id:6850e423-a005-4c52-97c3-84c04bbc219f -->
    > Carregar as linhas da Agrospy e da Rumo Agro e o Diogo confirmar quais são de cada empresa. Prova: lista por empresa confirmada pelo Diogo.
  - [ ] Exigir o próximo passo ao salvar cada visita @Agrospy !14/10/2026  <!-- id:623899c6-debc-4514-85f7-d6e0857871c0 -->
    > Ao salvar: nova oportunidade, atualizar uma oportunidade aberta ou “sem oportunidade agora” com motivo. Prova: visita sem próximo passo sendo recusada.
  - [ ] Concluir e reagendar a próxima ação guardando o histórico @Agrospy !14/10/2026  <!-- id:9705e5f8-3cd7-4336-b9ff-7e00dfc1615a -->
    > Concluir pede o resultado e a próxima ação; reagendar pede a nova data. O histórico não pode ser apagado. Prova: print do histórico da oportunidade.
- [ ] Montar a tela Minha carteira com ações atrasadas, de hoje e próximas @Agrospy !15/10/2026  <!-- id:baad9730-ed85-4a49-a5e9-6a3b8a30454a -->
  > Tela inicial do vendedor: atrasadas, hoje, próximos 7 dias e depois, com atalhos para concluir ou reagendar.
  > Prova: datas de teste nos grupos certos. SPEC-1-005, CA-1-20 e CA-1-21.
- [ ] Montar a visão do gestor com a carteira de toda a equipe @Agrospy !15/10/2026  <!-- id:684e8557-4e70-420b-8479-a570f9ff33ad -->
  > Para Gestão e Administrador: ações atrasadas, de hoje e da semana por responsável, produtores sem oportunidade aberta e visitas da semana.
  > Prova: números da tela iguais aos da base. SPEC-1-005, CA-1-22.
- [ ] Instalar o app no celular e registrar visita sem internet @Agrospy !16/10/2026  <!-- id:4da366fe-2f89-4585-88dc-c46b28672483 -->
  > Usar o sistema no campo sem sinal: o app fica na tela inicial, guarda o que foi registrado e envia sozinho quando a internet volta, sem duplicar.
  > Prova: gravação em modo avião e conferência no servidor. SPEC-1-004, CA-1-15 e CA-1-16.
  - [ ] Deixar o app instalável na tela inicial do celular @Agrospy !15/10/2026  <!-- id:394e3cf8-1f15-48ca-ae90-b2b4c5c6cf57 -->
    > Ícone na tela inicial do Android e do iPhone da empresa, abrindo mesmo sem internet. Prova: print do ícone e do app abrindo em modo avião.
  - [ ] Guardar visita, oportunidade e produtor novo sem internet @Agrospy !16/10/2026  <!-- id:97a859bc-947a-4f36-b0c0-43b7ba743b3c -->
    > Sem sinal, só criar registros novos; editar cadastro antigo pede internet. Prova: gravação em modo avião mostrando “aguardando envio”.
  - [ ] Enviar automaticamente o que ficou pendente ao voltar a internet @Agrospy !16/10/2026  <!-- id:8971a540-0b68-46a4-ab73-59d77ffed401 -->
    > Ao voltar o sinal, abrir o app ou tocar “Sincronizar agora”, tudo é enviado uma vez só. Prova: conferência no servidor de que cada registro existe uma única vez.
- [ ] Testar o acesso: outra empresa e perfil sem permissão ficam bloqueados @Agrospy !16/10/2026  <!-- id:ed490cca-8143-49af-9065-856a9f9ade9c -->
  > Prova de que a Agrospy e a Rumo Agro não se misturam e de que cada perfil só faz o que foi combinado, testando também por fora da tela.
  > Depende das telas de produtor, visita e oportunidade prontas. Prova: tabela perfil × recurso preenchida. SPEC-1-001, CA-1-03 e CA-1-04.
  - [ ] Testar que a Rumo Agro não vê dados da Agrospy, nem por fora da tela @Agrospy !16/10/2026  <!-- id:caf0d8ff-2613-4382-a118-95e1f2134e0e -->
    > Com o usuário de teste da Rumo Agro, listar, abrir e criar registros da Agrospy — tudo deve ser recusado, e o mesmo no sentido inverso. Prova: respostas dos testes.
  - [ ] Testar o que cada perfil pode ver e editar @Agrospy !16/10/2026  <!-- id:d37a78c4-d2a3-405a-bad8-38233f11db40 -->
    > Para cada usuário de teste, conferir na tabela de permissões o que pode ver, criar e editar. Prova: tabela com o esperado e o obtido.
- [ ] Cadastrar a equipe da Agrospy e da Rumo Agro com o perfil certo @Agrospy !16/10/2026  <!-- id:6af46d50-9e9c-4182-b201-865b2bf00278 -->
  > Depois do teste de acesso aprovado, o Diogo cadastra cada pessoa com e-mail, empresa e perfil (ex.: Linessa em Gestão, Alisson em Comercial, Carlos e Lucas em Operador).
  > Prova: lista de usuários por empresa e perfil. SPEC-1-001, CA-1-05.
- [ ] Testar falhas de envio sem perder nenhum registro @Agrospy !19/10/2026  <!-- id:f5877532-2383-4554-a079-f61bc68dd8cc -->
  > Provar que, mesmo com falha de sinal, sessão vencida ou cadastro repetido, nada se perde e nada duplica.
  > Prova: prints e gravações de cada caso. SPEC-1-004, CA-1-17 a CA-1-19.
  - [ ] Testar envio interrompido sem duplicar registros @Agrospy !19/10/2026  <!-- id:8d83c95c-d8b4-429c-81ed-be79b7bf7c46 -->
    > Cortar a internet no meio do envio e reconectar. Prova: cada registro aparece uma única vez no servidor.
  - [ ] Testar sessão expirada, cadastro duplicado e acesso removido @Agrospy !19/10/2026  <!-- id:f694b486-cffc-4841-b5ff-98a64d0ff182 -->
    > Os três casos devem ir para “Pendências de envio” com o motivo, sem apagar o registro. Prova: prints da tela de pendências.
- [ ] Demonstrar o fluxo completo da Fase 1 no celular @Agrospy !19/10/2026  <!-- id:8187b1f6-4eef-42e6-91ca-32cfe9b2eaa4 -->
  > Com um produtor real: entrar, escolher a empresa, cadastrar a indicação, registrar a visita sem internet, criar a oportunidade, sincronizar, ver na carteira e na visão do gestor, e confirmar que a outra empresa não vê.
  > Prova: gravação de tela. SPEC-1-005, CA-1-23.
- [ ] Fazer a call de validação da Fase 1 com a Agrospy @"Rodrigo Santos" !20/10/2026  <!-- id:7acbab78-166f-4684-91ad-13dda69e9901 -->
  > Call com o Diogo para ele testar o fluxo completo e conferir os perfis de cada pessoa (inclusive se o vendedor deve consultar o cadastro de outros vendedores).
  > Resultado: “testei, pode seguir” ou a lista do que mudar. SPEC-1-005, teste humano CL-004.
- [ ] Revisar as evidências e decidir o fechamento da Fase 1 @"Rodrigo Santos" !20/10/2026  <!-- id:99563d4a-ae5b-488a-a4ba-b45b7d24bfea -->
  > Conferir as evidências de todas as SPECs da Fase 1 e decidir se a fase fecha ou o que fica pendente.
  > Resultado: decisão registrada no card. SPEC-1-005, CA-1-24.
