import { useState, useRef, useEffect } from "react";
import { UserPlus, Eye, EyeOff, CheckCircle, AlertCircle, X } from "lucide-react";
import FormCard from "../Components/FormCard";
import { API_URL } from "../config";
import styles from "./SignUp.module.css";

function isValidEmail(value) {
  const email = value.trim();
  if (email.length > 254 || /\s/.test(email)) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  const labels = domain.split(".");
  if (labels.length < 2 || labels.some((label) => !label || label.length > 63 || !/^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i.test(label))) return false;
  return /^[A-Z]{2,}$/i.test(labels[labels.length - 1]);
}

export default function SignUp({ onNavigate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [canAccept, setCanAccept] = useState(false);
  const termsBodyRef = useRef(null);

  useEffect(() => {
    if (showTerms && termsBodyRef.current) {
      const el = termsBodyRef.current;
      setCanAccept(el.scrollHeight <= el.clientHeight + 5);
    }
  }, [showTerms]);

  function openTerms(e) {
    e.preventDefault();
    setCanAccept(false);
    setShowTerms(true);
  }

  function handleTermsCheck(e) {
    if (e.target.checked) {
      setCanAccept(false);
      setShowTerms(true);
    } else setAcceptTerms(false);
  }

  function handleTermsScroll(e) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) setCanAccept(true);
  }

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Por favor completa todos los campos."); return;
    }
    if (!isValidEmail(email)) {
      setError("Ingresa un correo válido, por ejemplo nombre@dominio.com."); return;
    }
    if (password.length < 8) { setError("La contraseña debe tener mínimo 8 caracteres."); return; }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
    if (!acceptTerms) { setError("Debes aceptar los Términos y Condiciones para continuar."); return; }

    setError(null);
    try {
      const res = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "No se pudo crear la cuenta."); return; }
      onNavigate("login");
    } catch {
      setError("Error al conectar con el servidor.");
    }
  }

  const passwordLevel = !password ? 0 : password.length < 8 ? 1 : password.length <= 11 ? 2 : 3;
  const levelLabels = ["", "Débil", "Media", "Fuerte"];
  const levelClasses = ["", styles.level1, styles.level2, styles.level3];
  const textClasses = ["", styles.textLevel1, styles.textLevel2, styles.textLevel3];

  return (
    <FormCard onNavigate={onNavigate}>
      <div className={styles.header}>
        <div className={styles.headerIcon}><UserPlus size={40} /></div>
        <h2 className={styles.title}>Crea tu cuenta</h2>
        <p className={styles.subtitle}>Únete a la comunidad de estudio inteligente</p>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="signup-name">Ingrese su nombre:</label>
        <input id="signup-name" className={styles.input} type="text" data-testid="signup-name" placeholder="Ej: Karina Romero" maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="signup-email">Correo Electrónico:</label>
        <input id="signup-email" className={styles.input} type="email" data-testid="signup-email" placeholder="correo@ejemplo.com" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="signup-password">Contraseña:</label>
        <div className={styles.passwordContainer}>
          <input id="signup-password" className={styles.inputPassword} type={showPassword ? "text" : "password"} data-testid="signup-password" placeholder="Mínimo 8 caracteres" maxLength={12} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className={styles.eyeButton} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
        </div>
        {password.length > 0 && <div className={styles.strengthWrapper}><div className={styles.strengthBars}>{[1, 2, 3].map((level) => <div key={level} className={`${styles.strengthBar} ${level <= passwordLevel ? levelClasses[passwordLevel] : ""}`} />)}</div><span className={`${styles.strengthLabel} ${textClasses[passwordLevel]}`}>{levelLabels[passwordLevel]}</span></div>}
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="signup-confirm-password">Confirmar Contraseña:</label>
        <div className={styles.passwordContainer}>
          <input id="signup-confirm-password" className={`${styles.inputPassword} ${confirmPassword && password !== confirmPassword ? styles.inputError : ""}`} type={showConfirmPassword ? "text" : "password"} data-testid="signup-confirm-password" placeholder="Repite tu contraseña" maxLength={12} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button type="button" className={styles.eyeButton} aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
        </div>
        {confirmPassword && password !== confirmPassword && <p className={styles.fieldError}>Las contraseñas no coinciden</p>}
        {confirmPassword && password === confirmPassword && <p className={styles.fieldSuccess}><CheckCircle size={14} /> Las contraseñas coinciden</p>}
      </div>
      <div className={styles.checkboxGroup}>
        <input type="checkbox" id="terms" data-testid="signup-terms" checked={acceptTerms} onChange={handleTermsCheck} className={styles.checkbox} />
        <label htmlFor="terms" className={styles.checkboxLabel}>Acepto los{" "}<button type="button" className={styles.termsLink} data-testid="signup-terms-link" onClick={openTerms}>Términos y Condiciones</button></label>
      </div>
      {error && <div className={styles.error} data-testid="signup-error"><AlertCircle size={16} /> {error}</div>}
      <button className={styles.btnPrimary} data-testid="signup-submit" onClick={handleRegister}>Crear cuenta</button>
      <p className={styles.loginLink}>¿Ya tienes cuenta? <button className={styles.btnLink} onClick={() => onNavigate("login")}>Inicia sesión</button></p>

      {showTerms && <div className={styles.modalOverlay} onClick={() => setShowTerms(false)}><div className={styles.modal} data-testid="terms-modal" role="dialog" aria-modal="true" aria-labelledby="terms-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}><h3 className={styles.modalTitle} id="terms-modal-title">Términos y Condiciones de Uso de EduAudio IA</h3><button type="button" className={styles.modalClose} aria-label="Cerrar" onClick={() => setShowTerms(false)}><X size={20} /></button></div>
        <div className={styles.modalBody} ref={termsBodyRef} onScroll={handleTermsScroll} data-testid="terms-body">
          <p>Al crear una cuenta y utilizar EduAudio IA, aceptas de forma expresa y sin reservas los presentes Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, por favor abstente de utilizar la plataforma.</p>
          <h4>1. Descripción del Servicio</h4><p>EduAudio IA permite convertir archivos PDF y Word (.docx) de hasta 10 MB en resúmenes y audios con fines educativos y de estudio personal.</p>
          <h4>2. Cuentas de Usuario y Seguridad</h4><ul><li><strong>Registro:</strong> Para acceder al servicio, debes crear una cuenta.</li><li><strong>Responsabilidad:</strong> Eres responsable de mantener la confidencialidad de tu contraseña y de la actividad de tu cuenta.</li><li><strong>Notificación:</strong> Debes notificarnos de inmediato cualquier uso no autorizado.</li></ul>
          <h4>3. Propiedad Intelectual y Contenido del Usuario</h4><ul><li><strong>Tus Derechos:</strong> Conservas los derechos sobre los documentos que subas.</li><li><strong>Licencia de Uso:</strong> Garantizas que tienes los permisos necesarios y otorgas una licencia limitada, gratuita y no exclusiva para procesar, extraer texto, resumir y almacenar temporalmente el archivo con el fin de prestarte el servicio.</li><li><strong>Restricciones:</strong> No subas contenido que infrinja derechos de terceros, datos personales ajenos, contenido ilegal, difamatorio, obsceno o archivos maliciosos.</li></ul>
          <h4>4. Conservación y Eliminación de Datos</h4><ul><li>El archivo original se procesa para extraer el texto y generar resultados.</li><li>El resumen y el audio se guardan en tu cuenta. Puedes eliminar audios desde “Mis Audios”.</li><li>El tratamiento de tus datos personales se rige por la Política de Privacidad.</li></ul>
          <h4>5. Limitación de Responsabilidad y Garantías de la IA</h4><ul><li>Los resultados son para uso personal y de estudio. Para usos comerciales o públicos, debes contar con los derechos necesarios.</li><li>La IA puede producir errores u omisiones. El servicio se ofrece “tal cual”; verifica los resultados con el documento original.</li><li>EduAudio IA no se responsabiliza por fallas temporales ni decisiones tomadas basándose exclusivamente en los resultados generados.</li></ul>
          <h4>6. Gratuidad del Servicio y Modificaciones</h4><ul><li>El servicio se ofrece actualmente de forma gratuita.</li><li>Los términos pueden actualizarse. El uso continuado después de los cambios implica su aceptación.</li></ul>
          <p><strong>Última actualización:</strong> noviembre de 2026.</p>
        </div>
        {!canAccept && <p className={styles.modalHint}>Desplázate hasta el final para poder aceptar.</p>}
        <button type="button" className={styles.modalAccept} data-testid="terms-accept-btn" disabled={!canAccept} onClick={() => { setAcceptTerms(true); setShowTerms(false); }}>Aceptar y cerrar</button>
      </div></div>}
    </FormCard>
  );
}
