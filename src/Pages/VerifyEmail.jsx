import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Mail } from "lucide-react";
import FormCard from "../Components/FormCard";
import { API_URL } from "../config";
import styles from "./VerifyEmail.module.css";

export default function VerifyEmail({ onNavigate }) {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Verificando tu correo...");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      const email = localStorage.getItem("pendingVerificationEmail");
      setStatus("pending");
      setMessage(email ? `Enviamos un enlace de verificación a ${email}. Revisa tu bandeja de entrada.` : "Revisa tu correo y sigue el enlace de verificación para activar tu cuenta.");
      return;
    }

    let cancelled = false;
    fetch(`${API_URL}/users/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo verificar el correo.");
        if (!cancelled) {
          localStorage.removeItem("pendingVerificationEmail");
          setStatus("success");
          setMessage("Correo verificado correctamente. Ya puedes iniciar sesión.");
        }
      })
      .catch((err) => {
        if (!cancelled) { setStatus("error"); setMessage(err.message || "El enlace no es válido o expiró."); }
      });
    return () => { cancelled = true; };
  }, []);

  return <FormCard onNavigate={onNavigate}>
    <div className={styles.header}>
      <div className={styles.iconWrap}>{status === "success" ? <CheckCircle size={42} /> : <Mail size={42} />}</div>
      <h2 className={styles.title}>{status === "success" ? "Correo verificado" : status === "checking" ? "Verificando correo" : "Verifica tu cuenta"}</h2>
      <p className={styles.subtitle}>EduAudio IA</p>
    </div>
    <div className={`${styles.alert} ${status === "success" ? styles.success : status === "error" ? styles.error : styles.pending}`}>
      {status === "error" && <AlertCircle size={18} />}<span>{message}</span>
    </div>
    {status === "success" ? <button className={styles.btnPrimary} onClick={() => onNavigate("login")}>Ir a iniciar sesión</button> : <button className={styles.btnSecondary} onClick={() => onNavigate("login")}>Volver al inicio de sesión</button>}
  </FormCard>;
}
