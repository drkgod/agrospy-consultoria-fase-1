# SPEC-3-003 — Telas do app no novo visual

**Fase:** 3
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:**
- RQ-001 (registro de visita no campo), RQ-002 (captura assistida e supervisão humana), RQ-003 (carteira e multiempresa), RQ-004 (acesso individual) e RQ-005 (follow-up e notificações);
- pedido do consultor de 17/11/2026: "melhora todo o design pra ficar mais parecido com um app mesmo" e "deixar mais bem feito".

**Degrau da solução:** reuso.
- **Reuso:** os componentes de `src/components/app/` e os tokens da SPEC-3-002. Os serviços atuais ficam sem mudança.
- **Escopo:** só muda a apresentação. Nenhuma consulta, regra ou rota nova, além das views e da vitrine das telas.

## Contexto e decisões fechadas

- **Estado atual:** as telas das fases 1 e 2 usam `Card`, `Button`, `Dialog` e `select` nativos com os tokens de fábrica do Skip.
  - **Telas:** Minha carteira (`/`), Produtores, Ficha do produtor, Registrar visita, Rascunhos, Revisar rascunho, Pendências, Visão do gestor, Linhas de negócio, Usuários, Login e Escolher empresa.
  - **Telas da fase 2:** Avisos, Assistente, Enviar gravação e Pasta do Drive. Elas existem no Skip (versão 0.0.213), mas não estão no espelho.
  - **Confirmações:** Pendências, Rascunhos e Revisar rascunho usam `confirm(`.
  - **Mensagens:** todas as telas usam `useToast`.
  - **Formulário de visita:** uma página longa.
  - **Ficha do produtor:** empilha Contato, Origem, Responsável, Tecnologia, Destaque para a próxima visita, Oportunidades, Visitas e Propriedades numa coluna só.
- **Estado desejado:**
  - cada tela segue a casca e os componentes da SPEC-3-002;
  - a tela inicial vira "Hoje", com a agenda do dia em destaque;
  - formulários longos viram passos curtos com o botão principal fixo no rodapé;
  - listas viram `ListaItem` com ícone em círculo;
  - confirmações vão para a `Folha`;
  - mensagens passam todas pelo `sonner`.
- **Decisões já fechadas:**
  - **Separação em views:** cada tela passa a ter uma view sem acesso a dados, em `src/views/<Tela>View.tsx`, que recebe tudo por props. A página em `src/pages/` busca os dados com os serviços atuais e renderiza a view. A vitrine renderiza as mesmas views com dados fictícios em `/vitrine/telas/<tela>`, e é assim que as telas são provadas visualmente sem login.
  - **Regras intocadas:** grupos, ordem, destinos, validações e mensagens de regra das fases 1 e 2 continuam iguais. Exemplos: RN-26 e RN-27 da carteira; próxima ação obrigatória; data passada recusada; rascunho só entra no histórico depois de confirmado. Muda o texto de interface, não a regra.
  - **Sem dado novo:** os números de "Hoje" saem do que a tela já carrega (grupos da carteira, contagem de rascunhos e avisos não lidos).
  - **Visão do gestor:** os indicadores semanais e a tabela por responsável continuam com a consulta atual. Painéis novos de funil são de outra SPEC desta fase.
  - **Sem pedido ao cliente:** textos de interface seguem a lista "Textos fixos". Nada de texto novo depende do cliente.
- **Bloqueios:** nenhum. Depende da SPEC-3-002 aceita.

## Resultado observável

Todas as telas do app, no celular e no computador, estão no visual da SPEC-3-002. A tela inicial mostra a agenda do dia num cartão de destaque. A ficha do produtor tem cabeçalho e abas. O registro de visita é feito em 3 passos, com botão fixo embaixo. Avisos é uma lista com não lidos marcados. O Assistente parece um chat.

Cada tela tem quatro estados visíveis:
- **carregando:** esqueleto;
- **vazio:** com orientação;
- **erro:** com "Tentar de novo";
- **sem internet:** aviso no topo e dados guardados quando houver.

A vitrine mostra todas as telas e estados com dados fictícios.

## Limites e dependências

- **Inclui:**
  - `src/views/*` (uma view por tela da lista "Telas");
  - as páginas de `src/pages/*` e as telas da fase 2 que renderizam essas views;
  - `src/fixtures/vitrine.ts` (ampliado) e as rotas `/vitrine/telas/:tela`;
  - a migração de `useToast` para `sonner` e a retirada do `Toaster` antigo do `App.tsx`;
  - a troca de todo `confirm(` pela `Folha` de confirmação;
  - a retirada de `src/components/Layout.tsx`, que a SPEC-3-002 deixou sem uso.
