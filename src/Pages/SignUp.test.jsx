import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import SignUp from './SignUp'

describe('Formulario de registro - SignUp', () => {
  it('renderiza el título Crea tu cuenta', () => {
    render(<SignUp />)
    expect(screen.getByText(/Crea tu cuenta/i)).toBeInTheDocument()
  })

  it('el botón Crear cuenta existe y es clickeable', async () => {
    render(<SignUp />)
    const boton = screen.getByRole('button', { name: /Crear cuenta/i })
    expect(boton).toBeInTheDocument()
    await userEvent.click(boton)
  })
})
