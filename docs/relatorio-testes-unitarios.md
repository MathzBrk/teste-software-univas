# Relatório — Testes unitários com IA generativa

**Aluno(s):** Matheus Borges
**Ferramenta de IA utilizada:** Claude Code
**Unidades testadas:**
- `backend/src/utils/taskRules.ts` — RN01 (`canTransition`)
- `backend/src/utils/normalize.ts` — RN03 (`normalizeName`)

## 1. Tabela de casos (elaborada antes de usar a IA)

### RN01 — `canTransition(from, to)`

| #  | Entrada (from → to)              | Resultado esperado | Técnica                       | Regra |
|----|----------------------------------|--------------------|-------------------------------|-------|
| 1  | PENDING → IN_PROGRESS            | `true`             | Partição (permitida)          | RN01  |
| 2  | PENDING → CANCELLED              | `true`             | Partição (permitida)          | RN01  |
| 3  | IN_PROGRESS → COMPLETED          | `true`             | Partição (permitida)          | RN01  |
| 4  | IN_PROGRESS → CANCELLED          | `true`             | Partição (permitida)          | RN01  |
| 5  | PENDING → COMPLETED              | `false`            | Partição (não listada)        | RN01  |
| 6  | IN_PROGRESS → PENDING            | `false`            | Partição (não listada/volta)  | RN01  |
| 7  | X → X (os 4 status)              | `false`            | Valor-limite (mesmo status)   | RN01  |
| 8  | COMPLETED → PENDING / IN_PROGRESS / CANCELLED | `false` | Partição (status final) | RN01  |
| 9  | CANCELLED → PENDING / IN_PROGRESS / COMPLETED | `false` | Partição (status final) | RN01  |
| 10 | DONE → IN_PROGRESS               | `false`            | Inválido (origem inexistente) | RN01  |
| 11 | PENDING → DONE                   | `false`            | Inválido (destino inexistente)| RN01  |
| 12 | pending → in_progress            | `false`            | Inválido (minúsculas)         | RN01  |

### RN03 — `normalizeName(name)`

| #  | Entrada                              | Resultado esperado        | Técnica                          | Regra |
|----|--------------------------------------|---------------------------|----------------------------------|-------|
| 1  | `"  Trabalho   da  Faculdade "`      | `"trabalho da faculdade"` | Partição (exemplo da spec)       | RN03  |
| 2  | `"   casa   "`                       | `"casa"`                  | Partição (trim)                  | RN03  |
| 3  | `"a     b"`                          | `"a b"`                   | Partição (vários espaços)        | RN03  |
| 4  | `"a b"`                              | `"a b"`                   | Valor-limite (um espaço)         | RN03  |
| 5  | `"trabalho\tda\tfaculdade"`          | `"trabalho da faculdade"` | Partição (tabulação)             | RN03  |
| 6  | `"trabalho\nda\r\nfaculdade"`        | `"trabalho da faculdade"` | Partição (quebra de linha)       | RN03  |
| 7  | `"trabalho \t\n da"`                 | `"trabalho da"`           | Partição (sequência mista)       | RN03  |
| 8  | `"\t\nCasa\n\t"`                     | `"casa"`                  | Partição (trim de tab/newline)   | RN03  |
| 9  | `"ÁGUA E CAFÉ"`                      | `"água e café"`           | Partição (maiúsculas acentuadas) | RN03  |
| 10 | `"mercado"`                          | `"mercado"`               | Partição (já normalizado)        | RN03  |
| 11 | `""`                                 | `""`                      | Valor-limite (vazio)             | RN03  |
| 12 | `" \t \n "`                          | `""`                      | Valor-limite (só espaços)        | RN03  |
| 13 | `"Trabalho da Faculdade"` vs `"  trabalho   DA\tfaculdade  "` | normalizados iguais | Partição (duplicados) | RN03 |

## 2. Prompt utilizado

