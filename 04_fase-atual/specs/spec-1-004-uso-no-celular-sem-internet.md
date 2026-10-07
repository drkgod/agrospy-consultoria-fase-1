# SPEC-1-004 — Uso no celular sem internet e sincronização

**Fase:** 1
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · validação: Rodrigo Santos (consultor)
**Origem no escopo:** RQ-001; P5; Fase 1, capacidade 6; escopo base §15.1
**Degrau da solução:** construção mínima — app instalável (manifesto + service worker) e fila local no próprio navegador (IndexedDB nativo) dentro do frontend do projeto no Skip, sem biblioteca nova; o backend continua nativo do Skip. Justificativa: a plataforma decidida não traz uso offline pronto e o offline é requisito do campo.

## Contexto e decisões fechadas

- **Estado atual:** “Importantíssimo ter offline, porque a gente não tem Starlink para todo mundo… o comercial pode sair sem” (1ª consultoria 22/09 `[00:20:25]`). Os celulares são da empresa e instalar app não tem fricção (`[00:21:13]–[00:21:22]`).
- **Estado desejado:** o vendedor abre o app no meio da lavoura, consulta a carteira baixada e registra produtor novo, propriedade, visita, oportunidade e ação; ao voltar a internet, tudo é enviado uma única vez, sem perder nada.
- **Decisões já fechadas:**
  - Sem internet, só **criação** é permitida (produtor, propriedade, visita, oportunidade e ação de oportunidade). Editar cadastro existente exige internet. Isso evita conflito de edição.
  - Cada registro criado no aparelho recebe um `id_local` (UUID v4). O servidor recusa um segundo registro com o mesmo `id_local`, então reenviar nunca duplica.
  - Um item só sai da fila do aparelho depois que o servidor confirma.
  - A fila pertence ao usuário e à empresa que a criaram; outro usuário no mesmo aparelho não a envia.
  - As regras de acesso e de validação do servidor (SPECs 1-001 a 1-003) continuam valendo no envio.
- **Bloqueios:** nenhum conhecido. Se a plataforma não permitir registrar o service worker ou usar o armazenamento local, a execução para (ver instruções).

## Resultado observável

Com o celular em modo avião, o vendedor registra uma visita com nova oportunidade num produtor que acabou de cadastrar; o topo mostra “Sem conexão — 3 registros aguardando envio”. Ao sair do modo avião, o aviso vira “Enviado”, e no computador do escritório a visita e a oportunidade já aparecem — uma vez só.

## Limites e dependências

- **Inclui:** manifesto e ícone para instalar na tela inicial (Android e iPhone); service worker que guarda a casca do app; cópia local da carteira do usuário e dos cadastros da empresa ativa para consulta; fila local de criações com dependências (produtor → propriedade → visita → oportunidade → ação); envio automático ao voltar a conexão, ao abrir o app e pelo botão “Sincronizar agora”; tela “Pendências de envio”; tratamento de falhas.
- **Fora de escopo:** editar registro existente sem internet; anexar foto ou áudio sem internet (fase 2/4); avisos push (fase 2); visão do gestor sem internet.
- **Entradas e pré-condições:** SPECs 1-001, 1-002 e 1-003 em GREEN; campos `id_local` únicos nas coleções; celulares da empresa disponíveis para o teste.
- **Saídas/artefatos:** manifesto, service worker e módulo de fila no frontend; tela de pendências; roteiro de teste com resultado.
- **Dependências e responsáveis:** Agrospy executa; Rodrigo Santos valida; o sistema dos celulares (CL-PEND-005) é conferido no teste.
- **Atores e permissões mínimas:** os mesmos da matriz da SPEC-1-001; o envio usa o token do usuário dono da fila.
- **Superfícies/arquivos/configurações afetadas:** frontend do projeto no Skip (manifesto, service worker, `src/services/fila-offline.ts`, telas de visita, oportunidade e produtor, indicador de conexão).
- **Risco e plano B:** plataforma não permitir o service worker → parar e decidir com o consultor; armazenamento do aparelho limpo pelo usuário → os itens não enviados se perdem, por isso o app avisa e não deixa sair da conta com pendências sem confirmação explícita.
- **Rollback ou reversão:** desligar o registro do service worker volta o app ao modo só online, sem afetar os dados do servidor.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| Fila local (IndexedDB) → backend do Skip | servidor depois da confirmação; aparelho até lá | item: `id_local`, `colecao`, `dados`, `depende_de` (ids locais), `usuario`, `empresa`, `criado_em_aparelho`, `estado` (`pendente` \| `enviando` \| `enviado` \| `precisa_revisao`), `motivo`, `tentativas` | token do usuário dono da fila; servidor aplica as regras das SPECs 1-001 a 1-003 | timeout de 20 s por envio; até 5 tentativas com espera crescente (5 s, 15 s, 45 s, 2 min, 5 min); depois fica `pendente` até o próximo gatilho; `id_local` único no servidor torna o reenvio idempotente (se já existe e o registro é visível ao usuário, o app trata como enviado e passa a usar o id do servidor; se não for visível, marca `precisa_revisao`) | ver tabela de falhas |
| Cópia local para consulta | servidor | produtores e propriedades da empresa ativa (nome, município, responsável), oportunidades abertas e linhas de negócio do usuário; data/hora da última sincronização | só o que o usuário pode ver | atualizada a cada sincronização | ao trocar de empresa ou sair da conta, a cópia de consulta é apagada |

