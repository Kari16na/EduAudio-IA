import { useState, useEffect } from "react";
import NavBar from "../Components/NavBar";
import styles from "./Perfil.module.css";

export default function Perfil({ onNavigate }) {

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [totalAudios, setTotalAudios] = useState(0);
  const [nombre,      setNombre]      = useState(storedUser.fullName || "");
  const [mensaje,     setMensaje]     = useState(null);

  useEffect(() => {
    async function cargar() {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/audios", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setTotalAudios(data.length);
    }
    cargar();
  }, []);

  async function handleActualizar() {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3000/api/users/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ fullName: nombre })
    });
    if (res.ok) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.fullName = nombre;
      localStorage.setItem("user", JSON.stringify(user));
      setMensaje("exito");
    } else {
      setMensaje("error");
    }
  }

  return (
    <div className={styles.page}>

      <NavBar
        onNavigate={onNavigate}
        rightContent={
          <button
            className={styles.btnVolver}
            onClick={() => onNavigate("dashboard")}
          >
            ← Volver
          </button>
        }
      />

      <main className={styles.main}>

        <div className={styles.card}>

          {/* Avatar */}
          <div className={styles.avatarBox}>
            <div className={styles.avatar}>🎓</div>
            <h2 className={styles.userName}>
              {storedUser.fullName || "Estudiante"}
            </h2>
            <p className={styles.userEmail}>
              {storedUser.email || ""}
            </p>
          </div>

          {/* Estadística */}
          <div className={styles.statBox}>
            <p className={styles.statNumber}>{totalAudios}</p>
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
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>

          {mensaje === "exito" && (
            <div className={styles.msgExito}>
              ✅ Nombre actualizado correctamente
            </div>
          )}

          {mensaje === "error" && (
            <div className={styles.msgError}>
              ❌ Error al actualizar
            </div>
          )}

          <button className={styles.btnPrimary} onClick={handleActualizar}>
            Guardar cambios
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
      </main>
    </div>
  );
}