```
Contexto: funções canTransition em backend/src/utils/taskRules.ts (regra RN01) e
normalizeName em backend/src/utils/normalize.ts (regra RN03) de docs/especificacao.md.
Use a implementação apenas para conhecer a assinatura das funções.

Tarefa: escreva testes unitários em backend/tests/unit/taskRules.test.ts e
backend/tests/unit/normalize.test.ts, seguindo o modelo de categoryRules.test.ts.

Casos obrigatórios (definidos por mim): as duas tabelas abaixo.
<tabela RN01 da seção 1>
<tabela RN03 da seção 1>

Restrições: siga o AGENTS.md. Não altere src/. Use it.each para os casos em tabela.
Se algum teste falhar, não mude o valor esperado: me avise qual regra foi violada.

Saída: execute npm test e liste cada teste com o caso da tabela que ele verifica.
```

## 3. Revisão do teste gerado

| Problema encontrado no teste gerado | Ajuste solicitado ou realizado |
|-------------------------------------|--------------------------------|
| O teste do caso RN01 #2 (PENDING → CANCELLED) falhou: o código retorna `false`. | Valor esperado mantido (`true`, vem da spec). Teste marcado com `it.fails` e comentário indicando o defeito na RN01. |
| Os casos inválidos (`DONE`, `pending`) não compilam com o tipo `Status`. | Mantidos com `as Status` para simular entrada vinda de fora do domínio (ex.: corpo da requisição). |
| Faltava conferir se tabulação/quebra de linha nas pontas também são removidas (a spec fala em "espaços em branco"). | Adicionado o caso RN03 #8. |
| Checklist conferido: um teste por caso da tabela, asserções com `toBe`, nomes de `it` em português, sem `.skip`/`.only`, `git status` sem alterações em `src/`. | Nenhum ajuste necessário. |

## 4. Resultados

- Testes criados: 32 (19 em `taskRules.test.ts`, 13 em `normalize.test.ts`) | aprovados: 31 | reprovados: 1 (marcado com `it.fails` — defeito RN01)
- Cobertura de linhas da unidade: 100 % em `taskRules.ts` e `normalize.ts` (statements, branches, funções e linhas — `npm run test:coverage`)
- Score de mutação (Stryker, `npm run test:mutation`):

| Arquivo            | Score   | Mortos | Sobreviventes |
|--------------------|---------|--------|---------------|
| `normalize.ts`     | 100 %   | 6      | 0             |
| `taskRules.ts`     | 83,78 % | 31     | 6             |
| `categoryRules.ts` (referência do professor) | 100 % | 4 | 0 |
| **Total `src/utils`** | **87,23 %** | **41** | **6** |

Os 6 sobreviventes estão todos na linha 5 de `taskRules.ts`, a guarda
`if (from === 'COMPLETED' || from === 'CANCELLED') return false`:

| Mutante gerado pelo Stryker                                      | Tipo                  |
|------------------------------------------------------------------|-----------------------|
| `if (false) return false`                                        | ConditionalExpression |
| `if (from === 'COMPLETED' && from === 'CANCELLED') return false` | LogicalOperator       |
| `if (false \|\| from === 'CANCELLED') return false`              | ConditionalExpression |
| `if (from === 'COMPLETED' \|\| false) return false`              | ConditionalExpression |
| `if (from === "" \|\| from === 'CANCELLED') return false`        | StringLiteral         |
| `if (from === 'COMPLETED' \|\| from === "") return false`        | StringLiteral         |

Todos são **mutantes equivalentes**: a guarda é redundante, pois os `if` seguintes só retornam
`true` quando a origem é `PENDING` ou `IN_PROGRESS`. Com ou sem a guarda, `COMPLETED` e
`CANCELLED` sempre resultam em `false`, então nenhum novo caso de teste consegue matá-los
(os casos 8 e 9 da tabela RN01 já verificam esse comportamento). Por isso nenhum caso novo
foi adicionado à tabela a partir dos sobreviventes.

Antes de executar o Stryker, foi feita uma sabotagem manual (mutantes aplicados um por vez), que
chegou à mesma conclusão:

