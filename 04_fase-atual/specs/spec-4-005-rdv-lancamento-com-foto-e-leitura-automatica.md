# SPEC-4-005 — RDV: lançamento da despesa com foto, leitura automática e assistente

**Fase:** 4
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** RQ-006; Fase 4, "RDV com foto, autoria, contexto mínimo"; emenda P13 de 23/11/2026 (RDV completo: leitura automática, categoria sugerida, empresa pelo CNPJ da nota, motivo, km, reembolso × cartão da empresa, comprovante Pix, obrigatórios valor/data/empresa, só Administrador sem nota, canhoto provisório ligado à nota, fornecedor salvo, assistente flutuante com foto e áudio)
**Degrau da solução:** reuso + dependência existente + nativo:
- **Reuso:** fila sem internet e gravação de áudio do app (fases 1 e 2); fornecedores da SPEC-4-002; empresas do lançamento da SPEC-4-001;
- **Dependência existente:** a conta do Groq já usada na transcrição (`TRANSCRICAO_API_KEY` no cofre) para transcrever o áudio (`whisper-large-v3`) e ler a foto da nota com o modelo de visão `meta-llama/llama-4-scout-17b-16e-instruct`;
- **Nativo:** `$documents.toMarkdown` + `$ai.chat('fast')` para PDF com texto e para sugerir a categoria.

## Contexto e decisões fechadas

- **Estado atual:** o RDV é montado à mão, com fotos soltas no celular.
- **Estado desejado:** qualquer funcionário fotografa a nota (ou anexa o PDF) e o app preenche data, fornecedor, valor e forma de pagamento e sugere a categoria. A pessoa completa empresa, motivo, km e se é reembolso ou cartão da empresa, e salva. Também dá para lançar falando com o assistente flutuante (foto + áudio).
- **Decisões já fechadas:**
  - **Obrigatórios:** valor, data e empresa do lançamento. Sem eles, nem a tela nem o assistente salvam (o assistente pergunta o que falta e recusa salvar).
  - **Sem comprovante:** só o perfil Administrador lança despesa sem nota (`tipo_comprovante = sem_comprovante`), com justificativa.
  - **Comprovante Pix:** aceito; exige a descrição de quem recebeu (`pix_recebedor`).
  - **Canhoto provisório:** a despesa pode ser salva com o canhoto (`canhoto_provisorio`) e fica com "nota pendente". Quando a nota chega, "Anexar nota" acrescenta na **mesma despesa** (não cria outra); o canhoto continua no histórico.
  - **Empresa pelo CNPJ da nota:** se a leitura achar um CNPJ de destinatário igual ao de uma empresa do lançamento ativa do tenant, ela vem escolhida; senão, a pessoa escolhe.
  - **Categorias padrão (editáveis pelo Administrador):** Combustível, Alimentação, Hospedagem, Pedágio, Estacionamento, Manutenção do veículo, Material e insumos, Transporte (táxi/aplicativo/passagem), Outros.
  - **Motivo:** Interno, Viagem, Visita, Cliente ligado (com produtor escolhido). Visita e Cliente ligado permitem ligar o produtor.
  - **Custeio:** Reembolso (pago pela pessoa) ou Cartão da empresa.
  - **Fornecedor salvo:** ao salvar com CNPJ/CPF do emitente novo, o fornecedor é criado em `fornecedores` com `uso = rdv` para reutilizar (busca por nome ou documento).
  - **A leitura automática é sugestão.** Nada é salvo sem a pessoa tocar "Salvar". A foto vai para o Groq só para leitura (a conta é a mesma da transcrição da fase 2).
  - **Sem internet:** a despesa (com foto) entra na fila do aparelho e sobe ao voltar; a leitura automática acontece depois de subir, e a despesa fica "Leitura pendente" até a pessoa conferir.
- **Bloqueios:** nenhum. Se o modelo de visão do Groq não estiver disponível na conta, a leitura de foto fica desligada (plano B) e a pessoa digita.

## Resultado observável

1. O Alisson almoça na estrada, abre "Minhas despesas" e toca na câmera. Em segundos, o app mostra: 24/11, Restaurante Boa Vista, R$ 58,90, cartão de débito, categoria Alimentação sugerida, empresa AgroSpy (pelo CNPJ da nota). Ele escolhe "Visita", o produtor, "Reembolso", e salva.
2. No posto, só tem o canhoto. Ele salva com "Canhoto provisório"; na semana seguinte, anexa a nota na mesma despesa e o selo "nota pendente" some.
3. Ele toca no botão flutuante do assistente, tira a foto do pedágio e fala "pedágio indo pra fazenda do Seu João, cartão da empresa". O assistente mostra o rascunho e salva quando ele confirma. Se ele não disser a empresa e a nota não tiver CNPJ, o assistente pergunta antes.
4. Um Comercial tenta salvar sem foto: o app recusa com "Só o Administrador lança despesa sem comprovante".

