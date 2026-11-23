# SPEC-5-002 — Desligamento de usuário com transferência da carteira e relatório de uso

**Fase:** 5
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** Fase 5, "desligamento de usuário com transferência de carteira; ajustes finais de usabilidade a partir do uso registrado"
**Degrau da solução:** reuso + construção mínima — a troca de responsável da fase 1 (com evento), os vínculos e os acessos calculados; uma rota de desligamento numa transação e um relatório de uso calculado no servidor a partir dos registros que já existem.

## Contexto e decisões fechadas

- **Estado atual:** desativar um vínculo tira o acesso, mas a carteira, as oportunidades e as ações do vendedor ficam sem dono ativo, e chaves de IA, inscrições de notificação e sessões continuam existindo.
- **Estado desejado:** o Administrador desliga um usuário numa tela: vê tudo o que está com ele, escolhe para quem vai cada parte e confirma. Numa operação só, a carteira é transferida com histórico, os vínculos são desativados, as chaves e notificações são cortadas e a sessão cai. O relatório de uso mostra, por semana, quem usa o quê e onde há erro, para a consultoria decidir os ajustes de usabilidade.
- **Decisões já fechadas:**
  - **O que é transferido:** produtores em que ele é responsável; oportunidades abertas; ações pendentes dessas oportunidades; rascunhos não confirmados ficam com ele e são descartados com motivo "usuário desligado" (não se transfere rascunho de outra pessoa).
  - **O que não é transferido:** visitas, despesas de RDV e histórico (continuam com o autor); despesas `lancada` do desligado entram no próximo fechamento normalmente.
  - **Destino:** um usuário ativo da mesma empresa com perfil Administrador, Gestão ou Comercial; dá para escolher um destino para tudo ou um destino por produtor.
  - **Corte de acesso:** vínculos do tenant `ativo = false`; chaves de API revogadas; inscrições de notificação inativas; sessão invalidada (troca do `tokenKey` do usuário). Se o usuário tiver vínculo ativo em outro tenant, só o vínculo do tenant atual é desligado e a sessão não cai.
  - **Ajustes de usabilidade:** esta SPEC entrega o relatório; cada ajuste que sair dele vira emenda da consultoria com prova própria. O Maestro não decide ajuste sozinho.
  - **Erros de tela:** o app passa a registrar erros não tratados (`ErrorBoundary` e `window.onerror`) em `erros_app`, sem dados do formulário.
- **Bloqueios:** nenhum.

## Resultado observável

1. O Carlos sai da empresa. O Diogo abre "Usuários → Carlos → Desligar". A tela mostra: 23 produtores, 9 oportunidades abertas, 11 ações pendentes, 2 rascunhos, 1 chave de IA.
2. Ele escolhe "Transferir tudo para Alisson" e confirma. Em segundos: a carteira aparece em "Minha carteira" do Alisson, cada produtor mostra no histórico "responsável: Carlos → Alisson, por Diogo"; o Carlos não entra mais.
3. Na segunda, o Diogo abre "Relatório de uso": visitas registradas por pessoa, quantas pelo app e quantas pelo assistente, tempo médio do registro de visita, telas com mais erro e despesas lançadas.

## Limites e dependências

- **Inclui:** rotas de prévia e de desligamento; tela de desligamento na ficha do usuário; coleção `erros_app` e captura no app; rota e tela "Relatório de uso"; auditoria das ações (`usuario_desligado`, `carteira_transferida`, SPEC-5-001).
- **Fora de escopo:** apagar usuário ou dados dele; transferir visitas, despesas ou histórico; reativar usuário com a carteira de volta (reativar é só religar o vínculo); os próprios ajustes de usabilidade.
- **Entradas e pré-condições:** SPEC-5-001 no ar.
- **Saídas/artefatos:** migrações, hooks, telas; evidências em `05_entregas/fase-5/spec-5-002/`.
- **Dependências e responsáveis:** a Agrospy executa. Nada depende do Diogo.
- **Atores e permissões mínimas:** desligar e ver o relatório de uso: Administrador; ninguém se desliga sozinho; o último Administrador ativo de um tenant não pode ser desligado.
- **Superfícies/arquivos/configurações afetadas:** `pocketbase/hooks/usuarios_desligar.js`, `lib/transferencia.js`, `uso_rotas.js`; migração `erros_app`; `src/pages/Usuarios.tsx` (botão e folha de desligamento), `src/pages/config/RelatorioUso.tsx`; `src/components/app/AppShell.tsx` só para registrar o `ErrorBoundary`; `src/services/erros.ts`; `navegacao.ts`.
- **Risco e plano B:** carteira grande (mais de 2.000 registros) → a transferência roda em lotes de 500 dentro de `runInTransaction` por lote, com a operação registrada como `em_andamento` até o fim e retomável pelo mesmo id.
- **Rollback ou reversão:** transferir de volta pela mesma tela (para um usuário reativado); vínculos podem ser reativados pela tela de usuários.

