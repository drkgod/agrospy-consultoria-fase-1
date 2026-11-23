# SPEC-4-006 — Fechamento mensal do RDV, painel do gestor e envio à contabilidade

**Fase:** 4
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** RQ-006; Fase 4, "fechamento mensal por usuário"; critério global "um comprovante de despesa fica associado ao usuário e aparece na consolidação mensal"; emenda P13 de 23/11/2026 (PDF e planilha por funcionário; painel por mês, pessoa e categoria; envio automático à contabilidade com e-mail por empresa)
**Degrau da solução:** construção mínima + dependência nova pequena:
- **Construção:** coleção de fechamentos, rotas de fechar e reabrir, painel calculado no servidor;
- **Dependências:** `pdfmake` (já adicionada na SPEC-4-002) e `write-excel-file` 2.x para gerar PDF e planilha no navegador de quem fecha; envio pela `lib/email.js` da SPEC-4-001.

## Contexto e decisões fechadas

- **Estado atual:** as despesas ficam lançadas (SPEC-4-005), mas não há fechamento, relatório nem envio.
- **Estado desejado:** no começo do mês, quem cuida do financeiro abre "Despesas da equipe", confere o mês anterior por pessoa e toca "Fechar mês". O app gera, para cada funcionário e empresa do lançamento, um PDF (lista com as fotos, totais por categoria, a reembolsar e no cartão) e uma planilha. As despesas ficam travadas, o reembolso vira conta a pagar e o sistema manda os arquivos ao e-mail da contabilidade de cada empresa.
- **Decisões já fechadas:**
  - **Unidade do fechamento:** funcionário × mês × empresa do lançamento. O PDF por funcionário junta as empresas dele, com subtotal por empresa; o e-mail de cada empresa leva só a parte dela.
  - **Quem fecha e reabre:** fecha Administrador, Gestão ou Administrativo; reabre só Administrador, com motivo (fica no histórico; a auditoria completa é da fase 5).
  - **Envio automático:** acontece logo depois do fechamento, um e-mail por empresa do lançamento, para `empresas_lancamento.email_contabilidade`, com os PDFs e as planilhas daquela empresa e uma planilha consolidada. Rumo Agro: e-mail do administrativo da contabilidade; AgroSpy (e AgroSmart): e-mail do financeiro da contabilidade — os endereços são informados pelo Diogo (CL-PEND-012). Sem e-mail cadastrado, o fechamento acontece e o envio fica "aguardando e-mail da contabilidade", com aviso único ao Administrador.
  - **Reembolso:** cada fechamento com total de reembolso > 0 cria uma `contas_pagar` (SPEC-4-002) `lancada`, origem `rdv`, `beneficiario_usuario` = funcionário, vencimento = 10º dia do mês seguinte ao fechamento, para aprovação dos sócios como qualquer conta. Despesa no cartão da empresa não vira conta a pagar (a fatura do cartão já entra como boleto).
  - **Lembrete:** no dia 3 de cada mês às 8h, se houver despesa `lancada` do mês anterior sem fechamento, aviso a Administrador, Gestão e Administrativo.
  - **Arquivos gerados no navegador:** o PDF e a planilha são gerados por quem toca "Fechar mês" e enviados ao servidor junto com o pedido; o servidor confere os totais antes de aceitar.
- **Bloqueios:** nenhum para construir; envio real depende de CL-PEND-012 e CL-PEND-018.

## Resultado observável

1. Dia 3, a funcionária do administrativo recebe "Feche as despesas de outubro". Abre "Despesas da equipe", outubro, e vê por pessoa: total, reembolso, cartão e notas pendentes.
2. Ela toca "Fechar outubro". O app gera os PDFs e as planilhas, mostra "6 funcionários, 2 empresas, R$ 4.812,30" e confirma.
3. A contabilidade recebe dois e-mails: um da AgroSpy e outro da AgroSmart, cada um com os PDFs e as planilhas da sua empresa.
4. Em "Contas a pagar → Aguardando aprovação" aparecem os reembolsos de cada funcionário para os sócios aprovarem.
5. O Diogo abre o painel, filtra novembro, Alimentação, e vê o total por pessoa e por empresa.

## Limites e dependências

