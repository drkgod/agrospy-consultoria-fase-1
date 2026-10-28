# Fase 2 — Execução do fluxo de prospecção

<!-- fase-format:2 -->

Base: escopo aprovado pelo Diogo (artifacts/escopo_sistema_vendas_agrospy.md). Fase 2 =
ficha de perfil, classificação de potencial e época, apoio de IA (resumo de conversa +
sugestão de demandas), destaque da revisita e visão dos 3 indicadores semanais.

- [x] Ficha de perfil do produtor no app @Agrospy !30/10/2026 2026-10-28  <!-- id:f2-001-perfil-produtor -->
  > Campos novos na ficha: adoção de tecnologia, agricultura de precisão (faz/fez/nunca), equipamentos/estrutura, classificação (potencial/não potencial/cliente) e época de maior efetividade.
  > Prova: preencher na ficha e conferir na API. Migração 0035 + tela entregues (v0.0.90).
- [x] Classificar potencial e época na visita @Agrospy !30/10/2026 2026-10-28  <!-- id:f2-002-classificar-visita -->
  > Ao registrar a visita, permitir classificar o produtor (potencial/não) e a época direto do formulário da visita, sem abrir a ficha.
  > Prova: visita registrada com classificação nova refletida na ficha.
- [/] Resumo da conversa com apoio de IA @Agrospy !07/11/2026  <!-- id:f2-003-resumo-ia -->
  > A partir do áudio da visita, gerar resumo e sugestão de demandas; o usuário revisa e confirma antes de salvar (nada entra sem revisão).
  > Prova: visita com áudio → resumo sugerido → usuário edita → salvo como texto da visita.
- [x] Destaque da revisita @Agrospy !07/11/2026 2026-10-28  <!-- id:f2-004-destaque-revisita -->
  > Antes da próxima visita, a ficha do produtor mostra o resumo: demandas atendíveis na época atual, histórico de visitas e última conversa.
  > Prova: ficha com demandas e época mostra o destaque pronto para levar na visita.
- [x] Indicadores semanais na visão do gestor @Agrospy !07/11/2026 2026-10-28  <!-- id:f2-005-indicadores-semanais -->
  > Os 3 indicadores do guardanapo: prospecções realizadas, visitas com potencial, oportunidades com necessidade reconhecida — semana corrente e anterior.
  > Prova: números da tela iguais à contagem direta na base.
- [ ] Teste humano do fluxo da Fase 2 @Agrospy !14/11/2026  <!-- id:f2-006-teste-fluxo -->
  > Diogo testa o fluxo completo: visita com áudio → perfil e classificação → destaque da revisita → indicadores.
  > Resultado: "testei, pode seguir" ou lista do que mudar.