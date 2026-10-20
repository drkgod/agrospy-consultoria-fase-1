# STATUS — Agrospy

**Atualizado em:** 20/10/2026
**Fase atual:** 1 — MVP comercial multiempresa no celular
**Período planejado:** 06/10/2026 a 20/10/2026
**Versão no ar:** 0.0.83 (f355b3d) publicada 2026-10-20T17:56:12Z
**Estado:** execução em curso; 26/36 tasks concluídas (offline 4da366fe + 3 sub concluídas — teste humano aprovado pelo Diogo em 20/10/2026: "agora deu certo", após os fixes 0.0.82 e 0.0.83). Próxima: testes de acesso (ed490cca) e falhas de envio (f5877532).

| Item | Situação |
|---|---|
| SPECs | 5, com TDD e critérios CA-1-01 a CA-1-24 |
| Tasks | 36: 15 de topo e 21 subtarefas |
| Estado das tasks | 10 abertas, 26 concluídas (3f7fb2d0 + 2 sub; e6893843 + 2 sub; f1624dc7 + 2 sub; 147a4f1b + 3 sub; ae167e8a + 2 sub; 448d4044 + 3 sub; baad9730; 684e8557; 4da366fe + 3 sub) |
| IDs | 36 IDs existentes preservados |
| Validação do pacote | formato das tasks e vínculos com as SPECs aprovados |
| Validação da entrega | acontece durante a execução, conforme cada SPEC |

## Entradas necessárias

- Lista da equipe por empresa, com e-mails e perfis (cadastrada na task 6af46d50, depois do roteiro de acesso).
- Celulares para os testes de instalação e uso sem internet.

## Próxima ação

SPEC-1-004 (uso no celular sem internet) fechada com teste humano aprovado pelo Diogo em 20/10/2026 ("agora deu certo"), após os fixes 0.0.82 (logo 404 travava o service worker) e 0.0.83 (empresa no payload da fila offline, fallback offline da lista, reencaminhar, banner de revisão). Próxima: testes de acesso multiempresa (ed490cca) — outra empresa e perfil sem permissão bloqueados.