import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ResetPassword from "./ResetPassword";

// Mock de FormCard
vi.mock("../Components/FormCard", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

describe("ResetPassword", () => {
  it("renderiza el formulario correctamente", () => {
    render(<ResetPassword />);

    expect(
      screen.getByText("Restablecer contraseña")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Tu nueva contraseña")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Repite la contraseña")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /guardar contraseña/i })
    ).toBeInTheDocument();
  });

  it("muestra error si los campos están vacíos", () => {
    render(<ResetPassword />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /guardar contraseña/i,
      })
    );

    expect(
      screen.getByText("Completa ambos campos.")
    ).toBeInTheDocument();
  });

  it("muestra error si la contraseña tiene menos de 8 caracteres", () => {
    render(<ResetPassword />);

    fireEvent.change(
      screen.getByPlaceholderText("Tu nueva contraseña"),
      {
        target: { value: "123456" },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText("Repite la contraseña"),
      {
        target: { value: "123456" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /guardar contraseña/i,
      })
    );

    expect(
      screen.getByText(
        "La contraseña debe tener al menos 8 caracteres."
      )
    ).toBeInTheDocument();
  });

  it("muestra error cuando las contraseñas no coinciden", () => {
    render(<ResetPassword />);

    fireEvent.change(
      screen.getByPlaceholderText("Tu nueva contraseña"),
      {
        target: { value: "password123" },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText("Repite la contraseña"),
      {
        target: { value: "password456" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /guardar contraseña/i,
      })
    );

    expect(
      screen.getByText("Las contraseñas no coinciden.")
    ).toBeInTheDocument();
  });

  it("permite escribir en ambos campos", () => {
    render(<ResetPassword />);

    const passwordInput =
      screen.getByPlaceholderText("Tu nueva contraseña");

    const confirmInput =
      screen.getByPlaceholderText("Repite la contraseña");

    fireEvent.change(passwordInput, {
      target: { value: "password123" },
    });

    fireEvent.change(confirmInput, {
      target: { value: "password123" },
    });

    expect(passwordInput.value).toBe("password123");
    expect(confirmInput.value).toBe("password123");
  });
});