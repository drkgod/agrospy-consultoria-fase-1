## [22/10/2026] — validação do consultor fora da fase 1 (decisão do consultor)
- Tasks 7acbab78 (call de validação) e 99563d4a (revisão das evidências pelo consultor) removidas de fase.md e da SPEC-1-005. A fase fecha com o teste final do Diogo na 8187b1f6, que agora cobre CA-1-23 e CA-1-24 e inclui a conferência dos perfis.
- Estado e STATUS: os testes de acesso (ed490cca) e as subtarefas de falhas de envio (f5877532) fecham pelas provas automáticas já feitas (0.0.84 e 0.0.87), sem teste na tela.

## [0.0.72] - 2026-10-15 — task 684e8557: visão do gestor (SPEC-1-005, CA-1-22)
- Tela "Visão do gestor" na rota /visao-gestor (só Gestão/Administrador; não-gestão é redirecionado para /): tabela por responsável (Atrasadas/Hoje/Próx. 7 dias/Total abertas/Visitas 7d) com linha de totais, filtro por responsável e seção "Produtores sem oportunidade aberta" (clique abre a ficha). No celular a tabela vira cards por responsável (sem rolagem horizontal).
- Serviço: carteiraService.visaoGestor(empresaId) — 3 consultas paginadas (oportunidades abertas, visitas 7d, produtores) agregadas por responsável com o mesmo agrupamento RN-26 da Minha carteira; listarProdutoresDaEmpresaSemOportunidadeAberta para a equipe toda.
- Menu: item "Visão do gestor" no header só para gestao/administrador.
- Provas: RED 2 (comercial1 sem filtro de responsável: 9/9 só as próprias — o servidor limita); GREEN reconciliação tela × base 100% (u2jks1t7: 0/0/5/9 visit 9; bzieexh15: 0/0/0/0 visit 1; total 0/0/5/9 visit 10 — igual à consulta direta); gestão vê a empresa inteira (2 responsáveis).
- Versão no ar: v0.0.72 (5cb9670), publicada 15/10 15:31 UTC.

## [0.0.71] - 2026-10-15 — botão "Sair" no header (pedido do Diogo)
- Header de todas as telas ganhou o botão "Sair" ao lado de "Trocar empresa": encerra a sessão (authStore limpo + empresa ativa removida) e volta ao login, permitindo trocar de usuário. Provado no navegador: clique → /login com formulário limpo.
- Versão no ar: v0.0.71 (cf078e3), publicada 15/10 13:44 UTC.

## [0.0.70] - 2026-10-15 — task baad9730: Minha carteira (SPEC-1-005, CA-1-20/21)
- Tela "Minha carteira" na rota `/` (tela inicial de Comercial/Gestão/Administrador; Operador cai em Produtores): contadores Atrasadas/Hoje/Próximos 7 dias/Depois no fuso de Brasília (RN-26), ordem RN-27, item com produtor/linha/próxima ação/data/dias de atraso, ações rápidas concluir/reagendar no próprio item e seção "Produtores sem oportunidade aberta" (RN-28).
- Serviço novo `src/services/carteira.ts` (hojeBrasilia, listarMinhasAbertas, agrupar, diasDeAtraso, listarProdutoresSemOportunidadeAberta).
- Componente `AcaoOportunidadeForm` extraído da ficha (concluir/reagendar) — ficha e carteira usam o mesmo formulário.
- Hook `proxima_acao_vigente.js`: recusa data passada no concluir/reagendar (CA-1-21) e RN-19 alinhada ao fuso de Brasília (antes UTC).
- Layout: botão "Carteira" no header para não-Operador.
- Provas: RED 1 (4 oportunidades ontem/hoje/+3/+10) → GREEN com grupos corretos; reagendar para ontem 400 com mensagem; concluir sem resultado 400; concluir moveu o item de Hoje para Próximos 7 dias (API + tela); reconciliação tela × base 1/1/3/4 = 100%; comercial só vê as próprias (9/9 do responsável); ficha re-testada sem regressão.
- Correções no caminho: JSVM do PocketBase não tem `Intl` (ReferenceError em runtime — hook refeito com UTC−3) e não expõe declarações top-level nos callbacks; import de oportunidadesService na ficha (crash do ErrorBoundary).
- Versão no ar: v0.0.70 (06079a3), publicada 15/10 02:11 UTC.