- **Fora de escopo:**
  - serviços, hooks, migrações, coleções e regras de acesso;
  - telas novas de funil, proposta, desfecho, painéis e importação, que são de outras SPECs da fase;
  - mudança de regra, campo ou texto de regra;
  - a ativação da notificação no celular, que é de outra SPEC. Esta SPEC só põe no visual novo o cartão de ativação que existir em Avisos.
- **Entradas e pré-condições:**
  - SPEC-3-002 aceita: casca, componentes, tokens e ferramentas;
  - conector do Skip 64376.
- **Saídas e artefatos:**
  - **no Skip:** os arquivos de "Inclui";
  - **no repositório:** as evidências em `05_entregas/fase-3/spec-3-003/` e os testes novos em `07-sistemas/comercial/tools/tests/`.
- **Dependências e responsáveis:** a Agrospy executa com o Maestro. Nada depende de ação do Diogo.
- **Atores e permissões mínimas:** iguais às de hoje, por perfil. A view nunca decide permissão: a página passa só o que o perfil pode ver e fazer.
- **Superfícies afetadas:** frontend do Skip 64376.
- **Risco e plano B:**
  - **Regressão de regra:** cada página mantém o serviço e as validações atuais, e a view é só apresentação. A prova de regressão roda as regras de cada tela pela API e pela interface.
  - **Tela grande demais para uma sessão:** a view pode ser dividida em subcomponentes dentro de `src/views/<tela>/`.
- **Rollback:** voltar a versão anterior do Skip. Nenhum dado é alterado.

## Telas (layout fechado)

Todas usam o `AppShell`. "Celular" vale até 1023px e "computador" a partir de 1024px. No computador, telas com coluna lateral usam a grade principal 2/3 + lateral 1/3, a partir de 1280px.

### 1. Hoje (`/`, Comercial, Gestão e Administrador)

O Operador continua caindo em Produtores.

- **Cabeçalho:**
  - `CabecalhoSaudacao`;
  - à direita, os círculos do Assistente (`MessageCircle`) e de Avisos (no celular, o sino fica só na barra de abas).
- **`AvisoTopo`:** do tipo `pendentes` ("N registro(s) aguardando envio") ou `offline`, quando for o caso.
- **`CartaoDestaque` "Sua agenda":**
  - **valor:** ações de hoje;
  - **selo:** "N atrasadas", em tom de falha, quando houver;
  - **segmentos:** Atrasadas, Hoje e Próximos 7 dias;
  - **rodapé:** Depois, Sem oportunidade (produtores sem oportunidade aberta) e Rascunhos (para revisar, com link para `/rascunhos`; não aparece para quem não vê Rascunhos);
  - **ação:** "Ver agenda" rola até a lista.
- **`FiltroPilulas`:** Atrasadas, Hoje, Próximos 7 dias e Depois, cada uma com contador.
  - **Padrão:** Atrasadas, se houver; senão, Hoje.
  - A troca de pílula não recarrega dados.
- **Lista (`Cartao` com `ListaItem`):** os itens do grupo, na ordem RN-27.
  - **ícone:** `Sprout`;
  - **título:** o produtor;
  - **subtítulo:** "linha de negócio · próxima ação";
  - **direita:** `dataRelativa` e, se atrasada, `Selo` falha "N dias de atraso".
  - **Ao tocar:** abre a `Folha` da oportunidade, com o `AcaoOportunidadeForm` atual (concluir ou reagendar) e o `BotaoSecundario` "Abrir ficha".
- **`Cartao` "Produtores sem oportunidade aberta":** até 5 `ListaItem` e "Ver todos" (abre a lista completa numa `Folha`).
- **Rodapé da tela:** "Última sincronização: dd/mm às hh:mm", em legenda.
- **Computador:**
  - coluna principal com o destaque e a lista;
  - lateral com "Produtores sem oportunidade aberta" e um `Cartao` "Rascunhos para revisar" (até 3 `ListaItem`, para quem vê Rascunhos).
- **Reconciliação:** os números do `CartaoDestaque` e dos contadores das pílulas são as contagens dos grupos que a tela já carrega. O teste confere a igualdade.

### 2. Produtores (`/produtores`)