| Falha | Como o app reconhece | O que o app faz |
|---|---|---|
| Sem conexão / timeout / erro 5xx | sem resposta ou erro do servidor | mantém `pendente`, tenta de novo pela política acima |
| Sessão expirada (401) | resposta 401 | mantém a fila, pede login do mesmo usuário e reenvia depois |
| Sem permissão (403) ou empresa removida | resposta 403/404 | marca `precisa_revisao` com o motivo; não reenvia sozinho |
| Validação recusada (400) — ex.: documento já cadastrado | resposta 400 | marca `precisa_revisao`; para documento repetido, oferece “usar o cadastro existente”, que troca a referência dos itens dependentes para o produtor do servidor e reenvia |
| Oportunidade mudou de responsável antes do envio da ação | resposta 403 | `precisa_revisao` com o motivo; o vendedor avisa o gestor |
| Data da próxima ação ficou no passado até o envio | — | o servidor valida a data contra o dia de `criado_em_aparelho` (a data precisava ser hoje ou futura quando o registro foi feito); aceita e o item aparece como atrasado (RN-19 da SPEC-1-003) |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-21 | sem conexão | só criação disponível; botões de edição mostram “precisa de internet” | — | decisão desta SPEC |
| RN-22 | item na fila | só sai após confirmação do servidor | o usuário pode descartar um item em `precisa_revisao`, com confirmação | — |
| RN-23 | itens dependentes | enviados na ordem produtor → propriedade → visita → oportunidade → ação, trocando ids locais pelos do servidor | se o pai ficar em revisão, os filhos esperam | — |
| RN-24 | sair da conta com pendências | aviso “há N registros não enviados”; sair só com confirmação; a fila continua guardada para o mesmo usuário | — | — |
| RN-25 | outro usuário no aparelho | não vê nem envia a fila alheia | — | P2 |

## Fluxo e regras

1. Primeiro acesso com internet → o app oferece “Instalar na tela inicial” (Android: botão do navegador; iPhone: Compartilhar → Adicionar à Tela de Início) e baixa a cópia de consulta.
2. Sem internet → o topo mostra “Sem conexão”; as telas de criação gravam na fila e mostram o item como “aguardando envio”.
3. Volta da conexão (evento do navegador), abertura do app ou “Sincronizar agora” → envia a fila na ordem das dependências.
4. Cada item enviado vira “Enviado”; itens com problema vão para “Pendências de envio” com o motivo e as ações possíveis (corrigir e reenviar, usar cadastro existente, descartar com confirmação).
5. Ao terminar, a cópia de consulta é atualizada e a data/hora da última sincronização aparece na carteira.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | modo avião: produtor novo + visita + oportunidade | três itens na fila; ao reconectar, três registros no servidor, uma vez cada | — |
| Limite | conexão cai no meio do envio | ao voltar, reenvio não duplica | idempotência por `id_local` |
| Falha | documento já cadastrado por outra pessoa | item em revisão com “usar o cadastro existente” | reenvio apontando para o existente |
| Falha | sessão expirou no campo | fila mantida; pede login | reenvio após login |
| Falha | vendedor perdeu o acesso à empresa | itens em revisão com o motivo | gestor resolve |

