# AP-2026-10-07-1815 — Escrita MCP GitHub instável: consolidar em push_files

- Status: candidato
- Escopo: projeto do cliente (agrospy-consultoria-fase-1)
- Task/SPEC: 3f7fb2d0 (SPEC-1-001, pré-condições)
- Sinal: durante a sessão de 07/10, create_or_update_file falhou ~35 vezes (Bad Request / manager is closed) e push_files (commit em lote) funcionou quando o conector se recuperou; retries em cascata consumiram o turno sem entregar.
- Evidência: logs da sessão (falhas repetidas) vs. commits 8feea20 e 67e889d criados via push_files.
- Regra reutilizável: consolidar as escritas ao GitHub em commits em lote (push_files) e, após ~3 falhas seguidas, registrar a trava e seguir com espelho local — sem tempestade de retries.
- Quando aplicar: qualquer task que precise enviar registros ao GitHub neste ambiente.
- Quando não aplicar: se o conector estiver estável e o pedido for de envio imediato de arquivo único.
- Confiança: média — padrão observado em uma sessão; monitorar nas próximas tasks.
- Privacidade: sem segredo, dado pessoal ou conteúdo bruto.