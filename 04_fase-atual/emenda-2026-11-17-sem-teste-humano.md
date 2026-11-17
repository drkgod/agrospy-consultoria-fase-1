# Emenda de 17/11/2026: sem teste humano

**Decisão:** consultor (Rodrigo Santos), 17/11/2026.
**Vale para:** a fase 2 e todas as fases seguintes da Agrospy.

## Regra

- Nenhuma task nem SPEC espera teste, demonstração, aprovação ou "testei, pode seguir" de pessoa.
- Toda task fecha pela prova automática da própria SPEC: testes pela API, navegador automatizado, consultas e o log do Skip. A evidência fica em `05_entregas/fase-N/`.
- Ação que só a Agrospy pode fazer (criar conta, guardar chave, liberar pasta) é pedida uma vez. Ela trava só a task que depende dela, e o Maestro segue com as outras.
- Decisão de negócio que antes era perguntada no teste fica com o padrão da SPEC até o Diogo pedir outro. Mudança vira emenda do consultor e não para a construção.

## O que mudou na fase 2

| Onde | Antes | Agora |
|---|---|---|
| SPECs 2-001 a 2-004 | `## Teste humano do cliente` | `## Teste do cliente: Não se aplica` |
| b33bfdb7 | "Testar os avisos no celular" (Diogo com um vendedor) | "Provar a entrega dos avisos de atraso e da cópia no celular": prova automática pela resposta do OneSignal |
| 2bb2808a e CA-2-18 | "Demonstrar a fase 2 no celular", o teste final do Diogo | "Fechar a fase 2 com a regressão automática de ponta a ponta": os mesmos cinco passos, por roteiro automático |
| RN-50 (guarda dos áudios) | 30 dias, "confirmar no teste" | 90 dias, decisão do Diogo em 09/11/2026. A rotina `retencao_rascunhos` passa de 30 para 90 dias antes da prova final |
| Guarda das conversas do assistente | 90 dias, "confirmar no teste" | 90 dias |
| Comercial vê todos os produtores da empresa? | pergunta do teste do assistente | continua vendo todos até o Diogo pedir outra regra |
| `00-INDICE.md` e `README.md` | "teste humano só na última task de cada SPEC" | sem teste humano |
| `04_fase-atual/fase-2.md` | lista própria do Maestro, com teste humano (f2-006) e IDs fora do portal | arquivada em `06_notas/2026-10-22-lista-propria-do-maestro-fase-2.md`, só como histórico |

As tasks abc5e491 (30/10) e 47f28655 (09/11) já foram concluídas com o teste do Diogo. Elas ficam como estão e não reabrem.

## Ordem para terminar a fase 2

1. **2ae01199:** religar a notificação no celular. O código ficou pronto e provado na 0.0.177 (02/11): é revalidar a entrega, não reimplementar.
2. **b33bfdb7:** prova automática da entrega do aviso de atraso e da cópia ao gestor.
3. **2bb2808a:**
   1. RN-50 em 90 dias;
   2. regressão automática de ponta a ponta;
   3. limpeza das contas de teste.

   Com isso, a fase 2 fecha.