- **Cabeçalho:** `CabecalhoTela` "Produtores", com a ação de ícone `Plus`, que abre o formulário atual de novo produtor numa `Folha`. Só aparece para quem já pode criar.
- **Busca:** campo em pílula com `Search`, 16px. Filtra a lista carregada pelo mesmo critério atual. Aceita `?busca=` vindo do menu do computador.
- **`FiltroPilulas`:**
  - "Todos", "Clientes", "Potenciais" e "Não potenciais", pelo campo de classificação da ficha (fase 2);
  - produtor sem classificação aparece só em "Todos".
- **Lista:** `ListaItem` com:
  - as iniciais no círculo;
  - o nome;
  - o subtítulo "município · responsável";
  - à direita, o `Selo` da classificação: cliente em `marca`, potencial em `bom` e não potencial em `neutro`.
- **Edição:** o formulário de edição (campos atuais: Nome, CPF/CNPJ, Telefone, E-mail, Município, Regional, Origem, Quem indicou, Próximo de quem, Nível de tecnologia, Observações) abre em `Folha`, com os mesmos campos obrigatórios e mensagens.

### 3. Ficha do produtor (`/produtores/:id`)

- **`CabecalhoTela`:** voltar para Produtores; ação "Editar produtor" em círculo (`Pencil`).
- **Cartão de cabeçalho (`Cartao`):**
  - iniciais em círculo de 56px;
  - nome com 22px;
  - `Selo` da classificação e época de maior efetividade (fase 2);
  - linha "município · responsável";
  - pílulas de ação: `BotaoPrimario` "Registrar visita", `BotaoSecundario` "Gravar pós-visita" (o componente atual) e, se o perfil puder, `BotaoSecundario` "Trocar responsável" (fluxo atual, agora em `Folha`).
- **`CartaoDestaque` "Para a próxima visita":** o conteúdo do destaque da revisita que já existe (demandas atendíveis na época, última conversa e histórico curto). Sem dados, a seção some.
- **Abas (`FiltroPilulas`):** Resumo, Oportunidades (N), Visitas (N), Propriedades (N) e Perfil.

  | Aba | Conteúdo |
  |---|---|
  | Resumo | contato, origem, responsável e tecnologia, em lista chave–valor dentro de `Cartao` |
  | Oportunidades | `ListaItem` por oportunidade (linha, próxima ação, data, selo de atraso); tocar abre a `Folha` com concluir ou reagendar |
  | Visitas | `ListaItem` por visita (data, assuntos resumidos, ícone `Mic` quando há áudio); tocar abre a visita numa `Folha` com o player |
  | Propriedades | `ListaItem` por propriedade e "Adicionar propriedade" em `Folha`, com o mesmo formulário e as mesmas regras de exclusão |
  | Perfil | os campos de perfil e classificação da fase 2, editáveis do mesmo jeito, em `Cartao` |

- **Computador:** coluna principal com as abas; lateral com o cartão de cabeçalho e o "Para a próxima visita".

### 4. Registrar visita (`/produtores/:id/visita`)

Três passos, com a barra de abas escondida. No topo, `CabecalhoTela` "Registrar visita" com fechar (`X`), o nome do produtor em legenda e 3 pontos de progresso.

| Passo | Conteúdo (campos e regras atuais) | Rodapé fixo |
|---|---|---|
| 1. A conversa | data da visita; assuntos (com "Transcrever o que eu falar"); "Áudio da conversa (opcional)", com gravar ou anexar | `BotaoPrimario` "Continuar" |
| 2. Próximo passo | "Qual o próximo passo?", com os três destinos atuais em cartões tocáveis (nova oportunidade, atualizar oportunidade aberta, sem oportunidade); campos do destino escolhido; atalhos de data em pílula (7, 15 e 30 dias) | "Voltar" (`BotaoSecundario`) + "Continuar" |
| 3. Revisar | resumo de tudo em `Cartao`, com "Editar" por bloco | "Voltar" + `BotaoPrimario` "Salvar visita" |

- **Validações:** as mesmas de hoje, no passo em que o campo aparece. Exemplos: próxima ação obrigatória e data passada recusada, com a mensagem atual embaixo do campo.
- **Ao avançar:** "Continuar" só avança com o passo válido.
- **Sem internet:** salva na fila como hoje e mostra o `sonner` "Visita guardada no celular. Envia quando a internet voltar."
- **Fechar com dados preenchidos:** pede confirmação na `Folha`.

### 5. Rascunhos (`/rascunhos`) e Revisar rascunho (`/rascunhos/:id`)

