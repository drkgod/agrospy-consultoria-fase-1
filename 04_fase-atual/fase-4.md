# Fase 4 — Tarefas

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


- [ ] Preparar as empresas do lançamento e o perfil Administrativo @Agrospy
  > AgroSpy, AgroSmart e Rumo Agro passam a ser as empresas de cada lançamento financeiro, a funcionária do administrativo ganha perfil próprio e os avisos financeiros chegam no app e por e-mail. Fecha pela prova automática. SPEC-4-001, CA-4-01 a CA-4-03.
  - [ ] Cadastrar AgroSpy, AgroSmart e Rumo Agro como empresas do lançamento @Agrospy
    > Tela do Administrador com nome, CNPJ (validado), razão social e e-mail da contabilidade de cada empresa. Sem CNPJ, aparece "CNPJ pendente". Fecha pela prova automática. SPEC-4-001, CA-4-01.
  - [ ] Criar o perfil Administrativo com acesso ao financeiro @Agrospy
    > Perfil novo: lança e confere o financeiro, não aprova pagamento e não ganha acesso comercial. Menu "Financeiro" para Administrador, Gestão e Administrativo. Fecha pela prova automática. SPEC-4-001, CA-4-02.
  - [ ] Mandar os avisos financeiros no app e por e-mail @Agrospy
    > Aviso financeiro na lista do app, na notificação do celular (sem nome nem valor na tela bloqueada) e por e-mail quando pedido, sem repetir. Nunca por WhatsApp. Fecha pela prova automática. SPEC-4-001, CA-4-03.
- [ ] Lançar e aprovar as contas a pagar @Agrospy
  > Todo boleto vira conta a pagar com empresa, fornecedor e dia fixo de pagamento (terça ou quinta). O Administrativo lança, só os sócios aprovam e o sistema gera a lista para pagar no app do banco. A IA nunca paga. Fecha pela prova automática. SPEC-4-002, CA-4-04 a CA-4-08.
  - [ ] Cadastrar os fornecedores @Agrospy
    > Fornecedor com CPF/CNPJ validado, e-mails de envio dos boletos e uso (contas a pagar, RDV ou ambos), separado por empresa. Fecha pela prova automática. SPEC-4-002, CA-4-04.
  - [ ] Lançar boleto à mão com o dia de pagamento certo @Agrospy
    > A linha digitável é conferida e preenche valor e vencimento. O pagamento cai na terça ou quinta mais próxima sem passar do vencimento; boleto repetido é recusado. Fecha pela prova automática. SPEC-4-002, CA-4-05.
  - [ ] Avisar o administrativo e os sócios antes de terça e quinta @Agrospy
    > Véspera e dia do pagamento, às 7h: "Cadastre até hoje os boletos". Os sócios recebem quantas contas aguardam aprovação. Fecha pela prova automática. SPEC-4-002, CA-4-06.
  - [ ] Aprovar ou recusar as contas do dia de pagamento @Agrospy
    > Só os sócios (perfil Administrador) aprovam, uma a uma ou todas do dia; recusa pede motivo e avisa quem lançou. Tudo fica no histórico. Fecha pela prova automática. SPEC-4-002, CA-4-07.
  - [ ] Gerar a lista aprovada e dar baixa com o comprovante @Agrospy
    > Tela "Pagar hoje" com as aprovadas por empresa, linha digitável para copiar e lista em PDF. "Marcar como paga" pede data e comprovante. Fecha pela prova automática. SPEC-4-002, CA-4-08.
- [ ] Receber os boletos dos fornecedores por e-mail @Agrospy
  > A caixa de boletos é lida a cada 10 minutos. Fornecedor cadastrado vira conta para conferir; remetente desconhecido não tem anexo baixado e fica para análise, com o botão Golpe. Fecha pela prova automática. SPEC-4-003, CA-4-09 a CA-4-11.
  - [ ] Ler o boleto do fornecedor cadastrado e lançar para conferência @Agrospy
    > O PDF do fornecedor vira conta "Para conferir" com valor e vencimento. Beneficiário diferente do fornecedor gera alerta; PDF escaneado vai para leitura manual. Fecha pela prova automática. SPEC-4-003, CA-4-10.
  - [ ] Segurar e-mail de remetente desconhecido para análise @Agrospy
    > E-mail de quem não é fornecedor aparece só com remetente, assunto e data, sem baixar anexo, até alguém analisar. Fecha pela prova automática. SPEC-4-003, CA-4-10.
  - [ ] Bloquear remetente com o botão Golpe @Agrospy
    > "Golpe" põe o remetente (ou o domínio, ou o fornecedor) na lista de bloqueio; o próximo e-mail dele é descartado sem aviso. Só o Administrador desbloqueia. Fecha pela prova automática. SPEC-4-003, CA-4-11.
  - [ ] Ligar a caixa de e-mail dos boletos ao sistema @Agrospy
    > Liga a caixa real pelo aplicativo do Google da Agrospy (Gmail, só leitura). Depende de a Agrospy informar a caixa e autorizar uma vez; sem isso, fica em espera. Fecha pela prova automática. SPEC-4-003, CA-4-09.
