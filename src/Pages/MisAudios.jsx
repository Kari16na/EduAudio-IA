import { useState, useEffect } from "react";
import { Search, Play, Download, Pencil, Trash2, ArrowLeft, Check, X } from "lucide-react";
import NavBar from "../Components/NavBar";
import { getAudios, deleteAudio, updateAudioName } from "../services/api";
import styles from "./MisAudios.module.css";
import { API_URL } from "../config";

export default function MisAudios({ onNavigate }) {
  const [audios, setAudios] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [audioEditar, setAudioEditar] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarAudios() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setAudios([]);
          return;
        }

        const data = await getAudios(token);
        setAudios(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar los audios:", error);
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
      await deleteAudio(token, id);
      setAudios((prev) => prev.filter((audio) => audio._id !== id));
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar el audio.");
    }
  }

  function handleDownload(audio) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No estás autenticado.");
      return;
    }

    if (!audio?.audioUrl) {
      alert("Este audio no tiene un archivo válido para descargar.");
      return;
    }

    const url = audio.audioUrl.startsWith("http") ? audio.audioUrl : `${API_URL}${audio.audioUrl}`;
    window.open(url, "_blank");
  }

  function handleAbrirEditar(audio) {
    setAudioEditar(audio);
    setNuevoNombre(audio.fileName || "");
    setModalAbierto(true);
  }

  function handleCerrarModal() {
    setModalAbierto(false);
    setAudioEditar(null);
    setNuevoNombre("");
  }

  async function handleGuardarNombre() {
    if (!nuevoNombre.trim()) {
      alert("El nombre no puede estar vacío.");
      return;
    }

    try {
      setGuardando(true);
      const token = localStorage.getItem("token");
      const data = await updateAudioName(token, audioEditar._id, nuevoNombre.trim());

      if (!data || data.error) {
        alert(data?.message || "Error al actualizar.");
        return;
      }

      setAudios((prev) => prev.map((audio) =>
        audio._id === audioEditar._id ? { ...audio, fileName: nuevoNombre.trim() } : audio
      ));

      handleCerrarModal();
    } catch (error) {
      console.error("Error al actualizar nombre:", error);
      alert("Error al actualizar el nombre.");
    } finally {
      setGuardando(false);
    }
  }

  function handlePlay(audio) {
    if (!audio?.audioUrl) {
      alert("Este audio no está disponible para reproducir.");
      return;
    }

    localStorage.setItem("currentAudio", JSON.stringify(audio));
    onNavigate("player");
  }

  const filtered = (audios || []).filter((audio) =>
    (audio.fileName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <button className={styles.btnBack} onClick={() => onNavigate("dashboard")}>
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>
        }
      />

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Tu Biblioteca de Estudio</h1>
            <p className={styles.subtitle}>Aquí están todos tus documentos convertidos a audio.</p>
          </div>

          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.search}
              type="text"
              placeholder="Buscar audio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.empty}>Cargando audios...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No hay audios para mostrar.</div>
        ) : (
          <div className={styles.list}>
            {filtered.map((audio) => (
              <article key={audio._id} className={styles.audioCard}>
                <div className={styles.audioInfo}>
                  <div className={styles.audioName}>{audio.fileName || "Audio sin nombre"}</div>
                  <div className={styles.audioDate}>
                    Creado: {new Date(audio.createdAt || Date.now()).toLocaleDateString("es-ES")}
                  </div>
                </div>

                <div className={styles.audioActions}>
                  <button className={styles.btnPlay} onClick={() => handlePlay(audio)}>
                    <Play size={14} /> Escuchar
                  </button>
                  <button className={styles.btnDownload} onClick={() => handleDownload(audio)}>
                    <Download size={14} /> Descargar
                  </button>
                  <button className={styles.btnEdit} onClick={() => handleAbrirEditar(audio)} aria-label="Renombrar audio">
                    <Pencil size={14} />
                  </button>
                  <button className={styles.btnDelete} onClick={() => handleDelete(audio._id)} aria-label="Eliminar audio">
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {modalAbierto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}><Pencil size={18} /> Renombrar audio</h3>
            <p className={styles.modalSubtitle}>Escribe el nuevo nombre que quieres usar.</p>
            <input
              className={styles.modalInput}
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button className={styles.btnCancelar} onClick={handleCerrarModal} disabled={guardando}>
                <X size={14} /> Cancelar
              </button>
              <button className={styles.btnGuardar} onClick={handleGuardarNombre} disabled={guardando}>
                <Check size={14} /> {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
