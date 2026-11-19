import { describe, it, expect } from 'vitest'
import { canTransition, type Status } from '../../src/utils/taskRules'

// RN01 — Transição de status de tarefa (docs/especificacao.md)
describe('canTransition', () => {
  it.each<[Status, Status]>([
    ['PENDING', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'COMPLETED'],
    ['IN_PROGRESS', 'CANCELLED'],
  ])('permite a transição de %s para %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  // DEFEITO (RN01): a especificação permite PENDING → CANCELLED ("uma tarefa pendente
  // pode ser cancelada antes de ser iniciada"), mas canTransition retorna false.
  // Teste mantido conforme a especificação e marcado com it.fails até a correção.
  it.fails('permite cancelar uma tarefa pendente antes de ser iniciada', () => {
    // Arrange
    const from: Status = 'PENDING'
    const to: Status = 'CANCELLED'

    // Act
    const resultado = canTransition(from, to)

    // Assert
    expect(resultado).toBe(true)
  })

  it.each<[Status, Status]>([
    ['PENDING', 'COMPLETED'],
    ['IN_PROGRESS', 'PENDING'],
  ])('impede a transição não listada de %s para %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false)
  })

  it.each<Status>(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])(
    'impede manter o mesmo status %s (não é uma transição)',
    (status) => {
      expect(canTransition(status, status)).toBe(false)
    }
  )

  it.each<Status>(['PENDING', 'IN_PROGRESS', 'CANCELLED'])(
    'impede transição de COMPLETED (status final) para %s',
    (to) => {
      expect(canTransition('COMPLETED', to)).toBe(false)
    }
  )

  it.each<Status>(['PENDING', 'IN_PROGRESS', 'COMPLETED'])(
    'impede transição de CANCELLED (status final) para %s',
    (to) => {
      expect(canTransition('CANCELLED', to)).toBe(false)
    }
  )

  it.each([
    ['DONE', 'IN_PROGRESS'],
    ['PENDING', 'DONE'],
    ['pending', 'in_progress'],
  ])('impede transição envolvendo status inválido (%s → %s)', (from, to) => {
    expect(canTransition(from as Status, to as Status)).toBe(false)
  })
})