## Dados e integrações

| Coleção | Campos (tipo) | Regras de API |
|---|---|---|
| `desligamentos` | `empresa`, `usuario`, `por`, `destinos` (JSON `{padrao: id, por_produtor?: {produtor: usuario}}`), `contagens` (JSON), `status` (`em_andamento` \| `concluido`), `created`/`updated` | list/view: `acesso_admin` · create/update/delete: null |
| `erros_app` | `empresa` (opcional), `usuario` (opcional), `rota` (≤ 120), `mensagem` (≤ 300, sem dados de formulário), `versao_app` (≤ 20), `created` | create: usuário autenticado (rota própria com limite de 20/min por usuário) · list/view: `acesso_admin` · update/delete: null |

| Rota | Quem | Entrada | Efeito | Erros |
|---|---|---|---|---|
| `GET /backend/v1/usuarios/{id}/desligamento/previa?empresa` | Administrador | — | contagens por tipo e lista de produtores | 403 |
| `POST /backend/v1/usuarios/{id}/desligar` | Administrador | `{empresa, destinos}` | RN-210 a RN-213 | 400 destino inválido; 409 último Administrador; 403 |
| `GET /backend/v1/uso/relatorio?empresa&de&ate` | Administrador | — | indicadores da tabela "Relatório de uso" | 403 |

**Relatório de uso** (por semana, na empresa): usuários ativos (com qualquer registro na semana); visitas por pessoa e por origem (app, assistente, gravação); tempo médio entre abrir e salvar o registro de visita (o app grava `iniciado_em` no rascunho local e envia junto; registros antigos ficam fora da média); oportunidades sem próxima ação em dia por pessoa; despesas lançadas por origem (app, assistente, Maestro); erros por rota (top 10, de `erros_app`); taxa de leitura automática de nota com falha.

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-210 | transferir | numa transação por lote: `responsavel` dos produtores e oportunidades abertas e das ações pendentes vai ao destino, com evento de troca de responsável (de, para, por, motivo "desligamento") | — | fase 1 (regra 11 do escopo base) |
| RN-211 | destino | usuário ativo no mesmo tenant, perfil Administrador, Gestão ou Comercial, diferente do desligado | — | P6 |
| RN-212 | corte | vínculos do tenant desativados; chaves de API revogadas; inscrições de notificação inativas; rascunhos não confirmados descartados; sessão invalidada se não houver vínculo ativo em outro tenant | — | fase 5 |
| RN-213 | proteções | o último Administrador ativo do tenant não é desligado (409); o Administrador não desliga a si mesmo (400) | — | fase 5 |
| RN-214 | erros do app | só rota, mensagem curta e versão; nunca valores de campos | — | privacidade |

## Fluxo e regras

1. **Usuários → usuário → Desligar** (folha): prévia com as contagens, destino padrão, opção "Escolher por produtor", texto de confirmação "Desligar {nome} e transferir {N} itens".
2. **Resultado:** resumo com o que foi transferido e cortado; link para a auditoria.
3. **Relatório de uso** (`/config/uso`): seletor de semanas, cartões e tabelas.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | comercial com carteira | carteira transferida; acesso cortado | — |
| Limite | usuário com vínculo em duas empresas | só o vínculo do tenant atual cai; sessão continua | — |
| Limite | operação interrompida no meio | `em_andamento`; retomar conclui sem duplicar eventos | retomar |
| Falha | desligar o último Administrador | 409 | — |
| Falha | destino Operador | 400 | escolher outro |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; a troca de responsável da fase 1 (`produtores_hooks.js`, `admin_reatribuir_oportunidades.js`, `eventos`); `vinculos` e `recalcula_acessos_*`; `chaves_api` (SPEC-4-009); `inscricoes_push`; `00-INDICE.md` (regras comuns).
2. **Contexto técnico do Skip:** o da SPEC-4-001; invalidar sessão com `record.refreshTokenKey()` e `$app.save`.
3. **Alterar somente:** as superfícies listadas.
4. **Não alterar:** visitas, despesas e histórico.
5. **Executar nesta ordem:** (1) prévia; (2) desligar com transferência e corte; (3) retomada; (4) `erros_app` e captura; (5) relatório de uso; (6) provas.
6. **Parar e pedir validação quando:** nenhuma parada prevista. Desligar pessoa real é ação do Administrador na tela, não do Maestro.
7. **Estado válido ao parar:** usuários e carteiras como antes.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