## Instruções de execução para o Ethos

1. **Ler antes de alterar:** esta SPEC, as SPECs 1-001 a 1-003 e o frontend atual do projeto no Skip.
2. **Alterar somente:** manifesto, service worker, módulo de fila e de cópia local, indicador de conexão, tela de pendências e a chamada de gravação das telas de criação (para passar pela fila quando não houver conexão).
3. **Não alterar:** regras e validações do servidor; não permitir edição sem internet; não usar biblioteca nova sem decisão do consultor.
4. **Executar nesta ordem:** (a) manifesto e instalação; (b) service worker da casca do app; (c) cópia local de consulta; (d) fila com `id_local` e dependências; (e) envio com política de tentativas; (f) tela de pendências e falhas; (g) roteiro RED/GREEN em celular real.
5. **Parar e pedir validação quando:** o Skip não permitir registrar o service worker ou usar o armazenamento local; o iPhone ou o Android da empresa não instalar o app; o prazo da fase estiver em risco (o consultor decide a contingência).
6. **Estado válido ao parar:** o app continua funcionando online; nenhum item da fila é apagado sem confirmação do servidor ou do usuário.

## Checklist de execução

- [ ] SPECs 1-001 a 1-003 em GREEN e `id_local` único nas coleções (pré-condição conferida).
- [ ] App instalado na tela inicial de um celular da empresa.
- [ ] Criação sem internet com indicador de pendências.
- [ ] Envio automático com idempotência.
- [ ] Falhas tratadas sem perda (401, 403, 400, timeout).
- [ ] Roteiro RED → GREEN → regressão em celular real anexado.

## Critérios de aceite

- [ ] **CA-1-15:** o app instalado na tela inicial de um celular da empresa abre sem internet e mostra a carteira da última sincronização com a data e a hora.
- [ ] **CA-1-16:** sem internet, o usuário cria produtor, propriedade, visita e oportunidade; os itens aparecem como “aguardando envio” e, ao reconectar, sincronizam sozinhos e existem no servidor exatamente uma vez.
- [ ] **CA-1-17:** envio interrompido no meio e repetido não duplica nenhum registro.
- [ ] **CA-1-18:** sessão expirada mantém a fila e pede login; documento repetido oferece usar o cadastro existente; acesso removido marca revisão sem reenviar; nenhum desses casos perde o registro.
- [ ] **CA-1-19:** editar cadastro existente fica bloqueado sem internet com mensagem clara, e a fila de um usuário não é enviada por outro usuário no mesmo aparelho.

## TDD da SPEC

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | idempotência no servidor (CA-1-17) | enviar pela API duas vezes a mesma visita de teste com o mesmo `id_local` | antes do índice único, cria duas (falha esperada) | respostas da API |
| RED 2 | perda sem fila (CA-1-16) | no celular em modo avião, tentar registrar visita na versão sem fila | o registro falha e se perde (falha esperada) | gravação de tela |
| GREEN 1 | criação offline e envio (CA-1-15, CA-1-16) | instalar o app; modo avião; criar “TESTE — Produtor C” + propriedade + visita + oportunidade; sair do modo avião | quatro itens pendentes → enviados; consulta no servidor mostra um registro de cada | gravação de tela + consulta no servidor |
| GREEN 2 | envio interrompido (CA-1-17) | iniciar o envio e cortar a conexão no meio; reconectar | nenhuma duplicata (contagem por `id_local`) | consulta no servidor |
| REFACTOR/REGRESSÃO | falhas e isolamento (CA-1-18, CA-1-19) | (a) expirar a sessão com itens pendentes; (b) criar offline um produtor com documento já cadastrado; (c) remover o vínculo do usuário com itens pendentes; (d) tentar editar cadastro offline; (e) sair, entrar com outro usuário e conferir a fila; (f) repetir a regressão de acesso da SPEC-1-001 | (a) fila mantida e enviada após login; (b) revisão com “usar o cadastro existente” funcionando; (c) revisão sem reenvio; (d) bloqueado com mensagem; (e) outro usuário não vê a fila; (f) sem divergência | prints/gravações de cada caso + tabela da matriz |

