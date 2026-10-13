# AP-2026-10-13 — Crash client-side no Safari + armadilhas do runtime Skip

- **Sinal**: 2 testes do Diogo no iPhone (Safari) derrubaram a página ao abrir o Select de perfil; o mesmo fluxo passava no Chrome do Maestro. Logs do servidor: 0 PATCH, só GETs em rajada → o crash era ANTES da requisição (client-side), não regra nem hook.
- **Padrão reutilizável**: para diagnosticar "a página sumiu", PRIMEIRO olhar os logs do servidor — ausência de escritas = crash client-side; presença de 400/404 = regra/hook. Componentes popover (Radix/shadcn) são arriscados no Safari do iPhone; para formulários críticos usar <select> nativo.
- **Rede de segurança**: ErrorBoundary global no App.tsx — qualquer erro de render mostra mensagem + botão Recarregar em vez de página branca.
- **Runtime Skip**: e.record.original() não existe em hooks (usar $app.findRecordById para ler o estado anterior); migração idempotente não re-executa — correção de regra criada na mesma migração exige migração NOVA.
