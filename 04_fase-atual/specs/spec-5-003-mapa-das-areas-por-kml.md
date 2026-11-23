# SPEC-5-003 — Mapa das áreas por KML: ficha do produtor e mapa da carteira

**Fase:** 5
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:** emenda P13 de 23/11/2026 (fase 5 acrescenta o mapa das áreas por KML: polígonos das propriedades/lotes no mapa do produtor e da carteira; depende dos exemplos de KML do Diogo; construir com KML fictício)
**Degrau da solução:** dependência nova pequena + reuso:
- **Reuso:** o arquivo KML/KMZ já guardado por propriedade (emenda de 23/11/2026 da SPEC-3-006, campo `propriedades.kml`), latitude e longitude da propriedade (fase 1);
- **Dependências:** `leaflet` 1.9.4 (mapa), `@tmcw/togeojson` 5.8.1 (KML → GeoJSON), `jszip` 3.10.1 (abrir KMZ) e `@turf/area` 7.x (área calculada), todas no navegador.

## Contexto e decisões fechadas

- **Estado atual:** cada propriedade pode ter um arquivo KML ou KMZ anexado (SPEC-3-006, emenda), sem desenho. A localização é só um ponto (latitude/longitude) ou link de mapa.
- **Estado desejado:** a ficha do produtor tem a aba "Mapa" com os contornos das propriedades e dos lotes/talhões do KML, com nome e área. A tela "Mapa da carteira" mostra os produtores da carteira visível no mapa, coloridos pela classificação, e o toque abre a ficha.
- **Decisões já fechadas:**
  - **Leitura no navegador:** o app baixa o arquivo protegido da propriedade, abre (KMZ: o primeiro `.kml` dentro do zip) e converte para GeoJSON. Polígonos e multipolígonos viram contornos; pontos viram marcadores; linhas são desenhadas como linha.
  - **Cache:** o GeoJSON convertido fica guardado em `propriedades.geojson_cache` (JSON ≤ 1 MB). Ele é gerado pelo navegador na primeira abertura e enviado pela rota `/propriedades/{id}/geojson`, que valida o formato e o tamanho. Assim o mapa da carteira não baixa dezenas de arquivos.
  - **Área:** calculada com `@turf/area` e mostrada em hectares com 1 casa; se diferir mais de 10% de `area_ha` do cadastro, aparece o selo "Área do mapa diferente do cadastro".
  - **Fundo do mapa:** imagem de satélite "World Imagery" da Esri com atribuição, e a opção "Mapa" (OpenStreetMap) com atribuição; ambos só com internet.
  - **Permissões:** quem vê o produtor vê o mapa dele (mesmas regras); o mapa da carteira mostra só os produtores que a pessoa pode listar.
  - **Sem internet:** a aba mostra "Mapa disponível com internet"; o resto da ficha funciona.
  - **KML fictício:** as provas usam arquivos gerados pelo executor (propriedade com 3 talhões, KMZ, KML só com ponto, KML inválido). Os exemplos reais do Diogo (CL-PEND-017) só entram para conferir se o leitor abre os arquivos dele; não travam a construção.
- **Bloqueios:** nenhum para construir.

## Resultado observável

1. O Diogo abre a ficha da Fazenda Santa Rita, aba "Mapa": aparecem os contornos dos 3 talhões em satélite, com nome e área de cada um e a área total; o selo avisa que a área do mapa (318,4 ha) bate com o cadastro.
2. Ele abre "Mapa da carteira" e vê os produtores da Agrospy: os clientes em verde, os potenciais em amarelo; toca numa área e vai para a ficha.
3. Um Comercial vê no mapa da carteira só o que ele pode listar no app.

## Limites e dependências