- **Inclui:** coleção `fechamentos_rdv`; rotas de prévia, fechar, reabrir e reenviar; geração de PDF e planilha; envio por e-mail; criação do reembolso como conta a pagar; painel "Despesas da equipe"; rotina de lembrete e de nova tentativa de envio.
- **Fora de escopo:** pagamento do reembolso (fluxo da SPEC-4-002); integração com sistema da contabilidade; imposto; adiantamento de viagem.
- **Entradas e pré-condições:** SPECs 4-001, 4-002 e 4-005 no ar.
- **Saídas/artefatos:** migração, hooks, rotas, telas; evidências em `05_entregas/fase-4/spec-4-006/`.
- **Dependências e responsáveis:** a Agrospy executa; o Diogo informa os e-mails da contabilidade por empresa (CL-PEND-012).
- **Atores e permissões mínimas:** ver painel, fechar e reenviar: Administrador, Gestão, Administrativo; reabrir: Administrador; Comercial e Operador veem o próprio fechamento (PDF) em "Minhas despesas".
- **Superfícies/arquivos/configurações afetadas:** migração `fechamentos_rdv` e do campo `fechamento` (rel `fechamentos_rdv`) em `despesas_rdv`; `pocketbase/hooks/rdv_fechamento_rotas.js`, `rdv_fechamento_rotina.js`, `lib/rdv_fechamento.js`; `src/pages/financeiro/DespesasEquipe.tsx`, `src/lib/gerar-pdf-rdv.ts`, `src/lib/gerar-planilha-rdv.ts`; `src/pages/despesas/MinhasDespesas.tsx` (link do PDF); `package.json` (`write-excel-file`); `navegacao.ts`; `vitrine.ts`.
- **Risco e plano B:**
  - **E-mail grande:** acima de 20 MB de anexos, o envio é dividido em partes "(1/2)", "(2/2)"; as fotos no PDF são reduzidas a 1200 px.
  - **`write-excel-file` não instala:** a planilha sai em CSV (`;`, UTF-8 com BOM) e isso vai ao changelog.
- **Rollback ou reversão:** reabrir (Administrador) volta as despesas a `lancada`, cancela a conta a pagar do reembolso se ainda não aprovada (se já aprovada, a reabertura é recusada com "Reembolso já aprovado: cancele antes em Contas a pagar") e marca o envio anterior como "substituído".

## Dados e integrações

| Coleção | Campos (tipo) | Regras de API |
|---|---|---|
| `fechamentos_rdv` | `empresa`, `funcionario` (rel), `mes` (texto `AAAA-MM`), `empresa_lancamento` (rel), `qtd_despesas`, `total_centavos`, `reembolso_centavos`, `cartao_centavos`, `por_categoria` (JSON `{categoria: centavos}`), `pdf` (arquivo ≤ 30 MB, protegido), `planilha` (arquivo ≤ 5 MB, protegido), `status` (`fechado` \| `reaberto`), `fechado_por`, `fechado_em`, `reaberto_por`, `reaberto_em`, `motivo_reabertura`, `conta_reembolso` (rel `contas_pagar`), `envio` (JSON `{status: 'enviado'\|'aguardando_email'\|'falhou'\|'substituido', envios_email: [ids], em}`); índice único (`funcionario`, `mes`, `empresa_lancamento`, status `fechado`) | list/view: `funcionario = @request.auth.id \|\| @request.auth.acesso_financeiro.id ?= empresa` · create/update/delete: null |

| Rota | Quem | Entrada | Efeito | Erros |
|---|---|---|---|---|
| `GET /backend/v1/rdv/painel?empresa&mes&funcionario?&categoria?&empresa_lancamento?` | financeiro | filtros | totais por pessoa, categoria e empresa do lançamento, com quantidade, reembolso, cartão e notas pendentes | 403 |
| `GET /backend/v1/rdv/fechamento/previa?empresa&mes` | financeiro | — | grupos funcionário × empresa do lançamento com as despesas `lancada` do mês e os totais | 400 mês atual ou futuro |
| `POST /backend/v1/rdv/fechamento` | financeiro | `{empresa, mes, grupos: [{funcionario, empresa_lancamento, total_centavos, reembolso_centavos, cartao_centavos}]}` + arquivos `pdf_{i}` e `planilha_{i}` | numa transação: confere os totais com a base (RN-151), cria os fechamentos, marca as despesas `fechada`, cria as contas de reembolso; depois da transação, dispara os envios | 409 totais divergentes (a base mudou); 400 arquivo ausente |
| `POST /backend/v1/rdv/fechamento/{id}/reabrir` | Administrador | `{motivo}` | RN-153 | 403; 409 reembolso aprovado |
| `POST /backend/v1/rdv/fechamento/reenviar` | financeiro | `{empresa, mes, empresa_lancamento}` | envia de novo os arquivos | 409 sem e-mail cadastrado |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-150 | fechar | só meses anteriores ao atual; inclui só despesas `lancada` do mês; despesa com "nota pendente" entra, marcada no PDF | — | P13 |
| RN-151 | conferência | os totais enviados pelo navegador precisam bater com a soma no servidor (centavos exatos) | — | P13 |
| RN-152 | reembolso | cria `contas_pagar` `lancada`, origem `rdv`, `beneficiario_usuario`, valor = `reembolso_centavos`, vencimento = dia 10 do mês seguinte ao fechamento, `empresa_lancamento` do fechamento, descrição "Reembolso RDV {mês} — {nome}" | reembolso 0 → nada | P13 |
| RN-153 | reabrir | volta as despesas a `lancada`, cancela a conta de reembolso não aprovada, marca o envio como `substituido` e grava o motivo | reembolso aprovado ou pago → 409 | P13 |
| RN-154 | envio | um e-mail por empresa do lançamento com e-mail cadastrado; assunto "RDV {mês/ano} — {empresa}"; corpo com a lista de funcionários e totais; anexos: PDFs e planilhas da empresa + `consolidado-{mês}.xlsx`; `chave_unica` = empresa_lancamento + mês + versão | sem e-mail → `aguardando_email` e aviso único ao Administrador | P13 |
| RN-155 | lembrete | dia 3, 8h, se houver `lancada` do mês anterior | — | P13 |
| RN-156 | PDF por funcionário | cabeçalho (empresa, funcionário, mês), tabela das despesas (data, fornecedor, categoria, motivo, produtor, km, custeio, valor), totais por categoria e por empresa, total a reembolsar, total no cartão e, depois, uma página com as fotos/PDFs de cada despesa na ordem da tabela | — | P13 |

