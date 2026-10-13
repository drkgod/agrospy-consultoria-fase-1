# AP-2026-10-13-1950 — Padrões de hooks/migrações no Skip Cloud (PocketBase v0.36)

**Contexto:** task 147a4f1b (cadastro de produtor/propriedade), falhas em sequência com a mesma raiz.

1. **Model hook sem requestInfo.** `onRecordCreate` roda fora do contexto HTTP: `e.requestInfo()` lança e a API responde 400 vazio ("Failed to create record") sem mensagem. Todo hook que precisa do usuário autenticado deve ser Request hook: `onRecordCreateRequest` / `onRecordUpdateRequest` — lá `e.requestInfo().auth` existe.
2. **Criação de registro em hook.** `collection.newRecord()` não existe no runtime (TypeError "Object has no member 'newRecord'"). Forma correta: `new Record($app.findCollectionByNameOrId('eventos'))` + `$app.save(ev)`.
3. **Migração idempotente não re-executa.** Escrever o fix de uma regra na própria migração que já rodou (0013) não aplica nada. Correção de regra exige migração nova (0014, 0017).
4. **DELETE 403 "Only superusers" após publish** = a migração que define o deleteRule não rodou no banco de produção (aplicada antes do publish). Reaplicar com migração nova e provar por API (204).
5. **Loop de fetch + 429.** `useEffect` com dependência `empresa` (objeto de `getAtiva()`, novo a cada render) dispara GETs em rajada até o rate limit; sintoma nos logs do servidor (rajada de GET com 429) e não no Chrome local. Fix: dependência por `empresaId`.
6. **ErrorBoundary com a mensagem.** Mostrar `this.state.erro.message` na tela de erro reduziu o diagnóstico do crash "NIVEIS is not defined" de ~6 passos para 1 (ler o <pre>).

**Reutilizável:** qualquer task futura com hooks de validação + auth, migrações de regra e telas novas.