## Limites e dependências

- **Inclui:** coleções `despesas_rdv` e `categorias_rdv`; rotas de ler comprovante, salvar, anexar nota, editar e excluir (antes do fechamento); assistente de despesa (rota e botão flutuante); tela "Minhas despesas"; reaproveitamento de fornecedores.
- **Fora de escopo:** fechamento mensal, PDF, planilha, painel e envio à contabilidade (SPEC-4-006); pagamento do reembolso (vira conta a pagar na SPEC-4-006); cálculo de imposto; validação da nota na SEFAZ; lançamento pelo bot do Maestro (SPEC-4-009).
- **Entradas e pré-condições:** SPEC-4-001 e SPEC-4-002 (fornecedores) no ar.
- **Saídas/artefatos:** migrações, hooks, rotas, telas; fixtures de notas fictícias; evidências em `05_entregas/fase-4/spec-4-005/`.
- **Dependências e responsáveis:** a Agrospy executa com o Maestro. Nada depende do Diogo.
- **Atores e permissões mínimas:**

  | Ação | Administrador | Gestão | Administrativo | Comercial | Operador |
  |---|---|---|---|---|---|
  | Lançar a própria despesa | sim | sim | sim | sim | sim |
  | Lançar em nome de outro funcionário | sim | não | sim | não | não |
  | Lançar sem comprovante | sim | não | não | não | não |
  | Ver despesas | todas do tenant | todas | todas | só as próprias | só as próprias |
  | Editar/excluir antes do fechamento | todas | não | todas | só as próprias | só as próprias |
  | Editar categorias | sim | não | não | não | não |

- **Superfícies/arquivos/configurações afetadas:** migrações de `despesas_rdv` e `categorias_rdv` e do campo `assistente_rdv_ativo` (bool, padrão true) em `config_financeiro`; `pocketbase/hooks/rdv_rotas.js`, `rdv_assistente.js`, `lib/rdv.js`, `lib/leitura_comprovante.js`; `src/pages/despesas/MinhasDespesas.tsx`, `LancarDespesa.tsx`, `CategoriasRdv.tsx`; `src/components/app/AssistenteFlutuante.tsx`; `src/services/rdv.ts`; a fila offline existente (`fila-offline.ts`, só para o novo tipo de registro); `navegacao.ts`; `vitrine.ts`.
- **Risco e plano B:**
  - **Visão do Groq indisponível ou com erro:** a despesa salva sem leitura, com campos digitados; registro no changelog.
  - **Foto grande:** o app reduz para no máximo 1600 px no lado maior e JPEG 80% antes de enviar (limite do Groq de 4 MB em base64).
  - **HEIC do iPhone:** a câmera do navegador entrega JPEG; arquivo HEIC escolhido da galeria é recusado com "Envie como JPG ou PDF".
- **Rollback ou reversão:** migrações reversíveis; desligar o botão do assistente por configuração (`config_financeiro` ganha `assistente_rdv_ativo`, padrão true).

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| Groq `POST https://api.groq.com/openai/v1/chat/completions` (visão) | foto da despesa | modelo `meta-llama/llama-4-scout-17b-16e-instruct`; mensagem com a imagem em base64 e pedido de JSON `{data, emitente_nome, emitente_documento, destinatario_documento, valor_total, forma_pagamento, tipo_documento, itens_resumo}`; `response_format: json_object` | `TRANSCRICAO_API_KEY` | timeout 30 s; 1 tentativa; a leitura é guardada em `leitura` e não se repete para o mesmo arquivo | erro → `leitura.status = 'falhou'` e a pessoa digita |
| Groq transcrição | áudio do assistente | `whisper-large-v3`, como na fase 2 | idem | idem fase 2 | erro → pede para digitar |
| `$documents.toMarkdown` + `$ai.chat('fast')` | PDF com texto | mesmo JSON | hook | 1 chamada | 422 → digitar |

