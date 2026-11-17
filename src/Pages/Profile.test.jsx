import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Perfil from "./Profile";

// Mock NavBar
vi.mock("../Components/NavBar", () => ({
  default: () => <div>NavBar</div>,
}));

// Mock API
vi.mock("../services/api", () => ({
  getAudiosCount: vi.fn(() => Promise.resolve([])),
  updateUserName: vi.fn(),
  changePassword: vi.fn(),
  uploadProfilePhoto: vi.fn(),
  deleteAccount: vi.fn(),
}));

describe("Perfil", () => {
  beforeEach(() => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        fullName: "Karina Romero",
        email: "karina@test.com",
      })
    );

    localStorage.setItem("token", "token-test");
  });

  it("renderiza la información del usuario", () => {
    render(<Perfil />);

    expect(
      screen.getByDisplayValue("Karina Romero")
    ).toBeInTheDocument();

    expect(
      screen.getByText("karina@test.com")
    ).toBeInTheDocument();
  });

  it("muestra el botón Guardar nombre", () => {
    render(<Perfil />);

    expect(
      screen.getByRole("button", {
        name: /guardar nombre/i,
      })
    ).toBeInTheDocument();
  });

  it("permite modificar el nombre", () => {
    render(<Perfil />);

    const input = screen.getByDisplayValue(
      "Karina Romero"
    );

    fireEvent.change(input, {
      target: {
        value: "Karina ADSO",
      },
    });

    expect(input.value).toBe("Karina ADSO");
  });

  it("muestra error si intenta cambiar contraseña con campos vacíos", () => {
    render(<Perfil />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /cambiar contraseña/i,
      })
    );

    expect(
      screen.getByText(
        "Por favor completa todos los campos."
      )
    ).toBeInTheDocument();
  });

  it("valida longitud mínima de contraseña", () => {
    render(<Perfil />);

    fireEvent.change(
      screen.getByPlaceholderText(
        "Tu contraseña actual"
      ),
      {
        target: { value: "12345678" },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "Nueva contraseña"
      ),
      {
        target: { value: "123" },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "Repite la nueva contraseña"
      ),
      {
        target: { value: "123" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /cambiar contraseña/i,
      })
    );

    expect(
      screen.getByText(
        "La nueva contraseña debe tener mínimo 8 caracteres."
      )
    ).toBeInTheDocument();
  });

  it("detecta contraseñas diferentes", () => {
    render(<Perfil />);

    fireEvent.change(
      screen.getByPlaceholderText(
        "Tu contraseña actual"
      ),
      {
        target: { value: "12345678" },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "Nueva contraseña"
      ),
      {
        target: { value: "password123" },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "Repite la nueva contraseña"
      ),
      {
        target: { value: "password456" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /cambiar contraseña/i,
      })
    );

    expect(
      screen.getByText(
        "Las contraseñas nuevas no coinciden."
      )
    ).toBeInTheDocument();
  });

  it("muestra el botón eliminar cuenta", () => {
    render(<Perfil />);

    expect(
      screen.getByRole("button", {
        name: /eliminar mi cuenta/i,
      })
    ).toBeInTheDocument();
  });
});