- [ ] Ligar o banco Sicredi aos boletos e pagamentos @Agrospy
  > Se o Sicredi tiver API para a conta, os boletos do DDA entram para conferência e os pagamentos aprovados vão ao banco. Sem API, vale a lista aprovada. Fecha pela prova automática. SPEC-4-004, CA-4-12 a CA-4-14.
  - [ ] Levantar com o Sicredi as APIs de DDA e de pagamento @Agrospy
    > A Agrospy pergunta uma vez ao gerente quais APIs a conta tem; a resposta fica registrada. Sem API, as telas mostram "Banco não integrado". Fecha pela prova automática. SPEC-4-004, CA-4-12.
  - [ ] Trazer os boletos do DDA para conferência @Agrospy
    > Com API de DDA: duas leituras por dia criam contas "Para conferir" sem repetir as que vieram por e-mail. Sem API: não se aplica. Fecha pela prova automática. SPEC-4-004, CA-4-13.
  - [ ] Enviar ao banco só os pagamentos aprovados @Agrospy
    > Com API de pagamento: só o sócio logado envia, só contas aprovadas, sem envio em dobro; o retorno do banco dá baixa. Sem API: não se aplica. Fecha pela prova automática. SPEC-4-004, CA-4-14.
- [ ] Lançar as despesas de viagem (RDV) com foto @Agrospy
  > Qualquer funcionário fotografa a nota, o app lê data, fornecedor, valor e forma de pagamento e sugere a categoria. Valor, data e empresa são obrigatórios. Fecha pela prova automática. SPEC-4-005, CA-4-15 a CA-4-18.
  - [ ] Lançar a despesa com foto ou PDF e os campos obrigatórios @Agrospy
    > Empresa, motivo, km, reembolso ou cartão da empresa. Comprovante Pix pede quem recebeu; só o Administrador lança sem nota. Cada um vê as próprias despesas. Fecha pela prova automática. SPEC-4-005, CA-4-15.
  - [ ] Ler a nota automaticamente e sugerir a categoria @Agrospy
    > A foto ou o PDF preenchem data, fornecedor, valor e forma de pagamento; a empresa vem pelo CNPJ da nota. Tudo é sugestão até salvar. Fecha pela prova automática. SPEC-4-005, CA-4-16.
  - [ ] Ligar o canhoto provisório à nota que chega depois @Agrospy
    > O canhoto salva a despesa com "nota pendente"; a nota entra depois na mesma despesa, sem duplicar. Fornecedor novo fica salvo para a próxima vez. Fecha pela prova automática. SPEC-4-005, CA-4-17.
  - [ ] Lançar a despesa pelo assistente com foto e áudio @Agrospy
    > Botão flutuante: foto e áudio viram o rascunho da despesa; o assistente pergunta o que falta e só salva com a confirmação. Funciona sem internet e sobe depois. Fecha pela prova automática. SPEC-4-005, CA-4-18.
- [ ] Fechar o RDV do mês e mandar para a contabilidade @Agrospy
  > Fechamento mensal por funcionário com PDF e planilha, painel do gestor e envio automático à contabilidade de cada empresa. O reembolso vira conta a pagar. Fecha pela prova automática. SPEC-4-006, CA-4-19 a CA-4-22.
  - [ ] Mostrar o painel de despesas por mês, pessoa e categoria @Agrospy
    > Totais por pessoa, categoria e empresa, com reembolso, cartão e notas pendentes, batendo com a base. Fecha pela prova automática. SPEC-4-006, CA-4-19.
  - [ ] Fechar o mês de cada funcionário com PDF e planilha @Agrospy
    > "Fechar mês" gera, por funcionário e empresa, o PDF com as fotos e totais e a planilha. As despesas ficam travadas; só o Administrador reabre, com motivo. Fecha pela prova automática. SPEC-4-006, CA-4-20.
  - [ ] Levar o reembolso do fechamento para as contas a pagar @Agrospy
    > O total a reembolsar de cada funcionário vira conta a pagar para os sócios aprovarem, com vencimento no dia 10. Fecha pela prova automática. SPEC-4-006, CA-4-21.
  - [ ] Mandar o fechamento por e-mail para a contabilidade de cada empresa @Agrospy
    > Um e-mail por empresa com os PDFs e planilhas dela. Sem e-mail da contabilidade cadastrado, o envio espera e o Administrador é avisado uma vez. Fecha pela prova automática. SPEC-4-006, CA-4-22.