## [0.0.66] - 2026-10-14 — SPEC-1-003 completa: linhas de negócio + concluir/reagendar
- **FECHAMENTO (15/10, teste humano aprovado pelo Diogo — "aprovado, continue"):** tasks ae167e8a + 448d4044 + 9705e5f8 + 6850e423 + 623899c6 concluídas; fase.md, STATUS e changelog atualizados; espelho consolidado e GitHub sincronizado. Próxima: Minha carteira (baad9730).
- Tela "Linhas de negócio" do Administrador (CA-1-14): criar, renomear, desativar/reativar; linha fixa protegida pelo hook; menu só para admin. Admin de teste criado (teste.admin@agrospy.com.br, migração 0028 + recálculo acesso_*).
- Ficha: botão "Concluir / Reagendar" em cada oportunidade (resultado + próxima ação/data; reagendar só data) — provado por API: concluir avança para 21/10, reagendar para 28/10, histórico guarda as 2 ações.
- Visita: terceiro destino "Atualizar oportunidade aberta" (escolhe a aberta, resultado + próxima ação/data).
- Fix de acesso: vínculos criados por migração não passam pelo hook de recálculo — 0026/0027 recalculam acesso_* de todos (getString não reflete set em relação múltipla: salvar sempre). Gestão voltou a ver visitas/oportunidades.
- Provas API: admin cria 200, comercial cria 400, oportunidade com linha desativada 400, apagar linha 403.
- Versão no ar: v0.0.66 (33ba99e).

## [0.0.62] - 2026-10-14 — task ae167e8a (SPEC-1-003): visita e oportunidade + áudio — TESTE APROVADO
- Diogo: "funcionou a gravação" + "a transcrição funcionou"; transcrição de arquivo gravado dispensada por ele (sem API externa por ora).
- Visita: botão "Registrar visita" na ficha do produtor (faltava no bundle — 3 patches só no espelho), formulário curto (data, assuntos, "Mais detalhes"), próximo passo em 1 toque, histórico Visitas/Oportunidades na ficha.
- Backend: coleções linhas_negocio (carga 8 Agrospy/5 Rumo + fixa Relacionamento), visitas, oportunidades e acoes_oportunidade (histórico imutável) — migrações 0019-0025; hooks: destino obrigatório, próxima ação vigente, data passada recusada, linha fixa, responsável padrão do produtor.
- Emenda áudio (pedido 14/10): gravar no app (MediaRecorder) + anexar do celular (m4a/mp3/wav/ogg/aac/amr/3gp/webm, 25 MB), player na ficha, upload multipart (FormData com empresa) provado por API com download íntegro.
- Emenda transcrição por voz (pedido 14/10): botão "Transcrever o que eu falar" (Web Speech API, pt-BR, contínuo) adiciona o dito ao campo assuntos — sem conflito com gravação de áudio (só aparece quando não está gravando). Sem transcrição de arquivo gravado (requer API externa — decisão futura).
- 22 provas de API verdes (RED 1-4 + GREEN + hook da próxima ação); usuários de teste recriados por migração idempotente 0023.
- Lições duras: migrações só rodam no publish; diretório real é pocketbase/; patches de tela precisam ser conferidos no arquivo do Skip (o botão não subiu); FormData com arquivo exige empresa; runtime sem startOfDay — datas por string; no create hook a ação atual não está no histórico.
- Versão final no ar: v0.0.62 (a56c629).

- 2026-10-08 · [Pardal] · Task e6893843 concluída: teste humano aprovado pelo Diogo ("testei e está funcionando"). Revalidação do zero: RED 1 reprovado pela API do backend (sem token, empresas totalItems=0), login do Diogo autenticando e 2 vínculos ativos (Administrador nas duas empresas) pela API, fluxo login → escolha → topo → trocar reexercitado no navegador, versão no ar (c040650) igual à testada (isPublished=true).

