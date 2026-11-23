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
