import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma, resetDb, seedUserAndCategory } from './helpers/db'

beforeEach(async () => {
  await resetDb()
})

afterAll(async () => {
  await prisma.$disconnect()
})

// Contrato API03 (docs/especificacao.md) — aplica a RN02 pela API.
describe('DELETE /api/categories/:id (API03)', () => {
  it('exclui categoria sem tarefas, responde 200 e remove do banco', async () => {
    // Arrange
    const categoria = await prisma.category.create({ data: { name: 'estudos' } })

    // Act
    const res = await request(app).delete(`/api/categories/${categoria.id}`)

    // Assert: resposta
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    // Assert: efeito no banco
    expect(await prisma.category.findUnique({ where: { id: categoria.id } })).toBeNull()
  })

  it('impede excluir categoria com uma tarefa: 400 e mantém categoria e tarefa', async () => {
    // Arrange
    const { user, category } = await seedUserAndCategory()
    const tarefa = await prisma.task.create({
      data: { title: 'Entregar relatório', userId: user.id, categoryId: category.id }
    })

    // Act
    const res = await request(app).delete(`/api/categories/${category.id}`)

    // Assert: resposta
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)

    // Assert: efeito no banco (nada foi removido)
    expect(await prisma.category.findUnique({ where: { id: category.id } })).not.toBeNull()
    expect(await prisma.task.findUnique({ where: { id: tarefa.id } })).not.toBeNull()
  })

  // DEFEITO (API03): categoria inexistente responde 500 em vez de 404.
  it.fails('responde 404 para categoria inexistente', async () => {
    const res = await request(app).delete('/api/categories/inexistente')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

// Contrato API04 (docs/especificacao.md) — aplica a RN03 pela API.
describe('POST /api/categories (API04)', () => {
  it('cria categoria com nome inédito, responde 201 e grava no banco', async () => {
    // Act
    const res = await request(app).post('/api/categories').send({ name: 'Estudos' })

    // Assert: resposta
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)

    // Assert: efeito no banco
    expect(await prisma.category.count()).toBe(1)
    expect(await prisma.category.findUnique({ where: { id: res.body.data.id } })).not.toBeNull()
  })

  it('cria categoria com nome parecido, mas diferente após normalizar (valor-limite)', async () => {
    await prisma.category.create({ data: { name: 'trabalho' } })

    const res = await request(app).post('/api/categories').send({ name: 'Trabalhos' })

    expect(res.status).toBe(201)
    expect(await prisma.category.count()).toBe(2)
  })

  async function postarDuplicada(existente: string, novo: string) {
    // Arrange
    await prisma.category.create({ data: { name: existente } })

    // Act
    const res = await request(app).post('/api/categories').send({ name: novo })

    // Assert: resposta
    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)

    // Assert: efeito no banco (nenhuma categoria nova)
    expect(await prisma.category.count()).toBe(1)
  }

  it('responde 409 e não cria categoria com nome idêntico', async () => {
    await postarDuplicada('trabalho', 'trabalho')
  })

  // DEFEITO (API04/RN03): a API não normaliza o nome antes de comparar — só nomes
  // idênticos são recusados; os demais duplicados são criados (201).
  it.fails.each([
    ['exemplo da especificação (maiúsculas e espaços nas pontas)', ' trabalho ', 'Trabalho'],
    ['espaços e tabulação internos', 'trabalho da faculdade', '  Trabalho   da\tFaculdade '],
  ])('responde 409 e não cria categoria duplicada após normalizar: %s', async (_caso, existente, novo) => {
    await postarDuplicada(existente, novo)
  })
})
