# SPEC-3-002 — Visual de app e navegação

**Fase:** 3
**Status:** planejada
**Dono:** Agrospy (execução com o Maestro) · sem teste humano (P11)
**Origem no escopo:**
- RQ-001 (registro no campo, no celular) e RQ-003 (carteira e multiempresa);
- SPEC-1-004 (app instalável e uso sem internet);
- pedido do consultor de 17/11/2026: "melhora todo o design pra ficar mais parecido com um app mesmo" e "deixar mais bem feito".

**Degrau da solução:** reuso + construção mínima.
- **Reuso:** React, Tailwind, shadcn/ui, Radix, lucide-react e sonner, que já estão no projeto. O service worker e a fila offline também ficam como estão.
- **Construção:** os tokens, a casca do app (`AppShell`), os componentes de `src/components/app/` e a vitrine. Nenhuma dependência nova entra no app.

## Contexto e decisões fechadas

- **Estado atual:** versão no ar 0.0.213. Espelho do código parado na 0.0.120, em `07-sistemas/comercial/codigo/`.
  - **Cabeçalho:** `src/components/Layout.tsx` é uma faixa branca com o logotipo e uma fileira de botões de texto ("Carteira", "Produtores", "Rascunhos", "Linhas de negócio", "Usuários", "Visão do gestor", "Trocar empresa", "Sair"). No celular, essa fileira não cabe e vira rolagem.
  - **Navegação:** não há barra de abas, e o app parece um site.
  - **Confirmação:** "Sair" com pendências usa `window.confirm`.
  - **Telas:** cada uma usa `Card` e `Button` do shadcn com os tokens de fábrica do Skip.
  - **Arquivos de instalação:**
    - o `index.html` está com `lang="en"` e sem `viewport-fit=cover`;
    - o `apple-touch-icon` é SVG, formato que o iPhone ignora;
    - o manifesto só tem o ícone SVG e o `favicon.ico`.
  - **Mensagens:** convivem dois sistemas, o `Toaster` (`useToast`) e o `Sonner`.
- **Estado desejado:** o app abre como um aplicativo de celular.
  - **No celular (até 1023px):**
    - barra de abas fixa embaixo, com um botão central "+" para registrar;
    - cabeçalho com saudação e a empresa ativa em pílula;
    - cartões de vidro fosco sobre um fundo claro em degradê;
    - folhas que sobem de baixo no lugar de janelas.
  - **No computador (a partir de 1024px):** menu lateral com seções, abas em pílula no topo e os mesmos cartões.
  - **Cor:** a da empresa ativa (Agrospy verde, Rumo Agro azul-petróleo).
  - **Referência:** só de estilo, um painel claro de vidro fosco com navegação em pílulas, saudação com data, faixa de números com mini gráfico de pontos, cartão de destaque em degradê e listas com ícone em círculo. Não copiar texto, marca nem conteúdo da referência.
- **Decisões já fechadas:**
  - **Tema:** um só, claro (`color-scheme: light`). Não há tema escuro.
  - **Fonte:** a do sistema do aparelho: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
    - É o que faz a tela parecer app nativo (SF no iPhone, Roboto no Android).
    - Não depende de download, então funciona sem internet.
    - Números com `tabular-nums`; títulos com `tracking-tight`.
  - **Ícones:** `lucide-react`, traço de 1,75px.
  - **Mensagens:** só o `sonner`, no topo, centralizado, abaixo da área segura. A migração das telas e a retirada do `Toaster` antigo são da SPEC-3-003. Esta SPEC usa só `sonner` no que cria.
  - **Confirmações:** sempre na `Folha`, com variante de confirmação. Nunca `window.confirm` nem `alert`.
  - **Cor da empresa:** vem de `empresas.cor_primaria`, que já existe. As duas empresas têm tema fechado na tabela "Temas por empresa". Uma empresa nova com outra cor recebe o tema pela regra de derivação.
  - **Rotas:** os caminhos atuais não mudam, porque avisos e assistente geram links para eles. A casca troca só o que está em volta do `Outlet`.
- **Bloqueios:** nenhum.

## Resultado observável

- **No celular:**
  - todas as telas logadas abrem dentro do `AppShell`;
  - embaixo, a barra de abas: Hoje, Produtores, "+", Avisos (com contador) e Mais;
  - no topo, a saudação ("Bom dia, Diogo"), a data ("terça-feira, 17 de novembro") e a pílula da empresa ativa, que troca a empresa numa folha;
  - o "+" abre uma folha com as ações de registro que o perfil pode fazer.
- **No computador:** menu lateral com seções, abas em pílula no topo e, à direita, o assistente, o sino de avisos e o menu da conta.
- **Ao trocar de empresa:** a cor de destaque, o cartão de destaque, os gráficos e a cor da barra do navegador mudam juntos.
- **Instalação:** o app instala com ícone próprio em PNG (Android e iPhone) e abre sem barra de navegador.
- **Vitrine:** `/vitrine` mostra, sem login e com dados fictícios, a casca nos dois tamanhos e nas duas empresas e cada componente em todos os estados.

## Limites e dependências

- **Inclui:**
  - tokens e utilitários de `src/main.css`, mais o `tailwind.config`;
  - `src/lib/cores.ts`, `src/lib/tema.ts`, `src/lib/formato.ts` e `src/lib/saudacao.ts`;
  - `src/components/app/*` e a troca do `Layout` pelo `AppShell` no `App.tsx`;
  - `src/components/app/navegacao.ts`, a fonte única da tabela "Navegação por perfil";
  - `src/components/ui/input.tsx`, `textarea.tsx` e `select.tsx`, só para a fonte de 16px, a altura e o raio dos campos;
  - `index.html`, `public/manifest.webmanifest` e os ícones PNG;
  - `src/pages/Vitrine.tsx` e `src/fixtures/vitrine.ts`;
  - as ferramentas de prova em `07-sistemas/comercial/tools/`.
- **Fora de escopo:**
  - o conteúdo das telas, que é da SPEC-3-003. Nesta SPEC as telas entram na casca nova com o conteúdo antigo;
  - regras de acesso, hooks, migrações, coleções e dados;
  - a estratégia de cache do service worker e a lógica da fila offline;
  - telas novas de funil e painéis, que são de outras SPECs da fase e usam estes componentes.
- **Entradas e pré-condições:**
  - conector do Skip 64376 funcionando, o mesmo das fases 1 e 2;
  - logotipo da Agrospy em `src/assets/logo-agrospy.svg`;
  - logotipo da Rumo Agro no campo `logo` da empresa.
- **Saídas e artefatos:**
  - **no Skip:** os arquivos de "Inclui";
  - **no repositório:** `07-sistemas/comercial/tools/` e as evidências em `05_entregas/fase-3/spec-3-002/`.
- **Dependências e responsáveis:** a Agrospy executa com o Maestro. Nada depende de ação do Diogo.
- **Atores e permissões mínimas:**
  - **Itens de navegação por perfil:** seguem a tabela "Navegação por perfil" desta SPEC, que repete as condições do `Layout` atual e já prevê os itens das SPECs 3-004 a 3-006.
    - O Operador não tem "Hoje" nem "Rascunhos".
    - "Visão do gestor" é só para Gestão e Administrador.
    - "Linhas de negócio", "Usuários" e "Pasta do Drive" são só para Administrador.
  - **Vitrine:** `/vitrine` é pública e não chama o backend.
