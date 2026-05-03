import { useState } from "react";
import NavBar from "../Components/NavBar";
import styles from "./Dashboard.module.css";

export default function Dashboard({ onNavigate }) {

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);

  function handleFile(e) {
    setFile(e.target.files[0]);
  }

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("document", file);

      const res = await fetch("http://localhost:3000/api/audios/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }

      // Guardar audio actual para el player
      localStorage.setItem("currentAudio", JSON.stringify(data.audio));
      onNavigate("audios");

    } catch {
      alert("Error al generar el audio.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <div className={styles.navRight}>
            <span className={styles.welcome}>
              Bienvenido, <strong>{storedUser.fullName || "Estudiante"}</strong>
            </span>
            <button
              className={styles.btnLogout}
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                onNavigate("landing");
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        }
      />

      <main className={styles.main}>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>📤 Subir Documento</h2>
          <p className={styles.cardSubtitle}>
            Sube tu archivo PDF o Word y la IA lo resumirá y convertirá en audio.
          </p>

          <label className={styles.label}>Selecciona o arrastra tu archivo:</label>

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

          <button
            className={styles.btnGenerate}
            onClick={handleGenerate}
            disabled={!file || loading}
          >
            {loading ? "⏳ Generando resumen y audio..." : "🎵 Generar Audio con IA"}
          </button>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>🎧 Mis Audios Recientes</h2>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎵</div>
            <p className={styles.emptyText}>
              Sube un documento para convertirlo en audio de estudio.
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