| Coleção | Campos (tipo) | Regras de API |
|---|---|---|
| `categorias_rdv` | `empresa`, `nome` (2–60), `ordem`, `ativo` | list/view: `acesso_empresas` · create/update: `acesso_admin` · delete: null |
| `despesas_rdv` | `empresa` (tenant, req), `funcionario` (rel users, req), `lancado_por` (rel users), `empresa_lancamento` (req), `data` (req, ≤ hoje), `valor_centavos` (inteiro > 0, req), `fornecedor` (rel, opcional), `fornecedor_nome` (≤ 200), `fornecedor_documento` (≤ 14 dígitos), `forma_pagamento` (`pix` \| `debito` \| `credito` \| `dinheiro` \| `outro`), `custeio` (`reembolso` \| `cartao_empresa`, req), `categoria` (rel `categorias_rdv`, req), `motivo` (`interno` \| `viagem` \| `visita` \| `cliente`, req), `produtor` (rel, opcional; do mesmo tenant), `km_rodado` (número 0–5000, opcional), `descricao` (≤ 500), `tipo_comprovante` (`nota_fiscal` \| `cupom` \| `canhoto_provisorio` \| `comprovante_pix` \| `sem_comprovante`, req), `comprovantes` (arquivo múltiplo, até 4, jpg/png/webp/pdf ≤ 10 MB cada, protegido), `nota_pendente` (bool), `pix_recebedor` (≤ 200), `justificativa_sem_nota` (≤ 500), `leitura` (JSON: `{status, sugestao, confianca, modelo}`), `origem` (`app` \| `assistente` \| `mcp`), `status` (`lancada` \| `fechada`; o vínculo `fechamento` é acrescentado pela SPEC-4-006), `id_local` (≤ 64, único por funcionário), `chave_dedup` (≤ 120), `historico` (JSON append-only: `{em, por, acao}`), `created`/`updated` | list/view: `funcionario = @request.auth.id \|\| @request.auth.acesso_financeiro.id ?= empresa` · create/update/delete: null (só rotas) |

| Rota | Quem | Entrada | Efeito | Erros |
|---|---|---|---|---|
| `POST /backend/v1/rdv/ler` | quem tem vínculo ativo | arquivo (multipart) | devolve a sugestão (não grava despesa) | 400 tipo/tamanho; 503 leitura indisponível (a tela segue sem sugestão) |
| `POST /backend/v1/rdv/despesas` | idem | campos + `comprovantes` + `id_local` + `leitura?` | cria `lancada`; cria fornecedor `rdv` se documento novo | 400 regra (RN-140 a RN-145); 200 com o mesmo registro se `id_local` repetido |
| `POST /backend/v1/rdv/despesas/{id}/nota` | dono, Administrador ou Administrativo | arquivo da nota + campos corrigidos | acrescenta a nota, `nota_pendente = false`, `tipo_comprovante = nota_fiscal`, histórico | 409 se `fechada` |
| `PATCH /backend/v1/rdv/despesas/{id}` e `DELETE` | idem tabela de permissões | campos | edita/exclui com histórico | 409 se `fechada` |
| `POST /backend/v1/rdv/assistente` | quem tem vínculo ativo | `{texto?, audio?, foto?, conversa_id?}` | devolve `{rascunho, faltando: [...], pergunta?}`; só grava quando recebe `{confirmar: true}` com rascunho completo | 400 com a lista do que falta |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-140 | salvar | exige `valor_centavos`, `data` e `empresa_lancamento` ativa do tenant; sem um deles → 400 "Falta: valor, data, empresa" | — | P13 |
| RN-141 | `sem_comprovante` | só perfil Administrador, com `justificativa_sem_nota` (5–500) | — | P13 |
| RN-142 | `comprovante_pix` | exige `pix_recebedor` | — | P13 |
| RN-143 | `canhoto_provisorio` | `nota_pendente = true`; a nota depois entra pela rota `/nota` na mesma despesa | — | P13 |
| RN-144 | possível duplicidade | `chave_dedup` = funcionário + data + valor + documento do emitente; já existe → a tela pergunta "Já existe uma despesa igual em {data}. Salvar mesmo assim?"; a API exige `confirmar_duplicada: true` | canhoto + nota da mesma despesa nunca é duplicidade (vai pela rota `/nota`) | P13 |
| RN-145 | empresa sugerida | `destinatario_documento` lido = CNPJ de uma empresa do lançamento ativa do tenant → pré-escolhida | documento de outro tenant é ignorado | P13 |
| RN-146 | categoria sugerida | `$ai.chat('fast')` escolhe uma das categorias ativas a partir do emitente e itens; saída fora da lista → "Outros" | — | P13 |
| RN-147 | lançar em nome de outro | só Administrador e Administrativo; `funcionario` com vínculo ativo no tenant; `lancado_por` = quem lançou | — | P13 |
| RN-148 | assistente | o texto, a transcrição e a leitura entram no modelo como dado delimitado; o assistente monta o rascunho, pergunta o que falta (RN-140) e só grava com `confirmar: true`; nunca grava sem a confirmação da pessoa | — | P13; padrão do assistente da fase 2 |
| RN-149 | despesa `fechada` | não edita, não exclui, não recebe nota | reabertura é da SPEC-4-006 | P13 |

