import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma, resetDb, seedUserAndCategory } from './helpers/db'

type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

async function criarTarefa(status: Status) {
  const { user, category } = await seedUserAndCategory()
  return prisma.task.create({
    data: { title: 'Estudar para a prova', status, userId: user.id, categoryId: category.id }
  })
}

// Contrato API05 (docs/especificacao.md) — aplica a RN01 e a RN04 pela API.
describe('PUT /api/tasks/:id (API05)', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it.each<[Status, Status]>([
    ['PENDING', 'IN_PROGRESS'],
    ['PENDING', 'CANCELLED'],
    ['IN_PROGRESS', 'COMPLETED'],
    ['IN_PROGRESS', 'CANCELLED'],
  ])('aceita a transição permitida de %s para %s: 200 e grava o novo status', async (de, para) => {
    // Arrange
    const tarefa = await criarTarefa(de)

    // Act
    const res = await request(app).put(`/api/tasks/${tarefa.id}`).send({ status: para })

    // Assert: resposta
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe(para)

    // Assert: efeito no banco
    const noBanco = await prisma.task.findUnique({ where: { id: tarefa.id } })
    expect(noBanco?.status).toBe(para)
  })

  // DEFEITO (RN04/API05): a API não aplica a RN01 — aceita (200) e grava transições
  // proibidas. Testes mantidos conforme a especificação e marcados com it.fails.
  it.fails.each<[Status, Status]>([
    ['COMPLETED', 'PENDING'],
    ['CANCELLED', 'IN_PROGRESS'],
    ['PENDING', 'COMPLETED'],
  ])('recusa a transição proibida de %s para %s: 400 e tarefa inalterada', async (de, para) => {
    // Arrange
    const tarefa = await criarTarefa(de)

    // Act
    const res = await request(app).put(`/api/tasks/${tarefa.id}`).send({ status: para })

    // Assert: resposta
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)

    // Assert: efeito no banco (status e demais campos inalterados)
    const noBanco = await prisma.task.findUnique({ where: { id: tarefa.id } })
    expect(noBanco?.status).toBe(de)
    expect(noBanco?.updatedAt).toEqual(tarefa.updatedAt)
  })

  // DEFEITO (API05): tarefa inexistente responde 500 em vez de 404.
  it.fails('responde 404 para tarefa inexistente', async () => {
    const res = await request(app).put('/api/tasks/inexistente').send({ status: 'IN_PROGRESS' })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})