## Fluxo e regras

1. **Despesas da equipe** (`/financeiro/rdv`): seletor de mês; abas "Por pessoa", "Por categoria", "Por empresa"; cada linha abre as despesas; botão "Fechar {mês}" (desabilitado no mês atual).
2. **Fechar:** prévia → o navegador gera os arquivos (barra de progresso por funcionário) → envia → resultado com o status do envio por empresa e os reembolsos criados.
3. **Minhas despesas:** mês fechado mostra "Fechado em {data}" e o PDF.
4. **Rotinas:** lembrete RN-155; nova tentativa de envio `falhou` a cada hora até 3 vezes (pela `lib/email.js`).

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | 3 funcionários, 2 empresas | 4 fechamentos (funcionário × empresa), 2 e-mails, reembolsos criados | — |
| Limite | despesa lançada durante o fechamento | 409; nova prévia | refazer |
| Limite | empresa sem e-mail | fecha; envio `aguardando_email` | cadastrar e reenviar |
| Falha | reabrir com reembolso aprovado | 409 | cancelar antes |
| Falha | Comercial abre o painel | 403 | — |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; SPECs 4-001, 4-002 e 4-005; `00-INDICE.md` (regras comuns).
2. **Contexto técnico do Skip:** o da SPEC-4-001; anexos de e-mail pelo cliente de e-mail do Skip a partir dos arquivos do registro; o envio roda fora da transação.
3. **Alterar somente:** as superfícies listadas e, em `lib/pagar.js`, só o uso da função de criar conta (sem mudar regras).
4. **Não alterar:** regras de `despesas_rdv` além do status e do vínculo `fechamento`.
5. **Executar nesta ordem:** (1) painel; (2) prévia; (3) geração do PDF e da planilha; (4) fechar com conferência e reembolso; (5) envio; (6) reabrir e reenviar; (7) lembrete e provas visuais.
6. **Parar e pedir validação quando:** nenhuma parada prevista. O primeiro e-mail real à contabilidade sai só quando o Administrador cadastrar o endereço, que é a autorização.
7. **Estado válido ao parar:** despesas continuam lançáveis; nenhum mês fechado pela metade (a transação garante).
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

Sistema da SPEC-3-002. `CartaoNumero` com total, reembolso e cartão do mês; gráfico de barras simples por categoria com as cores pelos tokens; `FiltroPilulas` das abas; tabela por pessoa com `ListaItem`; confirmação do fechamento em `Folha` com a prévia; progresso da geração; estados carregando, vazio ("Nenhuma despesa em outubro"), erro e sem internet (fechar exige internet). O PDF usa a cor da empresa ativa só no cabeçalho.

## Checklist de execução

- [ ] Painel com filtros, batendo com a base.
- [ ] PDF e planilha por funcionário × empresa.
- [ ] Fechar com conferência, trava e reembolso.
- [ ] Envio por empresa, com divisão acima de 20 MB e aguardando e-mail.
- [ ] Reabrir e reenviar.
- [ ] Lembrete; capturas; axe-core; evidências em `05_entregas/fase-4/spec-4-006/`.

## Critérios de aceite

