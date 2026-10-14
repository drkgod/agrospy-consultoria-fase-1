## [0.0.62] - 2026-10-14 — task ae167e8a (SPEC-1-003): visita e oportunidade + áudio
- Botão "Registrar visita" na ficha do produtor (faltava no bundle — 3 patches só no espelho), formulário curto (data, assuntos, "Mais detalhes"), próximo passo em 1 toque, histórico Visitas/Oportunidades na ficha.
- Backend: coleções linhas_negocio (carga 8 Agrospy/5 Rumo + fixa Relacionamento), visitas, oportunidades e acoes_oportunidade (histórico imutável) — migrações 0019-0025; hooks: destino obrigatório, próxima ação vigente, data passada recusada, linha fixa, responsável padrão do produtor.
- Emenda áudio (pedido 14/10): gravar no app (MediaRecorder) + anexar do celular (m4a/mp3/wav/ogg/aac/amr/3gp/webm, 25 MB), player na ficha, upload multipart (FormData com empresa) provado por API com download íntegro.
- Emenda transcrição por voz (pedido 14/10): botão "Transcrever o que eu falar" (Web Speech API, pt-BR, contínuo) adiciona o dito ao campo assuntos — sem conflito com gravação de áudio (só aparece quando não está gravando). Sem transcrição de arquivo gravado (requer API externa — decisão futura).
- 22 provas de API verdes (RED 1-4 + GREEN + hook da próxima ação); usuários de teste recriados por migração idempotente 0023.
- Lições duras: migrações só rodam no publish; diretório real é pocketbase/; patches de tela precisam ser conferidos no arquivo do Skip (o botão não subiu); FormData com arquivo exige empresa; runtime sem startOfDay — datas por string; no create hook a ação atual não está no histórico.
- Versão final no ar: v0.0.62 (a56c629).
