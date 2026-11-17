# Índice de SPECs — Fase 3

**Fase:** 3 — Gestão comercial e decisão, com o app de cara nova
**Gerado em:** 17/11/2026 · **Status das SPECs:** planejadas
**Resultado da fase:**
- o app fica com cara e jeito de app no celular;
- o gestor decide com dados: funil, propostas, atrasos e desfechos por empresa e por responsável;
- o vendedor sabe quem visitar primeiro.

| SPEC | Entrega | Degrau da solução | Critérios | Depende de |
|---|---|---|---|---|
| [SPEC-3-001](spec-3-001-pendencias-tecnicas-da-fase-2.md) | Pendências técnicas da fase 2: avisos no celular, 90 dias, pasta do Drive a cada 10 min, dados de teste separados e código no GitHub | reuso + construção mínima | CA-3-01 a CA-3-05 | fase 2 |
| [SPEC-3-002](spec-3-002-visual-de-app-e-navegacao.md) | Visual de app e navegação: tokens por empresa, casca com abas, componentes e vitrine | construção mínima | CA-3-06 a CA-3-11 | SPEC-3-001 (espelho e dados de teste) |
| [SPEC-3-003](spec-3-003-telas-do-app-no-novo-visual.md) | Todas as telas existentes no novo visual | reuso | CA-3-12 a CA-3-17 | SPEC-3-002 |
| [SPEC-3-004](spec-3-004-funil-proposta-e-desfecho.md) | Funil por empresa, proposta e desfecho com motivo | construção mínima | CA-3-18 a CA-3-23 | SPEC-3-002 |
| [SPEC-3-005](spec-3-005-paineis-e-fila-priorizada.md) | Painéis do gestor e do vendedor e fila priorizada | reuso + construção mínima | CA-3-24 a CA-3-29 | SPEC-3-004 |
| [SPEC-3-006](spec-3-006-produtor-nas-duas-empresas-e-importacao.md) | Produtor nas duas empresas e importação da carteira pela planilha | construção mínima | CA-3-30 a CA-3-34 | SPEC-3-004 |

## Como executar

1. **Construção em sequência**, uma task depois da outra, na ordem do `fase.md`, sem pedir autorização entre elas.
2. **Sem teste humano (P11, 17/11/2026).**
   - Toda task fecha pela prova automática da própria SPEC, com evidência em `05_entregas/fase-3/` e o log do Skip.
   - Nenhuma task espera teste, demonstração ou "testei, pode seguir" de pessoa.
3. **Ordem:**
   1. pendências técnicas da fase 2 (SPEC-3-001);
   2. visual de app (SPEC-3-002);
   3. telas existentes no novo visual (SPEC-3-003);
   4. funil, proposta e desfecho (SPEC-3-004);
   5. painéis e fila (SPEC-3-005);
   6. produtor nas duas empresas e importação (SPEC-3-006).
4. **Regra visual:** toda tela nova ou alterada usa o sistema da SPEC-3-002.
   - componentes de `src/components/app/`;
   - cores só pelos tokens, com hex só em `src/lib/cores.ts`;
   - estados de carregando, vazio, erro e sem internet;
   - entrada na `/vitrine`;
   - capturas em 390×844 e 1280×800 sem rolagem horizontal;
   - axe-core sem falhas sérias.
5. **Código no GitHub:** ao fechar cada task, atualize o espelho em `07-sistemas/comercial/codigo/` com a versão publicada.
6. **Dados de teste:** só nas empresas "Teste A" e "Teste B", com o elenco de teste da SPEC-3-001. As senhas ficam só nas credenciais do executor. Nunca grave teste na Agrospy ou na Rumo Agro.
7. **Se faltar algo que só a Agrospy pode providenciar**, peça uma vez e pare só aquela task. Siga com a próxima que não depende disso. Itens possíveis:
   - as chaves do OneSignal;
   - o aplicativo do Google para a pasta do Drive (sem ele, "Ler a pasta do Drive a cada 10 minutos" fica em `[/]`, com a pendência no STATUS).

   A planilha da carteira não trava nada: a importação usa o modelo da SPEC-3-006, e a planilha real é pedida uma vez.
8. **Decisão de negócio em aberto:** vale o padrão escrito na SPEC, como etapas do funil, motivos e dias sem contato. O Administrador pode editar depois, e a construção não para.

## Fora desta fase

- RDV, contratos e a parte administrativa (fase 4);
- sugestões por IA para reabordagem (fase 5);
- WhatsApp e mensagens automáticas para produtores;
- AutoCAD.

## Tasks

As tasks desta fase estão em `04_fase-atual/fase.md` e listadas em `## Tasks vinculadas` de cada SPEC.
