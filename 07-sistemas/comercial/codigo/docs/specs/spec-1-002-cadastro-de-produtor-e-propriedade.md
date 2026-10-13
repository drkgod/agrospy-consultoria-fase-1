# SPEC-1-002 — Cadastro de produtor e propriedade com origem e responsável

**Fase:** 1
**Status:** concluída (13/10/2026) — testada e aprovada pelo Diogo
**Dono:** Agrospy (execução com o Maestro) · validação: Rodrigo Santos (consultor)
**Origem no escopo:** RQ-003, RQ-010; P2, P6; Fase 1, capacidade 3; escopo base §4.1, §4.2 e §5 regras 1 e 11
**Degrau da solução:** nativo da plataforma — coleções, índices únicos e regras de acesso do Skip Cloud; nenhuma dependência nova.

## Contexto e decisões fechadas

- **Estado atual:** indicações são passadas de boca entre os sócios e o cadastro do cliente fica no WhatsApp ou numa planilha parada (análise do vídeo, passo 3; 1ª consultoria 22/09 `[00:22:16]`).
- **Estado desejado:** todo produtor tem cadastro na empresa ativa, com de onde veio, quem indicou, de quem é próximo, quem é o responsável e suas propriedades.
- **Decisões já fechadas:**
  - Cada produtor pertence a uma empresa; a empresa nunca muda depois de criada (P2).
  - O responsável é a carteira: o cliente fica atrelado ao vendedor que o prospectou (`[00:30:41]`).
  - Origem do lead com canal, quem indicou e relacionamento (`[00:05:05]`).
  - Nesta fase, um produtor atendido pelas duas empresas é cadastrado em cada uma separadamente; o vínculo entre empresas é da fase 3.
  - Permissões conforme a matriz da SPEC-1-001.
- **Bloqueios:** nenhum.

## Resultado observável

O vendedor cadastra, no celular, um produtor indicado (“indicação do Seu Antônio”), com a propriedade, o município e a área; o produtor aparece na carteira dele e qualquer pessoa da empresa o encontra pela busca. Cadastro repetido é barrado ou avisado na hora.

## Limites e dependências