## 2026-10-08 — task e6893843: conclusão após teste humano

Teste humano aprovado. Verificação independente refeita do zero: RED 1 pela API do backend do
Skip (listagem de empresas sem token → totalItems 0), login do Diogo autenticando, vínculos
ativos com expand de empresa, e o fluxo visual reexercitado no navegador na versão publicada.
fase.md, STATUS.md, changelog e estado atualizados; aprendizado capturado (URL do backend para
provas de API). Próxima: f1624dc7 analisada, aguardando autorização.

# Histórico de execução — Agrospy

- 2026-10-07 · [Pardal] · Task e6893843 implementada: login, escolha de empresa e identidade visual; versão 0.0.7 (c040650) publicada. Fluxo provado no navegador (login → escolha → topo → trocar). Aguardando teste humano do Diogo. A migração 0003 (usuário do Diogo com senha temporária) não vai ao espelho/GitHub por conter credencial (regra de segredos); permanece apenas no Skip.

## 2026-10-07 — task e6893843: login e escolha de empresa

Implementadas as coleções `empresas` (seed idempotente Agrospy #153A1D e Rumo Agro #37474F
provisória) e `vinculos` (único por usuário+empresa), o usuário do Diogo com vínculo
Administrador nas duas empresas (senha com hash via setPassword), as telas de entrada e de
escolha de empresa, o cabeçalho com identidade da empresa ativa e o botão “Trocar empresa”
(RN-05), com guards de rota por sessão e empresa ativa. Duas correções durante o QA: imports
da logo (.png → .svg) e hash de senha (set → setPassword). Versão 0.0.7 (c040650) com QA
completo verde e publicada em https://agrospy-8aca5.goskip.app às 21:37 UTC. Fluxo completo
provado no navegador: login → escolha entre as duas empresas → topo com identidade → trocar
empresa volta à escolha. Pendente para a conclusão: prova RED 1 pela API (listagem sem token).

- 2026-10-07 · [Pardal] · Task 3f7fb2d0 concluída: projeto no Skip com as 6 SPECs guardadas, versão 0.0.4 (44b71de) publicada e testada pelo cliente. Evidência: QA completo do Skip, skip_project_status (isPublished=true) e confirmação "Testei e está funcionando".

## 2026-10-07 — task 3f7fb2d0: projeto criado e SPECs guardadas no Skip

Executada a task 3f7fb2d0 (SPEC-1-001, pré-condições): projeto Skip 64376 "Agrospy" confirmado e
conector operando; as 6 SPECs da fase (00-INDICE + SPEC-1-001 a 1-005) copiadas para `docs/specs/`
no projeto. Versão 0.0.4 (`44b71de`) aplicada com QA completo (setup, análise estática, build,
integrações e testes) e publicada em https://agrospy-8aca5.goskip.app às 21:02 UTC.
Subtarefas c1886bd3 (conector) e ceeec8f6 (projeto + SPECs) concluídas; task 3f7fb2d0 em
andamento aguardando teste humano do Diogo na URL de produção. Plataforma registrada em
`07-sistemas/comercial/plataforma.md` e espelho inicial em `07-sistemas/comercial/codigo/`.

## 2026-10-07 — repositório GitHub criado

