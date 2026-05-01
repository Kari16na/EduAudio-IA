import { useState, useEffect } from "react";
import NavBar from "../Components/NavBar";
import styles from "./MisAudios.module.css";

export default function MisAudios({ onNavigate }) {

  const [audios,  setAudios]  = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarAudios() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/audios", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setAudios(data);
      } catch {
        alert("Error al cargar los audios.");
      } finally {
        setLoading(false);
      }
    }
    cargarAudios();
  }, []);

  async function handleDelete(id) {
    if (!confirm("¿Seguro que quieres eliminar este audio?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3000/api/audios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setAudios(audios.filter(a => a._id !== id));
    } catch {
      alert("Error al eliminar el audio.");
    }
  }

  function handlePlay(audio) {
    localStorage.setItem("currentAudio", JSON.stringify(audio));
    onNavigate("player");
  }

  const filtered = audios.filter((audio) =>
    audio.fileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <div className={styles.navRight}>
            <button
              className={styles.btnNav}
              onClick={() => onNavigate("dashboard")}
            >
              Subir Nuevo
            </button>
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

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Tu Biblioteca de Estudio</h1>
            <p className={styles.subtitle}>
              Aquí están tus documentos convertidos por la IA
            </p>
          </div>
          <input
            className={styles.search}
            type="text"
            placeholder="🔍 Buscar audio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.empty}>
              <p>Cargando audios...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>No tienes audios todavía. ¡Sube tu primer documento!</p>
            </div>
          ) : (
            filtered.map((audio) => (
              <div key={audio._id} className={styles.audioCard}>

                <div className={styles.audioIcon}>
                  {audio.fileName.endsWith(".pdf") ? "📄" : "📝"}
                </div>

                <div className={styles.audioInfo}>
                  <p className={styles.audioName}>{audio.fileName}</p>
                  <p className={styles.audioDate}>
                    Creado: {new Date(audio.createdAt).toLocaleDateString("es-CO")}
                  </p>
                </div>

                <div className={styles.audioActions}>
                  <button
                    className={styles.btnPlay}
                    onClick={() => handlePlay(audio)}
                  >
                    ▶ Escuchar
                  </button>
                  <a
                    href={audio.audioUrl}
                    download={`${audio.fileName}.mp3`}
                    className={styles.btnDownload}
                  >
                    ⬇ Descargar
                  </a>
                  <button
                    className={styles.btnDelete}
                    onClick={() => handleDelete(audio._id)}
                  >
                    🗑
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}