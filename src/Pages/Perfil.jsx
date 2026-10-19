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

  const avatarSrc = fotoPreview || usuario.profilePhoto || "";
  const iniciales = (usuario.fullName || "Usuario")
    .split(" ")
    .map((parte) => parte[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={styles.page}>
      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <button className={styles.btnVolver} onClick={() => onNavigate("dashboard")}>
            <ArrowLeft size={15} /> Volver
          </button>
        }
      />

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.avatarBox}>
            <div className={styles.avatarWrapper}>
              {avatarSrc ? (
                <img src={avatarSrc} alt="perfil" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatar}>{iniciales || "U"}</div>
              )}

              <label className={styles.btnCamera} htmlFor="foto-perfil">
                <Camera size={14} />
              </label>
              <input
                id="foto-perfil"
                type="file"
                accept="image/*"
                className={styles.fotoInput}
                onChange={handleFotoChange}
              />
            </div>

            {fotoFile && (
              <button
                type="button"
                className={styles.btnGuardarFoto}
                onClick={handleSubirFoto}
                disabled={subiendoFoto}
              >
                {subiendoFoto ? "Subiendo..." : "Guardar foto"}
              </button>
            )}

            <div className={styles.userName}>{usuario.fullName || nombre || "Usuario"}</div>
            <div className={styles.userEmail}>{usuario.email || "usuario@email.com"}</div>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statNumber}>{totalAudios}</div>
            <p className={styles.statLabel}>audios generados</p>
          </div>

          <div className={styles.divider} />

          <div className={styles.sectionTitle}>
            <GraduationCap size={16} /> Perfil
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Nombre completo</label>
            <input
              className={styles.input}
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          {mensaje && (
            <div className={mensaje === "exito" ? styles.msgExito : styles.msgError}>
              {mensaje === "exito" ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {mensaje === "exito" ? "Nombre actualizado correctamente." : "No se pudo actualizar el nombre."}
            </div>
          )}

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleActualizar}
            disabled={guardandoNombre}
          >
            {guardandoNombre ? "Guardando..." : "Guardar nombre"}
          </button>

          <div className={styles.divider} />

          <div className={styles.sectionTitle}>
            <Lock size={16} /> Cambiar contraseña
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Contraseña actual</label>
            <input
              className={styles.input}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Tu contraseña actual"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Nueva contraseña</label>
            <input
              className={styles.input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Confirmar contraseña</label>
            <input
              className={styles.input}
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
            />
          </div>

          {passwordError && (
            <div className={styles.msgError}>
              <XCircle size={16} />
              {passwordError}
            </div>
          )}

          {passwordMensaje && (
            <div className={styles.msgExito}>
              <CheckCircle size={16} />
              Contraseña actualizada correctamente.
            </div>
          )}

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleCambiarPassword}
            disabled={cambiandoPassword}
          >
            {cambiandoPassword ? "Cambiando..." : "Cambiar contraseña"}
          </button>
        </div>
      </main>
    </div>
  );
}