Criado o repositório privado [drkgod/agrospy-consultoria-fase-1](https://github.com/drkgod/agrospy-consultoria-fase-1) e enviada a branch `main` com o pacote da fase 1. Commit inicial: `9ea68b1`.

## 2026-10-07 — pacote da fase 1 preparado

Criados `04_fase-atual/fase.md`, o índice e as 5 SPECs em `04_fase-atual/specs/`, com 36 tasks e seus IDs, responsáveis, prazos, descrições e hierarquia preservados.

Preparadas as pastas `05_entregas/`, `06_notas/` e `07-sistemas/`, além de `README.md` e `STATUS.md`.

Validados o formato `fase-format:2`, o vínculo de cada task com uma única SPEC e a presença de TDD. O pacote foi relido e comparado com a fonte. As tasks continuam abertas; este registro trata da preparação dos documentos.
## [0.0.14] - 2026-10-12 — Task 3 (f1624dc7) implementada, aguardando teste humano
- Skip v0.0.14 (ba2fa1c) publicada em https://agrospy-8aca5.goskip.app (prova: lastPublishedRef = versionHash).
- Campos acesso_* em users + hooks de recálculo (create/update/delete de vinculos); e-mail denormalizado no vínculo.
- Regras de vinculos/empresas validadas em PocketBase local (v0.23.12) antes de aplicar: padrão @collection self-join (users_via_acesso_admin/empresas).
- Tela /usuarios (lista + criar com senha temporária + alterar perfil + desativar/reativar com confirmação); menu Usuários só para administrador.
- Rumo Agro: cor #304A54 na migração + logo real enviada ao campo `logo` da empresa (JPEG 77 KB servido pela API).
- Correções durante o ciclo: createRule de users bloqueia acesso_* no corpo (RED 4); bug de re-render na tela /usuarios (deps por id); limpeza/recarga de acesso_* (0008) e remoção de usuários de teste órfãos.
- Provas: login/escolha/menu/tela no navegador; API — empresas 2 itens (admin) vs 1 (operador), vínculo alheio 404, criação de vínculo por operador 400, autoelevação PATCH 404.

## [0.0.15] - 2026-10-12 — Task 3: ajustes finais
- Correção das regras de empresas/vinculos com padrão @collection self-join validado em PocketBase local (0007); createRule de users bloqueia acesso_* no corpo (0006, RED 4).
- Migração 0008: recálculo de acesso_* de todos os usuários + remoção de usuários de teste órfãos.
- Logo real da Rumo Agro no campo `logo` da empresa (JPEG, servida pela API); fallback da Agrospy para o SVG da marca na tela de escolha (fix re-render com deps por id).
- Provas: empresas 2 itens (admin) vs 1 (operador); vínculo alheio 404; criação de vínculo/usuario por operador 400; PATCH autoelevação 404; navegador: login → escolha (com logos) → menu Usuários → tela com lista.

## [0.0.19] - 2026-10-12 — Task 3: bug do teste corrigido (auto-rebaixamento do último admin)
- Bug relatado ("escolho o perfil e a página some"): o sistema permitia o próprio admin trocar o próprio perfil para não-admin — sem outro admin, a tela /usuarios fechava (e o menu sumia).
- Correção em 3 camadas: UI bloqueia com toast explicativo (Usuarios.tsx); hook server-side recusa o update com 400 (proteção do último admin ativo); migração 0010 restaurou o perfil do Diogo.
- Lição técnica: e.record.original() não existe no runtime de hooks do Skip — ler o estado anterior com $app.findRecordById (v0.0.17 falhou por engolir esse erro em try/catch).
- Provas: API — auto-rebaixamento 400, auto-desativação 400, perfil permanece administrador; navegador — /usuarios carrega como admin (v0.0.19, ba2fa1c→90f2231 publicada).

## [0.0.20] - 2026-10-13 — Task 3 (f1624dc7) CONCLUÍDA
- Teste humano aprovado pelo Diogo ("agora deu certo") após correção do crash client-side no Safari do iPhone.
- v0.0.20 (f562866): selects nativos no lugar do popover Radix + ErrorBoundary global; hook de proteção do último administrador (v0.0.19); perfil restaurado (0009/0010).
- Usuários de teste criados (f1425ca3): teste.gestao/comercial/operador@agrospy.com.br, teste.comercial@rumoagro.com.br e teste.multi@agrospy.com.br (comercial na Agrospy + operador na Rumo) — senha Teste#2026.
- Lições: crash no Safari não aparece no teste no Chrome — logs do servidor (0 PATCH, só GETs) provam onde cai; e.record.original() indisponível nos hooks do Skip; migração idempotente não re-executa (correção de regra exige migração nova).

## [0.0.31] - 2026-10-13 — task 147a4f1b: cadastro de produtor e propriedade (SPEC-1-002)
- Coleções produtores/propriedades/eventos (0011) com índices; regras de acesso por perfil (0012/0013; createRule corrigida na 0014 — fix não re-executa em migração idempotente).
- Hooks (request): documento único por empresa (RN-08), indicação exige quem indicou (RN-07), responsável/criado_por automáticos (RN-10), evento de troca de responsável com de/para/por (RN-11).
- Frontend: /produtores (lista + busca + criar com origem/indicação), ficha com propriedades e troca de responsável.
- Lições: Model hook não tem e.requestInfo() (usar Request hooks); col.newRecord() não existe (usar new Record(col)); migração idempotente não re-executa fix de regra (exige migração nova).
- Provas API: comercial cria sem responsável (200, hook preenche), indicação sem indicador 400, doc repetido 400, propriedade de outra empresa 400, operador lista 200, troca de responsável cria evento. Navegador: lista + cards + menu Produtores.

## [0.0.37] - 2026-10-13 — task 147a4f1b: emenda do Diogo (tecnologia + localização)
- 1º teste humano APROVADO ("o teste funcionou").
- Campos novos: nivel_tecnologia (select baixa/media/alta/muito_alta), tecnologias (textarea livre — automações, AP, implementos) no produtor; link_maps (Google Maps, clicável) na propriedade (migração 0015).
- Bugs corrigidos: crash "NIVEIS is not defined" na ficha/lista (patch aplicado pela metade); loop de fetch com 429 na ficha (deps do useEffect por empresaId, não pelo objeto do getAtiva()); ErrorBoundary agora exibe a mensagem do erro (diagnóstico 10x mais rápido).
- Provas API: criação com nível/tecnologias 200, propriedade com link 200, PATCH nível 200, edição persistida 200, doc duplicado na edição 400.
- Pendências do fechamento: espelho completo, GitHub consolidado, limpeza dos registros de teste (DELETE exige superusuário).

## [0.0.39] - 2026-10-13 — task 147a4f1b: emenda 2 (editar/excluir propriedade)
- Ficha: cada propriedade ganhou Editar (form inline) e Excluir (confirmação inline, sem popup).
- Backend: deleteRule de propriedades (0016; reaplicada na 0017 porque o DELETE ainda respondia 403 após o publish da 0.0.38 — regra não chegou ao banco).
- Provas API: PATCH propriedade 200 (nome/área/link), DELETE 204, lista atualizada. Navegador: botões renderizados na ficha real do teste do Diogo.

## [FECHAMENTO] - 2026-10-15 — task baad9730 CONCLUÍDA
- Teste humano aprovado pelo Diogo: "testei 'minha carteira' e funcionou - pode concluir".
- Emenda durante o teste: botão "Sair" no header (v0.0.71, cf078e3) — troca de usuário.
- Fase 1: 20/36 tasks concluídas. Próxima: visão do gestor (684e8557).

## [FECHAMENTO] - 2026-10-15 — task 684e8557 CONCLUÍDA
- Teste humano aprovado pelo Diogo: "Testei e funcionou — pode concluir".
- SPEC-1-005 completa (Minha carteira + visão do gestor). Fase 1: 21/36 tasks concluídas.
- Restam para a fase: offline (4da366fe + 3 sub), testes de acesso (ed490cca + 2 sub), cadastro da equipe (6af46d50), testes de falha (f5877532 + 2 sub), demonstração (8187b1f6), call de validação (7acbab78) e revisão de evidências (99563d4a).

## [0.0.73–0.0.81] - 2026-10-15 — task 4da366fe: offline/modo avião (SPEC-1-004, CA-1-15/16)
- Instalável (CA-1-15): manifest.webmanifest + service worker da casca (network-first, API nunca cacheada), index.html com manifest/theme-color/apple-touch-icon, título "Agrospy". /sw.js e /manifest servidos (200 provado por curl).
- Fila offline em IndexedDB nativo (src/services/fila-offline.ts): enfileirar com id_local (UUID v4), dependências (propriedade→produtor, oportunidade→visita_origem), envio na ordem produtor→propriedade→visita→oportunidade→ação com troca do id_local pelo id do servidor, idempotência por consulta prévia, falhas 401 (mantém pendente)/403/404/400 (precisa_revisao com motivo), RN-25 (fila por usuário), descarte só em revisão (RN-22).
- Telas de criação enfileiram offline: Produtores (criar), ProdutorFicha (propriedade nova), RegistrarVisita (visita + oportunidade dependente; áudio offline bloqueado com aviso — fase 2). Edição offline bloqueada (RN-21).
- Indicador de conexão no topo (todas as telas): "Sem conexão — N aguardando envio" + "Sincronizar agora"; ao reconectar envia e mostra "Enviado". Pendências de envio (/pendencias) com motivo, Tentar de novo e Descartar com confirmação. Sair com pendências pede confirmação (RN-24). Carteira mostra data/hora da última sincronização e lê do cache offline (CA-1-15).
- RED 1 CONFIRMADO COMO BUG REAL: os índices únicos de id_local NUNCA existiram — causa-raiz: no JSVM, newQuery({query: sql}) vira "[object Object]" e o try/catch de 0011/0021/0022 engoliu o erro. 2 POSTs com o mesmo id_local criavam 2 registros. Correção: 0030 dedup (newQuery posicional) + 0031 col.addIndex (caminho gerenciado) nas 5 coleções. Prova: 1º POST 200, 2º POST 400, 1 registro no servidor.
- Versões: 0.0.73→0.0.81 (81463d7), publicada 15/10 18:07 UTC.

## [0.0.82] - 2026-10-15 — fix: erro no teste do offline
- CAUSA: /logo-agrospy.svg retornava 404 (o logo só existia em src/assets, empacotado pelo Vite, não em public/). O arquivo estava na lista SHELL do service worker → cache.addAll falhava → SW NUNCA instalava → nada ficava em cache → app não abria no modo avião (prova: 0 registros de SW no navegador).
- FIX 1: logo real copiado para public/logo-agrospy.svg (200 provado).
- FIX 2: cache.addAll → Promise.allSettled (cache tolerante: um arquivo do shell que falhar não derruba a instalação).
- PROVA: SW registrado e ativado (1 registro, estado activated); cache agrospy-shell-v1 com 5 entradas (/ , /index.html, /logo-agrospy.svg, /favicon.ico, /manifest.webmanifest); index.html confirmado em cache. Diogo deve fechar e reabrir o app (1x com internet para o novo SW assumir) e repetir o modo avião.

## [0.0.83] - 2026-10-20 — fix2: falhas do teste offline do Diogo (passos 3-5)
- CAUSAS: (1) item enfileirado offline gravava os dados SEM o campo `empresa` → servidor recusava a criação → item ia para precisa_revisao em silêncio → nada subia ao reconectar; (2) após enfileirar offline, a tela ainda recarregava a lista do servidor → falhava → "Não foi possível carregar os produtores" (mensagem enganosa); (3) "Tentar de novo" em Pendências recriava+apagava o item (podia se autoapagar); (4) itens em revisão não tinham caminho visível.
- FIX: fila-offline.ts grava `empresa` no payload (e injeta item.empresa no envio, resgatando itens antigos); status 0 (rede caiu no meio) mantém pendente; novo método reencaminhar(); Produtores.tsx com fallback offline (cópia local + itens da fila, com aviso "Sem conexão — exibindo os dados do aparelho"); Pendencias.tsx usa reencaminhar(); IndicadorConexao.tsx com banner vermelho de revisão → atalho para /pendencias.
- PROVA: QA verde, publicada 20/10 17:56 UTC (f355b3d); login e carteira verificados no navegador.
- NOTA: espelho local estava defasado (subagente já corrigiu no GitHub); re-sincronizar espelho local na próxima rodada.

## [0.0.84] - 2026-10-20 — ed490cca: testes de acesso multiempresa (prova por fora da tela)
- ISOLAMENTO ENTRE EMPRESAS: 100% bloqueado nas duas direções (Rumo→Agrospy e Agrospy→Rumo): listar produtores/visitas/oportunidades = 0 registros; abrir registro específico = 404; criar = 400/403. Nota de método: o primeiro teste acusou "1 produtor visível" — artefato do script (urllib.parse.quote com safe padrão corrompia o filtro); com filtro correto, zero.
- MATRIZ PERFIL × RECURSO (Agrospy, via API): gestao — ver todos (9), criar 200, editar alheio 200, criar linha de negócio 400; comercial1/comercial2 — ver todos, criar 200, editar SÓ o próprio (alheio 404), criar LN 400; operador — ver todos, criar 400, editar 404, criar LN 400.
- GAP CORRIGIDO: fixture 0023 não tinha usuário com perfil 'administrador' — a tela Linhas de negócio (só aparece p/ ehAdmin) e o createRule de LN (exige acesso_admin) ficavam sem prova. Migração 0032 cria teste.admin@agrospy.com.br (senha Teste#2026, vínculo administrador na Agrospy). Prova: admin cria LN 200; comercial continua 400.
- LIMPEZA: produtores "MATRIZ" dos testes arquivados (deleteRule null — regra da casa: registro não se apaga); LN de prova desativada.
- Versão 0.0.84 (b6afce0) publicada 20/10 19:27 UTC. Falta: tabela perfil × recurso na tela (teste visual) e o mesmo teste com usuário real do Diogo.

## [0.0.85–0.0.86] - 2026-10-20 — 6af46d50: prova de ponta a ponta da tela Usuários + 2 bugs de servidor corrigidos
- PROVA do fluxo completo (mesmo caminho da tela, via API, com teste.admin@agrospy.com.br): criar usuário (200) → criar vínculo com perfil (200) → listar equipe (15 vínculos visíveis, incluindo diogo.rojas@agrospy.com.br e diogo.rojas@rumoagro.com.br como administradores, rodrigo.ferreira@rumoagro.com.br como gestão) → trocar perfil (200) → desativar acesso (200 após fix 0.0.86) → usuário desativado perde acesso a produtores (0 registros, login ainda válido mas sem dados).
- BUG 1 (0.0.85, migração 0033): teste.admin ficou com acesso_* zerado — a 0032 setou os campos direto no user, fora do fluxo dos hooks, e um recálculo posterior zerou. Migração 0033 refaz o recálculo de TODOS os usuários com a mesma lógica dos hooks (idempotente). Prova: acesso_admin repovoado, admin volta a ver os 15 vínculos e a criar LN (200).
- BUG 2 (0.0.86, migração 0034): campo `ativo` (bool REQUIRED) rejeitava false via API — "validation_required: Cannot be blank" no PATCH {ativo:false} e no CREATE com ativo=false (PocketBase trata false como blank em bool required). A tela "Desativar" estava quebrada para TODOS os usuários. Correção: required sai do campo (false é valor legítimo); hooks e regras já filtram ativo=true. Prova: PATCH {ativo:false} → 200, usuário desativado com 0 acesso.
- LIMPEZA: usuário/vínculo de prova desativados (regra da casa: registro não se apaga); LN de prova desativada.
- Versões: 0.0.85 (112029a) e 0.0.86 (cc43557) publicadas 20/10 à noite.

## [0.0.87] - 2026-10-22 — f5877532: falhas de envio provadas (nada se perde)
- PROVAS via API (6 cenários): (1) visita reenviada 2x com mesmo id_local → 200/400 e EXATAMENTE 1 registro no servidor; (2) produtor reenviado 3x → 200/400/400 e 1 registro; (3) registro inválido (sem nome) → 400 com motivo claro por campo ("nome: Cannot be blank"); (4) criação na outra empresa → 400 bloqueado; (5) token inválido → listas vazias (200/0 — comportamento do PB: listRule falha = 0 resultados) e criação bloqueada (400); (6) sem token → 400.
- FIX: a fila agora guarda o motivo CLARO por campo na revisão ("nome: Cannot be blank" em vez de "Registro recusado pelo servidor") — extraído de response.data do PocketBase.
- Mapeamento fila × falha (código publicado): 401 (sessão expirada) → mantém pendente; status 0 (rede caiu no meio) → mantém pendente; 400/403/404 → precisa_revisao com motivo + banner vermelho + Pendências de envio com Tentar de novo/Descartar.
- Versão 0.0.87 (2976e0f) publicada 22/10 14:48 UTC.