import { useState, useEffect } from "react";
import { GraduationCap, CheckCircle, XCircle, ArrowLeft, Lock, Camera } from "lucide-react";
import NavBar from "../Components/NavBar";
import { getAudiosCount, updateUserName, changePassword, uploadProfilePhoto } from "../services/api";
import styles from "./Perfil.module.css";

export default function Perfil({ onNavigate }) {
  const [usuario, setUsuario] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [totalAudios, setTotalAudios] = useState(0);
  const [nombre, setNombre] = useState(usuario.fullName || "");
  const [mensaje, setMensaje] = useState(null);
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [passwordMensaje, setPasswordMensaje] = useState(null);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const token = localStorage.getItem("token");
        const data = await getAudiosCount(token);
        if (Array.isArray(data)) setTotalAudios(data.length);
      } catch {
        alert("Error al cargar estadísticas.");
      }
    }
    cargar();
  }, []);

  async function handleActualizar() {
    setGuardandoNombre(true);
    try {
      const token = localStorage.getItem("token");
      const data = await updateUserName(token, nombre);
      if (!data.error) {
        const actualizado = { ...usuario, fullName: nombre };
        localStorage.setItem("user", JSON.stringify(actualizado));
        setUsuario(actualizado);
        setMensaje("exito");
      } else {
        setMensaje("error");
      }
    } finally {
      setGuardandoNombre(false);
    }
  }

  async function handleCambiarPassword() {
    setPasswordMensaje(null);
    setPasswordError(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setPasswordError("Por favor completa todos los campos.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setCambiandoPassword(true);
    try {
      const token = localStorage.getItem("token");
      const data = await changePassword(token, currentPassword, newPassword);
      if (data.error) {
        setPasswordError(data.message || "Error al cambiar la contraseña.");
        return;
      }
      setPasswordMensaje("exito");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      setPasswordError("Error al conectar con el servidor.");
    } finally {
      setCambiandoPassword(false);
    }
  }

  function handleFotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function handleSubirFoto() {
    if (!fotoFile) return;
    setSubiendoFoto(true);
    try {
      const token = localStorage.getItem("token");
      const data = await uploadProfilePhoto(token, fotoFile);
      if (data.error) {
        alert(data.message || "Error al subir la foto.");
        return;
      }
      const actualizado = { ...usuario, profilePhoto: data.photoUrl };
      localStorage.setItem("user", JSON.stringify(actualizado));
      setUsuario(actualizado);
      setFotoFile(null);
      setFotoPreview(null);
    } catch {
      alert("Error al conectar con el servidor.");
    } finally {
      setSubiendoFoto(false);
    }
  }

  // 👉 El JSX de tu archivo original se mantiene igual (NavBar, avatar, estadísticas, inputs, botones)
}
