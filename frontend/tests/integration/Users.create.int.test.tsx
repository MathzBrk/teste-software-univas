import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import Users from '../../src/components/Users'
import { server } from '../msw/server'

// Sem `globals: true` no Vitest, a Testing Library não desmonta os componentes
// automaticamente entre os testes.
afterEach(() => cleanup())

beforeEach(() => {
  // Silencia os logs dos interceptors do Axios e do componente
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

type UsuarioApi = { id: string; name: string; email: string; createdAt: string; tasks: [] }

// "Backend" simulado pelo MSW, no formato dos contratos API01 e API02.
// Guarda os corpos recebidos em POST /api/users para o teste verificar.
function simularApi(opcoes: { respostaPost: 'sucesso' | 'emailDuplicado' }) {
  const usuarios: UsuarioApi[] = []
  const corposRecebidos: unknown[] = []

  server.use(
    http.get('*/api/users', () =>
      HttpResponse.json({ success: true, count: usuarios.length, data: usuarios })
    ),
    http.post('*/api/users', async ({ request }) => {
      const corpo = (await request.json()) as { name: string; email: string }
      corposRecebidos.push(corpo)

      if (opcoes.respostaPost === 'emailDuplicado') {
        return HttpResponse.json({ success: false, error: 'Email already exists' }, { status: 409 })
      }

      const criado: UsuarioApi = {
        id: 'u-novo',
        name: corpo.name,
        email: corpo.email,
        createdAt: '2026-11-20T10:00:00.000Z',
        tasks: [],
      }
      usuarios.unshift(criado)
      return HttpResponse.json({ success: true, data: criado }, { status: 201 })
    })
  )

  return { corposRecebidos }
}

async function preencherECriar(nome: string, email: string) {
  const user = userEvent.setup()
  render(<Users />)
  await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))
  await user.type(screen.getByLabelText(/nome/i), nome)
  await user.type(screen.getByLabelText(/email/i), email)
  await user.click(screen.getByRole('button', { name: 'Criar' }))
}

describe('Users + API — criação de usuário com sucesso (RF08 / API01)', () => {
  it('envia o nome e o email digitados no corpo de POST /api/users', async () => {
    // Arrange
    const api = simularApi({ respostaPost: 'sucesso' })

    // Act
    await preencherECriar('Carla Dias', 'carla@email.com')

    // Assert: corpo da requisição recebido pelo "backend"
    await vi.waitFor(() =>
      expect(api.corposRecebidos).toEqual([{ name: 'Carla Dias', email: 'carla@email.com' }])
    )
  })

  it('fecha o formulário após a criação', async () => {
    simularApi({ respostaPost: 'sucesso' })

    await preencherECriar('Carla Dias', 'carla@email.com')

    await vi.waitFor(() => expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Criar' })).not.toBeInTheDocument()
  })

  it('recarrega a lista e exibe o novo usuário na tabela', async () => {
    // Arrange: a lista começa vazia
    simularApi({ respostaPost: 'sucesso' })

    // Act
    await preencherECriar('Carla Dias', 'carla@email.com')

    // Assert: a nova linha vem do GET feito depois do POST
    const linha = (await screen.findByRole('cell', { name: 'Carla Dias' })).closest('tr')!
    expect(within(linha).getByText('carla@email.com')).toBeInTheDocument()
    expect(within(linha).getByRole('cell', { name: '0' })).toBeInTheDocument()
  })
})

describe('Users + API — email já cadastrado (RF09 / API01)', () => {
  // DEFEITO (RF09): com resposta 409, o componente exibe a mensagem genérica
  // "Erro ao salvar usuário" em vez de "Email já cadastrado".
  // Teste mantido conforme a especificação e marcado com it.fails até a correção.
  it.fails('exibe "Email já cadastrado" quando a API responde 409', async () => {
    simularApi({ respostaPost: 'emailDuplicado' })

    await preencherECriar('Ana Souza', 'ana@email.com')

    expect(await screen.findByText('Email já cadastrado')).toBeInTheDocument()
  })

  it('mantém o formulário aberto com os dados digitados quando a API responde 409', async () => {
    // Arrange
    const api = simularApi({ respostaPost: 'emailDuplicado' })

    // Act
    await preencherECriar('Ana Souza', 'ana@email.com')

    // Assert: a requisição foi feita e o formulário continua com os dados
    await vi.waitFor(() => expect(api.corposRecebidos).toHaveLength(1))
    expect(await screen.findByLabelText(/nome/i)).toHaveValue('Ana Souza')
    expect(screen.getByLabelText(/email/i)).toHaveValue('ana@email.com')
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument()
  })
})
