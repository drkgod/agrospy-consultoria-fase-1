# STATUS — Agrospy

**Atualizado em:** 07/10/2026
**Fase atual:** 1 — MVP comercial multiempresa no celular
**Período planejado:** 06/10/2026 a 20/10/2026
**Estado:** execução em curso; task 1 concluída e testada; task 2 (login e escolha de empresa) implementada, aguardando teste humano.

| Item | Situação |
|---|---|
| SPECs | 5, com TDD e critérios CA-1-01 a CA-1-24 |
| Tasks | 36: 15 de topo e 21 subtarefas |
| Estado das tasks | 30 abertas, 1 em andamento (e6893843), 5 concluídas (3f7fb2d0 + 2 sub; e6893843 + 2 sub) |
| IDs | 36 IDs existentes preservados |
| Validação do pacote | formato das tasks e vínculos com as SPECs aprovados |
| Validação da entrega | acontece durante a execução, conforme cada SPEC |

## Entradas necessárias

- Conta Skip do Diogo conectada ao Maestro e projeto do sistema criado. **Feito em 07/10** (projeto 64376).
- Lista da equipe por empresa, com e-mails e perfis.
- Linhas de negócio da Agrospy e da Rumo Agro confirmadas pelo Diogo.
- Celulares para os testes de instalação e uso sem internet.

## Próxima ação

Task e6893843 (login e escolha de empresa) implementada na versão 0.0.7 (c040650), publicada em https://agrospy-8aca5.goskip.app e com o fluxo provado pelo Maestro no navegador (login → escolha → topo com identidade → trocar empresa). Aguardando teste humano do Diogo. Depois: f1624dc7 (perfis e tela de usuários).