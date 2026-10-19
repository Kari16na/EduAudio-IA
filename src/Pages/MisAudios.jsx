import { useState, useEffect } from "react";
import { Search, Play, Download, Pencil, Trash2, ArrowLeft } from "lucide-react";
import NavBar from "../Components/NavBar";
import { getAudios, deleteAudio, updateAudioName } from "../services/api";  
import styles from "./MisAudios.module.css";
import { API_URL } from "../config"; // 👈 Importamos API_URL

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
        const data = await getAudios(token);
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
      await deleteAudio(token, id);
      setAudios(audios.filter(a => a._id !== id));
    } catch {
      alert("Error al eliminar el audio.");
    }
  }

  // ✅ Nueva versión: descarga usando la ruta del backend
  function handleDownload(audio) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No estás autenticado.");
      return;
    }
    // Redirige al backend, que a su vez redirige a Cloudinary
    window.location.href = `${API_URL}/audios/download/${audio._id}?token=${token}`;
  }

  function handleAbrirEditar(audio) {
    setAudioEditar(audio);
    setNuevoNombre(audio.fileName);
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
        alert(data.message || "Error al actualizar.");
        return;
      }

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
          <button
            className={styles.btnBack}
            onClick={() => onNavigate("dashboard")}
          >
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>
        }
      />

      <main className={styles.main}>
        <h2>Mis Audios</h2>

        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <ul>
            {filtered.map((audio) => (
              <li key={audio._id}>
                <p>{audio.fileName}</p>
                <audio controls src={audio.audioUrl}></audio>
                <button onClick={() => handlePlay(audio)}>
                  <Play size={16} /> Escuchar
                </button>
                <button onClick={() => handleDownload(audio)}>
                  <Download size={16} /> Descargar
                </button>
                <button onClick={() => handleAbrirEditar(audio)}>
                  <Pencil size={16} /> Renombrar
                </button>
                <button onClick={() => handleDelete(audio._id)}>
                  <Trash2 size={16} /> Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {modalAbierto && (
        <div className={styles.modal}>
          <h3>Editar nombre</h3>
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
          />
          <button onClick={handleGuardarNombre} disabled={guardando}>
            Guardar
          </button>
          <button onClick={handleCerrarModal}>Cancelar</button>
        </div>
      )}
    </div>
  );
}