| Unidade        | Mutante                                                        | Resultado   |
|----------------|----------------------------------------------------------------|-------------|
| normalize.ts   | remover `.trim()`                                              | morto       |
| normalize.ts   | remover `.toLowerCase()` / trocar por `.toUpperCase()`         | morto       |
| normalize.ts   | `/\s+/g` → `/\s/g`, `/\S+/g`, `/ +/g`                          | morto       |
| normalize.ts   | `' '` → `''` / remover `.replace(...)`                         | morto       |
| taskRules.ts   | `from === 'PENDING' && to === 'IN_PROGRESS'` → `true` / `\|\|` | morto       |
| taskRules.ts   | `to === 'COMPLETED' \|\| to === 'CANCELLED'` → `&&`            | morto       |
| taskRules.ts   | `from === 'IN_PROGRESS'` → `true`                              | morto       |
| taskRules.ts   | `return true` → `false` / `return false` final → `true`        | morto       |
| taskRules.ts   | remover a guarda `if (from === 'COMPLETED' \|\| from === 'CANCELLED') return false` ou trocá-la por `false` | **sobreviveu** |

Resultado manual: 14 de 16 mutantes mortos. Os 2 sobreviventes são **mutantes equivalentes**:
a guarda de status final é redundante, pois os `if` seguintes já retornam `false` quando a
origem é `COMPLETED` ou `CANCELLED`. Nenhum novo caso de teste consegue matá-los. Os casos
das linhas 8 e 9 da tabela RN01 já cobrem esse comportamento.

## 5. Defeitos encontrados (divergências entre especificação e código)

| Regra | Comportamento especificado | Comportamento observado | Teste que evidencia |
|-------|----------------------------|-------------------------|---------------------|
| RN01  | `PENDING → CANCELLED` é permitido ("uma tarefa pendente pode ser cancelada antes de ser iniciada") | `canTransition('PENDING', 'CANCELLED')` retorna `false` | `taskRules.test.ts` › `permite cancelar uma tarefa pendente antes de ser iniciada` (`it.fails`) |

---

# Aula 11 — Testes unitários do frontend

**Ferramenta de IA utilizada:** Claude Code
**Unidade testada:** `frontend/src/components/Users.tsx` — RF01, RF02, RF04, RF05, RF06 e RF07
(RF03 é coberto pelo teste de referência `Users.error.test.tsx`)

## 1. Tabela de casos (elaborada antes de usar a IA)

| #  | Requisito | Preparação (mock)                                   | Ação do usuário                                   | Resultado esperado                                              |
|----|-----------|-----------------------------------------------------|---------------------------------------------------|-----------------------------------------------------------------|
| 1  | RF01      | `api.get` não resolve (pendente)                    | —                                                 | Texto "Carregando usuários..." visível                          |
| 2  | RF01      | `api.get` devolve 1 usuário                         | —                                                 | Usuário visível e texto de carregamento removido                |
| 3  | RF02      | `api.get` devolve 2 usuários                        | —                                                 | Tabela com 2 linhas de usuário (+ cabeçalho)                    |
| 4  | RF02      | `api.get` devolve Ana com 2 tarefas                 | —                                                 | Nome, email e "2" na mesma linha                                |
| 5  | RF02      | usuário com `tasks: []`                             | —                                                 | "0" na coluna de tarefas (valor-limite)                         |
| 6  | RF02      | usuário sem o campo `tasks`                         | —                                                 | "0" na coluna de tarefas                                        |
| 7  | RF02      | `api.get` devolve lista vazia                       | —                                                 | Nenhuma linha de usuário (só o cabeçalho)                       |
| 8  | RF04      | `api.get` devolve lista vazia                       | Clicar em "Adicionar Usuário"                     | Campos Nome e Email e botão "Criar" visíveis                    |
| 9  | RF04      | `api.get` devolve lista vazia                       | —                                                 | Formulário não aparece antes do clique                          |
| 10 | RF05      | `api.get` devolve lista vazia                       | Abrir, digitar, clicar em "Cancelar"              | Formulário fechado                                              |
| 11 | RF05      | `api.get` devolve lista vazia                       | Abrir, digitar, "Cancelar", abrir de novo         | Campos Nome e Email vazios                                      |
| 12 | RF06      | `api.get` devolve Ana e Bruno                       | Clicar em "Editar" na linha do Bruno              | Formulário preenchido com nome e email do Bruno                 |
| 13 | RF06      | `api.get` devolve Ana                               | Clicar em "Editar"                                | Botão "Atualizar" visível e "Criar" ausente                     |
| 14 | RF07      | `api.get` devolve lista vazia                       | Clicar em "Adicionar Usuário"                     | Campo Nome localizado pelo rótulo (`getByLabelText`)            |
| 15 | RF07      | `api.get` devolve lista vazia                       | Clicar em "Adicionar Usuário"                     | Campo Email localizado pelo rótulo (`getByLabelText`)           |

