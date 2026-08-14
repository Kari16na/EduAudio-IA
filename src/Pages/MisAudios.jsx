import { useState, useEffect } from "react";
import { Search, Play, Download, Pencil, Trash2, ArrowLeft } from "lucide-react";
import NavBar from "../Components/NavBar";
import styles from "./MisAudios.module.css";

export default function MisAudios({ onNavigate }) {

  const [audios,        setAudios]        = useState([]);
  const [search,        setSearch]        = useState("");
  const [loading,       setLoading]       = useState(true);

  // Estados para el modal de editar nombre
  const [modalAbierto,  setModalAbierto]  = useState(false);
  const [audioEditar,   setAudioEditar]   = useState(null);
  const [nuevoNombre,   setNuevoNombre]   = useState("");
  const [guardando,     setGuardando]     = useState(false);

  // Cargar audios al montar el componente
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

  // Eliminar audio
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

  // Descargar audio real (fetch + blob), sin navegar fuera de la página
  async function handleDownload(audio) {
    try {
      const response = await fetch(audio.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${audio.fileName}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Error al descargar el audio.");
    }
  }

  // Abrir modal de edición con el audio seleccionado
  function handleAbrirEditar(audio) {
    setAudioEditar(audio);
    setNuevoNombre(audio.fileName);
    setModalAbierto(true);
  }

  // Cerrar modal y limpiar estados
  function handleCerrarModal() {
    setModalAbierto(false);
    setAudioEditar(null);
    setNuevoNombre("");
  }

  // Guardar el nuevo nombre via PUT al backend
  async function handleGuardarNombre() {
    if (!nuevoNombre.trim()) {
      alert("El nombre no puede estar vacío.");
      return;
    }
    try {
      setGuardando(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/audios/${audioEditar._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fileName: nuevoNombre.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Error al actualizar.");
        return;
      }

      // Actualizar la lista local sin recargar la página
      setAudios(audios.map(a =>
        a._id === audioEditar._id ? { ...a, fileName: nuevoNombre.trim() } : a
      ));

      handleCerrarModal();
    } catch {
      alert("Error al actualizar el nombre.");
    } finally {
      setGuardando(false);
    }
  }

  // Navegar al reproductor
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
              className={styles.btnBack}
              data-testid="audios-back-btn"
              onClick={() => onNavigate("dashboard")}
            >
              <ArrowLeft size={16} /> Volver al Dashboard
            </button>
            <button
              className={styles.btnNav}
              data-testid="audios-upload-new-btn"
              onClick={() => onNavigate("dashboard")}
            >
              Subir Nuevo
            </button>
            <button
              className={styles.btnLogout}
              data-testid="audios-logout-btn"
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

          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.search}
              type="text"
              data-testid="audios-search"
              placeholder="Buscar audio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
              <div key={audio._id} className={styles.audioCard} data-testid="audio-card">

                <div className={styles.audioInfo}>
                  <p className={styles.audioName} title={audio.fileName}>{audio.fileName}</p>
                  <p className={styles.audioDate}>
                    Creado: {new Date(audio.createdAt).toLocaleDateString("es-CO")}
                  </p>
                </div>

                <div className={styles.audioActions}>
                  <button
                    className={styles.btnPlay}
                    data-testid="audio-play-btn"
                    onClick={() => handlePlay(audio)}
                  >
                    <Play size={16} /> Escuchar
                  </button>
                  <button
                    className={styles.btnDownload}
                    data-testid="audio-download-btn"
                    onClick={() => handleDownload(audio)}
                  >
                    <Download size={16} /> Descargar
                  </button>
                  <button
                    className={styles.btnEdit}
                    data-testid="audio-edit-btn"
                    onClick={() => handleAbrirEditar(audio)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className={styles.btnDelete}
                    data-testid="audio-delete-btn"
                    onClick={() => handleDelete(audio._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

      </main>

      {/* Modal para editar el nombre del audio */}
      {modalAbierto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              <Pencil size={18} /> Editar nombre
            </h2>
            <p className={styles.modalSubtitle}>
              Escribe el nuevo nombre para tu audio
            </p>
            <input
              className={styles.modalInput}
              type="text"
              data-testid="edit-name-input"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Nuevo nombre del audio"
              onKeyDown={(e) => e.key === "Enter" && handleGuardarNombre()}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                className={styles.btnCancelar}
                data-testid="edit-cancel-btn"
                onClick={handleCerrarModal}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                className={styles.btnGuardar}
                data-testid="edit-save-btn"
                onClick={handleGuardarNombre}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}