- **Inclui:** coleções `produtores`, `propriedades` e `eventos` (troca de responsável); telas de lista/busca, cadastro, edição e ficha do produtor (cadastro e propriedades, com editar/excluir propriedade); captura opcional da localização do celular; troca de responsável; nível de tecnologia e tecnologias do produtor.
- **Fora de escopo:** visitas e oportunidades na ficha (SPEC-1-003); vínculo entre empresas e importação de planilha (fase 3); dados financeiros e de faturamento (fase 4); apagar produtor (nesta fase só Gestão/Administrador arquivam).
- **Entradas e pré-condições:** SPEC-1-001 em GREEN (login, empresas, vínculos e campos de acesso).
- **Saídas/artefatos:** migrações das coleções; telas; roteiro de teste com resultado.
- **Dependências e responsáveis:** Agrospy executa; Rodrigo Santos valida.
- **Atores e permissões mínimas:** consultar — todos os perfis da empresa; criar — Administrador, Gestão e Comercial (Comercial fica como responsável); editar — Administrador, Gestão e o Comercial responsável; trocar responsável e arquivar — Administrador e Gestão; excluir propriedade — Administrador, Gestão ou Comercial responsável.
- **Superfícies/arquivos/configurações afetadas:** schema e migrações do projeto no Skip; `src/services/produtores.ts`, `src/services/propriedades.ts`; telas de produtor.
- **Risco e plano B:** duplicidade de produtor criada por duas pessoas — documento único por empresa e alerta por nome + município; o que passar vira revisão do gestor.
- **Rollback ou reversão:** migração reversível; produtor arquivado não some do histórico.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| `produtores` | backend do Skip | `empresa` (obrigatório, imutável), `nome` (obrigatório), `documento` (CPF/CNPJ só dígitos, opcional), `telefone`, `email`, `municipio` (obrigatório), `regional` (texto livre), `origem` (obrigatório: `indicacao_cliente` \| `indicacao_socio_parceiro` \| `carteira_existente` \| `contato_direto` \| `prospeccao_ativa` \| `outro`), `indicado_por` (texto), `relacionamento` (texto: “próximo de quem”), `responsavel` (users, obrigatório), `observacoes`, `arquivado` (bool), `motivo_arquivamento`, `id_local` (UUID, único, para a SPEC-1-004), `criado_por`, `nivel_tecnologia` (select: `baixa`/`media`/`alta`/`muito_alta`, opcional), `tecnologias` (texto livre ≤5000) | listar/ver: empresa em `acesso_empresas`; criar: empresa em `acesso_gestao`, ou em `acesso_comercial` com `responsavel` = o próprio usuário (ou ausente — hook RN-10 preenche); editar: empresa em `acesso_gestao`, ou Comercial com `responsavel` = o próprio usuário e sem alterar `responsavel`; `empresa` nunca pode ser enviada numa edição; apagar: ninguém | índice único (`empresa`, `documento`) quando o documento existe; `id_local` único | documento repetido → recusa com “Já cadastrado nesta empresa (documento existente)” |
| `propriedades` | backend do Skip | `empresa`, `produtor` (obrigatório, mesma empresa), `nome` (obrigatório), `municipio`, `area_ha` (número ≥ 0), `posse` (`propria` \| `arrendada` \| `mista` \| `nao_informado`), `endereco_referencia`, `latitude`, `longitude` (opcionais), `id_local`, `link_maps` (URL do Google Maps, ≤500) | listar/ver: empresa em `acesso_empresas`; criar: empresa em `acesso_gestao` ou `acesso_comercial` com produtor da mesma empresa; editar: empresa em `acesso_gestao` ou Comercial responsável pelo produtor; excluir: empresa em `acesso_gestao` ou Comercial responsável pelo produtor (0017) | `id_local` único | produtor de outra empresa → recusa |
| `eventos` | backend do Skip | `empresa`, `tipo` (`troca_responsavel`), `registro` (id), `de`, `para`, `por`, `em` | listar: empresa em `acesso_gestao`; criar: só pelo servidor ao trocar responsável; editar/apagar: ninguém | — | — |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-07 | origem é indicação (cliente ou sócio/parceiro) | `indicado_por` obrigatório | — | `[00:05:05]` |
| RN-08 | documento informado já existe na empresa | recusa e aponta o cadastro existente | outra empresa pode ter o mesmo documento | P2 |
| RN-09 | mesmo nome e município já existem na empresa | alerta “possível duplicado” com opção de abrir o existente ou confirmar o novo | — | escopo base §4.1 |
| RN-10 | Comercial cria produtor | ele vira o responsável | Gestão/Administrador podem escolher qualquer usuário Comercial, Gestão ou Administrador da empresa | `[00:30:41]` |
| RN-11 | troca de responsável | só Gestão/Administrador; registra evento (de, para, por, quando); pergunta se as oportunidades abertas também mudam (padrão: sim) | — | escopo base §5 regra 11 |
| RN-12 | propriedade | sempre ligada a um produtor da mesma empresa | — | P2 |
| RN-13 (emenda 1) | nível de tecnologia | select opcional: baixa, média, alta, muito alta; tecnologias em texto livre | — | pedido do Diogo 13/10/2026 |
| RN-14 (emenda 1) | localização da propriedade | `link_maps` com URL do Google Maps; ficha mostra “Abrir no Google Maps ↗” clicável | — | pedido do Diogo 13/10/2026 |
| RN-15 (emenda 2) | editar/excluir propriedade | Gestão/Administrador qualquer; Comercial responsável pelo produtor; exclusão com confirmação inline | — | pedido do Diogo 13/10/2026 |

## Fluxo e regras

1. Menu “Produtores” → lista da empresa ativa com busca por nome, município ou documento.
2. “Novo produtor” → campos obrigatórios: nome, município, origem (e quem indicou, quando for indicação); os demais são opcionais.
3. Ao salvar → checagem de documento (recusa) e de nome + município (alerta).
4. Ficha do produtor → dados, origem, responsável, tecnologia e propriedades; botão “Nova propriedade” (nome, município, área, posse e link do Google Maps, opcional); cada propriedade com Editar e Excluir (com confirmação).
5. Gestão/Administrador → “Trocar responsável” na ficha.

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | indicação de cliente com quem indicou | produtor salvo na carteira de quem cadastrou | — |
| Limite | produtor sem documento | salva; checagem só por nome + município | — |
| Falha | documento repetido na empresa | recusa com a mensagem “Já cadastrado nesta empresa” | abrir o cadastro existente |
| Falha | indicação sem quem indicou | não salva; campo destacado | preencher |
| Falha | Comercial tenta editar produtor de outra carteira | recusa (tela e API) | pedir ao gestor |
| Falha | localização negada pelo celular | salva sem coordenadas | — |

