# Agrospy — execução da fase 1

Fase 1: MVP comercial multiempresa no celular. Período planejado: 06/10/2026 a 20/10/2026.

- [Tasks da fase](04_fase-atual/fase.md): 36 tasks, com responsáveis, prazos, descrições e IDs.
- [Índice das SPECs](04_fase-atual/specs/00-INDICE.md): 5 SPECs com critérios de aceite e TDD.
- [Status da execução](STATUS.md).

## Como executar

1. Escolha uma task aberta em `04_fase-atual/fase.md`, respeitando as dependências.
2. Leia a SPEC indicada na descrição e confira as pré-condições e os pontos de parada.
3. Execute uma task por vez e rode as provas previstas na SPEC.
4. Guarde as evidências em `05_entregas/`. Registre dúvidas e decisões em `06_notas/` e os arquivos do sistema em `07-sistemas/`.
5. Peça a validação humana do resultado antes de avançar. Marque a task como concluída somente com as provas exigidas e o aceite aplicável.

Preserve os IDs das tasks. O arquivo `04_fase-atual/fase.md` concentra os campos dos cards; as SPECs detalham a entrega e a prova.

## Estrutura

```text
04_fase-atual/
  fase.md
  specs/
    00-INDICE.md
    spec-1-001-acesso-por-empresa-e-perfis.md
    spec-1-002-cadastro-de-produtor-e-propriedade.md
    spec-1-003-visita-e-oportunidade-com-proxima-acao.md
    spec-1-004-uso-no-celular-sem-internet.md
    spec-1-005-carteira-e-visao-do-gestor.md
05_entregas/
06_notas/
07-sistemas/
```