- **Lista (`FiltroPilulas`):** "Para revisar", "Processando" e "Com falha", pelos estados atuais. Cada rascunho é um `ListaItem` com:
  - o ícone da origem: `Mic` (áudio no app), `FileText` (arquivo ou Plaud), `MessageCircle` (assistente) e `FolderOpen` (pasta do Drive);
  - o produtor identificado ou "Produtor não identificado";
  - o subtítulo com `dataRelativa` e a duração ou o nome do arquivo;
  - o `Selo` do estado.
- **Ações:** "Tentar de novo" e "Descartar" ficam numa `Folha` de ações. A confirmação usa a `Folha` de confirmação, no lugar do `confirm(`.
- **Revisar** (barra de abas escondida):
  - `CabecalhoTela` "Revisar pós-visita";
  - `Cartao` com o player de áudio, se houver;
  - "Transcrição", recolhível;
  - os campos atuais agrupados em `Cartao`s: Produtor; O que foi conversado; Próximo passo (linha de negócio, descrição, próxima ação, data, motivo);
  - rodapé fixo com `BotaoSecundario` "Descartar" (com confirmação) e `BotaoPrimario` "Confirmar e salvar na ficha".
  - As regras de confirmação ficam as mesmas: idempotente, não duplica e grava na ficha.

### 6. Pendências de envio (`/pendencias`)

`CabecalhoTela` "Pendências de envio". Cada item da fila offline vira um `ListaItem` com:
- o tipo (visita, produtor, áudio);
- a hora;
- o `Selo` "Aguardando envio" (neutro) ou "Falhou" (falha).

"Tentar de novo" e "Descartar" ficam numa `Folha`, com confirmação. Sem itens, `EstadoVazio` "Tudo enviado".

### 7. Avisos (rota atual da fase 2)

- **Cabeçalho:** `CabecalhoTela` "Avisos".
- **Ativação:** se existir o cartão de ativação da notificação no celular, ele vira um `Cartao` com o ícone `BellRing`, um texto curto e o `BotaoPrimario` "Ativar avisos no celular".
- **Lista:** agrupada em "Hoje" e "Anteriores". Cada aviso é um `ListaItem` com:
  - o ícone `CalendarClock` (aviso do dia), `AlertTriangle` em tom de atenção (atraso) ou `Copy` (cópia ao gestor);
  - o título com o produtor;
  - o subtítulo com a ação;
  - à direita, a hora;
  - `naoLido` com ponto.
- **Ao tocar:** abre o link do aviso e marca como lido, como hoje.

### 8. Assistente (rota atual da fase 2)

Chat em tela cheia, com a barra de abas escondida e `CabecalhoTela` "Assistente" com voltar.
- **Mensagens:**
  - **da pessoa:** balões à direita, `bg-marca text-primary-foreground` e `rounded-2xl`;
  - **do assistente:** balões à esquerda em `.vidro`, com os links para registros como `ListaItem` compactos dentro do balão.
- **Campo:** fixo embaixo, com a área segura. Pílula com o texto e os círculos de microfone (voz, como hoje) e de enviar (`SendHorizontal`).
- **Sem internet:** `EstadoVazio` com `WifiOff`, "Sem internet: o assistente precisa de conexão" e o `BotaoPrimario` "Gravar pós-visita" (comportamento atual).
- **Primeira abertura:** sem histórico, mostra 3 sugestões em pílula ("Minhas ações de amanhã", "O que conversei com…", "Registrar um recado"). Tocar uma sugestão preenche o campo.

### 9. Enviar gravação (rota atual da fase 2)

- **Cabeçalho:** `CabecalhoTela` "Enviar gravação".
- **`Cartao` principal:**
  - ícone `Upload` em círculo;
  - o texto "Áudio (m4a, mp3, wav e outros) ou transcrição do Plaud (txt, docx ou pdf), até o limite atual";
  - o `BotaoPrimario` "Escolher arquivo".
- **Abaixo:** `Cartao` "Enviados recentemente", com `ListaItem` e o `Selo` do estado do rascunho.
- **Mensagens:** as atuais (formato inválido, tamanho e repetido) via `sonner`.

### 10. Visão do gestor (`/visao-gestor`)

> A SPEC-3-005 troca esta tela pelo `/painel`, com redirecionamento, e reaproveita estes blocos. Construa a faixa de indicadores, as atrasadas por responsável e a lista da equipe como blocos reaproveitáveis em `src/views/`. Não crie lógica de dados nova aqui.

