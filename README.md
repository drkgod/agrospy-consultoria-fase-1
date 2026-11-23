# Agrospy — execução do projeto

Fases liberadas (fila única, emenda de 23/11/2026): 3 — Gestão comercial e decisão, com o app de cara nova; 4 — Financeiro, RDV e contratos; 5 — Consolidação, mapa das áreas e validação.

**Histórico:**
- a fase 1 (MVP comercial multiempresa no celular) foi concluída em 22/10/2026 e está em `05_entregas/fase-1/`;
- a fase 2 (captura em campo e avisos) foi concluída em 17/11/2026 e está em `05_entregas/fase-2/`.

Repositório GitHub: https://github.com/drkgod/agrospy-consultoria-fase-1

- Tasks: [fase 3](04_fase-atual/fase.md), [fase 4](04_fase-atual/fase-4.md) e [fase 5](04_fase-atual/fase-5.md), com responsáveis, descrições e IDs.
- [Índice das SPECs](04_fase-atual/specs/00-INDICE.md): 21 SPECs (fases 3, 4 e 5) com critérios de aceite e TDD, a ordem da fila e as regras comuns.
- [Status da execução](STATUS.md).

## Como executar

1. **Antes de gravar qualquer arquivo:** puxe a versão do GitHub e use-a como base.
2. **Ordem (fila única):** termine a fase 3 (o que falta da SPEC-3-003 → SPEC-3-004 → SPEC-3-005 → SPEC-3-006), siga para a fase 4 (`04_fase-atual/fase-4.md`) e depois para a fase 5 (`04_fase-atual/fase-5.md`), uma task depois da outra, sem pedir autorização nem teste entre elas e sem parar entre as fases.
3. **SPEC:** leia a SPEC indicada na descrição e confira as pré-condições e os pontos de parada.
4. **Provas:** rode as provas previstas na SPEC. Toda task fecha pela prova automática, com evidência e o log do Skip.
   - Não há teste humano (P11, 17/11/2026).
   - Nenhuma task espera teste, demonstração ou "testei, pode seguir" de pessoa.
5. **Visual:** toda tela segue o sistema da SPEC-3-002 (componentes de `src/components/app/`, cores só pelos tokens).
   - Fases 4 e 5: siga também a seção "Regras comuns das fases 4 e 5" do índice das SPECs.
6. **Ao fechar cada task:**
   - atualize o espelho do código em `07-sistemas/comercial/codigo/`;
   - guarde as evidências em `05_entregas/fase-N/` da fase da task;
   - registre a data de conclusão numa linha `>` da task ("Concluída em dd/mm/aaaa"), nunca no fim da linha do título.
7. **Se faltar algo que só a Agrospy pode providenciar** (chave, conta, aplicativo do Google, planilha, caixa de e-mail dos boletos, API do Sicredi, conta DocuSign, CNPJs, e-mails da contabilidade, exemplos de KML, modelo de contrato):
   - deixe só aquela task em espera (`[/]` com o motivo numa linha `>`);
   - siga com a próxima que não depende disso;
   - no fim, avise uma vez com a lista do que ficou esperando.
8. **Dados de teste:** só nas empresas "Teste A" e "Teste B".
9. **Registros:** dúvidas e decisões vão em `06_notas/`.

Preserve os IDs das tasks. O arquivo `04_fase-atual/fase.md` concentra os campos dos cards; as SPECs detalham a entrega e a prova.

## Estrutura

```text
04_fase-atual/
  fase.md     (fase 3)
  fase-4.md   (fase 4)
  fase-5.md   (fase 5)
  specs/
    00-INDICE.md   (fila única, ordem e regras comuns)
    spec-3-001 … spec-3-006
    spec-4-001 … spec-4-010
    spec-5-001 … spec-5-005
05_entregas/
  fase-1/   (concluída em 22/10/2026)
  fase-2/   (concluída em 17/11/2026)
  fase-3/   (evidências da fase 3)
  fase-4/   (evidências da fase 4)
  fase-5/   (evidências da fase 5)
  loops/    (relatórios do LOOP-01 e do LOOP-02)
06_notas/
07-sistemas/
  comercial/
    plataforma.md
    codigo/   (espelho do código publicado no Skip)
```