## 2. Prompt utilizado

```
Contexto: componente frontend/src/components/Users.tsx, requisitos RF01, RF02, RF04,
RF05, RF06 e RF07 de docs/especificacao.md. Use Users.error.test.tsx como modelo.

Tarefa: escreva testes em frontend/tests/unit/Users.test.tsx.

Casos obrigatórios (definidos por mim): a tabela abaixo.
<tabela da seção 1>

Restrições: siga o AGENTS.md. Use getByRole ou getByLabelText e userEvent.
Simule a API com vi.spyOn(api, 'get'). Não altere src/.
Se algum teste não puder passar sem alterar src/, interrompa e explique o motivo.

Saída: execute npm test e relacione cada teste a uma linha da tabela.
```

## 3. Revisão do teste gerado

| Problema encontrado no teste gerado | Ajuste solicitado ou realizado |
|-------------------------------------|--------------------------------|
| Na primeira execução, 11 testes falharam com "Found multiple elements": sem `globals: true` no Vitest, a Testing Library não desmonta o componente entre os testes e as renderizações se acumulam. | Adicionado `afterEach(() => cleanup())` no arquivo de teste. Esse primeiro resultado também fez os testes do RF07 com `it.fails` "passarem" pelo motivo errado. Depois do ajuste, confirmei que eles falham com "no form control was found associated to that label". |
| Os testes do RF07 falham: os `<label>` não estão associados aos campos (sem `htmlFor`/`id`). | Valor esperado mantido (vem da spec). Testes marcados com `it.fails` e comentário indicando o defeito do RF07. |
| Se RF04, RF05 e RF06 localizassem os campos com `getByLabelText`, todos falhariam por causa do defeito do RF07, e as sabotagens desses requisitos não seriam detectadas. | Nesses testes os campos são localizados por `getAllByRole('textbox')` e pelos textos "Nome:"/"Email:". Assim o defeito fica isolado nos testes do RF07. |
| Checklist conferido: sem `container.querySelector`, sem `fireEvent`, sem snapshot, sem `setTimeout`, sem `data-testid`, sem verificar estado interno (`showForm`), `git status` sem alterações em `src/`. | Nenhum ajuste necessário. |

## 4. Resultados

- Testes criados: 15 em `Users.test.tsx` | aprovados: 13 | reprovados: 2 (marcados com `it.fails` — defeito RF07)
- Com o teste de referência (RF03): 16 testes, 14 aprovados e 2 `it.fails`.
- Cobertura de linhas de `Users.tsx`: 66,67 %. As linhas não cobertas são `handleSubmit` (criar/salvar usuário) e `handleDelete`, que não fazem parte dos requisitos desta atividade.

Sabotagem controlada (uma alteração por vez em `Users.tsx`, desfeita antes da próxima):

| Sabotagem em `Users.tsx`                                | Requisito | Detectada? | Testes que falharam |
|---------------------------------------------------------|-----------|------------|---------------------|
| Remover `setShowForm(false)` de `handleCancel`          | RF05      | Sim        | `fecha o formulário ao clicar em "Cancelar"` |
| Trocar o texto `'Criar'` por `'Salvar'`                 | RF04      | Sim        | `exibe os campos Nome e Email e o botão Criar...` |
| Trocar `user.tasks?.length \|\| 0` por `1`              | RF02      | Sim        | `exibe nome, email e quantidade de tarefas na mesma linha`; os dois casos de `exibe 0 tarefas...` |
| Alterar a mensagem de erro de carregamento              | RF03      | Sim        | `exibe mensagem de erro quando a API falha` (teste de referência) |