- **Cabeçalho:** `CabecalhoTela` "Visão do gestor".
- **Filtro:** o filtro de responsável vira pílula `Select` à direita, ou `FiltroPilulas` quando houver até 4 responsáveis.
- **Indicadores da semana:** faixa de 3 `CartaoNumero`, com os mesmos números de hoje, a semana atual e a variação contra a anterior no selo (`variacao`):
  - prospecções realizadas;
  - visitas com potencial;
  - oportunidades com necessidade reconhecida.
- **Atrasadas:** `BarrasFinas` "Atrasadas por responsável", com os números da tabela atual.
- **Equipe:** `Cartao` "Equipe" com um `ListaItem` por responsável. O subtítulo traz "Hoje N · Próx. 7 dias N · Visitas 7d N" e a direita, o selo de atrasadas. A linha de totais fica no topo, em `Selo`s.
- **Lista:** `Cartao` "Produtores sem oportunidade aberta".
- **Reconciliação:** os números batem com a tabela atual.

### 11. Telas do Administrador

Linhas de negócio, Usuários e Pasta do Drive.
- **Cabeçalho:** `CabecalhoTela` com a ação `Plus` ("Nova linha" ou "Novo usuário").
- **Lista:** `ListaItem` com `Selo` "Ativa"/"Inativa" ou o perfil.
- **Formulários:** em `Folha`, com os campos atuais (Nome, E-mail, Perfil, Senha temporária; nome da linha; pasta e dono da configuração do Drive).
- **Confirmações:** desativar, reativar e excluir pedem confirmação na `Folha`. As proteções atuais continuam (linha fixa protegida, por exemplo).

### 12. Login (`/login`) e Escolher empresa (`/escolher-empresa`)

- **Login:**
  - fundo em degradê de página inteira;
  - `Cartao` central de 400px (no celular, largura total menos 32px) com o logotipo da Agrospy, o título "Entrar" e o subtítulo "Use o e-mail e a senha que o administrador cadastrou";
  - campos E-mail e Senha em pílula, com 16px e "mostrar senha";
  - `BotaoPrimario` "Entrar" em largura total;
  - erro embaixo do botão.
- **Escolher empresa:**
  - saudação "Olá, Nome";
  - pergunta "Em qual empresa você vai trabalhar?";
  - um `ListaItem` grande por empresa (logotipo de 48px, nome e perfil), com a cor da empresa num ponto.

### 13. Não encontrado

`EstadoVazio` "Página não encontrada", com `BotaoPrimario` "Voltar ao início".

## Estados de cada tela

Toda view recebe `estado: 'carregando' | 'pronto' | 'vazio' | 'erro' | 'offline'` e mostra:

| Estado | Apresentação |
|---|---|
| carregando | `Esqueleto` no formato do conteúdo (destaque, números, lista), sem texto "Carregando…" solto |
| vazio | `EstadoVazio` com o texto da lista "Textos fixos" |
| erro | `EstadoErro` "Não deu para carregar" + o texto da falha atual + "Tentar de novo" |
| offline | `AvisoTopo` offline. Com dados guardados (carteira e produtores, que a fase 1 já guarda), mostra os dados. Sem dados guardados, mostra `EstadoVazio` "Sem internet" com o que dá para fazer offline (registrar visita, gravar pós-visita) |

**Textos fixos dos vazios:**
- **Hoje sem ações:** "Nenhuma ação na agenda. Registre uma visita para criar a próxima ação."
- **Produtores:** "Nenhum produtor ainda. Toque em + para cadastrar."
- **Rascunhos:** "Nenhum rascunho para revisar."
- **Avisos:** "Nenhum aviso por enquanto."
- **Pendências:** "Tudo enviado."
- **Enviados recentemente:** "Nenhuma gravação enviada ainda."
- **Busca sem resultado:** "Nada encontrado para 'termo'."

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| páginas → serviços atuais | Skip | os mesmos de hoje | sessão e regras atuais | as atuais | `EstadoErro` + "Tentar de novo", que repete a mesma chamada |
| `/vitrine/telas/:tela` | `src/fixtures/vitrine.ts` | dados fictícios por tela e estado | pública | — | — |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-89 | toda tela | view sem acesso a dados; página com o serviço atual | — | esta SPEC |
| RN-90 | toda confirmação | `Folha` de confirmação; nenhum `confirm(` ou `alert(` | — | esta SPEC |
| RN-91 | toda mensagem | `sonner`; o `Toaster` antigo sai | — | esta SPEC |
| RN-26/RN-27 | carteira | grupos e ordem iguais aos de hoje | — | fase 1 |

