# CLAUDE.md

Este arquivo fornece orientações para o Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Projeto

SGC (Sistema de Gestão e Controle) — uma SPA em React + TypeScript para gestão de patrimônio, estrutura física, funcionários, materiais, produtos, ordens de serviço e movimentações de estoque. Consome um backend Java separado em `http://localhost:8080/api/v1`.

## Comandos

```bash
npm run dev       # inicia o servidor de desenvolvimento do Vite
npm run build     # tsc -b (project references) seguido de vite build
npm run lint      # eslint .
npm run preview   # visualiza o build de produção
```

Não há test runner configurado neste projeto.

## Arquitetura

**Stack:** React 19 + Vite + TypeScript, Mantine v9 (biblioteca de UI) + Tabler icons, react-router-dom v7, axios, ApexCharts para gráficos. Sem biblioteca de estado global — a autenticação é o único estado transversal, mantido em React Context.

**Fluxo de autenticação:**
- `src/services/api.ts` — instância única do axios (`api`), com `baseURL` fixo em `http://localhost:8080/api/v1`. Um interceptor de request anexa `Authorization: Bearer <token>` lido de `localStorage["@SGC:token"]`. Todo fetch de dados nas páginas usa essa instância diretamente (não há camada de repository/query).
- `src/context/AuthContext.tsx` — `AuthProvider` mantém `user` (persistido em `localStorage["@SGC:user"]`), chama `POST /auth/login`, expõe `signed`/`user`/`login`/`logout`/`loading`.
- `src/hooks/useAuth.ts` — wrapper simples de `useContext` sobre `AuthContext`.
- `src/routes/ProtectedRoute.tsx` — redireciona para `/` (login) quando `!signed`.
- `src/types/auth.ts` — tipos de autenticação compartilhados (`User.role` é `"ADMIN" | "TECHNICIAN" | "USER"`).

**Rotas (`src/routes/index.tsx`):** `/` é a tela pública de login. Todas as demais rotas ficam aninhadas sob um único elemento `ProtectedRoute` + `AppLayout`, de forma que as páginas autenticadas renderizam dentro do `<Outlet />` do `AppLayout`. Caminhos desconhecidos redirecionam para `/`. Ao adicionar uma nova tela: crie a página em `src/pages/<Name>/index.tsx`, exporte um componente `<Name>Screen`, importe e registre em `AppRoutes`, e adicione um item de navegação no `AppLayout` caso deva ser acessível pela sidebar.

**Layout (`src/components/Layout/index.tsx`):** `AppShell` do Mantine com sidebar fixa. Os itens de navegação são `NavLink`s escritos manualmente (sem configuração orientada a dados), comparados contra `location.pathname`; telas relacionadas são agrupadas em `NavLink`s pai colapsáveis (ex.: "Estrutura Física" agrupa `/company`, `/physical-structure`, `/sectors`; "Catálogo e Bens" agrupa `/assets`, `/products`, `/brands`, `/materials`). Siga o mesmo padrão (uma constante `isXActive` com lista de paths + `defaultOpened`) ao adicionar uma nova seção agrupada.

**Convenção de módulo de página:** Cada funcionalidade vive em `src/pages/<Name>/`:
- `index.tsx` exporta `<Name>Screen` e carrega a listagem com `useServerPagination(path, filtros, { sort })` (`src/hooks/useServerPagination.ts`): paginação, busca (`q`, com `useDebouncedValue` de 300 ms) e filtros são feitos **no backend**; não filtre a lista no navegador. Use `pagination.reload()` depois de criar/editar/excluir. Opções de Select de filtro vêm dos cadastros via `useSelectOptions` (o filtro envia o id). Renderiza uma `Table` do Mantine com `Badge`s de status, `ActionIcon`s por linha e `TablePagination` no rodapé.
- `components/<Name>Modal.tsx` (quando existe) é um `Modal` do Mantine + `@mantine/form` (`useForm`) para criação/edição, que busca suas próprias opções de dropdown (ex.: setores, produtos) ao abrir, e chama `POST`/`PUT` no submit, retornando via callbacks `onSuccess`/`onClose` para a tela de listagem.
- Tipos de domínio (ex.: `Asset`, `AssetToEdit`) são definidos localmente no arquivo da página/modal, sem compartilhamento — não há um modelo de domínio central em `src/types` além de auth.
- Listas de apoio (opções de dropdown nos modais) ainda usam `extractData(response)`, que aceita array puro ou página Spring (`{ content: [...] }`) e cai para `[]`.
- Erros da API: use `showFormApiError` (formulários) ou `alertApiError` (ações) de `src/utils/apiError.ts`, que leem o `ProblemDetail` (`detail` e `errors`).

**Convenção de idioma:** Textos de UI e comentários estão em português; nomes de componentes/variáveis/tipos e caminhos de arquivo estão em inglês (explicitado em `src/routes/index.tsx`: "Padrão: Código em Inglês").

**Diretórios vazios/scaffolded:** `src/config/` existe mas está vazio atualmente.
