import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Users from '../../src/components/Users'
import { api } from '../../src/services/api'

const ana = {
  id: 'u1',
  name: 'Ana Souza',
  email: 'ana@email.com',
  createdAt: '2026-11-01T10:00:00.000Z',
  tasks: [{ id: 't1' }, { id: 't2' }],
}

const bruno = {
  id: 'u2',
  name: 'Bruno Lima',
  email: 'bruno@email.com',
  createdAt: '2026-11-02T10:00:00.000Z',
  tasks: [],
}

// Sem `globals: true` no Vitest, a Testing Library não desmonta os componentes
// automaticamente entre os testes.
afterEach(() => cleanup())

function mockListaDeUsuarios(usuarios: unknown[]) {
  vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: usuarios } } as any)
}

async function linhaDoUsuario(nome: string) {
  return (await screen.findByText(nome)).closest('tr') as HTMLElement
}

describe('Users — carregamento (RF01)', () => {
  it('exibe "Carregando usuários..." enquanto a lista é carregada', () => {
    // Arrange: a promessa nunca resolve, o componente fica carregando
    vi.spyOn(api, 'get').mockReturnValue(new Promise(() => {}))

    // Act
    render(<Users />)

    // Assert
    expect(screen.getByText('Carregando usuários...')).toBeInTheDocument()
  })

  it('remove o texto de carregamento após receber a lista', async () => {
    mockListaDeUsuarios([ana])

    render(<Users />)

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
    expect(screen.queryByText('Carregando usuários...')).not.toBeInTheDocument()
  })
})

describe('Users — listagem (RF02)', () => {
  it('exibe uma linha da tabela por usuário', async () => {
    mockListaDeUsuarios([ana, bruno])

    render(<Users />)
    await screen.findByText('Ana Souza')

    // cabeçalho + 2 usuários
    expect(screen.getAllByRole('row')).toHaveLength(3)
  })

  it('exibe nome, email e quantidade de tarefas na mesma linha', async () => {
    mockListaDeUsuarios([ana])

    render(<Users />)
    const linha = await linhaDoUsuario('Ana Souza')

    expect(within(linha).getByText('ana@email.com')).toBeInTheDocument()
    expect(within(linha).getByRole('cell', { name: '2' })).toBeInTheDocument()
  })

  it.each([
    ['lista de tarefas vazia', { ...bruno, tasks: [] }],
    ['sem o campo tasks', { ...bruno, tasks: undefined }],
  ])('exibe 0 tarefas para usuário com %s', async (_caso, usuario) => {
    mockListaDeUsuarios([usuario])

    render(<Users />)
    const linha = await linhaDoUsuario('Bruno Lima')

    expect(within(linha).getByRole('cell', { name: '0' })).toBeInTheDocument()
  })

  it('não exibe linhas de usuário quando a lista está vazia', async () => {
    mockListaDeUsuarios([])

    render(<Users />)
    await screen.findByRole('button', { name: 'Adicionar Usuário' })

    // apenas o cabeçalho
    expect(screen.getAllByRole('row')).toHaveLength(1)
  })
})

describe('Users — formulário de criação (RF04)', () => {
  it('exibe os campos Nome e Email e o botão Criar ao clicar em "Adicionar Usuário"', async () => {
    // Arrange
    mockListaDeUsuarios([])
    const user = userEvent.setup()
    render(<Users />)

    // Act
    await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))

    // Assert
    expect(screen.getByText('Nome:')).toBeInTheDocument()
    expect(screen.getByText('Email:')).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument()
  })

  it('não exibe o formulário antes de clicar em "Adicionar Usuário"', async () => {
    mockListaDeUsuarios([])

    render(<Users />)
    await screen.findByRole('button', { name: 'Adicionar Usuário' })

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Criar' })).not.toBeInTheDocument()
  })
})

describe('Users — cancelar formulário (RF05)', () => {
  it('fecha o formulário ao clicar em "Cancelar"', async () => {
    // Arrange
    mockListaDeUsuarios([])
    const user = userEvent.setup()
    render(<Users />)
    await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))
    const [nome, email] = screen.getAllByRole('textbox')
    await user.type(nome, 'Carla')
    await user.type(email, 'carla@email.com')

    // Act
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    // Assert
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Criar' })).not.toBeInTheDocument()
  })

  it('limpa os campos digitados: ao reabrir, Nome e Email estão vazios', async () => {
    // Arrange
    mockListaDeUsuarios([])
    const user = userEvent.setup()
    render(<Users />)
    await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))
    const [nome, email] = screen.getAllByRole('textbox')
    await user.type(nome, 'Carla')
    await user.type(email, 'carla@email.com')

    // Act
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Adicionar Usuário' }))

    // Assert
    const [nomeReaberto, emailReaberto] = screen.getAllByRole('textbox')
    expect(nomeReaberto).toHaveValue('')
    expect(emailReaberto).toHaveValue('')
  })
})

describe('Users — edição (RF06)', () => {
  it('abre o formulário preenchido com os dados do usuário da linha', async () => {
    // Arrange
    mockListaDeUsuarios([ana, bruno])
    const user = userEvent.setup()
    render(<Users />)
    const linha = await linhaDoUsuario('Bruno Lima')

    // Act
    await user.click(within(linha).getByRole('button', { name: 'Editar' }))

    // Assert
    const [nome, email] = screen.getAllByRole('textbox')
    expect(nome).toHaveValue('Bruno Lima')
    expect(email).toHaveValue('bruno@email.com')
  })

  it('troca o botão "Criar" por "Atualizar" ao editar', async () => {
    mockListaDeUsuarios([ana])
    const user = userEvent.setup()
    render(<Users />)
    const linha = await linhaDoUsuario('Ana Souza')

    await user.click(within(linha).getByRole('button', { name: 'Editar' }))

    expect(screen.getByRole('button', { name: 'Atualizar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Criar' })).not.toBeInTheDocument()
  })
})

describe('Users — acessibilidade do formulário (RF07)', () => {
  // DEFEITO (RF07): os <label> "Nome:" e "Email:" não estão associados aos campos
  // (sem htmlFor/id), então getByLabelText não encontra os inputs.
  // Testes mantidos conforme a especificação e marcados com it.fails até a correção.
  it.fails.each([
    ['Nome', 'text'],
    ['Email', 'email'],
  ])('localiza o campo %s pelo texto do rótulo', async (rotulo, tipo) => {
    // Arrange
    mockListaDeUsuarios([])
    const user = userEvent.setup()
    render(<Users />)

    // Act
    await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))

    // Assert
    expect(screen.getByLabelText(new RegExp(rotulo, 'i'))).toHaveAttribute('type', tipo)
  })
})