- **Inclui:** aba "Mapa" na ficha do produtor; tela "Mapa da carteira" (`/mapa`); leitor de KML/KMZ; cache do GeoJSON; área calculada e selo de diferença; legenda e filtros por classificação e responsável.
- **Fora de escopo:** desenhar ou editar contornos no app; exportar KML; NDVI, imagens Sentinel, fertilidade, calculadora de fertilizantes, AutoCAD, QGIS, drone (fora do escopo deste projeto); mapa offline.
- **Entradas e pré-condições:** emenda de 23/11/2026 da SPEC-3-006 no ar (campo `kml`); fases 1–4 no ar.
- **Saídas/artefatos:** campo `geojson_cache` e rota; componentes de mapa; fixtures KML; evidências em `05_entregas/fase-5/spec-5-003/`.
- **Dependências e responsáveis:** a Agrospy executa; o Diogo manda exemplos reais de KML quando puder (CL-PEND-017).
- **Atores e permissões mínimas:** iguais às da ficha e da lista de produtores (fases 1 e 3).
- **Superfícies/arquivos/configurações afetadas:** migração com `propriedades.geojson_cache` (JSON) e `propriedades.geojson_hash` (texto ≤ 64, hash do arquivo de origem); `pocketbase/hooks/propriedades_geojson.js`; `src/components/app/MapaAreas.tsx`, `src/lib/kml.ts`; `src/pages/ProdutorFicha.tsx` (aba), `src/pages/MapaCarteira.tsx`; `package.json`; `navegacao.ts` ("Mapa da carteira", seção Principal, Administrador, Gestão, Comercial; aba "Mais" no celular); `vitrine.ts`; `sw.js` não cacheia os blocos do mapa.
- **Risco e plano B:** KML muito grande (> 1 MB de GeoJSON) → simplificação com tolerância de 0,0001° antes do cache (`@turf/simplify`) e aviso "contorno simplificado"; serviço de satélite fora → cai para OpenStreetMap.
- **Rollback ou reversão:** esconder a aba e o item do menu; o cache pode ser apagado e regerado.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| Arquivo `propriedades.kml` | Skip | KML 2.2 ou KMZ | token de arquivo protegido do usuário | baixa 1 vez por `geojson_hash` | inválido → "Não foi possível ler o arquivo KML" |
| Blocos de mapa Esri World Imagery / OpenStreetMap | provedores públicos | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` e `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, com atribuição | nenhuma | do navegador | sem internet → aviso |

| Rota | Quem | Entrada | Efeito | Erros |
|---|---|---|---|---|
| `POST /backend/v1/propriedades/{id}/geojson` | quem pode ver a propriedade | `{geojson, hash}` | valida (FeatureCollection, ≤ 1 MB, coordenadas entre −90/90 e −180/180, hash igual ao do arquivo atual) e grava o cache | 400 formato; 409 hash diferente (o arquivo mudou) |
| `GET /backend/v1/mapa/carteira?empresa&classificacao?&responsavel?` | quem lista produtores | — | GeoJSON único com uma feição por propriedade (contorno do cache ou ponto pela latitude/longitude), com `produtor_id`, nome, classificação e responsável | 403 |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-220 | abrir a aba | usa o cache se `geojson_hash` = hash do arquivo; senão lê o arquivo, converte, envia o cache | sem arquivo → mostra o ponto, se houver, e "Sem arquivo KML: anexe na propriedade" | P13 |
| RN-221 | KMZ | abre o primeiro `.kml` do zip | zip sem `.kml` → erro de leitura | P13 |
| RN-222 | área | soma das áreas dos polígonos da propriedade; diferença > 10% de `area_ha` → selo | `area_ha` vazio → sem selo | P13 |
| RN-223 | mapa da carteira | só propriedades de produtores que o usuário pode listar, na empresa ativa; nunca da outra empresa | — | P2 |
| RN-224 | nomes no mapa | o nome de cada talhão vem do `name` do Placemark; sem nome → "Área 1, 2…" | — | P13 |

## Fluxo e regras

1. **Ficha → aba "Mapa":** mapa em satélite ajustado aos contornos; lista dos talhões com nome e área; troca satélite/mapa; selo de diferença.
2. **Mapa da carteira** (`/mapa`): filtros de classificação e responsável (Gestão/Administrador); legenda; toque abre um cartão com o produtor e "Abrir ficha".

| Cenário | Dado/condição | Resultado esperado | Caminho de erro/recuperação |
|---|---|---|---|
| Principal | KML com 3 talhões | 3 contornos, áreas e total | — |
| Principal | KMZ | mesmo resultado do KML | — |
| Limite | KML só com ponto | marcador | — |
| Limite | arquivo trocado depois do cache | cache refeito (hash) | — |
| Falha | KML inválido | mensagem de leitura | anexar outro |
| Falha | sem internet | aviso; ficha funciona | — |

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC; a emenda de 23/11/2026 da SPEC-3-006 (campo `kml`); `ProdutorFicha.tsx`; `00-INDICE.md` (regras comuns).
2. **Contexto técnico do Skip:** o da SPEC-4-001; arquivo protegido baixado com o token de arquivo do SDK (`pb.files.getToken()`).
3. **Alterar somente:** as superfícies listadas.
4. **Não alterar:** o campo `kml` e as regras de propriedades.
5. **Executar nesta ordem:** (1) leitor `kml.ts` com testes unitários nas fixtures; (2) cache e rota; (3) aba na ficha; (4) mapa da carteira; (5) provas visuais; (6) conferência com os exemplos reais, se tiverem chegado.
6. **Parar e pedir validação quando:** nenhuma parada prevista. Os exemplos reais são pedidos uma vez.
7. **Estado válido ao parar:** a ficha funciona; sem mapa, a aba mostra o aviso.
8. **Ritmo:** construir as tasks vinculadas em sequência, sem pedir autorização nem teste a cada task. Sem teste do cliente (P11): a SPEC fecha pela prova automática. Ponto de aprovação: nenhum.