## Instruções de execução para o Ethos

1. **Ler antes de alterar:** esta SPEC, a SPEC-1-001 (matriz e campos de acesso) e o schema atual do projeto no Skip.
2. **Alterar somente:** coleções `produtores`, `propriedades`, `eventos`, seus serviços e as telas de produtor.
3. **Não alterar:** coleções e regras da SPEC-1-001; não criar campo de outra empresa no produtor.
4. **Executar nesta ordem:** (a) migração das três coleções com índices e regras; (b) serviços; (c) lista e busca; (d) cadastro com validações; (e) ficha e propriedades; (f) troca de responsável com evento; (g) roteiro RED/GREEN.
5. **Parar e pedir validação quando:** a regra de acesso não conseguir impedir a edição pelo Comercial de outra carteira; surgir pedido de campo novo não listado; o cliente pedir para importar a planilha (fase 3).
6. **Estado válido ao parar:** produtores e propriedades cadastrados respeitam empresa e perfil; nada da SPEC-1-001 regrediu.

## Checklist de execução

- [x] SPEC-1-001 em GREEN (pré-condição conferida).
- [x] Coleções e índices criados por migração.
- [x] Cadastro com origem, quem indicou e relacionamento.
- [x] Recusa por documento e alerta por nome + município.
- [x] Propriedades com área, posse e localização opcional.
- [x] Troca de responsável com evento registrado.
- [x] Roteiro RED → GREEN → regressão anexado.

## Critérios de aceite

- [x] **CA-1-06:** o Comercial cadastra produtor com origem “Indicação de cliente” e quem indicou; o produtor fica com ele como responsável e aparece na busca da empresa ativa para todos os perfis.
- [x] **CA-1-07:** indicação sem quem indicou não salva; documento repetido na empresa é recusado apontando o cadastro existente; nome + município repetido mostra alerta de possível duplicado.
- [x] **CA-1-08:** a propriedade fica ligada ao produtor com município, área e posse; ligar propriedade a produtor de outra empresa é recusado pela API.
- [x] **CA-1-09:** só Gestão/Administrador trocam o responsável; a troca gera evento com de, para, por e quando; o Comercial não edita produtor de outra carteira e o Operador só consulta.

## TDD da SPEC

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | validação de indicação (CA-1-07) | criar pela API, produtor com origem `indicacao_cliente` sem `indicado_por` | antes da regra, salva (falha esperada) | resposta da API |
| RED 2 | duplicidade (CA-1-07) | criar dois produtores com o mesmo documento na Agrospy; criar o mesmo documento na Rumo Agro | antes do índice, o segundo da Agrospy salva (falha esperada); o da Rumo Agro deve salvar sempre | respostas da API |
| RED 3 | carteira (CA-1-09) | editar produtor de outro Comercial; Operador criar produtor | antes das regras, ambos passam (falha esperada) | respostas da API |
| RED 4 | propriedade de outra empresa (CA-1-08) | criar propriedade na Rumo Agro apontando para produtor da Agrospy | antes da validação, salva (falha esperada) | resposta da API |
| GREEN | menor comportamento que passa | aplicar regras, índice e validações; repetir RED 1–4; cadastrar no celular um produtor de teste com propriedade | RED 1–4 recusados (exceto o documento na Rumo Agro, aceito); produtor na carteira de quem cadastrou (CA-1-06) | respostas + prints |
| REFACTOR/REGRESSÃO | troca de responsável e regressão de acesso | trocar o responsável e conferir o evento; repetir RED da SPEC-1-001 sobre `produtores` | evento com de, para, por e quando; nenhum produtor da Agrospy visível para usuário da Rumo Agro | respostas + print da ficha |

**Dados/fixtures:** usuários de teste da SPEC-1-001; produtores de teste com documento fictício; propriedade de teste com área 120 ha.
**Caminhos de erro obrigatórios:** indicação sem quem indicou, documento repetido, edição fora da carteira, Operador criando, propriedade de outra empresa, localização negada.
**Evidência exigida:** respostas da API antes/depois, prints do cadastro, do alerta e da ficha, e o evento de troca de responsável.

