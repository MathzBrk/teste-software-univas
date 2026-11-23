import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma, resetDb, seedUserAndCategory } from './helpers/db'

// Contrato API02 (docs/especificacao.md): GET /api/users.
// Caso adicionado após a sabotagem "remover include: { tasks } de getUsers",
// que não foi detectada por nenhum teste existente.
describe('GET /api/users (API02)', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('responde 200 com count e a lista tasks de cada usuário', async () => {
    // Arrange: Ana com 1 tarefa, Bruno sem tarefas
    const { user: ana, category } = await seedUserAndCategory()
    await prisma.task.create({
      data: { title: 'Entregar relatório', userId: ana.id, categoryId: category.id }
    })
    await prisma.user.create({ data: { name: 'Bruno Lima', email: 'bruno@email.com' } })

    // Act
    const res = await request(app).get('/api/users')

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.count).toBe(2)
    const porEmail = Object.fromEntries(
      res.body.data.map((u: { email: string; tasks: unknown[] }) => [u.email, u.tasks])
    )
    expect(porEmail['ana@email.com']).toHaveLength(1)
    expect(porEmail['bruno@email.com']).toEqual([])
  })

  it('ordena os usuários do mais recente para o mais antigo', async () => {
    // Arrange: datas de criação explícitas, sem depender do relógio
    await prisma.user.create({
      data: { name: 'Antigo', email: 'antigo@email.com', createdAt: new Date('2026-01-01T10:00:00Z') }
    })
    await prisma.user.create({
      data: { name: 'Recente', email: 'recente@email.com', createdAt: new Date('2026-06-01T10:00:00Z') }
    })

    // Act
    const res = await request(app).get('/api/users')

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.data.map((u: { name: string }) => u.name)).toEqual(['Recente', 'Antigo'])
  })
})