Sistema da SPEC-3-002. Folha de desligamento com `CartaoNumero` por tipo, seletor de destino, lista por produtor recolhida; botão de confirmação em cor de alerta; relatório com `CartaoNumero` e gráfico de pontos por semana; estados carregando, vazio, erro e sem internet.

## Checklist de execução

- [ ] Prévia com contagens certas.
- [ ] Desligamento com transferência, corte e retomada.
- [ ] Proteções do último Administrador e de si mesmo.
- [ ] `erros_app` e relatório de uso.
- [ ] Evidências em `05_entregas/fase-5/spec-5-002/`.

## Critérios de aceite

- [ ] **CA-5-04:** desligar `teste.comercial2` com a fixture transfere exatamente os produtores, oportunidades abertas e ações pendentes da prévia para o destino, com um evento de troca por registro; visitas e despesas dele continuam com ele; a sessão dele cai (próxima requisição 401), a chave de API dá 401 e a inscrição de notificação fica inativa.
- [ ] **CA-5-05:** destino inválido dá 400; o último Administrador dá 409; desligar a si mesmo dá 400; usuário com vínculo em outro tenant perde só o vínculo do tenant atual; uma operação interrompida e retomada termina sem eventos duplicados; Gestão recebe 403.
- [ ] **CA-5-06:** o relatório de uso de uma semana da fixture devolve os números iguais à consulta direta; um erro provocado no app aparece em `erros_app` sem valores de formulário.

## TDD da SPEC

**Empresas nas provas:** Teste A e Teste B. **Fixture:** `teste.comercial2` com 12 produtores, 5 oportunidades abertas, 7 ações pendentes, 2 visitas, 3 despesas, 1 rascunho, 1 chave de leitura e 1 inscrição de notificação de teste; `teste.multi` com vínculo nas duas empresas.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | carteira órfã (CA-5-04) | desativar o vínculo pelo caminho antigo e contar produtores com responsável inativo | > 0 (falha esperada) | consulta |
| GREEN 1 | desligar (CA-5-04) | prévia; desligar com destino `teste.comercial1`; chamar a API com a sessão antiga e a chave | contagens iguais; transferidos; 401; 401 | consultas + respostas |
| GREEN 2 | proteções (CA-5-05) | destino `teste.operador`; desligar o único Administrador da Teste B; `teste.admin.a` desliga a si mesmo; desligar `teste.multi` na Teste A; interromper (rota de teste que para depois do 1º lote) e retomar; como `teste.gestao` | 400; 409; 400; só Teste A; sem duplicar; 403 | respostas + consultas |
| GREEN 3 | uso (CA-5-06) | relatório × SQL; provocar erro na `/vitrine?erro=1` (gatilho só de teste) | iguais; 1 linha sem valores | diff + consulta |
| REFACTOR/REGRESSÃO | regressão | carteira, painel e fila do destino; auditoria com `usuario_desligado` e `carteira_transferida`; capturas e axe-core | sem diferença; linhas presentes; sem falha séria | relatório |

**Caminhos de erro obrigatórios:** destino inválido, último Administrador, si mesmo, outro tenant, interrupção, perfil sem permissão.
**Evidência exigida:** em `05_entregas/fase-5/spec-5-002/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-5/spec-5-002/` e o log do Skip.

## Handoff e operação

- **Como demonstrar:** desligar um usuário de teste e mostrar a carteira no destino; abrir o relatório de uso.
- **Como operar depois:** o Administrador desliga quem sai no mesmo dia; a consultoria lê o relatório de uso para propor ajustes.
- **Como monitorar:** desligamentos `em_andamento`; erros por rota.
- **Pendência conhecida:** ajustes de usabilidade entram como emenda a partir do relatório.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Desligar usuário sem perder a carteira | Agrospy | SPEC-5-002 | CA-5-04 a CA-5-06 | todas as subtasks | evidências das subtasks | SPEC-5-001 no ar |
| id pendente | Desligar usuário com transferência da carteira | Agrospy | SPEC-5-002 | CA-5-04, CA-5-05 | RED 1 → GREEN 1 + GREEN 2 | consultas + respostas | SPEC-5-001 |
| id pendente | Mostrar o relatório de uso do app | Agrospy | SPEC-5-002 | CA-5-06 | GREEN 3 + REFACTOR | diff + capturas | desligamento |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