- [ ] Gerar o contrato e mandar para assinatura @Agrospy
  > O contrato sai da venda ganha (produtor, área, serviço e condições) com o modelo ativo, é revisado e vai para assinatura pelo DocuSign. O status volta ao sistema. Fecha pela prova automática. SPEC-4-007, CA-4-23 a CA-4-26.
  - [ ] Criar e ativar os modelos de contrato @Agrospy
    > Modelos com campos fechados e versões. Até chegar o modelo real da Agrospy, vale o modelo fictício de pulverização com drone, que não vai para cliente. Fecha pela prova automática. SPEC-4-007, CA-4-23.
  - [ ] Gerar o contrato a partir da venda ganha @Agrospy
    > Produtor, propriedade, área, serviço, valor e parcelas vêm da venda; o que faltar aparece em "Falta preencher" e trava o envio. Fecha pela prova automática. SPEC-4-007, CA-4-24.
  - [ ] Mandar o contrato para assinatura pelo DocuSign @Agrospy
    > Só Administrador ou Gestão envia, para o produtor e o sócio, sem envio em dobro. A construção usa a conta de demonstração do DocuSign. Fecha pela prova automática. SPEC-4-007, CA-4-25.
  - [ ] Trazer de volta o status da assinatura e o contrato assinado @Agrospy
    > Enviado, assinado, recusado ou cancelado voltam sozinhos; o PDF assinado fica no contrato e libera as parcelas a receber. Fecha pela prova automática. SPEC-4-007, CA-4-26.
- [ ] Acompanhar os recebimentos e o fluxo de caixa por empresa @Agrospy
  > Cada parcela do contrato vira recebimento da empresa contratada; o administrativo é avisado para emitir o boleto e cada empresa tem o próprio fluxo de caixa. Fecha pela prova automática. SPEC-4-008, CA-4-27 a CA-4-30.
  - [ ] Criar as parcelas a receber do contrato assinado @Agrospy
    > Entrada e parcelas do contrato assinado viram recebimentos da empresa contratada, sem repetir. Também dá para lançar recebimento avulso. Fecha pela prova automática. SPEC-4-008, CA-4-27.
  - [ ] Avisar o administrativo para emitir e anexar o boleto de cobrança @Agrospy
    > Dez dias antes do vencimento, aviso no app e por e-mail, repetido até o boleto ser anexado. Vencido sem baixa avisa os sócios. O boleto continua manual. Fecha pela prova automática. SPEC-4-008, CA-4-28.
  - [ ] Dar baixa nos recebimentos @Agrospy
    > Baixa com data e valor recebido; só o Administrador cancela. Comercial e Operador não acessam. Fecha pela prova automática. SPEC-4-008, CA-4-29.
  - [ ] Mostrar o fluxo de caixa de cada empresa @Agrospy
    > Entradas e saídas previstas e realizadas por semana ou mês, com saldo acumulado, para AgroSpy, AgroSmart e Rumo Agro separadas. Fecha pela prova automática. SPEC-4-008, CA-4-30.
- [ ] Abrir os dados do sistema para as IAs com segurança @Agrospy
  > Conector MCP do sistema: cada sócio cria a própria chave e consulta relatórios pelo Maestro ou outra IA, com as mesmas permissões do app. Fecha pela prova automática. SPEC-4-009, CA-4-31 a CA-4-33.
  - [ ] Criar as chaves de acesso por pessoa @Agrospy
    > Chave mostrada uma vez, válida por 90 dias e revogável. Só o sócio cria chave que lança despesa. Fecha pela prova automática. SPEC-4-009, CA-4-31.
  - [ ] Responder aos relatórios pelo conector MCP @Agrospy
    > Carteira, contas a pagar, caixa, despesas, contratos e recebimentos pela IA, sem CPF, telefone, e-mail ou linha digitável. Nada de aprovar, pagar ou enviar. Fecha pela prova automática. SPEC-4-009, CA-4-32.
  - [ ] Lançar despesa pelo bot do Maestro @Agrospy
    > O sócio manda a foto e os dados ao bot e a despesa entra em "Minhas despesas" com as mesmas regras do app, sem duplicar. Fecha pela prova automática. SPEC-4-009, CA-4-33.
- [ ] Rodar o ciclo semanal de próxima ação em dia (LOOP-01) @Agrospy
  > Toda segunda, o assistente do Maestro mede quantas oportunidades abertas estão com a próxima ação em dia, compara com a meta e entrega a lista para o gestor cobrar. Só lê. Fecha pela prova automática. SPEC-4-010, CA-4-34 a CA-4-36.
  - [ ] Medir a linha de base da próxima ação em dia @Agrospy
    > Ferramenta de leitura que calcula a parcela em dia por empresa e por responsável e a linha de base dos 7 dias anteriores. Fecha pela prova automática. SPEC-4-010, CA-4-34.
  - [ ] Configurar o loop semanal no Maestro @Agrospy
    > Instruções permanentes, agenda de segunda às 8h e registro dos ciclos, sem alterar nenhum registro. Fecha pela prova automática. SPEC-4-010, CA-4-35.
  - [ ] Rodar o primeiro ciclo e registrar o veredito @Agrospy
    > Ciclo controlado e primeiro ciclo real com linha de base, meta, medição, veredito e relatório; falha do conector pausa e retoma sem duplicar. Fecha pela prova automática. SPEC-4-010, CA-4-36.
