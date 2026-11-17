# Agrospy — execução do projeto

Fase atual: 3 — Gestão comercial e decisão, com o app de cara nova.

**Histórico:**
- a fase 1 (MVP comercial multiempresa no celular) foi concluída em 22/10/2026 e está em `05_entregas/fase-1/`;
- a fase 2 (captura em campo e avisos) foi concluída em 17/11/2026 e está em `05_entregas/fase-2/`.

Repositório GitHub: https://github.com/drkgod/agrospy-consultoria-fase-1

- [Tasks da fase](04_fase-atual/fase.md): responsáveis, prazos, descrições e IDs.
- [Índice das SPECs](04_fase-atual/specs/00-INDICE.md): 6 SPECs com critérios de aceite e TDD.
- [Status da execução](STATUS.md).

## Como executar

1. **Antes de gravar qualquer arquivo:** puxe a versão do GitHub e use-a como base.
2. **Ordem:** siga as tasks de `04_fase-atual/fase.md` na ordem, uma depois da outra, sem pedir autorização antes de cada uma.
3. **SPEC:** leia a SPEC indicada na descrição e confira as pré-condições e os pontos de parada.
4. **Provas:** rode as provas previstas na SPEC. Toda task fecha pela prova automática, com evidência e o log do Skip.
   - Não há teste humano (P11, 17/11/2026).
   - Nenhuma task espera teste, demonstração ou "testei, pode seguir" de pessoa.
5. **Visual:** toda tela segue o sistema da SPEC-3-002 (componentes de `src/components/app/`, cores só pelos tokens).
6. **Ao fechar cada task:**
   - atualize o espelho do código em `07-sistemas/comercial/codigo/`;
   - guarde as evidências em `05_entregas/fase-3/`.
7. **Se faltar algo que só a Agrospy pode providenciar** (chave, conta, aplicativo do Google, planilha):
   - peça uma vez e pare só aquela task;
   - siga com a próxima que não depende disso.
8. **Dados de teste:** só nas empresas "Teste A" e "Teste B".
9. **Registros:** dúvidas e decisões vão em `06_notas/`.

Preserve os IDs das tasks. O arquivo `04_fase-atual/fase.md` concentra os campos dos cards; as SPECs detalham a entrega e a prova.

## Estrutura

```text
04_fase-atual/
  fase.md
  specs/
    00-INDICE.md
    spec-3-001-pendencias-tecnicas-da-fase-2.md
    spec-3-002-visual-de-app-e-navegacao.md
    spec-3-003-telas-do-app-no-novo-visual.md
    spec-3-004-funil-proposta-e-desfecho.md
    spec-3-005-paineis-e-fila-priorizada.md
    spec-3-006-produtor-nas-duas-empresas-e-importacao.md
05_entregas/
  fase-1/   (concluída em 22/10/2026)
  fase-2/   (concluída em 17/11/2026)
  fase-3/   (evidências desta fase)
06_notas/
07-sistemas/
  comercial/
    plataforma.md
    codigo/   (espelho do código publicado no Skip)
```
