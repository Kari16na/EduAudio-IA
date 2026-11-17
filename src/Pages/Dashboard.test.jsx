import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Dashboard from './Dashboard'

describe('Panel principal - Dashboard', () => {
  beforeEach(() => {
    const store = {}

    vi.stubGlobal('localStorage', {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => {
        store[key] = value
      },
      removeItem: (key) => {
        delete store[key]
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k])
      }
    })

    localStorage.setItem('token', 'fake-token')
    localStorage.setItem(
      'user',
      JSON.stringify({ fullName: 'Karina Mendez' })
    )

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }, { id: 2 }])
      })
    )
  })

  it('muestra la sección Subir Documento', () => {
    render(<Dashboard onNavigate={() => {}} />)

    expect(
      screen.getByText(/Subir Documento/i)
    ).toBeInTheDocument()
  })

  it('muestra la sección Mis Audios Recientes', () => {
    render(<Dashboard onNavigate={() => {}} />)

    expect(
      screen.getByText(/Mis Audios Recientes/i)
    ).toBeInTheDocument()
  })

  it('el botón Generar Audio existe pero está deshabilitado sin archivo', () => {
    render(<Dashboard onNavigate={() => {}} />)

    const boton = screen.getByTestId('upload-generate-btn')

    expect(boton).toBeInTheDocument()
    expect(boton).toBeDisabled()
  })

  it('muestra el total de audios traído del servidor', async () => {
    render(<Dashboard onNavigate={() => {}} />)

    await waitFor(() => {
      expect(
        screen.getByTestId('dashboard-audios-count')
      ).toBeInTheDocument()
    })
  })

  it('muestra el nombre del usuario logueado', () => {
    render(<Dashboard onNavigate={() => {}} />)

    expect(
      screen.getByText(/Karina Mendez/i)
    ).toBeInTheDocument()
  })
})