## Fluxo e regras

| Cenário | Dado ou condição | Resultado esperado | Caminho de erro ou recuperação |
|---|---|---|---|
| Principal | Comercial com 2 atrasadas e 3 de hoje | Hoje mostra destaque 3, selo "2 atrasadas", pílula Atrasadas ativa com 2 itens | — |
| Visita em passos | visita sem próxima ação no passo 2 | "Continuar" não avança; a mensagem atual aparece no campo | — |
| Sem internet | rede desligada no passo 3 | "Salvar visita" guarda na fila; `sonner` de guardado; `AvisoTopo` pendentes | ao religar, envia como hoje |
| Confirmação | descartar rascunho | `Folha` de confirmação; cancelar não descarta | — |
| Operador | Operador abre o app | cai em Produtores; sem Hoje e sem Rascunhos | rota de Rascunhos continua protegida como hoje |
| Limite | 120 produtores e nome longo | lista rola; nomes com reticências; sem rolagem lateral | — |
| Falha | serviço da carteira falha | `EstadoErro` com "Tentar de novo" | tentar de novo repete a chamada |

## Provas

As ferramentas são as da SPEC-3-002 (`07-sistemas/comercial/tools/`), sempre depois de espelhar o Skip em `07-sistemas/comercial/codigo/`.

1. **Verificador:** `node tools/verificar_visual.mjs codigo/src`, agora sem `--so`, em todo o `src/` menos `components/ui/`. Ele passa a falhar também com qualquer `useToast` ou `import { Toaster }` vindo de `@/components/ui/toaster`.
2. **Capturas:** `node tools/capturar_vitrine.mjs <url> --telas` percorre `/vitrine/telas/<tela>?estado=<estado>`. São as 13 telas, nos estados que se aplicam a cada uma, em 390×844 e 1280×800, com as mesmas regras de falha da SPEC-3-002 (rolagem lateral, axe e alvos de 44px).
3. **Testes estáticos (`node --test tools/tests/*.test.mjs`):**
   - **`views_sem_dados`:** nenhum arquivo de `src/views/` importa `@/services/` nem o cliente do PocketBase.
   - **`telas_rotas`:** as rotas do `App.tsx` continuam as mesmas da SPEC-3-002, mais `/vitrine/telas/:tela`.
   - **`telas_confirmacao`:** não há `confirm(` nem `alert(` em `src/`.
   - **`hoje_contagens`:** a função que monta os números de Hoje, a partir de `GruposCarteira`, devolve as mesmas contagens dos grupos, testada com fixtures.
4. **Regressão funcional:** no app publicado, com os usuários de teste que a fase já usa (Comercial, Gestão, Administrador e Operador), pela interface e pela API:
   - (a) carteira com grupos e ordem iguais aos da consulta direta;
   - (b) visita em 3 passos gravada e visível na ficha, com recusa de data passada;
   - (c) com a rede desligada, a visita fica "aguardando envio" e sobe ao religar, uma vez só;
   - (d) gravação de pós-visita com microfone simulado (Chromium com `--use-fake-device-for-media-stream`) vira rascunho, que é confirmado e aparece na ficha;
   - (e) descartar rascunho com confirmação;
   - (f) aviso aberto pela lista e marcado como lido;
   - (g) pergunta ao assistente respondida com link;
   - (h) Operador sem Hoje e sem Rascunhos; Comercial sem as telas do Administrador;
   - (i) troca de empresa sem dado da anterior na tela.
5. **Contas de teste:** a regressão usa os usuários `teste.*` das empresas "Teste A" e "Teste B", criadas na SPEC-3-001. Eles continuam ativos só nessas empresas, e nunca se grava teste na Agrospy ou na Rumo Agro.

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC, a SPEC-3-002 e, no Skip 64376, cada página antes de redesenhá-la, inclusive as telas da fase 2 (Avisos, Assistente, Enviar gravação e Pasta do Drive), que não estão no espelho. O Skip é a fonte executável: espelhe antes e nunca sobrescreva com cópia local antiga.
2. **Contexto técnico do Skip:** migrações só rodam na publicação. Hooks em JSVM, sem `Intl` e sem funções no topo. Esta SPEC não mexe em hook. O passo 5 de "Provas" só reaproveita a migração de fixtures existente.
3. **Alterar somente:** `src/views/*`, as páginas, `src/fixtures/vitrine.ts`, a vitrine, o `App.tsx` (rota da vitrine das telas e retirada do `Toaster`) e a remoção do `Layout.tsx`.
4. **Não alterar:**
   - serviços, hooks, coleções, regras de acesso e caminhos de rota;
   - textos de regra (mensagens de validação vindas do servidor);
   - a lógica da fila offline e da gravação.