Resultado: 4 de 4 sabotagens detectadas. Nenhum caso novo precisou entrar na tabela.

## 5. Defeitos encontrados (divergências entre especificação e código)

| Regra | Comportamento especificado | Comportamento observado | Teste que evidencia |
|-------|----------------------------|-------------------------|---------------------|
| RF07  | Todo campo do formulário associado ao seu rótulo, localizável por `getByLabelText` | `<label>Nome:</label>` e `<label>Email:</label>` sem `htmlFor`, e inputs sem `id`: nenhum campo é encontrado pelo rótulo | `Users.test.tsx` › `localiza o campo Nome pelo texto do rótulo` e `localiza o campo Email pelo texto do rótulo` (`it.fails`) |

---

# Aula 12 — Testes de integração

**Ferramenta de IA utilizada:** Claude Code
**Escopo:** backend API03, API04 e API05 (Supertest + PostgreSQL `teste_software_test_db`);
frontend RF08 e RF09 do componente `Users` (Testing Library + MSW).

## 1. Tabela de casos (elaborada antes de usar a IA)

### Backend

| #  | Contrato | Estado inicial                                   | Requisição                                      | Resposta esperada | Efeito no banco                              |
|----|----------|--------------------------------------------------|-------------------------------------------------|-------------------|----------------------------------------------|
| 1  | API03    | Categoria sem tarefas                            | `DELETE /api/categories/:id`                    | `200`             | Categoria removida                           |
| 2  | API03    | Categoria com 1 tarefa                           | `DELETE /api/categories/:id`                    | `400`             | Categoria e tarefa mantidas                  |
| 3  | API03    | Nenhuma categoria                                | `DELETE /api/categories/inexistente`            | `404`             | Nenhum                                       |
| 4  | API04    | Banco vazio                                      | `POST /api/categories` `{ name: "Estudos" }`    | `201`             | 1 categoria criada                           |
| 5  | API04    | Existe `"trabalho"`                              | `POST` `{ name: "Trabalhos" }`                  | `201`             | 2 categorias (valor-limite: nome parecido)   |
| 6  | API04    | Existe `"trabalho"`                              | `POST` `{ name: "trabalho" }`                   | `409`             | Nenhuma categoria criada                     |
| 7  | API04    | Existe `" trabalho "`                            | `POST` `{ name: "Trabalho" }`                   | `409`             | Nenhuma categoria criada                     |
| 8  | API04    | Existe `"trabalho da faculdade"`                 | `POST` `{ name: "  Trabalho   da\tFaculdade " }`| `409`             | Nenhuma categoria criada                     |
| 9  | API05    | Tarefa `PENDING`                                 | `PUT /api/tasks/:id` `{ status: IN_PROGRESS }`  | `200`             | Status gravado `IN_PROGRESS`                 |
| 10 | API05    | Tarefa `PENDING`                                 | `PUT` `{ status: CANCELLED }`                   | `200`             | Status gravado `CANCELLED`                   |
| 11 | API05    | Tarefa `IN_PROGRESS`                             | `PUT` `{ status: COMPLETED }`                   | `200`             | Status gravado `COMPLETED`                   |
| 12 | API05    | Tarefa `IN_PROGRESS`                             | `PUT` `{ status: CANCELLED }`                   | `200`             | Status gravado `CANCELLED`                   |
| 13 | API05    | Tarefa `COMPLETED`                               | `PUT` `{ status: PENDING }`                     | `400`             | Tarefa inalterada                            |
| 14 | API05    | Tarefa `CANCELLED`                               | `PUT` `{ status: IN_PROGRESS }`                 | `400`             | Tarefa inalterada                            |
| 15 | API05    | Tarefa `PENDING`                                 | `PUT` `{ status: COMPLETED }`                   | `400`             | Tarefa inalterada                            |
| 16 | API05    | Nenhuma tarefa                                   | `PUT /api/tasks/inexistente`                    | `404`             | Nenhum                                       |
| 17 | API02    | Ana com 1 tarefa e Bruno sem tarefas             | `GET /api/users`                                | `200` com `count` e `tasks` | Nenhum (leitura) — *caso novo após sabotagem* |
| 18 | API02    | Usuários criados em datas diferentes             | `GET /api/users`                                | `200`, mais recente primeiro | Nenhum (leitura) — *caso novo após sabotagem* |