## Teste humano do cliente

- **Origem:** CL-004 — o teste completo da fase está na SPEC-1-005.
- **Quem testa:** Diogo.
- **Passos:** cadastrar no celular um produtor real que veio por indicação, com a propriedade; tentar cadastrá-lo de novo.
- **Resultado esperado:** o produtor aparece na carteira de quem cadastrou e o segundo cadastro é barrado ou avisado.
- **Evidência do aceite:** mensagem do Diogo no card da tarefa — APROVADO 13/10/2026 (1º: “o teste funcionou”; 2º: “testado e aprovado. podemos continuar”).

## Handoff e operação

- **Como demonstrar:** cadastrar um produtor indicado e mostrar a busca encontrando-o em outro celular da mesma empresa.
- **Como operar depois:** cada vendedor cadastra seus produtores; o gestor resolve duplicados e troca responsáveis.
- **Como monitorar:** revisar alertas de possível duplicado na visão do gestor (SPEC-1-005).
- **Pendência conhecida:** importação da planilha e vínculo entre empresas ficam para a fase 3.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| 147a4f1b-2f57-4098-833b-ce69a962b4b6 | Criar o cadastro de produtor e propriedade com a origem da indicação | Agrospy | SPEC-1-002 | CA-1-06 a CA-1-09 | RED 1–4 → GREEN → REFACTOR/REGRESSÃO | respostas da API + prints | SPEC-1-001 em GREEN |
| 761c4105-3d3f-4bdb-9d9d-462422092837 | Cadastrar produtor com quem indicou e responsável pela carteira | Agrospy | SPEC-1-002 | CA-1-06, CA-1-09 | RED 1 e 3 → GREEN | print do cadastro + resposta da API | SPEC-1-001 em GREEN |
| eaf9ddb6-e396-4766-be07-45f78d0ec093 | Cadastrar propriedade com município, área e localização | Agrospy | SPEC-1-002 | CA-1-08 | RED 4 → GREEN | print da ficha com propriedade | produtor cadastrado |
| 9eef36f2-fb98-4daf-9164-d49e269f7aa8 | Avisar quando o produtor já estiver cadastrado | Agrospy | SPEC-1-002 | CA-1-07 | RED 2 → GREEN | print do alerta + resposta da API | produtor cadastrado |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| 13/10/2026 | Diogo (teste aprovado + pedido) | Emenda 1 — nível de tecnologia, tecnologias e localização | Ficha precisa registrar a adoção de tecnologia do produtor e localizar a propriedade. Campos: produtores.nivel_tecnologia (select: baixa/media/alta/muito_alta, opcional); produtores.tecnologias (texto livre: automações com projetos, AP já faz/já fez, implementos — piloto automático, desligamento linha a linha, taxa variável de semente/fertilizante, distribuidor de sólidos com/sem TV); propriedades.link_maps (URL do Google Maps, clicável na ficha). |
| 13/10/2026 | Diogo (teste aprovado + pedido) | Emenda 2 — editar/excluir propriedade | Propriedade lançada não podia ser corrigida nem removida. Ficha ganhou Editar (form inline) e Excluir (confirmação inline); deleteRule na migração 0016/0017. |

## Emenda 1 — tecnologia e localização (13/10/2026)

- **Nível de tecnologia** (produtor): baixa, média, alta, muito alta — opcional, default "não informado".
- **Tecnologias** (produtor): texto livre para descrever automações com projetos, agricultura de precisão (já faz/já fez) e implementos (piloto automático, plantadeira com desligamento linha a linha e taxa variável, distribuidor de sólidos com/sem taxa variável).
- **Localização** (propriedade): campo link_maps — cole o link do Google Maps; a ficha mostra "Abrir no Google Maps ↗" clicável (abre em nova aba).
- Migração 0015; publicado em v0.0.34–v0.0.37.

## Emenda 2 — editar/excluir propriedade (13/10/2026)

- **Editar:** form inline no card da propriedade (nome, município, área, posse, link do Maps).
- **Excluir:** confirmação inline na tela (sem popup), com mensagem do que aconteceu.
- **Permissão:** Gestão/Administrador qualquer propriedade; Comercial as do produtor responsável.
- Migrações 0016/0017; publicado em v0.0.38–v0.0.43.
