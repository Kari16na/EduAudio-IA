import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Landing from "./Landing";

// Mock NavBar
vi.mock("../Components/NavBar", () => ({
  default: ({ rightContent }) => (
    <div>
      NavBar
      {rightContent}
    </div>
  ),
}));

describe("Landing", () => {
  it("renderiza el título principal", () => {
    render(<Landing />);

    expect(
      screen.getByText("Bienvenido a")
    ).toBeInTheDocument();

    expect(
      screen.getByText("EduAudio IA")
    ).toBeInTheDocument();
  });

  it("muestra la descripción del proyecto", () => {
    render(<Landing />);

    expect(
      screen.getByText(/Optimiza tu estudio/i)
    ).toBeInTheDocument();
  });

  it("muestra los badges PDF y Word", () => {
    render(<Landing />);

    expect(
      screen.getByTestId("landing-badge-pdf")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("landing-badge-word")
    ).toBeInTheDocument();
  });

  it("llama a signup al pulsar Comenzar ahora", () => {
    const onNavigate = vi.fn();

    render(<Landing onNavigate={onNavigate} />);

    fireEvent.click(
      screen.getByTestId("landing-cta-btn")
    );

    expect(onNavigate).toHaveBeenCalledWith("signup");
  });

  it("llama a login al pulsar Iniciar Sesión", () => {
    const onNavigate = vi.fn();

    render(<Landing onNavigate={onNavigate} />);

    fireEvent.click(
      screen.getByTestId("landing-login-btn")
    );

    expect(onNavigate).toHaveBeenCalledWith("login");
  });

  it("muestra el icono principal", () => {
    render(<Landing />);

    expect(
      screen.getByTestId("landing-icon")
    ).toBeInTheDocument();
  });
});