- **Superfícies afetadas:** frontend do Skip 64376. Nenhum hook nem migração.
- **Risco e plano B:**
  - **`backdrop-filter`:** se o navegador não suportar, `.vidro` cai para `bg-card` sólido, sem perda de leitura.
  - **Folha:** se `components/ui/drawer` não existir no projeto, ela é feita com o `Dialog` do Radix posicionado embaixo.
  - **Casca antiga em cache:** se o service worker servir a casca antiga depois da publicação, sobe só o nome ou a versão do cache no `sw.js`, sem mudar a estratégia, e isso é registrado.
- **Rollback:** voltar a versão anterior do Skip. Nenhum dado é alterado. O `Layout.tsx` antigo fica no projeto até o fim da SPEC-3-003.

## Tokens (valores fechados)

Formato HSL em `:root` de `src/main.css` (o CSS global importado em `src/main.tsx`), como os tokens do shadcn. O hex vem entre parênteses só como referência. Não há bloco `.dark`.

| Token | Valor | Uso |
|---|---|---|
| `--fundo-topo` | `193 26.3% 92.5%` (#e8f0f2) | início do degradê da página |
| `--fundo-base` | `86 22.2% 94.7%` (#f2f5ee) | fim do degradê da página |
| `--background` | igual a `--fundo-base` | fundo dos componentes do shadcn |
| `--foreground`, `--card-foreground`, `--popover-foreground`, `--secondary-foreground`, `--accent-foreground` | `157 33.3% 9.4%` (#10201a) | texto |
| `--card` | `100 18.2% 97.8%` (#f8faf7) | cartão sólido e base do vidro |
| `--popover` | `0 0% 100%` | menus e folhas |
| `--primary` | `var(--marca)` | botão principal, pílula ativa, aba ativa |
| `--primary-foreground` | `0 0% 100%` | texto sobre o primário |
| `--secondary` | `0 0% 100%` | botão secundário |
| `--muted` | `140 17.6% 93.3%` (#eaf0ec) | contêiner das pílulas, campos, trilhos |
| `--muted-foreground` | `152 6.3% 38.2%` (#5b6862) | subtítulos, rótulos, eixos |
| `--accent` | igual a `--muted` | hover e pressionado |
| `--border`, `--input` | `140 13.5% 88.8%` (#dfe6e1) | divisórias e bordas de campo |
| `--ring` | `var(--marca)` | foco |
| `--destructive` | `0 53.5% 50.2%` (#c43c3c) | erro e ação destrutiva |
| `--destructive-foreground` | `0 0% 100%` | |
| `--grafico-vazio` | igual a `--border` | ponto vazio do `GraficoPontos` e do `MiniPontos` |
| `--radius` | `1rem` | componentes do shadcn |
| `--chart-1` a `--chart-4` | iguais a `--grafico-1` a `--grafico-4` | compatibilidade com `chart.tsx` |

**Tokens de marca:** valores por empresa, gravados em tempo de execução pelo `AppShell` com `aplicarTema()` de `src/lib/tema.ts`. O valor inicial em `:root` é o da Agrospy.
- **Cor:** `--marca`, `--marca-suave`, `--destaque`.
- **Cartão de destaque:** `--heroi-1`, `--heroi-2`, `--heroi-luz`.
- **Gráficos:** `--grafico-1` a `--grafico-4`.

**No `tailwind.config`:**
- `colors` ganha:
  - `marca`, `marca-suave`, `destaque`, `heroi-1`, `heroi-2`, `heroi-luz`;
  - `grafico-1` a `grafico-4`, `grafico-vazio`, `fundo-topo`, `fundo-base`.
- `borderRadius` ganha `cartao: '1.5rem'` (24px) e `folha: '1.75rem'` (28px).
- `fontFamily.sans` vira a pilha do sistema.

**Contrastes conferidos em 17/11/2026** (WCAG, sobre o cartão `#f8faf7`):
- texto: 16,1:1;
- texto sobre o topo do fundo: 14,6:1;
- cinza dos subtítulos: 5,6:1 sobre o cartão, 5,1:1 sobre o topo do fundo e 5,1:1 sobre `--muted`;
- erro: 4,9:1.

### Temas por empresa (`src/lib/cores.ts`)

| Token | Agrospy (`cor_primaria` #153A1D) | Rumo Agro (`cor_primaria` #304A54) | Mínimo |
|---|---|---|---|
| `--marca` | #153a1d (branco 12,7:1) | #304a54 (branco 9,4:1) | branco ≥ 4,5:1 |
| `--heroi-1` (início do degradê) | #0e2714 (branco 15,9:1) | #273c44 (branco 11,6:1) | branco ≥ 7:1 |
| `--heroi-2` (fim do degradê) | #246332 (branco 7,2:1) | #3b5b67 (branco 7,3:1) | branco ≥ 7:1 |
| `--heroi-luz` (brilho a 30%) | #52d66e | #67a8c1 | decorativo |
| `--destaque` (ponto e coluna atuais) | #389b4e (3,35:1) | #4990ab (3,41:1) | ≥ 3:1 sobre o cartão |
| `--marca-suave` (fundo de ícone e selo) | #e5f6e8 (marca sobre ela 11,3:1) | #e8f0f3 (marca sobre ela 8,1:1) | marca ≥ 4,5:1 |
| `--grafico-1` a `--grafico-4` (do claro ao escuro) | #60c576, #3ba352, #286f38, #153a1d | #85b7cb, #569cb7, #3c778d, #304a54 | o mais claro ≥ 2:1 sobre o cartão; passos visíveis |

**Rampa dos gráficos:** validada com o validador de paletas de dataviz (`validate_palette.js --ordinal --mode light --surface "#f8faf7"`). As duas rampas passaram nas quatro conferências:
- luminosidade em ordem;
- intervalo entre passos ≥ 0,06;
- ponta clara ≥ 2:1 (2,05:1 e 2,08:1);
- matiz único.

**Cores de estado (iguais nas duas empresas):**

| Estado | Cor | Contraste sobre o cartão |
|---|---|---|
| bom | #237a4b | 5,1:1 |
| atenção | #a85d00 | 4,7:1 |
| falha | #c43c3c | 4,9:1 |
| neutro | #66746e | 4,7:1 |

- **Uso com ícone e texto:** atenção e falha ficam próximas para quem tem deuteranopia, e o validador categórico reprova esse par. Por isso, estado nunca aparece só pela cor: sempre com ícone (`CheckCircle2`, `AlertTriangle`, `XCircle`, `Circle`) e texto.
- **Não são cores de série:** estas cores não entram em gráfico como série.

**Regra de derivação para outra cor (`derivarTema(hex)` em `src/lib/tema.ts`, em HSL; C é a cor da empresa):**
1. `--marca`: C, escurecida em passos de 2 pontos de luminosidade até o branco atingir 4,5:1.
2. `--heroi-1`: `--marca` com 5 pontos a menos de luminosidade. Se o branco ainda ficar abaixo de 7:1, escurecer de 1 em 1 ponto até chegar lá.
3. `--heroi-2`: a partir de `--marca`, o ponto mais claro, de 1 em 1 ponto, em que o branco ainda dá ≥ 7:1. Se a própria marca não chega a 7:1, escurecer até chegar.
4. `--heroi-luz`: saturação de C + 15 (máximo 90) e luminosidade 58.
5. `--destaque`: saturação mínima 40, partindo de C e clareada de 1 em 1 ponto enquanto o contraste sobre o cartão continuar ≥ 3,3:1.
6. `--marca-suave`: saturação mínima 30 e luminosidade 93.
7. `--grafico-1` a `--grafico-4`: 4 passos de luminosidade.
   - Os três mais claros usam a saturação mínima 40.
   - O mais claro é o último ponto, clareando de 1 em 1 a partir de C, em que o contraste sobre o cartão ainda é ≥ 2,05:1.
   - O mais escuro é C.
   - Os dois do meio ficam a 1/3 e a 2/3 entre os dois.
8. Se C tiver saturação abaixo de 12%, usar o tema da Agrospy.

Os temas fechados das duas empresas foram gerados por esta regra. O teste confere que a regra reproduz a tabela, com tolerância de 1 unidade por canal RGB por causa do arredondamento. Prova da regra com uma terceira cor, #7A1F5C:
- marca #7a1f5c, branco 9,6:1;
- `--heroi-1` #661a4d, branco 11,5:1;
- `--heroi-2` #9b2775, branco 7,1:1;
- destaque #d65cae, 3,3:1;
- marca sobre a suave #f8e3f1: 7,9:1;
- ponta clara da rampa #e599cc, 2,05:1.

`src/lib/cores.ts` é o único arquivo `.ts` ou `.tsx` com hex. Ele exporta:
- `TEMAS` (as duas colunas da tabela, indexadas pela `cor_primaria` em maiúsculas);
- `ESTADOS` (as cores de estado);
- `GRAFICO_VAZIO`.

`aplicarTema(empresa)` usa `TEMAS[cor_primaria]` ou, se não houver, `derivarTema(cor_primaria)`. Ela grava as variáveis em `document.documentElement` e atualiza o `<meta name="theme-color">` com `--marca`.

### Utilitários de estética (`src/main.css`, `@layer utilities`)

| Classe | O que faz |
|---|---|
| fundo da página | `body` com `background: linear-gradient(180deg, hsl(var(--fundo-topo)) 0%, hsl(var(--fundo-base)) 55%) fixed` |
| `.vidro` | `background: hsl(0 0% 100% / 0.72)`; `backdrop-filter: blur(20px) saturate(1.4)`; borda de 1px `hsl(0 0% 100% / 0.6)`; sombra `0 1px 2px hsl(var(--foreground) / 0.04), 0 8px 24px hsl(var(--foreground) / 0.06)`. Sem suporte a `backdrop-filter`, `background: hsl(var(--card))` |
| `.cartao` | `.vidro` + `rounded-cartao p-4` (no computador, `p-6`) |
| `.cartao-heroi` | `rounded-cartao p-5 text-primary-foreground` (no computador, `p-7`). Fundo `radial-gradient(circle at 85% 20%, hsl(var(--heroi-luz) / 0.30), transparent 45%)` sobre `linear-gradient(135deg, hsl(var(--heroi-1)), hsl(var(--heroi-2)))` |
| `.pilula` | `rounded-full h-11 px-4 text-[15px] font-medium inline-flex items-center gap-2` |
| `.selo` | `inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[13px] font-medium bg-muted` (no `.cartao-heroi`, `bg-primary-foreground/15`) |
| `.icone-circulo` | `inline-flex items-center justify-center rounded-full size-10 bg-marca-suave text-marca` |
| `.divisoria` | `border-t border-border` |
| `.area-segura-topo` / `.area-segura-base` | `padding-top: env(safe-area-inset-top)` / `padding-bottom: env(safe-area-inset-bottom)` |

Movimento: folhas e trocas de aba com 180ms `ease-out`. Com `prefers-reduced-motion: reduce`, não há animação.

### Tipografia, forma e espaço

| Elemento | Celular | Computador |
|---|---|---|
| Saudação (`CabecalhoSaudacao`) | 28px, peso 600, `tracking-tight` | 36px |
| Data da saudação | 15px, `muted-foreground` | 16px |
| Título de tela (`CabecalhoTela`) | 22px, peso 600 | 28px |
| Título de cartão | 17px, peso 600 | 18px |
| Número do cartão de destaque | 44px, peso 600, `tracking-tighter` | 56px |
| Número do `CartaoNumero` | 26px, peso 600 | 30px |
| Texto | 16px | 15px |
| Legenda e rótulo | 13px | 13px |

- **Campos:** `Input`, `Textarea` e `Select` têm sempre 16px de fonte (abaixo disso, o iPhone dá zoom ao tocar). Também têm `h-12 rounded-full` (textarea: `rounded-2xl`), `bg-card` e `px-4`. A busca tem o ícone `Search` à esquerda.
- **Alvos de toque:** todo botão, link e item tocável tem ao menos 44×44px no celular.
- **Botões:**
  - **principal:** pílula `bg-marca text-primary-foreground`, `h-12` no celular e `h-11` no computador;
  - **secundário:** pílula branca com borda;
  - **ação de ícone:** círculo de 44px.
- **Espaço:** grade de 4px.
  - **Margem lateral:** 16px no celular e 24px no computador.
  - **Entre cartões:** 12px no celular e 16px no computador.
  - **Largura máxima do conteúdo:** 1200px.

## Casca do app (`AppShell`)

**Rotas.** O `AppShell` substitui o `Layout` dentro de `RequireEmpresa`. Os caminhos ficam os mesmos de hoje, inclusive os das telas de Avisos, Assistente, Enviar gravação e Pasta do Drive criadas na fase 2. A única rota nova é `/vitrine`, fora de `RequireAuth` e de `RequireEmpresa`. A rota `/mais` é a página do item "Mais".

**Celular (até 1023px):**
- **Barra de abas** fixa embaixo, `.vidro`, com 64px de altura mais a área segura. Cada item tem ícone de 24px e rótulo de 11px; o ativo fica em `text-marca` com uma pílula `bg-marca-suave` atrás do ícone.

  | Perfil | Itens |
  |---|---|
  | Comercial, Gestão, Administrador | Hoje (`House`, `/`) · Produtores (`Users`, `/produtores`) · **+** · Avisos (`Bell`, com contador) · Mais (`Menu`, `/mais`) |
  | Operador | Produtores · **+** · Avisos · Mais |

  - **O "+":** círculo de 56px `bg-marca` com `Plus` em `text-primary-foreground`, elevado 12px acima da barra. Abre a `Folha` "Registrar", com as ações que o perfil já pode fazer hoje:
    - "Registrar visita": escolhe o produtor numa busca e abre `/produtores/:id/visita`;
    - "Gravar pós-visita": o `GravarPosVisita` existente;
    - "Enviar gravação": a tela existente;
    - "Novo produtor": o formulário existente de Produtores.
  - **Contador de Avisos:** usa a contagem de não lidos que a fase 2 já mostra no menu (mesma fonte, mesma consulta). Fica num círculo `bg-destructive` de 18px; acima de 99, mostra "99+".
  - **Página "Mais":** lista de `ListaItem`.
    - Rascunhos, com contador; não aparece para o Operador.
    - Assistente.
    - Pendências de envio.
    - Visão do gestor (Gestão e Administrador).
    - Linhas de negócio, Usuários e Pasta do Drive (Administrador).
    - Trocar empresa.
    - Sair.
- **Cabeçalho:**
  - **na tela Hoje:** `CabecalhoSaudacao`;
  - **nas outras telas:** `CabecalhoTela`, com voltar à esquerda quando a tela não é de aba, título e até duas ações de ícone à direita;
  - **fundo:** transparente sobre o degradê. Ao rolar, vira `.vidro` com a área segura do topo.
- **Conteúdo:** espaço embaixo igual à altura da barra mais a área segura mais 16px, para nada ficar escondido atrás dela.
- **Barra escondida:** some na tela do Assistente e nas telas em passos (Registrar visita, Revisar rascunho), que têm o próprio rodapé fixo.

**Computador (a partir de 1024px):**
- **Menu lateral** de 272px, `.vidro`, `rounded-cartao`, com 16px de margem da borda. De cima para baixo:
  - logotipo da empresa ativa;
  - busca de produtor, que abre `/produtores?busca=`;
  - seções com título de 13px em `muted-foreground`:

    | Seção | Itens |
    |---|---|
    | Principal | Hoje, Produtores, Rascunhos, Avisos, Assistente |
    | Gestão | Visão do gestor |
    | Administração | Linhas de negócio, Usuários, Pasta do Drive |
    | Conta | Trocar empresa, Sair |

  - O item ativo fica em pílula `bg-card` com texto em peso 500.
  - Os itens seguem as mesmas condições de perfil do celular.
- **Topo do conteúdo:**
  - **à esquerda:** abas em pílula para Hoje, Produtores, Rascunhos e Avisos. Cada aba tem ícone num círculo de 32px; a ativa fica `bg-card` com ícone num círculo `bg-marca`;
  - **à direita:** círculos de 44px para o Assistente (`MessageCircle`) e Avisos (`Bell`, com ponto de não lido), e o avatar com as iniciais, que abre o menu da conta (nome, e-mail, perfil, "Trocar empresa", "Sair");
  - **embaixo:** o `CabecalhoSaudacao` (na tela Hoje) ou o `CabecalhoTela`.
- **"+":** vira o botão `BotaoPrimario` "Registrar", com ícone `Plus`, na linha do cabeçalho. Abre as mesmas ações em `Folha`, que no computador é um diálogo centralizado de 480px.

**Saudação (`src/lib/saudacao.ts`, no horário de Brasília):**
- "Bom dia" das 5h às 11h59;
- "Boa tarde" das 12h às 17h59;
- "Boa noite" no resto do dia.

Depois vem o primeiro nome do usuário. A data é por extenso em pt-BR, com a primeira letra minúscula ("terça-feira, 17 de novembro"), via `date-fns` com `ptBR`, ou `Intl` no navegador.

**Empresa ativa:** pílula com o logotipo (24px), o nome e `ChevronDown`. Abre a `TrocaEmpresa`, uma `Folha` com as empresas do usuário (logotipo, nome, perfil e marca na atual).
- **Ao escolher:** segue a regra RN-05 existente (`empresasService.setAtiva`, que limpa os dados da anterior), aplica o tema e volta para a tela inicial do perfil.
- **Uma empresa só:** a pílula mostra só o nome, sem abrir nada.

**Sair:** com registros na fila offline, abre uma `Folha` de confirmação ("Há N registro(s) não enviado(s). Sair assim mesmo? A fila continua guardada para este usuário.") com "Sair" (destrutivo) e "Cancelar". A lógica atual da fila não muda.

**Sem internet:** o `IndicadorConexao` atual vira `AvisoTopo` do tipo `offline` ou `pendentes`, logo abaixo do cabeçalho. A lógica de contagem e o "Sincronizar agora" não mudam.

### Navegação por perfil (fonte única)

Esta tabela é a fonte dos itens da barra de abas, da página "Mais" e do menu lateral. Ela vive no código como `NAVEGACAO`, em `src/components/app/navegacao.ts`, que o `AppShell` lê. As SPECs 3-004 a 3-006 acrescentam as linhas delas nesse mesmo arquivo, sem mexer no `AppShell`. Uma linha só entra no menu quando a rota dela existe no `App.tsx`.

| Item | Rota | Celular | Computador (seção) | Administrador | Gestão | Comercial | Operador | Entra em |
|---|---|---|---|---|---|---|---|---|
| Hoje | `/` | aba | Principal, aba em pílula | sim | sim | sim | não | SPEC-3-002 |
| Produtores | `/produtores` | aba | Principal, aba em pílula | sim | sim | sim | sim | SPEC-3-002 |
| Registrar | folha "Registrar" | botão "+" | botão "Registrar" | sim | sim | sim | sim (só as ações que já pode hoje) | SPEC-3-002 |
| Avisos | caminho atual da fase 2 | aba com contador | Principal, aba em pílula | sim | sim | sim | sim | SPEC-3-002 |
| Rascunhos | `/rascunhos` | Mais | Principal, aba em pílula | sim | sim | sim | não | SPEC-3-002 |
| Assistente | caminho atual da fase 2 | Mais | Principal e ícone no topo | sim | sim | sim | sim | SPEC-3-002 |
| Pendências de envio | `/pendencias` | Mais | Principal | sim | sim | sim | sim | SPEC-3-002 |
| Prioridades | `/prioridades` | Mais | Principal | sim | sim | sim | não | SPEC-3-005 |
| Serviços | `/servicos` | Mais | Principal | sim | sim | sim (só vê) | sim | SPEC-3-004 |
| Visão do gestor | `/visao-gestor` | Mais | Gestão | sim | sim | não | não | SPEC-3-002; sai na SPEC-3-005 |
| Painel | `/painel` | Mais | Gestão | sim | sim | sim (própria carteira) | não | SPEC-3-005 |
| Configurações comerciais | `/config/funil`, `/config/motivos`, `/config/etapas-servico`, `/config/comercial` | Mais | Administração | sim | não | não | não | SPEC-3-004 (a SPEC-3-005 acrescenta `/config/comercial`) |
| Importar carteira | `/importar` | Mais | Administração | sim | não | não | não | SPEC-3-006 |
| Produtores em comum | `/config/produtores-em-comum` | Mais | Administração | só quem é Administrador em mais de uma empresa | não | não | não | SPEC-3-006 |
| Linhas de negócio | `/linhas-negocio` | Mais | Administração | sim | não | não | não | SPEC-3-002 |
| Usuários | `/usuarios` | Mais | Administração | sim | não | não | não | SPEC-3-002 |
| Pasta do Drive | caminho atual da fase 2 | Mais | Administração | sim | não | não | não | SPEC-3-002 |
| Trocar empresa e Sair | — | Mais | Conta | sim | sim | sim | sim | SPEC-3-002 |

A barra de abas, a página "Mais" e as seções do menu lateral descritas acima são esta tabela vista pelo perfil. Se houver diferença, vale a tabela.

## Componentes (contrato)

Ficam em `src/components/app/`. Todos recebem dados por props, não chamam o backend e têm variante de carregando (`carregando?: boolean`). A exceção é o `AppShell`, que no modo `app` lê usuário, perfil, empresas e contadores pelos serviços existentes. No modo `vitrine`, recebe tudo por props (`dadosVitrine`).

| Componente | Props | Visual |
|---|---|---|
| `AppShell` | `modo?: 'app' \| 'vitrine'`, `dadosVitrine?` | a seção "Casca do app" |
| `CabecalhoSaudacao` | `nome`, `empresa: {nome, logoUrl?}`, `empresas: number`, `acoes?` | saudação, data, pílula da empresa e ações de ícone à direita |
| `CabecalhoTela` | `titulo`, `subtitulo?`, `voltar?: string \| true`, `acoes?` | voltar (`ChevronLeft` em círculo de 44px), título, subtítulo de 15px em `muted-foreground` e ações |
| `TrocaEmpresa` | `aberto`, `onFechar`, `empresas`, `atualId`, `onEscolher` | `Folha` com `ListaItem` por empresa |
| `Cartao` | `titulo?`, `acao?: {rotulo, href \| onClick}`, `variante?: 'vidro' \| 'solido'`, `children` | `.cartao`; título de 17px e a ação como link "Ver todos" com `ChevronRight` à direita |
| `CartaoDestaque` | `rotulo`, `valor`, `formato`, `selo?: {tom, texto}`, `segmentos?: {rotulo, valor}[]` (até 4), `rodape?: {rotulo, valor}[]` (até 3), `acao?`, `children?` | `.cartao-heroi`: rótulo de 15px e selo à direita; número grande; `children`, quando houver, logo abaixo do número (ex.: `BarrasFinas` com `embutido` e `tom="heroi"`); barra segmentada de 8px com 3px de folga entre segmentos (branco 100%, 65%, 40% e 20%) e legenda com ponto e valor; `.divisoria` branca a 20%; rodapé com rótulo de 13px e valor de 20px (peso 600) |
| `CartaoNumero` | `rotulo`, `valor`, `formato`, `variacao?: {texto, sentido: 'bom' \| 'ruim' \| 'neutro'}`, `serie?: number[]` | `.cartao`: rótulo de 13px em `muted-foreground` com o selo de variação ao lado (`TrendingUp` ou `TrendingDown` e o texto, na cor de estado); número de 26px; `MiniPontos` à direita quando há `serie` |
| `MiniPontos` | `serie: number[]` (até 12), `niveis = 4`, `rotulo` | matriz de quadradinhos de 6px com cantos de 1,5px e 2px de folga: uma coluna por valor e `niveis` linhas preenchidas de baixo para cima, na proporção do maior. Cores `--grafico-1` a `--grafico-4` por nível; a última coluna em `--destaque`; vazios em `--grafico-vazio`. `role="img"` com `aria-label` dizendo o primeiro, o último e o maior valor |
| `GraficoPontos` | `titulo`, `serie?: {rotulo, valor}[]` ou `series?: {nome, valores: {rotulo, valor}[]}[]` (até 2), `formato`, `niveis = 8`, `indiceDestaque = último`, `embutido?` | `.cartao` (sem ele, com `embutido`) com matriz de pontos de 10px: uma coluna por período, rótulo embaixo (o destacado em `foreground` e peso 600), coluna atual em `--destaque` e as outras na rampa. Com `series`, cada período tem duas meias-colunas lado a lado: a 1ª série em pontos cheios na rampa e a 2ª em pontos vazados (anel de 2px em `--grafico-3`), com legenda que mostra o nome e o marcador de cada série. Dica com os valores ao tocar ou passar o mouse, e "Ver tabela" (`Folha` com a tabela) |
| `BarrasFinas` | `titulo?`, `itens: {rotulo, valor, texto?}[]`, `formato`, `maximo = 6`, `ordenar = true`, `embutido?`, `tom?: 'padrao' \| 'heroi'` | `.cartao` (sem ele, com `embutido`): linhas com rótulo à esquerda, trilho `muted` de 6px com a barra `--marca` arredondada e, à direita, `texto` ou o valor formatado em `tabular-nums`; em ordem decrescente (com `ordenar = false`, na ordem recebida, como as etapas do funil); acima do máximo, "Outros". Com `tom="heroi"`, trilho `primary-foreground/20`, barra e texto `primary-foreground` |
| `ListaItem` | `icone?`, `iniciais?`, `titulo`, `subtitulo?`, `direita?: {valor?, selo?: {tom, texto}}`, `href \| onClick`, `naoLido?` | linha de no mínimo 64px: `.icone-circulo` (ou iniciais no círculo), título de 16px em peso 500 e subtítulo de 13px em `muted-foreground`, com no máximo uma linha cada e reticências; à direita, valor de 15px (peso 600) sobre o selo; `ChevronRight` quando navega; ponto `bg-marca` de 8px quando não lido; `.divisoria` entre itens dentro do cartão |
| `FiltroPilulas` | `opcoes: {valor, rotulo, contador?}[]`, `valor`, `onChange?`, `somenteLeitura?` | contêiner `bg-muted rounded-full p-1` com pílulas de 40px; ativa `bg-marca text-primary-foreground`; com `somenteLeitura` (trilha de etapas ou de passos), sem toque e sem foco, com `aria-current` na atual; contador em `.selo` pequeno; no celular, rola na horizontal dentro do contêiner, sem rolar a página |
| `Selo` | `tom: 'bom' \| 'atencao' \| 'falha' \| 'neutro' \| 'marca'`, `texto`, `icone?` | `.selo` com o ícone do estado na cor do tom e o texto em `foreground` |
| `BotaoPrimario` | `children`, `icone?`, `carregando?`, `fixoNoRodape?`, mais as props do `Button` | pílula `bg-marca text-primary-foreground` e 16px; `carregando` mostra `Loader2` girando e desabilita. `fixoNoRodape` prende no rodapé numa faixa `.vidro` com a área segura e ocupa a largura toda no celular |
| `BotaoSecundario` | as mesmas | pílula branca com borda `border-border` |
| `Folha` | `aberto`, `onFechar`, `titulo`, `descricao?`, `acoes?`, `variante?: 'padrao' \| 'confirmar'`, `lado?: 'auto' \| 'lateral'`, `children` | **no celular (qualquer `lado`):** sobe de baixo, `rounded-t-folha`, com alça de 36×4px no topo, altura máxima de 90% e área segura embaixo; fecha arrastando para baixo, tocando fora ou com Esc. **No computador, `lado="auto"` (padrão):** diálogo central de 480px. **No computador, `lado="lateral"`:** painel de 440px preso à direita, na altura toda, fundo `popover`, para formulários longos. **`confirmar`:** botão destrutivo e "Cancelar" |
| `EstadoVazio` | `icone`, `titulo`, `texto`, `acao?` | dentro de `.cartao`: `.icone-circulo` de 56px, título de 17px e texto em `muted-foreground` |
| `EstadoErro` | `titulo`, `texto`, `onTentar` | como `EstadoVazio`, com o ícone `AlertTriangle` em tom de falha e o `BotaoSecundario` "Tentar de novo" |
| `Esqueleto` | `forma: 'destaque' \| 'numero' \| 'lista' \| 'cartao'`, `linhas?` | `Skeleton` com `rounded-cartao` no formato de cada componente |
| `AvisoTopo` | `tipo: 'offline' \| 'pendentes' \| 'info' \| 'erro'`, `texto`, `acao?` | faixa `rounded-full` de 44px com ícone: `WifiOff` (offline), `CloudUpload` (pendentes), `Info` e `AlertTriangle` |

**`src/lib/formato.ts`:** TypeScript puro, sem import de `@/`, sem JSX e sem dependência.
- **Datas:**
  - `data` (dd/mm/aaaa);
  - `dataCurta` ("17 nov");
  - `dataRelativa` ("hoje", "amanhã", "ontem", "em 3 dias", "há 3 dias"), sempre no fuso de Brasília (UTC−3, fixo);
  - `hora` (hh:mm).
- **Números:**
  - `numero`;
  - `moeda` ("R$ 12.345", sem centavos a partir de R$ 1.000; "R$ 87,40" abaixo disso);
  - `percentual` (1 casa);
  - `variacao(agora, antes)` ("+3", "−2", "igual").
- **Texto:** `iniciais(nome)`.

## Instalação no celular (PWA)

- **`index.html`:**
  - `lang="pt-BR"`;
  - `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`;
  - `apple-mobile-web-app-status-bar-style` = `default`;
  - `theme-color` inicial #153a1d;
  - `apple-touch-icon` apontando para `/icones/apple-touch-icon.png`.
- **`public/manifest.webmanifest`:**
  - `lang: "pt-BR"`, `display: "standalone"`, `orientation: "portrait"`;
  - `background_color: "#f2f5ee"`, `theme_color: "#153a1d"`;
  - `start_url: "/"`, `scope: "/"`;
  - ícones PNG `/icones/icone-192.png` (192×192), `/icones/icone-512.png` (512×512) e `/icones/icone-maskable-512.png` (512×512, `purpose: "maskable"`, logotipo em 60% da área sobre fundo #153a1d);
  - o SVG atual continua como ícone `any`.
- **Ícones:**
  - gerados a partir de `logo-agrospy.svg`, com o logotipo branco centralizado sobre #153a1d e cantos retos (o sistema arredonda);
  - `apple-touch-icon.png` com 180×180;
  - o ícone do app é o da Agrospy para as duas empresas.
- **Service worker:** a estratégia não muda. Depois da publicação, conferir que a casca nova chega a uma instalação existente. Se não chegar, aplicar o plano B de "Risco e plano B".

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Autenticação/permissão | Timeout/retry/idempotência | Tratamento de erro |
|---|---|---|---|---|---|
| `empresas` → tema | Skip (`empresas.cor_primaria`, `logo`) | hex em maiúsculas | sessão do usuário (já usada hoje) | leitura única por troca de empresa | cor inválida ou ausente: tema da Agrospy |
| contadores (avisos não lidos, rascunhos, fila offline) | serviços existentes da fase 2 e da fila offline | número | sessão | atualiza ao trocar de rota e ao voltar a ficar online | falha: o contador some, sem erro na tela |
| `/vitrine` | `src/fixtures/vitrine.ts` | dados fictícios | pública | — | — |

| Regra de negócio | Condição | Ação/resultado | Exceção | Fonte |
|---|---|---|---|---|
| RN-55 | empresa ativa com `cor_primaria` da tabela | tema fechado da tabela | — | esta SPEC |
| RN-56 | outra cor | `derivarTema` com os mínimos | saturação < 12%: tema da Agrospy | esta SPEC |
| RN-57 | item de navegação | aparece só para os perfis que hoje já o veem | — | `Layout.tsx` da fase 1 |
| RN-58 | sair com fila offline | confirmação na `Folha` | fila vazia: sai direto | RN-24 (fase 1) |

## Fluxo e regras

| Cenário | Dado ou condição | Resultado esperado | Caminho de erro ou recuperação |
|---|---|---|---|
| Principal | vitrine, celular 390×844, Comercial, Agrospy | barra de abas com 5 itens e Hoje ativo; "Bom dia, Diogo" e a data; pílula "Agrospy"; o "+" abre a folha "Registrar" | — |
| Troca de empresa | vitrine, trocar para Rumo Agro | marca, destaque, cartão de destaque, rampa e `theme-color` passam aos valores da Rumo | cor fora da tabela: derivada; sem cor: Agrospy |
| Operador | vitrine, perfil Operador | barra sem "Hoje"; "Mais" sem Rascunhos | a rota continua protegida como hoje |
| Computador | vitrine, 1280×800, Administrador | menu lateral com as 4 seções; abas em pílula; assistente, sino e avatar à direita; botão "Registrar" | — |
| Limite | lista longa e nome grande de empresa | reticências no nome; nada passa da largura; conteúdo não fica sob a barra | — |
| Falha | serviço de contador falha | contador some; a navegação funciona | — |
| Sem internet | rede desligada | `AvisoTopo` offline; navegação entre telas já carregadas funciona | ao religar, a fila envia como hoje |

## Provas: espelho e ferramentas

1. **Espelho antes de toda prova:** atualizar `07-sistemas/comercial/codigo/` com todos os arquivos do Skip, inclusive `pocketbase/`, pela regra da SPEC-3-001: cópia de tudo o que está no Skip, sem apagar pasta do espelho, e migração já aplicada nunca é editada. As ferramentas leem dessa pasta.
2. **`07-sistemas/comercial/tools/package.json`:** `playwright` 1.49.1 e `@axe-core/playwright` 4.10.1, versões fixas.
3. **`tools/verificar_visual.mjs <pasta-src> [--so caminho …]`** falha quando, fora de `components/ui/`, encontra:
   - classe de cor fixa: `(bg|text|border|ring|fill|stroke|from|via|to|divide|outline|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}`, ou `(bg|text|border|ring|fill|stroke)-(white|black)\b` em qualquer arquivo. Texto e fundo brancos vêm dos tokens (`text-primary-foreground`, `bg-popover`, `bg-secondary`);
   - hex fora de `lib/cores.ts` e do CSS global;
   - `window.confirm(`, `confirm(` ou `alert(`;
   - `useToast` em arquivo criado ou alterado por esta SPEC.

   Ele também confere:
   - os tokens neutros do CSS contra a tabela "Tokens";
   - `TEMAS` contra a tabela "Temas por empresa";
   - os mínimos de contraste de cada tema, recalculados (WCAG);
   - `derivarTema('#153A1D')` e `derivarTema('#304A54')` iguais à tabela, e `derivarTema('#7A1F5C')` dentro dos mínimos;
   - `index.html` com `lang="pt-BR"` e `viewport-fit=cover`;
   - o manifesto com os três PNG, `display`, `lang` e `start_url`;
   - os PNG existentes com as dimensões declaradas;
   - `components/ui/input.tsx`, `textarea.tsx` e `select.tsx` com fonte de 16px no celular.
4. **`tools/capturar_vitrine.mjs <url>`:**
   - **URL padrão:** a prévia do projeto registrada em `07-sistemas/comercial/plataforma.md`. Sem prévia, a produção `https://agrospy-8aca5.goskip.app/vitrine` depois da publicação.
   - **Instalação:** `npm ci` e `npx playwright install chromium` dentro de `tools/`.
   - **Percurso:** cada `[data-secao]` em 390×844 (`isMobile`, `hasTouch`, escala 3) e em 1280×800, com as capturas salvas em `05_entregas/fase-3/spec-3-002/telas/`.
   - **Falha quando:**
     - `document.documentElement.scrollWidth > innerWidth`;
     - o axe-core aponta violação `serious` ou `critical`;
     - em 390px, algum `button`, `a` ou `[role=button]` visível da seção mede menos de 44×44px (exceto link dentro de parágrafo marcado `data-alvo-texto`);
     - a `Folha` aberta em 390px não encosta na borda de baixo da tela.
   - **Regressão offline:** com `context.setOffline(true)`, a vitrine mostra o `AvisoTopo` offline.
5. **`tools/tests/*.test.mjs`** (`node --test`), sobre o espelho:
   - `casca_rotas`: os caminhos de rota do `App.tsx` incluem todos os da lista "Rotas existentes" abaixo, e `/vitrine` fica fora dos guardas;
   - `casca_perfis`: compara `NAVEGACAO` (`src/components/app/navegacao.ts`) com `tools/tests/navegacao_esperada.json`, que o executor gera a partir da tabela "Navegação por perfil" e que as SPECs 3-004 a 3-006 atualizam. Para cada linha cuja rota já existe no `App.tsx`, o item existe com os mesmos perfis e o mesmo lugar. Item em `NAVEGACAO` que não está no JSON falha;
   - `vitrine_sem_backend`: `pages/Vitrine.tsx`, `fixtures/vitrine.ts` e o que eles importam não importam `@/services/` nem o cliente do PocketBase;
   - `formato`: as funções de `lib/formato.ts`, com casos de borda (fuso, zero, negativo, "99+").
6. **Plano B das capturas:** se o ambiente do executor não rodar o Playwright, as capturas saem pelo navegador do executor nas duas larguras. O axe é injetado por `https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js` e o resultado de `axe.run()` vai para `axe.json`. O caminho usado é registrado em `05_entregas/fase-3/spec-3-002/README.md`.

**Rotas existentes (não mudam):**
- `/login`, `/escolher-empresa`;
- `/`;
- `/usuarios`, `/produtores`, `/produtores/:id`, `/produtores/:id/visita`;
- `/linhas-negocio`, `/visao-gestor`, `/pendencias`;
- `/rascunhos`, `/rascunhos/:id`;
- os caminhos que a fase 2 criou para Avisos, Assistente, Enviar gravação e Pasta do Drive. O executor copia os caminhos exatos do `App.tsx` do Skip para o teste, antes da primeira alteração.

## Instruções de execução para o Maestro

1. **Ler antes de alterar:** esta SPEC e, no Skip 64376, `src/App.tsx`, `src/components/Layout.tsx`, `src/components/IndicadorConexao.tsx`, o CSS global, o `tailwind.config`, o `index.html`, o `public/manifest.webmanifest` e o `public/sw.js`. O Skip é a fonte executável: espelhe antes e nunca sobrescreva com cópia local antiga.
2. **Contexto técnico do Skip:**
   - migrações só rodam na publicação;
   - hooks em JSVM, sem `Intl` e sem funções no topo do arquivo. Esta SPEC não mexe em hook.
3. **Alterar somente:** os arquivos de "Inclui", com estes limites:
   - no `App.tsx`, só a troca de `Layout` por `AppShell`, a rota `/vitrine` e a rota `/mais`;
   - no `IndicadorConexao`, só a apresentação, que passa a usar `AvisoTopo`;
   - em `components/ui/input.tsx`, `textarea.tsx` e `select.tsx`, só as classes de fonte, altura e raio.
4. **Não alterar:**
   - serviços, hooks, migrações, regras de acesso e coleções;
   - a lógica da fila offline e a estratégia do `sw.js`;
   - o conteúdo das telas, que é da SPEC-3-003.
5. **Executar nesta ordem** (a mesma da tabela de tasks):
   1. tokens, temas e utilitários;
   2. componentes da tabela "Componentes" (menos o `AppShell`), `navegacao.ts`, `formato.ts` e a `/vitrine` com as seções dos componentes;
   3. a casca (`AppShell`, cabeçalhos, `TrocaEmpresa`, "+" e "Mais") e a seção da casca na vitrine, repetindo as capturas;
   4. o PWA e a regressão.
6. **Parar e pedir validação quando:** o conector do Skip estiver fora do ar. Nesse caso, registre e aguarde a volta. Nenhuma outra parada.
7. **Estado válido ao parar:** o app compila, abre e todas as telas atuais funcionam dentro da casca (a nova ou a antiga).
8. **Ritmo:** construir as tasks em sequência, sem pedir autorização nem teste a cada uma. Não há teste do cliente (P11).

## Checklist de execução

- [ ] O espelho de `07-sistemas/comercial/codigo/` está igual ao Skip antes da primeira prova.
- [ ] O CSS global tem exatamente os tokens e utilitários desta SPEC; a fonte é a do sistema; o tema é único e claro.
- [ ] `TEMAS`, `ESTADOS` e `derivarTema` batem com as tabelas; hex só em `lib/cores.ts` e no CSS.
- [ ] O `AppShell` está no lugar do `Layout`, com as abas por perfil, o "+", o "Mais", a saudação, a troca de empresa e o sair com `Folha`.
- [ ] Os componentes de `src/components/app/` cumprem o contrato, e a vitrine os mostra em todos os estados.
- [ ] O PWA tem os PNG, o manifesto, `lang`, `viewport-fit` e `theme-color` por empresa.
- [ ] Verificador, capturas, axe e testes rodaram e foram guardados em `05_entregas/fase-3/spec-3-002/`.

## Critérios de aceite

- [ ] **CA-3-06:** `node tools/verificar_visual.mjs codigo/src --so main.css tailwind.config lib components/app pages/Vitrine.tsx fixtures` passa. Os tokens neutros, os dois temas e as cores de estado batem com as tabelas e passam nos mínimos de contraste. `derivarTema` reproduz os dois temas e mantém os mínimos para `#7A1F5C`.
- [ ] **CA-3-07:** na vitrine, em 390×844:
  - a casca mostra a barra de abas com os itens por perfil (5 para Comercial, Gestão e Administrador; 4 para Operador), o item ativo, o contador de Avisos e o "+";
  - o "+" abre a `Folha` "Registrar" com as ações do perfil;
  - na tela Hoje, o cabeçalho tem a saudação certa para a hora fictícia, a data por extenso e a pílula da empresa;
  - a `TrocaEmpresa` aplica o tema da Rumo Agro;
  - nenhum conteúdo fica atrás da barra.
- [ ] **CA-3-08:** na vitrine, em 1280×800, a casca mostra:
  - o menu lateral com as seções e os itens do Administrador (e sem Administração para Comercial);
  - as abas em pílula;
  - assistente, sino e avatar à direita;
  - o botão "Registrar".

  O teste `casca_rotas` passa: nenhuma rota existente mudou e `/vitrine` é pública.
- [ ] **CA-3-09:** a vitrine mostra todos os componentes da tabela "Componentes" nos estados com dados, carregando, vazio, erro e offline, nas duas empresas. O teste `vitrine_sem_backend` passa.
- [ ] **CA-3-10:** `node tools/capturar_vitrine.mjs` gera as capturas de cada seção em 390×844 e 1280×800. Em 390px, não há rolagem lateral, todo alvo de toque tem ≥ 44×44px e a `Folha` fica ancorada embaixo. Não há violação `serious` nem `critical` do axe-core.
- [ ] **CA-3-11:**
  - o manifesto e o `index.html` passam nas conferências do verificador;
  - na URL publicada, o service worker continua registrado (`navigator.serviceWorker.getRegistration()` não vazio) e a `theme-color` segue a empresa ativa;
  - "Sair" com fila offline usa a `Folha` de confirmação, sem `window.confirm`;
  - o build do Skip passa e o log do Skip fica sem erro novo depois da publicação.

## TDD da SPEC

| Etapa | Prova | Comando ou ação | Resultado esperado | Evidência |
|---|---|---|---|---|
| RED 1 | verificador no código atual | espelhar; `node tools/verificar_visual.mjs codigo/src --so main.css components/Layout.tsx` e conferência do `index.html` | falha: tokens de fábrica, `window.confirm` no `Layout`, `lang="en"`, ícone SVG no `apple-touch-icon` | `05_entregas/fase-3/spec-3-002/verificador-antes.txt` |
| GREEN 1 | tokens e temas (CA-3-06) | verificador com `--so` dos arquivos de tema | passa; contrastes impressos | `spec-3-002/verificador-depois.txt` |
| GREEN 2 | componentes, vitrine e capturas (CA-3-09, CA-3-10) | `node --test tools/tests/vitrine_sem_backend.test.mjs tools/tests/formato.test.mjs`; `node tools/capturar_vitrine.mjs` nas seções dos componentes | passa; capturas sem rolagem lateral, alvos ≥ 44px, axe sem `serious`/`critical` | `spec-3-002/telas/*.png`, `spec-3-002/axe.json` |
| RED 2 | testes da casca antes do `AppShell` | `node --test tools/tests/casca_perfis.test.mjs` | falha: a `/vitrine` já existe, mas não há barra de abas nem `NAVEGACAO` | `spec-3-002/testes-antes.txt` |
| GREEN 3 | casca (CA-3-07, CA-3-08; CA-3-10 de novo) | `node --test tools/tests/*.test.mjs`; vitrine nas seções da casca; `node tools/capturar_vitrine.mjs` de novo, agora com a casca | passa; capturas da casca sem rolagem lateral e axe sem `serious`/`critical` | `spec-3-002/testes-depois.txt`, `spec-3-002/telas/casca-*.png` |
| REFACTOR/REGRESSÃO | PWA, fila e telas antigas (CA-3-11) | (a) verificador no `index.html` e no manifesto; (b) na URL publicada, conferir o registro do service worker e a `theme-color` depois de trocar de empresa; (c) navegar por todas as rotas existentes com a casca nova (logado com um usuário que a fase já usa para prova) e conferir que cada uma abre; (d) com a rede desligada, criar um registro e ver "aguardando envio", depois religar e ver o envio; (e) build e log do Skip | tudo passa; nenhuma tela quebra | `spec-3-002/regressao.txt` |

**Dados e fixtures:** `src/fixtures/vitrine.ts`, com dados fictícios:
- as duas empresas com `cor_primaria` importada de `TEMAS` (`lib/cores.ts`), sem nenhum hex na fixture, e logotipos de exemplo;
- usuários fictícios (`@exemplo.invalid`) nos quatro perfis;
- 6 ações (2 atrasadas, 2 hoje, 2 nos próximos dias);
- 5 produtores com nomes fictícios;
- 4 avisos (2 não lidos), 3 rascunhos e uma série de 6 semanas;
- nenhum dado real de produtor.

**Caminhos de erro obrigatórios:** cor de empresa inválida, contador que falha, sem internet, uma empresa só, Operador, nome longo, `backdrop-filter` ausente (simular removendo a classe).

**Evidência exigida:** os arquivos acima em `05_entregas/fase-3/spec-3-002/`, mais o log do Skip depois da publicação.

## Teste do cliente: Não se aplica

Sem teste humano (P11). Nenhuma task desta SPEC espera teste, demonstração ou "testei, pode seguir" de pessoa. A SPEC fecha pela prova automática do TDD, com as evidências em `05_entregas/fase-3/spec-3-002/` e o log do Skip.

## Handoff e operação

- **Como demonstrar:** abrir `/vitrine` no celular e no computador; trocar de empresa na pílula.
- **Como operar depois:**
  - toda tela nova usa `src/components/app/` e os tokens;
  - cor nova de empresa entra só pela `cor_primaria`;
  - rodar `verificar_visual.mjs` antes de publicar.
- **Como monitorar:** o log do Skip depois de cada publicação; a vitrine continua passando nas capturas.
- **Pendência conhecida:**
  - a tela de abertura do iPhone (`apple-touch-startup-image`) não entra: o iPhone mostra o fundo do manifesto;
  - o ícone do app é o da Agrospy para as duas empresas.

## Tasks vinculadas

| ID | Task | Dono | SPEC | Critério | Recorte da prova | Evidência esperada | Pré-condições | Status |
|---|---|---|---|---|---|---|---|---|
| id pendente | Deixar o app com cara de aplicativo de celular | Agrospy | SPEC-3-002 | CA-3-06 a CA-3-11 | todas as subtasks | evidências das subtasks | conector do Skip | ☐ |
| id pendente | Aplicar as cores, letras e formas do novo visual em cada empresa | Agrospy | SPEC-3-002 | CA-3-06 | RED 1 → GREEN 1 | `verificador-antes.txt`, `verificador-depois.txt` | espelho atualizado | ☐ |
| id pendente | Montar os componentes do app e a vitrine de exemplo | Agrospy | SPEC-3-002 | CA-3-09, CA-3-10 | GREEN 2 | `telas/*.png`, `axe.json` | cores e formas aplicadas | ☐ |
| id pendente | Colocar a barra de abas no celular e o menu lateral no computador | Agrospy | SPEC-3-002 | CA-3-07, CA-3-08 (e CA-3-10 de novo) | RED 2 → GREEN 3 | `testes-antes.txt`, `testes-depois.txt`, `telas/casca-*.png` | componentes e vitrine | ☐ |
| id pendente | Deixar o app instalável com ícone próprio e a cor da empresa | Agrospy | SPEC-3-002 | CA-3-11 | REFACTOR/REGRESSÃO | `regressao.txt` + log do Skip | casca no ar | ☐ |

## Emendas

| Data | Origem do sinal | Micro-spec/task | Motivo |
|---|---|---|---|
| | | | |
