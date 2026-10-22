# SPEC-1-003 — Visita e oportunidade com próxima ação obrigatória

**Fase:** 1
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · validação: Rodrigo Santos (consultor)
**Origem no escopo:** RQ-001, RQ-003, RQ-005 (base); P6; Fase 1, capacidades 4 e 5; escopo base §4.3, §4.4, §4.5, §4.7 e §5 regras 8 e 9
**Degrau da solução:** nativo da plataforma — coleções, regras de acesso e hook do backend do Skip Cloud; nenhuma dependência nova.

## Contexto e decisões fechadas

- **Estado atual:** “nada de registro hoje… é memória” (1ª consultoria 22/09 `[00:21:00]–[00:21:06]`); a revisita ideal de 15–45 dias vira 6–12 meses por esquecimento (análise do vídeo, passo 7). Registrar depois num formulário longo “não funciona” (`[00:15:51]`).
- **Estado desejado:** a visita é registrada em poucos toques, sai sempre com um destino e toda oportunidade aberta tem responsável e próxima ação datada.
- **Decisões já fechadas:**
  - Roteiro de visita do escopo (estrutura, perfil tecnológico, investimento, máquinas, necessidades, assuntos, acordos), com só três campos obrigatórios para não travar o registro.
  - Oportunidade por linha de negócio da empresa; um produtor pode ter várias.
  - Oportunidade aberta sempre com responsável, próxima ação e data; concluir uma ação exige registrar a próxima (escopo base §5 regra 8).
  - Falta de interesse imediato não é perda: vira “sem oportunidade agora” com motivo ou oportunidade de relacionamento com data de retorno (§5 regra 9).
  - Encerrar como ganha/perdida e etapas do funil são da fase 3; nesta fase a oportunidade fica aberta.
  - Permissões conforme a matriz da SPEC-1-001.
- **Bloqueios:** nenhum. A lista de linhas de negócio de cada empresa é confirmada pelo cliente durante a execução (CL-PEND-008).

## Resultado observável

Depois da visita, o vendedor abre o produtor, toca “Registrar visita”, escreve (ou dita pelo teclado do celular) o que conversou, escolhe o próximo passo — por exemplo, “Sementes de pastagem: levar orçamento em 20/10” — e salva. A ficha do produtor passa a mostrar a visita e a oportunidade em ordem de data.

## Limites e dependências

