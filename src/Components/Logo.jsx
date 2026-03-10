import styles from "./Logo.module.css";

export default function Logo({ size = 56 }) {
  return (
    <div
      className={styles.logo}
      style={{ width: size, height: size, fontSize: size * 0.46 }}
    >
      🎧
    </div>
  );
}