## Fluxo e regras

1. **Minhas despesas** (`/despesas`): mês atual, total, reembolso × cartão, selos "nota pendente" e "leitura pendente"; botão de câmera e "Lançar".
2. **Lançar despesa** (folha): foto/PDF → "Lendo a nota…" → campos preenchidos com a sugestão marcada → a pessoa completa empresa, categoria, motivo, produtor, km, custeio, comprovante → "Salvar".
3. **Assistente flutuante:** botão redondo em todas as telas do app (menos login e vitrine). Abre uma folha com câmera, microfone e texto. Mostra o rascunho como cartão e "Salvar despesa".
4. **Anexar nota:** na despesa com "nota pendente", botão "Anexar nota".
5. **Categorias** (`/financeiro/categorias-rdv`, Administrador).

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | foto de cupom fiscal com CNPJ da AgroSpy | campos sugeridos; empresa AgroSpy | — |
| Principal | assistente com foto + áudio completo | rascunho; grava ao confirmar | — |
| Limite | canhoto e depois nota | uma despesa só, com os dois arquivos no histórico | — |
| Limite | sem internet | entra na fila; sobe uma vez; "leitura pendente" | — |
| Falha | Comercial sem comprovante | 400 RN-141 | anexar |
| Falha | assistente sem empresa e nota sem CNPJ | pergunta "Para qual empresa?"; não grava | responder |
| Falha | Groq fora | salva sem sugestão | digitar |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; SPECs 4-001 e 4-002; `rascunhos_processar.js` (chamada ao Groq e chave); `assistente_perguntar.js` (padrão de dado delimitado); `fila-offline.ts` e `audio-offline.ts`; `00-INDICE.md` (regras comuns).
2. **Contexto técnico do Skip:** o da SPEC-4-001; chave do Groq por `$secrets.get('TRANSCRICAO_API_KEY')`; o log nunca registra valor, emitente ou texto falado.
3. **Alterar somente:** as superfícies listadas.
4. **Não alterar:** o processamento de rascunhos de visita; o assistente de campo da fase 2 (o botão flutuante é outro componente).
5. **Executar nesta ordem:** (1) coleções, categorias e rota de salvar com RN-140 a RN-147; (2) leitura da foto e do PDF; (3) canhoto e nota; (4) fila sem internet; (5) assistente flutuante; (6) provas visuais.
6. **Parar e pedir validação quando:** nenhuma parada prevista.
7. **Estado válido ao parar:** o app comercial funciona; despesas salvas continuam íntegras.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

Sistema da SPEC-3-002. `CartaoDestaque` com o total do mês; `ListaItem` com ícone da categoria em círculo, fornecedor, valor e selos; campos sugeridos com borda de destaque e o texto "sugerido pela leitura"; assistente flutuante como botão de 56 px acima da barra de abas, respeitando a área segura; folhas para lançar, anexar nota e assistente; estados carregando ("Lendo a nota…"), vazio, erro e sem internet (aviso "Será enviada quando voltar a internet"). Vitrine com uma despesa de cada tipo de comprovante.

## Checklist de execução

- [ ] Coleções, categorias padrão e RN-140 a RN-149.
- [ ] Leitura de foto (Groq visão) e de PDF, com plano B.
- [ ] Canhoto → nota na mesma despesa.
- [ ] Fila sem internet sem duplicar.
- [ ] Assistente flutuante com foto, áudio e texto.
- [ ] Capturas, axe-core e evidências em `05_entregas/fase-4/spec-4-005/`.

## Critérios de aceite

- [ ] **CA-4-15:** salvar sem valor, data ou empresa dá 400 com a lista do que falta; Comercial sem comprovante dá 400 e Administrador com justificativa salva; Pix sem recebedor dá 400; Comercial lista só as próprias despesas e Administrativo lista todas do tenant; outro tenant lista 0.
- [ ] **CA-4-16:** nas 5 notas fictícias da fixture, a leitura acerta valor e data em pelo menos 4, sugere uma categoria da lista em todas e pré-escolhe a empresa quando o CNPJ do destinatário é de uma empresa do lançamento; com o Groq desligado, a despesa salva sem sugestão.
- [ ] **CA-4-17:** canhoto salvo e nota anexada depois resultam em 1 despesa com 2 arquivos, `nota_pendente = false` e histórico com as duas ações; despesa igual pede confirmação; o fornecedor novo é criado uma vez e aparece na busca da próxima despesa.
- [ ] **CA-4-18:** pelo assistente, foto + áudio com tudo gera rascunho e grava só com confirmação; sem empresa (e nota sem CNPJ), devolve `faltando: ['empresa']` e não grava; uma despesa criada sem internet sobe exatamente uma vez.