- **Inclui:** coleções `linhas_negocio`, `visitas`, `oportunidades` e `acoes_oportunidade`; formulário de visita com destino obrigatório; criação e atualização de oportunidade; concluir e reagendar ação; ficha do produtor com visitas e oportunidades; administração das linhas de negócio.
- **Fora de escopo:** ganho/perda e motivos, etapas do funil, orçamento/proposta (fase 3); captura por áudio no WhatsApp/Plaud/Drive (fase 2); avisos push (fase 2); uso sem internet (SPEC-1-004 usa estas coleções); IA.
- **Entradas e pré-condições:** SPEC-1-001 e SPEC-1-002 em GREEN.
- **Saídas/artefatos:** migrações; telas; hook que mantém a próxima ação vigente; roteiro de teste.
- **Dependências e responsáveis:** Agrospy executa; Rodrigo Santos valida; Diogo confirma as linhas de negócio.
- **Atores e permissões mínimas:** visitas — Administrador e Gestão veem e registram todas; Comercial vê as da própria carteira e as que registrou e registra em produtor da própria carteira; Operador não acessa. Oportunidades e ações — Administrador e Gestão todas; Comercial só as próprias; Operador não acessa. Linhas de negócio — todos consultam; só o Administrador cria, renomeia e desativa.
- **Superfícies/arquivos/configurações afetadas:** schema e migrações; `src/services/visitas.ts`, `src/services/oportunidades.ts`, `src/services/linhas-negocio.ts`; telas de visita, oportunidade e ficha do produtor.
- **Risco e plano B:** formulário virar barreira de adoção — manter só três obrigatórios e destino em um toque; o teste humano mede.
- **Rollback ou reversão:** migração reversível; `acoes_oportunidade` é só de inclusão, então nada do histórico se perde.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| `linhas_negocio` | backend do Skip | `empresa`, `nome` (único por empresa), `ativa` (bool), `fixa` (bool; a linha “Relacionamento — retorno sem linha definida” é fixa) | listar: empresa em `acesso_empresas`; criar/editar: empresa em `acesso_admin`; apagar: ninguém | seed idempotente por (`empresa`, `nome`) | linha inativa não aparece para novas oportunidades |
| `visitas` | backend do Skip | `empresa`, `produtor` (obrigatório, mesma empresa), `propriedade` (opcional, do mesmo produtor), `data` (obrigatória), `responsavel_visita` (users, padrão o usuário), `acompanhantes` (texto), `assuntos_tratados` (obrigatório), `estrutura_existente`, `perfil_tecnologico` (`baixo` \| `medio` \| `alto` \| `nao_avaliado`), `nivel_investimento` (idem), `maquinas`, `area_potencial`, `necessidades`, `acordos`, `interesses` (relação múltipla com `linhas_negocio`), `destino` (`nova_oportunidade` \| `oportunidade_atualizada` \| `sem_oportunidade`), `motivo_sem_oportunidade` (`sem_interesse_agora` \| `sem_perfil` \| `atendido_por_concorrente` \| `outro`), `id_local` | listar/ver: empresa em `acesso_gestao`, ou em `acesso_comercial` com produtor da própria carteira ou `responsavel_visita` = o próprio usuário; criar: empresa em `acesso_gestao`, ou Comercial com produtor da própria carteira; editar: autor ou Gestão; `empresa` e `produtor` imutáveis; apagar: ninguém | `id_local` único | sem destino ou sem motivo quando `sem_oportunidade` → recusa |
| `oportunidades` | backend do Skip | `empresa`, `produtor`, `propriedade` (opcional), `linha_negocio` (obrigatória, da mesma empresa), `descricao` (obrigatória, curta), `responsavel` (obrigatório; padrão o responsável do produtor), `situacao` (`aberta` nesta fase), `proxima_acao` (obrigatória), `proxima_acao_data` (obrigatória), `visita_origem` (opcional), `criado_em_aparelho` (data/hora, preenchida pela fila da SPEC-1-004), `id_local` | listar/ver/editar: empresa em `acesso_gestao`, ou Comercial com `responsavel` = o próprio usuário; criar: Gestão, ou Comercial com `responsavel` = o próprio usuário e produtor da própria carteira; apagar: ninguém | `id_local` único | sem linha, ação ou data → recusa; data anterior a hoje na criação → recusa |
| `acoes_oportunidade` | backend do Skip (histórico só de inclusão) | `empresa`, `oportunidade`, `tipo` (`criada` \| `concluida` \| `reagendada`), `resultado` (texto, obrigatório em `concluida`), `nova_acao`, `nova_data` (obrigatórias), `registrado_por`, `registrado_em` (data/hora do aparelho), `id_local` | criar: quem pode editar a oportunidade; ver: quem pode ver a oportunidade; editar/apagar: ninguém | `id_local` único | sem nova ação/data → recusa |
| Hook “próxima ação vigente” | backend do Skip | ao incluir uma ação, atualiza `proxima_acao` e `proxima_acao_data` da oportunidade com a ação de `registrado_em` mais recente | servidor | recalcula a partir do histórico (idempotente) | falha desfaz a inclusão |

**Linhas de negócio iniciais (carga editável pelo Administrador; confirmar com o cliente — CL-PEND-008):**

| Agrospy | Rumo Agro |
|---|---|
| Consultoria em agricultura de precisão | Mapeamento de áreas |
| Sementes de pastagem | Linhas de orientação de plantio |
| Tecnologia de aplicação | Linhas de orientação de pulverização |
| Equipamentos para plantadeiras | Projetos de terraços |
| Fertilizantes e insumos biológicos | Relacionamento — retorno sem linha definida |
| Sistema de multi-filtragem para pulverizadores | |
| Estações meteorológicas e monitoramento climático | |
| Relacionamento — retorno sem linha definida | |

Fonte da carga: portfólio mostrado no vídeo do processo comercial (catálogo de novos negócios) e Rumo Agro como empresa de projetos de automação (`[00:23:34]`).

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-13 | salvar visita | obrigatórios: produtor, data e assuntos tratados; mais o destino | demais campos opcionais | `[00:15:51]` |
| RN-14 | destino `nova_oportunidade` | cria uma ou mais oportunidades com linha, descrição, próxima ação e data | — | §4.5, §4.7 |
| RN-15 | destino `oportunidade_atualizada` | inclui ação `concluida` na oportunidade aberta escolhida, com resultado e nova ação/data | — | §5 regra 8 |
| RN-16 | destino `sem_oportunidade` | exige motivo; se o vendedor quiser voltar a falar, cria oportunidade na linha “Relacionamento” com data de retorno | — | §5 regra 9 |
| RN-17 | concluir ação | exige resultado e a próxima ação com data | — | §5 regra 8 |
| RN-18 | reagendar | nova data hoje ou futura; histórico guarda a data anterior | — | §4.7 |
| RN-19 | data da próxima ação no passado | o servidor compara a data com o dia do registro: `criado_em_aparelho` quando veio da fila sem internet, senão o dia de hoje; anterior a esse dia → recusa; registro feito sem internet e enviado depois do prazo é aceito e aparece como atrasado | — | SPEC-1-004 |
| RN-20 | linha de negócio | só as ativas da empresa ativa; linha em uso não é apagada, só desativada | linha fixa “Relacionamento” não é desativada | P2 |

