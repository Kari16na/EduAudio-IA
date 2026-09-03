import { useState, useEffect } from "react";
import { GraduationCap, CheckCircle, XCircle, ArrowLeft, Lock, Camera } from "lucide-react";
import NavBar from "../Components/NavBar";
import { API_URL } from "../config";
import styles from "./Perfil.module.css";

export default function Perfil({ onNavigate }) {

  const [usuario, setUsuario] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  const [totalAudios, setTotalAudios] = useState(0);
  const [nombre,      setNombre]      = useState(usuario.fullName || "");
  const [mensaje,     setMensaje]     = useState(null);
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  // Cambiar contraseña
  const [currentPassword,    setCurrentPassword]    = useState("");
  const [newPassword,        setNewPassword]        = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError,      setPasswordError]      = useState(null);
  const [passwordMensaje,    setPasswordMensaje]    = useState(null);
  const [cambiandoPassword,  setCambiandoPassword]  = useState(false);

  // Foto de perfil
  const [fotoFile,    setFotoFile]    = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  useEffect(() => {
    async function cargar() {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/audios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setTotalAudios(data.length);
    }
    cargar();
  }, []);

  async function handleActualizar() {
    setGuardandoNombre(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/users/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fullName: nombre })
      });
      if (res.ok) {
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
      const res = await fetch(`${API_URL}/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
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
      const formData = new FormData();
      formData.append("photo", fotoFile);

      const res = await fetch(`${API_URL}/users/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
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

  return (
    <div className={styles.page}>

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <button
            className={styles.btnVolver}
            data-testid="perfil-back-btn"
            onClick={() => onNavigate("dashboard")}
          >
            <ArrowLeft size={16} /> Volver
          </button>
        }
      />

      <main className={styles.main}>

        <div className={styles.card}>

          {/* Avatar */}
          <div className={styles.avatarBox}>
            <div className={styles.avatarWrapper}>
              {fotoPreview || usuario.profilePhoto ? (
                <img
                  src={fotoPreview || usuario.profilePhoto}
                  alt="Foto de perfil"
                  className={styles.avatarImg}
                  data-testid="perfil-photo-preview"
                />
              ) : (
                <div className={styles.avatar}>
                  <GraduationCap size={36} />
                </div>
              )}
              <label className={styles.btnCamera} title="Cambiar foto">
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className={styles.fotoInput}
                  data-testid="perfil-photo-input"
                />
              </label>
            </div>

            {fotoFile && (
              <button
                className={styles.btnGuardarFoto}
                data-testid="perfil-photo-save-btn"
                onClick={handleSubirFoto}
                disabled={subiendoFoto}
              >
                {subiendoFoto ? "Subiendo..." : "Guardar foto"}
              </button>
            )}

            <h2 className={styles.userName} data-testid="perfil-username">
              {usuario.fullName || "Estudiante"}
            </h2>
            <p className={styles.userEmail} data-testid="perfil-email">
              {usuario.email || ""}
            </p>
            {usuario.createdAt && (
              <p className={styles.userSince} data-testid="perfil-member-since">
                Miembro desde: {new Date(usuario.createdAt).toLocaleDateString("es-CO", {
                  year: "numeric", month: "long", day: "numeric"
                })}
              </p>
            )}
          </div>

          {/* Estadística */}
          <div className={styles.statBox}>
            <p className={styles.statNumber} data-testid="perfil-audios-count">{totalAudios}</p>
            <p className={styles.statLabel}>
              Audio{totalAudios !== 1 ? "s" : ""} generado{totalAudios !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Actualizar nombre */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Actualizar nombre:</label>
            <input
              className={styles.input}
              type="text"
              data-testid="perfil-name-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>

          {mensaje === "exito" && (
            <div className={styles.msgExito} data-testid="perfil-success-msg">
              <CheckCircle size={16} /> Nombre actualizado correctamente
            </div>
          )}

          {mensaje === "error" && (
            <div className={styles.msgError} data-testid="perfil-error-msg">
              <XCircle size={16} /> Error al actualizar
            </div>
          )}

          <button
            className={styles.btnPrimary}
            data-testid="perfil-save-btn"
            onClick={handleActualizar}
            disabled={guardandoNombre}
          >
            {guardandoNombre ? "Guardando..." : "Guardar cambios"}
          </button>

          {/* Cambiar contraseña */}
          <div className={styles.divider} />

          <div className={styles.sectionTitle}>
            <Lock size={18} /> Cambiar contraseña
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Contraseña actual:</label>
            <input
              className={styles.input}
              type="password"
              data-testid="perfil-current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Tu contraseña actual"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Nueva contraseña:</label>
            <input
              className={styles.input}
              type="password"
              data-testid="perfil-new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Confirmar nueva contraseña:</label>
            <input
              className={styles.input}
              type="password"
              data-testid="perfil-confirm-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
            />
          </div>

          {passwordError && (
            <div className={styles.msgError} data-testid="perfil-password-error-msg">
              <XCircle size={16} /> {passwordError}
            </div>
          )}

          {passwordMensaje === "exito" && (
            <div className={styles.msgExito} data-testid="perfil-password-success-msg">
              <CheckCircle size={16} /> Contraseña actualizada correctamente
            </div>
          )}

          <button
            className={styles.btnPrimary}
            data-testid="perfil-change-password-btn"
            onClick={handleCambiarPassword}
            disabled={cambiandoPassword}
          >
            {cambiandoPassword ? "Cambiando..." : "Cambiar contraseña"}
          </button>

          <button
            className={styles.btnLogout}
            data-testid="perfil-logout-btn"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              onNavigate("landing");
            }}
          >
            Cerrar Sesión
          </button>

        </div>
      </main>
    </div>
  );
}