- [ ] **CA-4-19:** o painel de um mês da fixture mostra totais por pessoa, categoria e empresa iguais à soma direta na base, para Administrador, Gestão e Administrativo; Comercial recebe 403.
- [ ] **CA-4-20:** fechar outubro da fixture cria exatamente 1 fechamento por funcionário × empresa, com PDF (tabela, totais e uma imagem por despesa) e planilha com as mesmas linhas; as despesas ficam `fechada` e não aceitam edição (409); total divergente dá 409 sem fechar nada.
- [ ] **CA-4-21:** cada fechamento com reembolso cria 1 conta a pagar `lancada` origem `rdv` com o valor e o vencimento da RN-152; despesas no cartão não criam conta.
- [ ] **CA-4-22:** o envio gera 1 e-mail por empresa do lançamento com e-mail cadastrado, com os anexos daquela empresa (registro em `envios_email`), e `aguardando_email` na empresa sem e-mail; reabrir com reembolso não aprovado devolve as despesas, cancela a conta e marca o envio como substituído.

## TDD da SPEC

**Empresas nas provas:** Teste A ("TESTE — Spy" com e-mail de contabilidade de teste do executor; "TESTE — Smart" sem e-mail). **Fixture:** migração de teste com 3 funcionários do elenco (`teste.comercial1` e `teste.comercial2` com despesas nas duas empresas do lançamento; `teste.administrativo` só na "TESTE — Spy"), 18 despesas de outubro em categorias variadas, 6 no cartão, 2 com nota pendente, cada uma com uma imagem sintética. **Relógio de teste** para o lembrete.

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | trava (CA-4-20) | editar uma despesa de outubro antes do fechamento existir | 200 (esperado); depois do fechamento, 409 | respostas |
| GREEN 1 | painel (CA-4-19) | `GET /rdv/painel` com cada filtro; consulta SQL de conferência; como `teste.comercial1` | iguais; 403 | respostas + consulta |
| GREEN 2 | fechar (CA-4-20) | navegador automatizado fecha outubro; abrir um PDF e a planilha; repetir com total alterado | 5 fechamentos (3 funcionários × empresas usadas); PDF com 18 linhas no total e as imagens; 409 | consultas + PDF + planilha |
| GREEN 3 | reembolso (CA-4-21) | listar `contas_pagar` origem `rdv` | 1 por fechamento com reembolso > 0, vencimento 10/12 | consulta |
| GREEN 4 | envio e reabrir (CA-4-22) | conferir `envios_email`; reabrir um fechamento como `teste.administrativo` e como `teste.admin.a`; aprovar um reembolso e tentar reabrir o fechamento dele | 1 enviado ("TESTE — Spy"), 1 `aguardando_email`; 403 e 200 com conta cancelada; 409 | consultas + log |
| REFACTOR/REGRESSÃO | regressão e visual | (a) lembrete no dia 3 com relógio de teste (1 aviso por destinatário); (b) SPEC-4-005 GREEN 1 e SPEC-4-002 GREEN 4; (c) capturas 390×844 e 1280×800, axe-core | ok; sem diferença; sem falha séria | relatório |

**Caminhos de erro obrigatórios:** mês atual, total divergente, empresa sem e-mail, envio com falha, anexos acima de 20 MB, reabrir com reembolso aprovado, perfil sem permissão.
**Evidência exigida:** em `05_entregas/fase-4/spec-4-006/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-4/spec-4-006/` e o log do Skip. Os e-mails da contabilidade entram pela tela quando o Diogo informar.

## Handoff e operação

- **Como demonstrar:** painel do mês; fechar; e-mail recebido; reembolso em "Aguardando aprovação".
- **Como operar depois:** o Administrativo fecha até o dia 5; os sócios aprovam os reembolsos no dia de pagamento.
- **Como monitorar:** envios `falhou` ou `aguardando_email`; meses sem fechamento.
- **Pendência conhecida:** CL-PEND-012 (e-mails da contabilidade: Rumo Agro → administrativo; AgroSpy/AgroSmart → financeiro).

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Fechar o RDV do mês e mandar para a contabilidade | Agrospy | SPEC-4-006 | CA-4-19 a CA-4-22 | todas as subtasks | evidências das subtasks | SPEC-4-005 no ar |
| id pendente | Mostrar o painel de despesas por mês, pessoa e categoria | Agrospy | SPEC-4-006 | CA-4-19 | GREEN 1 | respostas + consulta | SPEC-4-005 |
| id pendente | Fechar o mês de cada funcionário com PDF e planilha | Agrospy | SPEC-4-006 | CA-4-20 | RED 1 → GREEN 2 | PDF + planilha | painel |
| id pendente | Levar o reembolso do fechamento para as contas a pagar | Agrospy | SPEC-4-006 | CA-4-21 | GREEN 3 | consulta | fechamento |
| id pendente | Mandar o fechamento por e-mail para a contabilidade de cada empresa | Agrospy | SPEC-4-006 | CA-4-22 | GREEN 4 + REFACTOR (a)(b)(c) | consultas + log | fechamento |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
