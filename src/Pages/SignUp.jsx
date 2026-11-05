import { useState, useRef, useEffect } from "react";
import { UserPlus, Eye, EyeOff, CheckCircle, AlertCircle, X } from "lucide-react";
import FormCard from "../Components/FormCard";
import { API_URL } from "../config";
import styles from "./SignUp.module.css";

export default function SignUp({ onNavigate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState(null);

  // Estado para mostrar u ocultar la contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Ventana de Términos y Condiciones
  const [showTerms, setShowTerms] = useState(false);
  const [canAccept, setCanAccept] = useState(false);
  const termsBodyRef = useRef(null);

  // Si el texto cabe sin desplazarse (pantallas grandes), se habilita de una vez
  useEffect(() => {
    if (showTerms && termsBodyRef.current) {
      const el = termsBodyRef.current;
      if (el.scrollHeight <= el.clientHeight + 5) setCanAccept(true);
    }
  }, [showTerms]);

  function openTerms(e) {
    e.preventDefault();
    setCanAccept(false);
    setShowTerms(true);
  }

  // Al marcar el checkbox se abren los términos; el check solo queda marcado al aceptarlos
  function handleTermsCheck(e) {
    if (e.target.checked) {
      setCanAccept(false);
      setShowTerms(true);
    } else {
      setAcceptTerms(false);
    }
  }

  // Habilita "Aceptar" cuando el usuario llega al final del texto
  function handleTermsScroll(e) {
    const el = e.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
      setCanAccept(true);
    }
  }

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Ingresa un correo electrónico válido (debe contener @).");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!acceptTerms) {
      setError("Debes aceptar los Términos y Condiciones.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      onNavigate("login");
    } catch {
      setError("Error al conectar con el servidor.");
    }
  }

  function getPasswordLevel() {
    if (password.length === 0) return 0;
    if (password.length < 8) return 1; // Débil
    if (password.length <= 11) return 2; // Media
    return 3; // Fuerte (12 caracteres)
  }

  const passwordLevel = getPasswordLevel();
  const levelLabels = ["", "Débil", "Media", "Fuerte"];
  const levelClasses = ["", styles.level1, styles.level2, styles.level3];
  const textClasses = ["", styles.textLevel1, styles.textLevel2, styles.textLevel3];

  return (
    <FormCard onNavigate={onNavigate}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <UserPlus size={40} />
        </div>
        <h2 className={styles.title}>Crea tu cuenta</h2>
        <p className={styles.subtitle}>
          Únete a la comunidad de estudio inteligente
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Ingrese su nombre:</label>
        <input
          className={styles.input}
          type="text"
          data-testid="signup-name"
          placeholder="Ej: Karina Romero"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Correo Electrónico:</label>
        <input
          className={styles.input}
          type="email"
          data-testid="signup-email"
          placeholder="correo@ejemplo.com"
          maxLength={100}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Contraseña con icono de ojo */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Contraseña:</label>
        <div className={styles.passwordContainer}>
          <input
            className={styles.inputPassword}
            type={showPassword ? "text" : "password"}
            data-testid="signup-password"
            placeholder="Mínimo 8 caracteres"
            maxLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className={styles.eyeButton}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {password.length > 0 && (
          <div className={styles.strengthWrapper}>
            <div className={styles.strengthBars}>
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`${styles.strengthBar} ${
                    level <= passwordLevel ? levelClasses[passwordLevel] : ""
                  }`}
                />
              ))}
            </div>
            <span className={`${styles.strengthLabel} ${textClasses[passwordLevel]}`}>
              {levelLabels[passwordLevel]}
            </span>
          </div>
        )}
      </div>

      {/* Confirmar contraseña con icono de ojo */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Confirmar Contraseña:</label>
        <div className={styles.passwordContainer}>
          <input
            className={`${styles.inputPassword} ${
              confirmPassword.length > 0 && password !== confirmPassword
                ? styles.inputError
                : ""
            }`}
            type={showConfirmPassword ? "text" : "password"}
            data-testid="signup-confirm-password"
            placeholder="Repite tu contraseña"
            maxLength={12}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            className={styles.eyeButton}
            aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {confirmPassword.length > 0 && password !== confirmPassword && (
          <p className={styles.fieldError}>Las contraseñas no coinciden</p>
        )}
        {confirmPassword.length > 0 && password === confirmPassword && (
          <p className={styles.fieldSuccess}>
            <CheckCircle size={14} /> Las contraseñas coinciden
          </p>
        )}
      </div>

      <div className={styles.checkboxGroup}>
        <input
          type="checkbox"
          id="terms"
          data-testid="signup-terms"
          checked={acceptTerms}
          onChange={handleTermsCheck}
          className={styles.checkbox}
        />
        <label htmlFor="terms" className={styles.checkboxLabel}>
          Acepto los{" "}
          <button
            type="button"
            className={styles.termsLink}
            data-testid="signup-terms-link"
            onClick={openTerms}
          >
            Términos y Condiciones
          </button>
        </label>
      </div>

      {error && (
        <div className={styles.error} data-testid="signup-error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <button
        className={styles.btnPrimary}
        data-testid="signup-submit"
        onClick={handleRegister}
      >
        Crear cuenta
      </button>

      <p className={styles.loginLink}>
        ¿Ya tienes cuenta?{" "}
        <button className={styles.btnLink} onClick={() => onNavigate("login")}>
          Inicia sesión
        </button>
      </p>

      {/* Ventana de Términos y Condiciones */}
      {showTerms && (
        <div className={styles.modalOverlay} onClick={() => setShowTerms(false)}>
          <div
            className={styles.modal}
            data-testid="terms-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Términos y Condiciones</h3>
              <button
                type="button"
                className={styles.modalClose}
                aria-label="Cerrar"
                onClick={() => setShowTerms(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={styles.modalBody}
              ref={termsBodyRef}
              onScroll={handleTermsScroll}
              data-testid="terms-body"
            >
              <p>Última actualización: noviembre de 2026.</p>

              <h4>1. Objeto del servicio y registro</h4>
              <p>
                EduAudio IA es una herramienta web que convierte documentos PDF
                y Word en audio, ya sea resumiéndolos con inteligencia
                artificial o leyéndolos con voz sintetizada, con fines de
                estudio. Para usarla debes crear una cuenta. Eres responsable
                de la información que registras, de mantener la
                confidencialidad de tu contraseña y de la actividad realizada
                con tu cuenta. Podemos modificar, suspender o interrumpir
                funciones del servicio en cualquier momento.
              </p>

              <h4>2. Propiedad de tus documentos y licencia de uso</h4>
              <p>
                Sigues siendo el dueño de los documentos que subes. Al subir un
                archivo declaras que eres su titular o que tienes los derechos
                y permisos necesarios para usarlo, incluidos los derechos de
                autor. No reclamamos la propiedad de tus archivos ni de los
                resúmenes y audios generados a partir de ellos. Nos otorgas
                únicamente una licencia limitada, no exclusiva y gratuita para
                procesar, resumir y transformar tu documento en texto y audio
                dentro del sistema, con el único fin de prestarte el servicio.
              </p>

              <h4>3. Contenido prohibido</h4>
              <p>
                No puedes subir documentos que infrinjan derechos de autor de
                terceros (por ejemplo, libros completos protegidos), ni
                contenido pornográfico, violento, que incite al odio, difamatorio
                o contrario a las leyes de Colombia, ni archivos con virus o
                código dañino. Podemos eliminar contenido y suspender cuentas
                que incumplan estas normas.
              </p>

              <h4>4. Almacenamiento y eliminación</h4>
              <p>
                No guardamos el archivo original que subes: solo extraemos su
                texto para generar el resumen y el audio. El resumen, su texto y
                el audio se conservan en tu cuenta hasta que los elimines. Puedes
                borrar audios individuales desde "Mis Audios" y eliminar tu
                cuenta desde tu perfil, lo que borra también tus audios. Podemos
                rechazar o eliminar archivos que superen el tamaño permitido por
                el sistema.
              </p>

              <h4>5. Límites de la inteligencia artificial y uso de los audios</h4>
              <p>
                Los resúmenes, traducciones y audios los genera inteligencia
                artificial y pueden contener errores, omisiones o información
                inexacta. El servicio se ofrece "tal cual" y no nos hacemos
                responsables si un resumen omite información importante. No lo
                uses para documentos médicos, legales o financieros donde un
                error pueda causar daños, y verifica siempre con el documento
                original. Los audios están pensados para tu uso personal y de
                estudio; si quieres darles un uso comercial, debes contar con
                los derechos sobre el documento original.
              </p>

              <h4>6. Propiedad intelectual de la plataforma</h4>
              <p>
                El diseño, el código y la marca EduAudio IA pertenecen a sus
                creadores. No está permitido copiar el sistema, aplicar
                ingeniería inversa ni extraer datos de forma automática sin
                autorización.
              </p>

              <h4>7. Servicio gratuito</h4>
              <p>
                Actualmente el servicio es gratuito. Si en el futuro se
                incluyen planes de pago, se informarán con anticipación y no se
                aplicarán cobros sin tu consentimiento.
              </p>

              <h4>8. Privacidad y datos personales</h4>
              <p>
                Guardamos tu nombre, correo, foto de perfil, los textos y audios
                generados, únicamente para prestar el servicio. No vendemos tus
                datos ni usamos tus documentos para entrenar modelos propios de
                inteligencia artificial. Para funcionar, el texto de tus
                documentos se envía a proveedores externos: Google (generación
                de resúmenes con Gemini y síntesis de voz), Cloudinary
                (almacenamiento de audios) y MongoDB Atlas (base de datos).
                Estos proveedores tratan la información según sus propias
                políticas. Tus datos se tratan conforme a la Ley 1581 de 2012 de
                Colombia, y puedes solicitar la consulta, corrección o
                eliminación de tu información en cualquier momento.
              </p>

              <h4>9. Ley aplicable y cambios</h4>
              <p>
                Estos términos se rigen por las leyes de la República de
                Colombia. Podemos actualizarlos, y el uso continuado del
                servicio implica aceptar los cambios.
              </p>
            </div>

            {!canAccept && (
              <p className={styles.modalHint}>
                Desplázate hasta el final para poder aceptar.
              </p>
            )}

            <button
              type="button"
              className={styles.modalAccept}
              data-testid="terms-accept-btn"
              disabled={!canAccept}
              onClick={() => {
                setAcceptTerms(true);
                setShowTerms(false);
              }}
            >
              Aceptar y cerrar
            </button>
          </div>
        </div>
      )}
    </FormCard>
  );
            }
