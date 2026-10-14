# Mapa — comercial (versão Skip 33ba99e / 0.0.66)

## Rotas
| Rota | Página | Componentes principais | Serviços |
|---|---|---|---|
| /login | Login.tsx | Card, Input, Button | authService, vinculosService, empresasService |
| /escolher-empresa | EscolherEmpresa.tsx | Card, botões por empresa | empresasService, authService |
| / (guard RequireEmpresa) | Index.tsx | placeholder do template (a reescrever na task baad9730 — Minha carteira) | — |
| /usuarios (admin) | Usuarios.tsx | tabela de vínculos, dialogs | usuariosService, vinculosService |
| /produtores | Produtores.tsx | lista + busca + cadastro | produtoresService, propriedadesService |
| /produtores/:id | ProdutorFicha.tsx | cards (origem, contato, tecnologia, responsável), visitas, oportunidades com Concluir/Reagendar, propriedades CRUD | produtoresService, visitasService, oportunidadesService, usuariosService |
| /produtores/:id/visita | RegistrarVisita.tsx | formulário curto + áudio (gravar/anexar) + transcrição por voz + destino obrigatório | visitasService, oportunidadesService, linhasNegocioService |
| /linhas-negocio (admin) | LinhasNegocio.tsx | lista + criar/renomear/desativar | linhasNegocioService |
| * | NotFound.tsx | — | — |
| Layout (header identidade + menu + Trocar empresa) | Layout.tsx | Button, logo-agrospy.svg | empresasService, vinculosService |

## Coleções
| Coleção | Campos principais | Regras de acesso (list/view/create/update/delete) |
|---|---|---|
| users (auth) | name, avatar, acesso_* (recalculados) | id = @request.auth.id |
| empresas | nome, slug (único), cor_primaria, logo (file), ativa | list/view: autenticado |
| vinculos | usuario, empresa, perfil (select 4), ativo, nome_exibicao, email | list/view: próprio; create/update: admin da empresa; delete: null |
| produtores | empresa, nome, documento, contato, municipio, origem, indicado_por, responsavel, nivel_tecnologia, tecnologias, arquivado, id_local, criado_por | list/view: da empresa; create: gestao OU comercial (responsável = próprio); update: gestao OU comercial responsável; delete: null |
| propriedades | empresa, produtor, nome, municipio, area_ha, posse, link_maps, lat/lng, id_local | list/view: da empresa; create: da empresa; update/delete: gestao OU comercial responsável |
| eventos | empresa, tipo (troca_responsavel), registro, de/para/por, em | list/view: gestao; resto: null |
| linhas_negocio | empresa, nome, ativa, fixa | list/view: da empresa; create/update: admin; delete: null |
| visitas | empresa, produtor, propriedade, data, responsavel_visita, assuntos_tratados, roteiro opcional, interesses, destino, motivo_sem_oportunidade, audio (file 25MB), id_local | list/view: gestao OU responsável OU responsável do produtor; create: gestao OU comercial (produtor responsável); update: gestao OU responsável; delete: null |
| oportunidades | empresa, produtor, propriedade, linha_negocio, descricao, responsavel, situacao (aberta), proxima_acao, proxima_acao_data, visita_origem, criado_em_aparelho, id_local | list/view: gestao OU responsável; create: gestao OU comercial (responsável próprio); update: gestao OU responsável; delete: null |
| acoes_oportunidade | empresa, oportunidade, tipo (criada/concluida/reagendada), resultado, nova_acao, nova_data, registrado_por, registrado_em, id_local | list/view/create: gestao OU oportunidade.responsavel; update/delete: null (histórico imutável) |

## Hooks (pocketbase/hooks/)
- produtores_hooks.js — documento único por empresa, indicação exige quem indicou, responsável/criado_por padrão, evento de troca de responsável.
- linhas_negocio_hooks.js — linha fixa não desativa.
- oportunidades_hooks.js — responsável padrão do produtor, linha obrigatória da mesma empresa e ativa, empresa imutável.
- visitas_hooks.js — destino obrigatório (+ motivo quando sem_oportunidade), responsável padrão, empresa/produtor imutáveis.
- proxima_acao_vigente.js — a ação nova vira a vigente da oportunidade; concluir exige resultado; recusa data passada na CRIAÇÃO de oportunidade (RN-19, referência UTC — a alinhar a Brasília na task baad9730).

## Componentes reutilizáveis do projeto
- ui/shadcn completo em src/components/ui/ (Card, Dialog, Sheet, Select, Input, Label, Button, Badge, AlertDialog, Toast).
- Layout.tsx: header com logo + cor + nome da empresa ativa + menu por perfil + "Trocar empresa".
- Guards em App.tsx: RequireAuth (sessão), RequireEmpresa (sessão + empresa ativa).
- ErrorBoundary global.

## Padrões observados (nomes, pastas, formatação, mensagens)
- Serviços em src/services/*.ts com interface exportada + objeto `xService`; páginas em src/pages/.
- Datas gravadas ao meio-dia UTC (`${data} 12:00:00.000Z`) e comparadas por string "YYYY-MM-DD" (runtime sem startOfDay).
- Deps de useEffect estáveis por id (getAtiva() devolve objeto novo a cada render — evita loop 429).
- Mensagens de erro em PT-BR com role="alert"; estados carregando/erro/vazio em toda tela.
- Filtro de relations com template string no serviço (`usuario = "${userId}"`).

## Arquivos gerados que não se editam
- src/lib/pocketbase/client.ts, errors.ts, schema.json (gerado), src/components/ui/*, package.json, lockfiles, vite.config.ts, tsconfig*.json, .oxlintrc.json, .skip.config.json.

## Backend
- URL do backend para provas de API: https://agrospy-8aca5.shrd00.internal.goskip.dev (AP-2026-10-08-0935).
- Migrações aplicadas: 0001–0028 (empresas, vinculos, produtores/propriedades/eventos, linhas_negocio + carga, visitas, oportunidades/acoes, fixtures de teste, regras acesso_*, áudio, admin de teste).