### Frontend (o "estado inicial" é a resposta definida no handler do MSW)

| #  | Requisito | Handlers MSW                                      | Ação do usuário                          | Resultado esperado                                              |
|----|-----------|---------------------------------------------------|------------------------------------------|-----------------------------------------------------------------|
| 19 | RF08      | `GET` lista vazia; `POST` responde `201`          | Preencher Nome/Email e clicar em "Criar" | Corpo do POST = `{ name, email }` digitados                     |
| 20 | RF08      | idem                                              | idem                                     | Formulário fechado                                              |
| 21 | RF08      | `GET` passa a devolver o usuário criado           | idem                                     | Nova linha na tabela com nome, email e 0 tarefas                |
| 22 | RF09      | `POST` responde `409`                             | Preencher e clicar em "Criar"            | Mensagem "Email já cadastrado"                                  |
| 23 | RF09      | `POST` responde `409`                             | Preencher e clicar em "Criar"            | Formulário aberto, com os dados digitados                       |

## 2. Prompts utilizados

Backend:

```
Contexto: rotas DELETE /api/categories/:id, POST /api/categories e PUT /api/tasks/:id,
contratos API03, API04 e API05 (regras RN01, RN02, RN03 e RN04) de docs/especificacao.md.

Tarefa: escreva testes de integração em backend/tests/integration/categories.int.test.ts
e backend/tests/integration/tasks.int.test.ts, seguindo o modelo de users.int.test.ts.

Casos obrigatórios (definidos por mim): a tabela abaixo, com a coluna "Efeito no banco".
<tabela do backend da seção 1>

Restrições: siga o AGENTS.md (seção Testes de integração). Use request(app) e os helpers
de helpers/db.ts. Não use vi.mock. Não altere src/. Se algum teste falhar, não mude o
valor esperado: me avise qual regra foi violada.

Saída: execute npm run test:integration e relacione cada teste a uma linha da tabela.
```

Frontend:

```
Contexto: componente frontend/src/components/Users.tsx, requisitos RF08 e RF09 e
contrato API01 de docs/especificacao.md. Use Users.load.int.test.tsx como modelo.

Tarefa: escreva testes em frontend/tests/integration/Users.create.int.test.tsx.

Casos obrigatórios (definidos por mim): a tabela abaixo.
<tabela do frontend da seção 1>

Restrições: siga o AGENTS.md. Simule a API com MSW (server.use), sem vi.spyOn(api).
As respostas seguem o contrato { success, data }. Verifique o corpo enviado no POST
com await request.json() no handler. Use getByRole/getByLabelText e userEvent.
Não altere src/.

Saída: execute npm run test:integration e relacione cada teste a uma linha da tabela.
```

## 3. Revisão do teste gerado

| Problema encontrado no teste gerado | Ajuste solicitado ou realizado |
|-------------------------------------|--------------------------------|
| O caso 10 (`PENDING → CANCELLED`) foi marcado com `it.fails` antes de executar, supondo o mesmo defeito do `canTransition` visto nos testes unitários. Na execução, a API aceitou a transição (200), o que está de acordo com a spec. | `it.fails` removido: o teste passa porque a API não valida transição nenhuma (ver defeito da API05). Um `it.fails` só deve ser usado depois de observar a falha. |
| O teste do RF08 "envia o nome e o email..." esperava o novo usuário aparecer na lista antes de verificar o corpo do POST. Por isso falhava também na sabotagem de `fetchUsers()`, que não tem relação com o envio. | Passou a esperar a requisição chegar ao handler (`vi.waitFor`) e verificar só o corpo. |
| O teste "fecha o formulário após a criação" também dependia da lista recarregada para fazer a verificação. | Passou a aguardar diretamente o fechamento do formulário. Agora a sabotagem do `fetchUsers()` derruba só o teste "recarrega a lista". |
| A sabotagem "remover `include: { tasks }` de `getUsers`" não foi detectada: nenhum teste do backend verificava a API02. | Casos 17 e 18 adicionados à tabela e ao arquivo `users.list.int.test.ts`. |
| Sem `globals: true` no Vitest, o DOM não é limpo entre os testes do frontend. | `afterEach(() => cleanup())` no arquivo, como nos testes unitários. |
| Checklist conferido: sem `vi.mock` do Prisma nem `vi.spyOn(api)` (o `vi.spyOn` só silencia o `console`), status + corpo + efeito no banco em cada teste do backend, cenário criado no próprio teste (`resetDb()` no `beforeEach`), `testDatabase.ts` e URL do banco inalterados, handlers no formato do contrato, corpo do POST verificado. | Nenhum ajuste necessário. |

