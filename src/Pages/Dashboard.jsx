import { useState } from "react";
import NavBar from "../Components/NavBar";
import styles from "./Dashboard.module.css";

export default function Dashboard({ onNavigate }) {

  const [file,     setFile]     = useState(null);
  const [speed,    setSpeed]    = useState("1");
  const [loading,  setLoading]  = useState(false);

  function handleFile(e) {
    setFile(e.target.files[0]);
  }

  function handleGenerate() {
    if (!file) return;
    setLoading(true);
    // Simulamos que la IA procesa el archivo
    setTimeout(() => {
      setLoading(false);
      onNavigate("audios");
    }, 2000);
  }

  return (
    <div className={styles.page}>

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <div className={styles.navRight}>
            <span className={styles.welcome}>
              Bienvenido, <strong>Estudiante</strong>
            </span>
            <button
              className={styles.btnLogout}
              onClick={() => onNavigate("landing")}
            >
              Cerrar Sesión
            </button>
          </div>
        }
      />

      <main className={styles.main}>

        {/* Columna izquierda: subir documento */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>📤 Subir Documento</h2>
          <p className={styles.cardSubtitle}>
            Sube tu archivo PDF o Word para convertirlo en audio de estudio.
          </p>

          <label className={styles.label}>
            Selecciona o arrastra tu archivo:
          </label>

          {/* Zona de carga */}
          <label className={styles.dropZone}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFile}
              className={styles.fileInput}
            />
            {file ? (
              <div className={styles.fileSelected}>
                <span className={styles.fileIcon}>
                  {file.name.endsWith(".pdf") ? "📄" : "📝"}
                </span>
                <span className={styles.fileName}>{file.name}</span>
              </div>
            ) : (
              <div className={styles.dropContent}>
                <span className={styles.dropIcon}>☁️</span>
                <span className={styles.dropText}>
                  Haz clic o arrastra tu archivo aquí
                </span>
                <span className={styles.dropFormats}>PDF o Word</span>
              </div>
            )}
          </label>

          {/* Velocidad */}
          <label className={styles.label}>Velocidad de voz:</label>
          <select
            className={styles.select}
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
          >
            <option value="0.75">Lenta (0.75x)</option>
            <option value="1">Normal (1x)</option>
            <option value="1.25">Rápida (1.25x)</option>
            <option value="1.5">Muy rápida (1.5x)</option>
          </select>

          {/* Botón generar */}
          <button
            className={styles.btnGenerate}
            onClick={handleGenerate}
            disabled={!file || loading}
          >
            {loading ? "⏳ Generando audio..." : "🎵 Generar Audio con IA"}
          </button>
        </section>

        {/* Columna derecha: audios recientes */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>🎧 Mis Audios Recientes</h2>

          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎵</div>
            <p className={styles.emptyText}>
              Aún no has convertido ningún documento.
            </p>
            <p className={styles.emptySubtext}>
              Sube un archivo para comenzar.
            </p>
          </div>

          <button
            className={styles.btnSecondary}
            onClick={() => onNavigate("audios")}
          >
            Ver toda mi biblioteca
          </button>
        </section>

      </main>

    </div>
  );
}