## Fluxo e regras

1. Ficha do produtor → “Registrar visita” (ou menu “Nova visita” → escolher produtor ou cadastrar rápido pela SPEC-1-002).
2. Formulário: data (hoje por padrão), assuntos tratados (campo grande, aceita ditado do teclado) e, recolhidos em “Mais detalhes”, os campos do roteiro.
3. “Qual o próximo passo?” → três botões: Nova oportunidade · Atualizar oportunidade aberta · Sem oportunidade agora.
4. Nova oportunidade → linha de negócio, descrição curta, próxima ação e data (atalhos +7, +15, +30 dias); permite adicionar outra.
5. Salvar → a ficha mostra visita e oportunidades em ordem de data, com quem registrou.
6. Na oportunidade → “Concluir ação” (resultado + próxima ação e data) ou “Reagendar” (nova data).
7. Administrador → “Linhas de negócio” da empresa ativa: criar, renomear, desativar.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | visita com nova oportunidade “Sementes de pastagem, levar orçamento em 7 dias” | visita e oportunidade salvas; ficha atualizada | — |
| Limite | visita sem interesse, mas com retorno em 60 dias | oportunidade na linha “Relacionamento” com data | — |
| Limite | visita só com os três obrigatórios + destino | salva | — |
| Falha | salvar sem destino | não salva; destaque no “Qual o próximo passo?” | escolher destino |
| Falha | oportunidade sem data ou com data passada | não salva | corrigir a data |
| Falha | Comercial tenta registrar visita em produtor de outra carteira | recusa (tela e API) | pedir ao gestor |

## Instruções de execução para o Ethos

1. **Ler antes de alterar:** esta SPEC, as SPECs 1-001 e 1-002 e o schema atual do projeto no Skip.
2. **Alterar somente:** as quatro coleções desta SPEC, o hook de próxima ação vigente, seus serviços e as telas de visita, oportunidade, linhas de negócio e a seção de histórico da ficha do produtor.
3. **Não alterar:** regras das SPECs anteriores; não criar etapa de funil, ganho, perda ou valor de proposta; nunca exibir texto livre (assuntos, acordos, observações) como HTML.
4. **Executar nesta ordem:** (a) `linhas_negocio` com a carga inicial; (b) `oportunidades` e `acoes_oportunidade` com o hook; (c) `visitas`; (d) formulário de visita com destino; (e) telas de oportunidade (concluir/reagendar); (f) histórico na ficha; (g) roteiro RED/GREEN.
5. **Parar e pedir validação quando:** o cliente pedir campo obrigatório novo no formulário (risco de adoção); pedirem encerrar oportunidade como ganha/perdida (fase 3); a carga de linhas de negócio for contestada.
6. **Estado válido ao parar:** toda oportunidade aberta tem responsável, ação e data; nenhuma visita sem destino; SPECs 1-001 e 1-002 sem regressão.

## Checklist de execução

- [ ] SPECs 1-001 e 1-002 em GREEN (pré-condição conferida).
- [ ] Linhas de negócio carregadas por empresa e confirmadas pelo Diogo.
- [ ] Visita com três obrigatórios e destino obrigatório.
- [ ] Oportunidade com linha, responsável, ação e data.
- [ ] Concluir e reagendar guardando histórico.
- [ ] Ficha com visitas e oportunidades em ordem de data.
- [ ] Roteiro RED → GREEN → regressão anexado.

## Critérios de aceite

- [ ] **CA-1-10:** a visita salva com apenas produtor, data e assuntos tratados, mais o destino; os demais campos do roteiro ficam opcionais em “Mais detalhes”.
- [ ] **CA-1-11:** nenhuma visita é salva sem destino; “sem oportunidade agora” exige motivo.
- [ ] **CA-1-12:** nenhuma oportunidade aberta é salva sem linha de negócio, responsável, próxima ação e data; data passada é recusada no registro com internet; concluir uma ação exige resultado e a próxima; o histórico de ações não pode ser editado nem apagado.
- [ ] **CA-1-13:** a ficha do produtor mostra visitas e oportunidades da mais recente para a mais antiga, com quem registrou.
- [ ] **CA-1-14:** só aparecem as linhas de negócio ativas da empresa ativa; o Administrador cria e desativa linhas; linha em uso não pode ser apagada.

