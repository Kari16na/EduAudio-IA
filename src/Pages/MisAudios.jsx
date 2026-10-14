import { useState, useEffect } from "react";
import { Search, Play, Download, Pencil, Trash2, ArrowLeft } from "lucide-react";
import NavBar from "../Components/NavBar";
import { getAudios, deleteAudio, updateAudioName } from "../services/api";  
import { API_URL } from "../config";   
import styles from "./MisAudios.module.css";

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

  async function handleDownload(audio) {
    try {
      if (!audio.audioUrl) {
        alert("El archivo de audio no tiene una ruta válida.");
        return;
      }
      const fullUrl = audio.audioUrl.startsWith("http")
        ? audio.audioUrl
        : `${API_URL}${audio.audioUrl.startsWith("/") ? "" : "/"}${audio.audioUrl}`;

      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("No se pudo obtener el archivo desde el servidor.");

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
      alert("El archivo físico no se encuentra en el servidor de Render. Genera un audio nuevo.");
    }
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

  // 👉 Aquí sigue tu JSX (NavBar, lista de audios, modal, etc.)
}
