import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Login from './Login'

describe('Formulario de inicio de sesión - Login', () => {

  beforeEach(() => {
    // Simulamos localStorage manualmente (igual que en Dashboard)
    const store = {}
    vi.stubGlobal('localStorage', {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => { store[key] = value },
      removeItem: (key) => { delete store[key] },
      clear: () => { for (const k in store) delete store[k] },
    })

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'fake-token', user: { name: 'Karina' } }),
      })
    )
  })

  it('muestra los campos de correo y contraseña', () => {
    render(<Login onNavigate={() => {}} />)
    expect(screen.getByText(/Correo Electrónico/i)).toBeInTheDocument()
    expect(screen.getByText('Contraseña:')).toBeInTheDocument()
  })

  it('el botón Entrar existe y es clickeable', async () => {
    render(<Login onNavigate={() => {}} />)
    const boton = screen.getByRole('button', { name: /Entrar/i })
    expect(boton).toBeInTheDocument()
    await userEvent.click(boton)
  })

  it('muestra un error si los campos están vacíos', async () => {
    render(<Login onNavigate={() => {}} />)
    const boton = screen.getByRole('button', { name: /Entrar/i })
    await userEvent.click(boton)
    expect(screen.getByText(/Por favor completa todos los campos/i)).toBeInTheDocument()
  })

  it('llama a onNavigate("dashboard") cuando el login es exitoso', async () => {
    const onNavigateMock = vi.fn()
    render(<Login onNavigate={onNavigateMock} />)

    await userEvent.type(screen.getByPlaceholderText(/ejemplo@correo.com/i), 'karina@correo.com')
    await userEvent.type(screen.getByPlaceholderText(/Tu contraseña/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /Entrar/i }))

    await waitFor(() => {
      expect(onNavigateMock).toHaveBeenCalledWith('dashboard')
    })
  })
})