import { useState, useEffect } from "react";
import { Bot, User, UploadCloud, FileText, File, Music, Headphones } from "lucide-react";
import NavBar from "../Components/NavBar";
import styles from "./Dashboard.module.css";

export default function Dashboard({ onNavigate }) {

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [file,        setFile]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [totalAudios, setTotalAudios] = useState(0);

  useEffect(() => {
    async function contarAudios() {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/audios", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setTotalAudios(data.length);
    }
    contarAudios();
  }, []);

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

      {/* Spinner de carga */}
      {loading && (
        <div className={styles.spinnerOverlay}>
          <div className={styles.spinnerCard}>
            <div className={styles.spinner} />
            <p className={styles.spinnerTitle}>
              <Bot size={20} /> Analizando documento...
            </p>
            <p className={styles.spinnerSubtitle}>
              La IA está resumiendo tu documento y generando el audio
            </p>
          </div>
        </div>
      )}

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <div className={styles.navRight}>
            <span className={styles.welcome} data-testid="dashboard-welcome">
              Bienvenido, <strong>{storedUser.fullName || "Estudiante"}</strong>
            </span>
            <button
              className={styles.btnPerfil}
              data-testid="dashboard-perfil-btn"
              onClick={() => onNavigate("perfil")}
            >
              <User size={16} /> Mi Perfil
            </button>
            <button
              className={styles.btnLogout}
              data-testid="dashboard-logout-btn"
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
          <h2 className={styles.cardTitle}>
            <UploadCloud size={20} /> Subir Documento
          </h2>
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
              data-testid="upload-file-input"
            />
            {file ? (
              <div className={styles.fileSelected}>
                <span className={styles.fileIcon}>
                  {file.name.endsWith(".pdf") ? <FileText size={32} /> : <File size={32} />}
                </span>
                <span className={styles.fileName} data-testid="upload-filename">{file.name}</span>
              </div>
            ) : (
              <div className={styles.dropContent}>
                <span className={styles.dropIcon}>
                  <UploadCloud size={36} />
                </span>
                <span className={styles.dropText}>
                  Haz clic o arrastra tu archivo aquí
                </span>
                <span className={styles.dropFormats}>PDF o Word</span>
              </div>
            )}
          </label>

          <button
            className={styles.btnGenerate}
            data-testid="upload-generate-btn"
            onClick={handleGenerate}
            disabled={!file || loading}
          >
            <Music size={18} /> Generar Audio con IA
          </button>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <Headphones size={20} /> Mis Audios Recientes
          </h2>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Music size={48} />
            </div>
            <p className={styles.statNumber} data-testid="dashboard-audios-count">{totalAudios}</p>
            <p className={styles.emptyText}>
              {totalAudios === 0
                ? "Aún no has convertido ningún documento."
                : `Audio${totalAudios > 1 ? "s" : ""} generado${totalAudios > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            className={styles.btnSecondary}
            data-testid="dashboard-view-library-btn"
            onClick={() => onNavigate("audios")}
          >
            Ver toda mi biblioteca
          </button>
        </section>

      </main>
    </div>
  );
}