## Visual

Sistema da SPEC-3-002. Mapa num `Cartao` de cantos arredondados, altura de 60% da tela no celular; contornos com a cor da empresa ativa (token) e preenchimento a 20%; na carteira, cor por classificação vinda dos tokens de status; legenda em `FiltroPilulas`; controles de zoom com toque de 44 px; atribuição visível; estados carregando ("Lendo o mapa…"), vazio ("Nenhuma propriedade com mapa"), erro e sem internet. Vitrine com um mapa fictício (GeoJSON fixo, sem baixar blocos na prova de vitrine).

## Checklist de execução

- [ ] Leitor de KML/KMZ com testes nas fixtures.
- [ ] Cache com hash e rota validada.
- [ ] Aba "Mapa" com áreas e selo.
- [ ] Mapa da carteira com permissões.
- [ ] Capturas, axe-core e evidências em `05_entregas/fase-5/spec-5-003/`.

## Critérios de aceite

- [ ] **CA-5-07:** o leitor converte as fixtures: KML de 3 talhões → 3 polígonos com os nomes; o KMZ equivalente → o mesmo resultado; KML só com ponto → 1 ponto; inválido → erro tratado; a área calculada da fixture bate com a área conhecida com erro < 1%.
- [ ] **CA-5-08:** a aba "Mapa" mostra os contornos e a lista com as áreas, o selo aparece só quando a diferença passa de 10%; trocar o arquivo refaz o cache (409 com hash velho); sem internet, aviso sem quebrar a ficha.
- [ ] **CA-5-09:** o mapa da carteira de `teste.comercial1` traz só os produtores que ele lista no app e nenhum da Teste B; para Gestão, o filtro de responsável funciona; tocar na área abre a ficha certa.

## TDD da SPEC

**Empresas nas provas:** Teste A e Teste B. **Fixtures** em `05_entregas/fase-5/fixtures/kml/`, geradas pelo executor com coordenadas fictícias num município de MS: `fazenda-3-talhoes.kml` (áreas conhecidas de 100, 120 e 98,4 ha), o mesmo em `.kmz`, `so-ponto.kml`, `invalido.kml`; propriedades de teste com `area_ha` de 318 (sem selo) e 250 (com selo).

| Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | leitor (CA-5-07) | testes unitários de `kml.ts` antes do leitor | falham (esperado) | saída |
| GREEN 1 | leitor (CA-5-07) | testes nas 4 fixtures | resultados do CA | saída |
| GREEN 2 | aba (CA-5-08) | navegador automatizado: abrir as duas propriedades; trocar o arquivo e enviar cache com hash antigo; modo offline | contornos e lista; selo só na de 250; 409; aviso | capturas + respostas |
| GREEN 3 | carteira (CA-5-09) | `GET /mapa/carteira` como `teste.comercial1`, `teste.gestao` (com filtro) e `teste.rumo`; tocar numa área | só os listáveis; filtro certo; só Teste B; ficha certa | respostas + captura |
| REFACTOR/REGRESSÃO | regressão e visual | ficha e lista de produtores das fases 1–3; capturas 390×844 e 1280×800 com rolagem horizontal 0; axe-core (o mapa com `aria-label` e lista alternativa dos talhões) | sem diferença; sem falha séria | relatório |

**Caminhos de erro obrigatórios:** KML inválido, KMZ sem KML, arquivo grande, hash velho, sem internet, outro tenant, perfil sem permissão.
**Evidência exigida:** em `05_entregas/fase-5/spec-5-003/`, mais o log do Skip.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-5/spec-5-003/` e o log do Skip. Os KML reais do Diogo só conferem o leitor e não travam a construção.

## Handoff e operação

- **Como demonstrar:** abrir a aba "Mapa" de uma propriedade com KML e o mapa da carteira.
- **Como operar depois:** quem cadastra a propriedade anexa o KML (SPEC-3-006, emenda).
- **Como monitorar:** propriedades com selo de área diferente; erros de leitura em `erros_app`.
- **Pendência conhecida:** CL-PEND-017 (exemplos de KML do Diogo).

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições |
|---|---|---|---|---|---|---|---|
| id pendente | Ver as áreas dos produtores no mapa | Agrospy | SPEC-5-003 | CA-5-07 a CA-5-09 | todas as subtasks | evidências das subtasks | campo KML da SPEC-3-006 no ar |
| id pendente | Desenhar as áreas do KML na ficha do produtor | Agrospy | SPEC-5-003 | CA-5-07, CA-5-08 | RED 1 → GREEN 1 + GREEN 2 | saída + capturas | campo KML |
| id pendente | Mostrar o mapa da carteira | Agrospy | SPEC-5-003 | CA-5-09 | GREEN 3 + REFACTOR | respostas + capturas | aba "Mapa" |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
