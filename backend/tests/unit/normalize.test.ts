import { describe, it, expect } from 'vitest'
import { normalizeName } from '../../src/utils/normalize'

// RN03 — Normalização de nomes (docs/especificacao.md)
describe('normalizeName', () => {
  it('normaliza o exemplo da especificação', () => {
    // Arrange
    const nome = '  Trabalho   da  Faculdade '

    // Act
    const resultado = normalizeName(nome)

    // Assert
    expect(resultado).toBe('trabalho da faculdade')
  })

  it('remove espaços no início e no fim', () => {
    expect(normalizeName('   casa   ')).toBe('casa')
  })

  it('substitui uma sequência de espaços internos por um único espaço', () => {
    expect(normalizeName('a     b')).toBe('a b')
  })

  it('mantém um único espaço interno sem alteração (valor-limite)', () => {
    expect(normalizeName('a b')).toBe('a b')
  })

  it('substitui tabulação interna por um único espaço', () => {
    expect(normalizeName('trabalho\tda\tfaculdade')).toBe('trabalho da faculdade')
  })

  it('substitui quebra de linha interna por um único espaço', () => {
    expect(normalizeName('trabalho\nda\r\nfaculdade')).toBe('trabalho da faculdade')
  })

  it('substitui sequência mista de espaço, tabulação e quebra de linha por um único espaço', () => {
    expect(normalizeName('trabalho \t\n da')).toBe('trabalho da')
  })

  it('remove tabulações e quebras de linha no início e no fim', () => {
    expect(normalizeName('\t\nCasa\n\t')).toBe('casa')
  })

  it('converte letras maiúsculas para minúsculas, inclusive acentuadas', () => {
    expect(normalizeName('ÁGUA E CAFÉ')).toBe('água e café')
  })

  it('mantém sem alteração um nome já normalizado', () => {
    expect(normalizeName('mercado')).toBe('mercado')
  })

  it('retorna string vazia para string vazia (valor-limite)', () => {
    expect(normalizeName('')).toBe('')
  })

  it('retorna string vazia para nome composto apenas de espaços em branco', () => {
    expect(normalizeName(' \t \n ')).toBe('')
  })

  it('considera duplicados nomes que resultam no mesmo nome normalizado', () => {
    // Arrange
    const nomeA = 'Trabalho da Faculdade'
    const nomeB = '  trabalho   DA\tfaculdade  '

    // Act
    const normalizadoA = normalizeName(nomeA)
    const normalizadoB = normalizeName(nomeB)

    // Assert
    expect(normalizadoA).toBe(normalizadoB)
  })
})
