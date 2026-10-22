# Agrospy — execução do projeto

Fase atual: 2 — Captura em campo e avisos. A fase 1 (MVP comercial multiempresa no celular) foi concluída em 22/10/2026, e o histórico dela está em `05_entregas/fase-1/`.

Repositório GitHub: https://github.com/drkgod/agrospy-consultoria-fase-1

- [Tasks da fase](04_fase-atual/fase.md): 21 tasks, com responsáveis, prazos, descrições e IDs.
- [Índice das SPECs](04_fase-atual/specs/00-INDICE.md): 4 SPECs com critérios de aceite e TDD.
- [Status da execução](STATUS.md).

## Como executar

1. Antes de gravar qualquer arquivo, puxe a versão do GitHub e use-a como base.
2. Siga as tasks de `04_fase-atual/fase.md` na ordem, uma depois da outra, sem pedir autorização antes de cada uma.
3. Leia a SPEC indicada na descrição e confira as pré-condições e os pontos de parada.
4. Rode as provas previstas na SPEC. As tasks fecham pela prova automática. O teste humano fica só na última task de cada SPEC, que diz "Fecha com o 'testei, pode seguir'".
5. Se faltar algo que só a Agrospy pode providenciar (chave, conta, número ou pasta), pare só aquela task, avise e siga com a próxima que não depende disso.
6. Guarde as evidências em `05_entregas/fase-2/`. Registre dúvidas e decisões em `06_notas/` e os arquivos do sistema em `07-sistemas/`.

Preserve os IDs das tasks. O arquivo `04_fase-atual/fase.md` concentra os campos dos cards; as SPECs detalham a entrega e a prova.

## Estrutura

```text
04_fase-atual/
  fase.md
  specs/
    00-INDICE.md
    spec-2-001-pos-visita-por-audio-no-app.md
    spec-2-002-avisos-da-proxima-acao.md
    spec-2-003-agente-de-campo-no-whatsapp.md
    spec-2-004-gravacoes-do-plaud-e-outros-gravadores.md
05_entregas/
  fase-1/   (tasks e SPECs da fase 1, concluída)
  fase-2/
06_notas/
07-sistemas/
```