5. **Executar nesta ordem:** as tasks vinculadas, na ordem da tabela. Dentro de cada task:
   1. extrair a view com o visual antigo;
   2. conferir que nada mudou;
   3. aplicar o visual novo;
   4. pôr a tela na vitrine;
   5. rodar as provas.
6. **Parar e pedir validação quando:** o conector do Skip estiver fora do ar. Nesse caso, registre e aguarde. Nenhuma outra parada.
7. **Estado válido ao parar:** toda tela abre e funciona, umas no visual novo e outras no antigo, dentro da casca da SPEC-3-002.
8. **Ritmo:** construir as tasks em sequência, sem pedir autorização nem teste a cada uma. Não há teste do cliente (P11).

## Checklist de execução

- [ ] Cada tela da lista tem view em `src/views/` e página que só busca dados.
- [ ] Hoje, Produtores, Ficha, Registrar visita, Rascunhos, Revisar, Pendências, Avisos, Assistente, Enviar gravação, Visão do gestor, telas do Administrador, Login, Escolher empresa e Não encontrado estão no layout desta SPEC.
- [ ] Os quatro estados aparecem em cada tela e na vitrine.
- [ ] Não há `confirm(`, `alert(`, `useToast` nem `Toaster` antigo; o `Layout.tsx` saiu.
- [ ] O verificador passa em todo o `src/`; capturas, axe e testes estão guardados.
- [ ] A regressão funcional (a) a (i) passou e foi registrada.

## Critérios de aceite

- [ ] **CA-3-12:** Hoje segue a seção 1 nas duas larguras, e o teste `hoje_contagens` passa:
  - o destaque, os segmentos e os contadores das pílulas iguais às contagens dos grupos;
  - a ordem RN-27;
  - concluir e reagendar pela `Folha`;
  - o Operador cai em Produtores.
- [ ] **CA-3-13:** Produtores e Ficha do produtor seguem as seções 2 e 3:
  - busca e filtros por classificação;
  - cabeçalho da ficha com as ações;
  - "Para a próxima visita";
  - abas com os conteúdos atuais;
  - formulários de criar e editar produtor e propriedade em `Folha`, com os mesmos campos obrigatórios.
- [ ] **CA-3-14:** Registrar visita (3 passos e rodapé fixo), Rascunhos, Revisar rascunho, Pendências e Enviar gravação seguem as seções 4, 5, 6 e 9. As validações atuais aparecem no passo do campo, e a visita guardada sem internet mostra o aviso e sobe ao religar.
- [ ] **CA-3-15:** Avisos, Assistente (chat), Visão do gestor, telas do Administrador, Login, Escolher empresa e Não encontrado seguem as seções 7, 8 e 10 a 13. Os números da Visão do gestor batem com a tabela atual.
- [ ] **CA-3-16:** sem nenhuma falha:
  - `node tools/verificar_visual.mjs codigo/src` passa em todo o `src/`;
  - `node tools/capturar_vitrine.mjs --telas` gera as capturas das 13 telas em todos os estados aplicáveis, em 390×844 e 1280×800, sem rolagem lateral, sem violação `serious` ou `critical` do axe-core e com alvos de toque ≥ 44px em 390px;
  - `node --test tools/tests/*.test.mjs` passa.
- [ ] **CA-3-17:** a regressão funcional (a) a (i) passa no app publicado, o build do Skip passa e o log do Skip fica sem erro novo da publicação até a próxima publicação, com no mínimo 1 hora de observação.

## TDD da SPEC