**Dados/fixtures:** usuários de teste da SPEC-1-001; “TESTE — Produtor C” com documento repetido de “TESTE — Produtor A”; pelo menos um Android e um iPhone da empresa, se houver os dois (CL-PEND-005).
**Caminhos de erro obrigatórios:** sem conexão, conexão cortada no envio, 401, 403, 400 por documento repetido, data vencida no envio, troca de usuário no aparelho.
**Evidência exigida:** gravações de tela no celular real, consultas no servidor mostrando um registro por `id_local` e prints da tela de pendências.

## Teste humano do cliente

- **Origem:** CL-004 — o teste completo da fase está na SPEC-1-005.
- **Quem testa:** um vendedor em campo, com o Diogo.
- **Passos:** sem sinal na propriedade, registrar a visita real e a oportunidade; ao voltar para a área com sinal, conferir que foi enviado; o Diogo confere no computador.
- **Resultado esperado:** nada se perde e nada aparece duplicado.
- **Evidência do aceite:** mensagem do Diogo no card da tarefa com o print da visita no computador.

## Handoff e operação

- **Como demonstrar:** modo avião → registrar → sair do modo avião → mostrar no computador.
- **Como operar depois:** sincronizar ao chegar em área com sinal; olhar “Pendências de envio” se aparecer aviso.
- **Como monitorar:** número de itens em revisão por usuário; nenhum item deve ficar pendente por mais de um dia com internet disponível.
- **Pendência conhecida:** fotos e áudios sem internet ficam para fases seguintes.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| 4da366fe-2f89-4585-88dc-c46b28672483 | Instalar o app no celular e registrar visita sem internet | Agrospy | SPEC-1-004 | CA-1-15, CA-1-16 | RED 1–2 → GREEN 1 | gravação de tela + consulta no servidor | SPECs 1-001 a 1-003 em GREEN |
| 394e3cf8-1f15-48ca-ae90-b2b4c5c6cf57 | Deixar o app instalável na tela inicial do celular | Agrospy | SPEC-1-004 | CA-1-15 | manifesto + service worker | print do ícone na tela inicial e do app abrindo sem internet | celular da empresa |
| 97a859bc-947a-4f36-b0c0-43b7ba743b3c | Guardar visita, oportunidade e produtor novo sem internet | Agrospy | SPEC-1-004 | CA-1-16, CA-1-19 | fila local + bloqueio de edição | gravação em modo avião | app instalável |
| 8971a540-0b68-46a4-ab73-59d77ffed401 | Enviar automaticamente o que ficou pendente ao voltar a internet | Agrospy | SPEC-1-004 | CA-1-16, CA-1-17 | RED 1 → GREEN 1 e 2 | consulta no servidor por `id_local` | fila local |
| f5877532-2383-4554-a079-f61bc68dd8cc | Testar falhas de envio sem perder nenhum registro | Agrospy | SPEC-1-004 | CA-1-17, CA-1-18, CA-1-19 | GREEN 2 + REFACTOR/REGRESSÃO (a)–(f) | prints/gravações de cada caso | envio automático funcionando |
| 8d83c95c-d8b4-429c-81ed-be79b7bf7c46 | Testar envio interrompido sem duplicar registros | Agrospy | SPEC-1-004 | CA-1-17 | GREEN 2 | contagem por `id_local` | envio automático funcionando |
| f694b486-cffc-4841-b5ff-98a64d0ff182 | Testar sessão expirada, cadastro duplicado e acesso removido | Agrospy | SPEC-1-004 | CA-1-18 | REFACTOR/REGRESSÃO (a)–(c) | prints da tela de pendências | envio automático funcionando |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