## TDD da SPEC

**Empresas nas provas:** Teste A (empresas do lançamento "TESTE — Spy" e "TESTE — Smart") e Teste B. **Fixtures** em `05_entregas/fase-4/fixtures/rdv/`, geradas pelo executor (imagens sintéticas de cupom e nota com dados fictícios, CNPJ do destinatário = CNPJ fictício da "TESTE — Spy" em 3 delas), um canhoto, um comprovante Pix fictício, um PDF de nota com texto e um áudio de teste gerado por síntese de voz com a frase do resultado observável 3.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | obrigatórios (CA-4-15) | salvar sem empresa antes de RN-140 | aceito (falha esperada); depois, 400 | resposta |
| GREEN 1 | regras e acesso (CA-4-15) | casos sem valor/data/empresa; sem comprovante como `teste.comercial1` e `teste.admin.a`; Pix sem recebedor; listar como `teste.comercial1`, `teste.administrativo`, `teste.rumo` | 400 ×3; 400 e 200; 400; só próprias; todas; 0 | respostas |
| GREEN 2 | leitura (CA-4-16) | `/rdv/ler` nas 5 imagens e no PDF; repetir com a chave do Groq inválida (rota de teste) | ≥ 4/5 com valor e data; categorias da lista; empresa pré-escolhida nas 3; sem chave → 503 e salvar funciona | tabela lido × esperado |
| GREEN 3 | canhoto e duplicidade (CA-4-17) | salvar canhoto; anexar nota; salvar despesa igual sem e com confirmação; salvar 2 despesas do mesmo emitente novo | 1 despesa, 2 arquivos; 400 e 200; 1 fornecedor | consultas |
| GREEN 4 | assistente e offline (CA-4-18) | assistente com foto + áudio + confirmar; assistente sem empresa; navegador automatizado offline salva despesa com foto, volta online, força reenvio | grava 1; `faltando: ['empresa']` sem gravar; 1 registro só | respostas + capturas |
| REFACTOR/REGRESSÃO | regressão e visual | (a) fila offline de visita da fase 1 e áudio da fase 2; (b) capturas 390×844 e 1280×800, rolagem 0, axe-core; (c) botão flutuante não cobre a barra de abas nem o botão "+" | sem diferença; sem falha séria | relatório |

**Caminhos de erro obrigatórios:** faltando obrigatório, sem comprovante, Pix sem recebedor, duplicidade, HEIC, arquivo grande, Groq fora, sem internet, outro tenant, despesa fechada.
**Evidência exigida:** em `05_entregas/fase-4/spec-4-005/`, mais o log do Skip; fixtures removidas no fim.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-4/spec-4-005/` e o log do Skip. As categorias padrão valem até o Administrador mudar.

## Handoff e operação

- **Como demonstrar:** foto de um cupom; canhoto e nota; assistente com foto e áudio.
- **Como operar depois:** cada funcionário lança no dia; o Administrativo acompanha "nota pendente".
- **Como monitorar:** taxa de leitura com falha; despesas com nota pendente há mais de 15 dias.
- **Pendência conhecida:** nenhuma.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Lançar as despesas de viagem (RDV) com foto | Agrospy | SPEC-4-005 | CA-4-15 a CA-4-18 | todas as subtasks | evidências das subtasks | SPECs 4-001 e 4-002 no ar |
| id pendente | Lançar a despesa com foto ou PDF e os campos obrigatórios | Agrospy | SPEC-4-005 | CA-4-15 | RED 1 → GREEN 1 | respostas | SPEC-4-001 |
| id pendente | Ler a nota automaticamente e sugerir a categoria | Agrospy | SPEC-4-005 | CA-4-16 | GREEN 2 | tabela lido × esperado | lançamento |
| id pendente | Ligar o canhoto provisório à nota que chega depois | Agrospy | SPEC-4-005 | CA-4-17 | GREEN 3 | consultas | lançamento |
| id pendente | Lançar a despesa pelo assistente com foto e áudio | Agrospy | SPEC-4-005 | CA-4-18 | GREEN 4 + REFACTOR (a)(b)(c) | respostas + capturas | leitura |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