## 4. Resultados

- Backend (`npm run test:integration`): 18 testes criados (+ 2 de referência) | aprovados: 11 (+ 2) | reprovados: 7, marcados com `it.fails` (defeitos abaixo).
- Frontend (`Users.create.int.test.tsx`): 5 testes criados | aprovados: 4 | reprovados: 1 (`it.fails` — RF09).
- Suíte completa do frontend (`npm test`, unitários + integração): 22 testes, 21 aprovados e 1 `it.fails`.
- Cobertura de linhas de `Users.tsx` (unitários + integração): 85,18 % (antes: 66,67 %).
- **RF07 (aula 11):** o defeito foi corrigido no repositório do professor (commit `3a57228`, rótulos com `htmlFor`/`id`). Depois da sincronização, os testes do RF07 passaram a passar, e o `it.fails` foi trocado por `it`. O valor esperado não mudou.

Sabotagem controlada (uma alteração por vez, sempre numa cópia do código, desfeita antes da próxima):

| Sabotagem                                              | Arquivo                   | Regra | Detectada? | Testes que falharam |
|--------------------------------------------------------|---------------------------|-------|------------|---------------------|
| Remover a checagem `canDeleteCategory`                 | `categoryController.ts`   | API03 | Sim        | `impede excluir categoria com uma tarefa: 400 e mantém categoria e tarefa` |
| Trocar o status `409` por `400`                        | `userController.ts`       | API01 | Sim        | `responde 409 ao repetir um email já cadastrado` (referência) |
| Remover `include: { tasks: ... }` de `getUsers`        | `userController.ts`       | API02 | **Não** → depois dos casos 17 e 18: Sim | `responde 200 com count e a lista tasks de cada usuário` |
| Remover `fetchUsers()` após salvar                     | `Users.tsx`               | RF08  | Sim        | `recarrega a lista e exibe o novo usuário na tabela` |

## 5. Defeitos encontrados (divergências entre especificação e código)

| Regra | Comportamento especificado | Comportamento observado | Teste que evidencia |
|-------|----------------------------|-------------------------|---------------------|
| API03 | Categoria inexistente: `404` | `500`: o controller compara a mensagem `'Record to delete does not exist'`, que não corresponde à mensagem do erro P2025 do Prisma 6 | `categories.int.test.ts` › `responde 404 para categoria inexistente` (`it.fails`) |
| API04 / RN03 | Nome que coincide com um existente após normalizar: `409`, nada criado | `201`, categoria duplicada criada: a API não aplica `normalizeName`, só recusa nomes idênticos (restrição `unique` do banco) | `categories.int.test.ts` › `responde 409 e não cria categoria duplicada após normalizar: ...` (2 casos, `it.fails`) |
| API05 / RN04 | Transição proibida pela RN01: `400`, tarefa inalterada | `200`, novo status gravado: `updateTask` não aplica `canTransition` | `tasks.int.test.ts` › `recusa a transição proibida de ...` (3 casos, `it.fails`) |
| API05 | Tarefa inexistente: `404` | `500`: mesma causa da API03 (mensagem `'Record to update not found'`) | `tasks.int.test.ts` › `responde 404 para tarefa inexistente` (`it.fails`) |
| RF09  | Resposta `409` ao criar: mensagem "Email já cadastrado" | Mensagem genérica "Erro ao salvar usuário" | `Users.create.int.test.tsx` › `exibe "Email já cadastrado" quando a API responde 409` (`it.fails`) |
