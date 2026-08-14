// src/Components/Logo.jsx
import styles from "./Logo.module.css";
import logoImg from "../assets/logo.jpeg";

export default function Logo({ size = 56 }) {
  return (
    <img
      src={logoImg}
      alt="EduAudio IA"
      className={styles.logo}
      style={{ width: size, height: size }}
    />
  );
}