## TDD da SPEC

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | destino obrigatório (CA-1-11) | criar pela API visita de teste sem `destino`; e com `sem_oportunidade` sem motivo | antes da regra, salva (falha esperada) | respostas da API |
| RED 2 | próxima ação obrigatória (CA-1-12) | criar oportunidade sem `proxima_acao_data`; com data de ontem; com linha da Rumo Agro numa oportunidade da Agrospy | antes das regras, salva (falha esperada) | respostas da API |
| RED 3 | histórico imutável (CA-1-12) | editar e apagar uma `acoes_oportunidade` | antes da regra, altera (falha esperada) | respostas da API |
| RED 4 | carteira (matriz) | com `teste.comercial2.agrospy`, registrar visita e listar oportunidades de produtor de `teste.comercial1.agrospy`; com `teste.operador.agrospy`, listar visitas | antes das regras, passa/aparece (falha esperada) | respostas da API |
| GREEN | menor comportamento que passa | aplicar regras e hook; repetir RED 1–4; no celular, registrar visita com nova oportunidade e depois concluir a ação | RED 1–4 recusados/vazios; a oportunidade mostra a nova ação vigente; ficha em ordem de data (CA-1-10, CA-1-13) | respostas + prints |
| REFACTOR/REGRESSÃO | linhas e regressão | desativar uma linha em uso e tentar apagá-la; tentar desativar “Relacionamento”; repetir a regressão de acesso da SPEC-1-001 sobre as novas coleções | linha desativada some das novas oportunidades e não é apagada; fixa não desativa; matriz sem divergência (CA-1-14) | respostas + tabela da matriz |

**Dados/fixtures:** usuários de teste da SPEC-1-001; “TESTE — Produtor A” (carteira de `teste.comercial1.agrospy`) e “TESTE — Produtor B” (carteira de `teste.comercial2.agrospy`); linhas de negócio da carga inicial.
**Caminhos de erro obrigatórios:** sem destino, sem motivo, sem data, data passada, linha de outra empresa, edição do histórico, visita fora da carteira, Operador listando.
**Evidência exigida:** respostas da API antes/depois, prints do formulário, do destino e da ficha, e a lista de linhas por empresa confirmada pelo Diogo.

## Teste humano do cliente

- **Origem:** CL-004 — o teste completo da fase está na SPEC-1-005.
- **Quem testa:** Diogo e um vendedor.
- **Passos:** registrar no celular uma visita real usando o ditado do teclado, criar a oportunidade com próxima ação e, depois, concluir essa ação.
- **Resultado esperado:** registrar a visita leva poucos toques e a ficha mostra o que foi conversado e o próximo passo.
- **Evidência do aceite:** mensagem do Diogo no card da tarefa, incluindo se algum campo atrapalhou.

## Handoff e operação

- **Como demonstrar:** abrir um produtor, registrar a visita, escolher o próximo passo e mostrar a ficha atualizada.
- **Como operar depois:** o vendedor registra toda visita no dia; o Administrador mantém as linhas de negócio.
- **Como monitorar:** oportunidades atrasadas aparecem na carteira e na visão do gestor (SPEC-1-005).
- **Pendência conhecida:** encerrar oportunidade (ganha/perdida) e funil ficam para a fase 3.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| ae167e8a-d5f2-4d51-b78f-9b9aa5acda14 | Criar o registro de visita com o roteiro da conversa | Agrospy | SPEC-1-003 | CA-1-10, CA-1-13 | GREEN (visita no celular) + ficha | prints do formulário e da ficha | SPECs 1-001 e 1-002 em GREEN |
| 979d69ff-c333-4509-a9a1-41476245aa04 | Montar o formulário curto da visita | Agrospy | SPEC-1-003 | CA-1-10 | três obrigatórios + “Mais detalhes” | print do formulário | coleção `visitas` criada |
| bd7652e9-6149-4aa2-bce3-30d517108d4d | Mostrar visitas e oportunidades na ficha do produtor | Agrospy | SPEC-1-003 | CA-1-13 | ordem da mais recente para a mais antiga | print da ficha | visitas registradas |
| 448d4044-5617-4296-806b-371ec39e9a51 | Registrar oportunidades com responsável e próxima ação obrigatória | Agrospy | SPEC-1-003 | CA-1-11, CA-1-12, CA-1-14 | RED 1–4 → GREEN → REFACTOR/REGRESSÃO | respostas da API + prints | visita funcionando |
| 6850e423-a005-4c52-97c3-84c04bbc219f | Configurar as linhas de negócio de cada empresa | Agrospy | SPEC-1-003 | CA-1-14 | carga inicial + REFACTOR/REGRESSÃO de linhas | lista por empresa confirmada pelo Diogo | CL-PEND-008 |
| 623899c6-debc-4514-85f7-d6e0857871c0 | Exigir o próximo passo ao salvar cada visita | Agrospy | SPEC-1-003 | CA-1-11 | RED 1 → GREEN | resposta da API + print do destino | formulário da visita |
| 9705e5f8-3cd7-4336-b9ff-7e00dfc1615a | Concluir e reagendar a próxima ação guardando o histórico | Agrospy | SPEC-1-003 | CA-1-12 | RED 2–3 → GREEN | respostas da API + print do histórico | oportunidades criadas |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
