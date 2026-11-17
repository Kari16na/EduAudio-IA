import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ForgotPassword from "./ForgotPassword";

// Mock FormCard
vi.mock("../Components/FormCard", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

// Mock config
vi.mock("../config", () => ({
  API_URL: "http://localhost:3000",
}));

describe("ForgotPassword", () => {
  it("renderiza correctamente el formulario", () => {
    render(<ForgotPassword />);

    expect(
      screen.getByText("¿Olvidaste tu contraseña?")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("ejemplo@gmail.com")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /enviar enlace/i,
      })
    ).toBeInTheDocument();
  });

  it("el botón inicia deshabilitado", () => {
    render(<ForgotPassword />);

    expect(
      screen.getByRole("button", {
        name: /enviar enlace/i,
      })
    ).toBeDisabled();
  });

  it("habilita el botón al escribir un correo", () => {
    render(<ForgotPassword />);

    const input = screen.getByPlaceholderText(
      "ejemplo@gmail.com"
    );

    fireEvent.change(input, {
      target: {
        value: "karina@test.com",
      },
    });

    expect(
      screen.getByRole("button", {
        name: /enviar enlace/i,
      })
    ).not.toBeDisabled();
  });

  it("muestra error cuando el correo no contiene @", () => {
    render(<ForgotPassword />);

    fireEvent.change(
      screen.getByPlaceholderText("ejemplo@gmail.com"),
      {
        target: {
          value: "correoinvalido.com",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /enviar enlace/i,
      })
    );

    expect(
      screen.getByText(
        "Ingresa un correo electrónico válido (debe contener @)"
      )
    ).toBeInTheDocument();
  });

  it("muestra el botón volver al inicio de sesión", () => {
    render(<ForgotPassword />);

    expect(
      screen.getByRole("button", {
        name: /volver al inicio de sesión/i,
      })
    ).toBeInTheDocument();
  });
});