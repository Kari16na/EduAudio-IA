import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MisAudios from "./AudioFiles";

// Mock NavBar
vi.mock("../Components/NavBar", () => ({
  default: ({ rightContent }) => (
    <div>
      NavBar
      {rightContent}
    </div>
  ),
}));

// Mock API
vi.mock("../services/api", () => ({
  getAudios: vi.fn(() =>
    Promise.resolve([
      {
        _id: "1",
        fileName: "Audio Matemáticas",
        audioUrl: "https://res.cloudinary.com/demo/audio.mp3",
        createdAt: new Date().toISOString(),
      },
    ])
  ),
  deleteAudio: vi.fn(),
  updateAudioName: vi.fn(() => Promise.resolve({ success: true })),
  normalizeAudioUrl: vi.fn((url) => url),
}));

describe("MisAudios", () => {
  beforeEach(() => {
    localStorage.setItem("token", "token-test");

    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);
  });

  it("muestra el título principal", async () => {
    render(<MisAudios />);

    expect(
      screen.getByText("Tu Biblioteca de Estudio")
    ).toBeInTheDocument();
  });

  it("muestra la búsqueda", async () => {
    render(<MisAudios />);

    expect(
      screen.getByPlaceholderText("Buscar audio...")
    ).toBeInTheDocument();
  });

  it("carga los audios", async () => {
    render(<MisAudios />);

    await waitFor(() => {
      expect(
        screen.getByText("Audio Matemáticas")
      ).toBeInTheDocument();
    });
  });

  it("permite escribir en el buscador", async () => {
    render(<MisAudios />);

    const search = screen.getByPlaceholderText(
      "Buscar audio..."
    );

    fireEvent.change(search, {
      target: { value: "mate" },
    });

    expect(search.value).toBe("mate");
  });

  it("muestra botón Escuchar", async () => {
    render(<MisAudios />);

    await waitFor(() => {
      expect(
        screen.getByText("Escuchar")
      ).toBeInTheDocument();
    });
  });

  it("muestra botón Descargar", async () => {
    render(<MisAudios />);

    await waitFor(() => {
      expect(
        screen.getByText("Descargar")
      ).toBeInTheDocument();
    });
  });

  it("abre el modal de renombrar", async () => {
    render(<MisAudios />);

    await waitFor(() => {
      expect(
        screen.getByLabelText("Renombrar audio")
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByLabelText("Renombrar audio")
    );

    expect(
      screen.getByText("Renombrar audio")
    ).toBeInTheDocument();
  });

  it("muestra botón eliminar", async () => {
    render(<MisAudios />);

    await waitFor(() => {
      expect(
        screen.getByLabelText("Eliminar audio")
      ).toBeInTheDocument();
    });
  });

  it("muestra botón volver al dashboard", () => {
    render(<MisAudios />);

    expect(
      screen.getByText(/Volver al Dashboard/i)
    ).toBeInTheDocument();
  });
});