| Etapa | Prova | Comando ou ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | verificador em todo o `src/` antes das telas | `node tools/verificar_visual.mjs codigo/src` | falha: `confirm(` em Pendências, Rascunhos e Revisar, `useToast` nas páginas e classes de cor fixa | `05_entregas/fase-3/spec-3-003/verificador-antes.txt` |
| RED 2 | testes das telas antes das views | `node --test tools/tests/views_sem_dados.test.mjs tools/tests/telas_confirmacao.test.mjs` | falha: `src/views/` não existe e há `confirm(` | `spec-3-003/testes-antes.txt` |
| GREEN 1 | Hoje (CA-3-12) | view + página + vitrine; `hoje_contagens`; capturas de `hoje` | passa | `spec-3-003/telas/hoje-*.png` |
| GREEN 2 | Produtores e Ficha (CA-3-13) | idem para `produtores` e `ficha` | passa | `spec-3-003/telas/produtores-*.png`, `ficha-*.png` |
| GREEN 3 | visita, rascunhos, pendências e envio (CA-3-14) | idem para `visita`, `rascunhos`, `revisar`, `pendencias` e `enviar-gravacao`; regressão (b), (c), (d) e (e) | passa | `spec-3-003/telas/*.png`, `regressao-parcial.txt` |
| GREEN 4 | avisos, assistente, gestor, Administrador e entrada (CA-3-15) | idem para as telas restantes; regressão (f) e (g) | passa | `spec-3-003/telas/*.png` |
| REFACTOR/REGRESSÃO | tudo junto (CA-3-16, CA-3-17) | verificador sem `--so`; capturas `--telas`; `node --test`; regressão (a) a (i); retirada do `Toaster` e do `Layout.tsx`; build; log do Skip | tudo passa | `spec-3-003/verificador-depois.txt`, `axe.json`, `regressao.txt` |

**Dados e fixtures:**
- **`src/fixtures/vitrine.ts`:** dados fictícios por tela e estado, sem dado real de produtor:
  - carteira com 2 atrasadas, 3 hoje, 4 nos próximos 7 dias e 2 depois;
  - 12 produtores (um com nome de 60 caracteres);
  - ficha completa e ficha vazia;
  - 4 rascunhos (um de cada origem e estado);
  - 6 avisos (3 não lidos);
  - conversa de 6 mensagens no assistente;
  - equipe com 4 responsáveis;
  - os 3 indicadores com semana atual e anterior.
- **Regressão:** os usuários `teste.*` e o "TESTE — Produtor A", só nas empresas "Teste A" e "Teste B" (SPEC-3-001).

**Caminhos de erro obrigatórios:** serviço que falha, lista vazia, sem internet com e sem dado guardado, validação recusada no passo, Operador, nome longo, descartar e cancelar.

**Evidência exigida:** os arquivos acima em `05_entregas/fase-3/spec-3-003/`, mais o log do Skip depois da publicação.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-3/spec-3-003/` e o log do Skip.

## Handoff e operação

- **Como demonstrar:** abrir `/vitrine/telas/hoje` no celular e percorrer as telas; no app, entrar e usar Hoje, Produtores e Registrar visita.
- **Como operar depois:** toda tela nova tem view + página + entrada na vitrine. Rodar o verificador e as capturas antes de publicar.
- **Como monitorar:** o log do Skip depois de cada publicação; a vitrine continua passando nas capturas.
- **Pendência conhecida:** nenhuma.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições | Status |
|---|---|---|---|---|---|---|---|---|
| id pendente | Redesenhar todas as telas do app no novo visual | Agrospy | SPEC-3-003 | CA-3-12 a CA-3-17 | todas as subtasks | evidências das subtasks | SPEC-3-002 aceita | ☐ |
| id pendente | Redesenhar a tela inicial com a agenda do dia | Agrospy | SPEC-3-003 | CA-3-12, CA-3-16 | RED 1–2 → GREEN 1 | `telas/hoje-*.png`, testes | SPEC-3-002 aceita | ☐ |
| id pendente | Redesenhar a lista de produtores e a ficha do produtor | Agrospy | SPEC-3-003 | CA-3-13, CA-3-16 | GREEN 2 | `telas/produtores-*.png`, `telas/ficha-*.png` | tela inicial redesenhada | ☐ |
| id pendente | Redesenhar o registro de visita em passos, os rascunhos e o envio de gravação | Agrospy | SPEC-3-003 | CA-3-14, CA-3-16 | GREEN 3 | capturas + `regressao-parcial.txt` | produtores redesenhados | ☐ |
| id pendente | Redesenhar Avisos, Assistente, Visão do gestor, a entrada e as telas do Administrador | Agrospy | SPEC-3-003 | CA-3-15, CA-3-16 | GREEN 4 | capturas | registro de visita redesenhado | ☐ |
| id pendente | Conferir que todo o app continua funcionando no novo visual | Agrospy | SPEC-3-003 | CA-3-16, CA-3-17 | REFACTOR/REGRESSÃO | `verificador-depois.txt`, `axe.json`, `regressao.txt` + log do Skip | todas as telas redesenhadas | ☐ |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
