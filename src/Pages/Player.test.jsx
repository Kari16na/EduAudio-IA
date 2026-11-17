import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Player from "./Player";

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
  normalizeAudioUrl: vi.fn((url) => url),
}));

describe("Player", () => {
  beforeEach(() => {
    localStorage.setItem(
      "currentAudio",
      JSON.stringify({
        fileName: "Documento de Prueba",
        audioUrl: "https://ejemplo.com/audio.mp3",
        paragraphs: [
          "Este es el primer párrafo.",
          "Este es el segundo párrafo."
        ],
      })
    );
  });

  it("renderiza la página del reproductor", () => {
    render(<Player />);

    expect(
      screen.getByTestId("player-page")
    ).toBeInTheDocument();
  });

  it("muestra el título del documento", () => {
    render(<Player />);

    expect(
      screen.getByText("Documento de Prueba")
    ).toBeInTheDocument();
  });

  it("muestra el contenedor de texto", () => {
    render(<Player />);

    expect(
      screen.getByTestId("player-text-box")
    ).toBeInTheDocument();
  });

  it("muestra los controles de reproducción", () => {
    render(<Player />);

    expect(
      screen.getByTestId("controls")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("btn-play-pause")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("btn-skip-back")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("btn-skip-forward")
    ).toBeInTheDocument();
  });

  it("muestra la barra de progreso", () => {
    render(<Player />);

    expect(
      screen.getByTestId("progress-bar")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("progress-fill")
    ).toBeInTheDocument();
  });

  it("muestra los tiempos de reproducción", () => {
    render(<Player />);

    expect(
      screen.getByTestId("current-time")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("duration-time")
    ).toBeInTheDocument();
  });

  it("muestra el botón volver a audios", () => {
    render(<Player />);

    expect(
      screen.getByTestId("btn-back-to-audios")
    ).toBeInTheDocument();
  });

  it("llama a onNavigate al pulsar volver", () => {
    const onNavigate = vi.fn();

    render(<Player onNavigate={onNavigate} />);

    fireEvent.click(
      screen.getByTestId("btn-back-to-audios")
    );

    expect(onNavigate).toHaveBeenCalledWith("audios");
  });
});